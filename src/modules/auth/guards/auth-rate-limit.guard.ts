import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AUTH_CONSTANTS } from '@/modules/auth/constants';
import { RedisLockService } from '@/common/services/redis-lock.service';
import { LoggingService } from '@/common/services/logging.service';

/**
 * 精细化限流守卫
 * 基于 Redis 实现，支持 K8s 多副本部署场景下全局统一的限流
 *
 * 策略：
 * - 登录接口：基于 IP 追踪，防止暴力破解
 * - 发送验证码接口：基于 IP + 手机号组合追踪，防止短信轰炸
 *
 * Redis Key 规范（统一前缀由 RedisLockService 提供，本层追加子命名空间）：
 *   ratelimit:login:{ip}
 *   ratelimit:sms:phone:{ip}:{phone}
 *   ratelimit:sms:ip:{ip}
 *   TTL 由 WINDOW_MS 决定，Redis 自动过期，无需手动清理
 */
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly keyPrefix = 'ratelimit';
  /** 可信代理 IP 列表（从环境变量读取，支持 CIDR 格式） */
  private readonly trustedProxies: string[];

  constructor(
    private readonly redisLockService: RedisLockService,
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {
    this.trustedProxies = this.getTrustedProxiesConfig();
  }

  /**
   * 获取可信代理配置
   * 记录配置状态日志，便于排查 IP 获取问题
   */
  private getTrustedProxiesConfig(): string[] {
    const proxies = this.configService.get<string>('TRUSTED_PROXIES') || '';

    const proxyList = proxies
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (proxyList.length > 0) {
      this.loggingService.log(
        `[限流守卫] 已加载可信代理配置: ${proxyList.join(', ')}`,
      );
    } else {
      this.loggingService.warn(
        `[限流守卫] TRUSTED_PROXIES 未配置，将不信任任何代理（限流基于 socket IP）`,
      );
    }

    return proxyList;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const ip = this.getClientIp(request);

    const path = request.path;
    if (path.endsWith('/auth/login')) {
      return await this.checkLoginRateLimit(ip);
    } else if (path.endsWith('/auth/send/verificationcode')) {
      const body = request.body as Record<string, unknown> | undefined;
      const phone = typeof body?.phone === 'string' ? body.phone : undefined;
      return await this.checkSendCodeRateLimit(ip, phone);
    }

    return true;
  }

  /**
   * 检查登录接口限流
   * 限制：同一 IP 在时间窗口内最多尝试 N 次
   */
  private async checkLoginRateLimit(ip: string): Promise<boolean> {
    const { MAX_ATTEMPTS, WINDOW_MS } = AUTH_CONSTANTS.LOGIN_RATE_LIMIT;
    const key = `${this.keyPrefix}:login:${ip}`;

    const count = await this.incrementAndGet(key, WINDOW_MS);

    if (count > MAX_ATTEMPTS) {
      const ttl = await this.getTtl(key);
      const remainingSeconds =
        ttl > 0 ? Math.ceil(ttl / 1000) : Math.ceil(WINDOW_MS / 1000);
      throw new HttpException(
        `操作过于频繁，请 ${remainingSeconds} 秒后重试`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * 检查发送验证码接口限流
   * 策略 1：同一手机号 + IP 组合限制（防止轰炸单个用户）
   * 策略 2：同一 IP 整体限制（防止一个 IP 轰炸多个手机号）
   */
  private async checkSendCodeRateLimit(
    ip: string,
    phone?: string,
  ): Promise<boolean> {
    if (!phone) return true; // DTO 验证会拦截无手机号的情况

    const { MAX_ATTEMPTS, WINDOW_MS, IP_MULTIPLIER } =
      AUTH_CONSTANTS.SEND_CODE_RATE_LIMIT;

    // 策略 1：IP + 手机号组合限制
    const phoneKey = `${this.keyPrefix}:sms:phone:${ip}:${phone}`;
    const phoneCount = await this.incrementAndGet(phoneKey, WINDOW_MS);

    if (phoneCount > MAX_ATTEMPTS) {
      const ttl = await this.getTtl(phoneKey);
      const remainingSeconds =
        ttl > 0 ? Math.ceil(ttl / 1000) : Math.ceil(WINDOW_MS / 1000);
      throw new HttpException(
        `该手机号请求过于频繁，请 ${remainingSeconds} 秒后重试`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 策略 2：IP 级别整体限制
    const ipKey = `${this.keyPrefix}:sms:ip:${ip}`;
    const ipCount = await this.incrementAndGet(ipKey, WINDOW_MS);

    if (ipCount > MAX_ATTEMPTS * IP_MULTIPLIER) {
      const ttl = await this.getTtl(ipKey);
      const remainingSeconds =
        ttl > 0 ? Math.ceil(ttl / 1000) : Math.ceil(WINDOW_MS / 1000);
      throw new HttpException(
        `IP 请求过于频繁，请 ${remainingSeconds} 秒后重试`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Redis INCR + 自动设置/刷新 TTL
   * 固定窗口计数：窗口内累加，窗口到期后计数器自动归零
   */
  private async incrementAndGet(
    key: string,
    windowMs: number,
  ): Promise<number> {
    const redis = this.redisLockService.getRedisClient();
    const ttlSeconds = await redis.ttl(key);

    const count = await redis.incr(key);

    // 仅在首次写入（TTL < 0）或已过期（TTL === -1）时设置过期时间
    // TTL === -2 表示 key 不存在，incr 后也会触发 setex
    if (ttlSeconds < 0) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    return count;
  }

  /**
   * 获取 key 剩余 TTL（毫秒）
   */
  private async getTtl(key: string): Promise<number> {
    const redis = this.redisLockService.getRedisClient();
    const ttlSeconds = await redis.ttl(key);
    return ttlSeconds > 0 ? ttlSeconds * 1000 : 0;
  }

  /**
   * 从请求头提取真实 IP（安全版本）
   * 仅当请求来自可信代理时，才信任 X-Forwarded-For 头
   * 防止攻击者伪造 X-Forwarded-For 绕过限流
   */
  private getClientIp(request: Request): string {
    const socketIp = request.socket.remoteAddress || '';

    // 检查请求是否来自可信代理
    const isFromTrustedProxy = this.isTrustedProxy(socketIp);

    if (isFromTrustedProxy) {
      const forwardedFor = request.headers['x-forwarded-for'];
      if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        // 取第一个非空 IP（最左边的客户端 IP）
        return forwardedFor.split(',')[0].trim();
      }
      if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
        return forwardedFor[0].split(',')[0].trim();
      }
    }

    // 不信任代理或无 X-Forwarded-For，使用 socket IP
    return socketIp || request.ip || 'unknown';
  }

  /**
   * 检查 IP 是否来自可信代理
   * 支持 CIDR 格式（如 10.0.0.0/8）和精确匹配
   */
  private isTrustedProxy(ip: string): boolean {
    if (this.trustedProxies.length === 0) {
      return false;
    }

    // IPv6 映射的 IPv4 地址转换（::ffff:127.0.0.1 -> 127.0.0.1）
    const normalizedIp = ip.startsWith('::ffff:') ? ip.slice(7) : ip;

    return this.trustedProxies.some((proxy) => {
      // 精确匹配
      if (proxy === normalizedIp || proxy === ip) {
        return true;
      }

      // 简单 CIDR 匹配（仅支持 /8, /16, /24）
      if (proxy.includes('/')) {
        const [network, prefix] = proxy.split('/');
        const prefixNum = parseInt(prefix, 10);
        if (prefixNum === 8) {
          return normalizedIp.startsWith(
            network.split('.').slice(0, 1).join('.'),
          );
        }
        if (prefixNum === 16) {
          return normalizedIp.startsWith(
            network.split('.').slice(0, 2).join('.'),
          );
        }
        if (prefixNum === 24) {
          return normalizedIp.startsWith(
            network.split('.').slice(0, 3).join('.'),
          );
        }
      }

      return false;
    });
  }
}

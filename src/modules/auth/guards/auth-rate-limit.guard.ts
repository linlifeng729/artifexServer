import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AUTH_CONSTANTS } from '@/modules/auth/constants';
import { RedisLockService } from '@/common/services/redis-lock.service';

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

  constructor(private readonly redisLockService: RedisLockService) {}

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
  private async incrementAndGet(key: string, windowMs: number): Promise<number> {
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

  /** 从请求头提取真实 IP（支持 X-Forwarded-For 代理场景） */
  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0].split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}

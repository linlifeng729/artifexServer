import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 公开访问装饰器
 * 
 * 使用此装饰器标记的路由将跳过JWT身份验证，允许公开访问
 * 常用于登录、注册等不需要身份验证的接口
 * 
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   // 登录逻辑，无需JWT验证
 * }
 * ```
 * 
 * @returns 返回一个设置了公开访问元数据的装饰器
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
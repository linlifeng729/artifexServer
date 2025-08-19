import { SetMetadata } from '@nestjs/common';

export const ADMIN_ONLY_KEY = 'adminOnly';

/**
 * 管理员专用装饰器
 * 
 * 使用此装饰器标记的路由只允许管理员角色访问
 * 需要配合AdminOnlyGuard守卫使用
 * 
 * @example
 * ```typescript
 * @AdminOnly()
 * @Post('create')
 * async createNft(@Body() createNftDto: CreateNftDto) {
 *   // 只有管理员可以访问的创建NFT逻辑
 * }
 * ```
 * 
 * @returns 返回一个设置了管理员专用访问元数据的装饰器
 */
export const AdminOnly = () => SetMetadata(ADMIN_ONLY_KEY, true);

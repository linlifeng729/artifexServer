import { SetMetadata } from '@nestjs/common';

/**
 * 跳过响应包装的元数据 key
 */
export const SKIP_RESPONSE_WRAP_KEY = 'skipResponseWrap';

/**
 * 标记路由跳过响应包装，直接返回原始数据
 * 用于微信服务器验证等需要返回纯文本的场景
 */
export const PlainResponse = () => SetMetadata(SKIP_RESPONSE_WRAP_KEY, true);

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PayService } from './services/pay.service';
import { WechatMPService } from './services/wechat-mp.service';
import { WechatOAService } from './services/wechat-oa.service';
import { QueryPayOrderDto } from './dto/query-pay-order.dto';
import { CreatePayOrderDto } from './dto/create-pay-order.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { CurrentUser } from '@/modules/auth/decorators';
import { Public } from '@/modules/auth/decorators';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import { ResponseHelper } from '@/common/utils/response.helper';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

/**
 * 支付控制器
 */
@ApiTags('支付模块')
@Controller('api/pay')
export class PayController {
  constructor(
    private readonly payService: PayService,
    private readonly wechatMPService: WechatMPService,
    private readonly wechatOAService: WechatOAService,
  ) {}

  /**
   * 获取微信小程序 OpenId
   */
  @Public()
  @ApiOperation({ summary: '获取微信小程序 OpenId' })
  @ApiQuery({
    name: 'code',
    description: '微信授权 code',
    required: true,
    type: String,
  })
  @Get('wechatMP/openId')
  async getWechatMPOpenId(
    @Query('code') code: string,
  ): Promise<ApiResponse<{ openid: string }>> {
    const openid = await this.wechatMPService.getOpenIdByCode(code);
    return ResponseHelper.success({ openid }, '获取OpenId成功');
  }

  /**
   * 获取微信公众号 OpenId
   */
  @Public()
  @ApiOperation({ summary: '获取微信公众号 OpenId' })
  @ApiQuery({
    name: 'code',
    description: '微信授权 code',
    required: true,
    type: String,
  })
  @Get('wechatOA/openId')
  async getWechatOAOpenId(@Query('code') code: string): Promise<
    ApiResponse<{
      openid: string;
      accessToken: string;
      expiresIn: number;
      refreshToken: string;
      scope: string;
    }>
  > {
    const result = await this.wechatOAService.getOpenIdByCode(code);
    return ResponseHelper.success(result, '获取OpenId成功');
  }

  /**
   * 获取微信公众号 JS-SDK 签名
   */
  @Public()
  @ApiOperation({ summary: '获取微信公众号 JS-SDK 签名' })
  @ApiQuery({
    name: 'url',
    description: '当前网页的 URL',
    required: true,
    type: String,
  })
  @Get('wechatOA/signature')
  async getWechatOASignature(@Query('url') url: string): Promise<
    ApiResponse<{
      signature: string;
      timestamp: string;
      nonceStr: string;
      appId: string;
    }>
  > {
    const result = await this.wechatOAService.generateJsSdkSignature(url);
    return ResponseHelper.success(result, '获取签名成功');
  }

  /**
   * 验证微信公众号服务器签名
   */
  @Public()
  @ApiOperation({ summary: '验证微信公众号服务器签名' })
  @ApiQuery({
    name: 'signature',
    description: '微信加密签名',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'timestamp',
    description: '时间戳',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'nonce',
    description: '随机数',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'echostr',
    description: '加密随机字符串',
    required: true,
    type: String,
  })
  @Get('wechatOA/verify')
  async verifyWechatOASignature(
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Query('echostr') echostr: string,
  ): Promise<string> {
    const isValid = this.wechatOAService.verifyServerSignature(
      signature,
      timestamp,
      nonce,
      echostr,
    );
    return isValid ? echostr : '';
  }

  /**
   * 创建支付订单
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建支付订单' })
  @SwaggerApiResponse({ status: 201, description: '订单创建成功' })
  @Post('createOrder')
  async createOrder(
    @CurrentUser('userId') userId: number,
    @Body() createPayOrderDto: CreatePayOrderDto,
  ): Promise<ApiResponse<{ outTradeNo: string; paymentData: any }>> {
    const result = await this.payService.createPayOrder(
      userId,
      createPayOrderDto,
    );
    return ResponseHelper.success(result, '创建订单成功');
  }

  /**
   * 支付宝支付回调通知
   */
  @Public()
  @ApiOperation({ summary: '支付宝支付回调通知' })
  @SwaggerApiResponse({ status: 200, description: '处理成功' })
  @Post('notify/alipay')
  @HttpCode(HttpStatus.OK)
  async alipayNotify(
    @Body() body: any,
  ): Promise<{ code: string; msg: string }> {
    const success = await this.payService.handleAlipayNotify(body);
    if (success) {
      return { code: 'SUCCESS', msg: '处理成功' };
    } else {
      return { code: 'FAIL', msg: '处理失败' };
    }
  }

  /**
   * 微信支付回调通知
   */
  @Public()
  @ApiOperation({ summary: '微信支付回调通知' })
  @SwaggerApiResponse({ status: 200, description: '处理成功' })
  @Post('notify/wechatPay')
  @HttpCode(HttpStatus.OK)
  async wechatPayNotify(
    @Body() body: any,
  ): Promise<{ code: string; msg: string }> {
    const success = await this.payService.handleWechatPayNotify(body);
    if (success) {
      return { code: 'SUCCESS', msg: '处理成功' };
    } else {
      return { code: 'FAIL', msg: '处理失败' };
    }
  }

  /**
   * 获取用户订单列表
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取用户订单列表' })
  @Get('orders')
  async getUserOrders(
    @CurrentUser('userId') userId: number,
    @Query() queryDto: QueryPayOrderDto,
  ): Promise<
    ApiResponse<{
      list: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const result = await this.payService.getUserPayOrders(userId, queryDto);
    return ResponseHelper.success(result, '获取订单列表成功');
  }

  /**
   * 获取订单详情
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取订单详情' })
  @Get('orders/:outTradeNo')
  async getOrderDetail(
    @CurrentUser('userId') userId: number,
    @Param('outTradeNo') outTradeNo: string,
  ): Promise<ApiResponse<any>> {
    const order = await this.payService.getOrderDetail(outTradeNo, userId);
    return ResponseHelper.success(order, '获取订单详情成功');
  }
}

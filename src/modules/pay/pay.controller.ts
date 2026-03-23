import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PayService } from './services/pay.service';
import { AlipayService } from './services/alipay.service';
import { WechatPayService } from './services/wechat-pay.service';
import { WechatMPService } from './services/wechat-mp.service';
import { WechatOAService } from './services/wechat-oa.service';
import { CreatePayOrderDto } from './dto/create-pay-order.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { CurrentUser, Public } from '@/modules/auth/decorators';
import { PlainResponse } from '@/common/decorators';
import { ResponseHelper } from '@/common/utils/response.helper';
import { WechatPayNotifyDto, AlipayPayNotifyDto } from './dto/pay-notify.dto';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

/**
 * 支付控制器
 */
@ApiTags('支付模块')
@Controller('api/pay')
export class PayController {
  constructor(
    private readonly payService: PayService,
    private readonly alipayService: AlipayService,
    private readonly wechatPayService: WechatPayService,
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
  async getWechatMPOpenId(@Query('code') code: string) {
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
  async getWechatOAOpenId(@Query('code') code: string) {
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
  async getWechatOASignature(@Query('url') url: string) {
    const result = await this.wechatOAService.generateJsSdkSignature(url);
    return ResponseHelper.success(result, '获取签名成功');
  }

  /**
   * 验证微信公众号服务器签名
   * @PlainResponse 跳过响应包装，直接返回纯文本（微信服务器需要）
   */
  @Public()
  @PlainResponse()
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
  ) {
    const result = this.wechatOAService.verifyServerSignature(
      signature,
      timestamp,
      nonce,
      echostr,
    );
    return result;
  }

  /**
   * 创建支付订单
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建支付订单' })
  @ApiBody({ type: CreatePayOrderDto })
  @ApiResponse({
    status: 201,
    description: '订单创建成功',
  })
  @Post('createOrder')
  async createOrder(
    @CurrentUser('userId') userId: number,
    @Body() createPayOrderDto: CreatePayOrderDto,
  ) {
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
  @ApiBody({ type: AlipayPayNotifyDto })
  @ApiResponse({
    status: 200,
    description: '处理成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'SUCCESS', description: '状态码' },
        msg: { type: 'string', example: '处理成功', description: '消息' },
      },
    },
  })
  @Post('notify/alipay')
  @HttpCode(HttpStatus.OK)
  async alipayNotify(
    @Body() body: AlipayPayNotifyDto,
  ): Promise<{ code: string; msg: string }> {
    const success = await this.alipayService.handleAlipayNotify(body);
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
  @ApiBody({ type: WechatPayNotifyDto })
  @ApiResponse({
    status: 200,
    description: '处理成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'SUCCESS', description: '状态码' },
        msg: { type: 'string', example: '处理成功', description: '消息' },
      },
    },
  })
  @Post('notify/wechatPay')
  @HttpCode(HttpStatus.OK)
  async wechatPayNotify(
    @Body() body: WechatPayNotifyDto,
  ): Promise<{ code: string; msg: string }> {
    const success = await this.wechatPayService.handleWechatPayNotify(body);
    if (success) {
      return { code: 'SUCCESS', msg: '处理成功' };
    } else {
      return { code: 'FAIL', msg: '处理失败' };
    }
  }
}

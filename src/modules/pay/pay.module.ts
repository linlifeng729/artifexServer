import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PayOrder } from '@/modules/pay/entities/pay-order.entity';
import { PayDelivery } from '@/modules/pay/entities/pay-delivery.entity';
import { PayController } from '@/modules/pay/pay.controller';
import { PayService } from '@/modules/pay/services/pay.service';
import { AlipayService } from '@/modules/pay/services/alipay.service';
import { WechatPayService } from '@/modules/pay/services/wechat-pay.service';
import { WechatMPService } from '@/modules/pay/services/wechat-mp.service';
import { WechatOAService } from '@/modules/pay/services/wechat-oa.service';
import { LoggingService } from '@/common/services/logging.service';
import { DistributedLockService } from '@/common/services/distributed-lock.service';
import { AuthModule } from '@/modules/auth/auth.module';

/**
 * 支付模块
 * 集成支付宝、微信支付、小程序支付、公众号支付等功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PayOrder, PayDelivery]),
    HttpModule,
    AuthModule,
  ],
  controllers: [PayController],
  providers: [
    PayService,
    AlipayService,
    WechatPayService,
    WechatMPService,
    WechatOAService,
    LoggingService,
    DistributedLockService,
  ],
  exports: [
    PayService,
    AlipayService,
    WechatPayService,
    WechatMPService,
    WechatOAService,
  ],
})
export class PayModule {}

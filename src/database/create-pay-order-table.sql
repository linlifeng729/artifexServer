-- 支付订单表
CREATE TABLE `pay_order` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '支付订单ID',
  `out_trade_no` varchar(64) NOT NULL COMMENT '商户订单号（外部订单号）',
  `amount` int NOT NULL COMMENT '订单金额（单位：分）',
  `user_id` int NOT NULL COMMENT '用户ID',
  `goods_id` int NOT NULL COMMENT '商品ID',
  `goods_type` varchar(20) NOT NULL COMMENT '商品类型：book-电子书',
  `trade_state` varchar(20) DEFAULT NULL COMMENT '交易状态：TRADE_SUCCESS-支付成功，WAIT_BUYER_PAY-等待支付，TRADE_CLOSED-交易关闭，TRADE_REFUND-已退款',
  `success_time` varchar(64) DEFAULT NULL COMMENT '支付成功时间',
  `transaction_id` varchar(64) DEFAULT NULL COMMENT '支付平台交易号',
  `pay_channel` varchar(20) NOT NULL COMMENT '支付渠道：alipay-支付宝，wechat_pay-微信支付，wechat_mp-小程序支付，wechat_oa-公众号支付',
  `app_id` varchar(32) DEFAULT NULL COMMENT '应用ID（支付宝/微信）',
  `description` varchar(255) DEFAULT NULL COMMENT '订单描述/商品名称',
  `callback_url` varchar(255) DEFAULT NULL COMMENT '支付完成后跳转的页面URL',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_out_trade_no` (`out_trade_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_goods` (`goods_id`, `goods_type`),
  KEY `idx_trade_state` (`trade_state`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付订单表';

-- 支付发货记录表（用于记录发货状态，防止重复发货）
CREATE TABLE `pay_delivery` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '发货记录ID',
  `order_id` varchar(64) NOT NULL COMMENT '商户订单号',
  `user_id` int NOT NULL COMMENT '用户ID',
  `goods_id` int NOT NULL COMMENT '商品ID',
  `goods_type` varchar(20) NOT NULL COMMENT '商品类型：book-电子书',
  `delivery_status` tinyint DEFAULT 0 COMMENT '发货状态：0-未发货，1-已发货，2-发货失败',
  `delivery_time` timestamp DEFAULT NULL COMMENT '发货时间',
  `delivery_message` varchar(255) DEFAULT NULL COMMENT '发货结果信息',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  KEY `idx_user_goods` (`user_id`, `goods_type`),
  KEY `idx_delivery_status` (`delivery_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付发货记录表';

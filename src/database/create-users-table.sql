-- 如果表已存在则删除
DROP TABLE IF EXISTS `users`;

-- 创建用户表
CREATE TABLE `users` (
  `userId` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `id` varchar(36) NOT NULL COMMENT '用户UUID',
  `phone` varchar(255) NOT NULL COMMENT '加密的手机号',
  `phoneHash` varchar(64) NOT NULL COMMENT '手机号哈希值',
  `nickname` varchar(50) DEFAULT NULL COMMENT '用户昵称',
  `verificationCode` varchar(10) DEFAULT NULL COMMENT '验证码',
  `verificationCodeExpiredAt` timestamp NULL DEFAULT NULL COMMENT '验证码过期时间',
  `lastCodeSentAt` timestamp NULL DEFAULT NULL COMMENT '上次发送验证码时间',
  `role` enum('user','admin') NOT NULL DEFAULT 'user' COMMENT '用户、管理员',
  `isActive` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1、激活，0、禁用',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`userId`),
  UNIQUE KEY `UK_id` (`id`),
  UNIQUE KEY `UK_phoneHash` (`phoneHash`),
  KEY `IDX_users_role` (`role`),
  KEY `IDX_users_isActive` (`isActive`),
  KEY `IDX_users_verificationCode` (`verificationCode`)
) ENGINE=InnoDB AUTO_INCREMENT=10000000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
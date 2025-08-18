-- 如果表已存在则删除
DROP TABLE IF EXISTS `users`;

-- 创建用户表
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `phone` varchar(255) NOT NULL COMMENT '加密的手机号',
  `phoneHash` varchar(64) NOT NULL COMMENT '手机号哈希值',
  `nickname` varchar(20) DEFAULT NULL COMMENT '用户昵称',
  `role` enum('user','admin') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `isActive` tinyint(1) NOT NULL DEFAULT true COMMENT '是否激活',
  `verificationCode` varchar(10) DEFAULT NULL COMMENT '验证码',
  `verificationCodeExpiredAt` timestamp NULL DEFAULT NULL COMMENT '验证码过期时间',
  `lastCodeSentAt` timestamp NULL DEFAULT NULL COMMENT '上次发送验证码时间',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_phoneHash` (`phoneHash`),
  KEY `IDX_users_role` (`role`),
  KEY `IDX_users_isActive` (`isActive`),
  KEY `IDX_users_verificationCode` (`verificationCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
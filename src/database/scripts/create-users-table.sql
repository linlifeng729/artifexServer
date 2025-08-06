-- Active: 1754383262789@@113.45.133.164@3306@artifex
-- ================================
-- 用户表创建脚本
-- ================================

-- 如果表已存在则删除
DROP TABLE IF EXISTS `users`;

-- 创建用户表
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `phone` varchar(255) NOT NULL COMMENT '加密的手机号',
  `phoneHash` varchar(64) NOT NULL COMMENT '手机号哈希值',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `nickname` varchar(20) DEFAULT NULL COMMENT '用户昵称',
  `role` enum('user','admin') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `isActive` tinyint(1) NOT NULL DEFAULT true COMMENT '是否激活',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_phoneHash` (`phoneHash`),
  KEY `IDX_users_role` (`role`),
  KEY `IDX_users_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ================================
-- 插入初始用户数据
-- ================================

-- 插入管理员用户
-- 原始手机号: 13700000000, 密码: admin123
INSERT IGNORE INTO `users` (`phone`, `phoneHash`, `password`, `nickname`, `role`) VALUES
('cb3712b7bc31eeba8f494b8218cc6594', '9f5153c782ce719c50528ad292c989bac76af1f7a0fa211b28e60b53e1eb65d0', '$2b$12$hewfKDJ.ePQlstn.wswV.u4/P0t7bmkXsBnKfVtwm8eqwGYYANPPi', '管理员', 'admin');

-- 插入普通用户
-- 原始手机号: 13700000001, 密码: user123
INSERT IGNORE INTO `users` (`phone`, `phoneHash`, `password`, `nickname`, `role`) VALUES
('69177d5075c1893a341727492d41450e', '32cdc4fa1738d72efde03bc85f4d23abe35b0e5772e1e87016f05a0063662488', '$2b$12$OHLOwNUNxVvwTaU5I81gau0U0An9cJZoHJ1kB6AzFkiQ4nnpnjkcK', '普通用户', 'user');

-- ================================
-- 使用说明
-- ================================
-- 1. 执行此 SQL 文件会重新创建 users 表并插入初始数据
-- 2. 默认账号密码：
--    - 管理员: 13700000000 / admin123
--    - 普通用户: 13700000001 / user123  
-- 3. 安全特性：
--    - 所有密码使用 bcrypt 加密，saltRounds=12
--    - 手机号使用 AES-256-CBC 加密存储
--    - phoneHash 字段存储手机号哈希值用于快速查询和唯一性约束
-- 4. 用户角色：admin-管理员，user-普通用户

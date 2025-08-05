-- Active: 1754383262789@@113.45.133.164@3306@artifex
-- ================================
-- 用户表创建脚本
-- ================================

-- 如果表已存在则删除
DROP TABLE IF EXISTS `users`;

-- 创建用户表
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `phone` varchar(11) NOT NULL COMMENT '手机号',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `nickname` varchar(50) DEFAULT NULL COMMENT '用户昵称',
  `role` enum('user','admin') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `isActive` tinyint(1) NOT NULL DEFAULT true COMMENT '是否激活',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_phone` (`phone`),
  KEY `IDX_users_role` (`role`),
  KEY `IDX_users_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ================================
-- 插入初始用户数据
-- ================================

-- 插入管理员用户
-- 密码: admin123
INSERT IGNORE INTO `users` (`phone`, `password`, `nickname`, `role`) VALUES
('13700000000', '$2b$12$hewfKDJ.ePQlstn.wswV.u4/P0t7bmkXsBnKfVtwm8eqwGYYANPPi', '管理员', 'admin');

-- 插入普通用户
-- 密码: user123
INSERT IGNORE INTO `users` (`phone`, `password`, `nickname`, `role`) VALUES
('13700000001', '$2b$12$OHLOwNUNxVvwTaU5I81gau0U0An9cJZoHJ1kB6AzFkiQ4nnpnjkcK', '普通用户', 'user');

-- ================================
-- 使用说明
-- ================================
-- 1. 执行此 SQL 文件会重新创建 users 表并插入初始数据
-- 2. 默认账号密码：
--    - 管理员: 13700000000 / admin123
--    - 普通用户: 13700000001 / user123  
-- 3. 所有密码均使用 bcrypt 加密，saltRounds=12
-- 4. 用户角色：admin-管理员，user-普通用户

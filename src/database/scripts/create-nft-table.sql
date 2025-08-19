-- 如果表已存在则删除
DROP TABLE IF EXISTS `nft`;

-- 创建NFT表
CREATE TABLE `nft` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'NFT ID',
  `name` varchar(100) NOT NULL COMMENT 'NFT名称',
  `image` varchar(500) NOT NULL COMMENT 'NFT图片URL',
  `type` varchar(100) NOT NULL COMMENT 'NFT类型',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active' COMMENT 'NFT状态',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `IDX_nft_name` (`name`),
  KEY `IDX_nft_type` (`type`),
  KEY `IDX_nft_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFT表';
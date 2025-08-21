-- 如果表已存在则删除
DROP TABLE IF EXISTS `nft_instance`;

-- 创建NFT实例表（具体的在售NFT）
CREATE TABLE `nft_instance` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'NFT实例ID',
  `nftId` int NOT NULL COMMENT '关联的NFT类型ID',
  `ownerId` int DEFAULT NULL COMMENT '拥有者用户ID',
  `price` int NOT NULL DEFAULT 0 COMMENT '当前价格（分）',
  `status` enum('available','sold','reserved') NOT NULL DEFAULT 'available' COMMENT '可售、已售、预留',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `IDX_nft_instance_nftId` (`nftId`),
  KEY `IDX_nft_instance_ownerId` (`ownerId`),
  KEY `IDX_nft_instance_status` (`status`),
  KEY `IDX_nft_instance_price` (`price`),
  KEY `IDX_nft_instance_createdAt` (`createdAt`),
  CONSTRAINT `FK_nft_instance_nftId` FOREIGN KEY (`nftId`) REFERENCES `nft` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_nft_instance_ownerId` FOREIGN KEY (`ownerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFT实例表';
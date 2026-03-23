-- 分布式锁表
CREATE TABLE `distributed_locks` (
  `lock_key` VARCHAR(255) NOT NULL COMMENT '锁的键',
  `owner_id` VARCHAR(255) NOT NULL COMMENT '锁持有者ID',
  `expire_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`lock_key`),
  INDEX `idx_expire_at` (`expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分布式锁记录表';

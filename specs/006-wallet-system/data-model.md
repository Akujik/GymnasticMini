# 数据模型： 006-wallet-system (RuoYi架构版)

**功能分支**: `006-wallet-system`
**创建时间**: 2025-11-03
**更新时间**: 2025-11-17 (v2.0.0 RuoYi架构重构)
**状态**: Ready for Implementation
**MVP**: 6
**依赖关系**: MVP-1 (001-user-identity-system), MVP-5 (005-payment-integration)

## RuoYi-MyBatis-Plus数据库架构设计

### 技术架构说明
**ORM框架**: MyBatis-Plus 3.5.x
**数据库**: MySQL 8.0+
**缓存**: Redis 7.0+ (Spring Cache + Redis)
**审计**: RuoYi标准审计字段
**事务**: Spring Boot @Transactional

---

## 1. gym_wallet 表 - 钱包主表 (基于RuoYi扩展)

每个用户仅有一个钱包，余额不允许为负数（零透支机制）。

```sql
CREATE TABLE `gym_wallet` (
  `wallet_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` BIGINT NOT NULL COMMENT '所属用户ID',
  `balance` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '钱包余额（仅允许非负数）',
  `credit_limit` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '信用额度（固定0，禁止透支）',
  `total_recharged` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计充值金额',
  `total_spent` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计消费金额',
  `status` CHAR(1) DEFAULT '0' COMMENT '钱包状态（0正常 1冻结 2删除）',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',
  `version` INT DEFAULT 0 COMMENT '乐观锁版本号',

  UNIQUE KEY `uk_user_wallet` (`user_id`),
  INDEX `idx_balance` (`balance`),
  INDEX `idx_status` (`status`),
  INDEX `idx_create_time` (`create_time`),

  FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包主表（基于RuoYi扩展）';
```

**字段说明**:
- `balance`: 当前余额，仅允许非负数（零透支机制）
- `credit_limit`: 信用额度，固定为0，禁止透支（根据Q7,Q12更新）
- `total_recharged`/`total_spent`: 统计字段，不计入退款金额（根据Q14更新）
- `version`: MyBatis-Plus乐观锁版本号
- 遵循RuoYi标准审计字段设计

---

## 2. gym_wallet_transaction 表 - 钱包交易记录表

记录所有钱包资金变动，包括充值、扣费、调整等。

```sql
CREATE TABLE `gym_wallet_transaction` (
  `transaction_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '交易ID',
  `wallet_id` BIGINT NOT NULL COMMENT '钱包ID',
  `type` ENUM('recharge', 'consume', 'refund', 'adjustment') NOT NULL COMMENT '交易类型',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '交易金额',
  `balance_before` DECIMAL(10,2) NOT NULL COMMENT '交易前余额',
  `balance_after` DECIMAL(10,2) NOT NULL COMMENT '交易后余额',
  `reference_id` BIGINT COMMENT '关联ID（预约/调整等）',
  `reference_type` VARCHAR(50) COMMENT '关联类型',
  `payment_method` VARCHAR(50) COMMENT '支付方式',
  `external_order_no` VARCHAR(100) COMMENT '外部订单号',
  `notes` TEXT COMMENT '备注',
  `admin_id` BIGINT COMMENT '操作管理员ID',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',

  INDEX `idx_wallet_id` (`wallet_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_reference` (`reference_type`, `reference_id`),
  INDEX `idx_create_time` (`create_time`),

  FOREIGN KEY (`wallet_id`) REFERENCES `gym_wallet`(`wallet_id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `sys_user`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包交易记录表';
```

**字段说明**:
- `type`: 交易类型（充值/消费/退款/调整）
- `balance_before`/`balance_after`: 交易前后余额，确保数据完整性
- `reference_type`/`reference_id`: 关联业务数据，支持解耦架构
- `admin_id`: 记录运营调整操作人（RuoYi用户ID）
- 遵循RuoYi标准字段命名和审计要求

---

## 3. gym_wallet_adjustment 表 - 钱包调整记录表

记录运营人员的手动余额调整操作，确保审计完整性。

```sql
CREATE TABLE `gym_wallet_adjustment` (
  `adjustment_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '调整ID',
  `wallet_id` BIGINT NOT NULL COMMENT '钱包ID',
  `adjustment_type` ENUM('increase', 'decrease') NOT NULL COMMENT '调整类型',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '调整金额（正数）',
  `reason` VARCHAR(200) NOT NULL COMMENT '调整原因（必填）',
  `payment_method` ENUM('wechat', 'alipay', 'bank', 'cash') NOT NULL COMMENT '收款方式',
  `external_order_no` VARCHAR(100) COMMENT '外部订单号',
  `notes` TEXT COMMENT '操作备注',
  `admin_id` BIGINT NOT NULL COMMENT '操作管理员ID',
  `transaction_id` BIGINT COMMENT '关联交易ID',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',

  INDEX `idx_wallet_id` (`wallet_id`),
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_create_time` (`create_time`),
  INDEX `idx_payment_method` (`payment_method`),

  FOREIGN KEY (`wallet_id`) REFERENCES `gym_wallet`(`wallet_id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `sys_user`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`transaction_id`) REFERENCES `gym_wallet_transaction`(`transaction_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包调整记录表';
```

**字段说明**:
- `adjustment_type`: 调整方向（增加/减少）
- `reason`: 必填字段，记录调整原因
- `payment_method`: 必填字段，记录实际收款方式
- `admin_id`: RuoYi管理员用户ID，支持权限控制
- 遵循RuoYi完整审计日志规范

---

## 4. gym_balance_notification 表 - 余额通知记录表

记录余额预警和提醒通知的发送情况，支持微信服务通知。

```sql
CREATE TABLE `gym_balance_notification` (
  `notification_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '通知ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `wallet_id` BIGINT NOT NULL COMMENT '钱包ID',
  `notification_type` ENUM('low_balance', 'insufficient', 'reminder') NOT NULL COMMENT '通知类型',
  `threshold_amount` DECIMAL(10,2) COMMENT '触发阈值',
  `current_balance` DECIMAL(10,2) NOT NULL COMMENT '当前余额',
  `message_content` TEXT NOT NULL COMMENT '通知内容',
  `wechat_template_id` VARCHAR(100) COMMENT '微信模板ID',
  `wechat_openid` VARCHAR(128) COMMENT '微信OpenID',
  `status` CHAR(1) DEFAULT '0' COMMENT '状态（0待发送 1已发送 2发送失败）',
  `sent_time` DATETIME COMMENT '发送时间',
  `retry_count` INT DEFAULT 0 COMMENT '重试次数',
  `error_message` TEXT COMMENT '错误信息',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',

  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_wallet_id` (`wallet_id`),
  INDEX `idx_type` (`notification_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_create_time` (`create_time`),

  FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`wallet_id`) REFERENCES `gym_wallet`(`wallet_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='余额通知记录表';
```

**字段说明**:
- `notification_type`: 通知类型（余额不足/预警/提醒）
- `wechat_template_id`: 微信服务通知模板ID
- `retry_count`: 支持失败重试机制
- 遵循RuoYi审计日志规范

---

## MyBatis-Plus实体类设计

### 1. GymWallet.java
```java
package com.ruoyi.project.gymnastics.wallet.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.ruoyi.framework.aspectj.lang.annotation.Excel;
import com.ruoyi.framework.web.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 钱包对象 gym_wallet
 *
 * @author ruoyi
 * @date 2025-11-17
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("gym_wallet")
@Accessors(chain = true)
public class GymWallet extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 钱包ID */
    @TableId(value = "wallet_id", type = IdType.AUTO)
    private Long walletId;

    /** 所属用户ID */
    @Excel(name = "所属用户ID")
    @TableField("user_id")
    private Long userId;

    /** 钱包余额（仅允许非负数） */
    @Excel(name = "钱包余额")
    @TableField("balance")
    private BigDecimal balance;

    /** 信用额度（固定0，禁止透支） */
    @Excel(name = "信用额度")
    @TableField("credit_limit")
    private BigDecimal creditLimit;

    /** 累计充值金额 */
    @Excel(name = "累计充值金额")
    @TableField("total_recharged")
    private BigDecimal totalRecharged;

    /** 累计消费金额 */
    @Excel(name = "累计消费金额")
    @TableField("total_spent")
    private BigDecimal totalSpent;

    /** 钱包状态（0正常 1冻结 2删除） */
    @Excel(name = "钱包状态", readConverterExp = "0=正常,1=冻结,2=删除")
    @TableField("status")
    private String status;

    /** 乐观锁版本号 */
    @Version
    @TableField("version")
    private Integer version;
}
```

### 2. GymWalletTransaction.java
```java
package com.ruoyi.project.gymnastics.wallet.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.ruoyi.framework.aspectj.lang.annotation.Excel;
import com.ruoyi.framework.web.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 钱包交易记录对象 gym_wallet_transaction
 *
 * @author ruoyi
 * @date 2025-11-17
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("gym_wallet_transaction")
@Accessors(chain = true)
public class GymWalletTransaction extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 交易ID */
    @TableId(value = "transaction_id", type = IdType.AUTO)
    private Long transactionId;

    /** 钱包ID */
    @Excel(name = "钱包ID")
    @TableField("wallet_id")
    private Long walletId;

    /** 交易类型 */
    @Excel(name = "交易类型", readConverterExp = "recharge=充值,consume=消费,refund=退款,adjustment=调整")
    @TableField("type")
    private String type;

    /** 交易金额 */
    @Excel(name = "交易金额")
    @TableField("amount")
    private BigDecimal amount;

    /** 交易前余额 */
    @Excel(name = "交易前余额")
    @TableField("balance_before")
    private BigDecimal balanceBefore;

    /** 交易后余额 */
    @Excel(name = "交易后余额")
    @TableField("balance_after")
    private BigDecimal balanceAfter;

    /** 关联ID */
    @Excel(name = "关联ID")
    @TableField("reference_id")
    private Long referenceId;

    /** 关联类型 */
    @Excel(name = "关联类型")
    @TableField("reference_type")
    private String referenceType;

    /** 支付方式 */
    @Excel(name = "支付方式")
    @TableField("payment_method")
    private String paymentMethod;

    /** 外部订单号 */
    @Excel(name = "外部订单号")
    @TableField("external_order_no")
    private String externalOrderNo;

    /** 备注 */
    @Excel(name = "备注")
    @TableField("notes")
    private String notes;

    /** 操作管理员ID */
    @Excel(name = "操作管理员ID")
    @TableField("admin_id")
    private Long adminId;
}
```

---

## MyBatis-Plus Mapper接口设计

### 1. GymWalletMapper.java
```java
package com.ruoyi.project.gymnastics.wallet.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ruoyi.project.gymnastics.wallet.domain.GymWallet;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 钱包Mapper接口
 *
 * @author ruoyi
 * @date 2025-11-17
 */
@Mapper
public interface GymWalletMapper extends BaseMapper<GymWallet> {

    /**
     * 查询钱包（悲观锁）
     *
     * @param walletId 钱包ID
     * @return 钱包
     */
    @Select("SELECT * FROM gym_wallet WHERE wallet_id = #{walletId} FOR UPDATE")
    GymWallet selectForUpdate(@Param("walletId") Long walletId);

    /**
     * 根据用户ID查询钱包
     *
     * @param userId 用户ID
     * @return 钱包
     */
    @Select("SELECT * FROM gym_wallet WHERE user_id = #{userId} AND status = '0'")
    GymWallet selectByUserId(@Param("userId") Long userId);
}
```

### 2. GymWalletTransactionMapper.java
```java
package com.ruoyi.project.gymnastics.wallet.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ruoyi.project.gymnastics.wallet.domain.GymWalletTransaction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.util.List;

/**
 * 钱包交易记录Mapper接口
 *
 * @author ruoyi
 * @date 2025-11-17
 */
@Mapper
public interface GymWalletTransactionMapper extends BaseMapper<GymWalletTransaction> {

    /**
     * 查询用户交易记录
     *
     * @param userId 用户ID
     * @return 交易记录列表
     */
    @Select("SELECT t.* FROM gym_wallet_transaction t " +
            "LEFT JOIN gym_wallet w ON t.wallet_id = w.wallet_id " +
            "WHERE w.user_id = #{userId} ORDER BY t.create_time DESC")
    List<GymWalletTransaction> selectByUserId(@Param("userId") Long userId);

    /**
     * 统计累计充值金额（排除退款）
     *
     * @param walletId 钱包ID
     * @return 累计充值金额
     */
    @Select("SELECT COALESCE(SUM(amount), 0) FROM gym_wallet_transaction " +
            "WHERE wallet_id = #{walletId} AND type = 'recharge'")
    BigDecimal selectTotalRecharged(@Param("walletId") Long walletId);

    /**
     * 统计累计消费金额（排除退款）
     *
     * @param walletId 钱包ID
     * @return 累计消费金额
     */
    @Select("SELECT COALESCE(SUM(ABS(amount)), 0) FROM gym_wallet_transaction " +
            "WHERE wallet_id = #{walletId} AND type = 'consume'")
    BigDecimal selectTotalSpent(@Param("walletId") Long walletId);
}
```

---

## 实体关系图

### RuoYi架构关系图
```
sys_user (RuoYi用户表)
    |
    | 1:1 关系
    v
gym_wallet (钱包主表)
    |
    | 1:N 关系
    v
gym_wallet_transaction (交易记录表)

gym_wallet (钱包主表)
    |
    | 1:N 关系
    v
gym_wallet_adjustment (调整记录表)

gym_wallet (钱包主表)
    |
    | 1:N 关系
    v
gym_balance_notification (通知记录表)
```

### 关键关系说明

1. **用户到钱包**: 一对一关系
   - 每个sys_user只有一个gym_wallet
   - 使用uk_user_wallet唯一索引确保唯一性
   - 遵循RuoYi用户体系设计

2. **钱包到交易**: 一对多关系
   - 每个钱包有多笔交易记录
   - 每笔交易记录属于一个钱包
   - 使用MyBatis-Plus级联查询

3. **钱包到调整**: 一对多关系
   - 运营调整记录独立存储
   - 每笔调整产生一笔交易记录
   - 支持RuoYi操作审计

4. **钱包到通知**: 一对多关系
   - 余额通知独立记录
   - 支持重试机制
   - 集成微信服务通知

---

## 数据验证规则

### MyBatis-Plus验证规则
```java
@Data
public class GymWallet extends BaseEntity {

    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @DecimalMin(value = "0.00", message = "余额不能为负数")
    @Digits(integer = 8, fraction = 2, message = "余额格式不正确")
    private BigDecimal balance;

    @DecimalMin(value = "0.00", message = "信用额度不能为负数")
    @Digits(integer = 8, fraction = 2, message = "信用额度格式不正确")
    private BigDecimal creditLimit;
}
```

### 业务验证规则
- **余额精度**: DECIMAL(10,2)精确到分
- **余额非负**: balance >= 0（零透支机制）
- **唯一性**: 每个用户只能有一个钱包
- **事务完整性**: balance_after = balance_before + amount
- **乐观锁**: 使用version字段防止并发更新冲突

---

## Redis缓存策略

### 缓存Key设计
```java
public class GymWalletCacheKeys {

    /** 钱包余额缓存 */
    public static final String WALLET_BALANCE = "wallet:balance:";

    /** 钱包详情缓存 */
    public static final String WALLET_DETAIL = "wallet:detail:";

    /** 用户钱包ID缓存 */
    public static final String USER_WALLET_ID = "user:wallet:id:";

    /** 余额预警限流 */
    public static final String BALANCE_ALERT_LIMIT = "wallet:alert:limit:";
}
```

### Spring Cache配置
```java
@Service
public class GymWalletServiceImpl implements IGymWalletService {

    /**
     * 缓存钱包余额
     */
    @Cacheable(value = "walletBalance", key = "#userId")
    public BigDecimal getWalletBalance(Long userId) {
        GymWallet wallet = walletMapper.selectByUserId(userId);
        return wallet != null ? wallet.getBalance() : BigDecimal.ZERO;
    }

    /**
     * 清除钱包缓存
     */
    @CacheEvict(value = {"walletBalance", "walletDetail"}, key = "#userId")
    public void clearWalletCache(Long userId) {
        // 缓存清除逻辑
    }
}
```

---

## 性能优化策略

### 1. 索引设计
```sql
-- 核心查询索引
CREATE INDEX idx_wallet_user_id ON gym_wallet(user_id);
CREATE INDEX idx_transaction_wallet_time ON gym_wallet_transaction(wallet_id, create_time);
CREATE INDEX idx_adjustment_admin_time ON gym_wallet_adjustment(admin_id, create_time);

-- 复合索引
CREATE INDEX idx_wallet_balance_status ON gym_wallet(balance, status);
CREATE INDEX idx_transaction_type_amount ON gym_wallet_transaction(type, amount);
```

### 2. 分页查询优化
```java
@Service
public class GymWalletTransactionServiceImpl implements IGymWalletTransactionService {

    /**
     * 分页查询交易记录（优化版本）
     */
    public TableDataInfo selectTransactionPage(GymWalletTransaction transaction) {
        startPage();
        LambdaQueryWrapper<GymWalletTransaction> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(transaction.getWalletId() != null, GymWalletTransaction::getWalletId, transaction.getWalletId())
               .eq(StringUtils.isNotEmpty(transaction.getType()), GymWalletTransaction::getType, transaction.getType())
               .orderByDesc(GymWalletTransaction::getCreateTime);

        List<GymWalletTransaction> list = transactionMapper.selectList(wrapper);
        return getDataTable(list);
    }
}
```

---

## 数据迁移考虑

### MyBatis-Plus迁移脚本
```sql
-- 1. 创建RuoYi标准钱包表
CREATE TABLE `gym_wallet` (
    -- 表结构如上文设计
);

-- 2. 为现有用户创建钱包
INSERT INTO gym_wallet (user_id, balance, credit_limit, status, create_time, create_by)
SELECT user_id, 0.00, 0.00, '0', NOW(), 'system'
FROM sys_user
WHERE user_id NOT IN (SELECT user_id FROM gym_wallet);

-- 3. 创建索引
CREATE INDEX idx_wallet_user_id ON gym_wallet(user_id);
CREATE INDEX idx_wallet_balance ON gym_wallet(balance);
```

### 回滚策略
```sql
-- 回滚脚本
DROP TABLE IF EXISTS gym_wallet_balance_notification;
DROP TABLE IF EXISTS gym_wallet_adjustment;
DROP TABLE IF EXISTS gym_wallet_transaction;
DROP TABLE IF EXISTS gym_wallet;
```

---

## 监控和维护

### RuoYi监控指标
```java
@Component
public class GymWalletMetrics {

    /**
     * 钱包总余额监控
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void monitorTotalBalance() {
        // 监控所有钱包总余额
    }

    /**
     * 异常交易监控
     */
    @Scheduled(cron = "0 */30 * * * ?")
    public void monitorAbnormalTransactions() {
        // 监控异常交易行为
    }
}
```

### 审计日志
```java
@RestController
public class GymWalletAdjustmentController extends BaseController {

    @PostMapping
    @PreAuthorize("@ss.hasPermission('gym:wallet:adjustment')")
    @Log(title = "钱包余额调整", businessType = BusinessType.UPDATE)
    public AjaxResult add(@Validated @RequestBody GymWalletAdjustment adjustment) {
        // 自动记录操作审计日志
        return toAjax(adjustmentService.insertGymWalletAdjustment(adjustment));
    }
}
```

---

这个数据模型设计完全基于RuoYi-Vue-Pro架构，确保：
1. **标准化**: 遵循RuoYi的命名规范和审计要求
2. **安全性**: 集成RuoYi的权限控制和操作审计
3. **性能**: 优化的索引设计和Redis缓存策略
4. **完整性**: 完整的实体关系和数据验证
5. **可维护性**: 清晰的代码结构和监控机制
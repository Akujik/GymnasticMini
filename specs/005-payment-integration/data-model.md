# 数据模型：支付集成系统

**功能**: 005-payment-integration
**创建时间**: 2025-11-03
**版本**: v2.0.0 RuoYi架构重构
**重构日期**: 2025-11-17
**技术栈**: RuoYi-Vue-Pro + MyBatis-Plus + Redis + 微信支付

## RuoYi-MyBatis-Plus 数据模型设计

### 概述

支付集成系统的数据模型采用RuoYi-Vue-Pro架构设计，基于MyBatis-Plus实现4表设计，实现体验课支付、座位预留、微信支付集成的完整业务流程。系统严格遵循固定价格200元、安全支付处理、成功付款后立即座位预留的要求。

**RuoYi架构特性**：
- **MyBatis-Plus集成**: 使用LambdaQueryWrapper进行支付查询优化
- **Redis缓存**: Spring Cache + @Cacheable注解优化支付性能
- **乐观锁机制**: @Version字段防止支付并发冲突
- **审计功能**: BaseEntity提供创建时间、更新时间等审计字段
- **数据权限**: 基于RuoYi的权限控制系统
- **微信支付集成**: 微信支付Java SDK + RuoYi签名验证

### 1. gym_payment_order 表

基于RuoYi-Vue-Pro架构的支付订单表，存储体验课支付订单信息。

```sql
CREATE TABLE `gym_payment_order` (
  `payment_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '支付订单ID',
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `profile_id` BIGINT(20) NOT NULL COMMENT '学员档案ID',
  `course_schedule_id` BIGINT(20) NOT NULL COMMENT '课程安排ID',
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 200.00 COMMENT '支付金额(固定200)',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT '货币类型',
  `status` CHAR(1) NOT NULL DEFAULT '0' COMMENT '状态(0待支付 1已支付 2失败 3已取消 4已过期)',
  `payment_method` VARCHAR(32) NOT NULL DEFAULT 'wechat_pay' COMMENT '支付方式',
  `wechat_order_id` VARCHAR(64) DEFAULT NULL COMMENT '微信订单号',
  `prepay_id` VARCHAR(64) DEFAULT NULL COMMENT '预支付交易会话标识',
  `paid_time` DATETIME DEFAULT NULL COMMENT '支付完成时间',
  `expires_time` DATETIME NOT NULL COMMENT '订单过期时间',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_profile_id` (`profile_id`),
  KEY `idx_course_schedule_id` (`course_schedule_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_expires_time` (`expires_time`),
  KEY `idx_wechat_order_id` (`wechat_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付订单表';
```

**Fields Description**:
- `id`: Primary key for internal reference
- `order_id`: Public order identifier (UUID format)
- `user_id`: Reference to the user placing the order
- `course_schedule_id`: Reference to the course schedule being booked
- `amount`: Fixed payment amount of 200.00 yuan
- `status`: Current payment order status
- `expires_at`: 30-minute expiration for payment completion

### 2. gym_payment_transaction 表

基于RuoYi-Vue-Pro架构的支付交易表，跟踪微信支付交易信息。

```sql
CREATE TABLE `gym_payment_transaction` (
  `transaction_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '交易ID',
  `payment_id` BIGINT(20) NOT NULL COMMENT '支付订单ID',
  `wechat_transaction_id` VARCHAR(64) DEFAULT NULL COMMENT '微信交易号',
  `out_trade_no` VARCHAR(64) NOT NULL COMMENT '商户订单号',
  `trade_type` VARCHAR(32) NOT NULL DEFAULT 'NATIVE' COMMENT '交易类型',
  `trade_state` VARCHAR(32) NOT NULL COMMENT '交易状态',
  `bank_type` VARCHAR(32) DEFAULT NULL COMMENT '付款银行',
  `settlement_total_fee` DECIMAL(10,2) DEFAULT NULL COMMENT '应结订单金额',
  `cash_fee` DECIMAL(10,2) DEFAULT NULL COMMENT '现金支付金额',
  `transaction_fee` DECIMAL(10,2) DEFAULT NULL COMMENT '微信支付手续费',
  `total_fee` BIGINT(20) NOT NULL COMMENT '订单总金额(分)',
  `fee_type` VARCHAR(10) DEFAULT 'CNY' COMMENT '货币类型',
  `time_end` VARCHAR(14) DEFAULT NULL COMMENT '支付完成时间',
  `is_subscribe` CHAR(1) DEFAULT 'N' COMMENT '是否关注公众账号',
  `openid` VARCHAR(128) DEFAULT NULL COMMENT '用户标识',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`transaction_id`),
  UNIQUE KEY `uk_wechat_transaction_id` (`wechat_transaction_id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_out_trade_no` (`out_trade_no`),
  KEY `idx_trade_state` (`trade_state`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_openid` (`openid`),
  CONSTRAINT `fk_payment_transaction_payment` FOREIGN KEY (`payment_id`) REFERENCES `gym_payment_order` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付交易表';
```

**Fields Description**:
- `transaction_id`: Unique WeChat transaction identifier
- `order_id`: Reference to the payment order
- `out_trade_no`: Merchant order number sent to WeChat
- `trade_state`: Current WeChat transaction status
- `total_fee`: Amount in cents (as required by WeChat Pay API)

### 3. gym_seat_reservation 表

基于RuoYi-Vue-Pro架构的座位预留表，管理支付过程中的临时座位预留。

```sql
CREATE TABLE `gym_seat_reservation` (
  `reservation_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '预留ID',
  `payment_id` BIGINT(20) NOT NULL COMMENT '支付订单ID',
  `course_schedule_id` BIGINT(20) NOT NULL COMMENT '课程安排ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `seat_count` INT(11) NOT NULL DEFAULT 1 COMMENT '预留座位数',
  `status` CHAR(1) NOT NULL DEFAULT '0' COMMENT '状态(0临时 1已确认 2已取消 3已过期)',
  `expires_time` DATETIME NOT NULL COMMENT '预留过期时间(15分钟)',
  `confirmed_time` DATETIME DEFAULT NULL COMMENT '确认时间',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`reservation_id`),
  UNIQUE KEY `uk_payment_id` (`payment_id`),
  KEY `idx_course_schedule_id` (`course_schedule_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires_time` (`expires_time`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_seat_reservation_payment` FOREIGN KEY (`payment_id`) REFERENCES `gym_payment_order` (`payment_id`),
  CONSTRAINT `fk_seat_reservation_schedule` FOREIGN KEY (`course_schedule_id`) REFERENCES `gym_course_schedule` (`schedule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='座位预留表';
```

**Fields Description**:
- `reservation_id`: Unique identifier for seat reservation
- `order_id`: Links to payment order
- `status`: Reservation lifecycle status
- `expires_at`: 15-minute expiration for temporary reservations

### 4. gym_payment_audit_log 表

基于RuoYi-Vue-Pro架构的支付审计日志表，记录所有支付相关活动的审计轨迹。

```sql
CREATE TABLE `gym_payment_audit_log` (
  `audit_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '审计ID',
  `payment_id` BIGINT(20) DEFAULT NULL COMMENT '支付订单ID',
  `transaction_id` BIGINT(20) DEFAULT NULL COMMENT '交易ID',
  `user_id` BIGINT(20) DEFAULT NULL COMMENT '用户ID',
  `action_type` VARCHAR(64) NOT NULL COMMENT '操作类型',
  `action_detail` TEXT DEFAULT NULL COMMENT '操作详情',
  `old_status` VARCHAR(32) DEFAULT NULL COMMENT '原状态',
  `new_status` VARCHAR(32) DEFAULT NULL COMMENT '新状态',
  `ip_address` VARCHAR(128) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
  `request_data` TEXT DEFAULT NULL COMMENT '请求数据(JSON)',
  `response_data` TEXT DEFAULT NULL COMMENT '响应数据(JSON)',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`audit_id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_payment_audit_payment` FOREIGN KEY (`payment_id`) REFERENCES `gym_payment_order` (`payment_id`),
  CONSTRAINT `fk_payment_audit_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `gym_payment_transaction` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付审计日志表';
```

**Fields Description**:
- `action_type`: Type of audit action (CREATE, UPDATE, PAYMENT, etc.)
- `request_data`/`response_data`: JSON snapshots for debugging
- `old_status`/`new_status`: Status change tracking

## 实体关系

### Relationship Diagram

```
users (1) -----> (N) payment_orders (1) -----> (N) payment_transactions
                     |
                     |
                     v
              seat_reservations (N)
                     |
                     |
                     v
        course_schedules (1) <------ (N) seat_reservations
                     |
                     |
                     v
        payment_audit_log (N)
```

### Key Relationships

1. **User to Payment Orders**: One-to-many relationship
   - A user can have multiple payment orders
   - Each payment order belongs to exactly one user

2. **Payment Order to Transactions**: One-to-many relationship
   - A payment order can have multiple transaction attempts
   - Each transaction belongs to exactly one payment order

3. **Payment Order to Seat Reservation**: One-to-one relationship
   - Each payment order has exactly one seat reservation
   - Each seat reservation belongs to exactly one payment order

4. **Course Schedule to Reservations**: One-to-many relationship
   - A course schedule can have multiple reservations
   - Each reservation belongs to exactly one course schedule

## 数据验证规则

### Payment Orders
- `amount` must be exactly 200.00
- `currency` must be 'CNY'
- `expires_at` must be 30 minutes after `created_at`
- `order_id` must be unique UUID format

### Payment Transactions
- `transaction_id` must be unique
- `total_fee` must match order amount * 100 (cents)
- `out_trade_no` must match payment order's `order_id`

### Seat Reservations
- `expires_at` must be 15 minutes after `created_at`
- `seat_count` must be positive integer
- Cannot exceed available seats for course schedule

### Audit Log
- `created_at` is automatically set
- `action_type` must be predefined enum values
- Request/response data must be valid JSON

## Indexing Strategy

### Primary Indexes
- All tables have auto-increment primary keys
- Unique constraints on business identifiers

### Foreign Key Indexes
- All foreign key columns are indexed for join performance
- Composite indexes for common query patterns

### Query Optimization Indexes
- `idx_status` on payment_orders for status-based filtering
- `idx_expires_at` on seat_reservations for expiration cleanup
- `idx_created_at` across tables for time-based queries

## 数据迁移考虑

### Migration Scripts
1. Create all tables with proper constraints
2. Populate existing course schedules if needed
3. Set up proper indexes after data loading
4. Validate referential integrity

### Rollback Strategy
1. Drop tables in reverse dependency order
2. Preserve data backups before migration
3. Test rollback in staging environment

## 性能考虑

### Read Patterns
- Frequent status queries on payment_orders
- Regular expiration cleanup queries
- Audit log queries for monitoring

### Write Patterns
- High volume of payment order creation
- Transaction status updates from webhooks
- Seat reservation status changes

### Caching Strategy
- Redis cache for active payment orders
- Seat availability caching with TTL
- Transaction status caching

## 安全考虑

### Data Encryption
- Sensitive payment fields encrypted at rest
- API request/response data in audit log encrypted
- User PII protection

### Access Control
- Database access restricted to application roles
- Audit log access limited to administrators
- Payment data access controls

### Data Retention
- Payment orders retained for 7 years (legal requirement)
- Audit logs retained for 2 years
- Transaction logs retained for 5 years
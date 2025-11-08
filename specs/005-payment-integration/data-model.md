# 数据模型： 005-payment-integration

**功能分支**: `005-payment-integration`
**创建时间**: 2025-11-03
**状态**: Draft
**MVP**: 5

## 数据库架构设计

### 1. payment_orders Table

Stores payment order information for trial class bookings.

```sql
CREATE TABLE payment_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'Unique order identifier',
    user_id BIGINT NOT NULL COMMENT 'User who created the order',
    course_schedule_id BIGINT NOT NULL COMMENT 'Course schedule being booked',
    amount DECIMAL(10,2) NOT NULL DEFAULT 200.00 COMMENT 'Payment amount (fixed 200)',
    currency VARCHAR(3) NOT NULL DEFAULT 'CNY' COMMENT 'Currency code',
    status ENUM('pending', 'paid', 'failed', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(32) NOT NULL DEFAULT 'wechat_pay' COMMENT 'Payment method',
    description TEXT COMMENT 'Order description',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL COMMENT 'Order expiration time',

    INDEX idx_user_id (user_id),
    INDEX idx_course_schedule_id (course_schedule_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_order_id (order_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_schedule_id) REFERENCES course_schedules(id)
);
```

**Fields Description**:
- `id`: Primary key for internal reference
- `order_id`: Public order identifier (UUID format)
- `user_id`: Reference to the user placing the order
- `course_schedule_id`: Reference to the course schedule being booked
- `amount`: Fixed payment amount of 200.00 yuan
- `status`: Current payment order status
- `expires_at`: 30-minute expiration for payment completion

### 2. payment_transactions Table

Tracks individual payment transactions with WeChat Pay.

```sql
CREATE TABLE payment_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'WeChat transaction ID',
    order_id BIGINT NOT NULL COMMENT 'Reference to payment order',
    out_trade_no VARCHAR(64) NOT NULL COMMENT 'Merchant order number',
    trade_type VARCHAR(32) NOT NULL DEFAULT 'NATIVE' COMMENT 'WeChat trade type',
    trade_state VARCHAR(32) NOT NULL COMMENT 'WeChat trade state',
    bank_type VARCHAR(32) COMMENT 'Bank type',
    settlement_total_fee DECIMAL(10,2) COMMENT 'Settlement amount',
    cash_fee DECIMAL(10,2) COMMENT 'Cash fee',
    transaction_fee DECIMAL(10,2) COMMENT 'Transaction fee',
    total_fee DECIMAL(10,2) NOT NULL COMMENT 'Total fee in cents',
    fee_type VARCHAR(8) DEFAULT 'CNY' COMMENT 'Fee currency',
    time_end VARCHAR(14) COMMENT 'Transaction completion time',
    is_subscribe VARCHAR(1) DEFAULT 'N' COMMENT 'User subscription status',
    return_code VARCHAR(32) NOT NULL COMMENT 'WeChat return code',
    return_msg VARCHAR(128) COMMENT 'WeChat return message',
    result_code VARCHAR(32) COMMENT 'WeChat result code',
    err_code VARCHAR(32) COMMENT 'Error code',
    err_code_des VARCHAR(128) COMMENT 'Error description',
    openid VARCHAR(128) COMMENT 'User openid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_order_id (order_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_out_trade_no (out_trade_no),
    INDEX idx_trade_state (trade_state),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (order_id) REFERENCES payment_orders(id)
);
```

**Fields Description**:
- `transaction_id`: Unique WeChat transaction identifier
- `order_id`: Reference to the payment order
- `out_trade_no`: Merchant order number sent to WeChat
- `trade_state`: Current WeChat transaction status
- `total_fee`: Amount in cents (as required by WeChat Pay API)

### 3. seat_reservations Table

Manages temporary seat reservations during payment process.

```sql
CREATE TABLE seat_reservations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reservation_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'Unique reservation identifier',
    order_id BIGINT NOT NULL COMMENT 'Associated payment order',
    course_schedule_id BIGINT NOT NULL COMMENT 'Course schedule reference',
    user_id BIGINT NOT NULL COMMENT 'User making reservation',
    seat_count INT NOT NULL DEFAULT 1 COMMENT 'Number of seats reserved',
    status ENUM('temporary', 'confirmed', 'cancelled', 'expired') NOT NULL DEFAULT 'temporary',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL COMMENT 'Reservation expiration (15 minutes)',
    confirmed_at TIMESTAMP NULL COMMENT 'When reservation was confirmed',

    INDEX idx_reservation_id (reservation_id),
    INDEX idx_order_id (order_id),
    INDEX idx_course_schedule_id (course_schedule_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),

    FOREIGN KEY (order_id) REFERENCES payment_orders(id),
    FOREIGN KEY (course_schedule_id) REFERENCES course_schedules(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Fields Description**:
- `reservation_id`: Unique identifier for seat reservation
- `order_id`: Links to payment order
- `status`: Reservation lifecycle status
- `expires_at`: 15-minute expiration for temporary reservations

### 4. payment_audit_log Table

Audit trail for all payment-related activities.

```sql
CREATE TABLE payment_audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT COMMENT 'Related payment order',
    transaction_id BIGINT COMMENT 'Related payment transaction',
    user_id BIGINT COMMENT 'User performing action',
    action_type VARCHAR(64) NOT NULL COMMENT 'Type of action performed',
    action_detail TEXT COMMENT 'Details of the action',
    old_status VARCHAR(32) COMMENT 'Previous status',
    new_status VARCHAR(32) COMMENT 'New status after action',
    ip_address VARCHAR(45) COMMENT 'IP address of request',
    user_agent TEXT COMMENT 'User agent string',
    request_data JSON COMMENT 'Request data snapshot',
    response_data JSON COMMENT 'Response data snapshot',
    error_message TEXT COMMENT 'Error message if any',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_order_id (order_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (order_id) REFERENCES payment_orders(id),
    FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
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
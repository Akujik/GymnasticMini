# 数据模型： 006-wallet-system

**功能分支**: `006-wallet-system`
**创建时间**: 2025-11-03
**状态**: Draft
**MVP**: 6
**依赖关系**: MVP-1 (001-user-identity-system), MVP-5 (005-payment-integration)

## 数据库架构设计

### 1. wallet Table

Core wallet information for each user, supporting overdraft and family account sharing.

```sql
CREATE TABLE wallet (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL COMMENT 'User who owns this wallet',
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Current wallet balance (can be negative)',
    frozen_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Frozen amount for pending transactions',
    credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Overdraft limit (default 0, can be increased)',
    total_recharged DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount ever recharged',
    total_spent DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount ever spent',
    status ENUM('active', 'frozen', 'closed') NOT NULL DEFAULT 'active' COMMENT 'Wallet status',
    family_account_id BIGINT NULL COMMENT 'For family account sharing',
    last_transaction_at TIMESTAMP NULL COMMENT 'Timestamp of last transaction',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_family_account_id (family_account_id),
    INDEX idx_last_transaction_at (last_transaction_at),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (family_account_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**Fields Description**:
- `balance`: Current balance, can be negative to support overdraft
- `frozen_balance`: Amount temporarily held for pending transactions
- `credit_limit`: Maximum overdraft allowed (default 0, configurable)
- `family_account_id`: Links to primary family account holder for balance sharing
- `total_recharged`/`total_spent`: Analytics fields for reporting

### 2. wallet_transactions Table

Comprehensive transaction history for all wallet operations.

```sql
CREATE TABLE wallet_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wallet_id BIGINT NOT NULL COMMENT 'Associated wallet',
    transaction_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'Unique transaction identifier',
    type ENUM('recharge', 'deduction', 'adjustment', 'refund', 'freeze', 'unfreeze') NOT NULL,
    amount DECIMAL(10,2) NOT NULL COMMENT 'Transaction amount (positive for increase, negative for decrease)',
    balance_before DECIMAL(10,2) NOT NULL COMMENT 'Balance before transaction',
    balance_after DECIMAL(10,2) NOT NULL COMMENT 'Balance after transaction',
    payment_method ENUM('wechat', 'alipay', 'bank', 'cash', 'wallet', 'adjustment', 'refund') NULL,
    external_order_no VARCHAR(64) NULL COMMENT 'External order number (payment, booking, etc.)',
    note TEXT NULL COMMENT 'Transaction description or notes',
    admin_id BIGINT NULL COMMENT 'Admin user who performed manual adjustment',
    related_booking_id BIGINT NULL COMMENT 'Related booking if applicable',
    related_payment_order_id BIGINT NULL COMMENT 'Related payment order if applicable',
    adjustment_id BIGINT NULL COMMENT 'Related adjustment if applicable',
    metadata JSON NULL COMMENT 'Additional transaction metadata',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL COMMENT 'When transaction was fully processed',

    INDEX idx_wallet_id (wallet_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_payment_method (payment_method),
    INDEX idx_related_booking_id (related_booking_id),
    INDEX idx_external_order_no (external_order_no),

    FOREIGN KEY (wallet_id) REFERENCES wallet(id),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL,
    FOREIGN KEY (related_booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (related_payment_order_id) REFERENCES payment_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (adjustment_id) REFERENCES wallet_adjustments(id) ON DELETE SET NULL
);
```

**Fields Description**:
- `type`: Categorizes all types of balance changes
- `payment_method`: How the transaction was initiated
- `external_order_no`: Links to external systems (payment, booking, etc.)
- `admin_id`: Tracks which admin performed manual operations
- `metadata`: Flexible JSON field for additional transaction data

### 3. wallet_adjustments Table

Manual balance adjustments performed by operations staff.

```sql
CREATE TABLE wallet_adjustments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    adjustment_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'Unique adjustment identifier',
    wallet_id BIGINT NOT NULL COMMENT 'Wallet being adjusted',
    adjustment_type ENUM('increase', 'decrease') NOT NULL COMMENT 'Direction of adjustment',
    amount DECIMAL(10,2) NOT NULL COMMENT 'Adjustment amount (always positive)',
    reason VARCHAR(200) NOT NULL COMMENT 'Business reason for adjustment',
    payment_method ENUM('wechat', 'alipay', 'bank', 'cash') NOT NULL COMMENT 'How payment was received/made',
    external_order_no VARCHAR(64) NULL COMMENT 'External payment/order reference',
    admin_id BIGINT NOT NULL COMMENT 'Admin performing the adjustment',
    admin_note TEXT NULL COMMENT 'Additional notes from admin',
    status ENUM('pending', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'pending',
    receipt_required BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether receipt upload is required',
    receipt_uploaded BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether receipt has been uploaded',
    receipt_url VARCHAR(500) NULL COMMENT 'URL to uploaded receipt',
    related_transaction_id BIGINT NULL COMMENT 'Transaction created by this adjustment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT 'When adjustment was completed',
    cancelled_at TIMESTAMP NULL COMMENT 'When adjustment was cancelled',

    INDEX idx_adjustment_id (adjustment_id),
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_payment_method (payment_method),

    FOREIGN KEY (wallet_id) REFERENCES wallet(id),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id),
    FOREIGN KEY (related_transaction_id) REFERENCES wallet_transactions(id) ON DELETE SET NULL
);
```

**Fields Description**:
- `adjustment_type`: Whether balance is being increased or decreased
- `reason`: Mandatory business reason for the adjustment
- `receipt_required`: Whether physical receipt proof is needed
- `receipt_uploaded`: Whether admin has uploaded receipt proof

### 4. balance_notifications Table

Tracks all balance-related notifications sent to users.

```sql
CREATE TABLE balance_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT 'User receiving notification',
    wallet_id BIGINT NOT NULL COMMENT 'Associated wallet',
    notification_type ENUM('low_balance', 'arrears', 'reminder', 'adjustment') NOT NULL,
    threshold_amount DECIMAL(10,2) NULL COMMENT 'Threshold that triggered notification',
    current_balance DECIMAL(10,2) NOT NULL COMMENT 'Balance at time of notification',
    message_content TEXT NOT NULL COMMENT 'Notification message content',
    wechat_template_id VARCHAR(64) NULL COMMENT 'WeChat template used',
    wechat_openid VARCHAR(128) NULL COMMENT 'User WeChat openid',
    sent_at TIMESTAMP NULL COMMENT 'When notification was sent',
    status ENUM('pending', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL COMMENT 'Error if sending failed',
    retry_count INT NOT NULL DEFAULT 0 COMMENT 'Number of retry attempts',
    next_retry_at TIMESTAMP NULL COMMENT 'When to retry sending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_type (notification_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_created_at (created_at),
    INDEX idx_next_retry_at (next_retry_at),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (wallet_id) REFERENCES wallet(id)
);
```

**Fields Description**:
- `notification_type`: Different categories of balance notifications
- `threshold_amount`: What threshold triggered this notification
- `retry_count`: How many times we've tried to send this notification
- `next_retry_at`: When to attempt next retry

### 5. notification_preferences Table

User preferences for balance notifications (future feature).

```sql
CREATE TABLE notification_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL COMMENT 'User who owns these preferences',
    low_balance_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Enable low balance alerts',
    low_balance_threshold DECIMAL(10,2) NOT NULL DEFAULT 200.00 COMMENT 'Low balance threshold',
    arrears_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Enable arrears notifications',
    reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Enable general reminders',
    adjustment_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Enable adjustment notifications',
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Enable quiet hours',
    quiet_hours_start TIME NULL COMMENT 'Quiet hours start time',
    quiet_hours_end TIME NULL COMMENT 'Quiet hours end time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 6. wallet_reconciliation Table

Daily reconciliation records for financial auditing.

```sql
CREATE TABLE wallet_reconciliation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reconciliation_date DATE NOT NULL UNIQUE COMMENT 'Date being reconciled',
    total_wallets INT NOT NULL DEFAULT 0 COMMENT 'Number of wallets reconciled',
    total_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total balance across all wallets',
    total_transactions INT NOT NULL DEFAULT 0 COMMENT 'Number of transactions processed',
    total_recharged DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount recharged',
    total_spent DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount spent',
    total_adjustments DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount adjusted',
    discrepancy_count INT NOT NULL DEFAULT 0 COMMENT 'Number of discrepancies found',
    discrepancy_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total discrepancy amount',
    status ENUM('in_progress', 'completed', 'failed') NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    notes TEXT NULL COMMENT 'Reconciliation notes',

    INDEX idx_reconciliation_date (reconciliation_date),
    INDEX idx_status (status),
    INDEX idx_completed_at (completed_at)
);
```

## 实体关系

### Relationship Diagram

```
users (1) -----> (1) wallet (1) -----> (N) wallet_transactions
                     |                      |
                     |                      |
(N) family_account  |                      v
    sharing          |         wallet_adjustments (N)
                     |                      |
                     v                      v
            balance_notifications (N)   notification_preferences (1)
                     |
                     v
            wallet_reconciliation (N)
```

### Key Relationships

1. **User to Wallet**: One-to-one relationship
   - Each user has exactly one wallet
   - Wallet contains user's balance and transaction history

2. **Wallet to Transactions**: One-to-many relationship
   - Each wallet has multiple transactions
   - Every transaction belongs to exactly one wallet

3. **Wallet to Adjustments**: One-to-many relationship
   - Manual adjustments recorded separately from regular transactions
   - Each adjustment creates exactly one transaction

4. **Wallet to Notifications**: One-to-many relationship
   - Balance notifications tracked per wallet
   - Notifications can be retried if sending fails

5. **Family Account Sharing**: Self-referential relationship
   - Family members can share primary account holder's wallet
   - Multiple users can reference same family account

## 数据验证规则

### Wallet Validation
- `balance` precision: DECIMAL(10,2) - supports up to 99,999,999.99
- `credit_limit` must be >= 0
- `frozen_balance` cannot exceed total available balance + credit_limit
- Wallet status transitions must follow business rules

### Transaction Validation
- `transaction_id` must be unique UUID format
- `balance_after` must equal `balance_before + amount`
- `amount` precision must be 2 decimal places
- Transaction types must be from predefined enum

### Adjustment Validation
- `amount` must be positive (direction in `adjustment_type`)
- `reason` is mandatory and cannot be empty
- `payment_method` must be from predefined enum
- Adjustment can only be performed by authorized admin users

### Notification Validation
- `message_content` cannot be empty
- `retry_count` cannot exceed maximum retry limit (default 5)
- Notification frequency must respect cooldown periods

## Indexing Strategy

### Primary Indexes
- All tables have auto-increment primary keys
- Unique constraints on business identifiers

### Foreign Key Indexes
- All foreign key columns indexed for join performance
- Composite indexes for common query patterns

### Query Optimization Indexes
- `idx_balance` on wallet for balance-based queries
- `idx_created_at` across tables for time-based queries
- `idx_status` for status-based filtering
- `idx_type` for transaction type filtering

## 数据迁移考虑

### Migration Scripts
1. Create wallet for existing users with 0 balance
2. Migrate existing booking payments to wallet transactions
3. Set up initial credit limits for users
4. Create historical transactions for existing payments

### Rollback Strategy
1. Backup all financial data before migration
2. Create rollback scripts for each migration step
3. Test rollback in staging environment
4. Have manual reconciliation procedures ready

## 性能考虑

### Read Patterns
- Frequent balance queries for booking validation
- Transaction history pagination
- Admin adjustment queries
- Reconciliation reporting queries

### Write Patterns
- High volume of booking transactions
- Admin adjustments (lower frequency)
- Notification status updates
- Daily reconciliation processes

### Caching Strategy
- Redis cache for active wallet balances
- Transaction summary caching
- Notification frequency throttling cache
- Admin session caching

## 安全考虑

### Data Encryption
- Sensitive financial data encrypted at rest
- User PII protection in transaction notes
- Admin credentials and session data encrypted
- Audit log integrity protection

### Access Control
- Role-based access for adjustment operations
- API authentication and authorization
- Database access restricted to application roles
- Audit log access limited to authorized personnel

### Audit Trail
- All financial operations logged
- Admin action tracking
- Data change history
- Access attempt logging

## Data Retention Policies

### Financial Data
- Wallet records: Retain indefinitely (business requirement)
- Transactions: Retain for 7 years (legal requirement)
- Adjustments: Retain for 7 years (audit requirement)
- Reconciliation: Retain for 7 years (audit requirement)

### Notification Data
- Sent notifications: Retain for 1 year
- Failed notifications: Retain for 6 months
- Notification preferences: Retain until user deletion

### Operational Data
- Admin session logs: Retain for 90 days
- System logs: Retain for 1 year
- Backup data: Retain according to backup policy

## Analytics and Reporting

### Balance Analytics
- Daily balance summaries
- User balance distribution
- Overdraft usage statistics
- Family account sharing metrics

### Transaction Analytics
- Transaction volume by type
- Peak transaction times
- Payment method usage
- Adjustment frequency analysis

### Notification Analytics
- Delivery success rates
- Notification engagement metrics
- User response rates
- System performance metrics
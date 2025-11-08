# 实施计划：006-wallet-system

**功能分支**: `006-wallet-system`
**创建时间**: 2025-11-03
**状态**: 草稿
**MVP**: 6
**依赖关系**: MVP-1 (001-user-identity-system), MVP-5 (005-payment-integration)
**输入**: 构建一个支持透支、余额预警、支付通知和运营管理员手动调整课程费用的钱包系统。

## 概述

本计划概述了为体操小程序实施综合钱包系统的方案。系统将支持透支功能、实时余额管理、课程费用扣除、运营人员手动调整以及余额预警和欠费提醒的智能通知系统。

## 架构设计

### 技术栈
- **前端**: 微信小程序 (MINA框架) + Web管理后台
- **后端**: FastAPI with Python
- **数据库**: MySQL with SQLAlchemy ORM
- **通知服务**: 微信服务通知
- **状态管理**: Redis用于余额缓存和通知限流

### 系统组件
1. **钱包服务层**: 核心钱包操作和余额管理
2. **交易服务**: 交易记录和历史管理
3. **调整服务**: 运营人员手动余额调整
4. **通知服务**: 余额预警和欠费提醒
5. **预约集成**: 课程费用扣除集成
6. **审计服务**: 全面的审计日志

## 实施阶段

### 阶段1：核心钱包基础设施 (3天)
- 钱包和交易数据库架构
- 基础钱包CRUD操作
- 余额计算和精度处理
- 交易记录系统
- 基础钱包API端点

### 阶段2：课程预约集成 (3天)
- 与预约系统集成费用扣除
- 透支支持和余额验证
- 取消退款逻辑
- 并发交易处理
- 欠费用户预约限制

### 阶段3：运营调整系统 (4天)
- Web管理界面用于余额调整
- 带必填字段的工作流程
- 操作审计日志
- 收据通知系统
- 调整历史跟踪

### 阶段4：通知系统 (3天)
- 低于阈值检测
- 微信服务通知集成
- 欠费提醒逻辑
- 通知频率控制
- 通知历史跟踪

### Phase 5: Advanced Features & Optimization (3 days)
- Family account wallet sharing
- Performance optimization
- Security enhancements
- Comprehensive testing
- Monitoring and alerting

## 数据库设计

### wallet Table
```sql
CREATE TABLE wallet (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    frozen_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'frozen', 'closed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_status (status),

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### wallet_transactions Table
```sql
CREATE TABLE wallet_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wallet_id BIGINT NOT NULL,
    transaction_id VARCHAR(64) UNIQUE NOT NULL,
    type ENUM('recharge', 'deduction', 'adjustment', 'refund') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(32),
    external_order_no VARCHAR(64),
    note TEXT,
    admin_id BIGINT,
    related_booking_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_wallet_id (wallet_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (wallet_id) REFERENCES wallet(id),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);
```

### balance_notifications Table
```sql
CREATE TABLE balance_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    notification_type ENUM('low_balance', 'arrears', 'reminder') NOT NULL,
    threshold_amount DECIMAL(10,2),
    current_balance DECIMAL(10,2) NOT NULL,
    message_content TEXT NOT NULL,
    wechat_template_id VARCHAR(64),
    sent_at TIMESTAMP NULL,
    status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_type (notification_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### wallet_adjustments Table
```sql
CREATE TABLE wallet_adjustments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wallet_id BIGINT NOT NULL,
    adjustment_id VARCHAR(64) UNIQUE NOT NULL,
    adjustment_type ENUM('increase', 'decrease') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(200) NOT NULL,
    payment_method ENUM('wechat', 'alipay', 'bank', 'cash') NOT NULL,
    external_order_no VARCHAR(64),
    admin_id BIGINT NOT NULL,
    admin_note TEXT,
    status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    receipt_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    INDEX idx_wallet_id (wallet_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (wallet_id) REFERENCES wallet(id),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);
```

## API Endpoints

### Wallet Management APIs
- `GET /api/v1/wallet`: Get user wallet information
- `GET /api/v1/wallet/transactions`: Get transaction history
- `GET /api/v1/wallet/balance`: Get current balance only
- `POST /api/v1/wallet/transactions/{transaction_id}`: Get transaction details

### Operations Adjustment APIs
- `POST /api/v1/admin/wallet/adjustments`: Create balance adjustment
- `GET /api/v1/admin/wallet/adjustments`: Get adjustment history
- `PUT /api/v1/admin/wallet/adjustments/{adjustment_id}`: Update adjustment
- `GET /api/v1/admin/wallet/adjustments/{adjustment_id}`: Get adjustment details

### Notification Management APIs
- `GET /api/v1/wallet/notifications`: Get notification history
- `POST /api/v1/wallet/notifications/test`: Send test notification
- `PUT /api/v1/wallet/notification-settings`: Update notification preferences

### Integration APIs
- `POST /api/v1/wallet/deduct`: Deduct course fee (internal)
- `POST /api/v1/wallet/refund`: Refund course fee (internal)
- `GET /api/v1/wallet/status/{user_id}`: Get wallet status for booking validation

## Business Logic Implementation

### Balance Calculation Logic
```python
def calculate_new_balance(current_balance, amount, transaction_type):
    if transaction_type in ['recharge', 'refund', 'adjustment_increase']:
        return current_balance + amount
    elif transaction_type in ['deduction', 'adjustment_decrease']:
        return current_balance - amount
    else:
        raise ValueError(f"Invalid transaction type: {transaction_type}")
```

### Overdraft Validation Logic
```python
def can_make_booking(user_balance, course_fee=200.00):
    # Allow booking even with negative balance (overdraft support)
    # But restrict if already significantly overdrawn
    max_overdraft = -1000.00  # Maximum allowed overdraft
    return user_balance >= max_overdraft
```

### Notification Frequency Control
```python
def should_send_notification(user_id, notification_type, current_balance):
    # Check last notification time for this type
    last_notification = get_last_notification(user_id, notification_type)

    if not last_notification:
        return True

    # Don't send same type notification within 24 hours
    time_diff = datetime.now() - last_notification.sent_at
    return time_diff >= timedelta(hours=24)
```

## Security Considerations

### Balance Security
- All balance operations use database transactions
- Decimal precision handling for financial calculations
- Concurrent operation prevention with optimistic locking
- Comprehensive audit logging for all adjustments

### API Security
- Role-based access control for operations endpoints
- Request validation and sanitization
- Rate limiting for adjustment operations
- Authentication and authorization for all wallet operations

### Data Security
- Sensitive financial data encryption
- PII protection in transaction logs
- Secure storage of admin credentials
- Regular security audits

## Risk Assessment

### High Risk
- Concurrent balance modification race conditions
- Database transaction failures during operations
- WeChat notification delivery failures

### Medium Risk
- Calculation precision errors with floating point
- Overdraft limit abuse by users
- Performance issues with large transaction histories

### Low Risk
- UI/UX complexity for wallet interface
- Admin training for adjustment procedures
- Notification frequency optimization

## Testing Strategy

### Unit Tests
- Balance calculation accuracy
- Transaction recording logic
- Notification triggering conditions
- Overdraft validation logic

### Integration Tests
- End-to-end booking and deduction flow
- Admin adjustment workflow
- WeChat notification delivery
- Database transaction handling

### Performance Tests
- Concurrent balance operations
- Large transaction history queries
- Notification batch processing
- Database load testing

### Security Tests
- Authorization bypass attempts
- Input validation attacks
- Financial data exposure
- Transaction integrity verification

## Monitoring and Observability

### Key Metrics
- Wallet balance accuracy
- Transaction processing success rate
- Notification delivery success rate
- Adjustment operation frequency

### Alerting
- Balance calculation failures
- Transaction rollback occurrences
- Notification delivery failures
- Unauthorized adjustment attempts

### Logging
- Detailed transaction logs
- Admin adjustment audit trail
- Notification delivery status
- System performance metrics

## Success Criteria

- [ ] 100% accuracy in balance calculations
- [ ] <2 second response time for wallet queries
- [ ] 99.9% transaction processing success rate
- [ ] Complete audit trail for all adjustments
- [ ] 95%+ notification delivery success rate
- [ ] Zero security vulnerabilities in financial operations

## Deployment Plan

### Staging Environment
- Full wallet system integration testing
- WeChat notification sandbox testing
- Admin interface usability testing
- Load testing with concurrent users

### Production Rollout
- Phased rollout by user segments
- Real-time monitoring of balance accuracy
- Gradual feature enablement
- Rollback procedures ready

## Post-Launch Considerations

### Feature Enhancements
- Automated balance reports
- Advanced notification preferences
- Mobile wallet optimizations
- Enhanced admin analytics

### Operational Procedures
- Daily balance reconciliation
- Weekly notification performance review
- Monthly security audits
- Quarterly system performance reviews
# 数据模型： 007-admin-dashboard

**功能分支**: `007-admin-dashboard`
**创建时间**: 2025-11-03
**状态**: Draft
**MVP**: 7
**依赖关系**: MVP-1 (001-user-identity-system), MVP-5 (005-payment-integration), MVP-6 (006-wallet-system)

## 数据库架构设计

### 1. admin_user Table

管理员用户表，存储后台登录用户信息和权限。

```sql
CREATE TABLE admin_user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt密码哈希',
    role ENUM('admin', 'operator', 'coach', 'finance') NOT NULL DEFAULT 'operator',
    name VARCHAR(100) NOT NULL COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱地址',
    phone VARCHAR(20) COMMENT '手机号码',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    permissions JSON COMMENT '额外权限配置',
    department VARCHAR(100) COMMENT '部门',
    position VARCHAR(100) COMMENT '职位',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login_at DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) COMMENT '最后登录IP',
    login_count INT DEFAULT 0 COMMENT '登录次数',
    failed_login_attempts INT DEFAULT 0 COMMENT '连续登录失败次数',
    locked_until DATETIME COMMENT '账户锁定到期时间',
    password_changed_at DATETIME COMMENT '密码修改时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_last_login (last_login_at),
    INDEX idx_created_at (created_at)
);
```

**Fields Description**:
- `role`: 四种角色 - admin(管理员)、operator(运营)、coach(教练)、finance(财务)
- `permissions`: JSON格式存储额外权限配置
- `locked_until`: 账户锁定时间，用于防暴力破解
- `password_changed_at`: 密码最后修改时间，用于强制密码更新

### 2. admin_session Table

管理员会话表，跟踪登录会话和安全性。

```sql
CREATE TABLE admin_session (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT NOT NULL,
    session_token VARCHAR(128) UNIQUE NOT NULL COMMENT 'JWT会话令牌',
    ip_address VARCHAR(45) COMMENT '登录IP地址',
    user_agent TEXT COMMENT '用户代理字符串',
    browser_info VARCHAR(200) COMMENT '浏览器信息',
    os_info VARCHAR(100) COMMENT '操作系统信息',
    location_country VARCHAR(50) COMMENT '所在国家',
    location_city VARCHAR(100) COMMENT '所在城市',
    is_active BOOLEAN DEFAULT TRUE COMMENT '会话是否活跃',
    expires_at DATETIME NOT NULL COMMENT '会话过期时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_active (is_active),

    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id) ON DELETE CASCADE
);
```

### 3. admin_operation_log Table

管理员操作日志表，记录所有后台操作的详细日志。

```sql
CREATE TABLE admin_operation_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT NOT NULL,
    session_id VARCHAR(128) COMMENT '会话ID',
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) NOT NULL COMMENT '目标对象类型',
    target_id BIGINT NOT NULL COMMENT '目标对象ID',
    target_name VARCHAR(200) COMMENT '目标对象名称',
    details JSON COMMENT '操作详细信息',
    old_values JSON COMMENT '操作前的值',
    new_values JSON COMMENT '操作后的值',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    browser_info VARCHAR(200) COMMENT '浏览器信息',
    os_info VARCHAR(100) COMMENT '操作系统信息',
    location_country VARCHAR(50) COMMENT '所在国家',
    location_city VARCHAR(100) COMMENT '所在城市',
    risk_score INT DEFAULT 0 COMMENT '风险评分',
    success BOOLEAN DEFAULT TRUE COMMENT '操作是否成功',
    error_message TEXT COMMENT '错误信息',
    execution_time_ms INT COMMENT '执行时间(毫秒)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at),
    INDEX idx_risk_score (risk_score),
    INDEX idx_success (success),
    INDEX idx_ip_address (ip_address),

    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id) ON DELETE SET NULL
);
```

### 4. trial_class_follow_up Table

体验课跟进表，记录体验课用户的跟进状态和转化情况。

```sql
CREATE TABLE trial_class_follow_up (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    student_profile_id BIGINT NOT NULL COMMENT '学员档案ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    booking_id BIGINT NOT NULL COMMENT '预约ID',
    follow_up_status ENUM('pending', 'contacted', 'not_interested', 'converted', 'lost') DEFAULT 'pending',
    contact_time DATETIME COMMENT '联系时间',
    contact_result ENUM('interested', 'considering', 'not_interested', 'no_response') COMMENT '跟进结果',
    next_follow_up_time DATETIME COMMENT '下次跟进时间',
    notes TEXT COMMENT '跟进备注',
    conversion_probability INT DEFAULT 0 COMMENT '转化概率(0-100)',
    admin_user_id INT NOT NULL COMMENT '跟进人ID',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '优先级',
    tags JSON COMMENT '标签',
    source_channel VARCHAR(100) COMMENT '来源渠道',
    estimated_budget DECIMAL(10,2) COMMENT '预估预算',
    competitor_info VARCHAR(500) COMMENT '竞品信息',
    parent_concerns TEXT COMMENT '家长关注点',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_student_profile_id (student_profile_id),
    INDEX idx_course_id (course_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (follow_up_status),
    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_priority (priority),
    INDEX idx_next_follow_up (next_follow_up_time),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id)
);
```

### 5. user_reconciliation_record Table

用户消课对账记录表，记录用户的充值和消课交易历史。

```sql
CREATE TABLE user_reconciliation_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    student_profile_id BIGINT COMMENT '学员ID（可为空，如充值记录）',
    booking_id BIGINT COMMENT '预约ID（可为空，如调整记录）',
    payment_order_id BIGINT COMMENT '支付订单ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '交易金额（正数表示充值，负数表示扣费）',
    transaction_type ENUM('recharge', 'consume', 'adjustment', 'refund') NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL COMMENT '交易后余额',
    payment_method VARCHAR(50) COMMENT '支付方式',
    external_order_no VARCHAR(100) COMMENT '外部订单号',
    note TEXT COMMENT '交易备注或说明',
    admin_user_id INT COMMENT '操作管理员ID（调整类交易）',
    transaction_category VARCHAR(100) COMMENT '交易分类',
    related_course_name VARCHAR(200) COMMENT '关联课程名称',
    refund_reason VARCHAR(500) COMMENT '退款原因',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME COMMENT '处理时间',

    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_profile_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_payment_order_id (payment_order_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    INDEX idx_amount (amount),
    INDEX idx_admin_user_id (admin_user_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (payment_order_id) REFERENCES payment_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id) ON DELETE SET NULL
);
```

### 6. attendance_records Table

出勤记录表，记录学员的出勤状态和详细信息。

```sql
CREATE TABLE attendance_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL COMMENT '预约ID',
    course_schedule_id BIGINT NOT NULL COMMENT '课程安排ID',
    student_profile_id BIGINT NOT NULL COMMENT '学员档案ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    status ENUM('attended', 'absent', 'leave', 'late', 'early_leave') NOT NULL DEFAULT 'absent',
    marked_by INT NOT NULL COMMENT '标记人（教练管理员ID）',
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '标记时间',
    check_in_time DATETIME COMMENT '签到时间',
    check_out_time DATETIME COMMENT '签退时间',
    actual_duration INT COMMENT '实际出勤时长（分钟）',
    planned_duration INT COMMENT '计划时长（分钟）',
    note TEXT COMMENT '备注',
    attendance_score INT DEFAULT 0 COMMENT '出勤评分',
    performance_notes TEXT COMMENT '表现评价',
    parent_feedback TEXT COMMENT '家长反馈',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_booking_student (booking_id, student_profile_id),
    INDEX idx_course_schedule (course_schedule_id),
    INDEX idx_student_id (student_profile_id),
    INDEX idx_user_id (user_id),
    INDEX idx_marked_by (marked_by),
    INDEX idx_status (status),
    INDEX idx_marked_at (marked_at),
    INDEX idx_check_in_time (check_in_time),

    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (course_schedule_id) REFERENCES course_schedules(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (marked_by) REFERENCES admin_user(id)
);
```

### 7. virtual_age_log Table

虚拟年龄变更记录表，追踪虚拟年龄设置的历史变更。

```sql
CREATE TABLE virtual_age_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_profile_id BIGINT NOT NULL COMMENT '学员档案ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    old_virtual_age INT COMMENT '原虚拟年龄',
    new_virtual_age INT COMMENT '新虚拟年龄',
    actual_age INT COMMENT '实际年龄',
    age_difference INT COMMENT '年龄差值',
    change_reason VARCHAR(500) NOT NULL COMMENT '变更原因',
    change_type ENUM('auto_approve', 'manual_approve', 'coach_request', 'parent_request') NOT NULL,
    admin_user_id INT COMMENT '审核管理员ID',
    coach_id INT COMMENT '申请教练ID',
    supporting_documents JSON COMMENT '支持文档',
    approval_notes TEXT COMMENT '审批备注',
    effective_date DATE COMMENT '生效日期',
    expiry_date DATE COMMENT '到期日期',
    status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME COMMENT '审批时间',

    INDEX idx_student_profile_id (student_profile_id),
    INDEX idx_user_id (user_id),
    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_effective_date (effective_date),

    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id)
);
```

### 8. pricing_rule Table

价格规则表，存储多维度的定价规则。

```sql
CREATE TABLE pricing_rule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(200) NOT NULL COMMENT '规则名称',
    rule_code VARCHAR(100) UNIQUE NOT NULL COMMENT '规则编码',
    customer_type ENUM('new_user', 'old_user', 'friend', 'vip') NOT NULL,
    audience_type ENUM('child', 'adult') NOT NULL,
    course_type ENUM('group', 'long_term', 'private_1v1', 'private_1v2', 'private_1v3', 'trial', 'camp') NOT NULL,
    level_range VARCHAR(100) COMMENT '等级范围（如：L1-L4）',
    min_level INT COMMENT '最低等级',
    max_level INT COMMENT '最高等级',
    hourly_price DECIMAL(10,2) COMMENT '小时单价',
    discount_rate DECIMAL(5,4) DEFAULT 1.0000 COMMENT '折扣率',
    fixed_price DECIMAL(10,2) COMMENT '固定价格',
    priority INT DEFAULT 0 COMMENT '优先级（数字越大优先级越高）',
    conditions JSON COMMENT '额外条件',
    special_tags JSON COMMENT '特殊标签',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    effective_date DATE COMMENT '生效日期',
    expiry_date DATE COMMENT '到期日期',
    created_by INT NOT NULL COMMENT '创建人',
    updated_by INT COMMENT '更新人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_rule_code (rule_code),
    INDEX idx_customer_type (customer_type),
    INDEX idx_audience_type (audience_type),
    INDEX idx_course_type (course_type),
    INDEX idx_priority (priority),
    INDEX idx_is_active (is_active),
    INDEX idx_effective_date (effective_date),

    FOREIGN KEY (created_by) REFERENCES admin_user(id),
    FOREIGN KEY (updated_by) REFERENCES admin_user(id)
);
```

### 9. waitlist_management Table

候补管理表，记录候补队列的运营处理信息。

```sql
CREATE TABLE waitlist_management (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL COMMENT '课程ID',
    course_schedule_id BIGINT NOT NULL COMMENT '课程安排ID',
    total_waitlist_count INT DEFAULT 0 COMMENT '候补总人数',
    current_round INT DEFAULT 1 COMMENT '当前通知轮次',
    last_notification_time DATETIME COMMENT '最后通知时间',
    next_notification_time DATETIME COMMENT '下次通知时间',
    deadline_time DATETIME COMMENT '截止时间',
    status ENUM('active', 'completed', 'cancelled', 'expired') DEFAULT 'active',
    admin_notes TEXT COMMENT '运营备注',
    auto_processed BOOLEAN DEFAULT FALSE COMMENT '是否自动处理',
    conflict_resolution JSON COMMENT '冲突解决方案',
    success_count INT DEFAULT 0 COMMENT '成功转化人数',
    expired_count INT DEFAULT 0 COMMENT '过期未确认人数',
    cancelled_count INT DEFAULT 0 COMMENT '取消人数',
    admin_user_id INT COMMENT '负责人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_course_id (course_id),
    INDEX idx_course_schedule_id (course_schedule_id),
    INDEX idx_status (status),
    INDEX idx_next_notification (next_notification_time),
    INDEX idx_deadline (deadline_time),

    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (course_schedule_id) REFERENCES course_schedules(id),
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id)
);
```

### 10. private_class_inquiry Table

私教课咨询记录表，记录用户私教课咨询行为和跟进状态。

```sql
CREATE TABLE private_class_inquiry (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    student_profile_id BIGINT COMMENT '学员档案ID',
    inquiry_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '咨询时间',
    inquiry_channel ENUM('phone', 'wechat', 'email', 'offline', 'website') NOT NULL,
    inquiry_content TEXT COMMENT '咨询内容',
    preferred_coach_id INT COMMENT '首选教练ID',
    preferred_time VARCHAR(200) COMMENT '期望时间',
    budget_range VARCHAR(100) COMMENT '预算范围',
    special_requirements TEXT COMMENT '特殊要求',
    follow_up_status ENUM('new', 'contacted', 'quoted', 'booked', 'lost') DEFAULT 'new',
    admin_user_id INT COMMENT '跟进运营ID',
    next_follow_up_time DATETIME COMMENT '下次跟进时间',
    quote_amount DECIMAL(10,2) COMMENT '报价金额',
    quote_notes TEXT COMMENT '报价备注',
    conversion_result ENUM('pending', 'converted', 'not_converted', 'postponed') COMMENT '转化结果',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_student_profile_id (student_profile_id),
    INDEX idx_inquiry_time (inquiry_time),
    INDEX idx_follow_up_status (follow_up_status),
    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_next_follow_up (next_follow_up_time),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (preferred_coach_id) REFERENCES admin_user(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id) ON DELETE SET NULL
);
```

### 11. makeup_compensation Table

补课补偿管理表，记录补课课时补偿的发放和使用情况。

```sql
CREATE TABLE makeup_compensation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    student_profile_id BIGINT NOT NULL COMMENT '学员档案ID',
    original_booking_id BIGINT COMMENT '原预约ID',
    compensation_type ENUM('cancellation', 'coach_absent', 'facility_issue', 'other') NOT NULL,
    compensation_minutes INT NOT NULL COMMENT '补偿时长（分钟）',
    used_minutes INT DEFAULT 0 COMMENT '已使用时长',
    remaining_minutes INT GENERATED ALWAYS AS (compensation_minutes - used_minutes) STORED,
    status ENUM('active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    reason VARCHAR(500) NOT NULL COMMENT '补偿原因',
    admin_user_id INT NOT NULL COMMENT '发放人ID',
    approved_by INT COMMENT '审批人ID',
    expiry_date DATETIME NOT NULL COMMENT '到期时间',
    used_bookings JSON COMMENT '使用的预约记录',
    usage_notes TEXT COMMENT '使用备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME COMMENT '使用时间',
    expired_at DATETIME COMMENT '过期时间',

    INDEX idx_user_id (user_id),
    INDEX idx_student_profile_id (student_profile_id),
    INDEX idx_original_booking_id (original_booking_id),
    INDEX idx_status (status),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_admin_user_id (admin_user_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id),
    FOREIGN KEY (original_booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id),
    FOREIGN KEY (approved_by) REFERENCES admin_user(id)
);
```

## 实体关系

### Relationship Diagram

```
admin_user (1) -----> (N) admin_session
      |
      |
      v
admin_operation_log (N) -----> (1) admin_user

users (1) -----> (N) trial_class_follow_up -----> (1) admin_user
  |                                           |
  |                                           v
  v                               trial_class_follow_up (N)
student_profiles (1)                               |
  |                                           |
  |                                           v
  v                                   course_management (N)
user_reconciliation_record (N)                       |
  |                                           |
  |                                           v
  +-----------------------------------> attendance_records (N)

virtual_age_log (N) -----> (1) student_profiles
pricing_rule (N) -----> (1) admin_user
waitlist_management (N) -----> (1) admin_user
private_class_inquiry (N) -----> (1) admin_user
makeup_compensation (N) -----> (1) admin_user
```

### Key Relationships

1. **Admin User Management**: 管理员用户与会话、操作日志、业务数据的关系
2. **User Business Operations**: 用户与跟进、对账、出勤等业务数据的关系
3. **Course Related Data**: 课程与出勤、候补、私教咨询的关系
4. **Financial Operations**: 钱包调整、价格规则、补偿记录的关系

## 数据验证规则

### Admin User Validation
- `username` 必须唯一，长度3-50字符
- `password_hash` 使用bcrypt加密，最小长度8字符
- `role` 必须是预定义的四种角色之一
- `email` 格式验证（可选）
- `phone` 格式验证（可选）

### Operation Log Validation
- `action` 不能为空，必须是预定义的操作类型
- `target_type` 和 `target_id` 必须同时存在
- `risk_score` 范围0-100
- `execution_time_ms` 必须为正整数

### Financial Data Validation
- `amount` 精度必须是2位小数
- `balance_after` 必须等于 `balance_before + amount`
- `transaction_type` 必须是预定义类型
- `discount_rate` 范围0.0000-2.0000

### Time-based Data Validation
- `effective_date` 不能晚于 `expiry_date`
- `next_follow_up_time` 必须晚于当前时间
- `expiry_date` 必须晚于创建时间

## Indexing Strategy

### Primary Indexes
- 所有表都有自增主键
- 业务标识符的唯一约束

### Foreign Key Indexes
- 所有外键字段建立索引
- 复合索引优化常用查询

### Query Optimization Indexes
- 时间字段索引支持范围查询
- 状态字段索引支持过滤
- 用户相关索引支持用户数据查询

### Composite Indexes
```sql
-- 用户对账记录复合索引
CREATE INDEX idx_user_recon_user_type_date ON user_reconciliation_record(user_id, transaction_type, created_at);

-- 出勤记录复合索引
CREATE INDEX idx_attendance_schedule_date ON attendance_records(course_schedule_id, marked_at);

-- 跟进记录复合索引
CREATE INDEX idx_followup_status_admin ON trial_class_follow_up(follow_up_status, admin_user_id, next_follow_up_time);
```

## 数据迁移考虑

### Migration Scripts
1. 创建管理员用户和初始角色
2. 迁移现有用户操作数据到对账记录表
3. 设置初始价格规则和权限配置
4. 创建默认系统配置

### Rollback Strategy
1. 备份所有生产数据
2. 创建回滚脚本
3. 在测试环境验证回滚
4. 准备手动回退程序

## 性能考虑

### Read Patterns
- 管理员登录和权限验证（高频）
- 用户对账记录查询（高频）
- 出勤记录标记（高峰期高频）
- 数据统计报表（中频）

### Write Patterns
- 操作日志记录（高频）
- 出勤状态更新（高峰期高频）
- 钱包调整操作（中频）
- 跟进状态更新（中频）

### Caching Strategy
- 管理员会话缓存
- 用户权限缓存
- 价格规则缓存
- 统计数据缓存（短期）

## 安全考虑

### Data Encryption
- 管理员密码bcrypt加密
- 敏感操作日志加密
- 个人信息字段加密
- 文件上传安全检查

### Access Control
- 基于角色的权限控制
- API接口权限验证
- 数据行级权限控制
- 操作审计跟踪

### Audit Trail
- 所有数据修改记录
- 敏感操作详细日志
- 登录行为跟踪
- 异常行为监控

## Data Retention Policies

### 操作日志
- 管理员操作日志：保留2年
- 登录日志：保留6个月
- 会话记录：保留30天

### 业务数据
- 对账记录：永久保留
- 出勤记录：永久保留
- 跟进记录：保留2年
- 咨询记录：保留1年

### 系统数据
- 临时文件：保留7天
- 日志文件：保留3个月
- 备份数据：按备份策略

## Analytics and Reporting

### 用户分析
- 用户注册和活跃度统计
- 用户消费行为分析
- 用户生命周期价值分析
- 用户流失预警

### 业务分析
- 课程预约和出勤分析
- 收入和利润分析
- 转化率分析
- 教练绩效分析

### 运营分析
- 运营操作效率分析
- 跟进转化率分析
- 客户满意度分析
- 异常操作监控
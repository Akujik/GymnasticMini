# 实施计划：007-admin-dashboard

**功能分支**: `007-admin-dashboard`
**创建时间**: 2025-11-03
**状态**: 草稿
**MVP**: 7
**依赖关系**: MVP-1 (001-user-identity-system), MVP-5 (005-payment-integration), MVP-6 (006-wallet-system)
**输入**: 构建一个全面的运营管理后台，包括用户管理、钱包调整、课程管理、数据分析和简化的支付记录审计日志。

## 概述

本计划概述了全面运营管理Web后台的实施。系统将提供基于角色的访问控制、用户管理、钱包调整、课程管理、出勤跟踪、数据分析以及全面的审计日志功能。

## 架构设计

### 技术栈
- **前端**: React.js with TypeScript + Ant Design
- **后端**: FastAPI with Python
- **数据库**: MySQL with SQLAlchemy ORM
- **认证**: JWT with bcrypt密码哈希
- **UI框架**: Ant Design Pro for 管理界面
- **图表**: Apache ECharts for 数据可视化
- **文件导出**: Excel.js for 数据导出功能

### 系统组件
1. **认证服务**: 登录、登出、会话管理
2. **授权服务**: 基于角色的访问控制 (RBAC)
3. **用户管理服务**: 用户操作和数据管理
4. **钱包管理服务**: 余额调整和交易跟踪
5. **课程管理服务**: 课程CRUD和排程
6. **分析服务**: 数据聚合和可视化
7. **审计服务**: 全面日志和监控
8. **通知服务**: 系统告警和提醒

## 实施阶段

### 阶段1：核心基础设施 (4天)
- 管理员用户认证系统
- 基于角色的访问控制实施
- 基础UI框架和路由
- 审计日志基础设施
- 安全中间件设置

### 阶段2：用户管理 (4天)
- 用户列表和搜索功能
- 带钱包信息的用户详情页
- 对账记录管理
- 预约历史管理
- 用户状态管理 (冻结/解冻)

### 阶段3：钱包和调整系统 (3天)
- 钱包余额调整界面
- 交易历史显示
- 带验证的调整表单
- 收据管理工作流
- 财务报告功能

### 阶段4：课程管理 (3天)
- 课程CRUD操作
- 课程排程界面
- 教练分配和管理
- 出勤跟踪系统
- 课程分析和报告

### 阶段5：分析和报告 (4天)
- 带关键指标的仪表板
- 收入和用户分析
- 数据可视化图表
- Excel导出功能
- 实时数据刷新

### 阶段6：高级功能 (3天)
- 体验课跟进系统
- 客户标签和虚拟年龄管理
- 价格规则管理
- 候补管理
- 私教课和补课补偿

## 数据库设计

### Core Admin Tables

#### admin_user Table
```sql
CREATE TABLE admin_user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'operator', 'coach', 'finance') NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    permissions JSON,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login_at DATETIME,
    login_count INT DEFAULT 0,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### admin_operation_log Table
```sql
CREATE TABLE admin_operation_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT NOT NULL,
    session_id VARCHAR(128),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    browser_info VARCHAR(200),
    os_info VARCHAR(100),
    location_country VARCHAR(50),
    location_city VARCHAR(100),
    risk_score INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_risk_score (risk_score)
);
```

#### admin_session Table
```sql
CREATE TABLE admin_session (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT NOT NULL,
    session_token VARCHAR(128) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at)
);
```

### Business Logic Tables

#### trial_class_follow_up Table
```sql
CREATE TABLE trial_class_follow_up (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    student_profile_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    booking_id BIGINT NOT NULL,
    follow_up_status ENUM('pending', 'contacted', 'not_interested', 'converted', 'lost') DEFAULT 'pending',
    contact_time DATETIME,
    contact_result ENUM('interested', 'considering', 'not_interested', 'no_response'),
    next_follow_up_time DATETIME,
    notes TEXT,
    conversion_probability INT DEFAULT 0,
    admin_user_id INT NOT NULL,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    tags JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_status (follow_up_status),
    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_priority (priority),
    INDEX idx_next_follow_up (next_follow_up_time)
);
```

#### user_reconciliation_record Table
```sql
CREATE TABLE user_reconciliation_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    student_profile_id BIGINT,
    booking_id BIGINT,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type ENUM('recharge', 'consume', 'adjustment', 'refund') NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    external_order_no VARCHAR(100),
    note TEXT,
    admin_user_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_profile_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    INDEX idx_amount (amount)
);
```

#### attendance_records Table
```sql
CREATE TABLE attendance_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    course_schedule_id BIGINT NOT NULL,
    student_profile_id BIGINT NOT NULL,
    status ENUM('attended', 'absent', 'leave', 'late') NOT NULL DEFAULT 'absent',
    marked_by INT NOT NULL COMMENT 'Coach admin ID',
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_in_time DATETIME,
    check_out_time DATETIME,
    actual_duration INT COMMENT 'Actual minutes attended',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_booking_student (booking_id, student_profile_id),
    INDEX idx_course_schedule (course_schedule_id),
    INDEX idx_student_id (student_profile_id),
    INDEX idx_marked_by (marked_by),
    INDEX idx_status (status),
    INDEX idx_marked_at (marked_at)
);
```

## UI/UX Design

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header: Logo | Navigation | User Menu | Notifications    │
├─────────────────────────────────────────────────────────┤
│ Sidebar                │ Main Content Area             │
│ - Dashboard            │ ┌─────────────────────────────┐│
│ - User Management      │ │ Page Content                 ││
│ - Wallet Management    │ │                             ││
│ - Course Management    │ │                             ││
│ - Attendance           │ │                             ││
│ - Analytics            │ │                             ││
│ - Follow-up            │ │                             ││
│ - Settings             │ └─────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Key Pages

#### 1. Dashboard Page
- KPI cards with key metrics
- Revenue trend charts
- User growth visualization
- Recent activities feed
- Quick action buttons

#### 2. User Management Page
- User search and filtering
- User list with status indicators
- User detail modal with tabs:
  - Basic Information
  - Wallet & Transactions
  - Booking History
  - Follow-up Records

#### 3. Wallet Adjustment Modal
- Adjustment form with validation
- Real-time balance preview
- Payment method selection
- Receipt upload functionality
- Adjustment history

#### 4. Course Management Page
- Course list with status
- Course creation/editing form
- Coach assignment interface
- Schedule management
- Attendance tracking

## Security Considerations

### Authentication Security
- bcrypt password hashing with salt
- Session management with JWT tokens
- Automatic session timeout (30 minutes)
- Failed login attempt tracking
- Account lockout after 5 failed attempts

### Authorization Security
- Role-based access control (RBAC)
- Permission-based feature access
- Route-level authorization checks
- API endpoint protection
- Sensitive operation double confirmation

### Data Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure file upload handling

### Audit Security
- Comprehensive operation logging
- IP address tracking
- User agent logging
- Risk scoring for suspicious activities
- Immutable audit trail

## Performance Considerations

### Database Optimization
- Proper indexing strategy
- Query optimization
- Connection pooling
- Read replicas for analytics queries
- Database query caching

### Frontend Optimization
- Code splitting and lazy loading
- Component memoization
- Virtual scrolling for large lists
- Image optimization
- Bundle size optimization

### API Performance
- Response caching where appropriate
- Pagination for large datasets
- Compression for API responses
- Rate limiting
- Request validation

## Risk Assessment

### High Risk
- Security vulnerabilities in authentication
- Data integrity issues in financial operations
- Performance bottlenecks with large datasets
- Complex role-based access control implementation

### Medium Risk
- UI/UX complexity affecting usability
- Integration issues with existing systems
- Data migration challenges
- User training and adoption

### Low Risk
- Browser compatibility issues
- Minor UI inconsistencies
- Documentation completeness
- Testing coverage gaps

## Testing Strategy

### Unit Testing
- Authentication and authorization logic
- Business logic validation
- Data transformation functions
- API endpoint handlers
- Database operations

### Integration Testing
- Frontend-backend integration
- Database integration
- Third-party service integration
- Authentication flow testing
- File upload/download testing

### End-to-End Testing
- Complete user workflows
- Critical business scenarios
- Cross-browser compatibility
- Performance testing under load
- Security penetration testing

### User Acceptance Testing
- Operations staff workflow testing
- Coach attendance marking testing
- Finance user access testing
- Admin user management testing
- Reporting accuracy validation

## Deployment Plan

### Staging Environment
- Full system integration testing
- Performance testing with production-like data
- Security audit and penetration testing
- User acceptance testing with operations team

### Production Rollout
- Blue-green deployment strategy
- Database migration with rollback capability
- Feature flagging for gradual rollout
- Real-time monitoring and alerting
- Quick rollback procedures

## Success Criteria

- [ ] 99.5%+ authentication success rate
- [ ] <2 second average page load time
- [ ] 100% audit log coverage for sensitive operations
- [ ] Zero security vulnerabilities in penetration testing
- [ ] 95%+ user satisfaction score from operations team
- [ ] 100% accuracy in financial calculations
- [ ] Complete feature coverage for all user stories

## Post-Launch Considerations

### Monitoring and Maintenance
- Real-time performance monitoring
- Security monitoring and alerting
- Error tracking and reporting
- User behavior analytics
- System health checks

### Training and Documentation
- Comprehensive user documentation
- Video tutorials for common workflows
- Admin user training sessions
- FAQ and troubleshooting guides
- Best practices documentation

### Future Enhancements
- Mobile-responsive admin interface
- Advanced analytics and reporting
- Automated workflow features
- Integration with additional third-party systems
- Enhanced security features
# 数据模型：管理后台系统

**功能**: 007-admin-dashboard
**创建时间**: 2025-11-03
**版本**: v2.0.0 RuoYi架构重构
**重构日期**: 2025-11-17
**技术栈**: RuoYi-Vue-Pro + MyBatis-Plus + Redis + Spring Boot

## RuoYi-MyBatis-Plus 数据模型设计

### 概述

管理后台系统的数据模型采用RuoYi-Vue-Pro架构设计，基于MyBatis-Plus实现11表设计，实现管理员登录认证、用户管理、钱包调整、课程管理、数据分析、审计日志等完整的后台管理功能。系统严格遵循企业级安全标准，确保操作安全和数据准确性。

**RuoYi架构特性**：
- **MyBatis-Plus集成**: 使用LambdaQueryWrapper进行复杂查询优化
- **Redis缓存**: Spring Cache + @Cacheable注解优化管理后台性能
- **乐观锁机制**: @Version字段防止并发冲突
- **审计功能**: BaseEntity提供创建时间、更新时间等审计字段
- **数据权限**: 基于RuoYi的细粒度权限控制系统
- **安全加密**: BCrypt密码加密 + 敏感数据保护

### 1. gym_admin_user 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的管理员用户表，存储后台登录用户信息和权限。

```sql
CREATE TABLE `gym_admin_user` (
  `admin_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'BCrypt密码哈希',
  `role` VARCHAR(20) NOT NULL DEFAULT 'admin' COMMENT '角色(admin/operator/coach/finance)',
  `name` VARCHAR(100) NOT NULL COMMENT '真实姓名',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱地址',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号码',
  `avatar_url` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `department` VARCHAR(100) DEFAULT NULL COMMENT '部门',
  `position` VARCHAR(100) DEFAULT NULL COMMENT '职位',
  `status` CHAR(1) NOT NULL DEFAULT '0' COMMENT '状态(0正常 1停用 2锁定)',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP',
  `login_count` INT(11) DEFAULT 0 COMMENT '登录次数',
  `failed_login_attempts` INT(11) DEFAULT 0 COMMENT '连续登录失败次数',
  `locked_until` DATETIME DEFAULT NULL COMMENT '账户锁定到期时间',
  `password_changed_at` DATETIME DEFAULT NULL COMMENT '密码修改时间',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`),
  KEY `idx_last_login` (`last_login_at`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员用户表';
```

**MyBatis-Plus实体类**：
```java
@Data
@TableName("gym_admin_user")
@Accessors(chain = true)
public class GymAdminUser extends BaseEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "admin_id", type = IdType.AUTO)
    private Long adminId;

    @TableField("username")
    private String username;

    @TableField("password_hash")
    private String passwordHash;

    @TableField("role")
    private String role; // admin/operator/coach/finance

    @TableField("name")
    private String name;

    @TableField("email")
    private String email;

    @TableField("phone")
    private String phone;

    @TableField("avatar_url")
    private String avatarUrl;

    @TableField("department")
    private String department;

    @TableField("position")
    private String position;

    @TableField("status")
    private String status; // 0正常 1停用 2锁定

    @TableField("last_login_at")
    private LocalDateTime lastLoginAt;

    @TableField("last_login_ip")
    private String lastLoginIp;

    @TableField("login_count")
    private Integer loginCount;

    @TableField("failed_login_attempts")
    private Integer failedLoginAttempts;

    @TableField("locked_until")
    private LocalDateTime lockedUntil;

    @Version
    @TableField("version")
    private Integer version;

    @TableField("del_flag")
    private String delFlag;
}
```

**Fields Description**:
- `role`: 单一角色 - admin(管理员)，拥有完整管理权限
- `locked_until`: 账户锁定时间，用于防暴力破解
- `password_changed_at`: 密码最后修改时间，用于强制密码更新

### 2. gym_admin_session 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的管理员会话表，跟踪登录会话和安全性。

```sql
CREATE TABLE `gym_admin_session` (
  `session_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `admin_user_id` BIGINT(20) NOT NULL COMMENT '管理员ID',
  `session_token` VARCHAR(128) NOT NULL COMMENT 'JWT会话令牌',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '登录IP地址',
  `user_agent` TEXT DEFAULT NULL COMMENT '用户代理字符串',
  `browser_info` VARCHAR(200) DEFAULT NULL COMMENT '浏览器信息',
  `os_info` VARCHAR(100) DEFAULT NULL COMMENT '操作系统信息',
  `location_country` VARCHAR(50) DEFAULT NULL COMMENT '所在国家',
  `location_city` VARCHAR(100) DEFAULT NULL COMMENT '所在城市',
  `is_active` CHAR(1) NOT NULL DEFAULT '1' COMMENT '会话是否活跃(0否 1是)',
  `expires_at` DATETIME NOT NULL COMMENT '会话过期时间',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `uk_session_token` (`session_token`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_ip_address` (`ip_address`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_admin_session_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `gym_admin_user` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员会话表';
```

**MyBatis-Plus实体类**：
```java
@Data
@TableName("gym_admin_session")
@Accessors(chain = true)
public class GymAdminSession extends BaseEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "session_id", type = IdType.AUTO)
    private Long sessionId;

    @TableField("admin_user_id")
    private Long adminUserId;

    @TableField("session_token")
    private String sessionToken;

    @TableField("ip_address")
    private String ipAddress;

    @TableField("user_agent")
    private String userAgent;

    @TableField("browser_info")
    private String browserInfo;

    @TableField("os_info")
    private String osInfo;

    @TableField("location_country")
    private String locationCountry;

    @TableField("location_city")
    private String locationCity;

    @TableField("is_active")
    private String isActive; // 0否 1是

    @TableField("expires_at")
    private LocalDateTime expiresAt;

    @Version
    @TableField("version")
    private Integer version;

    @TableField("del_flag")
    private String delFlag;
}
```

### 3. gym_admin_operation_log 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的管理员操作日志表，记录所有后台操作的详细日志。

```sql
CREATE TABLE `gym_admin_operation_log` (
  `log_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `admin_user_id` BIGINT(20) NOT NULL COMMENT '管理员ID',
  `session_id` VARCHAR(128) DEFAULT NULL COMMENT '会话ID',
  `action` VARCHAR(100) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50) NOT NULL COMMENT '目标对象类型',
  `target_id` BIGINT(20) NOT NULL COMMENT '目标对象ID',
  `target_name` VARCHAR(200) DEFAULT NULL COMMENT '目标对象名称',
  `details` TEXT DEFAULT NULL COMMENT '操作详细信息',
  `old_values` TEXT DEFAULT NULL COMMENT '操作前的值',
  `new_values` TEXT DEFAULT NULL COMMENT '操作后的值',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` TEXT DEFAULT NULL COMMENT '用户代理',
  `browser_info` VARCHAR(200) DEFAULT NULL COMMENT '浏览器信息',
  `os_info` VARCHAR(100) DEFAULT NULL COMMENT '操作系统信息',
  `location_country` VARCHAR(50) DEFAULT NULL COMMENT '所在国家',
  `location_city` VARCHAR(100) DEFAULT NULL COMMENT '所在城市',
  `risk_score` INT(11) DEFAULT 0 COMMENT '风险评分',
  `success` CHAR(1) NOT NULL DEFAULT '1' COMMENT '操作是否成功(0否 1是)',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `execution_time_ms` INT(11) DEFAULT 0 COMMENT '执行时间(毫秒)',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`log_id`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_action` (`action`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_risk_score` (`risk_score`),
  KEY `idx_success` (`success`),
  KEY `idx_ip_address` (`ip_address`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_admin_operation_log_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `gym_admin_user` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志表';
```

**RuoYi操作日志Service层示例**：
```java
@Service
@Log(title = "管理后台操作", businessType = BusinessType.OTHER)
@Slf4j
public class GymAdminOperationLogServiceImpl extends ServiceImpl<GymAdminOperationLogMapper, GymAdminOperationLog>
    implements IGymAdminOperationLogService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean recordOperation(Long adminUserId, String sessionToken, String action,
                                     String targetType, Long targetId, String targetName,
                                     String details, String oldValues, String newValues,
                                     String ipAddress, String userAgent) {
        GymAdminOperationLog log = new GymAdminOperationLog();
        log.setAdminUserId(adminUserId);
        log.setSessionId(sessionToken);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setTargetName(targetName);
        log.setDetails(details);
        log.setOldValues(oldValues);
        log.setNewValues(newValues);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        log.setCreateTime(LocalDateTime.now());

        return this.save(log);
    }
}
```

### 4. gym_trial_class_follow_up 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的体验课跟进表，记录体验课用户的跟进状态和转化情况。

```sql
CREATE TABLE `gym_trial_class_follow_up` (
  `follow_up_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '跟进ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `student_profile_id` BIGINT(20) NOT NULL COMMENT '学员档案ID',
  `course_id` BIGINT(20) NOT NULL COMMENT '课程ID',
  `booking_id` BIGINT(20) NOT NULL COMMENT '预约ID',
  `follow_up_status` CHAR(1) NOT NULL DEFAULT '0' COMMENT '跟进状态(0待跟进 1已联系 2无兴趣 3已转化 4已流失)',
  `contact_time` DATETIME DEFAULT NULL COMMENT '联系时间',
  `contact_result` CHAR(1) DEFAULT NULL COMMENT '跟进结果(0有兴趣 1考虑中 2无兴趣 3无响应)',
  `next_follow_up_time` DATETIME DEFAULT NULL COMMENT '下次跟进时间',
  `notes` TEXT COMMENT '跟进备注',
  `conversion_probability` INT(11) DEFAULT 0 COMMENT '转化概率(0-100)',
  `admin_user_id` BIGINT(20) NOT NULL COMMENT '跟进人ID',
  `priority` CHAR(1) NOT NULL DEFAULT '1' COMMENT '优先级(0高 1中 2低)',
  `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签(JSON格式)',
  `source_channel` VARCHAR(100) DEFAULT NULL COMMENT '来源渠道',
  `estimated_budget` DECIMAL(10,2) DEFAULT NULL COMMENT '预估预算',
  `competitor_info` VARCHAR(500) DEFAULT NULL COMMENT '竞品信息',
  `parent_concerns` TEXT COMMENT '家长关注点',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`follow_up_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_student_profile_id` (`student_profile_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_follow_up_status` (`follow_up_status`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  KEY `idx_priority` (`priority`),
  KEY `idx_next_follow_up_time` (`next_follow_up_time`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_trial_follow_up_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`),
  CONSTRAINT `fk_trial_follow_up_student` FOREIGN KEY (`student_profile_id`) REFERENCES `gym_student_profile` (`profile_id`),
  CONSTRAINT `fk_trial_follow_up_course` FOREIGN KEY (`course_id`) REFERENCES `gym_course` (`course_id`),
  CONSTRAINT `fk_trial_follow_up_booking` FOREIGN KEY (`booking_id`) REFERENCES `gym_booking` (`booking_id`),
  CONSTRAINT `fk_trial_follow_up_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `gym_admin_user` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='体验课跟进表';
```

**RuoYi实体类设计**：
```java
@Data
@TableName("gym_trial_class_follow_up")
public class GymTrialClassFollowUp extends BaseEntity {

    @TableId(value = "follow_up_id", type = IdType.AUTO)
    private Long followUpId;

    @TableField("user_id")
    private Long userId;

    @TableField("student_profile_id")
    private Long studentProfileId;

    @TableField("course_id")
    private Long courseId;

    @TableField("booking_id")
    private Long bookingId;

    @TableField("follow_up_status")
    private String followUpStatus; // 0待跟进 1已联系 2无兴趣 3已转化 4已流失

    @TableField("contact_time")
    private LocalDateTime contactTime;

    @TableField("contact_result")
    private String contactResult; // 0有兴趣 1考虑中 2无兴趣 3无响应

    @TableField("next_follow_up_time")
    private LocalDateTime nextFollowUpTime;

    @TableField("notes")
    private String notes;

    @TableField("conversion_probability")
    private Integer conversionProbability;

    @TableField("admin_user_id")
    private Long adminUserId;

    @TableField("priority")
    private String priority; // 0高 1中 2低

    @Version
    @TableField("version")
    private Integer version;

    @TableField("del_flag")
    private String delFlag;
}
```

### 5. gym_user_reconciliation_record 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的用户消课对账记录表，记录用户的充值和消课交易历史。

```sql
CREATE TABLE `gym_user_reconciliation_record` (
  `reconciliation_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '对账ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `student_profile_id` BIGINT(20) DEFAULT NULL COMMENT '学员档案ID（可为空，如充值记录）',
  `booking_id` BIGINT(20) DEFAULT NULL COMMENT '预约ID（可为空，如调整记录）',
  `payment_order_id` BIGINT(20) DEFAULT NULL COMMENT '支付订单ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '交易金额（正数表示充值，负数表示扣费）',
  `transaction_type` CHAR(1) NOT NULL COMMENT '交易类型(0充值 1消费 2调整 3退款)',
  `balance_after` DECIMAL(10,2) NOT NULL COMMENT '交易后余额',
  `payment_method` VARCHAR(50) DEFAULT NULL COMMENT '支付方式',
  `external_order_no` VARCHAR(100) DEFAULT NULL COMMENT '外部订单号',
  `note` TEXT COMMENT '交易备注或说明',
  `admin_user_id` BIGINT(20) DEFAULT NULL COMMENT '操作管理员ID（调整类交易）',
  `transaction_category` VARCHAR(100) DEFAULT NULL COMMENT '交易分类',
  `related_course_name` VARCHAR(200) DEFAULT NULL COMMENT '关联课程名称',
  `refund_reason` VARCHAR(500) DEFAULT NULL COMMENT '退款原因',
  `processed_time` DATETIME DEFAULT NULL COMMENT '处理时间',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`reconciliation_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_student_profile_id` (`student_profile_id`),
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_payment_order_id` (`payment_order_id`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_amount` (`amount`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  CONSTRAINT `fk_reconciliation_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`),
  CONSTRAINT `fk_reconciliation_student` FOREIGN KEY (`student_profile_id`) REFERENCES `gym_student_profile` (`profile_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reconciliation_booking` FOREIGN KEY (`booking_id`) REFERENCES `gym_booking` (`booking_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reconciliation_payment` FOREIGN KEY (`payment_order_id`) REFERENCES `gym_payment_order` (`payment_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reconciliation_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `gym_admin_user` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户消课对账记录表';
```

**RuoYi对账记录Service层示例**：
```java
@Service
@Log(title = "用户对账记录", businessType = BusinessType.OTHER)
@Slf4j
public class GymUserReconciliationRecordServiceImpl extends ServiceImpl<GymUserReconciliationRecordMapper, GymUserReconciliationRecord>
    implements IGymUserReconciliationRecordService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean createReconciliationRecord(GymUserReconciliationRecordDTO recordDTO) {
        // 1. 验证金额和余额
        // 2. 记录对账信息
        // 3. 更新用户余额
        GymUserReconciliationRecord record = new GymUserReconciliationRecord();
        BeanUtils.copyProperties(recordDTO, record);
        record.setCreateBy(SecurityUtils.getUsername());
        record.setCreateTime(LocalDateTime.now());

        return this.save(record);
    }
}
```

### 6. gym_attendance_record 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的出勤记录表，记录学员的出勤状态和详细信息。

```sql
CREATE TABLE `gym_attendance_record` (
  `attendance_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '出勤ID',
  `booking_id` BIGINT(20) NOT NULL COMMENT '预约ID',
  `course_schedule_id` BIGINT(20) NOT NULL COMMENT '课程安排ID',
  `student_profile_id` BIGINT(20) NOT NULL COMMENT '学员档案ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `status` CHAR(1) NOT NULL DEFAULT '1' COMMENT '出勤状态(0已出勤 1缺席 2请假 3迟到 4早退)',
  `marked_by` BIGINT(20) NOT NULL COMMENT '标记人（教练管理员ID）',
  `marked_at` DATETIME DEFAULT NULL COMMENT '标记时间',
  `check_in_time` DATETIME DEFAULT NULL COMMENT '签到时间',
  `check_out_time` DATETIME DEFAULT NULL COMMENT '签退时间',
  `actual_duration` INT(11) DEFAULT NULL COMMENT '实际出勤时长（分钟）',
  `planned_duration` INT(11) DEFAULT NULL COMMENT '计划时长（分钟）',
  `note` TEXT COMMENT '备注',
  `attendance_score` INT(11) DEFAULT 0 COMMENT '出勤评分',
  `performance_notes` TEXT COMMENT '表现评价',
  `parent_feedback` TEXT COMMENT '家长反馈',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uk_booking_student` (`booking_id`, `student_profile_id`),
  KEY `idx_course_schedule_id` (`course_schedule_id`),
  KEY `idx_student_profile_id` (`student_profile_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_marked_by` (`marked_by`),
  KEY `idx_status` (`status`),
  KEY `idx_marked_at` (`marked_at`),
  KEY `idx_check_in_time` (`check_in_time`),
  CONSTRAINT `fk_attendance_booking` FOREIGN KEY (`booking_id`) REFERENCES `gym_booking` (`booking_id`),
  CONSTRAINT `fk_attendance_schedule` FOREIGN KEY (`course_schedule_id`) REFERENCES `gym_course_schedule` (`schedule_id`),
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_profile_id`) REFERENCES `gym_student_profile` (`profile_id`),
  CONSTRAINT `fk_attendance_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`),
  CONSTRAINT `fk_attendance_marker` FOREIGN KEY (`marked_by`) REFERENCES `gym_admin_user` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='出勤记录表';
```

**RuoYi出勤记录Service层示例**：
```java
@Service
@Log(title = "出勤记录管理", businessType = BusinessType.UPDATE)
@Slf4j
public class GymAttendanceRecordServiceImpl extends ServiceImpl<GymAttendanceRecordMapper, GymAttendanceRecord>
    implements IGymAttendanceRecordService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean markAttendance(Long bookingId, Long studentProfileId, String status, String note) {
        // 1. 检查预约和学员信息
        // 2. 记录出勤状态
        // 3. 记录操作日志
        GymAttendanceRecord attendance = new GymAttendanceRecord();
        attendance.setBookingId(bookingId);
        attendance.setStudentProfileId(studentProfileId);
        attendance.setStatus(status);
        attendance.setMarkedBy(SecurityUtils.getUserId());
        attendance.setMarkedBy(LocalDateTime.now());
        attendance.setNote(note);

        return this.save(attendance);
    }
}
```

### 7. gym_virtual_age_log 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的虚拟年龄变更记录表，追踪虚拟年龄设置的历史变更。

```sql
CREATE TABLE `gym_virtual_age_log` (
  `log_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '虚拟年龄日志ID',
  `student_profile_id` BIGINT(20) NOT NULL COMMENT '学员档案ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `old_virtual_age` INT(11) DEFAULT NULL COMMENT '原虚拟年龄',
  `new_virtual_age` INT(11) DEFAULT NULL COMMENT '新虚拟年龄',
  `actual_age` INT(11) DEFAULT NULL COMMENT '实际年龄',
  `age_difference` INT(11) DEFAULT NULL COMMENT '年龄差值',
  `change_reason` VARCHAR(500) NOT NULL COMMENT '变更原因',
  `change_type` CHAR(1) NOT NULL COMMENT '变更类型(0自动审批 1手动审批 2教练申请 3家长申请)',
  `admin_user_id` BIGINT(20) DEFAULT NULL COMMENT '审核管理员ID',
  `coach_id` BIGINT(20) DEFAULT NULL COMMENT '申请教练ID',
  `supporting_documents` TEXT DEFAULT NULL COMMENT '支持文档(JSON格式)',
  `approval_notes` TEXT DEFAULT NULL COMMENT '审批备注',
  `effective_date` DATE DEFAULT NULL COMMENT '生效日期',
  `expiry_date` DATE DEFAULT NULL COMMENT '到期日期',
  `status` CHAR(1) DEFAULT '0' COMMENT '状态(0待审批 1已通过 2已拒绝 3已过期)',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`log_id`),
  KEY `idx_student_profile_id` (`student_profile_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_effective_date` (`effective_date`),
  CONSTRAINT `fk_virtual_age_student` FOREIGN KEY (`student_profile_id`) REFERENCES `gym_student_profile` (`profile_id`),
  CONSTRAINT `fk_virtual_age_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`),
  CONSTRAINT `fk_virtual_age_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `gym_admin_user` (`admin_id`),
  CONSTRAINT `fk_virtual_age_coach` FOREIGN KEY (`coach_id`) REFERENCES `gym_admin_user` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟年龄变更记录表';
```

**RuoYi虚拟年龄Service层示例**：
```java
@Service
@Log(title = "虚拟年龄管理", businessType = BusinessType.UPDATE)
@Slf4j
public class GymVirtualAgeLogServiceImpl extends ServiceImpl<GymVirtualAgeLogMapper, GymVirtualAgeLog>
    implements IGymVirtualAgeLogService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean createVirtualAgeChange(GymVirtualAgeLogDTO virtualAgeDTO) {
        // 1. 验证年龄变更的合理性
        // 2. 记录变更日志
        // 3. 更新学员档案中的虚拟年龄
        GymVirtualAgeLog log = new GymVirtualAgeLog();
        BeanUtils.copyProperties(virtualAgeDTO, log);
        log.setCreateBy(SecurityUtils.getUsername());
        log.setCreateTime(LocalDateTime.now());

        return this.save(log);
    }
}
```

### 8. gym_pricing_rule 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的价格规则表，存储多维度的定价规则。

```sql
CREATE TABLE `gym_pricing_rule` (
  `rule_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '价格规则ID',
  `rule_name` VARCHAR(200) NOT NULL COMMENT '规则名称',
  `rule_code` VARCHAR(100) NOT NULL COMMENT '规则编码',
  `customer_type` CHAR(1) NOT NULL COMMENT '客户类型(0新用户 1老用户 2朋友 3VIP)',
  `audience_type` CHAR(1) NOT NULL COMMENT '受众类型(0儿童 1成人)',
  `course_type` CHAR(1) NOT NULL COMMENT '课程类型(0团课 1长期课 2私教1v1 3私教1v2 4私教1v3 5体验课 6训练营)',
  `level_range` VARCHAR(100) DEFAULT NULL COMMENT '等级范围（如：L1-L4）',
  `min_level` INT(11) DEFAULT NULL COMMENT '最低等级',
  `max_level` INT(11) DEFAULT NULL COMMENT '最高等级',
  `hourly_price` DECIMAL(10,2) DEFAULT NULL COMMENT '小时单价',
  `discount_rate` DECIMAL(5,4) DEFAULT 1.0000 COMMENT '折扣率',
  `fixed_price` DECIMAL(10,2) DEFAULT NULL COMMENT '固定价格',
  `priority` INT(11) DEFAULT 0 COMMENT '优先级（数字越大优先级越高）',
  `conditions` TEXT DEFAULT NULL COMMENT '额外条件(JSON格式)',
  `special_tags` TEXT DEFAULT NULL COMMENT '特殊标签(JSON格式)',
  `is_active` CHAR(1) DEFAULT '1' COMMENT '是否启用(0否 1是)',
  `effective_date` DATE DEFAULT NULL COMMENT '生效日期',
  `expiry_date` DATE DEFAULT NULL COMMENT '到期日期',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`rule_id`),
  UNIQUE KEY `uk_rule_code` (`rule_code`),
  KEY `idx_customer_type` (`customer_type`),
  KEY `idx_audience_type` (`audience_type`),
  KEY `idx_course_type` (`course_type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_effective_date` (`effective_date`),
  CONSTRAINT `fk_pricing_rule_creator` FOREIGN KEY (`create_by`) REFERENCES `sys_user` (`user_name`),
  CONSTRAINT `fk_pricing_rule_updater` FOREIGN KEY (`update_by`) REFERENCES `sys_user` (`user_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格规则表';
```

**RuoYi价格规则Service层示例**：
```java
@Service
@Log(title = "价格规则管理", businessType = BusinessType.INSERT)
@Slf4j
public class GymPricingRuleServiceImpl extends ServiceImpl<GymPricingRuleMapper, GymPricingRule>
    implements IGymPricingRuleService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean createPricingRule(GymPricingRuleDTO ruleDTO) {
        // 1. 验证规则编码唯一性
        // 2. 检查价格合理性
        // 3. 保存价格规则
        GymPricingRule rule = new GymPricingRule();
        BeanUtils.copyProperties(ruleDTO, rule);
        rule.setCreateBy(SecurityUtils.getUsername());
        rule.setCreateTime(LocalDateTime.now());

        return this.save(rule);
    }

    @Override
    @Cacheable(value = "pricingRules", key = "#courseType + '_' + #customerType + '_' + #audienceType")
    public List<GymPricingRule> getEffectiveRules(String courseType, String customerType, String audienceType) {
        LambdaQueryWrapper<GymPricingRule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymPricingRule::getCourseType, courseType)
               .eq(GymPricingRule::getCustomerType, customerType)
               .eq(GymPricingRule::getAudienceType, audienceType)
               .eq(GymPricingRule::getIsActive, "1")
               .orderByDesc(GymPricingRule::getPriority);

        return this.list(wrapper);
    }
}
```

### 9. gym_waitlist_management 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的候补管理表，记录候补队列的运营处理信息。

```sql
CREATE TABLE `gym_waitlist_management` (
  `waitlist_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '候补管理ID',
  `course_id` BIGINT(20) NOT NULL COMMENT '课程ID',
  `course_schedule_id` BIGINT(20) NOT NULL COMMENT '课程安排ID',
  `total_waitlist_count` INT(11) DEFAULT 0 COMMENT '候补总人数',
  `current_round` INT(11) DEFAULT 1 COMMENT '当前通知轮次',
  `last_notification_time` DATETIME DEFAULT NULL COMMENT '最后通知时间',
  `next_notification_time` DATETIME DEFAULT NULL COMMENT '下次通知时间',
  `deadline_time` DATETIME DEFAULT NULL COMMENT '截止时间',
  `status` CHAR(1) DEFAULT '0' COMMENT '状态(0活跃 1完成 2取消 3过期)',
  `admin_notes` TEXT COMMENT '运营备注',
  `auto_processed` CHAR(1) DEFAULT '0' COMMENT '是否自动处理(0否 1是)',
  `conflict_resolution` TEXT DEFAULT NULL COMMENT '冲突解决方案(JSON格式)',
  `success_count` INT(11) DEFAULT 0 COMMENT '成功转化人数',
  `expired_count` INT(11) DEFAULT 0 COMMENT '过期未确认人数',
  `cancelled_count` INT(11) DEFAULT 0 COMMENT '取消人数',
  `admin_user_id` BIGINT(20) DEFAULT NULL COMMENT '负责人ID',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`waitlist_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_course_schedule_id` (`course_schedule_id`),
  KEY `idx_status` (`status`),
  KEY `idx_next_notification_time` (`next_notification_time`),
  KEY `idx_deadline_time` (`deadline_time`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  CONSTRAINT `fk_waitlist_course` FOREIGN KEY (`course_id`) REFERENCES `gym_course` (`course_id`),
  CONSTRAINT `fk_waitlist_schedule` FOREIGN KEY (`course_schedule_id`) REFERENCES `gym_course_schedule` (`schedule_id`),
  CONSTRAINT `fk_waitlist_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `gym_admin_user` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='候补管理表';
```

**RuoYi候补管理Service层示例**：
```java
@Service
@Log(title = "候补队列管理", businessType = BusinessType.OTHER)
@Slf4j
public class GymWaitlistManagementServiceImpl extends ServiceImpl<GymWaitlistManagementMapper, GymWaitlistManagement>
    implements IGymWaitlistManagementService {

    @Override
    @Scheduled(fixedDelay = 300000) // 每5分钟执行一次
    public void processWaitlistNotifications() {
        // 1. 查询需要通知的候补队列
        LambdaQueryWrapper<GymWaitlistManagement> wrapper = new LambdaQueryWrapper<>();
        wrapper.le(GymWaitlistManagement::getNextNotificationTime, LocalDateTime.now())
               .eq(GymWaitlistManagement::getStatus, "0");

        List<GymWaitlistManagement> waitlists = this.list(wrapper);

        // 2. 批量处理候补通知
        for (GymWaitlistManagement waitlist : waitlists) {
            processWaitlistNotification(waitlist);
        }
    }

    private void processWaitlistNotification(GymWaitlistManagement waitlist) {
        // 发送候补通知逻辑
    }
}
```

### 10. gym_private_class_inquiry 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的私教课咨询记录表，记录用户私教课咨询行为和跟进状态。

```sql
CREATE TABLE `gym_private_class_inquiry` (
  `inquiry_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '咨询ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `student_profile_id` BIGINT(20) DEFAULT NULL COMMENT '学员档案ID',
  `inquiry_time` DATETIME DEFAULT NULL COMMENT '咨询时间',
  `inquiry_channel` CHAR(1) NOT NULL COMMENT '咨询渠道(0电话 1微信 2邮件 3线下 4网站)',
  `inquiry_content` TEXT COMMENT '咨询内容',
  `preferred_coach_id` BIGINT(20) DEFAULT NULL COMMENT '首选教练ID',
  `preferred_time` VARCHAR(200) DEFAULT NULL COMMENT '期望时间',
  `budget_range` VARCHAR(100) DEFAULT NULL COMMENT '预算范围',
  `special_requirements` TEXT COMMENT '特殊要求',
  `follow_up_status` CHAR(1) DEFAULT '0' COMMENT '跟进状态(0新建 1已联系 2已报价 3已预约 4流失)',
  `admin_user_id` BIGINT(20) DEFAULT NULL COMMENT '跟进运营ID',
  `next_follow_up_time` DATETIME DEFAULT NULL COMMENT '下次跟进时间',
  `quote_amount` DECIMAL(10,2) DEFAULT NULL COMMENT '报价金额',
  `quote_notes` TEXT DEFAULT NULL COMMENT '报价备注',
  `conversion_result` CHAR(1) DEFAULT NULL COMMENT '转化结果(0待定 1已转化 2未转化 3推迟)',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`inquiry_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_student_profile_id` (`student_profile_id`),
  KEY `idx_inquiry_time` (`inquiry_time`),
  KEY `idx_follow_up_status` (`follow_up_status`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  KEY `idx_next_follow_up_time` (`next_follow_up_time`),
  CONSTRAINT `fk_private_inquiry_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`),
  CONSTRAINT `fk_private_inquiry_student` FOREIGN KEY (`student_profile_id`) REFERENCES `gym_student_profile` (`profile_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_private_inquiry_coach` FOREIGN KEY (`preferred_coach_id`) REFERENCES `gym_admin_user` (`admin_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_private_inquiry_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `gym_admin_user` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私教课咨询记录表';
```

### 11. gym_makeup_compensation 表（基于RuoYi标准）

基于RuoYi-Vue-Pro架构的补课补偿管理表，记录补课课时补偿的发放和使用情况。

```sql
CREATE TABLE `gym_makeup_compensation` (
  `compensation_id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '补偿ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `student_profile_id` BIGINT(20) NOT NULL COMMENT '学员档案ID',
  `original_booking_id` BIGINT(20) DEFAULT NULL COMMENT '原预约ID',
  `compensation_type` CHAR(1) NOT NULL COMMENT '补偿类型(0取消 1教练缺席 2设施问题 3其他)',
  `compensation_minutes` INT(11) NOT NULL COMMENT '补偿时长（分钟）',
  `used_minutes` INT(11) DEFAULT 0 COMMENT '已使用时长',
  `remaining_minutes` INT(11) GENERATED ALWAYS AS (compensation_minutes - used_minutes) STORED COMMENT '剩余时长',
  `status` CHAR(1) DEFAULT '0' COMMENT '状态(0活跃 1已使用 2已过期 3已取消)',
  `reason` VARCHAR(500) NOT NULL COMMENT '补偿原因',
  `admin_user_id` BIGINT(20) NOT NULL COMMENT '发放人ID',
  `approved_by` BIGINT(20) DEFAULT NULL COMMENT '审批人ID',
  `expiry_date` DATETIME NOT NULL COMMENT '到期时间',
  `used_bookings` TEXT DEFAULT NULL COMMENT '使用的预约记录(JSON格式)',
  `usage_notes` TEXT DEFAULT NULL COMMENT '使用备注',
  `used_at` DATETIME DEFAULT NULL COMMENT '使用时间',
  `expired_at` DATETIME DEFAULT NULL COMMENT '过期时间',
  `version` INT(11) DEFAULT 0 COMMENT '乐观锁版本号',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` VARCHAR(64) DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME DEFAULT NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME DEFAULT NULL COMMENT '更新时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`compensation_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_student_profile_id` (`student_profile_id`),
  KEY `idx_original_booking_id` (`original_booking_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expiry_date` (`expiry_date`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  CONSTRAINT `fk_compensation_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`user_id`),
  CONSTRAINT `fk_compensation_student` FOREIGN KEY (`student_profile_id`) REFERENCES `gym_student_profile` (`profile_id`),
  CONSTRAINT `fk_compensation_booking` FOREIGN KEY (`original_booking_id`) REFERENCES `gym_booking` (`booking_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_compensation_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `gym_admin_user` (`admin_id`),
  CONSTRAINT `fk_compensation_approver` FOREIGN KEY (`approved_by`) REFERENCES `gym_admin_user` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='补课补偿管理表';
```

**RuoYi补课补偿Service层示例**：
```java
@Service
@Log(title = "补课补偿管理", businessType = BusinessType.INSERT)
@Slf4j
public class GymMakeupCompensationServiceImpl extends ServiceImpl<GymMakeupCompensationMapper, GymMakeupCompensation>
    implements IGymMakeupCompensationService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean createCompensation(GymMakeupCompensationDTO compensationDTO) {
        // 1. 验证补偿的合理性
        // 2. 记录补偿信息
        // 3. 通知用户补偿发放
        GymMakeupCompensation compensation = new GymMakeupCompensation();
        BeanUtils.copyProperties(compensationDTO, compensation);
        compensation.setCreateBy(SecurityUtils.getUsername());
        compensation.setCreateTime(LocalDateTime.now());
        compensation.setExpiryDate(LocalDateTime.now().plusMonths(3)); // 默认3个月有效期

        return this.save(compensation);
    }

    @Override
    @Scheduled(cron = "0 0 1 * * ?") // 每天凌晨1点执行
    public void processExpiredCompensations() {
        // 处理过期的补课补偿
        LambdaQueryWrapper<GymMakeupCompensation> wrapper = new LambdaQueryWrapper<>();
        wrapper.le(GymMakeupCompensation::getExpiryDate, LocalDateTime.now())
               .eq(GymMakeupCompensation::getStatus, "0");

        List<GymMakeupCompensation> expiredCompensations = this.list(wrapper);
        for (GymMakeupCompensation compensation : expiredCompensations) {
            compensation.setStatus("2"); // 设置为已过期
            compensation.setExpiredAt(LocalDateTime.now());
            compensation.setUpdateBy("system");
            this.updateById(compensation);
        }
    }
}
```

## RuoYi-Vue-Pro实体关系

### Relationship Diagram

```
gym_admin_user (1) -----> (N) gym_admin_session
      |
      |
      v
gym_admin_operation_log (N) -----> (1) gym_admin_user

sys_user (1) -----> (N) gym_trial_class_follow_up -----> (1) gym_admin_user
  |                                                           |
  |                                                           v
  v                                           gym_trial_class_follow_up (N)
gym_student_profile (1)                                       |
  |                                                           |
  |                                                           v
  v                                           gym_course (N)
gym_user_reconciliation_record (N)                           |
  |                                                           |
  |                                                           v
  +----------------------------------------> gym_attendance_record (N)

gym_virtual_age_log (N) -----> (1) gym_student_profile
gym_pricing_rule (N) -----> (1) sys_user (create_by/update_by)
gym_waitlist_management (N) -----> (1) gym_admin_user
gym_private_class_inquiry (N) -----> (1) gym_admin_user
gym_makeup_compensation (N) -----> (1) gym_admin_user
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
# 数据模型：003-waitlist-and-makeup (RuoYi架构版)

**功能分支**: `003-waitlist-and-makeup`
**创建时间**: 2025-10-31
**更新时间**: 2025-11-17 (v2.0.0 RuoYi架构重构)
**状态**: Ready for Implementation
**MVP**: 3
**依赖关系**: MVP-1 (001-user-identity-system), MVP-2 (002-course-display-and-booking)

## RuoYi-MyBatis-Plus数据库架构设计

### 技术架构说明
**ORM框架**: MyBatis-Plus 3.5.x
**数据库**: MySQL 8.0+
**缓存**: Redis 7.0+ (Spring Cache + Redis)
**审计**: RuoYi标准审计字段
**事务**: Spring Boot @Transactional
**通知**: 微信服务通知集成

---

## 1. gym_waitlist 表 - 候补队列表 (基于RuoYi扩展)

管理课程候补队列，支持自动确认、6.5小时通知、FIFO队列管理。

```sql
CREATE TABLE `gym_waitlist` (
  `waitlist_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '候补ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `profile_id` BIGINT NOT NULL COMMENT '学员档案ID',
  `course_schedule_id` BIGINT NOT NULL COMMENT '课程安排ID',
  `queue_position` INT NOT NULL COMMENT '队列位置（实时计算）',
  `status` CHAR(1) DEFAULT '0' COMMENT '状态（0活跃 1已确认 2已过期 3已取消 4已通知）',
  `notification_round` INT DEFAULT 0 COMMENT '通知轮次',
  `last_notified_at` DATETIME COMMENT '最后通知时间',
  `response_deadline` DATETIME COMMENT '响应截止时间',
  `confirmed_at` DATETIME COMMENT '确认时间',
  `expired_at` DATETIME COMMENT '过期时间',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',
  `version` INT DEFAULT 0 COMMENT '乐观锁版本号',

  UNIQUE KEY `uk_user_schedule_active` (`user_id`, `course_schedule_id`, `status`),
  INDEX `idx_profile_status` (`profile_id`, `status`),
  INDEX `idx_schedule_position` (`course_schedule_id`, `queue_position`),
  INDEX `idx_status_deadline` (`status`, `response_deadline`),
  INDEX `idx_create_time` (`create_time`),

  FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`profile_id`) REFERENCES `gym_profile`(`profile_id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_schedule_id`) REFERENCES `gym_course_schedule`(`schedule_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='候补队列表（基于RuoYi扩展）';
```

**字段说明**:
- `queue_position`: 实时计算的队列位置，FIFO排序
- `status`: 状态管理，支持自动确认流程
- `notification_round`: 记录通知轮次，支持多轮通知
- `response_deadline`: 6.5小时通知后的30分钟响应窗口
- 遵循RuoYi标准审计字段和乐观锁设计

---

## 2. gym_waitlist_notification 表 - 候补通知记录表 (基于RuoYi扩展)

记录候补通知发送和响应情况，支持微信服务通知。

```sql
CREATE TABLE `gym_waitlist_notification` (
  `notification_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '通知ID',
  `waitlist_id` BIGINT NOT NULL COMMENT '候补ID',
  `notification_type` VARCHAR(50) NOT NULL COMMENT '通知类型',
  `round_number` INT NOT NULL DEFAULT 1 COMMENT '轮次号',
  `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  `deadline_at` DATETIME NOT NULL COMMENT '截止时间',
  `response_deadline` DATETIME NOT NULL COMMENT '响应截止时间',
  `status` CHAR(1) DEFAULT '0' COMMENT '状态（0待响应 1已响应 2已过期 3发送失败）',
  `responded_at` DATETIME COMMENT '响应时间',
  `response_action` VARCHAR(20) COMMENT '响应动作（accept/decline）',
  `wechat_template_id` VARCHAR(100) COMMENT '微信模板ID',
  `wechat_openid` VARCHAR(128) COMMENT '微信OpenID',
  `notification_data` JSON COMMENT '通知数据',
  `error_message` TEXT COMMENT '错误信息',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',

  INDEX `idx_waitlist_status` (`waitlist_id`, `status`),
  INDEX `idx_deadline_at` (`deadline_at`),
  INDEX `idx_response_deadline` (`response_deadline`),
  INDEX `idx_create_time` (`create_time`),

  FOREIGN KEY (`waitlist_id`) REFERENCES `gym_waitlist`(`waitlist_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='候补通知记录表（基于RuoYi扩展）';
```

**字段说明**:
- `notification_type`: 通知类型（available/reminder/expiry）
- `response_deadline`: 30分钟响应窗口截止时间
- `wechat_template_id`: 微信服务通知模板ID
- 遵循RuoYi完整审计日志规范

---

## 3. gym_waitlist_flow 表 - 候补流程跟踪表 (基于RuoYi扩展)

记录候补通知的完整处理流程，支持运营数据分析。

```sql
CREATE TABLE `gym_waitlist_flow` (
  `flow_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '流程ID',
  `notification_id` BIGINT NOT NULL COMMENT '通知ID',
  `start_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `complete_time` DATETIME COMMENT '完成时间',
  `expire_reason` VARCHAR(50) COMMENT '过期原因',
  `flow_data` JSON COMMENT '流程数据',
  `admin_id` BIGINT COMMENT '处理管理员ID',
  `admin_notes` TEXT COMMENT '管理员备注',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',

  INDEX `idx_notification_start` (`notification_id`, `start_time`),
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_complete_time` (`complete_time`),

  FOREIGN KEY (`notification_id`) REFERENCES `gym_waitlist_notification`(`notification_id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `sys_user`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='候补流程跟踪表（基于RuoYi扩展）';
```

**字段说明**:
- `expire_reason`: 过期原因（timeout/declined/cancelled/error）
- `flow_data`: JSON格式的流程处理数据
- `admin_id`: RuoYi管理员用户ID，支持运营干预

---

## 4. gym_makeup_booking 表 - 补课预约表 (基于RuoYi扩展)

管理补课预约和课时补偿使用。

```sql
CREATE TABLE `gym_makeup_booking` (
  `makeup_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '补课预约ID',
  `original_booking_id` BIGINT COMMENT '原预约ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `profile_id` BIGINT NOT NULL COMMENT '学员档案ID',
  `course_schedule_id` BIGINT NOT NULL COMMENT '课程安排ID',
  `class_date` DATE NOT NULL COMMENT '上课日期',
  `start_time` TIME NOT NULL COMMENT '开始时间',
  `end_time` TIME NOT NULL COMMENT '结束时间',
  `duration_minutes` INT NOT NULL COMMENT '课程时长',
  `duration_difference` INT COMMENT '时长差异',
  `compensation_used` DECIMAL(5,2) COMMENT '使用补偿时长',
  `status` CHAR(1) DEFAULT '0' COMMENT '状态（0已预约 1已完成 2已取消）',
  `cancellation_reason` TEXT COMMENT '取消原因',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',
  `version` INT DEFAULT 0 COMMENT '乐观锁版本号',

  INDEX `idx_profile_date` (`profile_id`, `class_date`),
  INDEX `idx_schedule_date` (`course_schedule_id`, `class_date`),
  INDEX `idx_status_date` (`status`, `class_date`),
  INDEX `idx_original_booking` (`original_booking_id`),
  INDEX `idx_create_time` (`create_time`),

  FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`profile_id`) REFERENCES `gym_profile`(`profile_id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_schedule_id`) REFERENCES `gym_course_schedule`(`schedule_id`) ON DELETE CASCADE,
  FOREIGN KEY (`original_booking_id`) REFERENCES `gym_booking`(`booking_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='补课预约表（基于RuoYi扩展）';
```

**字段说明**:
- `duration_difference`: 与原课程的时长差异（分钟）
- `compensation_used`: 使用的课时补偿时长
- `status`: 补课预约状态流转管理
- 遵循RuoYi乐观锁和审计字段设计

---

## 5. gym_class_credit_compensation 表 - 课时补偿表 (基于RuoYi扩展)

管理学员课时补偿余额，支持14天有效期。

```sql
CREATE TABLE `gym_class_credit_compensation` (
  `compensation_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '补偿ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `profile_id` BIGINT NOT NULL COMMENT '学员档案ID',
  `source_type` VARCHAR(50) NOT NULL COMMENT '来源类型',
  `source_id` BIGINT COMMENT '来源ID',
  `total_minutes` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '总补偿时长',
  `used_minutes` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '已使用时长',
  `remaining_minutes` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '剩余时长',
  `expire_at` DATETIME NOT NULL COMMENT '过期时间',
  `status` CHAR(1) DEFAULT '0' COMMENT '状态（0有效 1已过期 2已用完）',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',
  `version` INT DEFAULT 0 COMMENT '乐观锁版本号',

  INDEX `idx_profile_status` (`profile_id`, `status`),
  INDEX `idx_expire_at` (`expire_at`),
  INDEX `idx_source` (`source_type`, `source_id`),
  INDEX `idx_create_time` (`create_time`),

  FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`profile_id`) REFERENCES `gym_profile`(`profile_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课时补偿表（基于RuoYi扩展）';
```

**字段说明**:
- `total_minutes`: 补偿时长精确到0.5节课（30分钟）
- `expire_at`: 14天过期时间，自动失效处理
- `status`: 支持有效、过期、用完状态管理
- 遵循RuoYi乐观锁和版本控制

---

## 6. gym_compensation_usage 表 - 补偿使用记录表 (基于RuoYi扩展)

记录课时补偿使用的详细历史。

```sql
CREATE TABLE `gym_compensation_usage` (
  `usage_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '使用记录ID',
  `compensation_id` BIGINT NOT NULL COMMENT '补偿ID',
  `booking_id` BIGINT COMMENT '预约ID',
  `makeup_booking_id` BIGINT COMMENT '补课预约ID',
  `minutes_used` DECIMAL(5,2) NOT NULL COMMENT '使用时长',
  `usage_type` VARCHAR(50) NOT NULL COMMENT '使用类型',
  `remaining_before` DECIMAL(5,2) NOT NULL COMMENT '使用前余额',
  `remaining_after` DECIMAL(5,2) NOT NULL COMMENT '使用后余额',
  `admin_id` BIGINT COMMENT '操作管理员ID',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',

  INDEX `idx_compensation_usage` (`compensation_id`, `create_time`),
  INDEX `idx_makeup_booking` (`makeup_booking_id`),
  INDEX `idx_admin_id` (`admin_id`),

  FOREIGN KEY (`compensation_id`) REFERENCES `gym_class_credit_compensation`(`compensation_id`) ON DELETE CASCADE,
  FOREIGN KEY (`booking_id`) REFERENCES `gym_booking`(`booking_id`) ON DELETE SET NULL,
  FOREIGN KEY (`makeup_booking_id`) REFERENCES `gym_makeup_booking`(`makeup_id`) ON DELETE SET NULL,
  FOREIGN KEY (`admin_id`) REFERENCES `sys_user`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='补偿使用记录表（基于RuoYi扩展）';
```

**字段说明**:
- `remaining_before`/`remaining_after`: 使用前后余额记录
- `usage_type`: 使用类型（makeup_class/class_extension/refund）
- 遵循RuoYi完整审计日志规范

---

## MyBatis-Plus实体类设计

### 1. GymWaitlist.java
```java
package com.ruoyi.project.gymnastics.waitlist.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.ruoyi.framework.aspectj.lang.annotation.Excel;
import com.ruoyi.framework.web.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

/**
 * 候补队列对象 gym_waitlist
 *
 * @author ruoyi
 * @date 2025-11-17
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("gym_waitlist")
@Accessors(chain = true)
public class GymWaitlist extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 候补ID */
    @TableId(value = "waitlist_id", type = IdType.AUTO)
    private Long waitlistId;

    /** 用户ID */
    @Excel(name = "用户ID")
    @TableField("user_id")
    private Long userId;

    /** 学员档案ID */
    @Excel(name = "学员档案ID")
    @TableField("profile_id")
    private Long profileId;

    /** 课程安排ID */
    @Excel(name = "课程安排ID")
    @TableField("course_schedule_id")
    private Long courseScheduleId;

    /** 队列位置（实时计算） */
    @Excel(name = "队列位置")
    @TableField("queue_position")
    private Integer queuePosition;

    /** 状态（0活跃 1已确认 2已过期 3已取消 4已通知） */
    @Excel(name = "状态", readConverterExp = "0=活跃,1=已确认,2=已过期,3=已取消,4=已通知")
    @TableField("status")
    private String status;

    /** 通知轮次 */
    @Excel(name = "通知轮次")
    @TableField("notification_round")
    private Integer notificationRound;

    /** 最后通知时间 */
    @Excel(name = "最后通知时间", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @TableField("last_notified_at")
    private Date lastNotifiedAt;

    /** 响应截止时间 */
    @Excel(name = "响应截止时间", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @TableField("response_deadline")
    private Date responseDeadline;

    /** 确认时间 */
    @Excel(name = "确认时间", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @TableField("confirmed_at")
    private Date confirmedAt;

    /** 过期时间 */
    @Excel(name = "过期时间", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @TableField("expired_at")
    private Date expiredAt;

    /** 乐观锁版本号 */
    @Version
    @TableField("version")
    private Integer version;
}
```

### 2. GymWaitlistNotification.java
```java
package com.ruoyi.project.gymnastics.waitlist.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.ruoyi.framework.aspectj.lang.annotation.Excel;
import com.ruoyi.framework.web.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.util.Date;

/**
 * 候补通知记录对象 gym_waitlist_notification
 *
 * @author ruoyi
 * @date 2025-11-17
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("gym_waitlist_notification")
@Accessors(chain = true)
public class GymWaitlistNotification extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 通知ID */
    @TableId(value = "notification_id", type = IdType.AUTO)
    private Long notificationId;

    /** 候补ID */
    @Excel(name = "候补ID")
    @TableField("waitlist_id")
    private Long waitlistId;

    /** 通知类型 */
    @Excel(name = "通知类型")
    @TableField("notification_type")
    private String notificationType;

    /** 轮次号 */
    @Excel(name = "轮次号")
    @TableField("round_number")
    private Integer roundNumber;

    /** 发送时间 */
    @Excel(name = "发送时间", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @TableField("sent_at")
    private Date sentAt;

    /** 截止时间 */
    @Excel(name = "截止时间", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @TableField("deadline_at")
    private Date deadlineAt;

    /** 响应截止时间 */
    @Excel(name = "响应截止时间", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @TableField("response_deadline")
    private Date responseDeadline;

    /** 状态（0待响应 1已响应 2已过期 3发送失败） */
    @Excel(name = "状态", readConverterExp = "0=待响应,1=已响应,2=已过期,3=发送失败")
    @TableField("status")
    private String status;

    /** 响应时间 */
    @Excel(name = "响应时间", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @TableField("responded_at")
    private Date respondedAt;

    /** 响应动作 */
    @Excel(name = "响应动作", readConverterExp = "accept=接受,decline=拒绝")
    @TableField("response_action")
    private String responseAction;

    /** 微信模板ID */
    @Excel(name = "微信模板ID")
    @TableField("wechat_template_id")
    private String wechatTemplateId;

    /** 微信OpenID */
    @Excel(name = "微信OpenID")
    @TableField("wechat_openid")
    private String wechatOpenid;
}
```

---

## MyBatis-Plus Mapper接口设计

### 1. GymWaitlistMapper.java
```java
package com.ruoyi.project.gymnastics.waitlist.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ruoyi.project.gymnastics.waitlist.domain.GymWaitlist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 候补队列Mapper接口
 *
 * @author ruoyi
 * @date 2025-11-17
 */
@Mapper
public interface GymWaitlistMapper extends BaseMapper<GymWaitlist> {

    /**
     * 根据课程安排查询活跃候补队列
     *
     * @param courseScheduleId 课程安排ID
     * @return 候补队列列表
     */
    @Select("SELECT * FROM gym_waitlist WHERE course_schedule_id = #{courseScheduleId} " +
            "AND status = '0' ORDER BY queue_position ASC")
    List<GymWaitlist> selectActiveWaitlistBySchedule(@Param("courseScheduleId") Long courseScheduleId);

    /**
     * 查询用户候补记录
     *
     * @param userId 用户ID
     * @return 候补记录列表
     */
    @Select("SELECT * FROM gym_waitlist WHERE user_id = #{userId} AND status IN ('0', '4') " +
            "ORDER BY create_time DESC")
    List<GymWaitlist> selectByUserId(@Param("userId") Long userId);

    /**
     * 查询需要发送通知的候补（6.5小时窗口）
     *
     * @return 候补列表
     */
    @Select("SELECT w.* FROM gym_waitlist w " +
            "JOIN gym_course_schedule cs ON w.course_schedule_id = cs.schedule_id " +
            "WHERE w.status = '0' " +
            "AND cs.schedule_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) " +
            "AND cs.start_time <= DATE_ADD(CURTIME(), INTERVAL 6 HOUR 30 MINUTE) " +
            "AND (w.last_notified_at IS NULL OR w.notification_round = 0)")
    List<GymWaitlist> selectWaitlistForNotification();

    /**
     * 更新候补队列位置
     *
     * @param courseScheduleId 课程安排ID
     * @return 更新数量
     */
    @Select("UPDATE gym_waitlist SET queue_position = " +
            "(SELECT row_num FROM (SELECT waitlist_id, ROW_NUMBER() OVER (ORDER BY create_time ASC) as row_num " +
            "FROM gym_waitlist WHERE course_schedule_id = #{courseScheduleId} AND status = '0') r " +
            "WHERE r.waitlist_id = gym_waitlist.waitlist_id) " +
            "WHERE course_schedule_id = #{courseScheduleId} AND status = '0'")
    int updateQueuePositions(@Param("courseScheduleId") Long courseScheduleId);
}
```

### 2. GymClassCreditCompensationMapper.java
```java
package com.ruoyi.project.gymnastics.waitlist.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ruoyi.project.gymnastics.waitlist.domain.GymClassCreditCompensation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;
import java.util.List;

/**
 * 课时补偿Mapper接口
 *
 * @author ruoyi
 * @date 2025-11-17
 */
@Mapper
public interface GymClassCreditCompensationMapper extends BaseMapper<GymClassCreditCompensation> {

    /**
     * 查询学员有效补偿余额
     *
     * @param profileId 学员档案ID
     * @return 有效补偿列表
     */
    @Select("SELECT * FROM gym_class_credit_compensation " +
            "WHERE profile_id = #{profileId} AND status = '0' AND expire_at > NOW() " +
            "ORDER BY expire_at ASC")
    List<GymClassCreditCompensation> selectValidByProfile(@Param("profileId") Long profileId);

    /**
     * 统计学员总补偿时长
     *
     * @param profileId 学员档案ID
     * @return 总补偿时长
     */
    @Select("SELECT COALESCE(SUM(remaining_minutes), 0) FROM gym_class_credit_compensation " +
            "WHERE profile_id = #{profileId} AND status = '0' AND expire_at > NOW()")
    BigDecimal selectTotalRemainingMinutes(@Param("profileId") Long profileId);

    /**
     * 使用补偿时长（乐观锁更新）
     *
     * @param compensationId 补偿ID
     * @param minutes 使用时长
     * @param version 版本号
     * @return 更新数量
     */
    @Update("UPDATE gym_class_credit_compensation " +
            "SET used_minutes = used_minutes + #{minutes}, " +
            "remaining_minutes = remaining_minutes - #{minutes}, " +
            "version = version + 1, " +
            "update_time = NOW() " +
            "WHERE compensation_id = #{compensationId} AND version = #{version} " +
            "AND remaining_minutes >= #{minutes}")
    int useCompensation(@Param("compensationId") Long compensationId,
                       @Param("minutes") BigDecimal minutes,
                       @Param("version") Integer version);

    /**
     * 查询即将过期的补偿
     *
     * @param days 天数
     * @return 补偿列表
     */
    @Select("SELECT * FROM gym_class_credit_compensation " +
            "WHERE status = '0' AND expire_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL #{days} DAY) " +
            "AND remaining_minutes > 0 " +
            "ORDER BY expire_at ASC")
    List<GymClassCreditCompensation> selectExpiringSoon(@Param("days") Integer days);
}
```

---

## 实体关系图

### RuoYi架构关系图
```
sys_user (RuoYi用户表)
    |
    | 1:N 关系
    v
gym_waitlist (候补队列表)
    |
    | 1:N 关系
    v
gym_waitlist_notification (通知记录表)
    |
    | 1:N 关系
    v
gym_waitlist_flow (流程跟踪表)

gym_profile (学员档案表)
    |
    | 1:N 关系
    v
gym_class_credit_compensation (课时补偿表)
    |
    | 1:N 关系
    v
gym_compensation_usage (补偿使用记录表)

gym_makeup_booking (补课预约表)
    |
    | 关联关系
    v
gym_class_credit_compensation (课时补偿表)
```

### 关键关系说明

1. **用户到候补**: 一对多关系
   - 每个sys_user可以有多个候补记录
   - 使用uk_user_schedule_active唯一索引确保同一课程只能有一个活跃候补

2. **候补到通知**: 一对多关系
   - 每个候补可以有多轮通知记录
   - 支持通知轮次管理和响应跟踪

3. **学员到补偿**: 一对多关系
   - 每个学员档案可以有多个补偿记录
   - 支持多种补偿来源和有效期管理

4. **补偿到使用**: 一对多关系
   - 每个补偿可以有多笔使用记录
   - 详细记录使用历史和余额变化

---

## Redis缓存策略

### 缓存Key设计
```java
public class GymWaitlistCacheKeys {

    /** 候补队列位置缓存 */
    public static final String WAITLIST_QUEUE = "waitlist:queue:";

    /** 候补状态缓存 */
    public static final String WAITLIST_STATUS = "waitlist:status:";

    /** 通知状态缓存 */
    public static final String NOTIFICATION_STATUS = "notification:status:";

    /** 学员补偿余额缓存 */
    public static final String COMPENSATION_BALANCE = "compensation:balance:";

    /** 可补课课程缓存 */
    public static final String MAKEUP_AVAILABLE = "makeup:available:";

    /** 6.5小时通知限流 */
    public static final String NOTIFICATION_LIMIT = "notification:limit:";
}
```

### Spring Cache配置
```java
@Service
public class GymWaitlistServiceImpl implements IGymWaitlistService {

    /**
     * 缓存候补队列
     */
    @Cacheable(value = "waitlistQueue", key = "#courseScheduleId")
    public List<GymWaitlist> getWaitlistQueue(Long courseScheduleId) {
        return waitlistMapper.selectActiveWaitlistBySchedule(courseScheduleId);
    }

    /**
     * 清除候补缓存
     */
    @CacheEvict(value = {"waitlistQueue", "waitlistStatus"}, allEntries = true)
    public void clearWaitlistCache(Long courseScheduleId) {
        // 缓存清除逻辑
    }

    /**
     * 缓存学员补偿余额
     */
    @Cacheable(value = "compensationBalance", key = "#profileId")
    public BigDecimal getCompensationBalance(Long profileId) {
        return compensationMapper.selectTotalRemainingMinutes(profileId);
    }
}
```

---

## 性能优化策略

### 1. 索引设计
```sql
-- 核心查询索引
CREATE INDEX idx_waitlist_user_schedule ON gym_waitlist(user_id, course_schedule_id, status);
CREATE INDEX idx_waitlist_schedule_position ON gym_waitlist(course_schedule_id, queue_position);
CREATE INDEX idx_notification_deadline ON gym_waitlist_notification(response_deadline, status);
CREATE INDEX idx_compensation_profile_expire ON gym_class_credit_compensation(profile_id, expire_at);

-- 复合索引
CREATE INDEX idx_waitlist_status_position ON gym_waitlist(status, queue_position);
CREATE INDEX idx_compensation_usage_time ON gym_compensation_usage(compensation_id, create_time);
```

### 2. 分页查询优化
```java
@Service
public class GymWaitlistQueryOptimizer {

    /**
     * 分页查询候补记录（优化版本）
     */
    public TableDataInfo selectWaitlistPage(GymWaitlist waitlist) {
        startPage();
        LambdaQueryWrapper<GymWaitlist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(waitlist.getUserId() != null, GymWaitlist::getUserId, waitlist.getUserId())
               .eq(StringUtils.isNotEmpty(waitlist.getStatus()), GymWaitlist::getStatus, waitlist.getStatus())
               .orderByDesc(GymWaitlist::getCreateTime);

        List<GymWaitlist> list = waitlistMapper.selectList(wrapper);
        return getDataTable(list);
    }
}
```

---

## 数据迁移考虑

### MyBatis-Plus迁移脚本
```sql
-- 1. 创建RuoYi标准候补表
CREATE TABLE `gym_waitlist` (
    -- 表结构如上文设计
);

-- 2. 数据迁移
INSERT INTO gym_waitlist (user_id, profile_id, course_schedule_id, queue_position, status, create_time, create_by)
SELECT
    u.user_id,
    w.profile_id,
    w.course_schedule_id,
    w.position,
    CASE w.status
        WHEN 'active' THEN '0'
        WHEN 'confirmed' THEN '1'
        WHEN 'expired' THEN '2'
        WHEN 'cancelled' THEN '3'
        ELSE '0'
    END,
    w.joined_at,
    'system'
FROM waitlist w
JOIN gym_profile p ON w.profile_id = p.profile_id
JOIN sys_user u ON p.user_id = u.user_id;

-- 3. 创建索引
CREATE INDEX idx_waitlist_user_schedule ON gym_waitlist(user_id, course_schedule_id, status);
CREATE INDEX idx_waitlist_schedule_position ON gym_waitlist(course_schedule_id, queue_position);
```

### 回滚策略
```sql
-- 回滚脚本
DROP TABLE IF EXISTS gym_compensation_usage;
DROP TABLE IF EXISTS gym_class_credit_compensation;
DROP TABLE IF EXISTS gym_makeup_booking;
DROP TABLE IF EXISTS gym_waitlist_flow;
DROP TABLE IF EXISTS gym_waitlist_notification;
DROP TABLE IF EXISTS gym_waitlist;
```

---

## 监控和维护

### RuoYi监控指标
```java
@Component
public class GymWaitlistMetrics {

    /**
     * 候补队列监控
     */
    @Scheduled(cron = "0 */30 * * * ?")
    public void monitorWaitlistQueue() {
        // 监控候补队列长度和处理时间
    }

    /**
     * 通知发送成功率监控
     */
    @Scheduled(cron = "0 0 */4 * * ?")
    public void monitorNotificationSuccess() {
        // 监控微信通知发送成功率
    }

    /**
     * 补偿过期监控
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void monitorCompensationExpiration() {
        // 监控即将过期的补偿
    }
}
```

### 审计日志
```java
@RestController
public class GymWaitlistController extends BaseController {

    @PostMapping("/join")
    @PreAuthorize("@ss.hasPermission('gym:waitlist:join')")
    @Log(title = "加入候补", businessType = BusinessType.INSERT)
    public AjaxResult join(@Validated @RequestBody GymWaitlist waitlist) {
        waitlist.setCreateBy(getUsername());
        return toAjax(waitlistService.insertGymWaitlist(waitlist));
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
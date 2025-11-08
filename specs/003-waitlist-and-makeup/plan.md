# Implementation Plan: Waitlist and Makeup Class System

**Feature**: 003-waitlist-and-makeup
**创建时间**: 2025-10-31
**状态**: Draft

## Technical Context

### Technology Stack

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **小程序前端** | 微信原生框架(MINA) | 基础库 3.11.0+ | 候补和补课界面 |
| **渲染引擎** | Skyline | 基础库 3.0.0+ | 候补列表性能优化 |
| **后端框架** | Python FastAPI | 0.100+ | 候补API服务 |
| **数据库** | MySQL | 8.0+ | 候补和补课数据存储 |
| **ORM** | SQLAlchemy | 2.x | 数据库操作 |
| **消息队列** | Redis + Celery | 6.0+ | 异步通知处理 |
| **消息推送** | 微信服务通知 | - | 候补通知推送 |
| **定时任务** | APScheduler | 3.0+ | 定时检查和清理 |

### Project Structure

```
/Users/cc/Documents/GymnasticMini/
├── backend/                      # 后端服务
│   ├── app/
│   │   ├── models/              # 数据模型
│   │   │   ├── waitlist.py
│   │   │   ├── waitlist_notification.py
│   │   │   ├── waitlist_flow.py
│   │   │   ├── makeup_class.py
│   │   │   ├── makeup_booking.py
│   │   │   ├── class_credit_compensation.py
│   │   │   └── compensation_usage.py
│   │   ├── schemas/             # Pydantic数据验证
│   │   │   ├── waitlist.py
│   │   │   ├── makeup.py
│   │   │   └── compensation.py
│   │   ├── services/            # 业务逻辑层
│   │   │   ├── waitlist_service.py
│   │   │   ├── makeup_service.py
│   │   │   ├── notification_service.py
│   │   │   ├── compensation_service.py
│   │   │   └── timing_service.py
│   │   ├── controllers/         # API控制器
│   │   │   ├── waitlist.py
│   │   │   ├── makeup.py
│   │   │   └── notification.py
│   │   ├── utils/               # 工具函数
│   │   │   ├── timing_calculator.py
│   │   │   ├── notification_manager.py
│   │   │   └── queue_manager.py
│   │   ├── tasks/               # 异步任务
│   │   │   ├── celery_app.py
│   │   │   ├── notification_tasks.py
│   │   │   └── cleanup_tasks.py
│   │   └── main.py              # FastAPI入口
│   ├── migrations/              # 数据库迁移脚本
│   ├── tests/                   # 单元测试
│   └── requirements.txt
│
└── miniprogram/                 # 小程序前端
    ├── pages/
    │   ├── waitlist/            # 候补相关页面
    │   │   ├── index/           # 候补首页
    │   │   ├── status/         # 候补状态
    │   │   └── detail/         # 候补详情
    │   ├── makeup/              # 补课相关页面
    │   │   ├── index/           # 待补课列表
    │   │   ├── select/         # 选择补课
    │   │   └── compensation/    # 课时补偿
    │   └── notifications/       # 通知相关页面
    │       └── waitlist/        # 候补通知
    ├── components/
    │   ├── waitlist-card/       # 候补卡片组件
    │   ├── countdown-timer/     # 倒计时组件
    │   ├── makeup-selector/     # 补课选择器
    │   └── notification-popup/  # 通知弹窗
    ├── utils/
    │   ├── request.js           # API请求封装
    │   ├── storage.js           # 本地存储管理
    │   ├── time-utils.js        # 时间计算工具
    │   └── notification-utils.js # 通知工具
    ├── app.js
    └── app.json
```

### Constraints

- **宪法 Principle 1**：简化优先，避免过度工程化
- **宪法 Principle 2**：数据完整性至上，候补操作使用事务
- **宪法 Principle 4**：API优先架构，异步任务解耦
- **宪法 Principle 5**：纵向切片，独立交付候补功能

## Architecture Overview

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    微信小程序前端                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 候补首页   │  │ 待补课列表 │  │ 通知中心   │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │             │             │                       │
│       └─────────────┴─────────────┘                       │
│                     │                                     │
│            ┌────────▼────────┐                            │
│            │  API Request    │ (JWT Token认证)            │
│            │   (HTTPS)       │                            │
└────────────┴─────────────────┴────────────────────────────┘
                     │
                     │ /api/v1/*
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Python FastAPI 后端服务                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Waitlist Controller │ Makeup Controller │ Notify  │  │
│  └────────┬────────────┴──────────┬─────────────────┘  │
│           │                        │                     │
│  ┌────────▼────────────────────────▼─────────────────┐  │
│  │           Service Layer (业务逻辑)                 │  │
│  │ - 候补管理 - 补课管理 - 通知管理 - 时间管理         │  │
│  └────────┬──────────────────────────────────────────┘  │
│           │                                              │
│  ┌────────▼──────────────────────────────────────────┐  │
│  │     SQLAlchemy ORM + Redis + Celery (数据+异步)     │  │
│  └────────┬──────────────────────────────────────────┘  │
└───────────┼──────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                    MySQL 数据库                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ waitlist │  │ makeup_  │  │ waitlist_│  │ waitlist_│  │
│  │          │  │ booking  │  │ notify   │  │ flow     │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Redis 缓存 + 消息队列                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 候补队列  │  │ 通知队列  │  │ 时间缓存  │  │ Celery   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   微信服务通知 API                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │         异步通知发送 - 批量推送 - 状态跟踪        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### 核心表设计

#### 1. waitlist（候补表）

```sql
CREATE TABLE `waitlist` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '候补ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `course_schedule_id` INT NOT NULL COMMENT '课程安排ID',
  `booking_date` DATE NOT NULL COMMENT '预约日期',
  `position` INT NOT NULL COMMENT '候补位置',
  `status` ENUM('waiting', 'notified', 'confirmed', 'expired', 'cancelled') DEFAULT 'waiting' COMMENT '候补状态',
  `join_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `last_notified_at` TIMESTAMP NULL COMMENT '最后通知时间',
  `confirmed_at` TIMESTAMP NULL COMMENT '确认时间',
  `expires_at` TIMESTAMP NULL COMMENT '过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_schedule_id`) REFERENCES `course_schedule`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_profile_schedule_date` (`profile_id`, `course_schedule_id`, `booking_date`),
  INDEX `idx_status_position` (`status`, `position`),
  INDEX `idx_course_schedule` (`course_schedule_id`, `booking_date`),
  INDEX `idx_join_time` (`join_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='候补表';
```

#### 2. waitlist_notification（候补通知表）

```sql
CREATE TABLE `waitlist_notification` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '通知ID',
  `waitlist_id` INT NOT NULL COMMENT '候补ID',
  `notification_type` ENUM('spot_available', 'expiry_reminder', 'queue_update') DEFAULT 'spot_available' COMMENT '通知类型',
  `notification_round` INT NOT NULL DEFAULT 1 COMMENT '通知轮次',
  `sent_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  `response_deadline` TIMESTAMP NOT NULL COMMENT '响应截止时间',
  `response_time` TIMESTAMP NULL COMMENT '用户响应时间',
  `status` ENUM('sent', 'responded', 'expired', 'cancelled') DEFAULT 'sent' COMMENT '通知状态',
  `message_content` TEXT COMMENT '通知内容',
  `notification_data` JSON COMMENT '通知相关数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`waitlist_id`) REFERENCES `waitlist`(`id`) ON DELETE CASCADE,
  INDEX `idx_waitlist_status` (`waitlist_id`, `status`),
  INDEX `idx_sent_time` (`sent_time`),
  INDEX `idx_deadline` (`response_deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='候补通知表';
```

#### 3. waitlist_flow（候补流程表）

```sql
CREATE TABLE `waitlist_flow` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '流程ID',
  `waitlist_notification_id` INT NOT NULL COMMENT '候补通知ID',
  `flow_start_time` TIMESTAMP NOT NULL COMMENT '流程开始时间',
  `flow_completion_time` TIMESTAMP NULL COMMENT '流程完成时间',
  `expiration_reason` ENUM('timeout', 'user_cancelled', 'system_error', 'manual_cancel') COMMENT '过期原因',
  `flow_data` JSON COMMENT '流程相关数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`waitlist_notification_id`) REFERENCES `waitlist_notification`(`id`) ON DELETE CASCADE,
  INDEX `idx_notification` (`waitlist_notification_id`),
  INDEX `idx_start_time` (`flow_start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='候补流程表';
```

#### 4. makeup_booking（补课预约表）

```sql
CREATE TABLE `makeup_booking` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '补课预约ID',
  `original_booking_id` INT NOT NULL COMMENT '原预约ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `makeup_class_id` INT NOT NULL COMMENT '补课课程ID',
  `makeup_schedule_id` INT NOT NULL COMMENT '补课课程安排ID',
  `makeup_date` DATE NOT NULL COMMENT '补课日期',
  `status` ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending' COMMENT '补课状态',
  `original_duration` INT NOT NULL COMMENT '原课程时长(分钟)',
  `makeup_duration` INT NOT NULL COMMENT '补课课程时长(分钟)',
  `duration_difference` INT COMMENT '时长差异(分钟)',
  `completion_type` ENUM('full', 'partial', 'extra') DEFAULT 'full' COMMENT '完成类型',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`original_booking_id`) REFERENCES `booking`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`makeup_class_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`makeup_schedule_id`) REFERENCES `course_schedule`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_makeup_booking` (`original_booking_id`, `makeup_schedule_id`, `makeup_date`),
  INDEX `idx_profile_makeup` (`profile_id`, `makeup_date`),
  INDEX `idx_original_booking` (`original_booking_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='补课预约表';
```

#### 5. class_credit_compensation（课时补偿表）

```sql
CREATE TABLE `class_credit_compensation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '补偿ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `original_booking_id` INT NOT NULL COMMENT '原预约ID',
  `compensation_minutes` INT NOT NULL COMMENT '补偿时长(分钟)',
  `status` ENUM('available', 'used', 'expired') DEFAULT 'available' COMMENT '补偿状态',
  `created_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `expiry_time` TIMESTAMP NOT NULL COMMENT '过期时间',
  `used_time` TIMESTAMP NULL COMMENT '使用时间',
  `used_booking_id` INT NULL COMMENT '使用的预约ID',
  `remaining_minutes` INT NOT NULL COMMENT '剩余时长(分钟)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`original_booking_id`) REFERENCES `booking`(`id`) ON DELETE CASCADE,
  INDEX `idx_profile_compensation` (`profile_id`, `status`),
  INDEX `idx_expiry_time` (`expiry_time`),
  INDEX `idx_original_booking` (`original_booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课时补偿表';
```

#### 6. compensation_usage（补偿使用记录表）

```sql
CREATE TABLE `compensation_usage` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '使用记录ID',
  `compensation_id` INT NOT NULL COMMENT '补偿ID',
  `booking_id` INT NOT NULL COMMENT '使用的预约ID',
  `used_minutes` INT NOT NULL COMMENT '使用时长(分钟)',
  `remaining_minutes` INT NOT NULL COMMENT '剩余时长(分钟)',
  `usage_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '使用时间',
  `usage_type` ENUM('full_use', 'partial_use') DEFAULT 'full_use' COMMENT '使用类型',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`compensation_id`) REFERENCES `class_credit_compensation`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`booking_id`) REFERENCES `booking`(`id`) ON DELETE CASCADE,
  INDEX `idx_compensation` (`compensation_id`),
  INDEX `idx_booking` (`booking_id`),
  INDEX `idx_usage_time` (`usage_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='补偿使用记录表';
```

## API Design

### 核心API端点

#### 1. 候补管理API

**POST /api/v1/waitlist/join** - 加入候补
- 验证候补资格
- 检查候补队列容量
- 计算候补位置

**GET /api/v1/waitlist/my** - 获取我的候补
- 查询用户候补记录
- 显示候补状态
- 按时间排序

**DELETE /api/v1/waitlist/{id}** - 取消候补
- 取消候补资格
- 释放队列位置
- 发送取消通知

**GET /api/v1/waitlist/position/{id}** - 查询候补位置
- 实时查询候补位置
- 显示排队信息
- 预计等待时间

#### 2. 候补通知API

**POST /api/v1/waitlist/notify** - 发送候补通知
- 批量发送通知
- 记录通知时间
- 设置响应截止

**PUT /api/v1/waitlist/{id}/respond** - 响应候补通知
- 确认预约意向
- 更新通知状态
- 触发预约流程

**GET /api/v1/waitlist/{id}/notifications** - 获取通知历史
- 查询通知记录
- 显示响应状态
- 统计通知次数

#### 3. 补课管理API

**GET /api/v1/makeup/available** - 获取可补课列表
- 查询符合条件的补课
- 按时间筛选
- 显示容量信息

**POST /api/v1/makeup/book** - 预约补课
- 验证补课资格
- 计算时长差异
- 处理补偿记录

**GET /api/v1/makeup/my** - 获取我的补课
- 查询补课记录
- 显示补课状态
- 统计补课次数

**DELETE /api/v1/makeup/{id}/cancel** - 取消补课
- 取消补课预约
- 恢复补偿记录
- 更新状态

#### 4. 课时补偿API

**GET /api/v1/compensation/balance** - 获取补偿余额
- 查询可用补偿
- 显示过期时间
- 统计使用记录

**GET /api/v1/compensation/history** - 获取补偿历史
- 查询补偿记录
- 显示使用情况
- 按时间排序

### 6.5小时截止时限API

**GET /api/v1/waitlist/deadline-check** - 检查截止时限
- 计算通知截止时间
- 触发自动顺位
- 处理过期候补

**POST /api/v1/waitlist/process-expiry** - 处理过期候补
- 自动处理过期记录
- 更新队列位置
- 发送顺位通知

## 候补截止时限机制

### 6.5小时规则实现

```python
def calculate_notification_deadline(course_start_time):
    """
    计算候补通知截止时间
    规则：开课前6.5小时必须发送通知
    """
    # 开课时间 - 6.5小时 = 最后通知时间
    last_notification_time = course_start_time - timedelta(hours=6.5, minutes=30)

    # 30分钟决策缓冲期
    deadline_time = last_notification_time + timedelta(minutes=30)

    return deadline_time

def is_notification_window_active(course_start_time):
    """
    检查是否在通知时间窗口内
    """
    last_notification_time = course_start_time - timedelta(hours=6.5, minutes=30)
    now = datetime.now()

    return last_notification_time <= now < course_start_time

def can_send_notification(waitlist_entry, course_start_time):
    """
    检查是否可以发送候补通知
    """
    # 开课前6小时内不发送新通知
    if course_start_time - datetime.now() < timedelta(hours=6):
        return False

    # 检查是否已发送过通知
    if waitlist_entry.last_notified_at:
        time_since_last_notification = datetime.now() - waitlist_entry.last_notified_at
        if time_since_last_notification < timedelta(hours=1):
            return False

    return True
```

### 30分钟决策缓冲期

```python
def handle_waitlist_response(notification_id, user_action):
    """
    处理候补用户响应
    """
    notification = get_notification(notification_id)

    if user_action == 'confirm':
        # 检查是否在决策时间内
        if datetime.now() <= notification.response_deadline:
            # 允许确认预约
            return create_booking_from_waitlist(notification)
        else:
            # 超时，顺位给下一位
            return promote_next_waitlist_user(notification.waitlist_id)

    elif user_action == 'decline':
        # 用户放弃，立即顺位
        return promote_next_waitlist_user(notification.waitlist_id)

    return False
```

## 补课课时差异处理

### 课时差异计算

```python
def calculate_duration_difference(original_duration, makeup_duration):
    """
    计算课时差异
    正数：需要补偿的时长
    零：时长相同
    负数：用户获得额外时长
    """
    return original_duration - makeup_duration

def process_compensation(original_booking, makeup_booking):
    """
    处理课时补偿
    """
    difference = calculate_duration_difference(
        original_booking.duration_minutes,
        makeup_booking.duration_minutes
    )

    if difference > 0:
        # 需要补偿
        compensation = create_compensation(
            profile_id=original_booking.profile_id,
            original_booking_id=original_booking.id,
            compensation_minutes=difference
        )

        # 更新补课记录类型
        makeup_booking.completion_type = 'partial' if difference < original_booking.duration_minutes else 'full'

    elif difference < 0:
        # 用户获得额外时长
        makeup_booking.completion_type = 'extra'

    return makeup_booking

def use_compensation_for_booking(profile_id, booking, required_minutes):
    """
    使用补偿课时支付
    """
    available_compensations = get_available_compensations(profile_id)

    if not available_compensations:
        return False, "无可用课时补偿"

    total_available = sum(c.remaining_minutes for c in available_compensations)

    if total_available < required_minutes:
        return False, f"补偿时长不足，需要{required_minutes}分钟，可用{total_available}分钟"

    # 使用补偿课时
    used_minutes = 0
    for compensation in available_compensations:
        if used_minutes >= required_minutes:
            break

        use_amount = min(compensation.remaining_minutes, required_minutes - used_minutes)
        create_compensation_usage(compensation.id, booking.id, use_amount)
        update_compensation_balance(compensation.id, -use_amount)
        used_minutes += use_amount

    return True, "使用补偿成功"
```

## Frontend Implementation

### 页面结构

#### 1. 候补首页 (pages/waitlist/index)

**功能**：显示用户的所有候补记录

**核心组件**：
- 候补状态卡片
- 位置显示组件
- 倒计时显示

#### 2. 候补详情页 (pages/waitlist/detail)

**功能**：显示单个候补的详细信息

**核心组件**：
- 候补进度显示
- 课程信息卡片
- 取消候补按钮

#### 3. 补课列表页 (pages/makeup/index)

**功能**：显示待补课列表和可用补课

**核心组件**：
- 补课课程卡片
- 时长差异提示
- 课时补偿显示

### 组件设计

#### 候补状态组件 (components/waitlist-status)

```xml
<!-- components/waitlist-status/waitlist-status.wxml -->
<view class="waitlist-status {{statusClass}}">
  <view class="status-info">
    <text class="position">第{{position}}位候补</text>
    <text class="wait-time">已等待{{waitDays}}天</text>
  </view>

  <view class="countdown" wx:if="{{showCountdown}}">
    <text class="countdown-label">响应倒计时</text>
    <text class="countdown-time">{{countdownTime}}</text>
  </view>

  <view class="actions">
    <button wx:if="{{canCancel}}" bindtap="handleCancel">取消候补</button>
    <button wx:if="{{canRespond}}" bindtap="handleRespond">立即预约</button>
  </view>
</view>
```

#### 补课选择器组件 (components/makeup-selector)

```xml
<!-- components/makeup-selector/makeup-selector.wxml -->
<view class="makeup-selector">
  <view class="duration-info">
    <text class="original-duration">原课程：{{originalDuration}}分钟</text>
    <text class="makeup-duration">补课：{{makeupDuration}}分钟</text>
    <text class="duration-difference {{differenceClass}}">
      {{durationDifference > 0 ? '需要补偿' : '额外获得'}} {{Math.abs(durationDifference)}}分钟
    </text>
  </view>

  <view class="compensation-info" wx:if="{{hasCompensation}}">
    <text class="available">可用补偿：{{availableCompensation}}分钟</text>
  </view>

  <view class="actions">
    <button bindtap="handleSelect">选择此补课</button>
  </view>
</view>
```

## Performance Optimization

### 缓存策略

```python
# Redis缓存键设计
WAITLIST_QUEUE_KEY = "waitlist:queue:{schedule_id}:{date}"
NOTIFICATION_STATUS_KEY = "notification:status:{notification_id}"
COMPENSATION_BALANCE_KEY = "compensation:balance:{profile_id}"

# 缓存过期时间
WAITLIST_QUEUE_TTL = 300      # 5分钟
NOTIFICATION_STATUS_TTL = 3600   # 1小时
COMPENSATION_BALANCE_TTL = 1800  # 30分钟
```

### 异步任务处理

```python
# Celery异步任务
@celery.task
def send_waitlist_notifications(waitlist_ids):
    """批量发送候补通知"""
    for waitlist_id in waitlist_ids:
        send_wechat_notification.delay(waitlist_id)

@celery.task
def process_waitlist_expiry():
    """处理候补过期"""
    expired_waitlists = get_expired_waitlists()
    for waitlist in expired_waitlists:
        promote_next_user.delay(waitlist.id)

@celery.task
def cleanup_expired_compensations():
    """清理过期的课时补偿"""
    cleanup_expired_records()
```

## Testing Strategy

### 关键测试场景

1. **6.5小时截止时限测试**
   - 验证通知时间计算准确性
   - 测试过期自动顺位机制
   - 验证30分钟缓冲期逻辑

2. **并发候补处理测试**
   - 多用户同时响应的并发控制
   - 候补队列位置的原子性更新
   - 数据库事务完整性验证

3. **补课课时差异处理测试**
   - 各种时长差异的计算准确性
   - 补偿记录的生成和使用
   - 补偿过期清理机制

## Constitution Compliance

- ✅ **Principle 1**: 简化异步通知机制，避免过度工程化
- ✅ **Principle 2**: 候补和补课操作使用事务保护
- ✅ **Principle 3**: 清晰的异步任务架构，可维护性高
- ✅ **Principle 4**: API优先设计，异步任务解耦
- ✅ **Principle 5**: 纵向切片，独立交付候补功能
- ✅ **Principle 6**: 自动通知机制提升用户体验
- ✅ **Principle 7**: 关键业务逻辑测试覆盖
- ✅ **Principle 8**: 用户数据隔离和权限控制
- ✅ **Principle 9**: 支持后续扩展和优化

## Timeline Estimation

### 开发阶段

- **Phase 1**: 数据模型和API开发 - 6天
- **Phase 2**: 候补核心逻辑开发 - 5天
- **Phase 3**: 补课系统开发 - 4天
- **Phase 4**: 通知和异步任务 - 4天
- **Phase 5**: 前端页面开发 - 5天
- **Phase 6**: 集成测试和优化 - 3天

### 总预估时间
**27天**（约4-5周，包含测试和优化时间）

---

**创建人**: [技术负责人]
**最后更新**: 2025-10-31
**版本**: 1.0.0
**状态**: Draft
# Implementation Plan: Course Display and Booking System

**Feature**: 002-course-display-and-booking
**创建时间**: 2025-10-31
**状态**: Draft

## Technical Context

### Technology Stack

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **小程序前端** | 微信原生框架(MINA) | 基础库 3.11.0+ | 课程展示、预约界面 |
| **渲染引擎** | Skyline | 基础库 3.0.0+ | 课程列表性能优化 |
| **后端框架** | Python FastAPI | 0.100+ | 预约API服务 |
| **数据库** | MySQL | 8.0+ | 课程和预约数据存储 |
| **ORM** | SQLAlchemy | 2.x | 数据库操作 |
| **缓存** | Redis | 6.0+ | 课程列表缓存 |
| **认证** | JWT | - | 用户身份验证 |

### Project Structure

```
/Users/cc/Documents/GymnasticMini/
├── backend/                      # 后端服务
│   ├── app/
│   │   ├── models/              # 数据模型
│   │   │   ├── course.py
│   │   │   ├── schedule.py
│   │   │   ├── booking.py
│   │   │   └── tag_system.py
│   │   ├── schemas/             # Pydantic数据验证
│   │   │   ├── course.py
│   │   │   ├── booking.py
│   │   │   └── tag_matching.py
│   │   ├── services/            # 业务逻辑层
│   │   │   ├── course_service.py
│   │   │   ├── booking_service.py
│   │   │   ├── tag_matching_service.py      # 4维标签匹配服务
│   │   │   └── waitlist_service.py
│   │   ├── controllers/         # API控制器
│   │   │   ├── course.py
│   │   │   ├── booking.py
│   │   │   └── waitlist.py
│   │   ├── utils/               # 工具函数
│   │   │   ├── tag_calculator.py
│   │   │   ├── time_utils.py
│   │   │   └── cache_manager.py
│   │   └── main.py              # FastAPI入口
│   ├── migrations/              # 数据库迁移脚本
│   ├── tests/                   # 单元测试
│   └── requirements.txt
│
└── miniprogram/                 # 小程序前端
    ├── pages/
    │   ├── booking/             # 预约相关页面
    │   │   ├── index/           # 预约首页
    │   │   ├── course-list/     # 课程列表
    │   │   ├── course-detail/   # 课程详情
    │   │   ├── booking-confirm/ # 预约确认
    │   │   └── booking-success/ # 预约成功
    │   ├── course/              # 课程相关页面
    │   │   ├── fixed-class/     # 固定班课程
    │   │   └── flexible-class/  # 灵活排课
    │   └── my-bookings/         # 我的预约
    ├── components/
    │   ├── course-card/         # 课程卡片组件
    │   ├── tag-display/         # 标签显示组件
    │   ├── booking-calendar/    # 预约日历
    │   └── match-score/         # 匹配度显示
    ├── utils/
    │   ├── request.js           # API请求封装
    │   ├── storage.js           # 本地存储管理
    │   ├── tag-utils.js         # 标签计算工具
    │   └── date-utils.js         # 日期处理工具
    ├── app.js
    └── app.json
```

### Constraints

- **宪法 Principle 1**：简化优先，使用微信原生框架
- **宪法 Principle 2**：数据完整性至上，预约操作使用事务
- **宪法 Principle 4**：API优先架构，RESTful设计
- **宪法 Principle 5**：纵向切片，独立交付预约功能

## Architecture Overview

### 4维标签匹配服务架构

#### 服务设计原则
- **白名单匹配机制**：4个维度必须全部匹配，任一维度不匹配则排除
- **统一匹配算法**：与私教课系统共享相同的匹配逻辑
- **格式统一**：年龄范围使用VARCHAR格式，支持灵活配置

#### 4维标签定义
1. **等级维度 (level)**：学员等级 vs 课程等级范围
2. **年龄维度 (age)**：学员年龄 vs 课程年龄范围
3. **性别维度 (gender)**：学员性别 vs 课程性别要求
4. **类型维度 (type)**：课程类型 vs 学员目标类型

#### 统一格式规范
```json
{
  "age_range_formats": ["4-6岁", "6-8岁", "8-12岁", "6+岁", "成人", "全年龄段"],
  "level_range_formats": ["L1", "L2", "L3", "L1+", "L2+", "L1-L3"],
  "gender_values": ["male", "female", "both"],
  "course_type_values": ["interest", "professional", "trial"]
}
```

#### 匹配算法核心逻辑
```python
# 白名单匹配：所有维度必须匹配
def match_profile_to_course(profile_tags, course_tags):
    dimensions = ['level', 'age', 'gender', 'type']

    for dimension in dimensions:
        if not match_dimension(profile_tags[dimension], course_tags[dimension]):
            return 0.0  # 任一维度不匹配则返回0分

    return 100.0  # 所有维度匹配返回100分
```

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    微信小程序前端                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 预约首页   │  │ 课程列表   │  │ 课程详情   │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │             │             │                       │
│       └─────────────┴─────────────┘                       │
│                     │                                     │
│            ┌────────▼────────┐                            │
│            │  智能标签匹配    │                            │
│            │  组件           │                            │
│            └────────┬────────┘                            │
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
│  │ Course Controller │ Booking Controller │ Tag Controller │  │
│  └────────┬────────────┴──────────┬─────────────────┘  │
│           │                        │                     │
│  ┌────────▼────────────────────────▼─────────────────┐  │
│  │           Service Layer (业务逻辑)                 │  │
│  │ - 课程查询 - 预约管理 - 标签匹配 - 候补处理        │  │
│  └────────┬──────────────────────────────────────────┘  │
│           │                                              │
│  ┌────────▼──────────────────────────────────────────┐  │
│  │     SQLAlchemy ORM + Redis (数据访问+缓存)          │  │
│  └────────┬──────────────────────────────────────────┘  │
└───────────┼──────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                    MySQL 数据库                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ course   │  │ schedule │  │ booking  │  │ tag_match│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### 核心表设计

#### 1. course（课程表）

```sql
CREATE TABLE `course` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '课程ID',
  `name` VARCHAR(100) NOT NULL COMMENT '课程名称',
  `description` TEXT COMMENT '课程描述',
  `course_type` ENUM('regular', 'trial', 'fixed', 'flexible') NOT NULL DEFAULT 'regular' COMMENT '课程类型',
  `age_range_start` TINYINT NOT NULL COMMENT '年龄范围起始',
  `age_range_end` TINYINT NOT NULL COMMENT '年龄范围结束',
  `gender_requirement` ENUM('male', 'female', 'mixed') DEFAULT 'mixed' COMMENT '性别要求',
  `level_requirements` JSON COMMENT '等级要求，如["L1", "L2", "L1+"]',
  `development_tags` JSON COMMENT '发展标签，如["interest", "professional"]',
  `max_capacity` INT NOT NULL DEFAULT 1 COMMENT '最大容量',
  `duration_minutes` INT NOT NULL COMMENT '课程时长(分钟)',
  `price` DECIMAL(10,2) NOT NULL COMMENT '价格',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_course_type` (`course_type`),
  INDEX `idx_age_range` (`age_range_start`, `age_range_end`),
  INDEX `idx_level_requirements` ((CAST(`level_requirements` AS CHAR(255) ARRAY))),
  INDEX `idx_development_tags` ((CAST(`development_tags` AS CHAR(255) ARRAY)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';
```

#### 2. course_schedule（课程安排表）

```sql
CREATE TABLE `course_schedule` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '安排ID',
  `course_id` INT NOT NULL COMMENT '课程ID',
  `schedule_type` ENUM('weekly', 'monthly', 'custom') NOT NULL DEFAULT 'weekly' COMMENT '安排类型',
  `weekday` TINYINT COMMENT '星期几(1-7，7为周日)',
  `start_time` TIME NOT NULL COMMENT '开始时间',
  `end_time` TIME NOT NULL COMMENT '结束时间',
  `start_date` DATE NOT NULL COMMENT '开始日期',
  `end_date` DATE COMMENT '结束日期',
  `location` VARCHAR(100) COMMENT '上课地点',
  `coach_id` INT COMMENT '教练ID',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  INDEX `idx_course_schedule` (`course_id`),
  INDEX `idx_weekday_time` (`weekday`, `start_time`),
  INDEX `idx_date_range` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程安排表';
```

#### 3. booking（预约表）

```sql
CREATE TABLE `booking` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '预约ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `course_schedule_id` INT NOT NULL COMMENT '课程安排ID',
  `booking_date` DATE NOT NULL COMMENT '预约日期',
  `status` ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending' COMMENT '预约状态',
  `booking_source` ENUM('user', 'admin') DEFAULT 'user' COMMENT '预约来源',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cancelled_at` TIMESTAMP NULL COMMENT '取消时间',
  `cancellation_reason` TEXT COMMENT '取消原因',

  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_schedule_id`) REFERENCES `course_schedule`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_booking` (`profile_id`, `course_schedule_id`, `booking_date`),
  INDEX `idx_profile_booking` (`profile_id`, `booking_date`),
  INDEX `idx_schedule_date` (`course_schedule_id`, `booking_date`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约表';
```

#### 4. tag_matching_cache（标签匹配缓存表）

```sql
CREATE TABLE `tag_matching_cache` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '缓存ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `course_id` INT NOT NULL COMMENT '课程ID',
  `match_score` DECIMAL(5,2) NOT NULL COMMENT '匹配分数(0-100)',
  `match_details` JSON COMMENT '匹配详情',
  `cache_date` DATE NOT NULL COMMENT '缓存日期',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',

  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_profile_course_date` (`profile_id`, `course_id`, `cache_date`),
  INDEX `idx_profile_cache` (`profile_id`, `cache_date`),
  INDEX `idx_match_score` (`match_score` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签匹配缓存表';
```

## API Design

### 统一响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 业务数据
  },
  "pagination": {
    // 分页信息(可选)
  }
}
```

### 核心API端点

#### 1. 课程相关API

**GET /api/v1/courses** - 获取课程列表
- 智能标签匹配
- 支持分页和筛选
- 缓存优化

**GET /api/v1/courses/{id}** - 获取课程详情
- 课程详细信息
- 匹配度计算
- 预约状态

**GET /api/v1/courses/{id}/schedule** - 获取课程安排
- 时间安排查询
- 可预约日期
- 容量信息

#### 2. 预约相关API

**POST /api/v1/bookings** - 创建预约
- 预约验证
- 容量检查
- 事务处理

**GET /api/v1/bookings** - 获取预约列表
- 用户预约查询
- 状态筛选
- 时间范围

**PUT /api/v1/bookings/{id}/cancel** - 取消预约
- 取消规则验证
- 释放名额
- 候补触发

**GET /api/v1/bookings/available-slots** - 查询可预约时间段
- 实时容量查询
- 冲突检查
- 候补状态

#### 3. 标签匹配API

**GET /api/v1/tags/match** - 智能标签匹配
- 多维度匹配算法
- 匹配度计算
- 结果排序

**POST /api/v1/tags/calculate-score** - 计算匹配分数
- 实时计算
- 匹配详情
- 缓存更新

### 智能标签匹配算法

#### 匹配度计算规则

```python
def calculate_match_score(profile, course):
    """
    计算档案与课程的匹配度分数
    总分100分，各维度权重分配
    """
    score = 0

    # 1. 年龄匹配 (30分)
    if course.age_range_start <= profile.age <= course.age_range_end:
        age_score = 30
    else:
        # 年龄不匹配，计算距离分数
        age_distance = min(abs(profile.age - course.age_range_start),
                          abs(profile.age - course.age_range_end))
        age_score = max(0, 30 - age_distance * 5)
    score += age_score

    # 2. 等级匹配 (25分)
    level_score = calculate_level_match_score(profile.level, course.level_requirements)
    score += level_score

    # 3. 性别匹配 (15分)
    if course.gender_requirement == 'mixed' or course.gender_requirement == profile.gender:
        gender_score = 15
    else:
        gender_score = 0
    score += gender_score

    # 4. 发展标签匹配 (20分)
    development_score = calculate_development_match_score(profile.development, course.development_tags)
    score += development_score

    # 5. 权益标签匹配 (10分)
    privilege_score = calculate_privilege_match_score(profile.privilege, course.course_type)
    score += privilege_score

    return round(score, 2)
```

#### L3规则系统

```python
def get_matching_rules(course):
    """
    根据课程等级获取匹配规则
    L3以下：宽松匹配规则
    L3及以上：严格匹配规则
    """
    if 'L3' in course.level_requirements or any(level.startswith('L4') or level.startswith('L5') or level.startswith('L6') for level in course.level_requirements):
        return {
            'age_tolerance': 1,  # 年龄容差±1岁
            'level_requirement': 'strict',  # 严格等级匹配
            'development_weight': 0.3,  # 发展标签权重30%
            'privilege_weight': 0.1    # 权益标签权重10%
        }
    else:
        return {
            'age_tolerance': 2,  # 年龄容差±2岁
            'level_requirement': 'flexible',  # 灵活等级匹配
            'development_weight': 0.2,  # 发展标签权重20%
            'privilege_weight': 0.05   # 权益标签权重5%
        }
```

## Frontend Implementation

### 页面结构

#### 1. 预约首页 (pages/booking/index)

**功能**：智能匹配的课程列表展示

**核心组件**：
- 课程筛选器（日期/类型）
- 匹配度显示组件
- 课程卡片列表
- 加载和空状态

**数据流**：
```
onLoad -> 获取当前档案 -> 调用标签匹配API -> 渲染课程列表
```

#### 2. 课程详情页 (pages/booking/course-detail)

**功能**：课程详细信息和预约操作

**核心组件**：
- 课程信息展示
- 匹配度详情
- 预约日历组件
- 立即预约按钮

**预约流程**：
```
查看详情 -> 选择日期 -> 检查容量 -> 确认预约 -> 支付/成功
```

#### 3. 预约确认页 (pages/booking/booking-confirm)

**功能**：预约信息确认和提交

**核心组件**：
- 预约信息汇总
- 学员信息显示
- 支付方式选择
- 确认提交按钮

### 组件设计

#### 智能标签匹配组件 (components/tag-matching)

```javascript
// components/tag-matching/tag-matching.js
Component({
  properties: {
    profile: Object,
    courses: Array
  },

  methods: {
    calculateMatchScore(course) {
      // 调用后端API计算匹配分数
      return this.requestMatchScore(course.id);
    },

    getMatchLevel(score) {
      if (score >= 90) return 'perfect';
      if (score >= 80) return 'high';
      if (score >= 70) return 'medium';
      return 'low';
    }
  }
});
```

#### 课程卡片组件 (components/course-card)

```xml
<!-- components/course-card/course-card.wxml -->
<view class="course-card {{matchLevel}}">
  <view class="match-score">
    <text class="score">{{matchScore}}分</text>
    <text class="label">匹配度</text>
  </view>

  <view class="course-info">
    <text class="title">{{course.name}}</text>
    <view class="tags">
      <text class="tag age">{{ageRange}}</text>
      <text class="tag level">{{levelDisplay}}</text>
      <text class="tag type">{{courseType}}</text>
    </view>
  </view>

  <view class="action-buttons">
    <button wx:if="{{canBook}}" bindtap="handleBook">立即预约</button>
    <button wx:elif="{{isFull}}" bindtap="handleWaitlist">加入候补</button>
    <button wx:else disabled>暂不可预约</button>
  </view>
</view>
```

## Performance Optimization

### 缓存策略

#### Redis缓存设计

```python
# 缓存键设计
COURSE_LIST_KEY = "course:list:{profile_id}:{date}"
MATCH_SCORE_KEY = "match:score:{profile_id}:{course_id}"
BOOKING_COUNT_KEY = "booking:count:{schedule_id}:{date}"

# 缓存过期时间
COURSE_LIST_TTL = 300  # 5分钟
MATCH_SCORE_TTL = 3600  # 1小时
BOOKING_COUNT_TTL = 60  # 1分钟
```

#### 数据库优化

```sql
-- 复合索引优化查询
CREATE INDEX idx_booking_query ON booking(profile_id, status, booking_date);
CREATE INDEX idx_course_filter ON course(course_type, age_range_start, age_range_end, is_active);

-- 分区表优化(按月分区预约表)
ALTER TABLE booking PARTITION BY RANGE (TO_DAYS(booking_date)) (
    PARTITION p202510 VALUES LESS THAN (TO_DAYS('2025-11-01')),
    PARTITION p202511 VALUES LESS THAN (TO_DAYS('2025-12-01')),
    PARTITION p202512 VALUES LESS THAN (TO_DAYS('2026-01-01'))
);
```

## Testing Strategy

### 单元测试覆盖

- 标签匹配算法测试
- 预约业务逻辑测试
- 缓存机制测试
- 数据验证测试

### 集成测试

- 完整预约流程测试
- 并发预约测试
- 候补机制测试
- 支付集成测试

### 性能测试

- 课程列表加载性能(<1秒)
- 并发预约处理能力
- 缓存命中率监控
- 数据库查询优化

## Security Considerations

### 预约安全

- 用户身份验证和权限检查
- 预约频率限制
- 容量控制和防超售
- 数据完整性验证

### 数据保护

- 敏感数据加密存储
- API访问权限控制
- 审计日志记录
- 数据备份策略

## Constitution Compliance

- ✅ **Principle 1**: 使用微信原生框架，简化实现
- ✅ **Principle 2**: 预约操作使用数据库事务，保证数据一致性
- ✅ **Principle 3**: 清晰的分层架构，代码可维护
- ✅ **Principle 4**: RESTful API设计，前后端解耦
- ✅ **Principle 5**: 纵向切片，独立交付预约功能
- ✅ **Principle 6**: 智能匹配提升用户体验
- ✅ **Principle 7**: 关键业务逻辑测试覆盖
- ✅ **Principle 8**: 用户数据隔离和权限控制
- ✅ **Principle 9**: 支持后续MVP扩展

## Timeline Estimation

### 开发阶段

- **Phase 1**: 数据模型和API开发 - 6天
- **Phase 2**: 智能标签匹配算法 - 4天
- **Phase 3**: 前端页面开发 - 5天
- **Phase 4**: 集成测试和优化 - 3天

### 总预估时间
**18天**（约3-4周，包含测试和优化时间）

---

**创建人**: [技术负责人]
**最后更新**: 2025-10-31
**版本**: 1.0.0
**状态**: Draft
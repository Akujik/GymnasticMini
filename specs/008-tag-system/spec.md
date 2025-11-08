# Feature Specification: Tag System (Design Reference)

**Feature ID**: 008-tag-system
**Feature Name**: 标签系统设计参考
**Status**: Design Reference Only (由MVP-2A实现)
**Created**: 2025-10-31
**Version**: 1.0.0
**Purpose**: 定义完整的标签体系和匹配规则，供MVP-2A/MVP-5参考

---

## 概述

标签系统是百适体操馆项目的核心功能，用于实现智能化的课程推荐和学员管理。系统通过多维度的标签匹配，为每位学员推荐最合适的课程，同时为运营提供精准的数据分析基础。

### 设计目标

1. **智能推荐**：基于学员标签自动匹配适合的课程
2. **精准营销**：支持基于发展标签的精准课程推荐
3. **数据驱动**：为运营决策提供数据支撑
4. **用户体验**：提升学员和家长的使用体验

### 设计原则

- **简化优先**：标签系统设计简洁，易于理解和使用
- **数据完整性**：确保标签数据的准确性和一致性
- **可扩展性**：支持未来新增标签维度
- **性能优化**：标签查询和匹配算法高效

---

## 标签体系架构

### 学员标签维度（5个核心维度）

#### 1. 基础属性标签
- **年龄标签**：基于birthday自动计算
  - 3-4岁：学龄前幼儿
  - 4-5岁：学龄前儿童
  - 5-6岁：学龄儿童
  - 6岁以上：青少年
- **等级标签**：运营手动设置
  - L1-L6：基础技能等级
  - 支持跨级匹配（如L1+表示L1.5）
- **性别标签**：从profile.gender获取
  - male：男性
  - female：女性

#### 2. 发展特征标签
- **发展标签**：运营手动设置，反映学员的学习目标
  - interest：兴趣班（培养体操兴趣）
  - professional：专业班（技能提升）
  - competition：竞赛班（竞技训练）
  - long_term：长训班（长期培养）

#### 3. 权益属性标签
- **权益标签**：自动根据学员状态计算
  - old_user：老用户（有消费记录）
  - new_user：新用户（首次注册）
  - friend_discount：亲友权益（推荐用户）

#### 4. 身份标识标签
- **关系标签**：基于档案关联关系
  - self：本人报课
  - child：子女
  - spouse：配偶
  - parent：父母

#### 5. 自动计算标签
- **年龄标签**：基于birthday实时计算
- **活跃度标签**：基于最近预约记录
- **消费等级标签**：基于消费金额统计

### 课程标签维度（6个核心维度）

#### 1. 基础属性标签
- **等级范围**：支持跨级设置
  - 支持JSON数组：["L1+", "L2"]
  - 支持单一等级："L3"
- **年龄范围**：明确的目标年龄段
  - 3-4：3-4岁
  - 4-5：4-5岁
  - 5-6：5-6岁
  - 6+：6岁以上
  - all：不限年龄
- **性别要求**：性别限制
  - male：仅限男性
  - female：仅限女性
  - both：不限性别

#### 2. 教学特征标签
- **课程类型**：反映课程性质
  - interest：兴趣课程
  - professional：专业技能课程
  - competition：竞技训练课程
  - long_term：长期培养课程
  - trial：体验课程
  - private：私教课程
  - camp：营地课程
- **技能类型**：具体技能方向
  - flexibility：柔韧训练
  - strength：力量训练
  - coordination：协调训练
  - technique：技巧训练

#### 3. 运营属性标签
- **主教老师**：课程主教练
- **助教支持**：是否有助教
- **课程强度**：课程强度等级
  - light：轻度
  - medium：中度
  - high：高强度
- **热门程度**：课程受欢迎程度
  - hot：热门课程
  - normal：常规课程
  - cold：冷门课程

---

## 标签匹配规则

### 规则1：4维标签白名单匹配规则（FR-040）

采用严格的4维白名单验证机制，只有同时满足所有4个维度的课程才会显示：

#### 4维验证框架
**所有课程必须通过以下4个维度的白名单验证**：
1. **等级维度** (Level): 学员等级必须在课程等级范围内
2. **年龄维度** (Age): 学员年龄必须在课程年龄范围内
3. **性别维度** (Gender): 学员性别必须符合课程性别要求（强制验证）
4. **类型维度** (Type): 课程类型必须匹配学员目标类型

#### L3以下学员（基础阶段）- 4维验证
- **匹配条件**：等级 + 年龄 + 性别 + 类型（4维全部强制匹配）
- **逻辑**：低龄学员需要完整的4维白名单验证
- **示例**：5岁L2男性学员 → 匹配等级包含L2 AND 年龄4-5岁 AND 男性/不限 AND 兴趣类课程

#### L3及以上学员（进阶阶段）- 4维验证
- **匹配条件**：等级 + 性别 + 类型 + 年龄（4维全部强制匹配）
- **逻辑**：高龄学员同样需要完整的4维白名单验证
- **示例**：8岁L4男性学员 → 匹配等级包含L4 AND 男性/不限 AND 专业/竞技类课程 AND 年龄6+岁

#### 特殊课程类型的4维验证
- **体验课 (trial)**：年龄 + 性别 + OpenID限制 + 类型=体验课
- **私教课 (private)**：等级 + 性别 + 类型=私教 + 年龄（可选）
- **长训班 (long_term)**：4维全验证 + 发展标签匹配

#### 白名单验证逻辑
```
// 4维白名单验证算法
if (等级匹配 AND 年龄匹配 AND 性别匹配 AND 类型匹配) {
  匹配结果 = 100%  // 白名单通过
} else {
  匹配结果 = 0%    // 任一维度不匹配则排除
}
```

#### 强制性别验证
- **所有课程**：必须明确设置性别限制（male/female/both），不再使用默认值
- **性别验证**：从可选匹配改为强制白名单验证
- **性别枚举**：
  - `male`: 仅限男性学员
  - `female`: 仅限女性学员
  - `both`: 不限性别（但仍需验证学员性别符合条件）

### 规则2：跨级标签匹配

支持灵活的跨级匹配机制：

#### 跨级标签定义
- **L1+**：表示L1.5（比L1高，但不到L2）
- **L2+**：表示L2.5（比L2高，但不到L3）
- **L3+**：表示L3.5（比L3高，但不到L4）

#### 匹配逻辑
- **包含匹配**：学员等级在课程等级范围内
- **示例**：
  - 课程标签["L1+", "L2"]：
    - L1学员 → 不匹配（低于最低要求）
    - L1+学员 → 匹配
    - L2学员 → 匹配

### 规则3：体验课特殊规则

体验课有特殊的匹配限制：

#### 匹配条件
1. **年龄标签**：符合课程年龄要求
2. **未购买限制**：该微信OpenID未购买过体验课
3. **非正式课**：学员钱包无余额（未正式报名）
4. **时间窗口**：30天内未购买过体验课

#### 排除条件
- 已购买过体验课的学员
- 已正式报名的学员
- 年龄不符合的学员

### 规则4：100%完全匹配规则

采用严格的完全匹配逻辑，只有满足所有必要条件的课程才会被推荐：

#### 匹配条件
- **基础属性必须完全匹配**：等级、年龄、性别必须全部符合要求
- **不使用权重计算**：只有匹配（100%）和不匹配（0%）两种结果
- **优先级排序**：热门程度 > 开课时间 > 创建时间

#### 匹配逻辑
```
if (等级匹配 AND 年龄/性别匹配) {
  匹配结果 = 100%  // 完全匹配
} else {
  匹配结果 = 0%    // 不匹配
}
```

---

### 4维匹配规则说明

#### 完整的4维验证逻辑
采用100%白名单验证规则，只有同时满足所有4个维度条件的课程才会显示：

1. **所有学员**：等级 + 年龄 + 性别 + 类型（4维全部强制验证）
2. **体验课特殊规则**：年龄 + 性别 + OpenID限制 + 类型=trial
3. **私教课特殊规则**：等级 + 性别 + 类型=private + 年龄（根据课程设置）

#### 4维白名单排序优先级
当多个课程都通过4维验证时，按以下优先级排序：
1. **热门程度**：hot > normal > cold
2. **开课时间**：时间近的优先
3. **创建时间**：新课程优先
4. **4维匹配度**：4个维度全部匹配的优先（虽然都是100%，但按验证精度排序）

#### 4维验证边界情况处理

##### 1. 不匹配的情况（白名单失败）
以下任一条件不满足，课程都不会显示在推荐列表中：
- 学员等级不在课程等级范围内
- 学员年龄超出课程年龄范围
- 学员性别与课程性别要求不符
- 课程类型与学员目标类型不匹配
- 跨级标签不匹配
- **特别注意**：任一维度失败 = 直接排除，不显示给用户

##### 2. 缺失标签处理
- **学员标签缺失**：提示完善档案信息后再查看课程
- **课程标签缺失**：运营人员必须完善所有4维标签才能正常显示
- **性别标签未设置**：系统强制要求设置，默认为"both"但需要明确确认

##### 3. 4维验证性能优化
- **4维索引**：为等级、年龄、性别、类型4个字段建立复合索引
- **分步过滤**：按过滤效率从高到低进行4维验证
- **缓存策略**：缓存4维匹配结果15分钟
- **分页加载**：每次最多显示20个通过4维验证的课程

---

## 数据模型设计

### 表结构概览

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     profile     │         │    course       │         │  course_tags    │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │◄────────┤ id (PK)         │
│ name            │         │ name            │         │ course_id (FK)   │
│ birthday        │         │ description     │         │ level_range     │
│ gender          │         │ level           │         │ age_range       │
│ level           │         │ course_type     │         │ gender          │
│ development     │         │ max_capacity    │         │ course_type     │
│ privilege       │         │ price           │         │ main_instructor  │
│ ...             │         │ ...             │         │ has_assistant   │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                           ┌─────────────────┐
                           │ tag_match_log   │
                           ├─────────────────┤
                           │ id (PK)         │
                           │ profile_id (FK) │
                           │ course_id (FK) │
                           │ is_matched      │
                           │ match_details   │
                           │ match_rule      │
                           │ created_at      │
                           └─────────────────┘
```

### course_tags表

**描述**：存储课程的详细标签信息，支持复杂的标签配置

```sql
CREATE TABLE `course_tags` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
  `course_id` INT NOT NULL COMMENT '课程ID',
  `level_range` VARCHAR(100) DEFAULT NULL COMMENT '等级范围(JSON数组,如["L1+","L2"])',
  `age_range` ENUM('3-4', '4-5', '5-6', '6+', 'all') DEFAULT 'all' COMMENT '年龄范围',
  `gender` ENUM('male', 'female', 'both') NOT NULL DEFAULT 'both' COMMENT '性别要求（强制设置）',
  `course_type` ENUM('interest', 'professional', 'competition', 'long_term', 'trial', 'private', 'camp') NOT NULL COMMENT '课程类型（4维验证）',
  `skill_types` JSON DEFAULT NULL COMMENT '技能类型(JSON数组)',
  `intensity_level` ENUM('light', 'medium', 'high') DEFAULT 'medium' COMMENT '课程强度',
  `main_instructor` VARCHAR(50) DEFAULT NULL COMMENT '主教老师',
  `has_assistant` BOOLEAN DEFAULT FALSE COMMENT '是否有助教',
  `popularity` ENUM('hot', 'normal', 'cold') DEFAULT 'normal' COMMENT '热门程度',
  `waitlist_capacity` INT NOT NULL DEFAULT 8 COMMENT '候补队列容量限制（FR-043）',
  `gender_validation` ENUM('required', 'optional') NOT NULL DEFAULT 'required' COMMENT '性别验证级别（4维验证）',
  `type_validation` ENUM('strict', 'flexible') NOT NULL DEFAULT 'strict' COMMENT '类型验证级别（4维验证）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_course_type` (`course_type`),
  INDEX `idx_age_range` (`age_range`),
  INDEX `idx_gender` (`gender`),
  INDEX `idx_4d_match` (`course_type`, `age_range`, `gender`), -- 4维验证复合索引
  INDEX `idx_waitlist_capacity` (`waitlist_capacity`),
  INDEX `idx_intensity_level` (`intensity_level`),
  INDEX `idx_popularity` (`popularity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程标签表（支持4维白名单验证和候补容量管理）';
```

**字段说明**：
- `level_range`：支持跨级匹配，JSON格式存储多个等级
- `age_range`：目标年龄段，支持灵活匹配
- `gender`：性别要求（强制设置），both表示不限但仍需验证
- `course_type`：课程类型（4维验证必需），影响匹配策略
- `skill_types`：技能类型JSON数组，支持多技能标签
- `intensity_level`：课程强度，影响推荐算法
- `main_instructor`：主教老师，支持教练匹配
- `has_assistant`：是否有助教，影响课程质量评估
- `popularity`：热门程度，影响推荐排序
- **FR-043字段**：
  - `waitlist_capacity`：候补队列容量限制，默认8人
- **4维验证字段**：
  - `gender_validation`：性别验证级别，required=强制验证
  - `type_validation`：类型验证级别，strict=严格白名单验证

### tag_match_log表

**描述**：记录标签匹配的详细过程，用于调试和优化匹配算法

```sql
CREATE TABLE `tag_match_log` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '匹配日志ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `course_id` INT NOT NULL COMMENT '课程ID',
  `is_matched` BOOLEAN NOT NULL COMMENT '是否匹配',
  `match_score` DECIMAL(5,2) DEFAULT NULL COMMENT '匹配分数(0-100)',
  `match_details` JSON DEFAULT NULL COMMENT '匹配详情',
  `match_rule` VARCHAR(50) DEFAULT NULL COMMENT '匹配规则类型',
  `algorithm_version` VARCHAR(20) DEFAULT 'v1.0' COMMENT '算法版本',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  INDEX `idx_profile_id` (`profile_id`),
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_is_matched` (`is_matched`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签匹配日志表';
```

**字段说明**：
- `is_matched`：最终匹配结果
- `match_score`：匹配分数，用于排序和推荐
- `match_details`：详细的匹配过程，包含各维度得分
- `match_rule`：应用的匹配规则类型
- `algorithm_version`：算法版本，支持算法迭代

**match_details结构示例（4维验证）**：
```json
{
  "validation_type": "4d_whitelist",
  "overall_match": true,
  "match_score": 100.0,
  "dimension_results": {
    "level_match": {
      "score": 100,
      "result": "matched",
      "reason": "学员等级L2在课程等级范围['L1+', 'L2']内",
      "required": true
    },
    "age_match": {
      "score": 100,
      "result": "matched",
      "reason": "学员年龄5.2岁在课程年龄范围4-5岁内",
      "required": true
    },
    "gender_match": {
      "score": 100,
      "result": "matched",
      "reason": "学员性别male符合课程性别要求both",
      "required": true
    },
    "type_match": {
      "score": 100,
      "result": "matched",
      "reason": "学员目标类型interest匹配课程类型interest",
      "required": true
    }
  },
  "validation_summary": {
    "total_dimensions": 4,
    "passed_dimensions": 4,
    "failed_dimensions": 0,
    "validation_result": "whitelist_passed"
  },
  "algorithm_version": "v2.0_4d"
}
```

---

## API设计

### 标签匹配引擎API

#### GET /api/v1/courses/match

**方法**: GET
**路径**: /api/v1/courses/match
**描述**: 获取符合当前档案标签的课程列表（智能匹配）

**Query Parameters**:
- `profile_id` (required): 档案ID
- `week` (optional): 周数，默认本周
- `limit` (optional): 返回数量限制，默认20
- `include_unmatched` (optional): 是否包含不匹配的课程，默认false

**Response（4维验证版）**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "profile_tags": {
      "age_tag": "4-5",
      "level": "L2",
      "gender": "male",
      "development": "interest",
      "privilege": "new_user"
    },
    "match_rule": "4d_whitelist_validation",
    "matched_courses": [
      {
        "course_id": 1,
        "name": "基础体操训练班",
        "level_range": ["L1+", "L2"],
        "age_range": "4-5",
        "gender": "both",
        "course_type": "interest",
        "waitlist_capacity": 8,
        "match_score": 100.0,
        "validation_result": "whitelist_passed",
        "match_details": {
          "validation_type": "4d_whitelist",
          "overall_match": true,
          "dimension_results": {
            "level_match": { "score": 100, "result": "matched", "reason": "等级L2在范围内" },
            "age_match": { "score": 100, "result": "matched", "reason": "年龄5.2岁符合4-5岁" },
            "gender_match": { "score": 100, "result": "matched", "reason": "性别male符合both要求" },
            "type_match": { "score": 100, "result": "matched", "reason": "类型interest匹配" }
          },
          "validation_summary": {
            "total_dimensions": 4,
            "passed_dimensions": 4,
            "validation_result": "whitelist_passed"
          }
        }
      }
    ],
    "unmatched_courses": [
      {
        "course_id": 2,
        "name": "女子竞技训练",
        "level_range": ["L4", "L5"],
        "age_range": "6+",
        "gender": "female",
        "course_type": "competition",
        "match_score": 0,
        "validation_result": "whitelist_failed",
        "match_details": {
          "validation_type": "4d_whitelist",
          "overall_match": false,
          "dimension_results": {
            "level_match": { "score": 0, "result": "failed", "reason": "等级L2低于L4要求" },
            "age_match": { "score": 0, "result": "failed", "reason": "年龄5.2岁不符合6+要求" },
            "gender_match": { "score": 0, "result": "failed", "reason": "性别male不符合female要求" },
            "type_match": { "score": 0, "result": "failed", "reason": "类型interest不符合competition要求" }
          },
          "validation_summary": {
            "total_dimensions": 4,
            "passed_dimensions": 0,
            "validation_result": "whitelist_failed"
          }
        }
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20
    }
  }
}
```

#### POST /api/v1/courses/feedback

**方法**: POST
**路径**: /api/v1/courses/feedback
**描述**: 用户对课程推荐结果进行反馈，用于优化推荐算法

**Request**:
```json
{
  "profile_id": 1,
  "course_id": 1,
  "feedback_type": "like|dislike|not_interested",
  "reason": "课程内容很好，但时间不合适"
}
```

**Response**:
```json
{
  "code": 200,
  "message": "反馈已记录",
  "data": {
    "feedback_id": 123,
    "recorded_at": "2025-10-31T10:00:00Z"
  }
}
```

### 课程标签管理API

#### GET /api/v1/courses/{id}/tags

**方法**: GET
**路径**: /api/v1/courses/{id}/tags
**描述**: 获取课程的标签信息

**Response**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "course_id": 1,
    "level_range": ["L1+", "L2"],
    "age_range": "4-5",
    "gender": "both",
    "course_type": "interest",
    "skill_types": ["flexibility", "coordination"],
    "intensity_level": "medium",
    "main_instructor": "张教练",
    "has_assistant": true,
    "popularity": "normal"
  }
}
```

#### PUT /api/v1/courses/{id}/tags

**方法**: PUT
**路径**: /api/v1/courses/{id}/tags
**描述**: 更新课程标签信息

**Request**:
```json
{
  "level_range": ["L2", "L2+"],
  "age_range": "5-6",
  "course_type": "professional",
  "skill_types": ["strength", "technique"],
  "intensity_level": "high",
  "popularity": "hot"
}
```

### 学员标签管理API

#### GET /api/v1/profiles/{id}/tags

**方法**: GET
**路径**: /api/v1/profiles/{id}/tags
**描述**: 获取学员的标签信息

**Response**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "profile_id": 1,
    "age_tag": "4-5",
    "level": "L2",
    "gender": "male",
    "development": "interest",
    "privilege": "new_user",
    "auto_calculated_tags": {
      "age_tag": "4-5岁",
      "age_range": "4-5",
      "active_status": "active"
    }
  }
}
```

#### PUT /api/v1/profiles/{id}/tags

**方法**: PUT
**路径**: /api/v1/profiles/{id}/tags
**描述**: 更新学员标签信息

**Request**:
```json
{
  "development": "professional",
  "privilege": "old_user"
}
```

---

## 数据验证规则

### 输入验证

#### 课程标签验证
- **level_range**：必须是有效的等级格式
- **age_range**：必须是预定义的年龄范围
- **gender**：只能是male、female、both之一
- **course_type**：必须是预定义的课程类型之一
- **skill_types**：必须是预定义的技能类型数组

#### 学员标签验证
- **development**：必须是预定义的发展标签之一
- **privilege**：根据学员状态自动计算，不允许手动修改

### 业务验证

#### 标签匹配验证
- **年龄匹配**：学员年龄必须在课程年龄范围内
- **等级匹配**：学员等级必须包含在课程等级范围内
- **性别匹配**：学员性别必须符合课程性别要求
- **跨级匹配**：正确处理L1+、L2+等跨级标签

#### 数据完整性验证
- **必需字段**：确保所有必需字段都有值
- **外键约束**：确保引用的数据完整性
- **枚举值**：确保枚举值在预定义范围内

---

## 性能优化策略

### 数据库优化

#### 索引设计
- **course_tags表**：
  - 主键索引：`id`
  - 外键索引：`course_id`
  - 业务索引：`course_type`、`age_range`、`gender`
  - 复合索引：`(course_type, age_range)`、`(course_type, gender)`

- **tag_match_log表**：
  - 主键索引：`id`
  - 外键索引：`profile_id`、`course_id`
  - 查询索引：`created_at`、`is_matched`
  - 复合索引：`(profile_id, created_at)`

#### 查询优化
- 使用EXISTS子查询替代JOIN操作
- 合理使用LIMIT限制结果集
- 避免全表扫描操作

### 缓存策略

#### Redis缓存
- **用户标签缓存**：缓存学员标签信息30分钟
- **课程标签缓存**：缓存课程标签信息1小时
- **匹配结果缓存**：缓存匹配结果15分钟

#### 缓存键设计
```
user:{profile_id}:tags          # 用户标签缓存
course:{course_id}:tags        # 课程标签缓存
match:{profile_id}:{week}     # 匹配结果缓存
```

### 算法优化

#### 匹配算法优化
- **早期过滤**：先进行基础匹配，减少后续计算
- **权重计算**：使用预计算的权重值
- **批量处理**：支持批量匹配计算

#### 排序优化
- **预排序**：热门课程优先展示
- **动态权重**：根据反馈动态调整权重
- **分页加载**：避免一次性加载大量数据

---

## 测试策略

### 单元测试

#### 标签匹配算法测试
```python
def test_level_matching():
    # 测试等级匹配逻辑
    assert match_level("L2", ["L1+", "L2"]) == True
    assert match_level("L1", ["L1+", "L2"]) == False
    assert match_level("L1+", ["L1+", "L2"]) == True

def test_age_matching():
    # 测试年龄匹配逻辑
    assert match_age(5.2, "4-5") == True
    assert match_age(6.1, "4-5") == False
    assert match_age(7.0, "6+") == True
```

#### 数据模型测试
```python
def test_course_tags_creation():
    # 测试课程标签创建
    course_tag = create_course_tag(
        course_id=1,
        level_range=["L1+", "L2"],
        course_type="interest"
    )
    assert course_tag.level_range == ["L1+", "L2"]
    assert course_tag.course_type == "interest"

def test_tag_match_log_creation():
    # 测试匹配日志创建
    log = create_tag_match_log(
        profile_id=1,
        course_id=1,
        is_matched=True,
        match_score=95.5
    )
    assert log.is_matched == True
    assert log.match_score == 95.5
```

### 集成测试

#### API测试
```python
def test_courses_match_api():
    # 测试课程匹配API
    response = client.get("/api/v1/courses/match", params={
        "profile_id": 1,
        "week": 1
    })
    assert response.status_code == 200
    assert "matched_courses" in response.json()["data"]
    assert "profile_tags" in response.json()["data"]

def test_course_tags_api():
    # 测试课程标签API
    response = client.get("/api/v1/courses/1/tags")
    assert response.status_code == 200
    assert "level_range" in response.json()["data"]
```

### 性能测试

#### 匹配性能测试
```python
def test_matching_performance():
    # 测试匹配算法性能
    import time
    start_time = time.time()

    # 模拟1000次匹配计算
    for i in range(1000):
        match_courses(profile_id=i, week=1)

    end_time = time.time()
    avg_time = (end_time - start_time) / 1000

    # 平均匹配时间应小于50ms
    assert avg_time < 0.05
```

---

## 部署和监控

### 数据库迁移

#### 迁移脚本
```sql
-- 创建标签系统表
-- 执行course_tags和tag_match_log表的创建脚本

-- 初始化标签数据
UPDATE profile SET
  development = CASE
    WHEN level <= 'L2' THEN 'interest'
    WHEN level BETWEEN 'L3' AND 'L4' THEN 'professional'
    WHEN level >= 'L5' THEN 'competition'
    ELSE 'interest'
  END,
  privilege = CASE
    WHEN created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'old_user'
    ELSE 'new_user'
  END;
```

### 监控指标

#### 业务指标
- **匹配准确率**：用户对推荐结果的满意度
- **点击转化率**：推荐课程的点击率
- **预约转化率**：推荐课程的预约成功率
- **用户活跃度**：使用标签功能的用户活跃度

#### 技术指标
- **API响应时间**：标签匹配API的响应时间
- **数据库查询性能**：标签查询的执行时间
- **缓存命中率**：Redis缓存的命中率
- **算法准确性**：匹配算法的准确率

### 日志记录

#### 匹配日志
```json
{
  "timestamp": "2025-10-31T10:00:00Z",
  "profile_id": 1,
  "course_id": 1,
  "action": "tag_matching",
  "algorithm_version": "v1.0",
  "performance": {
    "execution_time_ms": 45,
    "cache_hit": false
  },
  "result": {
    "matched": true,
    "score": 95.5,
    "match_details": {...}
  }
}
```

#### 用户行为日志
```json
{
  "timestamp": "2025-10-31T10:05:00Z",
  "user_id": 1,
  "profile_id": 1,
  "action": "view_matched_courses",
  "context": {
    "filter_applied": false,
    "total_courses": 15,
    "matched_courses": 8
  }
}
```

---

## 未来扩展计划

### 短期扩展（3个月内）

#### 1. 机器学习推荐
- **协同过滤**：基于用户行为的推荐
- **内容推荐**：基于课程内容的推荐
- **混合推荐**：结合标签和机器学习的推荐

#### 2. 实时推荐
- **WebSocket推送**：实时推荐更新
- **动态调整**：基于用户行为实时调整推荐
- **A/B测试**：推荐算法的A/B测试

#### 3. 社交推荐
- **好友推荐**：基于好友关系的推荐
- **群体推荐**：基于相似群体的推荐
- **专家推荐**：基于专家评分的推荐

### 中期扩展（6个月内）

#### 1. 多维度标签
- **时间标签**：上课时间偏好
- **地点标签**：上课地点偏好
- **价格标签**：价格敏感度标签
- **教练标签**：教练偏好标签

#### 2. 智能分析
- **学习路径分析**：基于历史数据的学习路径推荐
- **技能评估**：基于表现数据的技能水平评估
- **成长预测**：学员成长潜力预测

#### 3. 个性化定制
- **自定义权重**：用户可调整推荐权重
- **个性化界面**：基于用户偏好的界面定制
- **智能提醒**：个性化的课程提醒

### 长期扩展（1年内）

#### 1. AI驱动推荐
- **深度学习模型**：基于深度学习的推荐算法
- **自然语言处理**：基于用户评论的情感分析
- **图像识别**：基于训练视频的技术分析

#### 2. 全场景推荐
- **跨平台推荐**：整合多平台数据
- **全生命周期推荐**：从入门到精通的完整推荐
- **社区推荐**：基于社区数据的推荐

---

## 附录

### 标签枚举值定义

#### 发展标签枚举
```python
DEVELOPMENT_TAGS = {
    'interest': {
        'name': '兴趣班',
        'description': '培养体操兴趣',
        'priority': 1
    },
    'professional': {
        'name': '专业班',
        'description': '专业技能提升',
        'priority': 2
    },
    'competition': {
        'name': '竞赛班',
        'description': '竞技训练',
        'priority': 3
    },
    'long_term': {
        'name': '长训班',
        'description': '长期培养',
        'priority': 4
    }
}
```

#### 权益标签枚举
```python
PRIVILEGE_TAGS = {
    'old_user': {
        'name': '老用户',
        'description': '有消费记录的用户',
        'benefits': ['课程优惠', '优先预约']
    },
    'new_user': {
        'name': '新用户',
        'description': '首次注册的用户',
        'benefits': ['体验优惠', '引导服务']
    },
    'friend_discount': {
        'name': '亲友权益',
        'description': '推荐用户',
        'benefits': ['推荐奖励', '亲友优惠']
    }
}
```

### 错误代码定义

#### 标签系统错误代码
- **TAG_001**: 标签格式错误
- **TAG_002**: 标签匹配失败
- **TAG_003**: 标签数据不一致
- **TAG_004**: 标签算法异常
- **TAG_005**: 标签缓存异常

#### HTTP状态码映射
```python
TAG_ERROR_CODES = {
    400: 'TAG_001',  # 请求参数错误
    404: 'TAG_002',  # 资源不存在
    422: 'TAG_003',  # 数据验证失败
    500: 'TAG_004',  # 服务器内部错误
    503: 'TAG_005'   # 服务不可用
}
```

---

**文档版本**: 1.0.0
**创建日期**: 2025-10-31
**最后更新**: 2025-10-31
**负责人**: 产品团队

---

*本文档为标签系统的设计参考，具体实现请参照MVP-2A规格文档和MVP-5运营后台规格文档。*
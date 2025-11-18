# MVP-002 课程显示与预约系统 - 完整文档汇总

**MVP版本**: MVP-002 (course-display-and-booking)
**创建日期**: 2025-11-08
**最后更新**: 2025-11-17
**状态**: Updated (基于外部AI专家反馈优化3维硬匹配)
**前序依赖**: MVP-001 (001-user-identity-system)

---

## 项目概览

### 功能范围

MVP-002是一个完整的课程浏览与预约系统，支持成人和儿童课程的混合显示、3维硬匹配智能标签匹配、预约管理、时间冲突检测等核心功能。该系统基于3维硬匹配+软标签排序算法，为用户提供精准的课程推荐和便捷的预约体验。

### MVP依赖关系

- **前序依赖**: MVP-001 (用户身份系统)
  - 需要用户登录和档案管理功能
  - 预约时需要选择为哪个学员预约
  - JWT Token认证

- **后续MVP预留接口**:
  - MVP-003 (候补与补课系统): 候补队列机制、补课记录生成
  - MVP-004 (私教系统): 复用预约逻辑和冲突检查
  - MVP-005 (支付系统): 课程支付功能
  - MVP-007 (运营后台): 课程管理功能

### 关键技术决策

1. **3维硬匹配白名单算法**: 采用白名单匹配机制，等级+年龄+性别3个维度必须全部匹配，类型降级为软标签用于排序
2. **L3规则系统**: 根据课程等级采用不同的匹配策略，但都遵循3维硬匹配规则
3. **价格历史保护**: 基于pricing_rule表的动态价格计算，保护用户权益
4. **时间冲突检测**: 精确的时间重叠判断，支持不同档案独立预约
5. **端到端集成测试**: 完整的集成测试体系，确保系统稳定性和一致性

---

## 功能规格

### 用户故事

#### US-1: 3维硬匹配智能课程推荐 (Priority: P1)
家长在"预约Tab"查看课程列表，系统基于3维硬匹配规则（等级+年龄+性别）过滤课程，任一维度不匹配则完全不显示。通过硬匹配的课程按软标签（类型、发展标签、热门程度）排序推荐。

**验收场景**:
- 系统执行3维硬匹配白名单验证，等级+年龄+性别必须全部符合
- 无档案用户显示浮动提示引导创建档案
- 有档案用户显示匹配分数和匹配详情
- 支持按课程类型筛选（体验课/正式课/全部）
- 匹配失败的课程不显示，避免干扰用户选择
- 无档案用户点击预约时拦截并引导创建档案

#### US-2: 智能匹配固定班课程 (Priority: P1)
家长在"预约Tab"点击"固定班"入口，系统基于当前档案的标签智能匹配并显示适合的长期课程，按匹配度和热门程度综合排序。

**验收场景**:
- 5岁L2兴趣班用户显示包含L2且年龄4-6岁的长期课程
- 显示匹配详情（等级100分+年龄100分+发展80分）
- 已满员课程显示"已满员"标签和"加入候补"按钮
- 无完全匹配时显示"部分匹配课程"并标注建议联系客服

#### US-3: 基于年龄自动识别的预约流程 (Priority: P1)
系统基于档案年龄自动识别成人/儿童类型，简化预约流程，无需用户手动选择。

**验收场景**:
- 5岁儿童显示"为儿童档案XXX预约本课程"
- 20岁成人显示"为成人档案XXX预约本课程"
- 体验课检查体验次数限制（每个微信号仅可体验一次）
- 切换档案时自动更新类型识别

#### US-4: 时间冲突检测 (Priority: P0)
系统必须在用户预约课程前检测时间冲突，确保用户不会同时预约重叠时间的课程。

**验收场景**:
- 重叠时间预约时提示"时间冲突，请先取消《课程A》后再预约"
- 时间刚好衔接（15:00-16:00和16:00-17:00）允许预约
- 不同档案间独立管理，时间不冲突
- 拒绝预约已过期时间的课程

#### US-5: 查看我的课程 (Priority: P1)
家长在"课程Tab"查看当前档案的所有课程，包括即将上的课程和历史课程。

**验收场景**:
- "当期课程"显示所有状态为"未开课"的预约记录
- "已完成"Tab显示已上过的课程
- 点击课程进入详情页，显示课程信息+取消按钮
- 档案切换后显示新档案的课程列表

#### US-6: 取消预约/请假 (Priority: P1)
灵活排课可以直接取消，固定班改为"请假"逻辑。

**验收场景**:
- 灵活排课距开课>6小时可取消，体验课微信原路退款
- 开课前6小时内无法取消，提示联系客服
- 固定班距开课>6小时请假，课时不扣除，生成"待补课"记录
- 固定班距开课前6小时内请假，课时扣除（算旷课）

#### US-7: 长期固定班预约 (Priority: P0)
用户可选择长期固定班或单次预约，两者有不同的扣费和取消规则。

**验收场景**:
- 固定班预约成功后状态为"排队中"，开课前6小时自动扣除课时费
- 固定班开课前7小时可取消，释放临时名额
- 固定班连续请假4次自动通知运营释放班级名额
- 钱包余额不足时显示提示"请联系教务老师进行钱包充值"

#### US-8: 课时费计算规则 (Priority: P1)
系统通过4步顺序判断逻辑计算课时费，确保价格计算的准确性和一致性。

**验收场景**:
- 第1步判断人员属性（儿童/成人）
- 第2步判断用户属性（老用户/新用户），成人跳过此步
- 第3步判断权益类型（亲友权益6折）
- 第4步匹配课程标签和等级获得最终课时费

#### US-9: 钱包冻结状态下的课程浏览和预约限制 (Priority: P1)

当用户钱包处于冻结状态时，系统需要提供清晰的状态提示和限制预约操作，同时为用户提供取消冻结的便捷入口。

**Why this priority**: 冻结状态直接影响用户体验，必须明确告知用户当前状态并提供解决方案，避免用户困惑和操作失败。

**Independent Test**: 模拟用户冻结状态，验证界面提示是否正确显示，预约操作是否被正确限制，取消冻结入口是否可用。

**Acceptance Scenarios**:

1. **Given** 用户钱包处于冻结状态，**When** 进入"预约Tab"，**Then** 正常显示课程列表，但在页面顶部显示冻结状态提示条"课卡处于冻结阶段"
2. **Given** 用户钱包处于冻结状态，**When** 点击任何课程的"立即预约"按钮，**Then** 显示弹窗"课卡处于冻结阶段，暂时无法预约课程"，并提供"申请取消冻结"按钮
3. **Given** 用户点击"申请取消冻结"按钮，**When** 系统处理，**Then** 显示确认弹窗"确定要申请取消冻结吗？取消后将恢复预约权限"
4. **Given** 用户确认取消冻结，**When** 系统处理成功，**Then** 钱包状态变为激活，页面提示"冻结已取消，您现在可以正常预约课程"
5. **Given** 用户钱包冻结但查看课程详情，**When** 进入课程详情页，**Then** 正常显示课程信息，但预约按钮显示为"课卡冻结中"的禁用状态
6. **Given** 管理员在后台冻结用户钱包，**When** 用户在小程序进行任何操作，**Then** 下次API调用时立即检测到冻结状态并显示相应提示

### 功能需求

#### 核心需求 (FR-001至FR-045)

**3维硬匹配标签匹配系统**:
- FR-001: 系统必须基于当前档案的多维度标签智能匹配课程
- FR-040: 实施3维硬匹配标签白名单匹配验证（等级+年龄+性别+类型）
- FR-006: 执行3维硬匹配白名单匹配规则，任一维度不匹配则课程不显示
- FR-007: 支持跨级标签匹配（L1+/L2+等格式）
- FR-010: 计算并显示匹配分数（0-100分），基于100%匹配逻辑

**时间冲突检测**:
- FR-020: 必须在用户预约课程前检测时间冲突
- FR-021: 支持时间重叠的精确判断
- FR-022: 支持不同档案间的独立预约
- FR-025: 检查课程时间的有效性

**预约管理**:
- FR-014: 支持灵活排课的取消预约（开课前6小时）
- FR-015: 支持固定班的请假逻辑，生成待补课记录
- FR-016: 记录连续请假次数，连续请假4次自动通知运营
- FR-017: 取消预约后释放名额并通知候补队列

**价格计算系统**:
- FR-026: 根据学员的customer_type和等级动态计算课程价格
- FR-027: 在课程列表和详情页显示实际价格（考虑折扣）
- FR-028: 为亲友权益用户显示"🎉亲友专享6折"标签
- FR-032: 存储价格规则（pricing_rule表）

**钱包冻结状态检查**:
- FR-041: 系统必须在所有预约API开始时检查用户钱包状态，冻结状态下禁止预约操作
- FR-042: 系统必须在用户钱包冻结时在课程列表页面显示冻结状态提示条
- FR-043: 系统必须在用户点击预约操作时检查冻结状态，冻结时显示弹窗提示并提供取消冻结入口
- FR-044: 系统必须支持用户在小程序内申请取消冻结，包含确认流程
- FR-045: 系统必须在冻结期间禁用所有预约相关按钮，但允许用户继续浏览课程信息
- FR-046: 系统必须在冻结状态解除后立即恢复用户的预约权限

### 成功标准

**性能指标**:
- SC-001: 用户切换档案后，课程列表在500ms内重新排序显示，成功率>99%
- SC-002: 课程详情页加载时间<1秒，匹配详情显示准确率>99%
- SC-006: 标签匹配算法执行时间<100ms，匹配分数计算准确率>95%

**准确性指标**:
- SC-004: 3维硬匹配白名单匹配规则执行准确率100%
- SC-005: 跨级标签匹配准确率100%
- SC-007: 体验课限制准确率100%（已体验过的微信号无法再次预约）
- SC-008: 时间冲突检测准确率100%

**业务指标**:
- SC-003: 完整预约流程<2分钟，流程放弃率<10%
- SC-009: 取消预约后，名额在10秒内释放，成功率>95%

### 边界情况

**网络和并发处理**:
- 网络异常时显示Toast"网络异常，请稍后重试"，使用乐观锁机制
- 多人同时预约最后一门课时，使用数据库乐观锁，先到先得
- 候补通知失败时系统重试3次，仍失败则记录日志并通知运营

**数据一致性**:
- 课程时间变更时系统通知所有预约用户，提供免费取消选项
- 教练临时取消课程时，系统自动取消所有相关预约
- 候补用户10分钟内未确认自动过期，顺位通知下一位

**年龄类型识别**:
- 学员年龄正好18岁时按成人类型识别
- 虚拟年龄设置时，档案类型基于实际年龄，课程匹配使用虚拟年龄
- 系统类型识别与用户期望不符时，预约确认显示识别依据

---

## 技术实现计划

### 架构设计

#### 系统架构图
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

#### 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 小程序前端 | 微信原生框架(MINA) | 基础库 3.11.0+ | 课程展示、预约界面 |
| 渲染引擎 | Skyline | 基础库 3.0.0+ | 课程列表性能优化 |
| 后端框架 | Python FastAPI | 0.100+ | 预约API服务 |
| 数据库 | MySQL | 8.0+ | 课程和预约数据存储 |
| ORM | SQLAlchemy | 2.x | 数据库操作 |
| 缓存 | Redis | 6.0+ | 课程列表缓存 |
| 认证 | JWT | - | 用户身份验证 |

### 3维硬匹配标签匹配服务架构

#### 服务设计原则
- **白名单匹配机制**: 4个维度必须全部匹配，任一维度不匹配则排除
- **统一匹配算法**: 与私教课系统共享相同的匹配逻辑
- **格式统一**: 年龄范围使用VARCHAR格式，支持灵活配置

#### 3维硬匹配标签定义
1. **等级维度 (level)**: 学员等级 vs 课程等级范围
2. **年龄维度 (age)**: 学员年龄 vs 课程年龄范围
3. **性别维度 (gender)**: 学员性别 vs 课程性别要求
4. **类型维度 (type)**: 课程类型 vs 学员目标类型

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

### API设计

#### 统一响应格式
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

#### 核心API端点

**课程相关API**:
- GET /api/v1/courses - 获取课程列表（智能标签匹配）
- GET /api/v1/courses/{id} - 获取课程详情
- GET /api/v1/courses/{id}/schedule - 获取课程安排

**预约相关API**:
- POST /api/v1/bookings - 创建预约
- GET /api/v1/bookings - 获取预约列表
- PUT /api/v1/bookings/{id}/cancel - 取消预约
- GET /api/v1/bookings/available-slots - 查询可预约时间段

**标签匹配API**:
- GET /api/v1/tags/match - 智能标签匹配
- POST /api/v1/tags/calculate-score - 计算匹配分数

**价格计算API**:
- GET /api/v1/courses/{id}/price - 获取课程的个性化价格

#### 智能标签匹配API示例

**GET /api/v1/courses/match**
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
        "course_tags": {
          "level_range": ["L1+", "L2"],
          "age_range": "4-5",
          "gender": "both",
          "course_type": "interest",
          "waitlist_capacity": 8
        },
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
          }
        }
      }
    ]
  }
}
```

### 前端设计

#### 页面结构
```
miniprogram/
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
└── components/
    ├── course-card/         # 课程卡片组件
    ├── tag-display/         # 标签显示组件
    ├── booking-calendar/    # 预约日历
    └── match-score/         # 匹配度显示
```

#### 预约首页流程
```
onLoad -> 获取当前档案 -> 调用标签匹配API -> 渲染课程列表
```

#### 预约流程
```
查看详情 -> 选择日期 -> 检查容量 -> 确认预约 -> 支付/成功
```

#### 智能标签匹配组件
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

### 性能优化

#### 缓存策略
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

---

## 数据模型设计

### 数据库架构

#### 实体关系图
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     course      │         │  course_tags    │         │   schedule      │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────────┤ course_id (FK)  │◄────────┤ id (PK)         │
│ name            │ 1:1     │ level_range     │         │ course_id (FK)  │
│ description     │         │ age_range       │         │ start_time      │
│ max_capacity    │         │ gender          │         │ end_time        │
│ price           │         │ course_type     │         │ date            │
│ main_instructor_id│       │ skill_types     │         │ instructor_id   │
│ end_date        │         │ intensity_level │         │ available_spots │
│ status          │         │ main_instructor │         │ created_at      │
│ created_at      │         │ has_assistant   │         └─────────────────┘
│ updated_at      │         │ popularity      │                  │
└─────────────────┘         │ created_at      │                  │
         │                   └─────────────────┘                  │
         ▼                                                         ▼
┌─────────────────┐                                     ┌─────────────────┐
│   instructor    │                                     │    booking      │
├─────────────────┤                                     ├─────────────────┤
│ id (PK)         │                                     │ id (PK)         │
│ name            │                                     │ schedule_id (FK)│
│ avatar_url      │                                     │ profile_id (FK) │
│ bio             │                                     │ status          │
│ rating          │                                     │ match_score     │
│ status          │                                     │ match_details   │
│ created_at      │                                     │ booked_at       │
│ updated_at      │                                     │ cancelled_at    │
└─────────────────┘                                     │ note            │
         │                                               └─────────────────┘
         ▼                                                        │
┌─────────────────┐                                              ▼
│    profile      │ (来自MVP-1,扩展字段)                        ┌─────────────────┐
├─────────────────┤                                              │ tag_match_log   │
│ id (PK)         │                                              ├─────────────────┤
│ name            │                                              │ id (PK)         │
│ birthday        │                                              │ profile_id (FK) │
│ gender          │                                              │ course_id (FK)  │
│ level           │                                              │ is_matched      │
│ development     │ ← 新增字段                                  │ match_score     │
│ privilege       │ ← 新增字段                                  │ match_details   │
│ status          │                                              │ match_rule      │
│ created_at      │                                              │ algorithm_version│
│ updated_at      │                                              │ created_at      │
└─────────────────┘                                              └─────────────────┘
```

### 核心表设计

#### 1. course（课程表）
存储课程的基础信息，与标签信息分离存储

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 | 索引 |
|--------|----------|------|--------|------|------|
| id | INT | PK, AUTO_INCREMENT | - | 课程ID | PRIMARY |
| name | VARCHAR(100) | NOT NULL | - | 课程名称 | INDEX |
| description | TEXT | NULL | NULL | 课程描述 | - |
| max_capacity | INT | NOT NULL | 10 | 最大容量 | - |
| price | DECIMAL(10,2) | NOT NULL | 0.00 | 课程价格 | - |
| main_instructor_id | INT | NULL | NULL | 主教练ID | INDEX |
| sub_instructor_id | INT | NULL | NULL | 代课教练ID | INDEX |
| end_date | DATE | NULL | NULL | 课程结束日期（固定班用） | INDEX |
| status | TINYINT | NOT NULL | 1 | 状态：1=正常,0=已删除 | INDEX |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 | INDEX |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 | INDEX |

#### 2. course_tags（课程标签表）
存储课程的多维度标签信息，支持智能匹配算法

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 | 索引 |
|--------|----------|------|--------|------|------|
| id | INT | PK, AUTO_INCREMENT | - | 标签ID | PRIMARY |
| course_id | INT | NOT NULL | - | 课程ID | UNIQUE |
| level_range | VARCHAR(100) | NULL | NULL | 等级范围(JSON数组,如["L1+", "L2"]) | INDEX |
| age_range | VARCHAR(20) | DEFAULT '全年龄段' | 年龄范围(4-6岁/成人/全年龄段等) | INDEX |
| gender | ENUM('male','female','both') | DEFAULT 'both' | 性别要求 | INDEX |
| course_type | ENUM('interest','professional','competition','long_term','trial','private','camp') | NOT NULL | - | 课程类型 | INDEX |
| skill_types | JSON | NULL | NULL | 技能类型(JSON数组) | - |
| intensity_level | ENUM('light','medium','high') | DEFAULT 'medium' | 课程强度 | INDEX |
| main_instructor | VARCHAR(50) | NULL | NULL | 主教老师 | - |
| has_assistant | BOOLEAN | DEFAULT FALSE | 是否有助教 | - |
| popularity | ENUM('hot','normal','cold') | DEFAULT 'normal' | 热门程度 | INDEX |
| audience | ENUM('child','adult','both') | DEFAULT 'both' | 目标人群 | INDEX |
| pricing_category | ENUM('group','long_term','private_1v1','private_1v2','trial') | DEFAULT 'group' | 定价类别 | INDEX |
| base_price | DECIMAL(10,2) | NULL | NULL | 基础价格(用于显示) | INDEX |
| pricing_strategy | ENUM('fixed','dynamic') | DEFAULT 'dynamic' | 定价策略 | INDEX |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 | INDEX |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 | INDEX |

**3维硬匹配标签白名单匹配**: 等级维度 + 年龄维度 + 性别维度 + 类型维度，任一维度不匹配则课程不显示

#### 3. booking（预约记录表）
存储用户的预约记录和标签匹配信息，支持多种预约状态

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 | 索引 |
|--------|----------|------|--------|------|------|
| id | INT | PK, AUTO_INCREMENT | - | 预约ID | PRIMARY |
| schedule_id | INT | NOT NULL | - | 课程安排ID | INDEX |
| profile_id | INT | NOT NULL | - | 档案ID | INDEX |
| status | ENUM('booked','completed','cancelled','leave','absent') | NOT NULL | 'booked' | 预约状态 | INDEX |
| match_score | DECIMAL(5,2) | NULL | NULL | 匹配分数(0-100) | INDEX |
| match_details | JSON | NULL | NULL | 匹配详情 | - |
| booked_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 预约时间 | INDEX |
| cancelled_at | TIMESTAMP | NULL | NULL | 取消时间 | INDEX |
| can_refund_until | TIMESTAMP | NULL | NULL | 退费截止时间 | INDEX |
| note | TEXT | NULL | NULL | 备注 | - |

**枚举值**: 'booked'（已预约）, 'completed'（已完成）, 'cancelled'（已取消）, 'leave'（请假）, 'absent'（旷课）

#### 4. pricing_rule（价格规则表）
存储多维度价格规则，支持基于客户类型、人群、课程类型、等级的差异化定价

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 | 索引 |
|--------|----------|------|--------|------|------|
| id | INT | PK, AUTO_INCREMENT | - | 价格规则ID | PRIMARY |
| rule_name | VARCHAR(100) | NOT NULL | - | 规则名称 | INDEX |
| customer_type | ENUM('old_user','new_user','friend') | NOT NULL | - | 客户类型 | INDEX |
| audience | ENUM('child','adult') | NOT NULL | - | 人群类型 | INDEX |
| course_type | ENUM('group','long_term','private_1v1','private_1v2','trial') | NOT NULL | - | 课程类型 | INDEX |
| level_range | VARCHAR(50) | NULL | NULL | 等级范围(如"L1-L4") | INDEX |
| price_per_hour | DECIMAL(10,2) | NOT NULL | - | 每小时价格 | - |
| discount_rate | DECIMAL(3,2) | DEFAULT 1.00 | 1.00 | 折扣率 | - |
| effective_date | DATE | NULL | NULL | 生效日期 | INDEX |
| is_active | BOOLEAN | DEFAULT TRUE | TRUE | 是否启用 | INDEX |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 | INDEX |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 | INDEX |

**业务规则**:
- `customer_type`: old_user(老用户)/new_user(新用户)/friend(亲友权益)
- `audience`: child(儿童)/adult(成人)，基于年龄自动判断
- `discount_rate`: 折扣率，1.00表示无折扣，0.60表示6折
- `effective_date`: 生效日期，用于区分老用户和新用户基准日(2024-11-11)
- 亲友权益仅适用于团课，discount_rate自动设为0.60
- 成人课程新老同价，无差异定价

### API契约

#### GET /api/v1/courses/{id}/price
获取课程的个性化价格（基于学员档案动态计算）

**Query Parameters**:
- `profile_id` (required): 学员档案ID

**Response**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "course_id": 1,
    "profile_id": 1,
    "customer_type": "old_user",
    "audience": "child",
    "course_type": "group",
    "level": "L2",
    "base_price": 180.00,
    "discount_rate": 1.00,
    "final_price": 180.00,
    "price_rule": "儿童团课L1-L4老用户价",
    "price_breakdown": {
      "price_per_hour": 180.00,
      "duration_hours": 1.0,
      "subtotal": 180.00,
      "discount": 0.00,
      "total": 180.00
    },
    "discount_label": null
  }
}
```

**亲友权益示例**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "customer_type": "friend",
    "base_price": 180.00,
    "discount_rate": 0.60,
    "final_price": 108.00,
    "price_rule": "儿童团课L1-L4亲友价",
    "price_breakdown": {
      "price_per_hour": 180.00,
      "duration_hours": 1.0,
      "subtotal": 180.00,
      "discount": 72.00,
      "total": 108.00
    },
    "discount_label": "🎉亲友专享6折"
  }
}
```

### 数据验证规则

#### 输入验证

**Course Creation Validation**:
- **name**: 必填，1-100字符，不能包含特殊字符
- **description**: 可选，最多1000字符
- **level**: 必填，只能是L1-L6中的一个
- **max_capacity**: 必填，1-50之间的整数
- **price**: 必填，0-9999.99之间的数值
- **course_type**: 必填，只能是flexible或fixed
- **main_instructor_id**: 必填，有效的教练ID

**Booking Creation Validation**:
- **schedule_id**: 必填，有效的课程安排ID
- **student_id**: 必填，有效的学员ID
- **note**: 可选，最多200字符

#### 业务验证规则

**Course Management Rules**:
- 课程名称在相同等级下不能重复
- 教练在同一时间不能安排两门课程
- 固定班课程必须有明确的结束日期
- 课程容量不能超过50人

**Booking Management Rules**:
- 学员不能重复预约同一课程安排
- 预约时检查课程时间是否冲突
- 取消预约需要满足时间限制（开课前6小时）
- 请假规则：不设置月度次数限制，连续请假4次触发运营通知

---

## 任务分解清单

### 开发阶段划分

#### Phase 1: Setup & Infrastructure (任务T001-T004)
- 初始化项目结构和环境配置
- 创建数据库迁移脚本
- 实现基础工具函数

#### Phase 2: Data Models & Schemas (任务T005-T009)
- 创建Course、CourseSchedule、Booking数据模型
- 实现标签匹配缓存模型
- 创建Pydantic数据验证模型

#### Phase 3: Core Business Logic - Tag Matching (任务T010-T013)
- 实现3维硬匹配标签匹配核心算法
- 实现L3规则系统
- 实现标签匹配缓存管理
- 创建标签匹配API端点

#### Phase 4: Course Management APIs (任务T014-T017)
- 实现课程查询服务
- 实现课程控制器
- 实现课程安排查询服务
- 实现课程统计和分析功能

#### Phase 5: Booking Management APIs (任务T018-T022)
- 实现预约服务核心逻辑
- 实现预约控制器
- 实现预约冲突检测
- 实现预约状态管理
- 实现预约历史和分析

#### Phase 6: Frontend - Booking Pages (任务T023-T026)
- 实现预约首页
- 实现课程卡片组件
- 实现课程筛选器组件
- 实现标签匹配显示组件

#### Phase 7: Frontend - Course Detail Pages (任务T027-T029)
- 实现课程详情页
- 实现预约日历组件
- 实现课程安排列表

#### Phase 8: Frontend - Booking Flow (任务T030-T033)
- 实现预约确认页
- 实现预约成功页
- 实现我的预约页面
- 实现预约详情页面

#### Phase 9: Frontend - Fixed Class Features (任务T034-T036)
- 实现固定班课程页面
- 实现灵活排课页面
- 实现候补功能集成

#### Phase 10: Integration & Testing (任务T037-T040)
- 后端API集成测试
- 前端页面集成测试
- 性能优化和缓存调优
- 安全测试和漏洞修复

#### Phase 11: Documentation & Deployment (任务T041-T043)
- API文档生成
- 用户使用手册
- 部署配置和监控

#### Phase 12: Final Testing & Handover (任务T045-T048)
- 全面回归测试
- 生产环境部署
- 运维交接和培训
- 项目总结和复盘

### 关键里程碑

**Checkpoint 1: 数据模型和API基础** (T001-T009)
- 所有数据模型创建完成
- API基础架构搭建完成
- 数据验证和约束配置完成

**Checkpoint 2: 标签匹配核心功能** (T010-T013)
- 标签匹配算法实现完成
- L3规则系统实现完成
- 缓存机制集成完成

**Checkpoint 3: 课程管理API** (T014-T017)
- 课程查询API完成
- 课程安排API完成
- 统计分析API完成

**Checkpoint 4: 预约管理API** (T018-T022)
- 预约CRUD API完成
- 冲突检测机制完成
- 状态管理系统完成

**Checkpoint 5: 前端预约页面** (T023-T026)
- 预约首页实现完成
- 课程组件库完成
- 标签匹配展示完成

### 时间估算

- **Phase 1**: 基础设施搭建 - 4天
- **Phase 2**: 数据模型开发 - 5天
- **Phase 3**: 标签匹配算法 - 4天
- **Phase 4**: 课程API开发 - 4天
- **Phase 5**: 预约API开发 - 5天
- **Phase 6**: 前端预约页面 - 5天
- **Phase 7**: 前端课程详情 - 4天
- **Phase 8**: 前端预约流程 - 4天
- **Phase 9**: 固定班功能 - 3天
- **Phase 10**: 集成测试 - 4天
- **Phase 11**: 文档和部署 - 3天
- **Phase 12**: 最终测试和交接 - 3天

**总预估时间**: 48天（约9-10周，包含测试和优化时间）

---

## 质量检查要点

### 需求质量检查

#### 用户故事完整性
- ✅ 每个用户故事都有明确的优先级 (P1, P2, P3)
- ✅ 每个用户故事都有独立的测试方法
- ✅ 每个用户故事都有完整的验收场景 (Given/When/Then)
- ✅ 边界情况都已考虑并有处理方案

#### 功能需求完整性
- ✅ 所有功能需求都有FR-XXX编号
- ✅ 每个需求都是具体且可测试的
- ✅ 需求覆盖了所有用户故事
- ✅ 没有模糊或歧义的描述

#### 成功标准可衡量性
- ✅ 每个成功标准都有具体指标
- ✅ 所有指标都是可量化的
- ✅ 标准覆盖了关键业务价值
- ✅ 有明确的验收方法

#### 范围明确性
- ✅ 明确标记了不实现的功能
- ✅ 范围边界清晰无歧义
- ✅ 与其他MVP的依赖关系明确

### 设计质量检查

#### 技术选型合规性
- ✅ 遵循宪法Principle 1 (简化优先)
- ✅ 技术栈符合AI Coding友好原则
- ✅ 没有引入不必要的复杂性
- ✅ 采用微信原生框架，AI Coding支持度高

#### 数据完整性
- ✅ 遵循宪法Principle 2 (数据完整性至上)
- ✅ 关键业务操作使用事务保护
- ✅ 数据模型设计合理
- ✅ 有适当的数据验证机制

#### API设计合规性
- ✅ 遵循宪法Principle 4 (API优先架构)
- ✅ API设计符合RESTful规范
- ✅ 响应格式统一
- ✅ 有适当的错误处理

#### 安全性考虑
- ✅ 遵循宪法Principle 8 (安全与合规)
- ✅ 用户数据隔离机制完善
- ✅ API权限验证
- ✅ 输入验证和过滤完善

### 实现质量检查

#### 代码质量
- ✅ 遵循宪法Principle 3 (可维护性与可读性)
- ✅ 代码结构清晰分层
- ✅ 函数和类的职责单一
- ✅ 有充分的注释说明

#### 测试覆盖
- ✅ 遵循宪法Principle 7 (测试驱动的数据操作)
- ✅ 关键业务逻辑有单元测试
- ✅ API端点有集成测试
- ✅ 用户场景有端到端测试

#### 性能考虑
- ✅ 数据库查询优化
- ✅ 适当的缓存策略
- ✅ 前端性能优化
- ✅ API性能

### 合规性检查

#### 宪法原则遵循
- ✅ Principle 1: 简化优先 - 微信原生框架，AI Coding友好
- ✅ Principle 2: 数据完整性 - 预约事务保护，软删除机制
- ✅ Principle 3: 可维护性 - 分层架构清晰，代码结构合理
- ✅ Principle 4: API优先 - 完整RESTful API设计
- ✅ Principle 5: 增量交付 - MVP纵向切片，独立交付
- ✅ Principle 6: 以用户为中心 - 智能标签匹配提升体验
- ✅ Principle 7: 测试驱动 - 关键数据操作有测试覆盖
- ✅ Principle 8: 安全合规 - JWT认证，预约权限验证
- ✅ Principle 9: 迁移支持 - 数据模型支持后续MVP扩展

#### MVP阶段一致性
- ✅ 符合当前MVP的范围定义
- ✅ 与前序MVP的依赖关系明确
- ✅ 为后续MVP预留扩展空间
- ✅ 纵向切片策略得到体现

---

## 核心功能技术细节

### 3维硬匹配标签匹配算法

#### 算法设计
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

### 价格计算系统

#### 4步顺序判断逻辑
```python
def calculate_course_price(course_id, profile_id):
    """
    通过4步顺序判断逻辑计算课时费
    """
    profile = get_profile(profile_id)
    course = get_course(course_id)

    # 第1步：判断人员属性（儿童/成人）
    audience = 'child' if profile.age < 18 else 'adult'

    # 第2步：判断用户属性（老用户/新用户），成人跳过此步
    customer_type = None
    if audience == 'child':
        customer_type = determine_customer_type(profile)

    # 第3步：判断权益类型（亲友权益）
    has_friend_privilege = check_friend_privilege(profile)

    # 第4步：匹配课程标签和等级
    final_price = match_pricing_rule(
        audience=audience,
        customer_type=customer_type,
        course_type=course.course_type,
        level=profile.level,
        has_friend_privilege=has_friend_privilege
    )

    return final_price
```

### 时间冲突检测

#### 精确时间重叠判断
```python
def has_time_conflict(existing_bookings, new_schedule):
    """
    检测时间冲突
    支持时间衔接但不支持重叠
    """
    for booking in existing_bookings:
        existing_schedule = booking.schedule

        # 检查是否为同一天
        if existing_schedule.date != new_schedule.date:
            continue

        # 检查时间重叠：不重叠的条件是新课程在已存在课程之前结束或之后开始
        if not (new_schedule.end_time <= existing_schedule.start_time or
                new_schedule.start_time >= existing_schedule.end_time):
            return True  # 存在时间冲突

    return False  # 无时间冲突
```

### 候补队列管理

#### FR-043动态容量管理
```python
def manage_waitlist_capacity(course_id):
    """
    管理候补容量，支持动态调整
    """
    course = get_course(course_id)
    waitlist_settings = get_waitlist_capacity_settings(course_id)

    current_waitlist_count = get_current_waitlist_count(course_id)
    usage_rate = current_waitlist_count / waitlist_settings.waitlist_capacity_limit

    # 容量使用率超过80%时记录监控
    if usage_rate > 0.8:
        create_waitlist_monitor_record(course_id, usage_rate)

        # 热门课程自动增加容量限制
        if course.popularity == 'hot' and usage_rate > 0.9:
            suggested_capacity = min(
                waitlist_settings.waitlist_capacity_limit + 2,
                get_max_capacity_for_course_type(course.course_type_category)
            )
            create_capacity_optimization_suggestion(course_id, suggested_capacity)

    return {
        'current_count': current_waitlist_count,
        'capacity_limit': waitlist_settings.waitlist_capacity_limit,
        'usage_rate': round(usage_rate * 100, 2),
        'status': 'full' if current_waitlist_count >= waitlist_settings.waitlist_capacity_limit else 'available'
    }
```

### 补课补偿系统

#### 课时补偿计算
```python
def generate_makeup_compensation(original_booking):
    """
    生成补课补偿记录
    """
    # 计算补偿时长
    compensation_minutes = original_booking.schedule.duration_minutes

    # 创建补偿记录
    compensation = create_class_credit_compensation(
        user_id=original_booking.user_id,
        profile_id=original_booking.profile_id,
        original_booking_id=original_booking.id,
        compensation_minutes=compensation_minutes,
        expiry_days=30  # 30天有效期
    )

    return compensation
```

---

## 部署和运维

### 环境配置

#### 开发环境
```bash
# 后端环境
python -m venv venv
source venv/bin/activate
pip install fastapi sqlalchemy redis mysql-connector-python

# 数据库初始化
mysql -u root -p < migrations/001_create_course_tables.sql
mysql -u root -p < migrations/002_create_booking_tables.sql
mysql -u root -p < migrations/003_create_tag_matching_tables.sql

# Redis配置
redis-server --port 6379

# 小程序配置
# 在miniprogram/app.json中配置API地址
```

#### 生产环境
```bash
# 数据库优化配置
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 1000

# Redis生产配置
maxmemory 512mb
maxmemory-policy allkeys-lru

# Nginx配置（反向代理）
server {
    listen 443 ssl;
    server_name api.gymnasticmini.com;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 监控和告警

#### 关键指标监控
```python
# 性能指标
- 课程列表加载时间 < 1秒
- 标签匹配算法执行时间 < 100ms
- API响应时间 < 500ms
- 数据库查询时间 < 100ms

# 业务指标
- 预约成功率 > 95%
- 标签匹配准确率 > 95%
- 时间冲突检测准确率 = 100%
- 缓存命中率 > 80%
```

#### 告警规则
```yaml
alerts:
  - name: API响应时间过长
    condition: api_response_time > 1000ms
    duration: 5m

  - name: 数据库连接数过高
    condition: db_connections > 800
    duration: 2m

  - name: 预约成功率过低
    condition: booking_success_rate < 90%
    duration: 10m

  - name: 标签匹配准确率过低
    condition: tag_match_accuracy < 95%
    duration: 15m
```

### 备份策略

#### 数据库备份
```bash
# 每日全量备份
mysqldump -u root -p ccmartmeet > backup_$(date +%Y%m%d).sql

# 增量备份（binlog）
mysqlbinlog --start-datetime="2025-11-08 00:00:00" /var/lib/mysql/mysql-bin.000001 > incremental_$(date +%Y%m%d_%H%M%S).sql

# 备份保留策略
- 保留最近30天的全量备份
- 保留最近7天的增量备份
```

#### Redis备份
```bash
# RDB快照备份
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backup/redis/dump_$(date +%Y%m%d_%H%M%S).rdb

# AOF备份
cp /var/lib/redis/appendonly.aof /backup/redis/appendonly_$(date +%Y%m%d_%H%M%S).aof
```

---

## 总结

### 项目特色

1. **智能3维硬匹配标签匹配系统**
   - 基于等级、年龄、性别、类型4个维度的白名单匹配
   - L3规则系统支持不同等级课程的差异化匹配策略
   - 精确的匹配分数计算和详细的匹配原因说明

2. **价格历史保护机制**
   - 基于4步顺序判断逻辑的动态价格计算
   - 亲友权益、老用户权益的价格保护
   - 价格规则表支持灵活的定价策略配置

3. **精确的时间冲突检测**
   - 支持时间衔接但不允许时间重叠
   - 不同档案间的独立预约管理
   - 防止用户同时预约重叠时间的课程

4. **灵活的预约管理**
   - 支持灵活排课取消和固定班请假两种模式
   - 6小时取消规则和补课补偿机制
   - 连续请假监控和自动运营通知

### 技术亮点

1. **高性能架构设计**
   - Redis缓存策略优化系统性能
   - 数据库索引和分区优化查询效率
   - 前端Skyline渲染引擎提升用户体验

2. **数据完整性保障**
   - 数据库事务保护关键业务操作
   - 软删除机制保护历史数据
   - 乐观锁防止并发预约超售

3. **API优先设计**
   - 完整的RESTful API设计
   - 统一的响应格式和错误处理
   - JWT Token认证保障安全

4. **扩展性考虑**
   - 为后续MVP预留接口和数据模型
   - 模块化设计支持功能扩展
   - 支持私教课、候补系统等功能集成

### 业务价值

1. **用户体验提升**
   - 智能匹配减少用户筛选时间
   - 自动年龄识别简化操作流程
   - 个性化推荐提高预约转化率

2. **运营效率提升**
   - 自动化的标签匹配和推荐
   - 精确的容量控制和冲突检测
   - 详细的匹配日志和分析数据

3. **收入保障**
   - 价格历史保护机制
   - 精确的课时费计算
   - 防止超售和时间冲突

4. **数据驱动决策**
   - 完整的匹配算法日志
   - 用户行为分析数据
   - 课程热度统计和分析

---

## Phase 10: End-to-End Integration Testing

基于外部AI专家反馈，MVP-002新增了完整的端到端集成测试体系，确保系统稳定性和跨MVP数据一致性。

### T040: 端到端用户流程测试
- **新用户注册→档案创建→课程浏览→预约成功**全流程测试
- **老用户登录→档案切换→智能匹配→预约确认**全流程测试
- **无档案用户浏览→引导创建档案→预约拦截**测试
- **3维硬匹配白名单验证准确性**测试
- **时间冲突检测和防护机制**测试
- **边界条件和异常场景**测试

### T041: 跨MVP数据流集成测试
- **MVP-001用户身份系统集成**测试（登录、档案、权限）
- **MVP-003候补系统预集成**测试（容量管理、通知触发）
- **MVP-004私教课数据结构兼容性**测试
- **MVP-005支付系统预集成**测试（价格计算、订单创建）
- **MVP-006钱包系统预集成**测试（余额查询、扣费）
- **MVP-008标签系统集成**测试（匹配算法、缓存更新）

### T042-T048: 复杂场景测试
- **多档案并发预约冲突处理**测试
- **跨级标签匹配准确性**测试
- **体验课限制机制完整性**测试
- **价格历史保护机制**端到端测试
- **虚拟年龄偏移量对匹配结果影响**测试
- **数据一致性和并发控制**测试
- **性能压力和移动端兼容性**测试
- **安全性集成测试**和**错误恢复**测试
- **监控告警系统**完整性测试

---

**文档版本**: v1.1.0 (基于外部AI专家反馈更新)
**创建日期**: 2025-11-08
**最后更新**: 2025-11-17
**状态**: Updated
**审核状态**: 已完成3维硬匹配优化和集成测试体系
**主要更新**:
- 优化为3维硬匹配+软标签排序算法
- 新增端到端集成测试体系
- 完善跨MVP数据流集成测试

---

*本文档整合了MVP-002的所有设计规格、技术方案、数据模型和任务分解，为开发团队提供完整的技术实施指导。重点关注3维硬匹配标签匹配算法、价格历史保护、时间冲突检测等核心功能的技术实现细节。*
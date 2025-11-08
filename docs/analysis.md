# 百适体操馆 - 价格体系分析与课程设置规划

**分析日期**: 2025-10-31
**分析对象**: 价格体系脑图(老用户/新用户/亲友权益)
**规划目标**: 将价格体系集成到课程设置和标签系统中

---

## 📊 价格体系解析(基于脑图)

### 价格体系架构

```
价格体系
├─ 老用户(11月11日前报课的)
│  ├─ 儿童课程
│  │  ├─ 团课
│  │  │  ├─ L1-L4: 180元/小时
│  │  │  ├─ L5-L6: 300元/小时
│  │  │  └─ L7-L8: 340元/小时
│  │  ├─ 长训班: 120元/小时
│  │  └─ 私教课
│  │     ├─ 1v1
│  │     │  ├─ L1-L2: 360元/小时
│  │     │  ├─ L3-L4: 450元/小时
│  │     │  ├─ L5-L6: 540元/小时
│  │     │  └─ L7-L8: 600元/小时
│  │     └─ 1v2
│  │        ├─ L1-L4: 220元/小时
│  │        ├─ L5-L6: 340元/小时
│  │        └─ L7-L8: 380元/小时
│  └─ 成人课程
│     ├─ 团课: 180元/小时
│     └─ 私教课
│        ├─ 1v1
│        │  ├─ L1-L4: 360元/小时
│        │  ├─ L5-L6: 540元/小时
│        │  └─ L7-L8: 600元/小时
│        └─ 1v2
│           ├─ L1-L4: 220元/小时
│           ├─ L5-L6: 340元/小时
│           └─ L7-L8: 380元/小时
│
├─ 新用户(11月11日后报课的)
│  ├─ 儿童课程
│  │  ├─ 团课
│  │  │  ├─ L1: 180元/小时
│  │  │  ├─ L2-L4: 200元/小时
│  │  │  ├─ L5-L6: 300元/小时
│  │  │  └─ L7-L8: 340元/小时
│  │  ├─ 长训班
│  │  │  ├─ L1-L4: 120元/小时
│  │  │  ├─ L5-L6: 140元/小时
│  │  │  └─ L7-L8: 170元/小时
│  │  └─ 私教课: 同上,无变动
│  └─ 成人课程: 新/老用户同价,无变动
│
└─ 亲友权益
   └─ 只存在于老用户体系中,所有的常规课,除了长训班,价格都自动显示6折
```

---

## 🔍 核心发现

### 1. 价格维度

价格由以下维度决定:
1. **权益类型**: 老用户/新用户/亲友权益
2. **人群类型**: 儿童/成人
3. **课程类型**: 团课/长训班/私教1v1/私教1v2
4. **学员等级**: L1-L8

### 2. 关键规则

#### 规则1: 老用户 vs 新用户
- **老用户**: 11月11日**之前**报课的用户
- **新用户**: 11月11日**之后**报课的用户
- **主要差异**: 新用户的儿童团课和长训班价格更高

#### 规则2: 亲友权益
- **适用范围**: 仅限老用户体系中的**常规课**(团课)
- **排除课程**: 长训班/私教课
- **折扣**: 自动显示**6折**

#### 规则3: 成人课程价格
- **老用户和新用户同价**,无差异
- 私教课无变动

#### 规则4: 私教1v1 vs 1v2
- **1v1**: 单人私教,价格较高
- **1v2**: 2人私教,价格约为1v1的60-65%

---

## 🎯 数据库设计方案

### 方案A: 在course表中直接存储多套价格 (不推荐❌)

```sql
CREATE TABLE course (
  ...
  price_old_user DECIMAL(10,2),      -- 老用户价格
  price_new_user DECIMAL(10,2),      -- 新用户价格
  price_friend DECIMAL(10,2),        -- 亲友权益价格
  ...
);
```

**缺点**:
- ❌ 无法灵活支持未来的新权益类型
- ❌ 价格规则硬编码在课程表中,难以维护
- ❌ 亲友权益的6折规则无法动态计算

---

### 方案B: 新增pricing_rule表,支持多维度定价 (推荐⭐⭐⭐⭐⭐)

```sql
-- 价格规则表
CREATE TABLE pricing_rule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rule_name VARCHAR(100) NOT NULL COMMENT '规则名称(如"儿童团课L1-L4老用户价")',
  customer_type ENUM('old_user','new_user','friend') NOT NULL COMMENT '客户类型',
  audience ENUM('child','adult') NOT NULL COMMENT '人群类型',
  course_type ENUM('group','long_term','private_1v1','private_1v2','trial') NOT NULL COMMENT '课程类型',
  level_range VARCHAR(50) COMMENT '等级范围(如"L1-L4"或"L1,L2")',
  price_per_hour DECIMAL(10,2) NOT NULL COMMENT '每小时价格',
  discount_rate DECIMAL(3,2) DEFAULT 1.00 COMMENT '折扣率(1.00=原价,0.60=6折)',
  effective_date DATE COMMENT '生效日期(如2024-11-11)',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_type (customer_type),
  INDEX idx_course_type (course_type),
  INDEX idx_level_range (level_range)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格规则表';

-- 示例数据
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour, discount_rate) VALUES
('儿童团课L1-L4老用户价', 'old_user', 'child', 'group', 'L1-L4', 180.00, 1.00),
('儿童团课L5-L6老用户价', 'old_user', 'child', 'group', 'L5-L6', 300.00, 1.00),
('儿童团课L1新用户价', 'new_user', 'child', 'group', 'L1', 180.00, 1.00),
('儿童团课L2-L4新用户价', 'new_user', 'child', 'group', 'L2-L4', 200.00, 1.00),
('儿童团课L1-L4亲友价', 'friend', 'child', 'group', 'L1-L4', 180.00, 0.60);  -- 6折
```

**优点**:
- ✅ 灵活支持任意权益类型和价格规则
- ✅ 价格规则集中管理,易于维护
- ✅ 支持折扣率动态计算(如亲友权益的6折)
- ✅ 支持按生效日期区分老用户和新用户
- ✅ 可以轻松增加新的定价维度(如节假日价格/促销价格)

---

## 🔄 课程表设计调整

### course表新增字段

```sql
ALTER TABLE course 
ADD COLUMN base_price DECIMAL(10,2) NOT NULL COMMENT '基础价格(用于显示,实际价格由pricing_rule计算)',
ADD COLUMN pricing_strategy ENUM('fixed','dynamic') DEFAULT 'dynamic' COMMENT '定价策略:fixed=固定价格,dynamic=动态计算';
```

**说明**:
- `base_price`: 用于显示的基础价格(如课程列表页显示"180元起")
- `pricing_strategy`: 
  - `fixed`: 体验课等固定价格课程(200元)
  - `dynamic`: 根据用户权益动态计算价格(团课/长训班/私教)

---

## 🔄 profile表新增字段

### 学员档案表新增权益字段

```sql
ALTER TABLE profile 
ADD COLUMN customer_type ENUM('old_user','new_user','friend') DEFAULT 'new_user' COMMENT '客户类型:老用户/新用户/亲友权益',
ADD COLUMN registration_date DATE COMMENT '首次报课日期(用于判断老用户/新用户)';
```

**判断逻辑**:
```python
# 判断客户类型
def get_customer_type(registration_date):
    cutoff_date = datetime.date(2024, 11, 11)
    if registration_date < cutoff_date:
        return 'old_user'
    else:
        return 'new_user'
```

---

## 🔄 价格计算逻辑

### API设计: 获取课程价格

**GET /api/v1/courses/{course_id}/price?profile_id={profile_id}**

**功能**: 根据课程和学员档案,计算实际价格

**请求参数**:
- `course_id`: 课程ID
- `profile_id`: 学员档案ID

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "course_id": 123,
    "profile_id": 456,
    "customer_type": "old_user",  // 老用户
    "course_type": "group",       // 团课
    "level": "L2",                // 学员等级
    "base_price": 180.00,         // 基础价格
    "discount_rate": 1.00,        // 折扣率(无折扣)
    "final_price": 180.00,        // 最终价格
    "price_rule": "儿童团课L1-L4老用户价",
    "price_breakdown": {
      "price_per_hour": 180.00,
      "duration_hours": 1.0,
      "subtotal": 180.00,
      "discount": 0.00,
      "total": 180.00
    }
  }
}
```

**如果是亲友权益**:
```json
{
  "code": 200,
  "data": {
    "customer_type": "friend",    // 亲友权益
    "base_price": 180.00,
    "discount_rate": 0.60,        // 6折
    "final_price": 108.00,        // 180 * 0.6 = 108
    "price_rule": "儿童团课L1-L4亲友价",
    "discount_label": "亲友专享6折"
  }
}
```

---

## 🔄 小程序界面设计

### 课程列表页

```
┌────────────────────────────────────────┐
│ 预约Tab                                │
├────────────────────────────────────────┤
│ 【本周课程】                           │
│ ┌──────────────────────────────┐      │
│ │ L2 空翻课 (符合条件✓)        │      │
│ │ 周三 15:00-16:00 | 王梦佳    │      │
│ │ 剩余名额: 3/6                │      │
│ │ 💰 180元/小时 (老用户价)     │ ← 显示价格
│ └──────────────────────────────┘      │
│ ┌──────────────────────────────┐      │
│ │ L3 倒立课 (符合条件✓)        │      │
│ │ 周四 16:00-17:00 | 王梦佳    │      │
│ │ 剩余名额: 2/6                │      │
│ │ 💰 108元/小时 🎉亲友6折      │ ← 亲友权益显示折扣
│ └──────────────────────────────┘      │
└────────────────────────────────────────┘
```

### 课程详情页

```
┌────────────────────────────────────────┐
│ 课程详情                               │
├────────────────────────────────────────┤
│ L2 空翻课                              │
│ 周三 15:00-16:00 | 王梦佳              │
│ 剩余名额: 3/6                          │
│                                        │
│ 💰 价格明细                            │
│ ┌──────────────────────────────┐      │
│ │ 基础价格: 180元/小时         │      │
│ │ 您的权益: 亲友专享6折 🎉     │      │
│ │ 实付价格: 108元/小时         │      │
│ │ ────────────────────         │      │
│ │ 课时: 1小时                  │      │
│ │ 总计: 108元                  │      │
│ └──────────────────────────────┘      │
│                                        │
│ [立即预约]                             │
└────────────────────────────────────────┘
```

---

## 📝 Spec修改建议

### 1. 修改MVP-2A (002-course-display-and-booking/spec.md)

**新增章节: 价格计算规则**

```markdown
## 价格计算规则

### 价格维度

课程价格由以下维度决定:
1. **客户类型**: old_user(11.11前报课)/new_user(11.11后报课)/friend(亲友权益)
2. **人群类型**: child(儿童)/adult(成人)
3. **课程类型**: group(团课)/long_term(长训班)/private_1v1/private_1v2/trial(体验课)
4. **学员等级**: L1-L8

### 价格规则表

详见pricing_rule表设计(在data-model.md中定义)

### 亲友权益特殊规则

- **适用范围**: 仅限老用户体系中的**团课**(course_type='group')
- **排除课程**: 长训班(long_term)/私教课(private_1v1/private_1v2)
- **折扣**: 自动显示**6折**(discount_rate=0.60)
- **显示**: 在课程列表和详情页显示"🎉亲友专享6折"标签

### 价格计算API

**GET /api/v1/courses/{course_id}/price?profile_id={profile_id}**

功能: 根据课程和学员档案,计算实际价格
```

**新增Functional Requirements**:
```markdown
**FR-XXX**: 系统必须根据学员的customer_type(老用户/新用户/亲友权益)和等级(L1-L8)动态计算课程价格
**FR-XXX**: 系统必须在课程列表和详情页显示实际价格(考虑折扣后的价格)
**FR-XXX**: 系统必须为亲友权益用户在团课价格上显示"🎉亲友专享6折"标签
**FR-XXX**: 系统必须在预约确认页面显示价格明细(基础价格/折扣/实付价格)
```

---

### 2. 修改MVP-1 (001-user-identity-system/spec.md)

**在profile表新增字段**:
```markdown
### profile表新增字段(价格体系)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| customer_type | ENUM | 客户类型:old_user(老用户)/new_user(新用户)/friend(亲友权益) |
| registration_date | DATE | 首次报课日期(用于判断老用户/新用户,基准日期2024-11-11) |
```

---

### 3. 修改MVP-5 (007-admin-dashboard/spec.md)

**新增User Story: 价格规则管理**

```markdown
### User Story X - 价格规则管理 (Priority: P1)

运营在后台可以管理价格规则,包括创建/编辑/删除不同客户类型和等级的价格。

**Acceptance Scenarios**:
1. **Given** 运营在后台"价格管理"页面, **When** 点击"新增价格规则", **Then** 可以选择客户类型/课程类型/等级范围并设置价格
2. **Given** 运营编辑"儿童团课L1-L4老用户价", **When** 修改价格为200元, **Then** 小程序课程列表自动更新价格
3. **Given** 运营设置"亲友权益折扣率"为0.60, **When** 亲友用户查看团课, **Then** 显示6折后的价格

### User Story Y - 客户权益设置 (Priority: P1)

运营在后台可以手动为学员设置客户类型(老用户/新用户/亲友权益)。

**Acceptance Scenarios**:
1. **Given** 运营在学员详情页, **When** 修改客户类型为"亲友权益", **Then** 学员在小程序看到的团课价格自动变为6折
2. **Given** 运营查看学员的registration_date为2024-10-01, **When** 系统判断, **Then** 自动标记为"老用户"
```

---

## 🎯 数据库迁移脚本

### 迁移步骤

#### Step 1: 创建pricing_rule表

```sql
CREATE TABLE pricing_rule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
  customer_type ENUM('old_user','new_user','friend') NOT NULL COMMENT '客户类型',
  audience ENUM('child','adult') NOT NULL COMMENT '人群类型',
  course_type ENUM('group','long_term','private_1v1','private_1v2','trial') NOT NULL COMMENT '课程类型',
  level_range VARCHAR(50) COMMENT '等级范围',
  price_per_hour DECIMAL(10,2) NOT NULL COMMENT '每小时价格',
  discount_rate DECIMAL(3,2) DEFAULT 1.00 COMMENT '折扣率',
  effective_date DATE COMMENT '生效日期',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_type (customer_type),
  INDEX idx_course_type (course_type),
  INDEX idx_level_range (level_range)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格规则表';
```

#### Step 2: 导入初始价格数据

```sql
-- 老用户价格(儿童团课)
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour) VALUES
('儿童团课L1-L4老用户价', 'old_user', 'child', 'group', 'L1-L4', 180.00),
('儿童团课L5-L6老用户价', 'old_user', 'child', 'group', 'L5-L6', 300.00),
('儿童团课L7-L8老用户价', 'old_user', 'child', 'group', 'L7-L8', 340.00);

-- 老用户价格(儿童长训班)
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour) VALUES
('儿童长训班老用户价', 'old_user', 'child', 'long_term', NULL, 120.00);

-- 老用户价格(儿童私教1v1)
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour) VALUES
('儿童私教1v1 L1-L2老用户价', 'old_user', 'child', 'private_1v1', 'L1-L2', 360.00),
('儿童私教1v1 L3-L4老用户价', 'old_user', 'child', 'private_1v1', 'L3-L4', 450.00),
('儿童私教1v1 L5-L6老用户价', 'old_user', 'child', 'private_1v1', 'L5-L6', 540.00),
('儿童私教1v1 L7-L8老用户价', 'old_user', 'child', 'private_1v1', 'L7-L8', 600.00);

-- 老用户价格(儿童私教1v2)
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour) VALUES
('儿童私教1v2 L1-L4老用户价', 'old_user', 'child', 'private_1v2', 'L1-L4', 220.00),
('儿童私教1v2 L5-L6老用户价', 'old_user', 'child', 'private_1v2', 'L5-L6', 340.00),
('儿童私教1v2 L7-L8老用户价', 'old_user', 'child', 'private_1v2', 'L7-L8', 380.00);

-- 新用户价格(儿童团课)
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour) VALUES
('儿童团课L1新用户价', 'new_user', 'child', 'group', 'L1', 180.00),
('儿童团课L2-L4新用户价', 'new_user', 'child', 'group', 'L2-L4', 200.00),
('儿童团课L5-L6新用户价', 'new_user', 'child', 'group', 'L5-L6', 300.00),
('儿童团课L7-L8新用户价', 'new_user', 'child', 'group', 'L7-L8', 340.00);

-- 新用户价格(儿童长训班)
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour) VALUES
('儿童长训班L1-L4新用户价', 'new_user', 'child', 'long_term', 'L1-L4', 120.00),
('儿童长训班L5-L6新用户价', 'new_user', 'child', 'long_term', 'L5-L6', 140.00),
('儿童长训班L7-L8新用户价', 'new_user', 'child', 'long_term', 'L7-L8', 170.00);

-- 亲友权益(仅限团课,6折)
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour, discount_rate) VALUES
('儿童团课L1-L4亲友价', 'friend', 'child', 'group', 'L1-L4', 180.00, 0.60),
('儿童团课L5-L6亲友价', 'friend', 'child', 'group', 'L5-L6', 300.00, 0.60),
('儿童团课L7-L8亲友价', 'friend', 'child', 'group', 'L7-L8', 340.00, 0.60);

-- 成人团课(新老同价)
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour) VALUES
('成人团课老用户价', 'old_user', 'adult', 'group', NULL, 180.00),
('成人团课新用户价', 'new_user', 'adult', 'group', NULL, 180.00);

-- 成人私教(新老同价)
INSERT INTO pricing_rule (rule_name, customer_type, audience, course_type, level_range, price_per_hour) VALUES
('成人私教1v1 L1-L4', 'old_user', 'adult', 'private_1v1', 'L1-L4', 360.00),
('成人私教1v1 L5-L6', 'old_user', 'adult', 'private_1v1', 'L5-L6', 540.00),
('成人私教1v1 L7-L8', 'old_user', 'adult', 'private_1v1', 'L7-L8', 600.00);
```

#### Step 3: 修改profile表

```sql
ALTER TABLE profile 
ADD COLUMN customer_type ENUM('old_user','new_user','friend') DEFAULT 'new_user' COMMENT '客户类型',
ADD COLUMN registration_date DATE COMMENT '首次报课日期';
```

#### Step 4: 修改course表

```sql
ALTER TABLE course 
ADD COLUMN base_price DECIMAL(10,2) COMMENT '基础价格(用于显示)',
ADD COLUMN pricing_strategy ENUM('fixed','dynamic') DEFAULT 'dynamic' COMMENT '定价策略';
```

---

## ✅ 总结

### 核心要点

1. ✅ **价格由pricing_rule表统一管理**,支持多维度定价
2. ✅ **profile表新增customer_type字段**,记录客户权益类型
3. ✅ **亲友权益仅适用于团课**,自动6折
4. ✅ **老用户和新用户的判断基准日期为2024-11-11**
5. ✅ **成人课程新老同价**,无差异

### 需要修改的Spec

| Spec | 修改内容 | 优先级 |
|------|---------|--------|
| MVP-1 (用户身份系统) | profile表新增customer_type/registration_date字段 | 🔴 P0 |
| MVP-2A (课程系统) | 新增价格计算规则和API | 🔴 P0 |
| MVP-2A (data-model.md) | 新增pricing_rule表 | 🔴 P0 |
| MVP-5 (运营后台) | 新增价格规则管理和客户权益设置功能 | 🟡 P1 |

### 实施建议

1. **立即修改数据库设计** (创建pricing_rule表)
2. **修改MVP-1/2A的spec** (新增价格字段和API)
3. **导入初始价格数据** (根据脑图录入所有价格规则)
4. **在MVP-5中增加价格管理界面** (运营后台)

---

**文档生成时间**: 2025-10-31 17:35  
**文档版本**: v1.0.0

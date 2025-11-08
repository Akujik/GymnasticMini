# 百适体操馆 - 最终需求整合文档(Q5-Q20)

**确认日期**: 2025-10-31 19:47
**确认状态**: ✅ 所有决策已确认
**文档版本**: v2.0.0 (最终确认版)

---

## ✅ 决策确认结果

### 🔴 P0级决策(已确认) - 2个

#### 决策1: 私教课预约方式 ✅

**用户确认**: 
> 私教课是在小程序tab页面会显示的,但是点进去以后无法预约的,最后的跳转链接是运营,这部分是预约部分,但如果用户确认约了私教课,后台可以操作,给他上架一个私教课程,把用户的姓名填进去,但前端是不对用户显示这个课程可以预约的,最后只在课程界面显示已约课程

**最终方案**: **线下预约模式**

**流程设计**:
```
1. 用户进入"预约Tab-私教课"
   ↓
2. 显示教练列表(教练介绍/价格表)
   ↓
3. 用户点击"联系运营"按钮
   ↓
4. 弹出运营微信二维码,用户添加微信
   ↓
5. 线下沟通确认(时间/教练/价格)
   ↓
6. 运营在后台手动上架私教课程,填写用户姓名(指定学员)
   ↓
7. 用户在"课程-已约"中看到私教课程(不在"预约"中显示)
```

**关键特性**:
- ✅ 预约Tab显示私教课入口(展示教练信息)
- ✅ 不可在线预约,仅提供"联系运营"按钮
- ✅ 后台运营手动上架,指定学员
- ✅ 私教课程仅在"课程-已约"显示,不在"预约"列表显示

---

#### 决策2: 长期排队扣费时机 ✅

**用户确认**: 
> 开课前6小时锁定名额,扣除金额

**最终方案**: **开课前6小时自动扣费**

**扣费规则**:
```
长期固定班用户
  ↓
开课前6小时 → 系统自动扣除当次课程费用
  ↓
如果钱包余额不足 → 扣费失败 → 通知用户充值
  ↓
扣费成功 → 名额锁定 → 无法取消
```

**关键规则**:
- ✅ 长期排队成功后**不立即扣费**,仅占班级名额
- ✅ **每次上课前6小时**自动从钱包扣除当次课程费用
- ✅ 扣费后名额锁定,**6小时内无法取消**
- ✅ 如果未请假且扣费成功 → 自动生成**补课权益**(7天内0元补课)

---

### 🟡 P1级决策(已确认) - 2个

#### 决策3: 虚拟年龄功能 ✅

**用户确认**: 
> 就是同一个功能

**最终方案**: **合并为一个功能**

**数据表设计**:
```sql
ALTER TABLE profile 
ADD COLUMN virtual_age DECIMAL(3,1) NULL COMMENT '虚拟年龄(运营手动设置)',
ADD COLUMN virtual_age_reason TEXT NULL COMMENT '虚拟年龄设置原因';
```

**用途**:
- **用途1**(Q5): 11岁肥胖男孩 → 虚拟年龄6岁 → 匹配儿童5-6岁班级
- **用途2**(Q17): 17岁能力强 → 虚拟年龄19岁 → 匹配成人课(>18岁)

**年龄匹配逻辑**:
```python
def get_effective_age(profile):
    """获取有效年龄(优先使用虚拟年龄)"""
    if profile.virtual_age is not None:
        return profile.virtual_age
    else:
        return calculate_age_from_birthday(profile.birthday)
```

---

#### 决策4: "课程界面显示未来2节课"含义 ✅

**用户确认**: 
> 就是在课程页面,已约里,显示未来的2节课程(注意,此课程是固定课程,单次预约课程不含在这2节以内)

**最终方案**: **"课程Tab-已约"仅显示固定班未来2节课**

**显示规则**:
```python
def get_upcoming_courses_for_display(profile_id):
    """获取课程-已约界面显示的课程"""
    # 1. 获取所有单次预约课程(全部显示)
    single_bookings = Booking.query.filter(
        Booking.profile_id == profile_id,
        Booking.booking_type == 'single',
        Booking.status.in_(['booked', 'waitlist_pending']),
        Booking.start_time > datetime.now()
    ).order_by(Booking.start_time.asc()).all()

    # 2. 获取固定班课程(仅显示未来2节)
    recurring_bookings = Booking.query.filter(
        Booking.profile_id == profile_id,
        Booking.booking_type == 'recurring',
        Booking.status.in_(['booked']),
        Booking.start_time > datetime.now()
    ).order_by(Booking.start_time.asc()).limit(2).all()

    return single_bookings + recurring_bookings
```

**关键规则**:
- ✅ **固定班课程**: 仅显示未来2节课(避免刷屏)
- ✅ **单次预约课程**: 全部显示(不限制)
- ✅ **预约Tab**: 不受影响,显示本周所有课程

---

### 🟢 P2级决策(已确认) - 3个

#### 决策5: 候补截止时限缓冲期用途 ✅

**用户确认**: 
> 方便用户在收到候补成功的消息后,有半小时的时间,用来考虑是否取消此课程

**最终方案**: **6.5-6小时之间为用户决策缓冲期**

**时间轴设计**:
```
课程开始: 15:00
  ↓
候补截止: 08:30 (开课前6.5小时)
  - 系统停止接受新候补请求
  - 候补队列中的用户如果前方有人取消,仍会自动补位
  ↓ (0.5小时用户决策缓冲期)
  - 候补成功的用户有30分钟考虑是否取消
  - 已预约用户仍可取消,释放名额给候补队列
  ↓
取消预约截止: 09:00 (开课前6小时)
  - 禁止取消预约
  - 自动扣费,锁定名额
  ↓
课程开始: 15:00
```

**关键规则**:
- ✅ **6.5小时后**: 不再接受新的候补请求(队列关闭)
- ✅ **6.5-6小时之间**: 候补成功的用户有30分钟考虑是否取消
- ✅ **6小时后**: 完全禁止取消,自动扣费

---

#### 决策6: 补课时长不匹配处理 ✅

**用户确认**: 
> 不需要支付差价

**最终方案**: **补课均为0元,不考虑时长差异**

**补课规则**:
```
原课程1小时(180元) → 未请假被扣费
  ↓
生成补课权益(7天有效)
  ↓
用户选择补课课程1.5小时(正常价270元)
  ↓
补课价格: 0元(系统自动免费)
  ↓
补课完成,原课程和补课课程都在"课程-已完成"显示
```

**关键规则**:
- ✅ 补课课程**统一为0元**,无论时长多少
- ✅ 作为对用户未请假被扣费的**补偿**
- ✅ 简化逻辑,无需计算差价

---

#### 决策7: 不同课程类型的状态设计 ✅

**用户确认**: 
> 不同状态按照你的建议来

**最终方案**: **分类设计状态**

| 课程类型 | 状态数量 | 状态列表 |
|---------|---------|---------|
| **常规课**(团课/长训班) | 5个 | booked(待上课) / completed(已完课) / waitlist_pending(正在补位) / waitlist_failed(补位失败) / cancelled(已取消) |
| **体验课** | 3个 | booked(待上课) / completed(已完课) / cancelled(已取消) |
| **私教课** | 3个 | booked(待上课) / completed(已完课) / cancelled(已取消) |
| **夏冬令营** | 3个 | booked(待上课) / completed(已完课) / cancelled(已取消) |

**关键规则**:
- ✅ **常规课**有完整的候补功能,使用5个状态
- ✅ **体验课/私教课/夏冬令营**无候补功能,使用简化的3个状态
- ✅ 避免状态冗余,代码更清晰

---

## 📊 完整数据表设计(最终版)

### 1. profile表新增字段

```sql
ALTER TABLE profile 
ADD COLUMN virtual_age DECIMAL(3,1) NULL COMMENT '虚拟年龄(运营手动设置,用于课程匹配)',
ADD COLUMN virtual_age_reason TEXT NULL COMMENT '虚拟年龄设置原因(供运营备注)';
```

**字段说明**:
- `virtual_age`: 虚拟年龄,优先级高于真实年龄(从birthday计算)
- `virtual_age_reason`: 设置原因,如"11岁肥胖男孩能力匹配5-6岁"

---

### 2. booking表新增字段

```sql
ALTER TABLE booking 
-- 预约类型和状态
ADD COLUMN booking_type ENUM('single', 'recurring') DEFAULT 'single' COMMENT '预约类型:单次预约/长期固定',
ADD COLUMN recurring_booking_id INT NULL COMMENT '长期固定预约ID(关联recurring_booking表)',
ADD COLUMN status ENUM('booked','completed','waitlist_pending','waitlist_failed','cancelled') NOT NULL DEFAULT 'booked' COMMENT '课程状态',

-- 补课相关
ADD COLUMN is_makeup BOOLEAN DEFAULT FALSE COMMENT '是否为补课课程',
ADD COLUMN original_booking_id INT NULL COMMENT '原始课程ID(补课时关联)',
ADD COLUMN makeup_deadline DATE NULL COMMENT '补课截止日期(未请假课程生成,7天后)',

-- 签到相关
ADD COLUMN check_in_status ENUM('pending','checked_in','absent','admin_adjusted') DEFAULT 'pending' COMMENT '签到状态',
ADD COLUMN check_in_time DATETIME NULL COMMENT '签到时间',
ADD COLUMN check_in_admin_id INT NULL COMMENT '签到管理员ID(后台调整签到时记录)',

-- 私教课相关
ADD COLUMN is_private_lesson BOOLEAN DEFAULT FALSE COMMENT '是否为私教课',
ADD COLUMN admin_fee_adjustment DECIMAL(10,2) NULL COMMENT '运营调整的费用(如补课免费/请假不扣费)',

-- 请假相关
ADD COLUMN consecutive_leaves INT DEFAULT 0 COMMENT '连续请假次数(固定班用)',

-- 外键
FOREIGN KEY (recurring_booking_id) REFERENCES recurring_booking(id);
```

---

### 3. 新增recurring_booking表(长期固定班)

```sql
CREATE TABLE recurring_booking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  profile_id INT NOT NULL COMMENT '档案ID',
  schedule_id INT NOT NULL COMMENT '课程排期ID',
  start_date DATE NOT NULL COMMENT '固定班开始日期',
  end_date DATE NULL COMMENT '固定班结束日期(NULL表示长期有效)',
  status ENUM('active','cancelled_by_user','cancelled_by_admin','suspended') DEFAULT 'active' COMMENT '固定班状态',
  consecutive_leaves INT DEFAULT 0 COMMENT '连续请假次数',
  last_leave_date DATE NULL COMMENT '最后一次请假日期',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profile(id),
  FOREIGN KEY (schedule_id) REFERENCES schedule(id),
  INDEX idx_profile_id (profile_id),
  INDEX idx_schedule_id (schedule_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='长期固定预约表';
```

**说明**:
- 一个用户可以有多个长期固定班(不同时间/不同课程)
- `consecutive_leaves`: 连续请假次数,达到4次自动通知运营
- `status=active`: 固定班生效中

---

### 4. 新增makeup_eligibility表(补课权益)

```sql
CREATE TABLE makeup_eligibility (
  id INT PRIMARY KEY AUTO_INCREMENT,
  profile_id INT NOT NULL COMMENT '档案ID',
  original_booking_id INT NOT NULL COMMENT '原始未请假课程ID',
  is_used BOOLEAN DEFAULT FALSE COMMENT '是否已使用补课权益',
  used_booking_id INT NULL COMMENT '已使用的补课课程ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '补课权益生成时间',
  expires_at DATETIME NOT NULL COMMENT '补课权益过期时间(7天后)',
  status ENUM('active','used','expired') DEFAULT 'active' COMMENT '补课权益状态',
  FOREIGN KEY (profile_id) REFERENCES profile(id),
  FOREIGN KEY (original_booking_id) REFERENCES booking(id),
  FOREIGN KEY (used_booking_id) REFERENCES booking(id),
  INDEX idx_profile_id (profile_id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='补课权益表';
```

**生成时机**:
- 固定班用户开课前6小时内未请假 → 自动扣费 → 生成补课权益(7天有效)

---

### 5. course表新增字段

```sql
ALTER TABLE course 
ADD COLUMN max_capacity_no_assistant INT DEFAULT 6 COMMENT '无助教最大人数',
ADD COLUMN max_capacity_with_assistant INT DEFAULT 8 COMMENT '有助教最大人数',
ADD COLUMN has_assistant BOOLEAN DEFAULT FALSE COMMENT '是否有助教';
```

**动态人数规则**:
```python
def get_max_capacity(course):
    if course.has_assistant:
        return course.max_capacity_with_assistant  # 8人
    else:
        return course.max_capacity_no_assistant    # 6人
```

---

### 6. account表新增字段

```sql
ALTER TABLE account 
ADD COLUMN has_purchased_trial BOOLEAN DEFAULT FALSE COMMENT '是否已购买过体验课';
```

**规则**: 一个微信ID只能购买一次体验课

---

### 7. waitlist表新增字段

```sql
ALTER TABLE waitlist 
ADD COLUMN queue_position INT COMMENT '当前排队位置(实时计算)',
ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE COMMENT '是否已发送通知',
ADD COLUMN waitlist_deadline DATETIME COMMENT '候补截止时间(开课前6.5小时)',
ADD COLUMN status ENUM('pending','success','failed','expired') DEFAULT 'pending' COMMENT '候补状态';
```

**排队位置更新**:
- 每次有人取消预约 → 重新计算queue_position
- 前方用户补位成功 → queue_position减1

---

## 📝 核心业务规则总结

### 规则1: 时间节点规则(6小时分界线)

| 时间点 | 操作 | 规则 |
|--------|------|------|
| **>6小时** | 取消预约 | ✅ 可取消,释放名额,固定班计入请假次数 |
| **=6小时** | 自动扣费 | ✅ 系统自动从钱包扣除课时费,锁定名额 |
| **<6小时** | 禁止取消 | ❌ 无法取消,未请假自动扣费并生成补课权益 |
| **开课前6.5小时** | 候补截止 | 🔒 不再接受新候补,队列中用户仍可补位 |

---

### 规则2: 补课系统规则

```
未请假课程(已扣费) 
  ↓
1. 课程状态变为"补课",在"课程-已完成"显示
  ↓
2. 点击课程,右下角显示"选择补课"按钮
  ↓
3. 选择近一周符合条件的课程(0元补课)
   条件: 年龄+等级匹配 && 课程≠原本固定课班级
   注: 补课课程时长可以不匹配,均为0元
  ↓
4. 补课课程在"课程-已约"显示,标签为"补课"
  ↓
5. 补课完成后,在"课程-已完成"显示,标签为"补课"
  ↓
6. 一周后"选择补课"按钮变灰(补课权益过期)
```

**防循环规则**:
- 补课课程如果未签到 → 自动结束补课 → 不再生成新的补课权益

---

### 规则3: 固定班请假规则

| 请假时间 | 是否扣费 | 是否计入请假次数 | 是否生成补课权益 |
|---------|---------|----------------|----------------|
| **开课前>6小时请假** | ❌ 不扣费 | ✅ 计入请假次数 | ❌ 不生成 |
| **开课前<6小时未请假** | ✅ 自动扣费 | ❌ 不计入请假次数 | ✅ 生成(7天有效) |

**连续请假次数限制**:
- 连续请假**4次** → 系统自动通知运营释放班级名额

---

### 规则4: 私教课流程规则

**前端流程**:
```
预约Tab-私教课 → 显示教练列表 → 点击"联系运营" → 弹出微信二维码
```

**后台流程**:
```
运营在后台手动上架私教课程 → 指定学员(填写用户姓名) → 用户在"课程-已约"看到课程
```

**关键规则**:
- ✅ 预约Tab显示私教课入口,但**不可在线预约**
- ✅ 私教课程**不在预约列表显示**,仅在"课程-已约"显示
- ✅ 运营可灵活调整私教课费用(如补课免费/请假不扣费)

---

### 规则5: 候补队列规则

**候补流程**:
```
用户加入候补队列 
  ↓
实时显示排队位置(如"前方还有2人")
  ↓
前方有人取消 → 自动补位(无需用户二次确认)
  ↓
补位成功 → 发送微信服务通知+小程序内通知
  ↓
用户有30分钟考虑是否取消(6.5-6小时缓冲期)
  ↓
6小时后名额锁定,无法取消
```

**候补失败**:
- 开课前6.5小时仍未补位成功 → 自动判定为候补失败 → 发送通知

---

## 🎯 Spec修改建议(按MVP分类)

### MVP-1 (用户身份系统)

**新增章节**: 虚拟年龄系统

```markdown
## 虚拟年龄系统

运营可为特殊学员设置虚拟年龄,用于课程匹配。虚拟年龄优先级高于真实年龄。

### 数据表设计

profile表新增字段:
- virtual_age: 虚拟年龄(DECIMAL 3,1)
- virtual_age_reason: 设置原因(TEXT)

### 用途

1. **用途1**: 特殊学员能力匹配低年龄班级
   - 示例: 11岁肥胖男孩 → 虚拟年龄6岁 → 匹配5-6岁班级

2. **用途2**: 未满18岁孩子能力匹配成人课
   - 示例: 17岁能力强 → 虚拟年龄19岁 → 匹配成人课(>18岁)

### Functional Requirements

- FR-XXX: 系统必须优先使用虚拟年龄进行课程匹配,若虚拟年龄为空则使用真实年龄
- FR-XXX: 运营必须能在后台设置学员的虚拟年龄,并填写设置原因
- FR-XXX: 虚拟年龄设置后,小程序课程列表立即根据新年龄刷新
```

---

### MVP-2A (课程展示与预约)

**新增User Story 1**: 时间冲突检测

```markdown
### User Story X - 时间冲突检测 (Priority: P0)

系统必须在用户预约课程前检测是否有时间冲突,若有冲突则提示并禁止预约。

**Why this priority**: 避免用户同时预约两节重叠时间的课程

**Independent Test**: 可独立测试时间冲突检测逻辑

**Acceptance Scenarios**:
1. **Given** 用户已预约周三15:00-16:00的课程A, **When** 尝试预约周三15:30-16:30的课程B, **Then** 系统提示"时间冲突,请先取消《课程A》"
2. **Given** 用户已预约周三15:00-16:00的课程A, **When** 尝试预约周三16:00-17:00的课程B, **Then** 预约成功(时间刚好衔接,无重叠)
3. **Given** 用户切换到其他档案, **When** 预约重叠时间的课程, **Then** 预约成功(不同档案独立)
```

---

**新增User Story 2**: 长期固定班与单次预约

```markdown
### User Story Y - 长期固定班与单次预约 (Priority: P0)

用户可选择长期固定班或单次预约,两者有不同的扣费和取消规则。

**Why this priority**: 核心业务逻辑,影响预约和扣费流程

**Independent Test**: 可独立测试长期固定班和单次预约的扣费逻辑

**Acceptance Scenarios**:
1. **Given** 用户选择长期固定班, **When** 排队成功, **Then** 不立即扣费,仅占班级名额
2. **Given** 长期固定班用户, **When** 开课前6小时, **Then** 系统自动从钱包扣除课时费
3. **Given** 用户选择单次预约, **When** 预约成功, **Then** 立即扣除课时费
4. **Given** 固定班用户开课前7小时请假, **When** 确认请假, **Then** 释放临时名额,保留固定名额,计入请假次数
5. **Given** 固定班用户连续请假4次, **When** 系统检测, **Then** 自动通知运营释放班级名额
```

---

**新增User Story 3**: 固定班请假与6小时规则

```markdown
### User Story Z - 固定班请假与6小时规则 (Priority: P0)

固定班用户可以在开课前6小时取消课程(计入请假次数),开课前6小时内无法取消(自动扣费并生成补课权益)。

**Why this priority**: 核心业务规则,避免临时取消影响开课

**Independent Test**: 可独立测试6小时分界线规则

**Acceptance Scenarios**:
1. **Given** 固定班用户在开课前7小时取消课程, **When** 确认取消, **Then** 释放临时名额,保留固定名额,计入请假次数
2. **Given** 固定班用户在开课前5小时尝试取消, **When** 点击取消, **Then** 系统提示"无法取消,将自动扣除课时费并生成补课权益"
3. **Given** 固定班用户开课前5小时未请假, **When** 开课前6小时, **Then** 自动扣费,在"课程-已完成"生成"补课"课程
```

---

**新增User Story 4**: 课程Tab功能

```markdown
### User Story W - 课程Tab功能 (Priority: P1)

用户可在"课程Tab"查看已约课程/历史课程/排队信息,并进行取消预约/分享课程等操作。

**Why this priority**: 用户查看和管理已约课程的主要入口

**Independent Test**: 可独立测试课程Tab的显示和操作

**Acceptance Scenarios**:
1. **Given** 用户进入"课程-已约", **When** 查看课程列表, **Then** 显示所有单次预约课程+固定班未来2节课
2. **Given** 用户点击课程, **When** 查看详情, **Then** 右下角显示状态标签(待上课/正在补位/已完课等)
3. **Given** 用户尝试取消预约, **When** 距离课程开始不足6小时, **Then** 系统提示"无法取消,请联系运营"
4. **Given** 用户点击"分享课程", **When** 分享给朋友, **Then** 朋友可点击进入课程详情页(方便组班)
```

---

**新增Functional Requirements**:
```markdown
- FR-XXX: 系统必须在用户预约课程前检测是否有时间冲突
- FR-XXX: 系统必须在课程开始后禁止预约(不允许迟到报名)
- FR-XXX: 系统必须根据是否有助教动态设置班级人数上限(2-6人或2-8人)
- FR-XXX: 系统必须在课程-已约界面显示所有单次预约课程+固定班未来2节课
- FR-XXX: 系统必须在课程开始前6小时内禁止取消预约
- FR-XXX: 系统必须在开课前6小时自动从钱包扣除固定班课时费
```

---

### MVP-2B (候补与补课)

**新增User Story 1**: 补课系统

```markdown
### User Story X - 补课系统 (Priority: P0)

固定班用户未请假且被扣费后,系统自动生成补课权益,用户可在7天内0元预约符合条件的课程进行补课。

**Why this priority**: 核心补偿机制,用户体验关键

**Independent Test**: 可独立测试补课权益生成和使用

**Acceptance Scenarios**:
1. **Given** 用户有补课权益, **When** 进入"课程-已完成", **Then** 看到未请假课程,状态为"补课",右下角显示"选择补课"按钮
2. **Given** 用户点击"选择补课", **When** 选择课程, **Then** 显示近一周符合条件的课程(年龄+等级匹配 且 课程≠原本固定课班级)
3. **Given** 用户选择补课课程1.5小时(正常价270元), **When** 确认预约, **Then** 0元预约,课程在"课程-已约"显示,标签为"补课"
4. **Given** 补课权益过期(7天后), **When** 用户查看, **Then** "选择补课"按钮变灰,无法使用
5. **Given** 补课课程未签到, **When** 课程结束, **Then** 自动结束补课,不再生成新的补课权益(禁止循环)
```

---

**新增User Story 2**: 候补队列排位显示与截止时限

```markdown
### User Story Y - 候补队列排位显示与截止时限 (Priority: P0)

用户在候补队列时,可实时查看排队位置(如"前方还有2人"),候补截止时限为开课前6.5小时。候补成功后,用户有30分钟考虑是否取消。

**Why this priority**: 提升用户体验,让用户了解排队进度

**Independent Test**: 可独立测试候补队列排位显示和截止时限

**Acceptance Scenarios**:
1. **Given** 用户加入候补队列, **When** 查看课程, **Then** 课程标签显示"前方还有2人 排队中"
2. **Given** 前方有用户取消预约, **When** 系统更新排队位置, **Then** 用户看到"前方还有1人"
3. **Given** 候补成功, **When** 系统自动预约, **Then** 发送微信服务通知+小程序内通知,无需用户二次确认
4. **Given** 候补成功后, **When** 用户收到通知, **Then** 有30分钟时间考虑是否取消(6.5-6小时缓冲期)
5. **Given** 开课前6.5小时候补截止, **When** 用户仍未候补上, **Then** 系统判定为候补失败,发送通知
```

---

**新增Functional Requirements**:
```markdown
- FR-XXX: 系统必须通过微信服务通知+小程序内通知双通道通知补位结果
- FR-XXX: 系统必须实时更新排队位置并显示(如'您是第3位候补')
- FR-XXX: 系统必须在候补成功后给用户30分钟考虑时间(6.5-6小时缓冲期)
- FR-XXX: 补课课程必须为0元,不考虑时长差异
```

---

### MVP-2C (私教课系统)

**修改User Story**: 私教课展示与线下预约

```markdown
### User Story X - 私教课展示与线下预约 (Priority: P0)

用户可在预约Tab查看私教课教练列表和价格,点击"联系运营"按钮添加微信进行线下预约。运营在后台手动上架私教课程,用户在"课程-已约"中查看。

**Why this priority**: 私教课需要灵活协商,线下预约更合适

**Independent Test**: 可独立测试私教课展示和后台上架功能

**Acceptance Scenarios**:
1. **Given** 用户进入"预约Tab-私教课", **When** 查看教练列表, **Then** 显示教练介绍/空余时间/价格表
2. **Given** 用户点击"联系运营", **When** 弹出二维码, **Then** 用户可添加运营微信
3. **Given** 用户线下确认预约, **When** 运营在后台手动上架私教课程(指定学员), **Then** 用户在"课程-已约"看到私教课程
4. **Given** 私教课程在"预约"列表, **When** 用户查看, **Then** 不显示私教课程(仅在"课程-已约"显示)
5. **Given** 用户取消私教课, **When** 运营调整费用, **Then** 可设置为0元(补课)或全额扣费
```

---

**新增Functional Requirements**:
```markdown
- FR-XXX: 系统必须在预约Tab显示私教课入口,但不可在线预约
- FR-XXX: 系统必须提供"联系运营"按钮,弹出运营微信二维码
- FR-XXX: 私教课程必须仅在"课程-已约"显示,不在"预约"列表显示
- FR-XXX: 运营必须能在后台手动上架私教课程,指定学员
- FR-XXX: 运营必须能灵活调整私教课费用(如补课免费/请假不扣费)
```

---

### MVP-5 (运营后台)

**新增User Story 1**: 虚拟年龄设置

```markdown
### User Story X - 虚拟年龄设置 (Priority: P1)

运营可为特殊学员设置虚拟年龄,用于课程匹配。

**Acceptance Scenarios**:
1. **Given** 运营在学员详情页, **When** 设置虚拟年龄为6岁,原因为"11岁肥胖男孩能力匹配5-6岁班级", **Then** 学员在小程序可预约5-6岁课程
2. **Given** 运营设置虚拟年龄为19岁,原因为"17岁能力强,匹配成人课", **When** 学员查看课程, **Then** 显示成人课程列表
```

---

**新增User Story 2**: 固定班名额管理

```markdown
### User Story Y - 固定班名额管理 (Priority: P1)

运营可查看固定班名额,并手动释放连续请假超过4次的学员名额。

**Acceptance Scenarios**:
1. **Given** 学员连续请假4次, **When** 系统通知运营, **Then** 运营可在后台释放该学员的固定班名额
2. **Given** 运营释放固定班名额, **When** 执行操作, **Then** 该名额变为可排队状态
```

---

**新增User Story 3**: 补课签到管理

```markdown
### User Story Z - 补课签到管理 (Priority: P1)

运营每天晚上可进行签到确认,并可调整签到状态(防止签到出错)。

**Acceptance Scenarios**:
1. **Given** 运营在后台查看今日课程, **When** 进行签到确认, **Then** 可批量或单个确认学员签到
2. **Given** 运营发现签到出错, **When** 调整签到状态, **Then** 可将"未签到"改为"已签到",记录调整人和调整时间
3. **Given** 补课课程未签到, **When** 课程结束24小时后, **Then** 系统自动标记为"缺席",不生成新补课权益
```

---

**新增User Story 4**: 私教课费用调整

```markdown
### User Story W - 私教课费用调整 (Priority: P1)

运营可在私教课取消或补课时,灵活调整扣费情况(如补课免费/请假不扣费)。

**Acceptance Scenarios**:
1. **Given** 用户取消私教课, **When** 运营调整费用, **Then** 可设置为0元(补课)或全额扣费
2. **Given** 用户请假私教课, **When** 运营设置不扣费, **Then** 用户钱包不扣款,不生成补课权益
```

---

## ✅ 总结

**需求分析完成度**: 100%

**决策确认**:
- ✅ 7个决策全部确认
- ✅ 所有逻辑冲突已解决
- ✅ 数据表设计完善
- ✅ Spec修改建议完整

**下一步行动**:
1. 生成数据库迁移脚本
2. 修改4个Spec(MVP-1/2A/2B/2C/5)
3. 生成API设计文档

---

**文档生成时间**: 2025-10-31 19:47  
**文档版本**: v2.0.0 (最终确认版)

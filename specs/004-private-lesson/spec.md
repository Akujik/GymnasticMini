# Feature Specification: Private Lesson System

**Feature Branch**: `004-private-lesson`
**Created**: 2025-11-05
**Status**: Draft
**MVP**: MVP-2C
**Dependencies**: MVP-2A (002-course-display-and-booking)
**Input**: "Build a private lesson system where parents can browse private coaching options, submit consultation requests, and manage private lesson bookings through admin coordination."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 私教课程浏览与咨询 (Priority: P1)

家长在小程序中浏览私教课程信息，查看教练介绍、课程类型、价格等，并可以提交咨询申请。系统显示"预约咨询"按钮而非直接预约。

**Why this priority**: 私教课程是高价值服务，需要专业咨询确保匹配正确性，咨询流程是转化的关键环节。

**Independent Test**: 浏览私教课程列表，验证"预约咨询"按钮显示正确，点击后能正常提交咨询申请。

**Acceptance Scenarios**:

1. **Given** 用户进入私教课程页面，**When** 查看课程列表，**Then** 显示教练信息、课程类型、价格等，按钮文案为"预约咨询"
2. **Given** 用户点击某私教课程的"预约咨询"按钮，**When** 进入咨询页面，**Then** 显示教练详细介绍、咨询表单、联系方式
3. **Given** 用户填写咨询表单并提交，**When** 系统处理，**Then** 显示"咨询已提交，运营人员将尽快联系您"，并生成咨询记录
4. **Given** 用户在"我的咨询"页面，**When** 查看咨询记录，**Then** 显示咨询状态（待联系/已联系/已预约/不感兴趣）
5. **Given** 运营人员联系用户确认私教安排，**When** 运营后台录入，**Then** 系统生成私教预约记录，用户可查看预约详情

---

### Edge Cases

- **教练临时取消**: 私教教练临时取消课程，如何处理？ → 运营人员及时通知用户，协助重新安排或退款
- **价格变动咨询**: 用户咨询时课程价格已调整，如何处理？ → 以咨询时有效价格为准，运营人员说明情况
- **教练档期冲突**: 用户希望的教练时间已满，如何处理？ → 运营人员推荐其他时间段或其他教练
- **咨询超时未响应**: 用户提交咨询后长期未收到联系，如何处理？ → 系统自动提醒运营人员，用户也可重新提交咨询

---

## Functional Requirements *(mandatory)*

### Core Requirements

- **FR-001**: 系统必须显示私教课程列表，包含教练信息、课程类型、价格等
- **FR-002**: 系统必须显示"预约咨询"按钮，而非直接预约按钮
- **FR-003**: 系统必须支持用户提交咨询申请，记录咨询内容和联系方式
- **FR-004**: 系统必须支持咨询状态跟踪（待联系/已联系/已预约/不感兴趣）
- **FR-005**: 系统必须支持运营人员录入私教预约安排
- **FR-006**: 系统必须显示用户的咨询记录和预约状态

#### FR-040: 4维标签白名单匹配相关（私教课扩展）

- **FR-040-PL**: 系统必须对私教课程实施4维标签白名单匹配验证：等级维度 + 年龄维度 + 性别维度 + 类型维度，任一维度不匹配则私教课程不显示
- **FR-040-PL**: 系统必须在私教课程详情页显示匹配度信息，说明为什么该私教课程适合当前学员档案
- **FR-040-PL**: 系统必须支持私教课程的个性化价格显示，基于4维匹配结果和用户权益动态计算

#### FR-042: 私教课仅浏览模式相关

- **FR-042-01**: 系统必须将私教课程设置为仅浏览模式，用户只能查看私教信息，不能直接在线预约
- **FR-042-02**: 系统必须显示"预约咨询"按钮替代"立即预约"按钮，引导用户通过咨询流程了解私教服务
- **FR-042-03**: 系统必须支持咨询表单提交，包含学员信息、咨询内容、期望时间、联系方式等字段
- **FR-042-04**: 系统必须为运营人员提供后台管理界面，处理咨询请求并手动安排私教预约
- **FR-042-05**: 系统必须支持线下支付流程，运营人员在后台录入私教预约后联系用户确认付款方式

### Data Requirements

- **FR-007**: 系统必须存储私教课程信息：教练ID、课程类型、价格、课程介绍
- **FR-008**: 系统必须存储咨询记录：用户ID、教练ID、咨询内容、状态、创建时间
- **FR-009**: 系统必须存储私教预约记录：用户ID、教练ID、预约时间、状态、价格

### Key Entities

- **private_instructor**: 私教教练实体
  - 核心属性: id, name, avatar_url, bio, specialties, price_per_hour, status, tags (4维标签)
  - 业务规则: 教练信息由运营维护，价格按小时计算，支持FR-040的4维标签匹配

- **private_course_tags**: 私教课程标签实体（扩展course_tags表）
  - 核心属性: id, course_id, level_range, age_range, gender, course_type="private", skill_types
  - 业务规则: 支持FR-040的4维标签白名单匹配，确保私教课程仅对匹配用户显示

- **private_inquiry**: 私教咨询实体（FR-042核心）
  - 核心属性: id, user_id, instructor_id, profile_id, inquiry_content, contact_info, preferred_time, status, created_at, admin_notes
  - 业务规则: 记录用户咨询，支持运营跟进，FR-042仅浏览模式的核心流程

- **private_consultation**: 私教咨询流程实体（FR-042扩展）
  - 核心属性: id, inquiry_id, consultation_method, consultation_time, admin_operator_id, consultation_result, follow_up_actions
  - 业务规则: 记录完整的咨询流程，支持多种联系方式和结果跟踪

- **private_booking**: 私教预约实体（FR-042线下录入）
  - 核心属性: id, user_id, profile_id, instructor_id, booking_time, duration, price, status, payment_method, admin_id, confirmation_notes
  - 业务规则: 由运营人员录入，用户不可直接预约，FR-042仅浏览模式的最终环节

---

## Success Criteria *(mandatory)*

- **SC-001**: 私教课程列表加载成功率>99%，信息显示准确率100%
- **SC-002**: "预约咨询"按钮显示准确率100%，无直接预约按钮
- **SC-003**: 咨询申请提交成功率>99%，状态跟踪准确率100%
- **SC-004**: 运营人员录入预约成功率>98%，用户查看准确率100%

#### FR-040: 4维标签白名单匹配成功标准

- **SC-005**: 私教课程4维标签匹配准确率100%（等级+年龄+性别+类型任一维度不匹配则不显示）
- **SC-006**: 私教课程匹配度计算准确率>95%，匹配详情说明清晰易懂
- **SC-007**: 私教课程个性化价格显示准确率100%，基于4维匹配和用户权益动态计算

#### FR-042: 私教课仅浏览模式成功标准

- **SC-008**: 私教课程仅浏览模式执行准确率100%（无直接在线预约功能）
- **SC-009**: "预约咨询"按钮转化率>30%，咨询表单提交成功率>98%
- **SC-010**: 咨询响应及时率>95%（运营人员24小时内响应）
- **SC-011**: 线下私教预约录入成功率>98%，预约信息准确率100%
- **SC-012**: 私教咨询到预约转化率>20%，用户满意度>90%

---

## Assumptions

- 假设运营人员能够及时响应用户咨询（24小时内）
- 假设私教教练的档期和价格信息相对稳定
- 假设用户理解私教课程需要通过咨询确认安排

---

## Out of Scope (MVP-2C 不实现)

- ❌ 在线支付私教课程费用（线下支付）
- ❌ 用户自主选择私教时间（需要运营协调）
- ❌ 私教课程评价功能
- ❌ 私教课程自动排期系统

---

## Integration Points

### Dependencies on MVP-2A
- **用户身份系统**: 需要用户登录和身份验证
- **课程展示系统**: 复用课程展示逻辑和UI组件

### Dependencies on Future MVPs
- **支付系统**: MVP-3可能支持私教课程在线支付
- **运营后台**: MVP-5提供私教管理和咨询处理功能

---

**创建人**: [产品经理]
**最后更新**: 2025-11-05
**版本**: v1.0.0
**状态**: Draft
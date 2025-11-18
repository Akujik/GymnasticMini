# 功能规格说明：管理后台系统

**功能分支**: `007-admin-dashboard`
**创建时间**: 2025-10-27
**重构日期**: 2025-11-17
**状态**: RuoYi架构重构中
**MVP**: MVP-5
**依赖关系**: MVP-1 (001-user-identity-system), MVP-3 (005-payment-integration), MVP-4 (006-wallet-system)
**输入需求**: "构建综合运营管理后台，包括用户管理、钱包调整、课程管理、数据分析、审计日志和简化的支付记录管理"
**版本**: v2.0.0 RuoYi架构重构

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 管理员登录与认证 (Priority: P0)

管理员通过账号密码登录Web后台，拥有完整的管理权限，可进行所有后台操作。

**Why this priority**: 简化的单角色管理降低系统复杂度，提高开发效率和维护性。

**Independent Test**: 使用管理员账号登录，验证所有功能模块都可正常访问。

**Acceptance Scenarios**:

1. **Given** 管理员使用正确的用户名和密码登录，**When** 点击登录，**Then** 成功进入管理后台首页，可访问所有功能模块
2. **Given** 管理员登录成功，**When** 查看导航菜单，**Then** 显示用户管理、钱包调整、课程管理、数据统计、出勤管理、私教录入等所有功能
3. **Given** 用户使用错误密码登录，**When** 点击登录，**Then** 显示"用户名或密码错误"提示，阻止访问
4. **Given** 管理员连续登录失败5次，**When** 再次尝试登录，**Then** 账号被锁定30分钟，防止暴力破解
5. **Given** 管理员登录成功，**When** 查看页面头部，**Then** 显示当前管理员信息和退出登录按钮

---

### User Story 2 - 用户管理与查询 (Priority: P0)

管理员可以查看所有用户的基本信息、学员档案，支持用户搜索、冻结、解冻等管理操作。用户详情页面提供消课对账记录和预约历史等核心功能。

**Why this priority**: 用户管理是后台系统的核心功能，用户详情页的消课对账记录是日常工作中最重要的页面。

**Independent Test**: 创建测试用户，验证信息展示和管理功能是否正确。

**Acceptance Scenarios**:

1. **Given** 管理员进入用户管理页面，**When** 页面加载完成，**Then** 显示所有用户列表（包含用户名、手机号、注册时间等）
2. **Given** 管理员搜索用户"张三"，**When** 点击搜索，**Then** 显示符合条件的用户信息
3. **Given** 管理员点击某用户详情，**When** 进入用户详情页头部，**Then** 显示微信昵称+手机号+OpenID+注册时间，钱包余额¥1000.00（欠费标红），[调整钱包]按钮
4. **Given** 管理员查看用户详情页Tab1"消课与对账记录"，**When** 页面加载完成，**Then** 显示统计卡片：累计充值¥5000.00，累计消费¥4800.00，剩余余额¥200.00，总消课数24节课
5. **Given** 管理员查看消课记录表格，**When** 查看数据，**Then** 显示所有记录：时间/档案姓名/课程名称/消课金额/交易类型/余额/备注，支持按时间范围/档案/交易类型筛选
6. **Given** 管理员查看用户详情页Tab2"预约与档案"，**When** 页面加载完成，**Then** 显示档案卡片列表，每个档案可展开显示最近5条预约记录
7. **Given** 管理员查看用户详情，**When** 用户欠费，**Then** 用户信息标红显示，右上角显示"催缴"按钮
8. **Given** 管理员选择某用户并点击"冻结"，**When** 确认操作，**Then** 该用户无法登录小程序，系统记录操作日志

---

### User Story 3 - 钱包余额调整 (Priority: P0)

管理员可以为指定用户调整钱包余额（充值或扣减），必须填写完整的调整信息，系统记录详细操作日志。

**Why this priority**: 钱包调整是重要的管理功能，必须确保操作安全和数据准确。

**Independent Test**: 创建测试用户并调整余额，验证余额变更和交易记录是否正确。

**Acceptance Scenarios**:

1. **Given** 管理员选择用户并填写调整金额+100元，**When** 填写调整原因"线下充值"、收款方式"微信"、订单号"wx123"，**Then** 用户余额增加100元
2. **Given** 管理员填写调整金额-50元，**When** 填写调整原因"线下退款"、收款方式"银行转账"、订单号"bank456"，**Then** 用户余额减少50元
3. **Given** 调整成功，**When** 系统提示，**Then** 显示"请将收款流水截图发送至飞书群"
4. **Given** 调整成功，**When** 查看操作日志，**Then** 记录操作人、时间、金额、原因、收款方式、订单号等完整信息
5. **Given** 用户查看交易记录，**When** 进入钱包页面，**Then** 显示该笔调整记录和详细信息

**调整表单字段**:
| 字段名 | 类型 | 是否必填 | 说明 |
|--------|------|---------|------|
| 调整金额 | 数字 | ✅ 必填 | 正数=充值,负数=扣款 |
| 调整原因 | 下拉选择 | ✅ 必填 | 线下充值/线下退款/误操作更正/其他 |
| 收款方式 | 下拉选择 | ✅ 必填 | 微信/支付宝/银行转账/现金 |
| 订单号 | 文本 | 选填 | 支付宝流水号/银行转账单号等 |
| 备注 | 文本 | 选填 | 自由填写 |

---

### User Story 4 - 钱包冻结管理 (Priority: P0)

管理员可以在后台为用户操作钱包冻结/解冻，查询冻结状态和历史记录，管理冻结权限和操作日志。

**Why this priority**: 钱包冻结是重要的风险控制功能，需要管理员能够灵活操作和监控。

**Independent Test**: 创建测试用户并执行冻结/解冻操作，验证冻结管理功能是否正确。

**Acceptance Scenarios**:

1. **Given** 管理员进入用户管理页面，**When** 选择某用户点击"冻结钱包"，**Then** 显示冻结设置弹窗，包含冻结时长选择（1-3个月）和冻结原因输入
2. **Given** 管理员设置冻结时长为2个月，**When** 填写冻结原因"用户申请"，**Then** 系统立即冻结用户钱包，暂停半年度消费计算，记录操作日志
3. **Given** 用户钱包被冻结，**When** 管理员查看用户列表，**Then** 该用户显示"已冻结"状态标识
4. **Given** 管理员查看冻结用户详情，**When** 查看钱包信息，**Then** 显示冻结状态、冻结开始时间、预计结束时间、剩余冻结天数
5. **Given** 管理员为用户解冻，**When** 点击"解冻钱包"，**Then** 显示确认弹窗，确认后立即解除冻结状态，恢复用户预约权限
6. **Given** 管理员查看冻结历史，**When** 进入冻结管理页面，**Then** 显示所有冻结操作记录，包含操作人、时间、用户、冻结时长、解冻时间
7. **Given** 管理员查询冻结用户，**When** 使用筛选条件"冻结状态=已冻结"，**Then** 显示所有当前冻结的用户列表
8. **Given** 用户申请冻结超过一年限制，**When** 管理员尝试操作，**Then** 系统提示"该用户今年已使用过冻结权限，每年只能冻结一次"

**冻结管理界面字段**:
| 字段名 | 类型 | 是否必填 | 说明 |
|--------|------|---------|------|
| 用户选择 | 用户搜索 | ✅ 必填 | 搜索并选择要冻结的用户 |
| 冻结时长 | 数字选择 | ✅ 必填 | 1-3个月，超过90天的不允许 |
| 冻结原因 | 文本输入 | ✅ 必填 | 冻结的具体原因说明 |
| 操作备注 | 文本输入 | 选填 | 管理员操作备注信息 |

---

### User Story 5 - 体验课续课跟进 (Priority: P0)

管理员可以查看已完成体验课的用户，跟进续课意向，管理从体验课到正式课的转化流程。

**Why this priority**: 体验课转化是重要的业务指标，需要专门的跟进管理功能。

**Independent Test**: 创建模拟体验课完成记录，验证跟进功能是否正常。

**Acceptance Scenarios**:

1. **Given** 用户完成体验课，**When** 管理员查看跟进列表，**Then** 该用户显示在"待跟进"列表中（红色高亮）
2. **Given** 管理员联系用户了解续课意向，**When** 选择"已跟进"，**Then** 记录联系时间和跟进结果（有意向/考虑中/无意向）
3. **Given** 用户有意向转为正式课，**When** 管理员点击"续课办理"，**Then** 跳转到用户详情页可调整钱包余额
4. **Given** 管理员查看转化率报表，**When** 选择时间范围，**Then** 显示体验课付费转化率和续课转化率数据
5. **Given** 管理员标记某用户为"已完成跟进"，**When** 更新状态，**Then** 该用户从"待跟进"列表中移除

---

### User Story 5 - 课程管理 (Priority: P0)

管理员可以创建、修改、删除课程，管理课程信息和价格设置，支持管理员标记出勤状态。

**Why this priority**: 课程管理是管理员后台的基础功能，支持灵活的课程安排。

**Independent Test**: 创建测试课程，验证课程管理功能是否正确。

**Acceptance Scenarios**:

1. **Given** 管理员创建新课程，**When** 填写课程信息，**Then** 系统创建新课程记录
2. **Given** 管理员修改课程信息，**When** 保存修改，**Then** 课程信息更新成功
3. **Given** 管理员删除有预约的课程，**When** 确认删除，**Then** 系统提示"该课程有X人预约，确认删除将自动处理退款/恢复余额"
4. **Given** 课程被删除，**When** 查看操作日志，**Then** 记录删除操作和相关信息
5. **Given** 管理员登录查看自己负责的课程，**When** 进入课程列表，**Then** 只显示自己负责的课程

---

### User Story 6 - 出勤状态管理 (Priority: P0)

管理员可以标记学员的出勤状态，系统记录出勤信息用于统计分析，不涉及任何扣费操作。

**Why this priority**: 出勤管理是教学质量跟踪的重要组成部分。

**Independent Test**: 模拟出勤标记场景，验证状态记录是否正确。

**Acceptance Scenarios**:

1. **Given** 管理员登录并进入课程页面，**When** 选择今日课程，**Then** 显示所有预约学员列表
2. **Given** 管理员标记某学员为"已到课"，**When** 确认标记，**Then** 系统记录出勤状态和时间
3. **Given** 管理员标记某学员为"缺勤"，**When** 确认标记，**Then** 系统记录缺勤状态，不涉及任何扣费
4. **Given** 学员请假，**When** 管理员标记为"请假"，**Then** 系统记录请假状态
5. **Given** 管理员查看出勤统计，**When** 选择时间范围，**Then** 显示出勤率和缺勤统计报表

**注意**：出勤标记仅用于统计和分析，不触发任何扣费逻辑。正式课费用在预约时已扣除，取消预约时通过微信原路退款。

---

### User Story 7 - 课程标签管理 (Priority: P0)

管理员可以管理课程的标签信息，包括等级范围、年龄段、技能类型等，确保课程匹配算法的准确性。

**Why this priority**: 标签管理是智能课程匹配系统的基础，必须确保标签数据的准确性和完整性。

**Independent Test**: 创建课程标签，验证标签匹配算法是否正确使用标签数据。

**Acceptance Scenarios**:

1. **Given** 管理员创建新课程，**When** 设置课程标签，**Then** 可以设置等级范围["L1+", "L2"]、年龄段"4-6岁"、技能类型["平衡", "柔韧"]等
2. **Given** 管理员修改课程标签，**When** 更新等级范围，**Then** 系统重新计算该课程与学员的匹配度
3. **Given** 管理员查看标签匹配日志，**When** 选择某课程，**Then** 显示该课程的历史匹配记录和匹配分数分布
4. **Given** 系统检测到标签异常，**When** 管理员查看报告，**Then** 显示"标签不一致"警告，如课程等级与年龄段不匹配
5. **Given** 管理员批量更新课程标签，**When** 选择多个课程，**Then** 支持批量设置相同的标签模板

---

### User Story 8 - 学员标签与虚拟年龄管理 (Priority: P0)

管理员可以查看和调整学员的标签信息，包括发展标签、权益标签，以及虚拟年龄设置，确保课程匹配的准确性。

**Why this priority**: 学员标签是课程匹配的核心数据，虚拟年龄功能需要管理员审核和调整。

**Independent Test**: 设置学员标签和虚拟年龄，验证课程匹配结果是否符合预期。

**Acceptance Scenarios**:

1. **Given** 管理员查看学员详情，**When** 查看标签信息，**Then** 显示年龄标签、等级、性别、发展标签、权益标签等完整信息
2. **Given** 管理员调整学员发展标签，**When** 从"兴趣"改为"专业"，**Then** 系统重新计算该学员的课程推荐
3. **Given** 家长申请虚拟年龄设置，**When** 管理员审核，**Then** 可以批准或拒绝设置，并记录审核原因
4. **Given** 虚拟年龄差异过大(5岁vs 12岁)，**When** 管理员处理，**Then** 系统提示需要管理员评估确认
5. **Given** 管理员提交虚拟年龄调整申请，**When** 管理员审核，**Then** 可以根据管理员建议调整学员虚拟年龄

---

### User Story 9 - 价格规则管理 (Priority: P0)

管理员可以设置多维度的价格规则，包括客户类型、人群类型、课程类型、等级范围等，实现个性化定价。

**Why this priority**: 价格规则是动态定价系统的基础，必须支持灵活的价格配置。

**Independent Test**: 设置不同价格规则，验证价格计算是否正确应用规则。

**Acceptance Scenarios**:

1. **Given** 管理员创建价格规则，**When** 设置规则名称"儿童团课L1-L4老用户价"，**Then** 配置客户类型"老用户"、人群"儿童"、课程"团课"、等级"L1-L4"、折扣率1.0
2. **Given** 管理员设置亲友权益价格，**When** 配置规则，**Then** 设置折扣率0.6，课程显示"🎉亲友专享6折"标签
3. **Given** 管理员查看价格规则冲突，**When** 检测冲突，**Then** 系统提示"规则优先级设置建议"，避免价格计算混乱
4. **Given** 管理员测试价格规则，**When** 输入测试条件，**Then** 显示计算结果"原价180元，折扣价108元，规则：亲友价"
5. **Given** 价格规则生效，**When** 用户查看课程，**Then** 显示基于该用户档案计算的个性化价格

---

### User Story 10 - 候补队列管理 (Priority: P1)

管理员可以查看课程候补队列状态，处理候补异常情况，监控候补截止时限执行情况。

**Why this priority**: 候补管理是预约系统的重要组成部分，需要管理员监控和异常处理。

**Independent Test**: 模拟候补队列场景，验证管理功能是否正常。

**Acceptance Scenarios**:

1. **Given** 课程有候补队列，**When** 管理员查看，**Then** 显示候补人数列表、候补轮次、截止时间等信息
2. **Given** 候补用户过期未确认，**When** 管理员查看，**Then** 显示过期原因和处理状态
3. **Given** 候补通知发送失败，**When** 管理员处理，**Then** 可以手动重新发送通知或联系用户
4. **Given** 候补系统异常，**When** 管理员干预，**Then** 支持手动调整候补顺序和分配名额
5. **Given** 管理员查看候补统计，**When** 选择时间范围，**Then** 显示候补成功率、平均等待时间等指标

---

### User Story 11 - 私教课线下预约录入 (Priority: P1)

管理员可以线下录入私教课预约记录，管理管理员联系方式，处理私教课相关咨询。

**Why this priority**: 私教课采用线下预约模式，需要管理员手动录入和管理。

**Independent Test**: 模拟私教课预约，验证录入功能是否正常。

**Acceptance Scenarios**:

1. **Given** 家长线下预约私教课，**When** 管理员录入，**Then** 填写学员档案、管理员、时间、价格等信息创建预约记录
2. **Given** 私教课价格线下协商，**When** 管理员录入，**Then** 可以填写实际协商价格并备注价格确认信息
3. **Given** 管理员联系方式变更，**When** 管理员更新，**Then** 修改管理员的电话、微信等联系信息
4. **Given** 用户咨询私教课，**When** 管理员查看，**Then** 显示咨询记录和跟进状态
5. **Given** 私教课需要调整，**When** 管理员处理，**Then** 支持修改时间、更换管理员等操作，并通知用户

---

### User Story 12 - 补课课时补偿管理 (Priority: P1)

管理员可以查看和管理补课课时补偿记录，处理补偿课时使用异常情况。

**Why this priority**: 补课补偿是课时管理的重要功能，需要管理员监控和异常处理。

**Independent Test**: 创建补课补偿记录，验证管理功能是否正常。

**Acceptance Scenarios**:

1. **Given** 学员有补课补偿记录，**When** 管理员查看，**Then** 显示补偿时长、来源、状态等信息
2. **Given** 补偿课时即将过期，**When** 管理员查看，**Then** 系统显示预警提醒，可联系用户使用
3. **Given** 补偿使用异常，**When** 管理员处理，**Then** 可以手动调整补偿记录或添加备注
4. **Given** 用户累积大量补偿课时，**When** 管理员查看，**Then** 系统提醒主动联系用户安排补课
5. **Given** 管理员查看补偿统计，**When** 选择时间范围，**Then** 显示补偿发放量、使用率等指标

---

### User Story 13 - 数据统计与分析 (Priority: P1)

管理员可以查看各种业务数据统计，包括用户数、预约数、收入趋势等关键指标。

**Why this priority**: 数据统计是管理员决策的重要依据，必须提供准确和及时的数据分析。

**Independent Test**: 生成测试数据，验证统计图表和数据是否正确显示。

**Acceptance Scenarios**:

1. **Given** 管理员进入数据看板，**When** 页面加载完成，**Then** 显示今日/本周/本月的关键业务指标
2. **Given** 管理员查看用户增长趋势，**When** 选择月度视图，**Then** 显示过去12个月的用户增长曲线图
3. **Given** 管理员查看收入统计，**When** 选择按课程维度，**Then** 显示各课程的收入贡献占比
4. **Given** 管理员查看欠费用户统计，**When** 点击欠费用户数，**Then** 跳转到欠费用户列表
5. **Given** 管理员查看出勤率统计，**When** 选择管理员和课程，**Then** 显示该管理员的出勤率数据

**核心指标**:
- 总用户数 / 今日新增用户
- 本月预约数 / 本月收入
- 欠费用户数 / 体验课转化率
- 钱包总余额 / 本月充值金额
- 整体出勤率 / 管理员出勤率对比

---

### User Story 8 - 用户详情页消课对账功能 (Priority: P0)

用户详情页提供完整的消课对账记录查询功能，支持多维度筛选、统计卡片展示和Excel导出，便于管理员进行财务核对。

**Why this priority**: 消课对账是管理员日常工作中最重要的功能，必须提供清晰、准确、便捷的查询体验。

**Independent Test**: 创建包含多种交易记录的测试用户，验证对账功能是否准确。

**Acceptance Scenarios**:

1. **Given** 管理员进入用户详情页Tab1"消课与对账记录"，**When** 页面加载完成，**Then** 显示4个统计卡片：累计充值、累计消费、剩余余额、总消课数
2. **Given** 管理员查看消课记录表格，**When** 查看记录，**Then** 显示混合的充值、消课、调整记录，按时间倒序排列
3. **Given** 管理员筛选"交易类型=充值"，**When** 应用筛选，**Then** 表格只显示充值记录，包含线下充值记录
4. **Given** 管理员筛选"档案=张三"，**When** 应用筛选，**Then** 表格只显示张三相关的所有消课记录
5. **Given** 管理员筛选"时间范围=2025年10月"，**When** 应用筛选，**Then** 表格只显示10月份的所有交易记录
6. **Given** 管理员点击"导出对账Excel"按钮，**When** 下载完成，**Then** 获得包含当前筛选条件下所有记录的Excel文件

**消课记录表格字段**:
- **时间**: 交易发生时间
- **档案姓名**: 学员姓名
- **课程名称**: 课程或活动名称
- **金额**: 交易金额（正数表示充值，负数表示扣费）
- **交易类型**: 充值/消课扣费/余额调整
- **余额**: 交易后钱包余额
- **备注**: 交易备注或说明

---

### User Story 9 - 用户详情页预约档案管理 (Priority: P0)

用户详情页提供学员档案管理和预约历史查询功能，支持档案卡片式展示和预约记录查看。

**Why this priority**: 预约档案管理是管理员了解用户课程参与情况的重要功能。

**Independent Test**: 创建包含多个学员档案的用户，验证档案管理和预约历史查询功能。

**Acceptance Scenarios**:

1. **Given** 管理员进入用户详情页Tab2"预约与档案"，**When** 页面加载完成，**Then** 显示该用户的所有学员档案卡片
2. **Given** 管理员查看档案卡片"张三(5岁,L2)"，**When** 点击展开，**Then** 显示张三最近5条预约记录
3. **Given** 展开的预约记录显示状态"已完成"，**When** 查看详情，**Then** 显示预约时间、课程名称、消课状态等完整信息
4. **Given** 管理员查看"已完成"的预约记录，**When** 点击查看，**Then** 显示对应的消课记录链接
5. **Given** 管理员点击"查看完整预约历史"按钮，**When** 跳转到新页面，**Then** 显示该用户所有档案的所有预约记录（混合显示）

---

### User Story 10 - 操作日志与审计 (Priority: P0)

系统自动记录所有后台操作的日志，管理员可以查询和审计操作记录。

**Why this priority**: 操作审计是系统安全和合规的重要保障，必须完整记录所有敏感操作。

**Independent Test**: 执行各种管理操作，验证日志记录是否完整和准确。

**Acceptance Scenarios**:

1. **Given** 管理员调整用户钱包余额，**When** 操作完成，**Then** 系统记录操作人、时间、操作内容、金额等信息
2. **Given** 管理员冻结用户账号，**When** 操作完成，**Then** 系统记录冻结原因和操作人员信息
3. **Given** 管理员查看操作日志，**When** 选择时间范围和操作类型，**Then** 显示符合条件的操作记录
4. **Given** 发现异常操作，**When** 管理员查看详情，**Then** 可以追溯到具体的操作人和操作时间
5. **Given** 系统记录操作日志，**When** 查看日志详情，**Then** 显示操作前后的数据变化

---

### User Story 11 - 课程标签管理 (Priority: P0)

管理员在后台创建/编辑课程时，可以为课程设置多维度标签（等级范围/年龄范围/性别/类型等），这些标签用于小程序的智能匹配算法，确保推荐给合适的学员。

**Why this priority**: 课程标签是智能匹配系统的核心数据，直接影响用户体验和预约转化率，必须由管理员精确配置。

**Independent Test**: 创建不同标签的课程，验证小程序匹配结果是否符合预期。

**Acceptance Scenarios**:

1. **Given** 管理员创建新课程，**When** 进入标签设置页面，**Then** 可以设置等级范围（如选择"L1,L2"表示L1和L2都可报）、年龄范围、性别要求、课程类型
2. **Given** 管理员编辑课程标签，**When** 修改年龄标签为"5-6岁"，**Then** 保存后小程序端该课程的匹配年龄范围立即更新
3. **Given** 管理员设置课程等级范围为["L1+", "L2"]，**When** 保存成功，**Then** 系统正确识别跨级匹配规则，L1.5学员可以看到该课程
4. **Given** 管理员为课程添加技能标签"柔韧训练、协调训练"，**When** 保存成功，**Then** 小程序端显示对应技能标签
5. **Given** 管理员设置课程为"热门"程度，**When** 保存成功，**Then** 该课程在小程序推荐排序中获得更高权重
6. **Given** 管理员查看课程标签列表，**When** 进入标签管理页面，**Then** 可以看到所有课程的标签配置，支持批量修改和导出

---

### User Story 12 - 学员标签管理 (Priority: P0)

管理员在后台可以手动为学员设置等级和发展标签，年龄标签由系统自动计算，权益标签根据消费记录自动更新。这些标签用于课程的智能匹配和推荐。

**Why this priority**: 学员标签的准确性直接影响课程推荐的准确性，需要管理员及时维护和更新。

**Independent Test**: 修改学员标签，验证小程序推荐课程的变化是否符合预期。

**Acceptance Scenarios**:

1. **Given** 管理员在学员详情页，**When** 修改等级为L3，**Then** 学员在小程序看到的课程列表立即更新为适合L3的课程
2. **Given** 管理员设置学员发展标签为"专业班"，**When** 保存成功，**Then** 系统优先推荐专业类型的课程给该学员
3. **Given** 管理员查看学员标签历史，**When** 进入标签变更记录，**Then** 显示所有标签修改的时间、操作人、修改原因
4. **Given** 学员年龄达到下一个年龄段，**When** 系统自动计算，**Then** 年龄标签自动更新，推荐课程相应调整
5. **Given** 学员首次购买正式课，**When** 系统检测，**Then** 权益标签从"new_user"自动更新为"old_user"
6. **Given** 管理员需要批量调整学员等级，**When** 使用批量操作功能，**Then** 可以选择多个学员一次性调整等级，系统记录操作日志
7. **Given** 学员标签设置异常，**When** 管理员查看标签分析报告，**Then** 系统显示可能的标签错误和修正建议

---

### User Story 13 - 标签匹配规则配置 (Priority: P1)

高级管理员可以配置标签匹配算法的权重参数，优化推荐效果。系统提供匹配效果分析，帮助管理员调整算法参数。

**Why this priority**: 匹配算法的优化需要基于实际效果数据，提供配置界面可以持续优化推荐质量。

**Independent Test**: 调整算法权重，验证匹配结果的变化是否符合预期。

**Acceptance Scenarios**:

1. **Given** 高级管理员进入算法配置页面，**When** 查看当前权重设置，**Then** 显示基础匹配60%+发展匹配25%+权益匹配10%+时间匹配5%的分配
2. **Given** 管理员调整发展匹配权重到30%，**When** 保存配置，**Then** 新的匹配算法立即生效，推荐结果相应调整
3. **Given** 管理员查看匹配效果报告，**When** 选择时间范围，**Then** 显示预约转化率、匹配准确率、用户满意度等关键指标
4. **Given** 系统检测到匹配效果下降，**When** 生成预警报告，**Then** 管理员收到通知并查看具体的优化建议
5. **Given** 管理员测试新的匹配规则，**When** 使用A/B测试功能，**Then** 可以对比不同规则的效果差异
6. **Given** 管理员需要回滚算法配置，**When** 点击恢复历史配置，**Then** 系统支持恢复到任意历史版本的配置

---

### User Story 14 - 价格规则管理 (Priority: P0)

管理员在后台可以管理价格规则，包括创建/编辑/删除不同客户类型和等级的价格，支持价格规则的批量导入和调整。

**Why this priority**: 价格规则是系统定价的核心逻辑，直接影响营收和用户体验，必须由管理员精确管理。

**Independent Test**: 创建不同类型的价格规则，验证小程序端价格显示是否准确更新。

**Acceptance Scenarios**:

1. **Given** 管理员在后台"价格管理"页面，**When** 点击"新增价格规则"，**Then** 可以选择客户类型(old_user/new_user/friend)/人群类型(child/adult)/课程类型(group/long_term/private_1v1/private_1v2)/等级范围并设置价格
2. **Given** 管理员编辑"儿童团课L1-L4老用户价"，**When** 修改价格为200元，**Then** 小程序课程列表自动更新为老用户显示200元价格
3. **Given** 管理员设置"亲友权益折扣率"为0.60，**When** 亲友用户查看团课，**Then** 显示基础价格的6折价格，并显示"🎉亲友专享6折"标签
4. **Given** 管理员批量导入价格规则，**When** 上传Excel文件，**Then** 系统验证数据格式，成功导入规则并显示导入结果报告
5. **Given** 管理员查看价格规则列表，**When** 筛选"团课-老用户"，**Then** 显示所有团课的老用户价格规则，支持按生效日期排序
6. **Given** 管理员需要调整所有老用户价格，**When** 使用批量操作功能，**Then** 可以选择多条规则一次性调整，系统记录操作日志

---

### User Story 15 - 客户权益设置 (Priority: P0)

管理员在后台可以手动为学员设置客户类型（老用户/新用户/亲友权益），系统自动根据首次报课日期判断用户类型。

**Why this priority**: 客户权益直接影响价格计算，错误的权益设置会导致价格显示错误，影响用户体验和营收。

**Independent Test**: 修改学员客户类型，验证小程序端价格显示是否正确变化。

**Acceptance Scenarios**:

1. **Given** 管理员在学员详情页，**When** 修改客户类型为"亲友权益"，**Then** 学员在小程序看到的团课价格自动变为6折价格
2. **Given** 管理员查看学员的registration_date为2024-10-01，**When** 系统自动计算，**Then** 显示客户类型为"老用户"，界面显示"基于首次报课日期自动计算"
3. **Given** 管理员需要批量调整学员权益，**When** 使用批量设置功能，**Then** 可以选择多个学员一次性设置权益，系统提供撤销操作
4. **Given** 管理员设置学员为"新用户"，**When** 该学员查看课程，**Then** 显示新用户价格，体验课价格为200元且检查OpenID限制
5. **Given** 管理员查看学员价格历史，**When** 点击查看价格记录，**Then** 显示该学员所有预约的价格明细，包含基础价格、折扣、实付价格
6. **Given** 管理员需要验证客户类型设置，**When** 查看客户类型分析报告，**Then** 显示老用户/新用户/亲友权益的分布统计和转化率数据

---

## RuoYi架构设计

### 技术栈升级

**后端架构**：
- **框架**: Spring Boot 2.7.x + RuoYi-Vue-Pro
- **ORM**: MyBatis-Plus 3.5.x (LambdaQueryWrapper查询优化)
- **缓存**: Redis 6.x (Spring Cache + @Cacheable注解)
- **数据库**: MySQL 8.0 (主从复制)
- **认证**: Spring Security + JWT Token
- **事务**: @Transactional注解管理
- **日志**: Spring Boot Actuator + Logback + RuoYi @Log注解
- **API文档**: Swagger 3.0 (OpenAPI)
- **定时任务**: Spring @Scheduled

**前端架构**：
- **管理后台**: Vue 3 + TypeScript + Element Plus + RuoYi-Vue-Pro
- **状态管理**: Pinia (Vue 3推荐)
- **HTTP客户端**: Axios
- **组件库**: Element Plus + RuoYi-Vue-Pro组件

### RuoYi架构核心优势

- **统一响应格式**: RuoYi标准的AjaxResult响应
- **权限控制**: @PreAuthorize注解细粒度权限
- **审计日志**: @Log注解自动记录操作
- **事务管理**: @Transactional确保数据一致性
- **代码生成**: RuoYi代码生成器快速生成CRUD
- **数据权限**: 基于角色的数据访问控制

---

## RuoYi架构功能需求 (重构版)

### 权限管理相关
- **FR-001**: 系统必须基于RuoYi权限管理实现管理员登录认证
- **FR-002**: 系统必须支持单一管理员角色，使用@PreAuthorize权限控制
- **FR-003**: 系统必须基于Spring Security验证用户权限，无权限用户不能访问对应功能
- **FR-004**: 系统必须基于RuoYi @Log注解记录用户登录日志和操作日志
- **FR-005**: 系统必须支持Spring Security会话超时自动退出

### 用户管理相关
- **FR-006**: 系统必须基于MyBatis-Plus支持用户信息的查看和搜索
- **FR-007**: 系统必须支持用户冻结/解冻操作，使用RuoYi数据权限控制
- **FR-008**: 系统必须支持用户数据修复功能，基于MyBatis-Plus乐观锁机制
- **FR-009**: 系统必须基于Redis缓存显示用户的学员档案和钱包信息
- **FR-010**: 系统必须支持欠费用户的标红显示和催缴功能，集成RuoYi通知服务
- **FR-011**: 用户详情页头部必须显示微信昵称+手机号+OpenID+注册时间
- **FR-012**: 用户详情页头部必须显示钱包余额，欠费时基于RuoYi样式标红显示
- **FR-013**: 用户详情页必须包含"消课与对账记录"和"预约与档案"两个Tab，使用Vue3组件

### RuoYi实体设计

#### AdminUser（管理员实体）
```java
@Data
@TableName("admin_user")
@Accessors(chain = true)
public class AdminUser extends BaseEntity implements Serializable {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

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

    @TableField("status")
    private String status; // active/inactive

    @TableField("last_login_at")
    private LocalDateTime lastLoginAt;

    @Version
    @TableField("version")
    private Integer version;
}
```

#### GymWalletAdjustment（钱包调整记录实体）
```java
@Data
@TableName("gym_wallet_adjustment")
@Accessors(chain = true)
public class GymWalletAdjustment extends BaseEntity implements Serializable {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("amount")
    private BigDecimal amount; // 正数=充值，负数=扣款

    @TableField("reason")
    private String reason; // offline_recharge/offline_refund/correction/other

    @TableField("payment_method")
    private String paymentMethod; // wechat/alipay/bank_transfer/cash

    @TableField("external_order_no")
    private String externalOrderNo;

    @TableField("note")
    private String note;

    @TableField("admin_user_id")
    private Long adminUserId;

    @Version
    @TableField("version")
    private Integer version;
}
```

#### RuoYi业务服务层设计
```java
@Service
@Transactional(rollbackFor = Exception.class)
@Slf4j
public class GymAdminUserServiceImpl extends ServiceImpl<AdminUserMapper, AdminUser> implements IGymAdminUserService {

    @Override
    @Cacheable(value = "adminUsers", key = "#username")
    public AdminUser findByUsername(String username) {
        LambdaQueryWrapper<AdminUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUser::getUsername, username)
               .eq(AdminUser::getStatus, "active");
        return this.getOne(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "管理员登录", businessType = BusinessType.LOGIN)
    public boolean login(String username, String password, String ipAddress, String userAgent) {
        AdminUser adminUser = findByUsername(username);
        if (adminUser == null) {
            throw new ServiceException("用户名或密码错误");
        }

        // 验证密码（使用BCrypt）
        if (!BCryptPasswordEncoder.matches(password, adminUser.getPasswordHash())) {
            throw new ServiceException("用户名或密码错误");
        }

        // 更新最后登录时间
        adminUser.setLastLoginAt(LocalDateTime.now());
        return this.updateById(adminUser);
    }
}
```

### RuoYi控制器层设计
```java
@RestController
@RequestMapping("/admin")
@Api(tags = "管理后台")
@RequiredArgsConstructor
public class GymAdminController extends BaseController {

    private final IGymAdminUserService adminUserService;
    private final IGymWalletAdjustmentService walletAdjustmentService;

    @PostMapping("/login")
    @ApiOperation("管理员登录")
    public AjaxResult login(@RequestBody AdminLoginDTO loginDTO) {
        // 登录逻辑
        return success(adminUserService.login(loginDTO.getUsername(), loginDTO.getPassword(),
                                           getClientIP(), getRequest().getHeader("User-Agent")));
    }

    @PostMapping("/wallet/adjust")
    @ApiOperation("钱包余额调整")
    @PreAuthorize("@ss.hasPermi('admin:wallet:adjust')")
    @Log(title = "钱包调整", businessType = BusinessType.UPDATE)
    public AjaxResult adjustWallet(@Valid @RequestBody WalletAdjustmentDTO adjustmentDTO) {
        return toAjax(walletAdjustmentService.adjustBalance(adjustmentDTO));
    }
}
```

---

## RuoYi架构成功指标

### 技术性能指标
- **SC-001**: 管理员登录成功率>99.5%（RuoYi Spring Security认证）
- **SC-002**: 权限控制准确率100%（@PreAuthorize细粒度权限）
- **SC-003**: 钱包调整操作成功率>99%（MyBatis-Plus事务管理）
- **SC-004**: 数据统计准确率100%（Redis缓存+数据库一致）
- **SC-005**: 操作日志完整性100%（RuoYi @Log注解自动审计）
- **SC-006**: 页面响应时间<2秒（Vue3 + Element Plus优化）

### RuoYi架构质量指标
- **SC-007**: MyBatis-Plus查询优化率>95%，LambdaQueryWrapper使用率100%
- **SC-008**: Spring事务管理正确率100%，@Transactional注解覆盖所有关键操作
- **SC-009**: Redis缓存命中率>90%，@Cacheable注解优化所有查询接口
- **SC-010**: RuoYi数据权限控制正确率100%，@PreAuthorize注解完整覆盖
- **SC-011**: 乐观锁并发控制成功率>99%，@Version字段防止并发冲突
- **SC-012**: RuoYi统一响应格式使用率100%，AjaxResult规范输出

---

## RuoYi架构集成点

### RuoYi-Vue-Pro 系统集成

#### 与RuoYi核心模块的依赖关系
- **RuoYi用户认证**: 集成Spring Security + JWT，使用@PreAuthorize权限控制管理后台访问
- **RuoYi系统监控**: 集成Spring Boot Actuator，支持管理后台健康检查和性能监控
- **RuoYi代码生成**: 使用RuoYi代码生成器快速生成管理后台CRUD代码
- **RuoYi文件管理**: 集成RuoYi文件存储服务，支持管理后台文件上传和管理
- **RuoYi通知服务**: 集成RuoYi消息通知，支持欠费提醒、操作通知等

#### 与MVP-1的RuoYi架构集成
- **用户身份系统**: 基于RuoYi权限管理的用户登录和身份验证
- **学员档案**: 管理后台显示和管理用户学员档案信息

#### 与MVP-3的RuoYi架构集成
- **支付系统**: 基于RuoYi架构的支付记录管理和退款处理
- **钱包调整**: 集成RuoYi事务管理的钱包余额调整功能

#### 与MVP-4的RuoYi架构集成
- **钱包系统**: 基于RuoYi架构的余额查询和交易记录管理

### RuoYi部署架构
```yaml
# Docker Compose - RuoYi管理后台部署
version: '3.8'
services:
  ruoyi-gym-admin:
    image: ruoyi/gymadmin:latest
    ports:
      - "8081:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - REDIS_HOST=redis
      - MYSQL_HOST=mysql
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis
      - mysql
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads

  redis:
    image: redis:6.2-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=gym_management
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
  redis_data:
```

---

## 边界情况（基于RuoYi架构优化）

- **权限冲突**: 用户同时拥有多个角色，如何处理权限？ → 基于RuoYi @PreAuthorize注解，以最高权限为准，但记录所有角色标识
- **批量操作失败**: 批量调整余额时部分失败，如何处理？ → 使用MyBatis-Plus批量操作，RuoYi事务管理确保数据一致性，提供失败报告
- **数据不一致**: 前后端数据不一致时如何处理？ → 基于RuoYi统一数据源，以后端数据为准，前端自动刷新
- **并发操作**: 多个管理员同时操作同一用户，如何处理？ → 使用MyBatis-Plus @Version乐观锁，防止数据冲突
- **历史数据**: 大量历史数据影响查询性能，如何处理？ → 基于RuoYi分页插件 + MyBatis-Plus查询优化，历史数据归档

---

## Requirements *(mandatory)*

### Functional Requirements

#### 权限管理相关
- **FR-001**: 系统必须支持基于角色的权限控制（RBAC）
- **FR-002**: 系统必须支持单一管理员角色，拥有完整管理权限
- **FR-003**: 系统必须验证用户权限，无权限用户不能访问对应功能
- **FR-004**: 系统必须记录用户登录日志和操作日志
- **FR-005**: 系统必须支持会话超时自动退出

#### 用户管理相关
- **FR-006**: 系统必须支持用户信息的查看和搜索
- **FR-007**: 系统必须支持用户冻结/解冻操作
- **FR-008**: 系统必须支持用户数据修复功能
- **FR-009**: 系统必须显示用户的学员档案和钱包信息
- **FR-010**: 系统必须支持欠费用户的标红显示和催缴功能
- **FR-011**: 用户详情页头部必须显示微信昵称+手机号+OpenID+注册时间
- **FR-012**: 用户详情页头部必须显示钱包余额，欠费时标红显示
- **FR-013**: 用户详情页必须包含"消课与对账记录"和"预约与档案"两个Tab

#### 消课对账相关
- **FR-014**: 系统必须显示消课对账统计卡片（累计充值、累计消费、剩余余额、总消课数）
- **FR-015**: 系统必须支持混合显示充值、消课、余额调整记录
- **FR-016**: 系统必须支持按时间范围筛选交易记录
- **FR-017**: 系统必须支持按学员姓名筛选交易记录
- **FR-018**: 系统必须支持按交易类型筛选（充值/消课扣费/余额调整）
- **FR-019**: 系统必须支持导出消课对账Excel文件
- **FR-020**: 消课记录表格必须包含：时间/档案姓名/课程名称/金额/交易类型/余额/备注字段
- **FR-021**: 用户详情页头部必须显示微信昵称+手机号+OpenID+注册时间+钱包余额（欠费标红）
- **FR-022**: 用户详情页头部必须提供[调整钱包]按钮
- **FR-023**: 统计卡片必须显示：累计充值¥XXXX.XX，累计消费¥XXXX.XX，剩余余额¥XXXX.XX，总消课数XX节课
- **FR-024**: 消课记录表格必须支持混合显示充值、消课、调整记录，按时间倒序排列
- **FR-025**: 系统必须支持Excel导出当前筛选条件下的所有消课对账记录

#### 预约档案管理相关
- **FR-026**: 系统必须支持学员档案卡片式展示
- **FR-027**: 档案卡片必须显示学员姓名、年龄、课程等级
- **FR-028**: 系统必须支持展开档案查看最近5条预约记录
- **FR-029**: 系统必须支持跳转查看完整预约历史
- **FR-030**: 预约记录必须显示状态信息（已完成/待上课/已取消）
- **FR-031**: 档案卡片必须支持展开显示最近5条预约记录
- **FR-032**: 展开的预约记录必须显示预约时间、课程名称、消课状态等完整信息
- **FR-033**: "已完成"的预约记录必须提供对应的消课记录链接
- **FR-034**: 系统必须支持"查看完整预约历史"按钮，跳转到新页面显示混合预约记录

#### 钱包管理相关
- **FR-035**: 系统必须支持单个用户的钱包余额调整
- **FR-036**: 系统必须要求填写调整原因（必填）
- **FR-037**: 系统必须要求填写收款方式（微信/支付宝/银行/现金）
- **FR-038**: 系统必须支持填写外部订单号（选填）
- **FR-039**: 系统必须记录所有钱包调整的操作日志
- **FR-040**: 系统必须提示"请将收款流水截图发送至飞书群"

#### 体验课跟进相关
- **FR-041**: 系统必须显示已完成体验课的用户列表
- **FR-042**: 系统必须自动标记"待跟进"的体验课（红色高亮）
- **FR-043**: 系统必须支持跟进状态管理（待跟进/已跟进）
- **FR-044**: 系统必须支持从跟进页面直接跳转到用户详情
- **FR-045**: 系统必须统计体验课转化率和续课转化率数据

#### 课程管理相关
- **FR-046**: 系统必须支持课程信息的创建、编辑、删除
- **FR-047**: 系统必须在删除有预约的课程时提示确认信息
- **FR-048**: 系统必须记录所有课程管理的操作日志
- **FR-049**: 系统必须支持课程价格的设置和修改

#### 出勤管理相关
- **FR-050**: 系统必须支持管理员标记学员出勤状态
- **FR-051**: 出勤标记必须包含状态：已到课/缺勤/请假
- **FR-052**: 出勤标记不触发任何扣费逻辑
- **FR-053**: 系统必须记录标记出勤的管理员和时间
- **FR-054**: 系统必须支持出勤率统计和分析

#### 数据分析相关
- **FR-055**: 系统必须支持关键业务指标的实时统计
- **FR-056**: 系统必须支持多种时间维度的数据分析
- **FR-057**: 系统必须支持图表化数据展示
- **FR-058**: 系统必须支持报表导出功能（Excel格式）
- **FR-059**: 系统必须支持数据每5分钟自动刷新

#### 审计日志相关
- **FR-060**: 系统必须记录所有敏感操作的详细日志
- **FR-061**: 系统必须支持操作日志的查询和筛选
- **FR-062**: 系统必须记录操作的IP地址和时间戳
- **FR-063**: 系统必须支持异常操作的告警机制
- **FR-064**: 系统必须确保审计日志的不可篡改性

#### 标签管理相关
- **FR-065**: 系统必须支持课程标签的创建、编辑、删除操作
- **FR-066**: 系统必须支持等级范围标签配置，支持跨级匹配（如L1+）
- **FR-067**: 系统必须支持年龄范围标签配置（3-4岁、4-5岁、5-6岁、6+、all）
- **FR-068**: 系统必须支持性别要求标签配置（male、female、both）
- **FR-069**: 系统必须支持课程类型标签配置（interest、professional、competition、long_term、trial、private、camp）
- **FR-070**: 系统必须支持技能类型标签配置，支持多技能JSON数组存储
- **FR-071**: 系统必须支持课程强度等级配置（light、medium、high）
- **FR-072**: 系统必须支持热门程度标签配置（hot、normal、cold）
- **FR-073**: 系统必须支持学员标签的手动设置和批量修改
- **FR-074**: 系统必须自动计算学员年龄标签，基于生日实时更新

#### 虚拟年龄管理相关

- **FR-075**: 系统必须支持学员虚拟年龄的设置、修改、删除操作
- **FR-076**: 系统必须验证虚拟年龄合理性（建议不超过实际年龄±3岁）
- **FR-077**: 系统必须记录虚拟年龄变更日志，包含变更原因和审核人员
- **FR-078**: 系统必须支持管理员提交虚拟年龄调整申请功能
- **FR-079**: 系统必须支持虚拟年龄设置审核流程（自动通过/人工审核）
- **FR-080**: 系统必须在课程匹配算法中正确应用虚拟年龄设置

#### 价格规则管理相关

- **FR-081**: 系统必须支持多维度价格规则创建（客户类型×人群类型×课程类型×等级范围）
- **FR-082**: 系统必须支持价格规则优先级设置和冲突检测
- **FR-083**: 系统必须支持价格规则测试功能，输入条件输出计算结果
- **FR-084**: 系统必须支持动态价格计算API，实时返回个性化价格
- **FR-085**: 系统必须支持亲友权益价格配置，显示专属标签
- **FR-086**: 系统必须记录价格规则变更历史，支持版本对比
- **FR-087**: 系统必须支持价格规则生效时间设置和批量调整

#### 候补管理相关

- **FR-088**: 系统必须支持候补队列状态查看和异常处理
- **FR-089**: 系统必须监控候补截止时限执行情况（6.5小时规则+30分钟缓冲）
- **FR-090**: 系统必须支持候补通知重发和人工干预功能
- **FR-091**: 系统必须记录候补流程完整日志，用于管理员分析
- **FR-092**: 系统必须支持候补成功率统计和平均等待时间分析
- **FR-093**: 系统必须支持候补队列手动调整和名额分配

#### 私教课管理相关

- **FR-094**: 系统必须支持私教课预约手动录入功能
- **FR-095**: 系统必须管理管理员联系方式（电话、微信、工作时间）
- **FR-096**: 系统必须记录私教课咨询和跟进状态
- **FR-097**: 系统必须支持私教课价格备注和确认信息记录
- **FR-098**: 系统必须记录私教课咨询行为统计
- **FR-099**: 系统必须支持私教课预约冲突检查和人工调整

#### 补课补偿管理相关

- **FR-100**: 系统必须支持补课课时补偿记录查看和管理
- **FR-101**: 系统必须监控补偿课时使用情况和有效期
- **FR-102**: 系统必须支持补偿课时异常处理和手动调整
- **FR-103**: 系统必须提供补偿课时预警提醒功能
- **FR-104**: 系统必须支持补偿课时使用统计和分析
- **FR-105**: 系统必须记录补偿课时生成、使用、过期完整生命周期

### Key Entities

- **admin_user**: 管理员用户实体，记录后台登录用户信息
  - 核心属性: id, username, password_hash, role, name, created_at, last_login_at
  - 业务规则: 支持四种角色（管理员、管理员、管理员、财务），密码使用bcrypt加密

- **admin_operation_log**: 操作日志实体，记录所有后台操作
  - 核心属性: id, admin_user_id, action, target_type, target_id, details, ip_address, created_at
  - 业务规则: 记录所有敏感操作，支持审计追踪和异常排查

- **trial_class_follow_up**: 体验课跟进实体，记录体验课用户跟进情况
  - 核心属性: id, user_id, course_id, follow_up_status, contact_time, contact_result, notes
  - 业务规则: 支持体验课转化率统计和续课跟进管理

- **wallet_adjustment**: 钱包调整记录实体，记录管理员调整操作
  - 核心属性: id, user_id, amount, reason, payment_method, external_order_no, note, admin_id, created_at
  - 业务规则: 记录完整的调整信息，包含所有必填字段

- **user_reconciliation_record**: 用户消课对账记录实体，记录用户的充值和消课交易
  - 核心属性: id, user_id, student_id, booking_id, amount, transaction_type, balance_after, note, created_at
  - 业务规则: 混合记录充值、消课、调整交易，支持多维度筛选，按时间倒序排列

- **attendance_records**: 出勤记录实体，记录学员出勤状态
  - 核心属性: id, booking_id, student_id, status, marked_by, marked_at
  - 业务规则: 只记录出勤状态，不涉及任何扣费操作

- **virtual_age_log**: 虚拟年龄变更记录实体，追踪虚拟年龄设置的历史变更
  - 核心属性: id, profile_id, old_virtual_age, new_virtual_age, change_reason, admin_id, created_at
  - 业务规则: 记录每次虚拟年龄设置变更，支持管理员分析和历史追溯

- **pricing_rule**: 价格规则实体，存储多维度定价规则
  - 核心属性: id, rule_name, customer_type, audience, course_type, level_range, hourly_price, discount_rate
  - 业务规则: 支持4维度定价，可设置生效时间和优先级

- **waitlist_management**: 候补管理实体，记录候补队列管理员处理信息
  - 核心属性: id, course_id, waitlist_count, notification_round, last_notification_time, admin_notes
  - 业务规则: 支持管理员查看和干预候补队列状态

- **private_class_inquiry**: 私教课咨询记录实体，记录用户私教课咨询行为
  - 核心属性: id, user_id, coach_id, inquiry_time, inquiry_content, follow_up_status, admin_id
  - 业务规则: 记录私教课咨询全流程，支持转化分析

- **makeup_compensation**: 补课补偿管理实体，记录补课课时补偿发放和使用
  - 核心属性: id, user_id, profile_id, original_booking_id, compensation_minutes, status, expiry_time
  - 业务规则: 自动生成补偿记录，支持预警提醒和使用统计

---

## API Design *(mandatory)*

### Core Endpoints

#### Authentication
- `POST /api/v1/admin/login` - 管理员登录
- `POST /api/v1/admin/logout` - 管理员登出
- `GET /api/v1/admin/profile` - 获取当前管理员信息

#### User Management
- `GET /api/v1/admin/users` - 获取用户列表
- `GET /api/v1/admin/users/{id}` - 获取用户详情
- `PUT /api/v1/admin/users/{id}/freeze` - 冻结/解冻用户
- `GET /api/v1/admin/users/search` - 搜索用户

#### Wallet Management
- `POST /api/v1/admin/wallets/adjust` - 调整钱包余额
- `GET /api/v1/admin/wallets/{user_id}/transactions` - 获取用户交易记录
- `GET /api/v1/admin/wallets/statistics` - 获取钱包统计数据
- `GET /api/v1/admin/users/{user_id}/reconciliation` - 获取用户消课对账记录
- `POST /api/v1/admin/users/{user_id}/reconciliation/export` - 导出用户对账Excel
- `GET /api/v1/admin/users/{user_id}/bookings` - 获取用户预约档案记录

#### Follow-up Management
- `GET /api/v1/admin/followups/trial-classes` - 获取体验课跟进列表
- `PUT /api/v1/admin/followups/{id}/status` - 更新跟进状态
- `GET /api/v1/admin/followups/statistics` - 获取跟进统计数据

#### Course Management
- `GET /api/v1/admin/courses` - 获取课程列表
- `POST /api/v1/admin/courses` - 创建课程
- `PUT /api/v1/admin/courses/{id}` - 更新课程
- `DELETE /api/v1/admin/courses/{id}` - 删除课程

#### Attendance Management
- `GET /api/v1/admin/courses/{course_id}/attendance` - 获取课程出勤列表
- `PUT /api/v1/admin/attendance/{id}/mark` - 标记出勤状态
- `GET /api/v1/admin/attendance/statistics` - 获取出勤统计数据

#### Data Analytics
- `GET /api/v1/admin/analytics/dashboard` - 获取数据看板
- `GET /api/v1/admin/analytics/revenue` - 获取收入统计
- `GET /api/v1/admin/analytics/users` - 获取用户统计
- `POST /api/v1/admin/analytics/export` - 导出报表

#### Audit Logs
- `GET /api/v1/admin/logs/operations` - 获取操作日志
- `GET /api/v1/admin/logs/login` - 获取登录日志

---

## Database Schema *(mandatory)*

### Tables

#### `admin_user` - 管理员用户表
```sql
CREATE TABLE admin_user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  role ENUM('admin', 'operator', 'coach', 'finance') NOT NULL DEFAULT 'operator',
  name VARCHAR(100) NOT NULL COMMENT '姓名',
  email VARCHAR(100) COMMENT '邮箱',
  phone VARCHAR(20) COMMENT '手机号',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at DATETIME COMMENT '最后登录时间'
) COMMENT='管理员用户表';
```

#### `admin_operation_log` - 操作日志表
```sql
CREATE TABLE admin_operation_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  target_type VARCHAR(50) NOT NULL COMMENT '目标类型',
  target_id INT NOT NULL COMMENT '目标ID',
  details JSON COMMENT '操作详情',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_admin_user_id (admin_user_id),
  INDEX idx_target (target_type, target_id),
  INDEX idx_created_at (created_at)
) COMMENT='管理员操作日志表';
```

#### `trial_class_follow_up` - 体验课跟进表
```sql
CREATE TABLE trial_class_follow_up (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  follow_up_status ENUM('pending', 'contacted', 'not_interested', 'converted') DEFAULT 'pending',
  contact_time DATETIME COMMENT '联系时间',
  contact_result ENUM('interested', 'considering', 'not_interested') COMMENT '跟进结果',
  next_follow_up_time DATETIME COMMENT '下次跟进时间',
  notes TEXT COMMENT '跟进备注',
  admin_user_id INT NOT NULL COMMENT '跟进人',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_status (follow_up_status),
  INDEX idx_admin_user_id (admin_user_id)
) COMMENT='体验课跟进表';
```

#### `wallet_adjustment` - 钱包调整记录表
```sql
CREATE TABLE wallet_adjustment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL COMMENT '调整金额（正数=充值，负数=扣款）',
  reason ENUM('offline_recharge', 'offline_refund', 'correction', 'other') NOT NULL COMMENT '调整原因',
  payment_method ENUM('wechat', 'alipay', 'bank_transfer', 'cash') NOT NULL COMMENT '收款方式',
  external_order_no VARCHAR(100) COMMENT '外部订单号',
  note TEXT COMMENT '备注',
  admin_user_id INT NOT NULL COMMENT '操作人',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_admin_user_id (admin_user_id),
  INDEX idx_created_at (created_at)
) COMMENT='钱包调整记录表';
```

#### `attendance_records` - 出勤记录表
```sql
CREATE TABLE attendance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('attended', 'absent', 'leave') NOT NULL COMMENT '出勤状态',
  marked_by INT NOT NULL COMMENT '标记人（管理员ID）',
  marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  note TEXT COMMENT '备注',

  UNIQUE KEY uk_booking_student (booking_id, student_id),
  INDEX idx_student_id (student_id),
  INDEX idx_marked_by (marked_by),
  INDEX idx_marked_at (marked_at)
) COMMENT='学员出勤记录表';
```

#### `user_reconciliation_record` - 用户消课对账记录表
```sql
CREATE TABLE user_reconciliation_record (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  student_id INT COMMENT '学员ID（可为空，如充值记录）',
  booking_id INT COMMENT '预约ID（可为空，如调整记录）',
  amount DECIMAL(10,2) NOT NULL COMMENT '交易金额（正数表示充值，负数表示扣费）',
  transaction_type ENUM('recharge', 'consume', 'adjustment') NOT NULL COMMENT '交易类型',
  balance_after DECIMAL(10,2) NOT NULL COMMENT '交易后余额',
  note TEXT COMMENT '交易备注或说明',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_student_id (student_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
) COMMENT='用户消课对账记录表';
```

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 管理员登录成功率 >99.5%
- **SC-002**: 权限控制准确率 100%（无越权访问）
- **SC-003**: 钱包调整操作成功率 >99%（排除余额不足情况）
- **SC-004**: 数据统计准确率 100%
- **SC-005**: 操作日志完整性 100%
- **SC-006**: 页面响应时间 <2秒
- **SC-007**: 批量操作成功率 >95%
- **SC-008**: 体验课跟进转化率统计准确率 100%
- **SC-009**: 出勤标记成功率 100%

---

## Assumptions

- 假设管理员有基本的电脑操作能力
- 假设网络环境稳定，支持Web后台正常访问
- 假设已建立完善的用户数据隐私保护机制
- 假设管理员接受过系统使用培训
- 假设已有明确的业务流程和操作规范
- 假设简化付费记录逻辑已被所有相关人员理解并接受

---

## Out of Scope (MVP-5 不实现)

- ❌ 高级数据挖掘和预测分析
- ❌ 自动化营销功能
- ❌ 第三方系统集成（除已有外）
- ❌ 移动端管理后台
- ❌ 实时聊天客服功能
- ❌ 财务自动对账功能
- ❌ 复杂的消课扣费和对账功能（已简化为出勤标记）

---

## Open Questions

1. **[NEEDS CLARIFICATION]** 管理员是否需要双因子认证（2FA）？
   - 建议: 暂不需要，密码强度要求即可，后续可考虑增加

2. **[NEEDS CLARIFICATION]** 操作日志需要保留多长时间？
   - 建议: 至少保留2年，支持法规要求和审计需要

3. **[NEEDS CLARIFICATION]** 是否需要支持数据备份和恢复功能？
   - 建议: 基础的数据备份即可，详细恢复功能留到后续版本

4. **[NEEDS CLARIFICATION]** 体验课跟进的时间周期如何设定？
   - 建议: 完成体验课后3天内必须跟进，超过7天未跟进自动标为超时

5. **[NEEDS CLARIFICATION]** 出勤标记的截止时间如何设定？
   - 建议: 课程结束后24小时内可标记，超过时间自动标记为缺勤

---

**创建人**: [产品经理]
**最后更新**: 2025-10-31
**版本**: v1.1.0
**状态**: Draft
**更新内容**: 整合最终需求 - 标签管理、虚拟年龄、价格规则、候补管理、私教课线下预约、补课补偿等管理员后台功能
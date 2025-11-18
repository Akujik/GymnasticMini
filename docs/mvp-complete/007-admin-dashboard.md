# MVP-007: 管理后台系统 - 完整文档汇总

**功能分支**: `007-admin-dashboard`
**创建时间**: 2025-11-08
**最后更新**: 2025-11-17
**版本**: v2.0.0 RuoYi架构重构
**状态**: RuoYi架构迁移完成

---

## 📋 项目概览

### 功能范围和核心目标
管理后台系统是百适体操馆的全面运营管理平台，提供基于角色的权限控制、用户管理、钱包调整、课程管理、数据分析、体验课跟进、标签管理、价格规则配置、候补管理、私教课管理和补课补偿等核心功能。系统通过安全的多角色架构确保不同岗位人员获得相应权限，提供完整的审计日志保障系统安全；通过智能化的标签匹配和价格规则系统实现个性化服务；通过全面的数据分析和报表功能支持运营决策；通过完善的用户管理流程提升运营效率。

### 与其他MVP的依赖关系
- **前置依赖**: MVP-001 (001-user-identity-system), MVP-005 (005-payment-integration), MVP-006 (006-wallet-system)
- **业务集成**: 与所有前序MVP深度集成，提供统一的后台管理界面
- **核心支撑**: 为运营人员提供全面的业务管理工具，是提升运营效率和数据驱动决策的基础设施

### 关键技术决策
- 采用React + TypeScript + Ant Design Pro构建现代化管理界面
- 实施基于角色的访问控制(RBAC)，支持四种角色：管理员、运营、教练、财务
- 使用JWT + bcrypt实现安全认证，支持会话管理和自动超时
- 建立全面的操作审计系统，记录所有敏感操作和数据变更
- 采用分层架构设计，前端与后端API完全分离
- 使用FastAPI构建高性能后端API，支持自动文档生成
- 实现智能的标签匹配算法，支持多维度的课程推荐
- 设计灵活的价格规则引擎，支持个性化定价和权益管理
- 建立完善的数据缓存策略，确保系统响应性能

---

## 📚 功能规格 (spec.md)

### 用户故事详细描述

#### User Story 1 - 管理员登录与权限管理 (Priority: P0)
管理员通过账号密码登录Web后台，根据不同角色获得相应的功能权限，确保系统安全。

**关键验收场景**:
- Given 管理员使用正确的用户名和密码登录，When 点击登录，Then 成功进入管理后台首页
- Given 运营人员登录，When 进入系统，Then 只能看到用户管理、钱包调整、课程管理等功能
- Given 教练角色登录，When 进入系统，Then 只能看到自己负责的课程和学员信息，可以标记出勤状态
- Given 财务角色登录，When 进入系统，Then 只能查看钱包和交易记录，无法进行修改
- Given 用户使用错误密码登录，When 点击登录，Then 显示"用户名或密码错误"提示

#### User Story 2 - 用户管理与查询 (Priority: P0)
运营人员可以查看所有用户的基本信息、学员档案，支持用户搜索、冻结、解冻等管理操作。用户详情页面提供消课对账记录和预约历史等核心功能。

**关键验收场景**:
- Given 运营进入用户管理页面，When 页面加载完成，Then 显示所有用户列表（包含用户名、手机号、注册时间等）
- Given 运营搜索用户"张三"，When 点击搜索，Then 显示符合条件的用户信息
- Given 运营点击某用户详情，When 进入用户详情页头部，Then 显示微信昵称+手机号+OpenID+注册时间，钱包余额¥1000.00（欠费标红），[调整钱包]按钮
- Given 运营查看用户详情页Tab1"消课与对账记录"，When 页面加载完成，Then 显示统计卡片：累计充值¥5000.00，累计消费¥4800.00，剩余余额¥200.00，总消课数24节课
- Given 运营查看消课记录表格，When 查看数据，Then 显示所有记录：时间/档案姓名/课程名称/消课金额/交易类型/余额/备注，支持按时间范围/档案/交易类型筛选
- Given 运营查看用户详情页Tab2"预约与档案"，When 页面加载完成，Then 显示档案卡片列表，每个档案可展开显示最近5条预约记录

#### User Story 3 - 钱包余额调整 (Priority: P0)
运营人员可以为指定用户调整钱包余额（充值或扣减），必须填写完整的调整信息，系统记录详细操作日志。

**关键验收场景**:
- Given 运营选择用户并填写调整金额+100元，When 填写调整原因"线下充值"、收款方式"微信"、订单号"wx123"，Then 用户余额增加100元
- Given 运营填写调整金额-50元，When 填写调整原因"线下退款"、收款方式"银行转账"、订单号"bank456"，Then 用户余额减少50元
- Given 调整成功，When 系统提示，Then 显示"请将收款流水截图发送至飞书群"
- Given 调整成功，When 查看操作日志，Then 记录操作人、时间、金额、原因、收款方式、订单号等完整信息
- Given 用户查看交易记录，When 进入钱包页面，Then 显示该笔调整记录和详细信息

**调整表单字段**:
| 字段名 | 类型 | 是否必填 | 说明 |
|--------|------|---------|------|
| 调整金额 | 数字 | ✅ 必填 | 正数=充值,负数=扣款 |
| 调整原因 | 下拉选择 | ✅ 必填 | 线下充值/线下退款/误操作更正/其他 |
| 收款方式 | 下拉选择 | ✅ 必填 | 微信/支付宝/银行转账/现金 |
| 订单号 | 文本 | 选填 | 支付宝流水号/银行转账单号等 |
| 备注 | 文本 | 选填 | 自由填写 |

#### User Story 4 - 钱包冻结管理 (Priority: P0)

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

#### User Story 5 - 体验课续课跟进 (Priority: P0)
运营人员可以查看已完成体验课的用户，跟进续课意向，管理从体验课到正式课的转化流程。

**关键验收场景**:
- Given 用户完成体验课，When 运营查看跟进列表，Then 该用户显示在"待跟进"列表中（红色高亮）
- Given 运营联系用户了解续课意向，When 选择"已跟进"，Then 记录联系时间和跟进结果（有意向/考虑中/无意向）
- Given 用户有意向转为正式课，When 运营点击"续课办理"，Then 跳转到用户详情页可调整钱包余额
- Given 运营查看转化率报表，When 选择时间范围，Then 显示体验课付费转化率和续课转化率数据
- Given 运营标记某用户为"已完成跟进"，When 更新状态，Then 该用户从"待跟进"列表中移除

#### User Story 6 - 课程管理 (Priority: P0)
运营人员可以创建、修改、删除课程，管理课程信息和价格设置，支持教练标记出勤状态。

**关键验收场景**:
- Given 运营创建新课程，When 填写课程信息，Then 系统创建新课程记录
- Given 运营修改课程信息，When 保存修改，Then 课程信息更新成功
- Given 运营删除有预约的课程，When 确认删除，Then 系统提示"该课程有X人预约，确认删除将自动处理退款/恢复余额"
- Given 课程被删除，When 查看操作日志，Then 记录删除操作和相关信息
- Given 教练登录查看自己负责的课程，When 进入课程列表，Then 只显示自己负责的课程

#### User Story 7 - 出勤状态管理 (Priority: P0)
教练可以标记学员的出勤状态，系统记录出勤信息用于统计分析，不涉及任何扣费操作。

**关键验收场景**:
- Given 教练登录并进入课程页面，When 选择今日课程，Then 显示所有预约学员列表
- Given 教练标记某学员为"已到课"，When 确认标记，Then 系统记录出勤状态和时间
- Given 教练标记某学员为"缺勤"，When 确认标记，Then 系统记录缺勤状态，不涉及任何扣费
- Given 学员请假，When 教练标记为"请假"，Then 系统记录请假状态
- Given 运营查看出勤统计，When 选择时间范围，Then 显示出勤率和缺勤统计报表

**注意**：出勤标记仅用于统计和分析，不触发任何扣费逻辑。正式课费用在预约时已扣除，取消预约时通过微信原路退款。

#### User Story 8 - 课程标签管理 (Priority: P0)
运营人员可以管理课程的标签信息，包括等级范围、年龄段、技能类型等，确保课程匹配算法的准确性。

**关键验收场景**:
- Given 运营创建新课程，When 设置课程标签，Then 可以设置等级范围["L1+", "L2"]、年龄段"4-6岁"、技能类型["平衡", "柔韧"]等
- Given 运营修改课程标签，When 更新等级范围，Then 系统重新计算该课程与学员的匹配度
- Given 运营查看标签匹配日志，When 选择某课程，Then 显示该课程的历史匹配记录和匹配分数分布
- Given 系统检测到标签异常，When 运营查看报告，Then 显示"标签不一致"警告，如课程等级与年龄段不匹配
- Given 运营批量更新课程标签，When 选择多个课程，Then 支持批量设置相同的标签模板

#### User Story 9 - 学员标签与虚拟年龄管理 (Priority: P0)
运营人员可以查看和调整学员的标签信息，包括发展标签、权益标签，以及虚拟年龄设置，确保课程匹配的准确性。

**关键验收场景**:
- Given 运营查看学员详情，When 查看标签信息，Then 显示年龄标签、等级、性别、发展标签、权益标签等完整信息
- Given 运营调整学员发展标签，When 从"兴趣"改为"专业"，Then 系统重新计算该学员的课程推荐
- Given 家长申请虚拟年龄设置，When 运营审核，Then 可以批准或拒绝设置，并记录审核原因
- Given 虚拟年龄差异过大(5岁vs 12岁)，When 运营处理，Then 系统提示需要教练评估确认
- Given 教练提交虚拟年龄调整申请，When 运营审核，Then 可以根据教练建议调整学员虚拟年龄

#### User Story 10 - 价格规则管理 (Priority: P0)
运营人员可以设置多维度的价格规则，包括客户类型、人群类型、课程类型、等级范围等，实现个性化定价。

**关键验收场景**:
- Given 运营创建价格规则，When 设置规则名称"儿童团课L1-L4老用户价"，Then 配置客户类型"老用户"、人群"儿童"、课程"团课"、等级"L1-L4"、折扣率1.0
- Given 运营设置亲友权益价格，When 配置规则，Then 设置折扣率0.6，课程显示"🎉亲友专享6折"标签
- Given 运营查看价格规则冲突，When 检测冲突，Then 系统提示"规则优先级设置建议"，避免价格计算混乱
- Given 运营测试价格规则，When 输入测试条件，Then 显示计算结果"原价180元，折扣价108元，规则：亲友价"
- Given 价格规则生效，When 用户查看课程，Then 显示基于该用户档案计算的个性化价格

#### User Story 11 - 候补队列管理 (Priority: P1)
运营人员可以查看课程候补队列状态，处理候补异常情况，监控候补截止时限执行情况。

**关键验收场景**:
- Given 课程有候补队列，When 运营查看，Then 显示候补人数列表、候补轮次、截止时间等信息
- Given 候补用户过期未确认，When 运营查看，Then 显示过期原因和处理状态
- Given 候补通知发送失败，When 运营处理，Then 可以手动重新发送通知或联系用户
- Given 候补系统异常，When 运营干预，Then 支持手动调整候补顺序和分配名额
- Given 运营查看候补统计，When 选择时间范围，Then 显示候补成功率、平均等待时间等指标

#### User Story 12 - 私教课线下预约录入 (Priority: P1)
运营人员可以线下录入私教课预约记录，管理教练联系方式，处理私教课相关咨询。

**关键验收场景**:
- Given 家长线下预约私教课，When 运营录入，Then 填写学员档案、教练、时间、价格等信息创建预约记录
- Given 私教课价格线下协商，When 运营录入，Then 可以填写实际协商价格并备注价格确认信息
- Given 教练联系方式变更，When 运营更新，Then 修改教练的电话、微信等联系信息
- Given 用户咨询私教课，When 运营查看，Then 显示咨询记录和跟进状态
- Given 私教课需要调整，When 运营处理，Then 支持修改时间、更换教练等操作，并通知用户

#### User Story 13 - 补课课时补偿管理 (Priority: P1)
运营人员可以查看和管理补课课时补偿记录，处理补偿课时使用异常情况。

**关键验收场景**:
- Given 学员有补课补偿记录，When 运营查看，Then 显示补偿时长、来源、状态等信息
- Given 补偿课时即将过期，When 运营查看，Then 系统显示预警提醒，可联系用户使用
- Given 补偿使用异常，When 运营处理，Then 可以手动调整补偿记录或添加备注
- Given 用户累积大量补偿课时，When 运营查看，Then 系统提醒主动联系用户安排补课
- Given 运营查看补偿统计，When 选择时间范围，Then 显示补偿发放量、使用率等指标

#### User Story 14 - 数据统计与分析 (Priority: P1)
运营人员可以查看各种业务数据统计，包括用户数、预约数、收入趋势等关键指标。

**关键验收场景**:
- Given 运营进入数据看板，When 页面加载完成，Then 显示今日/本周/本月的关键业务指标
- Given 运营查看用户增长趋势，When 选择月度视图，Then 显示过去12个月的用户增长曲线图
- Given 运营查看收入统计，When 选择按课程维度，Then 显示各课程的收入贡献占比
- Given 运营查看欠费用户统计，When 点击欠费用户数，Then 跳转到欠费用户列表
- Given 运营查看出勤率统计，When 选择教练和课程，Then 显示该教练的出勤率数据

**核心指标**:
- 总用户数 / 今日新增用户
- 本月预约数 / 本月收入
- 欠费用户数 / 体验课转化率
- 钱包总余额 / 本月充值金额
- 整体出勤率 / 教练出勤率对比

### 功能需求详细规格

#### 权限管理相关 (FR-001 到 FR-005)
- **FR-001**: 系统必须支持基于角色的权限控制（RBAC）
- **FR-002**: 系统必须支持管理员、运营、教练、财务四种角色
- **FR-003**: 系统必须验证用户权限，无权限用户不能访问对应功能
- **FR-004**: 系统必须记录用户登录日志和操作日志
- **FR-005**: 系统必须支持会话超时自动退出

#### 用户管理相关 (FR-006 到 FR-013)
- **FR-006**: 系统必须支持用户信息的查看和搜索
- **FR-007**: 系统必须支持用户账户冻结/解冻操作，包含冻结时长选择（1-3个月）和冻结原因输入
- **FR-008**: 系统必须支持钱包冻结管理，记录冻结开始时间、结束时间、操作人和操作原因
- **FR-009**: 系统必须在用户冻结期间禁用所有预约、候补、补课操作
- **FR-010**: 系统必须支持冻结用户的查询和筛选功能，显示冻结状态和剩余冻结天数
- **FR-011**: 系统必须支持用户数据修复功能
- **FR-012**: 系统必须显示用户的学员档案和钱包信息
- **FR-013**: 系统必须支持欠费用户的标红显示和催缴功能
- **FR-014**: 用户详情页头部必须显示微信昵称+手机号+OpenID+注册时间
- **FR-015**: 用户详情页头部必须显示钱包余额，欠费时标红显示
- **FR-016**: 用户详情页必须包含"消课与对账记录"和"预约与档案"两个Tab

#### 消课对账相关 (FR-017 到 FR-028)
- **FR-017**: 系统必须显示消课对账统计卡片（累计充值、累计消费、剩余余额、总消课数）
- **FR-018**: 系统必须支持混合显示充值、消课、余额调整记录
- **FR-019**: 系统必须支持按时间范围筛选交易记录
- **FR-020**: 系统必须支持按学员姓名筛选交易记录
- **FR-021**: 系统必须支持按交易类型筛选（充值/消课扣费/余额调整）
- **FR-022**: 系统必须支持导出消课对账Excel文件
- **FR-023**: 消课记录表格必须包含：时间/档案姓名/课程名称/金额/交易类型/余额/备注字段
- **FR-024**: 用户详情页头部必须显示微信昵称+手机号+OpenID+注册时间+钱包余额（欠费标红）
- **FR-025**: 用户详情页头部必须提供[调整钱包]按钮
- **FR-026**: 统计卡片必须显示：累计充值¥XXXX.XX，累计消费¥XXXX.XX，剩余余额¥XXXX.XX，总消课数XX节课
- **FR-027**: 消课记录表格必须支持混合显示充值、消课、调整记录，按时间倒序排列
- **FR-028**: 系统必须支持Excel导出当前筛选条件下的所有消课对账记录

#### 预约档案管理相关 (FR-026 到 FR-034)
- **FR-026**: 系统必须支持学员档案卡片式展示
- **FR-027**: 档案卡片必须显示学员姓名、年龄、课程等级
- **FR-028**: 系统必须支持展开档案查看最近5条预约记录
- **FR-029**: 系统必须支持跳转查看完整预约历史
- **FR-030**: 预约记录必须显示状态信息（已完成/待上课/已取消）
- **FR-031**: 档案卡片必须支持展开显示最近5条预约记录
- **FR-032**: 展开的预约记录必须显示预约时间、课程名称、消课状态等完整信息
- **FR-033**: "已完成"的预约记录必须提供对应的消课记录链接
- **FR-034**: 系统必须支持"查看完整预约历史"按钮，跳转到新页面显示混合预约记录

#### 钱包管理相关 (FR-035 到 FR-040)
- **FR-035**: 系统必须支持单个用户的钱包余额调整
- **FR-036**: 系统必须要求填写调整原因（必填）
- **FR-037**: 系统必须要求填写收款方式（微信/支付宝/银行/现金）
- **FR-038**: 系统必须支持填写外部订单号（选填）
- **FR-039**: 系统必须记录所有钱包调整的操作日志
- **FR-040**: 系统必须提示"请将收款流水截图发送至飞书群"

#### 体验课跟进相关 (FR-041 到 FR-045)
- **FR-041**: 系统必须显示已完成体验课的用户列表
- **FR-042**: 系统必须自动标记"待跟进"的体验课（红色高亮）
- **FR-043**: 系统必须支持跟进状态管理（待跟进/已跟进）
- **FR-044**: 系统必须支持从跟进页面直接跳转到用户详情
- **FR-045**: 系统必须统计体验课转化率和续课转化率数据

#### 课程管理相关 (FR-046 到 FR-049)
- **FR-046**: 系统必须支持课程信息的创建、编辑、删除
- **FR-047**: 系统必须在删除有预约的课程时提示确认信息
- **FR-048**: 系统必须记录所有课程管理的操作日志
- **FR-049**: 系统必须支持课程价格的设置和修改

#### 出勤管理相关 (FR-050 到 FR-054)
- **FR-050**: 系统必须支持教练标记学员出勤状态
- **FR-051**: 出勤标记必须包含状态：已到课/缺勤/请假
- **FR-052**: 出勤标记不触发任何扣费逻辑
- **FR-053**: 系统必须记录标记出勤的教练和时间
- **FR-054**: 系统必须支持出勤率统计和分析

#### 数据分析相关 (FR-055 到 FR-059)
- **FR-055**: 系统必须支持关键业务指标的实时统计
- **FR-056**: 系统必须支持多种时间维度的数据分析
- **FR-057**: 系统必须支持图表化数据展示
- **FR-058**: 系统必须支持报表导出功能（Excel格式）
- **FR-059**: 系统必须支持数据每5分钟自动刷新

#### 审计日志相关 (FR-060 到 FR-064)
- **FR-060**: 系统必须记录所有敏感操作的详细日志
- **FR-061**: 系统必须支持操作日志的查询和筛选
- **FR-062**: 系统必须记录操作的IP地址和时间戳
- **FR-063**: 系统必须支持异常操作的告警机制
- **FR-064**: 系统必须确保审计日志的不可篡改性

#### 标签管理相关 (FR-065 到 FR-074)
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

#### 虚拟年龄管理相关 (FR-075 到 FR-080)
- **FR-075**: 系统必须支持学员虚拟年龄的设置、修改、删除操作
- **FR-076**: 系统必须验证虚拟年龄合理性（建议不超过实际年龄±3岁）
- **FR-077**: 系统必须记录虚拟年龄变更日志，包含变更原因和审核人员
- **FR-078**: 系统必须支持教练提交虚拟年龄调整申请功能
- **FR-079**: 系统必须支持虚拟年龄设置审核流程（自动通过/人工审核）
- **FR-080**: 系统必须在课程匹配算法中正确应用虚拟年龄设置

#### 价格规则管理相关 (FR-081 到 FR-087)
- **FR-081**: 系统必须支持多维度价格规则创建（客户类型×人群类型×课程类型×等级范围）
- **FR-082**: 系统必须支持价格规则优先级设置和冲突检测
- **FR-083**: 系统必须支持价格规则测试功能，输入条件输出计算结果
- **FR-084**: 系统必须支持动态价格计算API，实时返回个性化价格
- **FR-085**: 系统必须支持亲友权益价格配置，显示专属标签
- **FR-086**: 系统必须记录价格规则变更历史，支持版本对比
- **FR-087**: 系统必须支持价格规则生效时间设置和批量调整

#### 候补管理相关 (FR-088 到 FR-093)
- **FR-088**: 系统必须支持候补队列状态查看和异常处理
- **FR-089**: 系统必须监控候补截止时限执行情况（6.5小时规则+30分钟缓冲）
- **FR-090**: 系统必须支持候补通知重发和人工干预功能
- **FR-091**: 系统必须记录候补流程完整日志，用于运营分析
- **FR-092**: 系统必须支持候补成功率统计和平均等待时间分析
- **FR-093**: 系统必须支持候补队列手动调整和名额分配

#### 私教课管理相关 (FR-094 到 FR-099)
- **FR-094**: 系统必须支持私教课预约手动录入功能
- **FR-095**: 系统必须管理教练联系方式（电话、微信、工作时间）
- **FR-096**: 系统必须记录私教课咨询和跟进状态
- **FR-097**: 系统必须支持私教课价格备注和确认信息记录
- **FR-098**: 系统必须记录私教课咨询行为统计
- **FR-099**: 系统必须支持私教课预约冲突检查和人工调整

#### 补课补偿管理相关 (FR-100 到 FR-105)
- **FR-100**: 系统必须支持补课课时补偿记录查看和管理
- **FR-101**: 系统必须监控补偿课时使用情况和有效期
- **FR-102**: 系统必须支持补偿课时异常处理和手动调整
- **FR-103**: 系统必须提供补偿课时预警提醒功能
- **FR-104**: 系统必须支持补偿课时使用统计和分析
- **FR-105**: 系统必须记录补偿课时生成、使用、过期完整生命周期

### 核心实体设计

#### admin_user - 管理员用户实体
管理员用户实体，记录后台登录用户信息
- 核心属性: id, username, password_hash, role, name, created_at, last_login_at
- 业务规则: 支持四种角色（管理员、运营、教练、财务），密码使用bcrypt加密

#### admin_operation_log - 操作日志实体
操作日志实体，记录所有后台操作
- 核心属性: id, admin_user_id, action, target_type, target_id, details, ip_address, created_at
- 业务规则: 记录所有敏感操作，支持审计追踪和异常排查

#### trial_class_follow_up - 体验课跟进实体
体验课跟进实体，记录体验课用户跟进情况
- 核心属性: id, user_id, course_id, follow_up_status, contact_time, contact_result, notes
- 业务规则: 支持体验课转化率统计和续课跟进管理

#### user_reconciliation_record - 用户消课对账记录实体
用户消课对账记录实体，记录用户的充值和消课交易
- 核心属性: id, user_id, student_id, booking_id, amount, transaction_type, balance_after, note, created_at
- 业务规则: 混合记录充值、消课、调整交易，支持多维度筛选，按时间倒序排列

#### attendance_records - 出勤记录实体
出勤记录实体，记录学员出勤状态
- 核心属性: id, booking_id, student_id, status, marked_by, marked_at
- 业务规则: 只记录出勤状态，不涉及任何扣费操作

#### virtual_age_log - 虚拟年龄变更记录实体
虚拟年龄变更记录实体，追踪虚拟年龄设置的历史变更
- 核心属性: id, profile_id, old_virtual_age, new_virtual_age, change_reason, admin_id, created_at
- 业务规则: 记录每次虚拟年龄设置变更，支持运营分析和历史追溯

#### pricing_rule - 价格规则实体
价格规则实体，存储多维度定价规则
- 核心属性: id, rule_name, customer_type, audience, course_type, level_range, hourly_price, discount_rate
- 业务规则: 支持4维度定价，可设置生效时间和优先级

#### waitlist_management - 候补管理实体
候补管理实体，记录候补队列运营处理信息
- 核心属性: id, course_id, waitlist_count, notification_round, last_notification_time, admin_notes
- 业务规则: 支持运营人员查看和干预候补队列状态

#### private_class_inquiry - 私教课咨询记录实体
私教课咨询记录实体，记录用户私教课咨询行为
- 核心属性: id, user_id, coach_id, inquiry_time, inquiry_content, follow_up_status, admin_id
- 业务规则: 记录私教课咨询全流程，支持转化分析

#### makeup_compensation - 补课补偿管理实体
补课补偿管理实体，记录补课课时补偿发放和使用
- 核心属性: id, user_id, profile_id, original_booking_id, compensation_minutes, status, expiry_time
- 业务规则: 自动生成补偿记录，支持预警提醒和使用统计

### 关键边界情况处理
- **权限冲突**: 用户同时拥有多个角色，如何处理？ → 以最高权限为准，但记录所有角色标识
- **批量操作失败**: 批量调整余额时部分失败，如何处理？ → 记录失败原因，成功的操作继续生效，提供失败报告
- **数据不一致**: 前后端数据不一致时如何处理？ → 以后端数据为准，前端自动刷新
- **并发操作**: 多个运营同时操作同一用户，如何处理？ → 使用乐观锁，防止数据冲突
- **历史数据**: 大量历史数据影响查询性能，如何处理？ → 实现数据分页和历史数据归档
- **异常恢复**: 误操作后如何快速恢复？ → 提供反向操作功能，支持数据备份恢复
- **标签冲突**: 课程标签与学员标签不匹配时如何处理？ → 记录匹配失败日志，提供人工审核接口
- **批量标签修改**: 批量修改学员标签时部分失败，如何处理？ → 记录失败原因，成功操作继续生效，提供详细报告
- **标签数据同步**: 标签修改后小程序端数据不同步，如何处理？ → 实时推送标签变更通知，前端自动刷新
- **跨级匹配复杂度**: L1+等跨级标签增加匹配算法复杂度，如何优化？ → 预计算匹配关系，使用缓存提升性能
- **标签版本管理**: 匹配算法版本更新时历史标签数据不兼容，如何处理？ → 支持多版本并存，渐进式迁移
- **标签数据量增长**: 标签匹配日志快速增长影响性能，如何处理？ → 实现日志分级存储，定期归档历史数据
- **价格规则冲突**: 多个价格规则同时匹配时如何处理？ → 按优先级排序，最具体的规则优先，记录冲突日志
- **价格规则版本**: 历史价格规则版本管理如何处理？ → 支持价格规则版本控制，可回滚到历史版本
- **价格计算错误**: 价格计算出现异常如何处理？ → 提供价格计算验证功能，异常时使用默认价格并记录日志
- **批量价格导入**: 大量价格规则导入时性能如何优化？ → 分批处理，提供进度反馈，支持中断恢复
- **价格缓存同步**: 价格规则更新后缓存如何及时同步？ → 实现缓存失效机制，确保价格计算准确性
- **客户类型错误**: 错误的客户类型设置如何处理？ → 提供客户类型验证功能，支持批量修正和审核流程
- **价格权限控制**: 不同角色对价格管理的权限如何控制？ → 价格规则修改需要高级权限，支持审批流程

### 成功标准
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

## 🏗️ 技术实现计划 (plan.md)

### 技术栈选择
- **前端**: React.js with TypeScript + Ant Design Pro
- **后端**: FastAPI with Python
- **数据库**: MySQL with SQLAlchemy ORM
- **认证**: JWT with bcrypt密码哈希
- **UI框架**: Ant Design Pro for 管理界面
- **图表**: Apache ECharts for 数据可视化
- **文件导出**: Excel.js for 数据导出功能

### 系统架构设计

#### 核心组件
1. **认证服务**: 登录、登出、会话管理
2. **授权服务**: 基于角色的访问控制 (RBAC)
3. **用户管理服务**: 用户操作和数据管理
4. **钱包管理服务**: 余额调整和交易跟踪
5. **课程管理服务**: 课程CRUD和排程
6. **分析服务**: 数据聚合和可视化
7. **审计服务**: 全面日志和监控
8. **通知服务**: 系统告警和提醒

#### 实施阶段划分

**阶段1：核心基础设施 (4天)**
- 管理员用户认证系统
- 基于角色的访问控制实施
- 基础UI框架和路由
- 审计日志基础设施
- 安全中间件设置

**阶段2：用户管理 (4天)**
- 用户列表和搜索功能
- 带钱包信息的用户详情页
- 对账记录管理
- 预约历史管理
- 用户状态管理 (冻结/解冻)

**阶段3：钱包和调整系统 (3天)**
- 钱包余额调整界面
- 交易历史显示
- 带验证的调整表单
- 收据管理工作流
- 财务报告功能

**阶段4：课程管理 (3天)**
- 课程CRUD操作
- 课程排程界面
- 教练分配和管理
- 出勤跟踪系统
- 课程分析和报告

**阶段5：分析和报告 (4天)**
- 带关键指标的仪表板
- 收入和用户分析
- 数据可视化图表
- Excel导出功能
- 实时数据刷新

**阶段6：高级功能 (3天)**
- 体验课跟进系统
- 客户标签和虚拟年龄管理
- 价格规则管理
- 候补管理
- 私教课和补课补偿

### 安全架构

#### 认证安全
- bcrypt password hashing with salt
- Session management with JWT tokens
- Automatic session timeout (30 minutes)
- Failed login attempt tracking
- Account lockout after 5 failed attempts

#### 授权安全
- Role-based access control (RBAC)
- Permission-based feature access
- Route-level authorization checks
- API endpoint protection
- Sensitive operation double confirmation

#### 数据安全
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure file upload handling

#### 审计安全
- Comprehensive operation logging
- IP address tracking
- User agent logging
- Risk scoring for suspicious activities
- Immutable audit trail

### 性能优化策略

#### 数据库优化
- Proper indexing strategy
- Query optimization
- Connection pooling
- Read replicas for analytics queries
- Database query caching

#### 前端优化
- Code splitting and lazy loading
- Component memoization
- Virtual scrolling for large lists
- Image optimization
- Bundle size optimization

#### API性能
- Response caching where appropriate
- Pagination for large datasets
- Compression for API responses
- Rate limiting
- Request validation

### UI/UX设计

#### Dashboard布局
```
┌─────────────────────────────────────────────────────────┐
│ Header: Logo | Navigation | User Menu | Notifications    │
├─────────────────────────────────────────────────────────┤
│ Sidebar                │ Main Content Area             │
│ - Dashboard            │ ┌─────────────────────────────┐│
│ - User Management      │ │ Page Content                 ││
│ - Wallet Management    │ │                             ││
│ - Course Management    │ │                             ││
│ - Attendance           │ │                             ││
│ - Analytics            │ │                             ││
│ - Follow-up            │ │                             ││
│ - Settings             │ └─────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

#### 关键页面设计

**1. Dashboard页面**
- KPI卡片显示关键指标
- 收入趋势图表
- 用户增长可视化
- 最近活动动态
- 快速操作按钮

**2. 用户管理页面**
- 用户搜索和过滤
- 用户列表及状态指示器
- 用户详情弹窗及标签页：
  - 基本信息
  - 钱包和交易记录
  - 预约历史
  - 跟进记录

**3. 钱包调整弹窗**
- 带验证的调整表单
- 实时余额预览
- 支付方式选择
- 收据上传功能
- 调整历史记录

**4. 课程管理页面**
- 带状态的课程列表
- 课程创建/编辑表单
- 教练分配界面
- 排程管理
- 出勤跟踪

### 风险评估与缓解

#### 高风险
- **安全漏洞**: 认证系统中的安全漏洞
  - 缓解措施: 多层安全、定期安全审计
- **数据完整性**: 财务操作中的数据完整性问题
  - 缓解措施: 数据库事务、全面验证、审计跟踪
- **性能瓶颈**: 大数据集的性能瓶颈
  - 缓解措施: 缓存策略、查询优化、延迟加载
- **复杂RBAC**: 复杂的基于角色的访问控制实现
  - 缓解措施: 清晰的权限矩阵、全面的测试

#### 中等风险
- **UI/UX复杂性**: 影响可用性的UI/UX复杂性
  - 缓解措施: 用户测试、迭代改进
- **集成问题**: 与现有系统的集成问题
  - 缓解措施: 彻底测试、API版本控制、向后兼容
- **数据迁移**: 数据迁移挑战
  - 缓解措施: 备份策略、分步迁移、回滚计划
- **用户培训**: 用户培训和采用
  - 缓解措施: 全面文档、培训会、用户支持

#### 低风险
- **浏览器兼容性**: 浏览器兼容性问题
  - 缓解措施: 跨浏览器测试、渐进增强
- **UI不一致**: 轻微的UI不一致
  - 缓解措施: 设计系统、组件库
- **文档完整性**: 文档完整性差距
  - 缓解措施: 文档模板、定期审查
- **测试覆盖率**: 测试覆盖率差距
  - 缓解措施: 测试驱动开发、代码覆盖率要求

### 测试策略

#### 单元测试
- 认证和授权逻辑
- 业务逻辑验证
- 数据转换函数
- API端点处理器
- 数据库操作

#### 集成测试
- 前端-后端集成
- 数据库集成
- 第三方服务集成
- 认证流程测试
- 文件上传/下载测试

#### 端到端测试
- 完整的用户工作流
- 关键业务场景
- 跨浏览器兼容性
- 负载下的性能测试
- 安全渗透测试

#### 用户验收测试
- 运营人员工作流测试
- 教练出勤标记测试
- 财务用户访问测试
- 管理员用户管理测试
- 报告准确性验证

### 部署计划

#### 预发布环境
- 完整系统集成测试
- 与生产类似数据的性能测试
- 安全审计和渗透测试
- 与运营团队的用户验收测试

#### 生产发布
- 蓝绿部署策略
- 具有回滚能力的数据库迁移
- 渐进推出的功能标志
- 实时监控和告警
- 快速回滚程序

### 成功标准
- [ ] 99.5%+ 认证成功率
- [ ] <2秒平均页面加载时间
- [ ] 敏感操作100%审计日志覆盖
- [ ] 渗透测试中零安全漏洞
- [ ] 运营团队95%+用户满意度评分
- [ ] 财务计算100%准确率
- [ ] 所有用户故事的完整功能覆盖

### 发布后考虑

#### 监控和维护
- 实时性能监控
- 安全监控和告警
- 错误跟踪和报告
- 用户行为分析
- 系统健康检查

#### 培训和文档
- 全面的用户文档
- 常见工作流程的视频教程
- 管理员用户培训课程
- FAQ和故障排除指南
- 最佳实践文档

#### 未来增强
- 移动端响应式管理界面
- 高级分析和报告
- 自动化工作流功能
- 与额外第三方系统的集成
- 增强的安全功能

---

## 🗄️ 数据模型设计 (data-model.md)

### 数据库架构概述
管理后台系统的数据库设计采用规范化的关系模型，支持多租户、权限控制、审计日志和业务功能。通过合理的外键关系和索引策略，确保数据完整性和查询性能；通过JSON字段支持灵活的业务配置；通过审计表记录所有关键操作，满足合规要求。

### 核心数据表设计

#### 1. admin_user 表
管理员用户表，存储后台登录用户信息和权限。

```sql
CREATE TABLE admin_user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt密码哈希',
    role ENUM('admin', 'operator', 'coach', 'finance') NOT NULL DEFAULT 'operator',
    name VARCHAR(100) NOT NULL COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱地址',
    phone VARCHAR(20) COMMENT '手机号码',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    permissions JSON COMMENT '额外权限配置',
    department VARCHAR(100) COMMENT '部门',
    position VARCHAR(100) COMMENT '职位',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login_at DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) COMMENT '最后登录IP',
    login_count INT DEFAULT 0 COMMENT '登录次数',
    failed_login_attempts INT DEFAULT 0 COMMENT '连续登录失败次数',
    locked_until DATETIME COMMENT '账户锁定到期时间',
    password_changed_at DATETIME COMMENT '密码修改时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_last_login (last_login_at),
    INDEX idx_created_at (created_at)
);
```

**字段说明**:
- `role`: 四种角色 - admin(管理员)、operator(运营)、coach(教练)、finance(财务)
- `permissions`: JSON格式存储额外权限配置
- `locked_until`: 账户锁定时间，用于防暴力破解
- `password_changed_at`: 密码最后修改时间，用于强制密码更新

#### 2. admin_session 表
管理员会话表，跟踪登录会话和安全性。

```sql
CREATE TABLE admin_session (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT NOT NULL,
    session_token VARCHAR(128) UNIQUE NOT NULL COMMENT 'JWT会话令牌',
    ip_address VARCHAR(45) COMMENT '登录IP地址',
    user_agent TEXT COMMENT '用户代理字符串',
    browser_info VARCHAR(200) COMMENT '浏览器信息',
    os_info VARCHAR(100) COMMENT '操作系统信息',
    location_country VARCHAR(50) COMMENT '所在国家',
    location_city VARCHAR(100) COMMENT '所在城市',
    is_active BOOLEAN DEFAULT TRUE COMMENT '会话是否活跃',
    expires_at DATETIME NOT NULL COMMENT '会话过期时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_active (is_active),

    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id) ON DELETE CASCADE
);
```

#### 3. admin_operation_log 表
管理员操作日志表，记录所有后台操作的详细日志。

```sql
CREATE TABLE admin_operation_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT NOT NULL,
    session_id VARCHAR(128) COMMENT '会话ID',
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) NOT NULL COMMENT '目标对象类型',
    target_id BIGINT NOT NULL COMMENT '目标对象ID',
    target_name VARCHAR(200) COMMENT '目标对象名称',
    details JSON COMMENT '操作详细信息',
    old_values JSON COMMENT '操作前的值',
    new_values JSON COMMENT '操作后的值',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    browser_info VARCHAR(200) COMMENT '浏览器信息',
    os_info VARCHAR(100) COMMENT '操作系统信息',
    location_country VARCHAR(50) COMMENT '所在国家',
    location_city VARCHAR(100) COMMENT '所在城市',
    risk_score INT DEFAULT 0 COMMENT '风险评分',
    success BOOLEAN DEFAULT TRUE COMMENT '操作是否成功',
    error_message TEXT COMMENT '错误信息',
    execution_time_ms INT COMMENT '执行时间(毫秒)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at),
    INDEX idx_risk_score (risk_score),
    INDEX idx_success (success),
    INDEX idx_ip_address (ip_address),

    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id) ON DELETE SET NULL
);
```

#### 4. trial_class_follow_up 表
体验课跟进表，记录体验课用户的跟进状态和转化情况。

```sql
CREATE TABLE trial_class_follow_up (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    student_profile_id BIGINT NOT NULL COMMENT '学员档案ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    booking_id BIGINT NOT NULL COMMENT '预约ID',
    follow_up_status ENUM('pending', 'contacted', 'not_interested', 'converted', 'lost') DEFAULT 'pending',
    contact_time DATETIME COMMENT '联系时间',
    contact_result ENUM('interested', 'considering', 'not_interested', 'no_response') COMMENT '跟进结果',
    next_follow_up_time DATETIME COMMENT '下次跟进时间',
    notes TEXT COMMENT '跟进备注',
    conversion_probability INT DEFAULT 0 COMMENT '转化概率(0-100)',
    admin_user_id INT NOT NULL COMMENT '跟进人ID',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '优先级',
    tags JSON COMMENT '标签',
    source_channel VARCHAR(100) COMMENT '来源渠道',
    estimated_budget DECIMAL(10,2) COMMENT '预估预算',
    competitor_info VARCHAR(500) COMMENT '竞品信息',
    parent_concerns TEXT COMMENT '家长关注点',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_student_profile_id (student_profile_id),
    INDEX idx_course_id (course_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (follow_up_status),
    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_priority (priority),
    INDEX idx_next_follow_up (next_follow_up_time),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id)
);
```

#### 5. user_reconciliation_record 表
用户消课对账记录表，记录用户的充值和消课交易历史。

```sql
CREATE TABLE user_reconciliation_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    student_profile_id BIGINT COMMENT '学员ID（可为空，如充值记录）',
    booking_id BIGINT COMMENT '预约ID（可为空，如调整记录）',
    payment_order_id BIGINT COMMENT '支付订单ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '交易金额（正数表示充值，负数表示扣费）',
    transaction_type ENUM('recharge', 'consume', 'adjustment', 'refund') NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL COMMENT '交易后余额',
    payment_method VARCHAR(50) COMMENT '支付方式',
    external_order_no VARCHAR(100) COMMENT '外部订单号',
    note TEXT COMMENT '交易备注或说明',
    admin_user_id INT COMMENT '操作管理员ID（调整类交易）',
    transaction_category VARCHAR(100) COMMENT '交易分类',
    related_course_name VARCHAR(200) COMMENT '关联课程名称',
    refund_reason VARCHAR(500) COMMENT '退款原因',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME COMMENT '处理时间',

    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_profile_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_payment_order_id (payment_order_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    INDEX idx_amount (amount),
    INDEX idx_admin_user_id (admin_user_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (payment_order_id) REFERENCES payment_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id) ON DELETE SET NULL
);
```

#### 6. attendance_records 表
出勤记录表，记录学员的出勤状态和详细信息。

```sql
CREATE TABLE attendance_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL COMMENT '预约ID',
    course_schedule_id BIGINT NOT NULL COMMENT '课程安排ID',
    student_profile_id BIGINT NOT NULL COMMENT '学员档案ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    status ENUM('attended', 'absent', 'leave', 'late', 'early_leave') NOT NULL DEFAULT 'absent',
    marked_by INT NOT NULL COMMENT '标记人（教练管理员ID）',
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '标记时间',
    check_in_time DATETIME COMMENT '签到时间',
    check_out_time DATETIME COMMENT '签退时间',
    actual_duration INT COMMENT '实际出勤时长（分钟）',
    planned_duration INT COMMENT '计划时长（分钟）',
    note TEXT COMMENT '备注',
    attendance_score INT DEFAULT 0 COMMENT '出勤评分',
    performance_notes TEXT COMMENT '表现评价',
    parent_feedback TEXT COMMENT '家长反馈',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_booking_student (booking_id, student_profile_id),
    INDEX idx_course_schedule (course_schedule_id),
    INDEX idx_student_id (student_profile_id),
    INDEX idx_user_id (user_id),
    INDEX idx_marked_by (marked_by),
    INDEX idx_status (status),
    INDEX idx_marked_at (marked_at),
    INDEX idx_check_in_time (check_in_time),

    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (course_schedule_id) REFERENCES course_schedules(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (marked_by) REFERENCES admin_user(id)
);
```

#### 7. virtual_age_log 表
虚拟年龄变更记录表，追踪虚拟年龄设置的历史变更。

```sql
CREATE TABLE virtual_age_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_profile_id BIGINT NOT NULL COMMENT '学员档案ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    old_virtual_age INT COMMENT '原虚拟年龄',
    new_virtual_age INT COMMENT '新虚拟年龄',
    actual_age INT COMMENT '实际年龄',
    age_difference INT COMMENT '年龄差值',
    change_reason VARCHAR(500) NOT NULL COMMENT '变更原因',
    change_type ENUM('auto_approve', 'manual_approve', 'coach_request', 'parent_request') NOT NULL,
    admin_user_id INT COMMENT '审核管理员ID',
    coach_id INT COMMENT '申请教练ID',
    supporting_documents JSON COMMENT '支持文档',
    approval_notes TEXT COMMENT '审批备注',
    effective_date DATE COMMENT '生效日期',
    expiry_date DATE COMMENT '到期日期',
    status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME COMMENT '审批时间',

    INDEX idx_student_profile_id (student_profile_id),
    INDEX idx_user_id (user_id),
    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_effective_date (effective_date),

    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id)
);
```

#### 8. pricing_rule 表
价格规则表，存储多维度的定价规则。

```sql
CREATE TABLE pricing_rule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(200) NOT NULL COMMENT '规则名称',
    rule_code VARCHAR(100) UNIQUE NOT NULL COMMENT '规则编码',
    customer_type ENUM('new_user', 'old_user', 'friend', 'vip') NOT NULL,
    audience_type ENUM('child', 'adult') NOT NULL,
    course_type ENUM('group', 'long_term', 'private_1v1', 'private_1v2', 'private_1v3', 'trial', 'camp') NOT NULL,
    level_range VARCHAR(100) COMMENT '等级范围（如：L1-L4）',
    min_level INT COMMENT '最低等级',
    max_level INT COMMENT '最高等级',
    hourly_price DECIMAL(10,2) COMMENT '小时单价',
    discount_rate DECIMAL(5,4) DEFAULT 1.0000 COMMENT '折扣率',
    fixed_price DECIMAL(10,2) COMMENT '固定价格',
    priority INT DEFAULT 0 COMMENT '优先级（数字越大优先级越高）',
    conditions JSON COMMENT '额外条件',
    special_tags JSON COMMENT '特殊标签',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    effective_date DATE COMMENT '生效日期',
    expiry_date DATE COMMENT '到期日期',
    created_by INT NOT NULL COMMENT '创建人',
    updated_by INT COMMENT '更新人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_rule_code (rule_code),
    INDEX idx_customer_type (customer_type),
    INDEX idx_audience_type (audience_type),
    INDEX idx_course_type (course_type),
    INDEX idx_priority (priority),
    INDEX idx_is_active (is_active),
    INDEX idx_effective_date (effective_date),

    FOREIGN KEY (created_by) REFERENCES admin_user(id),
    FOREIGN KEY (updated_by) REFERENCES admin_user(id)
);
```

#### 9. waitlist_management 表
候补管理表，记录候补队列的运营处理信息。

```sql
CREATE TABLE waitlist_management (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL COMMENT '课程ID',
    course_schedule_id BIGINT NOT NULL COMMENT '课程安排ID',
    total_waitlist_count INT DEFAULT 0 COMMENT '候补总人数',
    current_round INT DEFAULT 1 COMMENT '当前通知轮次',
    last_notification_time DATETIME COMMENT '最后通知时间',
    next_notification_time DATETIME COMMENT '下次通知时间',
    deadline_time DATETIME COMMENT '截止时间',
    status ENUM('active', 'completed', 'cancelled', 'expired') DEFAULT 'active',
    admin_notes TEXT COMMENT '运营备注',
    auto_processed BOOLEAN DEFAULT FALSE COMMENT '是否自动处理',
    conflict_resolution JSON COMMENT '冲突解决方案',
    success_count INT DEFAULT 0 COMMENT '成功转化人数',
    expired_count INT DEFAULT 0 COMMENT '过期未确认人数',
    cancelled_count INT DEFAULT 0 COMMENT '取消人数',
    admin_user_id INT COMMENT '负责人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_course_id (course_id),
    INDEX idx_course_schedule_id (course_schedule_id),
    INDEX idx_status (status),
    INDEX idx_next_notification (next_notification_time),
    INDEX idx_deadline (deadline_time),

    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (course_schedule_id) REFERENCES course_schedules(id),
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id)
);
```

#### 10. private_class_inquiry 表
私教课咨询记录表，记录用户私教课咨询行为和跟进状态。

```sql
CREATE TABLE private_class_inquiry (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    student_profile_id BIGINT COMMENT '学员档案ID',
    inquiry_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '咨询时间',
    inquiry_channel ENUM('phone', 'wechat', 'email', 'offline', 'website') NOT NULL,
    inquiry_content TEXT COMMENT '咨询内容',
    preferred_coach_id INT COMMENT '首选教练ID',
    preferred_time VARCHAR(200) COMMENT '期望时间',
    budget_range VARCHAR(100) COMMENT '预算范围',
    special_requirements TEXT COMMENT '特殊要求',
    follow_up_status ENUM('new', 'contacted', 'quoted', 'booked', 'lost') DEFAULT 'new',
    admin_user_id INT COMMENT '跟进运营ID',
    next_follow_up_time DATETIME COMMENT '下次跟进时间',
    quote_amount DECIMAL(10,2) COMMENT '报价金额',
    quote_notes TEXT COMMENT '报价备注',
    conversion_result ENUM('pending', 'converted', 'not_converted', 'postponed') COMMENT '转化结果',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_student_profile_id (student_profile_id),
    INDEX idx_inquiry_time (inquiry_time),
    INDEX idx_follow_up_status (follow_up_status),
    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_next_follow_up (next_follow_up_time),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (preferred_coach_id) REFERENCES admin_user(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id) ON DELETE SET NULL
);
```

#### 11. makeup_compensation 表
补课补偿管理表，记录补课课时补偿的发放和使用情况。

```sql
CREATE TABLE makeup_compensation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    student_profile_id BIGINT NOT NULL COMMENT '学员档案ID',
    original_booking_id BIGINT COMMENT '原预约ID',
    compensation_type ENUM('cancellation', 'coach_absent', 'facility_issue', 'other') NOT NULL,
    compensation_minutes INT NOT NULL COMMENT '补偿时长（分钟）',
    used_minutes INT DEFAULT 0 COMMENT '已使用时长',
    remaining_minutes INT GENERATED ALWAYS AS (compensation_minutes - used_minutes) STORED,
    status ENUM('active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    reason VARCHAR(500) NOT NULL COMMENT '补偿原因',
    admin_user_id INT NOT NULL COMMENT '发放人ID',
    approved_by INT COMMENT '审批人ID',
    expiry_date DATETIME NOT NULL COMMENT '到期时间',
    used_bookings JSON COMMENT '使用的预约记录',
    usage_notes TEXT COMMENT '使用备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME COMMENT '使用时间',
    expired_at DATETIME COMMENT '过期时间',

    INDEX idx_user_id (user_id),
    INDEX idx_student_profile_id (student_profile_id),
    INDEX idx_original_booking_id (original_booking_id),
    INDEX idx_status (status),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_admin_user_id (admin_user_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id),
    FOREIGN KEY (original_booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_user(id),
    FOREIGN KEY (approved_by) REFERENCES admin_user(id)
);
```

### 实体关系图

```
admin_user (1) -----> (N) admin_session
      |
      |
      v
admin_operation_log (N) -----> (1) admin_user

users (1) -----> (N) trial_class_follow_up -----> (1) admin_user
  |                                           |
  |                                           v
  v                               trial_class_follow_up (N)
student_profiles (1)                               |
  |                                           |
  |                                           v
  v                                   course_management (N)
user_reconciliation_record (N)                       |
  |                                           |
  |                                           v
  +-----------------------------------> attendance_records (N)

virtual_age_log (N) -----> (1) student_profiles
pricing_rule (N) -----> (1) admin_user
waitlist_management (N) -----> (1) admin_user
private_class_inquiry (N) -----> (1) admin_user
makeup_compensation (N) -----> (1) admin_user
```

### 关键关系说明

1. **Admin User Management**: 管理员用户与会话、操作日志、业务数据的关系
2. **User Business Operations**: 用户与跟进、对账、出勤等业务数据的关系
3. **Course Related Data**: 课程与出勤、候补、私教咨询的关系
4. **Financial Operations**: 钱包调整、价格规则、补偿记录的关系

### 数据验证规则

#### Admin User验证
- `username` 必须唯一，长度3-50字符
- `password_hash` 使用bcrypt加密，最小长度8字符
- `role` 必须是预定义的四种角色之一
- `email` 格式验证（可选）
- `phone` 格式验证（可选）

#### Operation Log验证
- `action` 不能为空，必须是预定义的操作类型
- `target_type` 和 `target_id` 必须同时存在
- `risk_score` 范围0-100
- `execution_time_ms` 必须为正整数

#### Financial Data验证
- `amount` 精度必须是2位小数
- `balance_after` 必须等于 `balance_before + amount`
- `transaction_type` 必须是预定义类型
- `discount_rate` 范围0.0000-2.0000

#### Time-based Data验证
- `effective_date` 不能晚于 `expiry_date`
- `next_follow_up_time` 必须晚于当前时间
- `expiry_date` 必须晚于创建时间

### 索引策略

#### 主要索引
- 所有表都有自增主键
- 业务标识符的唯一约束

#### 外键索引
- 所有外键字段建立索引
- 复合索引优化常用查询

#### 查询优化索引
- 时间字段索引支持范围查询
- 状态字段索引支持过滤
- 用户相关索引支持用户数据查询

#### 复合索引示例
```sql
-- 用户对账记录复合索引
CREATE INDEX idx_user_recon_user_type_date ON user_reconciliation_record(user_id, transaction_type, created_at);

-- 出勤记录复合索引
CREATE INDEX idx_attendance_schedule_date ON attendance_records(course_schedule_id, marked_at);

-- 跟进记录复合索引
CREATE INDEX idx_followup_status_admin ON trial_class_follow_up(follow_up_status, admin_user_id, next_follow_up_time);
```

### 数据迁移考虑

#### 迁移脚本
1. 创建管理员用户和初始角色
2. 迁移现有用户操作数据到对账记录表
3. 设置初始价格规则和权限配置
4. 创建默认系统配置

#### 回滚策略
1. 备份所有生产数据
2. 创建回滚脚本
3. 在测试环境验证回滚
4. 准备手动回退程序

### 性能考虑

#### 读取模式
- 管理员登录和权限验证（高频）
- 用户对账记录查询（高频）
- 出勤记录标记（高峰期高频）
- 数据统计报表（中频）

#### 写入模式
- 操作日志记录（高频）
- 出勤状态更新（高峰期高频）
- 钱包调整操作（中频）
- 跟进状态更新（中频）

#### 缓存策略
- 管理员会话缓存
- 用户权限缓存
- 价格规则缓存
- 统计数据缓存（短期）

### 安全考虑

#### 数据加密
- 管理员密码bcrypt加密
- 敏感操作日志加密
- 个人信息字段加密
- 文件上传安全检查

#### 访问控制
- 基于角色的权限控制
- API接口权限验证
- 数据行级权限控制
- 操作审计跟踪

#### 审计跟踪
- 所有数据修改记录
- 敏感操作详细日志
- 登录行为跟踪
- 异常行为监控

### 数据保留策略

#### 操作日志
- 管理员操作日志：保留2年
- 登录日志：保留6个月
- 会话记录：保留30天

#### 业务数据
- 对账记录：永久保留
- 出勤记录：永久保留
- 跟进记录：保留2年
- 咨询记录：保留1年

#### 系统数据
- 临时文件：保留7天
- 日志文件：保留3个月
- 备份数据：按备份策略

### 分析和报告

#### 用户分析
- 用户注册和活跃度统计
- 用户消费行为分析
- 用户生命周期价值分析
- 用户流失预警

#### 业务分析
- 课程预约和出勤分析
- 收入和利润分析
- 转化率分析
- 教练绩效分析

#### 运营分析
- 运营操作效率分析
- 跟进转化率分析
- 客户满意度分析
- 异常操作监控

---

## ✅ 任务分解清单 (tasks.md)

### 阶段1：核心基础设施 (4 天)

#### 任务1.1：创建管理员用户认证系统
**预估时间**: 8小时
**描述**: 实现安全管理员认证，使用bcrypt密码哈希
**验收标准**:
- [ ] 管理员注册和登录功能
- [ ] bcrypt密码加盐哈希
- [ ] JWT令牌会话管理
- [ ] 密码强度验证
- [ ] 登录尝试跟踪和5次失败后锁定
- [ ] 30分钟无活动会话超时

#### 任务1.2：实现基于角色的访问控制(RBAC)
**预估时间**: 10小时
**描述**: 创建全面的基于角色的权限系统
**验收标准**:
- [ ] 四种角色：admin, operator, coach, finance
- [ ] 权限矩阵实现
- [ ] 路由级授权检查
- [ ] API端点保护
- [ ] 动态权限分配
- [ ] 权限继承和覆盖逻辑

#### 任务1.3：设置基础UI框架和路由
**预估时间**: 12小时
**描述**: 使用Ant Design Pro创建基于React的管理界面
**验收标准**:
- [ ] React + TypeScript项目设置
- [ ] Ant Design Pro集成
- [ ] 带侧边栏导航的响应式布局
- [ ] 基于用户角色的受保护路由
- [ ] 通用UI组件（表格、表单、弹窗）
- [ ] 错误边界和加载状态

#### 任务1.4：实现审计日志基础设施
**预估时间**: 6小时
**描述**: 创建所有管理员操作的全面日志系统
**验收标准**:
- [ ] 所有CRUD操作的自动记录
- [ ] IP地址和用户代理跟踪
- [ ] 可疑活动风险评分
- [ ] 不可变审计跟踪实现
- [ ] 日志搜索和过滤功能
- [ ] 日志保留和归档策略

#### 任务1.5：设置安全中间件
**预估时间**: 4小时
**描述**: 实现安全中间件以防范常见攻击
**验收标准**:
- [ ] CORS配置
- [ ] XSS防护头
- [ ] CSRF保护实现
- [ ] API端点速率限制
- [ ] 输入验证和清理
- [ ] 安全文件上传处理

### 阶段2：用户管理 (4 天)

#### 任务2.1：创建用户列表和搜索功能
**预估时间**: 8小时
**描述**: 构建全面的用户管理界面
**验收标准**:
- [ ] 带排序的分页用户列表
- [ ] 按用户名、电话、邮箱高级搜索
- [ ] 用户状态指示器（活跃、冻结、欠费）
- [ ] 快速操作（冻结/解冻、查看详情）
- [ ] 批量操作支持
- [ ] 导出用户数据到Excel

#### 任务2.2：实现用户详情页
**预估时间**: 10小时
**描述**: 创建包含钱包数据的详细信息用户页面
**验收标准**:
- [ ] 用户基本信息展示（微信昵称、电话、OpenID、注册时间）
- [ ] 钱包余额显示，欠费高亮
- [ ] 快速钱包调整按钮
- [ ] 学员档案卡片显示
- [ ] 用户状态管理界面
- [ ] 操作历史显示

#### 任务2.3：创建对账记录管理
**预估时间**: 12小时
**描述**: 构建全面的和解和交易历史界面
**验收标准**:
- [ ] 4个统计卡片（累计充值、累计消费、剩余余额、总消课数）
- [ ] 混合交易记录表格（充值、消课、调整）
- [ ] 多维度过滤（时间范围、学员姓名、交易类型）
- [ ] 时间降序排列
- [ ] Excel导出功能
- [ ] 交易详情查看

#### 任务2.4：实现预约历史管理
**预估时间**: 8小时
**描述**: 创建预约和学员档案管理界面
**验收标准**:
- [ ] 学员档案卡片式展示
- [ ] 档案展开显示最近5条预约记录
- [ ] 预约状态显示（已完成、待上课、已取消）
- [ ] 完整预约历史查看
- [ ] 消课记录链接
- [ ] 预约详情弹窗

#### 任务2.5：创建用户状态管理
**预估时间**: 6小时
**描述**: 实现用户冻结/解冻和状态管理
**验收标准**:
- [ ] 用户冻结/解冻操作
- [ ] 冻结原因填写
- [ ] 操作确认对话框
- [ ] 状态变更通知
- [ ] 批量状态管理
- [ ] 状态变更历史记录

### 阶段3：钱包和调整系统 (3 天)

#### 任务3.1：创建钱包余额调整界面
**预估时间**: 8小时
**描述**: 构建带验证和工作流的钱包调整表单
**验收标准**:
- [ ] 调整金额输入（正负数支持）
- [ ] 调整原因下拉选择（线下充值、线下退款、误操作更正、其他）
- [ ] 收款方式选择（微信、支付宝、银行转账、现金）
- [ ] 外部订单号输入（选填）
- [ ] 备注文本域
- [ ] 实时余额预览

#### 任务3.2：实现交易历史显示
**预估时间**: 6小时
**描述**: 创建全面的交易历史界面
**验收标准**:
- [ ] 带分页的交易列表
- [ ] 交易类型过滤
- [ ] 日期范围选择
- [ ] 金额范围过滤
- [ ] 交易详情弹窗
- [ ] 导出到Excel功能

#### 任务3.3：创建带验证的调整表单
**预估时间**: 4小时
**描述**: 实现表单验证和错误处理
**验收标准**:
- [ ] 实时表单验证
- [ ] 必填字段验证
- [ ] 金额格式验证
- [ ] 自定义验证规则
- [ ] 错误消息显示
- [ ] 表单状态管理

#### 任务3.4：实现收据管理工作流
**预估时间**: 4小时
**描述**: 创建收据上传和管理系统
**验收标准**:
- [ ] 收据图片上传
- [ ] 图片预览功能
- [ ] 收据URL生成
- [ ] 收据状态跟踪
- [ ] 飞书群通知提示
- [ ] 收据历史查看

#### 任务3.5：创建财务报告功能
**预估时间**: 6小时
**描述**: 构建财务分析和报告功能
**验收标准**:
- [ ] 日/周/月财务报告
- [ ] 收入趋势图表
- [ ] 调整统计
- [ ] 欠费用户报告
- [ ] 钱包余额分布
- [ ] 导出财务报告

### 阶段4：课程管理 (3 天)

#### 任务4.1：创建课程CRUD操作
**预估时间**: 8小时
**描述**: 构建全面的课程管理界面
**验收标准**:
- [ ] 课程创建表单
- [ ] 课程编辑界面
- [ ] 带确认的课程删除
- [ ] 课程状态管理
- [ ] 课程图片上传
- [ ] 课程复制功能

#### 任务4.2：实现课程排程界面
**预估时间**: 6小时
**描述**: 创建课程排程和管理系统
**验收标准**:
- [ ] 课程排程日历视图
- [ ] 排程创建和编辑
- [ ] 重复排程支持
- [ ] 排程冲突检测
- [ ] 教练可用性检查
- [ ] 排程导出功能

#### 任务4.3：创建教练分配和管理
**预估时间**: 6小时
**描述**: 构建教练管理和分配系统
**验收标准**:
- [ ] 教练档案管理
- [ ] 教练可用性跟踪
- [ ] 课程分配界面
- [ ] 教练绩效跟踪
- [ ] 教练联系信息
- [ ] 教练排程查看

#### 任务4.4：实现出勤跟踪系统
**预估时间**: 6小时
**描述**: 创建出勤标记和管理系统
**验收标准**:
- [ ] 出勤标记界面（已到课/缺勤/请假）
- [ ] 每个课程的学生列表
- [ ] 批量出勤标记
- [ ] 出勤历史跟踪
- [ ] 出勤统计
- [ ] 出勤报告

#### 任务4.5：创建课程分析和报告
**预估时间**: 6小时
**描述**: 构建课程绩效分析
**验收标准**:
- [ ] 课程注册统计
- [ ] 出勤率分析
- [ ] 每个课程收入跟踪
- [ ] 热门课程识别
- [ ] 课程绩效报告
- [ ] 课程趋势分析

### 阶段5：分析和报告 (4 天)

#### 任务5.1：创建带关键指标的仪表板
**预估时间**: 10小时
**描述**: 构建带KPI的全面管理仪表板
**验收标准**:
- [ ] KPI卡片（总用户数、今日新增、本月预约、本月收入）
- [ ] 实时数据刷新（每5分钟）
- [ ] 交互式图表和图形
- [ ] 日期范围选择
- [ ] 下钻功能
- [ ] 移动端响应式设计

#### 任务5.2：实现收入和用户分析
**预估时间**: 8小时
**描述**: 创建收入和用户指标的详细分析
**验收标准**:
- [ ] 收入趋势分析
- [ ] 用户增长图表
- [ ] 转化率跟踪
- [ ] 客户生命周期价值分析
- [ ] 按课程类型收入
- [ ] 用户细分分析

#### 任务5.3：创建数据可视化图表
**预估时间**: 8小时
**描述**: 实现各种数据可视化图表类型
**验收标准**:
- [ ] 趋势线图
- [ ] 比较柱状图
- [ ] 分布饼图
- [ ] 模式热力图
- [ ] 转化漏斗图
- [ ] 自定义图表配置

#### 任务5.4：实现Excel导出功能
**预估时间**: 6小时
**描述**: 创建全面的数据导出功能
**验收标准**:
- [ ] 用户数据导出到Excel
- [ ] 交易历史导出
- [ ] 课程报告导出
- [ ] 出勤报告导出
- [ ] 自定义报告生成
- [ ] 定时报告投递

#### 任务5.5：创建实时数据刷新
**预估时间**: 4小时
**描述**: 实现实时数据更新和缓存
**验收标准**:
- [ ] 每5分钟自动刷新
- [ ] 手动刷新按钮
- [ ] 缓存管理
- [ ] 加载指示器
- [ ] 刷新失败的错误处理
- [ ] 最后更新时间显示

### 阶段6：高级功能 (3 天)

#### 任务6.1：创建体验课跟进系统
**预估时间**: 8小时
**描述**: 构建体验课转化跟踪和管理
**验收标准**:
- [ ] 待跟-进列表显示（红色高亮）
- [ ] 跟进状态管理
- [ ] 联系结果记录
- [ ] 转化率跟踪
- [ ] 跟进提醒
- [ ] 转化统计

#### 任务6.2：实现客户标签和虚拟年龄管理
**预估时间**: 10小时
**描述**: 创建全面的客户标签和虚拟年龄系统
**验收标准**:
- [ ] 客户标签管理（年龄、等级、发展、权益）
- [ ] 虚拟年龄设置和批准
- [ ] 基于标签的课程匹配
- [ ] 标签历史跟踪
- [ ] 批量标签操作
- [ ] 标签分析

#### 任务6.3：创建价格规则管理
**预估时间**: 8小时
**描述**: 构建动态价格规则管理系统
**验收标准**:
- [ ] 多维度价格规则
- [ ] 规则优先级管理
- [ ] 价格计算引擎
- [ ] 规则测试界面
- [ ] 价格历史跟踪
- [ ] 冲突检测

#### 任务6.4：实现候补管理
**预估时间**: 6小时
**描述**: 创建候补监控和管理系统
**验收标准**:
- [ ] 候补队列可视化
- [ ] 通知状态跟踪
- [ ] 手动干预功能
- [ ] 候补分析
- [ ] 成功率跟踪
- [ ] 异常处理

#### 任务6.5：创建私教课和补课补偿
**预估时间**: 8小时
**描述**: 构建私教课预约和补课补偿系统
**验收标准**:
- [ ] 私教课手动预约
- [ ] 教练联系管理
- [ ] 补课补偿跟踪
- [ ] 补偿过期提醒
- [ ] 私教课咨询
- [ ] 补偿使用统计

### 质量保证任务

#### 代码质量
- [ ] 所有组件代码审查
- [ ] TypeScript严格模式合规
- [ ] ESLint和Prettier配置
- [ ] 单元测试覆盖率>80%
- [ ] 集成测试覆盖率>70%
- [ ] 端到端测试覆盖率>60%

#### 安全测试
- [ ] 认证流程测试
- [ ] 授权绕过测试
- [ ] 输入验证测试
- [ ] SQL注入防护测试
- [ ] XSS防护测试
- [ ] CSRF防护测试

#### 性能测试
- [ ] 页面加载时间测试（<2秒）
- [ ] API响应时间测试（<500毫秒）
- [ ] 数据库查询优化
- [ ] 大数据集处理测试
- [ ] 并发用户测试（100+用户）
- [ ] 内存泄漏测试

#### 可用性测试
- [ ] 用户工作流测试
- [ ] 跨浏览器兼容性测试
- [ ] 移动端响应式测试
- [ ] 可访问性测试（WCAG 2.1）
- [ ] 运营团队用户验收测试
- [ ] 错误处理和恢复测试

### 依赖关系和风险缓解

#### 关键依赖
1. **MVP-1**: 用户身份系统用于认证集成
2. **MVP-5**: 支付集成用于财务数据
3. **MVP-6**: 钱包系统用于余额管理
4. **React/Ant Design Pro**: UI框架和组件
5. **FastAPI**: 后端框架和API开发

#### 风险缓解策略
- **认证安全**: 实施多层安全、定期安全审计
- **数据完整性**: 数据库事务、全面验证、审计跟踪
- **性能**: 缓存策略、查询优化、延迟加载
- **用户采用**: 全面培训、直观UI设计、文档
- **集成问题**: 彻底测试、API版本控制、向后兼容

### 成功指标

#### 技术指标
- [ ] 99.5%+ 认证成功率
- [ ] <2秒平均页面加载时间
- [ ] <500毫秒平均API响应时间
- [ ] 99.9% 系统正常运行时间
- [ ] 零关键安全漏洞
- [ ] 80%+ 代码测试覆盖率

#### 业务指标
- [ ] 运营团队95%+ 用户满意度
- [ ] 财务计算100% 准确率
- [ ] 手动对账时间减少90%+
- [ ] 100% 审计跟踪覆盖
- [ ] 运营效率提升50%+
- [ ] 所有用户故事的完整功能覆盖

### 部署检查清单

#### 部署前
- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 安全审计完成
- [ ] 性能测试完成
- [ ] 用户验收测试完成
- [ ] 文档更新

#### 部署
- [ ] 数据库迁移脚本测试
- [ ] 备份程序验证
- [ ] 回滚程序测试
- [ ] 监控和告警配置
- [ ] 功能标志配置
- [ ] 部署试运行完成

#### 部署后
- [ ] 健康检查通过
- [ ] 监控告警工作
- [ ] 用户培训完成
- [ ] 支持文档可用
- [ ] 性能指标收集
- [ ] 用户反馈收集

### 发布后支持

#### 监控要求
- 24/7系统监控
- 实时错误跟踪
- 性能指标监控
- 安全监控和告警
- 用户行为分析
- 系统容量规划

#### 维护任务
- 定期安全更新
- 性能优化
- 错误修复和补丁
- 基于用户反馈的功能增强
- 文档更新
- 用户培训和支持

---

## 🔍 质量检查要点 (checklists/requirements.md)

### 需求质量检查

#### 用户故事完整性
- [ ] 每个用户故事都有明确的优先级(P0, P1)
- [ ] 每个用户故事都有独立的测试方法
- [ ] 每个用户故事都有完整的验收场景(Given/When/Then)
- [ ] 边界情况都已考虑并有处理方案

#### 功能需求完整性
- [ ] 所有功能需求都有FR-XXX编号
- [ ] 每个需求都是具体且可测试的
- [ ] 需求覆盖了所有用户故事
- [ ] 没有模糊或歧义的描述

#### 成功标准可衡量性
- [ ] 每个成功标准都有具体指标
- [ ] 所有指标都是可量化的
- [ ] 标准覆盖了关键业务价值
- [ ] 有明确的验收方法

#### 范围明确性
- [ ] 明确标记了不实现的功能
- [ ] 范围边界清晰无歧义
- [ ] 与其他MVP的依赖关系明确

### 设计质量检查

#### 技术选型合规性
- [ ] 遵循宪法Principle 1 (简化优先)
- [ ] 技术栈符合AI Coding友好原则
- [ ] 没有引入不必要的复杂性

#### 数据完整性
- [ ] 遵循宪法Principle 2 (数据完整性至上)
- [ ] 关键业务操作使用事务保护
- [ ] 数据模型设计合理
- [ ] 有适当的数据验证机制

#### API设计合规性
- [ ] 遵循宪法Principle 4 (API优先架构)
- [ ] API设计符合RESTful规范
- [ ] 响应格式统一
- [ ] 有适当的错误处理

#### 安全性考虑
- [ ] 遵循宪法Principle 8 (安全与合规)
- [ ] 用户数据隔离机制完善
- [ ] 敏感操作有权限控制
- [ ] 输入验证和过滤完善

### 实现质量检查

#### 代码质量
- [ ] 遵循宪法Principle 3 (可维护性与可读性)
- [ ] 代码结构清晰分层
- [ ] 函数和类的职责单一
- [ ] 有充分的注释说明

#### 测试覆盖
- [ ] 遵循宪法Principle 7 (测试驱动的数据操作)
- [ ] 关键业务逻辑有单元测试
- [ ] API端点有集成测试
- [ ] 用户场景有端到端测试

#### 性能考虑
- [ ] 数据库查询优化
- [ ] 适当的缓存策略
- [ ] 前端加载性能优化
- [ ] API响应时间合理

### 文档质量检查

#### 规格文档
- [ ] 用户故事描述清晰
- [ ] 功能需求具体明确
- [ ] 成功标准可衡量
- [ ] 边界情况考虑充分

#### 计划文档
- [ ] 技术方案合理可行
- [ ] 数据库设计规范
- [ ] API契约清晰
- [ ] 风险评估充分

#### 任务文档
- [ ] 任务分解合理
- [ ] 依赖关系明确
- [ ] 完成标准具体
- [ ] 时间估算合理

### 合规性检查

#### 宪法原则遵循
- [ ] Principle 1: 简化优先 ✅
- [ ] Principle 2: 数据完整性 ✅
- [ ] Principle 3: 可维护性与可读性 ✅
- [ ] Principle 4: API优先架构 ✅
- [ ] Principle 5: 增量交付 ✅
- [ ] Principle 6: 以用户为中心 ✅
- [ ] Principle 7: 测试驱动的数据操作 ✅
- [ ] Principle 8: 安全与合规 ✅
- [ ] Principle 9: 迁移与集成支持 ✅

#### MVP阶段一致性
- [ ] 符合当前MVP的范围定义
- [ ] 与前序MVP的依赖关系明确
- [ ] 为后续MVP预留扩展空间
- [ ] 纵向切片策略得到体现

### 最终验收检查

#### 功能完整性
- [ ] 所有用户故事都已实现
- [ ] 所有功能需求都已满足
- [ ] 所有成功标准都已达成
- [ ] 边界情况处理正确

#### 质量标准
- [ ] 代码质量达到团队标准
- [ ] 测试覆盖率达到要求
- [ ] 性能指标符合预期
- [ ] 安全检查全部通过

#### 文档完整性
- [ ] 所有必要文档都已创建
- [ ] 文档内容准确且最新
- [ ] 文档格式符合模板要求
- [ ] 技术文档对后续开发友好

---

**汇总文档创建人**: Claude AI Assistant
**汇总日期**: 2025-11-08
**版本**: v1.0.0
**状态**: Draft
**文档范围**: MVP-007 (admin-dashboard) 完整技术文档汇总
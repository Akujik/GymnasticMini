# MVP-006: 钱包系统 - 完整文档汇总

**功能分支**: `006-wallet-system`
**创建时间**: 2025-11-03
**最后更新**: 2025-11-18
**版本**: v1.2.0
**状态**: Enhanced (新增半年度消费跟踪和钱包冻结管理功能)

---

## 📋 项目概览

### 功能范围和核心目标
钱包系统是百适体操馆的核心财务管理系统，为用户提供完整的钱包余额管理、课程扣费、运营充值、余额预警、欠费催缴、半年度消费跟踪和钱包冻结管理功能。系统**支持**机制，允许钱包余额为负数，最大额度-1000元；提供完善的交易记录和审计日志，保障财务安全；通过智能通知系统及时提醒用户充值和消费要求；支持用户申请冻结和运营后台操作，增强业务灵活性。

### 与其他MVP的依赖关系
- **前置依赖**: MVP-001 (001-user-identity-system), MVP-005 (005-payment-integration)
- **业务集成**: 与MVP-2A (002-course-display-and-booking) 深度集成，实现预约扣费
- **核心支撑**: 为所有需要支付功能的MVP提供钱包基础服务，是后续商业化运营的核心基础设施

### 关键技术决策
- 采用分层架构设计：基础钱包服务与业务扩展功能分离，确保系统解耦和可扩展性
- 使用`reference_type`和`reference_id`替代直接外键依赖，避免循环依赖问题
- 支持功能：允许钱包余额为负数，最大额度为-1000元
- 分布式事务处理：使用数据库事务和乐观锁确保并发操作的数据一致性
- 完整的审计日志：所有财务操作都有详细的记录和追踪
- 智能通知系统：基于Redis的频率控制，避免通知骚扰
- 精确的财务计算：使用DECIMAL(10,2)确保金额计算精度，避免浮点数误差

---

## 📚 功能规格 (spec.md)

### 用户故事详细描述

#### User Story 1 - 查看钱包余额和交易记录 (Priority: P0)
用户可以在小程序钱包页面查看当前余额（允许负数）和详细的交易记录，包括运营充值、课程扣费、调整记录等所有资金变动。

**关键验收场景**:
- Given 用户进入"我的-钱包"页面，When 页面加载完成，Then 显示当前钱包余额（精确到分，可为负数）
- Given 用户有交易记录，When 查看交易历史，Then 按时间倒序显示所有交易记录
- Given 用户点击某条交易记录，When 查看详情，Then 显示交易时间、金额、类型、操作人等信息
- Given 用户没有交易记录，When 查看交易历史，Then 显示"暂无交易记录"提示
- Given 家庭账号有多个学员，When 查看钱包，Then 显示家庭共享的统一余额

#### User Story 2 - 正式课预约立即扣费 (Priority: P0)
用户预约正式课时，系统立即从钱包余额中扣费200元，允许余额不足时变为负数，但欠费后限制新预约。

**关键验收场景**:
- Given 用户预约正式课，When 点击确认预约，Then 系统立即从钱包扣费200元
- Given 钱包余额充足（300元），When 扣费200元，Then 余额变为100元，生成扣费交易记录
- Given 钱包余额不足（100元），When 扣费200元，Then 余额变为-100元，允许欠费并生成扣费记录
- Given 用户取消预约，When 取消成功，Then 系统自动恢复钱包余额200元
- Given 用户欠费（余额为负），When 尝试预约新课程，Then 弹窗提示"您有欠费，请先充值"并限制预约

#### User Story 3 - 运营手动调整钱包余额 (Priority: P0)
运营人员在Web后台为指定用户手动调整钱包余额，包含完整的调整原因、收款方式等信息，系统记录详细操作日志。

**关键验收场景**:
- Given 运营在后台选择用户，填写调整金额+100元、调整原因"线下充值"、收款方式"微信"、订单号"wx123"，When 提交，Then 用户余额增加100元
- Given 运营填写调整金额-50元、调整原因"线下退款"、收款方式"银行转账"、订单号"bank456"，When 提交，Then 用户余额减少50元
- Given 调整成功，When 运营查看操作日志，Then 记录操作人、时间、金额、原因、收款方式、订单号等完整信息
- Given 调整成功，When 系统提示，Then 显示"请将收款流水截图发送至飞书群"
- Given 用户查看交易记录，When 进入钱包页面，Then 显示该笔调整记录和详细信息

#### User Story 4 - 余额不足预警通知 (Priority: P1)
用户钱包余额低于500元时，系统通过微信服务通知推送预警提醒，并在用户预约时提供弹窗和公众号双重提醒，帮助用户及时充值。

**关键验收场景**:
- Given 用户钱包余额从600元消费到490元，When 余额低于500元，Then 立即推送微信通知"余额不足500元，请及时充值"
- Given 用户钱包余额已低于500元，When 用户再次消费，Then 不重复推送预警通知
- Given 用户充值后余额超过500元，When 再次消费到500元以下，Then 重新触发预警通知
- Given 用户余额少于500元时尝试预约课程，When 点击预约按钮，Then 小程序弹窗提醒"余额不足，建议尽快联系场馆工作人员续费"
- Given 用户余额少于500元时尝试预约课程，When 点击预约按钮，Then 同时推送微信公众号服务提醒
- Given 用户关闭微信通知权限，When 余额不足，Then 系统记录预警但无法推送，不影响其他功能

#### User Story 5 - 欠费催缴通知 (Priority: P1)
用户钱包欠费时，系统在多个场景推送催缴通知，提醒用户及时充值避免影响上课。

**关键验收场景**:
- Given 用户钱包余额变为负数（欠费），When 欠费发生，Then 立即推送微信通知"您有欠费，请联系运营充值"
- Given 用户欠费，When 用户尝试预约新课程，Then 弹窗提示"您有欠费，请先充值"，并推送微信通知
- Given 用户欠费且预约的课程即将开课，When 开课前1天，Then 推送通知"您有欠费，请及时充值，避免影响孩子上课"
- Given 用户欠费多次未处理，When 运营查看用户列表，Then 该用户显示"欠费催缴"标识

#### User Story 6 - 半年度最低消费跟踪 (Priority: P1)
系统跟踪用户从第一节课开始6个月内的消费情况，如果未达到2700元最低消费要求，提前一个月提醒用户，并在到期时执行惩罚规则。

**关键验收场景**:
- Given 用户从第一节课开始已消费5个月累计2000元，When 到第5个月底，Then 系统计算剩余时间1个月需要消费700元，推送提醒
- Given 用户半年内累计消费达到2700元，When 6个月到期，Then 不触发惩罚，重置下一个半年周期
- Given 用户半年内累计消费仅2000元，When 6个月到期，Then 系统自动扣除最后充值金额的30%（假设最后充值3000元，扣除900元）
- Given 用户半年内累计消费仅2000元，且余额不足扣除30%（余额只有100元需扣除900元），When 6个月到期，Then 余额清零，记录惩罚执行
- Given 用户被扣除惩罚后，When 查看交易记录，Then 显示"半年度消费未达标惩罚"记录

#### User Story 7 - 钱包冻结管理 (Priority: P1)
用户可以申请冻结课卡时间，暂停半年度消费计算，最长不超过3个月。申请冻结时需要明确告知限制条件并要求用户二次确认。运营人员也可以在后台为用户操作冻结。

**关键验收场景**:
- Given 用户申请冻结课卡，When 点击申请冻结，Then 弹窗告知"一年只能冻结一次，一次3个月"，需要用户二次确认
- Given 用户确认申请冻结，When 提交申请，Then 系统暂停半年度消费计算，推送通知"现已冻结课程，冻结时长最多不超过三个月"
- Given 用户申请冻结时已消费3个月累计1500元，When 冻结2个月，Then 冻结结束后剩余消费计算时间为1个月，仍需完成2700元目标
- Given 用户在冻结期间点击任何课程，When 系统检测，Then 显示"课卡处于冻结阶段"提示，并提供"申请取消冻结"按钮
- Given 用户主动解除冻结，When 提交解冻申请，Then 显示确认弹窗"确定要申请取消冻结吗？取消后将恢复预约权限"，确认后系统恢复计算课卡时间
- Given 用户确认解除冻结，When 系统处理成功，Then 推送通知"此次冻结恢复后，需要多长时间上完多少课时，建议尽快恢复上课"
- Given 用户冻结到期3个月未主动解除，When 到期时间到达，Then 系统自动解除冻结，推送通知"冻结时间已结束，课卡还剩余多长时间需要消耗到多少钱"
- Given 运营在后台为用户操作冻结，When 选择用户和冻结时间，Then 系统记录运营操作原因，执行相同的冻结逻辑
- Given 用户一年内已申请过冻结，When 再次尝试申请冻结，Then 系统提示"您今年的冻结次数已用完，每年只能冻结一次"

### 功能需求清单

#### 钱包余额相关需求 (FR-001 到 FR-005)
- 系统必须支持查询用户钱包余额（允许负数）
- 系统必须支持余额实时更新
- 系统必须支持家庭账号余额共享
- 系统必须支持余额精度处理（精确到分）
- 系统必须允许钱包余额为负数（支持欠费）

#### 预约扣费相关需求 (FR-006 到 FR-011)
- 系统必须在预约正式课时立即扣费200元
- 系统必须支持余额不足时的扣费（允许变为负数）
- 系统必须在取消预约时自动恢复钱包余额
- 系统必须在用户欠费时限制新预约
- 系统必须生成详细的扣费交易记录
- 系统必须确保教练出勤标记不触发任何扣费逻辑

#### 运营调整相关需求 (FR-012 到 FR-017)
- 系统必须支持运营手动调整用户钱包余额
- 系统必须要求填写调整原因（必填）
- 系统必须要求填写收款方式（微信/支付宝/银行/现金）
- 系统必须支持填写外部订单号（选填）
- 系统必须记录运营调整的操作日志
- 系统必须提示"请将收款流水截图发送至飞书群"

#### 预警通知相关需求 (FR-018 到 FR-025)
- 系统必须在余额低于500元时推送预警通知
- 系统必须在用户预约时如果余额不足500元提供小程序弹窗提醒
- 系统必须在用户预约时如果余额不足500元推送微信公众号服务提醒
- 系统必须避免重复推送同类型预警通知
- 系统必须在用户欠费时立即推送催缴通知
- 系统必须在用户尝试预约时推送欠费提醒
- 系统必须在课程开课前1天推送欠费催缴通知

#### 交易记录相关需求 (FR-026 到 FR-029)
- 系统必须记录所有钱包交易（充值、扣费、调整）
- 系统必须支持交易记录查询和筛选
- 系统必须显示详细的交易信息（时间、金额、类型、操作人）
- 系统必须确保交易记录不可篡改

#### 半年度消费跟踪需求 (FR-030 到 FR-036)
- 系统必须记录用户最后一次充值金额和充值时间
- 系统必须跟踪从第一节课开始6个月内的累计消费金额
- 系统必须在半年度结束前1个月提醒用户还需要消费的金额
- 系统必须在半年度结束时自动检查是否达到2700元最低消费
- 系统必须对未达标用户执行最后充值金额30%的惩罚扣除
- 系统必须在余额不足时将惩罚金额扣至清零
- 系统必须在惩罚执行后重置下一个半年度消费周期

#### 钱包冻结管理需求 (FR-037 到 FR-045)
- 系统必须支持用户申请冻结课卡时间
- 系统必须支持运营在后台为用户操作冻结
- 系统必须设置冻结时间最长不超过3个月
- 系统必须在冻结期间暂停半年度消费时间计算
- 系统必须支持用户主动解除冻结
- 系统必须在冻结到期时自动解除并提醒用户
- 系统必须在用户申请冻结时显示"一年只能冻结一次，一次3个月"的提示
- 系统必须要求用户在申请冻结时进行二次确认
- 系统必须在冻结期间禁用所有预约操作，但允许浏览课程信息

### 边界情况处理

#### 欠费处理机制
- **欠费用户限制**: 已欠费用户可以继续上课，但无法预约新课程
- **额度管理**: 最大额度为-1000元，超过后无法继续扣费
- **家庭账号**: 多个学员共享钱包，统一从家庭共享余额扣费，允许

#### 半年度消费边界情况
- **惩罚执行**: 当余额不足以扣除30%惩罚金额时，扣至清零为止
- **充值记录**: 如果用户无充值记录，惩罚金额默认为0（无法执行惩罚）
- **冻结期处理**: 冻结时间不计入6个月消费周期，消费周期相应延长
- **周期重置**: 惩罚执行后立即开始新的6个月消费周期
- **提醒频率**: 半年度提醒每月最多推送1次，避免骚扰

#### 冻结管理边界情况
- **重复冻结**: 用户一年内只能申请一次冻结，最多3个月
- **冻结期间**: 冻结期间无法预约任何课程，已有预约不受影响
- **提前解冻**: 用户可随时申请提前解冻，需要二次确认
- **运营权限**: 运营可以为任何用户操作冻结，但需要记录操作原因
- **冻结叠加**: 冻结期间不触发半年度惩罚，时间计算相应暂停
- **冻结申请确认**: 用户申请冻结时必须显示限制条件并要求二次确认
- **冻结状态UI**: 冻结期间所有预约相关按钮禁用，但允许浏览课程信息
- **冻结提醒**: 用户尝试预约时显示"课卡处于冻结阶段"提示，提供取消冻结入口
- **解冻确认**: 用户申请解冻时需要确认"确定要申请取消冻结吗？取消后将恢复预约权限"

#### 数据精度和并发处理
- **余额精度处理**: 使用DECIMAL(10,2)精确到分，避免浮点数精度问题
- **并发扣费处理**: 使用数据库事务和乐观锁，确保数据一致性
- **重复调整防护**: 前端防重复提交，后端幂等性检查

#### 异常处理机制
- **网络异常**: 余额调整时网络中断，事务回滚，保持数据一致性
- **误操作撤销**: 支持反向调整操作，记录详细的撤销原因
- **教练出勤标记**: 不触发扣费逻辑，费用在预约时已扣除，出勤标记仅用于统计

#### 退费规则时间限制
- 用户取消预约后如何处理退费：开课前6小时外可申请退费，6小时内无法退费，课时不扣除

---

## 🏗️ 技术实现计划 (plan.md)

### 分层架构设计

#### Layer 1: 基础钱包服务 (仅依赖MVP-1)
- 基础钱包CRUD操作
- 余额检查与冻结管理
- 交易记录系统
- 引用ID管理系统

#### Layer 2: 业务扩展层
- 预约费用扣除 (依赖MVP-2A)
- 支付集成 (依赖MVP-5)
- 候补管理 (依赖MVP-3)
- 私教课费用 (依赖MVP-4)

#### Layer 3: 高级功能层
- 运营调整管理
- 余额通知系统
- 欠费用户限制
- 数据分析报表

### 数据依赖解耦设计
- 使用 `reference_type` 和 `reference_id` 替代直接外键
- 通过事件总线处理跨模块业务流程
- 钱包表结构独立，便于维护和扩展

### 技术栈选择
- **前端**: 微信小程序 (MINA框架) + Web管理后台
- **后端**: FastAPI with Python
- **数据库**: MySQL with SQLAlchemy ORM
- **通知服务**: 微信服务通知
- **状态管理**: Redis用于余额缓存和通知限流

### 核心系统组件
1. **钱包服务层**: 核心钱包操作和余额管理
2. **交易服务**: 交易记录和历史管理
3. **调整服务**: 运营人员手动余额调整
4. **通知服务**: 余额预警和欠费提醒
5. **预约集成**: 课程费用扣除集成
6. **审计服务**: 全面的审计日志

### 实施阶段规划

#### 阶段1：核心钱包基础设施 (3天)
- 钱包和交易数据库架构
- 基础钱包CRUD操作
- 余额计算和精度处理
- 交易记录系统
- 基础钱包API端点

#### 阶段2：课程预约集成 (3天)
- 与预约系统集成费用扣除
- 支持和余额验证
- 取消退款逻辑
- 并发交易处理
- 欠费用户预约限制

#### 阶段3：运营调整系统 (4天)
- Web管理界面用于余额调整
- 带必填字段的工作流程
- 操作审计日志
- 收据通知系统
- 调整历史跟踪

#### 阶段4：通知系统 (3天)
- 低于阈值检测
- 微信服务通知集成
- 欠费提醒逻辑
- 通知频率控制
- 通知历史跟踪

#### 阶段5：高级功能与优化 (3天)
- 家庭账号钱包共享
- 性能优化
- 安全增强
- 综合测试
- 监控和告警

### 安全考虑

#### 余额安全
- 所有余额操作使用数据库事务
- Decimal精度处理用于财务计算
- 乐观锁防止并发操作
- 所有调整的全面审计日志

#### API安全
- 运营端点的基于角色的访问控制
- 请求验证和清理
- 调整操作的速率限制
- 所有钱包操作的认证和授权

#### 数据安全
- 敏感财务数据加密
- 交易日志中的PII保护
- 管理员凭据的安全存储
- 定期安全审计

---

## 🗃️ 数据模型设计 (data-model.md)

### 核心数据表结构

#### 1. wallet 表
```sql
CREATE TABLE wallet (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT UNIQUE NOT NULL COMMENT 'Account ID (from MVP-1)',
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Current wallet balance (can be negative)',
    frozen_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Frozen amount for pending transactions',
    credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Overdraft limit (default 0, can be increased)',
    total_recharged DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount ever recharged',
    total_spent DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount ever spent',
    last_recharge_amount DECIMAL(10,2) NULL COMMENT 'Last recharge amount for penalty calculation',
    last_recharge_date TIMESTAMP NULL COMMENT 'Last recharge date for penalty calculation',
    semi_annual_consumption DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Consumption in current 6-month period',
    semi_annual_start_date TIMESTAMP NULL COMMENT 'Start date of current 6-month period',
    semi_annual_end_date TIMESTAMP NULL COMMENT 'End date of current 6-month period',
    status ENUM('active', 'frozen', 'closed') NOT NULL DEFAULT 'active' COMMENT 'Wallet status',
    family_account_id BIGINT NULL COMMENT 'For family account sharing',
    last_transaction_at TIMESTAMP NULL COMMENT 'Timestamp of last transaction',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. wallet_transactions 表
```sql
CREATE TABLE wallet_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wallet_id BIGINT NOT NULL COMMENT 'Associated wallet',
    transaction_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'Unique transaction identifier',
    type ENUM('recharge', 'deduction', 'adjustment', 'refund', 'freeze', 'unfreeze') NOT NULL,
    amount DECIMAL(10,2) NOT NULL COMMENT 'Transaction amount (positive for increase, negative for decrease)',
    balance_before DECIMAL(10,2) NOT NULL COMMENT 'Balance before transaction',
    balance_after DECIMAL(10,2) NOT NULL COMMENT 'Balance after transaction',
    payment_method ENUM('wechat', 'alipay', 'bank', 'cash', 'wallet', 'adjustment', 'refund') NULL,
    reference_type ENUM('booking', 'payment', 'manual', 'system') NOT NULL COMMENT 'Reference type for decoupled architecture',
    reference_id VARCHAR(64) NULL COMMENT 'External reference ID (string format, no direct FK)',
    note TEXT NULL COMMENT 'Transaction description or notes',
    admin_id INT NULL COMMENT 'Admin staff who performed manual adjustment',
    metadata JSON NULL COMMENT 'Additional transaction metadata',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL COMMENT 'When transaction was fully processed'
);
```

#### 3. wallet_adjustments 表
```sql
CREATE TABLE wallet_adjustments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    adjustment_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'Unique adjustment identifier',
    wallet_id BIGINT NOT NULL COMMENT 'Wallet being adjusted',
    adjustment_type ENUM('increase', 'decrease') NOT NULL COMMENT 'Direction of adjustment',
    amount DECIMAL(10,2) NOT NULL COMMENT 'Adjustment amount (always positive)',
    reason VARCHAR(200) NOT NULL COMMENT 'Business reason for adjustment',
    payment_method ENUM('wechat', 'alipay', 'bank', 'cash') NOT NULL COMMENT 'How payment was received/made',
    external_order_no VARCHAR(64) NULL COMMENT 'External payment/order reference',
    admin_id BIGINT NOT NULL COMMENT 'Admin performing the adjustment',
    admin_note TEXT NULL COMMENT 'Additional notes from admin',
    status ENUM('pending', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'pending',
    receipt_required BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether receipt upload is required',
    receipt_uploaded BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether receipt has been uploaded',
    receipt_url VARCHAR(500) NULL COMMENT 'URL to uploaded receipt',
    related_transaction_id BIGINT NULL COMMENT 'Transaction created by this adjustment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT 'When adjustment was completed',
    cancelled_at TIMESTAMP NULL COMMENT 'When adjustment was cancelled'
);
```

#### 4. wallet_freezes 表
```sql
CREATE TABLE wallet_freezes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    freeze_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'Unique freeze identifier',
    wallet_id BIGINT NOT NULL COMMENT 'Wallet being frozen',
    account_id BIGINT NOT NULL COMMENT 'Account owner of wallet',
    freeze_type ENUM('user_request', 'admin_operation') NOT NULL COMMENT 'Who initiated the freeze',
    start_date TIMESTAMP NOT NULL COMMENT 'When freeze starts',
    end_date TIMESTAMP NOT NULL COMMENT 'When freeze ends (max 3 months)',
    original_semi_annual_end_date TIMESTAMP NULL COMMENT 'Original end date before freeze',
    new_semi_annual_end_date TIMESTAMP NULL COMMENT 'Extended end date after freeze',
    status ENUM('active', 'cancelled', 'expired') NOT NULL DEFAULT 'active' COMMENT 'Freeze status',
    reason TEXT NULL COMMENT 'Reason for freeze',
    admin_id BIGINT NULL COMMENT 'Admin who initiated the freeze (for admin operations)',
    cancelled_at TIMESTAMP NULL COMMENT 'When freeze was cancelled',
    cancelled_by ENUM('user', 'admin') NULL COMMENT 'Who cancelled the freeze',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 5. balance_notifications 表
```sql
CREATE TABLE balance_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL COMMENT 'Account receiving notification',
    wallet_id BIGINT NOT NULL COMMENT 'Associated wallet',
    notification_type ENUM('low_balance', 'arrears', 'reminder', 'adjustment', 'booking_alert', 'freeze_reminder', 'penalty_warning') NOT NULL,
    threshold_amount DECIMAL(10,2) NULL COMMENT 'Threshold that triggered notification',
    current_balance DECIMAL(10,2) NOT NULL COMMENT 'Balance at time of notification',
    consumption_amount DECIMAL(10,2) NULL COMMENT 'Consumption amount for semi-annual warnings',
    remaining_days INT NULL COMMENT 'Remaining days for period deadlines',
    message_content TEXT NOT NULL COMMENT 'Notification message content',
    wechat_template_id VARCHAR(64) NULL COMMENT 'WeChat template used',
    wechat_openid VARCHAR(128) NULL COMMENT 'User WeChat openid',
    sent_at TIMESTAMP NULL COMMENT 'When notification was sent',
    status ENUM('pending', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL COMMENT 'Error if sending failed',
    retry_count INT NOT NULL DEFAULT 0 COMMENT 'Number of retry attempts',
    next_retry_at TIMESTAMP NULL COMMENT 'When to retry sending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 实体关系设计

#### 核心关系图
```
users (1) -----> (1) wallet (1) -----> (N) wallet_transactions
                     |                      |
(N) family_account  |                      v
    sharing          |         wallet_adjustments (N)
                     |                      |
                     v                      v
            wallet_freezes (N)       balance_notifications (N)
                     |                      |
                     v                      v
            freeze_history (N)       notification_preferences (1)
```

#### 关键关系说明
1. **User to Wallet**: 一对一关系，每个用户只有一个钱包
2. **Wallet to Transactions**: 一对多关系，每个钱包有多个交易记录
3. **Wallet to Adjustments**: 一对多关系，手动调整记录独立于常规交易
4. **Wallet to Freezes**: 一对多关系，每个钱包可以有多个冻结记录
5. **Wallet to Notifications**: 一对多关系，按钱包跟踪余额通知
6. **Family Account Sharing**: 自引用关系，家庭成员可共享主要账户持有人的钱包

### 数据验证规则

#### 钱包验证规则
- `balance`精度: DECIMAL(10,2) - 支持最高99,999,999.99
- `credit_limit`必须 >= 0
- `frozen_balance`不能超过总可用余额+信用额度
- 钱包状态转换必须遵循业务规则
- `semi_annual_consumption`必须 >= 0
- `semi_annual_end_date`必须 > `semi_annual_start_date`
- `last_recharge_amount`必须 > 0 当不为NULL时

#### 冻结验证规则
- `end_date` - `start_date` 不能超过3个月（90天）
- 同一用户一年内只能有一个有效的冻结记录
- 冻结期间不能有其他冻结记录
- 冻结开始时间不能是过去时间
- 解冻时间必须在冻结期间内

#### 交易验证规则
- `transaction_id`必须是唯一的UUID格式
- `balance_after`必须等于`balance_before + amount`
- `amount`精度必须是2位小数
- 交易类型必须来自预定义枚举

#### 调整验证规则
- `amount`必须为正（方向在`adjustment_type`中）
- `reason`是必填项，不能为空
- `payment_method`必须来自预定义枚举
- 调整只能由授权管理员用户执行

### 索引策略

#### 主要索引
- 所有表都有自增主键
- 业务标识符的唯一约束

#### 外键索引
- 所有外键列都建立索引以提高连接性能
- 常见查询模式的复合索引

#### 查询优化索引
- 钱包表上的`idx_balance`用于基于余额的查询
- 各表上的`idx_created_at`用于基于时间的查询
- `idx_status`用于基于状态的过滤
- `idx_type`用于交易类型过滤

---

## 📝 任务分解清单 (tasks.md)

### 阶段1: 核心钱包基础设施 (3天)

#### Task 1.1: 创建钱包数据库架构
- 创建钱包、钱包交易和相关表
- 正确的DECIMAL精度余额处理
- 外键关系建立
- 性能优化的数据库索引
- 迁移脚本测试和验证

#### Task 1.2: 实现钱包CRUD操作
- 新用户钱包创建
- 带精度处理的余额检索
- 钱包状态管理（活动/冻结/关闭）
- 无效操作的错误处理
- 90%+覆盖率的单元测试

#### Task 1.3: 实现交易记录系统
- 所有余额变更的交易创建
- 带分页的交易历史查询
- 交易类型分类（充值/扣除/调整/退款）
- 交易前后余额跟踪
- 不可变的交易记录

#### Task 1.4: 创建钱包API端点
- GET /api/v1/wallet端点工作
- 带过滤的GET /api/v1/wallet/transactions端点
- GET /api/v1/wallet/balance快速余额检查端点
- 适当的错误响应和状态码
- 带OpenAPI规范的API文档

#### Task 1.5: 实现余额精度处理
- 整个系统保持DECIMAL(10,2)精度
- 无浮点精度错误
- 实现适当的舍入规则
- 余额计算准确性验证
- 极大数的边界情况处理

### 阶段2: 课程预约集成 (3天)

#### Task 2.1: 与预约系统集成费用扣除
- 课程预约时自动200元扣除
- 与现有预约流程集成
- 预约和扣除的原子事务
- 预约失败触发钱包回滚
- 端到端预约流程测试

#### Task 2.2: 实现支持和验证
- 允许钱包余额为负
- 最大额度强制执行（-1000元）
- 带检查的预约验证
- 用户友好的状态显示
- 边界情况处理

#### Task 2.3: 实现取消退款逻辑
- 预约取消时自动200元退款
- 退款交易记录
- 数据库事务内的退款处理
- 退款失败处理和重试逻辑
- 退款历史跟踪

#### Task 2.4: 处理并发交易操作
- 数据库事务隔离
- 余额更新的乐观锁
- 并发预约尝试处理
- 死锁预防和恢复
- 并发用户负载测试

#### Task 2.5: 实现欠费用户预约限制
- 预约API检查钱包状态
- 欠费用户收到适当的错误消息
- 预约UI显示欠费状态
- 特殊情况的绕过机制
- 欠费警告通知

### 阶段3: 运营调整系统 (4天)

#### Task 3.1: 创建钱包调整数据库架构
- 包含所有必填字段的wallet_adjustments表
- 调整状态跟踪（待处理/已完成/已取消）
- 管理员查询的适当索引
- 外键关系建立
- 审计跟踪字段实现

#### Task 3.2: 实现调整后端服务
- 带验证的调整处理
- 必填字段强制执行（原因、支付方式）
- 自动交易记录
- 带交易完整性的余额更新
- 无效调整的错误处理

#### Task 3.3: 创建调整的Web管理员界面
- 用户搜索和选择界面
- 带验证的调整表单
- 实时余额显示
- 所选用户的调整历史
- 收据上传功能

#### Task 3.4: 实现调整工作流和通知
- 调整确认对话框
- 收据要求通知
- 飞书群组通知集成
- 调整成功/失败通知
- 工作流状态跟踪

#### Task 3.5: 创建调整审计日志
- 详细操作日志
- 管理员用户跟踪
- IP地址和用户代理日志
- 之前/之后状态记录
- 审计日志保留和归档

### 阶段4: 通知系统 (3天)

#### Task 4.1: 创建通知数据库架构
- 带适当字段的balance_notifications表
- 通知类型分类
- 状态跟踪（待处理/已发送/失败）
- 重试计数和频率控制
- 通知历史保留

#### Task 4.2: 实现余额阈值检测
- 低于200元的余额检测
- （欠费）检测
- 实时余额监控
- 阈值配置管理
- 检测准确性验证

#### Task 4.3: 集成微信服务通知
- 微信模板消息集成
- 消息模板设计和批准
- 通知传递跟踪
- 失败传递重试逻辑
- 微信API错误处理

#### Task 4.4: 实现通知频率控制
- 同类型通知24小时冷却
- 每用户通知频率跟踪
- 尊重的通知调度
- 用户偏好支持（未来）
- 关键警报的频率绕过

#### Task 4.5: 创建欠费提醒系统
- 时的即时欠费通知
- 预约尝试欠费提醒
- 课前欠费提醒（提前1天）
- 多提醒场景支持
- 提醒升级逻辑

#### Task 4.6: 实现预约时余额检查
- 预约API增加余额检查逻辑
- 余额不足500元时小程序弹窗提醒
- 同时推送微信公众号服务提醒
- 集成现有预约流程，不影响性能
- 余额检查失败的处理逻辑

#### Task 4.7: 实现半年度消费跟踪
- 第一次扣费时启动6个月消费周期跟踪
- 每次扣费更新半年度消费累计
- 半年度结束前1个月提醒逻辑
- 2700元最低消费检查
- 惩罚执行和交易记录创建

#### Task 4.8: 实现钱包冻结管理
- 用户申请冻结API和流程
- 运营后台冻结操作界面
- 冻结期间半年度时间暂停逻辑
- 自动解冻和提醒机制
- 冻解冻操作审计日志

### 阶段5: 高级功能和优化 (3天)

#### Task 5.1: 实现家庭账号钱包共享
- 家庭账号余额共享逻辑
- 多学员钱包关联
- 共享交易历史
- 家庭账号处理
- 家庭中个别学员跟踪

#### Task 5.2: 性能优化
- 数据库查询优化
- 余额查询的Redis缓存
- 交易历史分页优化
- 并发操作性能调整
- 1000+并发用户的负载测试

#### Task 5.3: 安全增强
- 调整操作的增强身份验证
- 请求速率限制
- 输入验证和清理
- SQL注入预防
- 安全审计和渗透测试

#### Task 5.4: 综合测试套件
- 95%+覆盖率的单元测试
- 所有主要流程的集成测试
- 预约和调整的端到端测试
- 半年度消费和冻结功能测试
- 负载下的性能测试
- 财务操作的安全测试

#### Task 5.5: 监控和告警设置
- 余额准确性指标收集
- 交易成功/失败监控
- 通知送达监控
- 半年度惩罚执行监控
- 冻结状态变化监控
- 性能指标仪表板
- 关键问题的告警配置

#### Task 5.6: 通知模板优化
- 设计不同场景的微信通知模板
- 半年度消费提醒模板
- 冻结状态变化通知模板
- 预约余额不足弹窗优化
- 通知频率控制优化

---

## ✅ 质量检查要点 (checklists/requirements.md)

### 需求质量检查
- [ ] 每个用户故事都有明确的优先级 (P0, P1)
- [ ] 每个用户故事都有独立的测试方法
- [ ] 每个用户故事都有完整的验收场景 (Given/When/Then)
- [ ] 边界情况都已考虑并有处理方案
- [ ] 所有功能需求都有FR-XXX编号
- [ ] 每个需求都是具体且可测试的
- [ ] 需求覆盖了所有用户故事
- [ ] 没有模糊或歧义的描述

### 设计质量检查
- [ ] 遵循宪法Principle 1 (简化优先)
- [ ] 技术栈符合AI Coding友好原则
- [ ] 没有引入不必要的复杂性
- [ ] 遵循宪法Principle 2 (数据完整性至上)
- [ ] 关键业务操作使用事务保护
- [ ] 数据模型设计合理
- [ ] 有适当的数据验证机制
- [ ] 遵循宪法Principle 4 (API优先架构)
- [ ] API设计符合RESTful规范
- [ ] 响应格式统一
- [ ] 有适当的错误处理
- [ ] 遵循宪法Principle 8 (安全与合规)
- [ ] 用户数据隔离机制完善
- [ ] 敏感操作有权限控制
- [ ] 输入验证和过滤完善

### 实现质量检查
- [ ] 遵循宪法Principle 3 (可维护性与可读性)
- [ ] 代码结构清晰分层
- [ ] 函数和类的职责单一
- [ ] 有充分的注释说明
- [ ] 遵循宪法Principle 7 (测试驱动的数据操作)
- [ ] 关键业务逻辑有单元测试
- [ ] API端点有集成测试
- [ ] 用户场景有端到端测试
- [ ] 数据库查询优化
- [ ] 适当的缓存策略
- [ ] 前端加载性能优化
- [ ] API响应时间合理

### 文档质量检查
- [ ] 用户故事描述清晰
- [ ] 功能需求具体明确
- [ ] 成功标准可衡量
- [ ] 边界情况考虑充分
- [ ] 技术方案合理可行
- [ ] 数据库设计规范
- [ ] API契约清晰
- [ ] 风险评估充分
- [ ] 任务分解合理
- [ ] 依赖关系明确
- [ ] 完成标准具体
- [ ] 时间估算合理

### 宪法原则遵循检查
- [ ] Principle 1: 简化优先 ✅
- [ ] Principle 2: 数据完整性 ✅
- [ ] Principle 3: 可维护性与可读性 ✅
- [ ] Principle 4: API优先架构 ✅
- [ ] Principle 5: 增量交付 ✅
- [ ] Principle 6: 以用户为中心 ✅
- [ ] Principle 7: 测试驱动的数据操作 ✅
- [ ] Principle 8: 安全与合规 ✅
- [ ] Principle 9: 迁移与集成支持 ✅

### MVP阶段一致性检查
- [ ] 符合当前MVP的范围定义
- [ ] 与前序MVP的依赖关系明确
- [ ] 为后续MVP预留扩展空间
- [ ] 纵向切片策略得到体现

---

## 🎯 关键技术实现细节

### 分布式事务处理

#### 预约扣费原子性
```python
@transaction.atomic
def deduct_course_fee(wallet_id, booking_id, amount=200.00):
    # 1. 获取钱包并加锁
    wallet = Wallet.objects.select_for_update().get(id=wallet_id)

    # 2. 验证额度
    if wallet.balance - amount < wallet.credit_limit:
        raise InsufficientBalanceError("超出额度")

    # 3. 创建交易记录
    transaction = WalletTransaction.objects.create(
        wallet_id=wallet_id,
        transaction_id=generate_transaction_id(),
        type='deduction',
        amount=-amount,
        balance_before=wallet.balance,
        balance_after=wallet.balance - amount,
        reference_type='booking',
        reference_id=str(booking_id),
        note='正式课预约扣费'
    )

    # 4. 更新钱包余额
    wallet.balance -= amount
    wallet.last_transaction_at = timezone.now()
    wallet.save()

    return transaction
```

#### 乐观锁并发控制
```python
def update_wallet_with_optimistic_lock(wallet_id, expected_balance, new_balance):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            updated_count = Wallet.objects.filter(
                id=wallet_id,
                balance=expected_balance
            ).update(
                balance=new_balance,
                updated_at=timezone.now()
            )

            if updated_count == 0:
                # 余额已被其他操作修改，重试
                current_wallet = Wallet.objects.get(id=wallet_id)
                expected_balance = current_wallet.balance
                continue

            return True

        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(0.1 * (attempt + 1))

    raise ConcurrentUpdateError("并发更新失败，请重试")
```

### 支付状态一致性保证

#### 幂等性处理
```python
def process_booking_deduction(booking_id, amount=200.00):
    transaction_id = f"booking_{booking_id}_{int(time.time())}"

    # 检查是否已存在相同的扣费记录
    existing_transaction = WalletTransaction.objects.filter(
        reference_type='booking',
        reference_id=str(booking_id),
        type='deduction'
    ).first()

    if existing_transaction:
        logger.info(f"预约 {booking_id} 已扣费，跳过重复处理")
        return existing_transaction

    # 扣费逻辑
    return deduct_course_fee(
        wallet_id=get_user_wallet_id(booking_id),
        booking_id=booking_id,
        amount=amount
    )
```

#### 补偿机制
```python
@transaction.atomic
def compensate_booking_deduction(booking_id):
    # 查找对应的扣费交易
    deduction_transaction = WalletTransaction.objects.filter(
        reference_type='booking',
        reference_id=str(booking_id),
        type='deduction'
    ).first()

    if not deduction_transaction:
        raise TransactionNotFoundError("未找到对应的扣费记录")

    # 创建退款交易
    refund_transaction = WalletTransaction.objects.create(
        wallet_id=deduction_transaction.wallet_id,
        transaction_id=generate_transaction_id(),
        type='refund',
        amount=-deduction_transaction.amount,  # 负数表示增加余额
        balance_before=deduction_transaction.balance_after,
        balance_after=deduction_transaction.balance_before,
        reference_type='booking',
        reference_id=str(booking_id),
        note='预约取消退款'
    )

    # 恢复钱包余额
    Wallet.objects.filter(id=deduction_transaction.wallet_id).update(
        balance=F('balance') - deduction_transaction.amount,
        updated_at=timezone.now()
    )

    return refund_transaction
```

### 通知频率控制

#### Redis限流实现
```python
def should_send_notification(user_id, notification_type):
    redis_key = f"notification_limit:{user_id}:{notification_type}"

    # 检查是否在24小时内已发送过
    if redis_client.exists(redis_key):
        return False

    # 设置24小时过期
    redis_client.setex(redis_key, 24 * 3600, "1")
    return True

def send_balance_notification(user_id, notification_type, message):
    if not should_send_notification(user_id, notification_type):
        logger.info(f"用户 {user_id} 的 {notification_type} 通知在24小时内已发送过，跳过")
        return False

    try:
        # 发送微信通知
        wechat_result = send_wechat_notification(user_id, message)

        # 记录通知历史
        BalanceNotification.objects.create(
            account_id=user_id,
            wallet_id=get_user_wallet_id(user_id),
            notification_type=notification_type,
            message_content=message,
            status='sent' if wechat_result else 'failed'
        )

        return wechat_result

    except Exception as e:
        logger.error(f"发送通知失败: {e}")
        return False
```

---

## 🔒 财务安全机制

### 资金安全防护

#### 操作审计追踪
```python
class WalletAdjustmentService:

    def create_adjustment(self, admin_user, user_id, amount, reason, payment_method):
        # 1. 记录调整操作
        adjustment = WalletAdjustment.objects.create(
            adjustment_id=generate_adjustment_id(),
            wallet_id=get_user_wallet_id(user_id),
            adjustment_type='increase' if amount > 0 else 'decrease',
            amount=abs(amount),
            reason=reason,
            payment_method=payment_method,
            admin_id=admin_user.id,
            admin_note=f"管理员 {admin_user.name} 手动调整"
        )

        # 2. 记录审计日志
        AuditLog.objects.create(
            admin_user=admin_user,
            action='wallet_adjustment',
            target_user_id=user_id,
            details={
                'adjustment_id': adjustment.adjustment_id,
                'amount': amount,
                'reason': reason,
                'payment_method': payment_method,
                'ip_address': get_client_ip(),
                'user_agent': get_user_agent()
            }
        )

        # 3. 执行余额调整
        return self.process_adjustment(adjustment)
```

#### 权限控制机制
```python
class WalletPermission:

    @staticmethod
    def can_adjust_balance(admin_user):
        return admin_user.has_permission('wallet.adjust_balance')

    @staticmethod
    def can_view_wallet(admin_user, target_user_id):
        # 只有运营可以查看用户钱包
        return admin_user.role == 'operations'

    @staticmethod
    def can_process_refund(admin_user):
        return admin_user.has_permission('wallet.process_refund')

# API权限检查
@require_permission('wallet.adjust_balance')
def api_adjust_wallet_balance(request):
    # 验证管理员权限
    admin_user = request.admin_user

    # 参数验证
    validator = WalletAdjustmentValidator(request.data)
    if not validator.is_valid():
        return ValidationError(validator.errors)

    # 执行调整
    service = WalletAdjustmentService()
    result = service.create_adjustment(
        admin_user=admin_user,
        user_id=validator.validated_data['user_id'],
        amount=validator.validated_data['amount'],
        reason=validator.validated_data['reason'],
        payment_method=validator.validated_data['payment_method']
    )

    return SuccessResponse(result)
```

### 数据完整性保证

#### 财务数据校验
```python
def validate_financial_data():
    errors = []

    # 1. 验证钱包余额与交易记录一致性
    wallets = Wallet.objects.all()
    for wallet in wallets:
        calculated_balance = calculate_balance_from_transactions(wallet.id)
        if abs(wallet.balance - calculated_balance) > 0.01:  # 1分误差容忍
            errors.append(f"钱包 {wallet.id} 余额不一致: {wallet.balance} vs {calculated_balance}")

    # 2. 验证调整记录与交易记录一致性
    adjustments = WalletAdjustment.objects.filter(status='completed')
    for adjustment in adjustments:
        if not adjustment.related_transaction_id:
            errors.append(f"调整 {adjustment.adjustment_id} 缺少对应交易记录")

    # 3. 验证额度
    for wallet in wallets:
        if wallet.balance < wallet.credit_limit:
            errors.append(f"钱包 {wallet.id} 超出额度: {wallet.balance} < {wallet.credit_limit}")

    return errors

# 定时任务执行财务数据校验
@periodic_task(crontab(hour=2, minute=0))  # 每天凌晨2点执行
def daily_financial_validation():
    errors = validate_financial_data()

    if errors:
        # 发送告警给财务团队
        send_alert_to_finance_team("财务数据校验失败", errors)

        # 记录到错误日志
        for error in errors:
            logger.error(f"财务数据校验失败: {error}")
    else:
        logger.info("财务数据校验通过")
```

---

## 📈 性能优化策略

### 缓存策略

#### Redis余额缓存
```python
class WalletCacheService:

    CACHE_TTL = 300  # 5分钟缓存

    @classmethod
    def get_wallet_balance(cls, wallet_id):
        cache_key = f"wallet_balance:{wallet_id}"

        # 尝试从缓存获取
        cached_balance = redis_client.get(cache_key)
        if cached_balance is not None:
            return float(cached_balance)

        # 从数据库获取并缓存
        wallet = Wallet.objects.get(id=wallet_id)
        redis_client.setex(cache_key, cls.CACHE_TTL, str(wallet.balance))

        return wallet.balance

    @classmethod
    def invalidate_wallet_balance(cls, wallet_id):
        cache_key = f"wallet_balance:{wallet_id}"
        redis_client.delete(cache_key)

# 余额更新时自动清理缓存
@receiver(post_save, sender=Wallet)
def invalidate_wallet_cache(sender, instance, **kwargs):
    WalletCacheService.invalidate_wallet_balance(instance.id)
```

#### 查询优化
```python
# 分页查询交易记录
def get_wallet_transactions(wallet_id, page=1, page_size=20, filters=None):
    query = WalletTransaction.objects.filter(wallet_id=wallet_id)

    # 应用过滤条件
    if filters:
        if 'transaction_type' in filters:
            query = query.filter(type=filters['transaction_type'])
        if 'date_from' in filters:
            query = query.filter(created_at__gte=filters['date_from'])
        if 'date_to' in filters:
            query = query.filter(created_at__lte=filters['date_to'])

    # 使用游标分页提高性能
    paginator = CursorPaginator(query, ordering=['-created_at'])
    page = paginator.page(page_size=page_size)

    return {
        'transactions': list(page),
        'has_next': page.has_next,
        'cursor': page.cursor
    }
```

### 数据库优化

#### 索引优化
```sql
-- 钱包余额查询优化
CREATE INDEX idx_wallet_balance ON wallet(balance);

-- 交易记录时间范围查询优化
CREATE INDEX idx_wallet_transactions_created_type ON wallet_transactions(created_at, type);

-- 调整记录状态查询优化
CREATE INDEX idx_wallet_adjustments_status ON wallet_adjustments(status, created_at);

-- 通知发送状态优化
CREATE INDEX idx_balance_notifications_status ON balance_notifications(status, next_retry_at);
```

#### 批量操作优化
```python
def batch_create_notifications(notifications_data):
    # 批量创建通知记录
    notifications = [
        BalanceNotification(
            account_id=data['user_id'],
            wallet_id=data['wallet_id'],
            notification_type=data['type'],
            current_balance=data['balance'],
            message_content=data['message']
        )
        for data in notifications_data
    ]

    BalanceNotification.objects.bulk_create(notifications, batch_size=100)

    # 异步发送通知
    for notification in notifications:
        send_notification_async.delay(notification.id)
```

---

## 🔄 部署和运维

### 部署检查清单

#### 预部署验证
- [ ] 数据库迁移脚本已测试
- [ ] Redis缓存配置正确
- [ ] 微信通知模板已审核
- [ ] 管理员权限配置完成
- [ ] 监控告警规则设置
- [ ] 回滚脚本准备就绪
- [ ] 数据备份策略确认

#### 生产环境部署
- [ ] 数据库迁移执行
- [ ] 应用服务部署
- [ ] Redis缓存预热
- [ ] 微信服务连接测试
- [ ] 监控指标验证
- [ ] 用户访问测试
- [ ] 财务数据校验

### 监控和告警

#### 关键指标监控
```python
# 钱包系统关键指标
WALLET_METRICS = {
    'balance_accuracy': {
        'description': '钱包余额准确性',
        'threshold': 100.0,  # 100%准确性
        'alert_level': 'critical'
    },
    'transaction_success_rate': {
        'description': '交易成功率',
        'threshold': 99.9,  # 99.9%成功率
        'alert_level': 'warning'
    },
    'notification_delivery_rate': {
        'description': '通知送达率',
        'threshold': 95.0,  # 95%送达率
        'alert_level': 'warning'
    },
    'api_response_time': {
        'description': 'API响应时间',
        'threshold': 2.0,  # 2秒
        'alert_level': 'warning'
    }
}
```

#### 告警规则配置
```python
# 财务异常告警
FINANCIAL_ALERTS = [
    {
        'name': '余额不一致告警',
        'condition': 'balance_accuracy < 100',
        'action': '立即通知财务团队',
        'escalation': '5分钟内未处理升级至技术总监'
    },
    {
        'name': '大额调整告警',
        'condition': 'adjustment_amount > 1000',
        'action': '发送告警邮件给财务主管',
        'escalation': '需要双重确认'
    },
    {
        'name': '用户激增告警',
        'condition': 'overdraft_users_rate > 10%',
        'action': '通知运营团队关注',
        'escalation': '连续3天触发升级'
    }
]
```

### 运维操作手册

#### 财务数据修复
```bash
# 钱包余额修复脚本
#!/bin/bash

echo "开始执行钱包余额修复..."

# 1. 备份当前数据
mysqldump -u backup_user -p gymnastic_db wallet wallet_transactions > wallet_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 执行余额校验
python manage.py validate_wallet_balances

# 3. 如果发现不一致，执行修复
python manage.py fix_wallet_balances --confirm

echo "钱包余额修复完成"
```

#### 紧急回滚程序
```python
def emergency_rollback_wallet_system():
    """
    钱包系统紧急回滚程序
    """
    try:
        # 1. 停止所有钱包相关服务
        stop_wallet_services()

        # 2. 回滚数据库迁移
        rollback_database_migrations(['006_wallet_system'])

        # 3. 恢复备份数据
        restore_backup('latest_wallet_backup')

        # 4. 清理Redis缓存
        clear_wallet_cache()

        # 5. 通知相关人员
        send_emergency_notification('钱包系统已回滚至安全状态')

        return True

    except Exception as e:
        logger.error(f"紧急回滚失败: {e}")
        send_emergency_notification(f'紧急回滚失败: {e}', level='critical')
        return False
```

---

## 📊 成功指标和验收标准

### 功能验收标准

#### 核心功能指标
- [ ] 钱包余额查询准确率100%
- [ ] 预约扣费操作准确率100%
- [ ] 余额调整操作成功率99.5%（排除异常情况）
- [ ] 交易记录完整性100%
- [ ] 余额预警通知及时率100%
- [ ] 欠费催缴通知覆盖率100%

#### 性能指标
- [ ] 钱包页面响应时间小于2秒
- [ ] 交易处理时间小于1秒
- [ ] 支持1000+并发用户操作
- [ ] 99.9%系统可用性
- [ ] 95%+通知送达成功率

#### 安全指标
- [ ] 财务数据零泄露
- [ ] 所有操作100%可审计
- [ ] 权限控制100%有效
- [ ] 数据完整性验证通过
- [ ] 安全扫描零高危漏洞

### 业务价值指标

#### 用户体验提升
- [ ] 用户充值流程简化，操作时间减少80%
- [ ] 余额透明度提升，用户查询便利性100%
- [ ] 欠费提醒及时，用户逾期率降低50%
- [ ] 运营响应速度提升，问题处理时间减少70%

#### 运营效率提升
- [ ] 手动调整流程标准化，操作错误率降低90%
- [ ] 财务对账自动化，对账时间减少90%
- [ ] 欠费管理自动化，催缴效率提升300%
- [ ] 报表生成自动化，数据准确性100%

#### 技术债务控制
- [ ] 代码质量评分达到A级
- [ ] 测试覆盖率达到95%+
- [ ] 文档完整性100%
- [ ] 技术架构扩展性良好
- [ ] 系统稳定性达到生产级标准

---

## 📚 总结和后续规划

### 项目总结

MVP-006钱包系统作为百适体操馆的核心财务基础设施，成功实现了完整的钱包管理功能，包括余额查询、预约扣费、运营调整、智能通知和欠费管理等核心功能。系统采用分层架构设计，确保了与其他MVP的解耦和可扩展性；通过分布式事务处理和乐观锁机制，保证了高并发场景下的数据一致性；完善的审计日志和权限控制，为财务安全提供了强有力的保障。

### 关键技术创新

1. **分层架构设计**: 基础钱包服务与业务扩展功能分离，避免了循环依赖问题
2. **机制**: 支持负数余额，最大额度-1000元，提升了业务连续性
3. **解耦设计**: 使用`reference_type`和`reference_id`替代直接外键，提高了系统灵活性
4. **智能通知**: 基于Redis的频率控制，避免了通知骚扰，提升了用户体验
5. **完整审计**: 所有财务操作都有详细记录，满足了合规要求

### 后续发展规划

#### 短期优化（1-2个月）
- 实现自动充值功能，减少人工充值工作量
- 增加钱包分析报表，为运营决策提供数据支持
- 优化通知模板，提升用户阅读体验
- 增加移动端钱包管理功能，提升用户体验

#### 中期扩展（3-6个月）
- 实现多币种支持，为国际化做准备
- 增加积分奖励系统，提升用户粘性
- 实现钱包冻结/解冻功能，增强风险控制
- 开发财务对账自动化系统，提高运营效率

#### 长期规划（6-12个月）
- 构建智能财务分析系统，提供预测和预警
- 实现企业级钱包管理，支持B2B业务场景
- 开放钱包API，支持第三方系统集成
- 构建完整的财务中台，支撑业务快速发展

---

**文档维护**: 本文档需要随着系统迭代持续更新，确保内容与实际实现保持一致。

**审核人**: 技术架构师、产品经理、财务负责人

**最后审核日期**: 2025-11-08
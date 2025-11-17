<!--
Sync Impact Report (v2.0.0 → v2.3.0 - Code Quality & DRY Principles Enhancement)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version: 2.0.0 → 2.3.0 (MAJOR: Code Quality & Maintainability Enhancement)
Ratification Date: 2025-11-08
Last Amended: 2025-11-08 12:00

Modified Principles:
  ✏️ Title updated to "百适体操馆项目宪法" (shortened for clarity)
  ✏️ Principle 9: Expanded to include migration from existing CCMartMeet system
  ✅ Added Principle 10: DRY - 代码复用与禁止重复
  ✅ Added Principle 11: 单一职责与模块化
  ✅ Added Principle 12: 依赖注入与解耦
  ✅ Added Principle 13: 错误处理与日志规范
  ✅ Added Principle 14: 数据库事务与一致性
  ✅ Added Principle 15: API版本控制与向后兼容
  ✅ Added Principle 16: 测试优先与覆盖率要求
  ✅ Added Principle 17: 代码审查与Lint强制执行
  ✅ Added Principle 18: 文档即代码与注释规范

Added Sections:
  ✅ Code Quality & Maintainability Section (Principles 10-18)
  ✅ DRY Implementation Guidelines
  ✅ Shared Code Architecture (/shared/ directory structure)
  ✅ AI Coding Enforcement Standards
  ✅ Automated Quality Tool Integration
  ✅ Enhanced Governance & Checklist Mapping

Key Technical Additions:
  ✅ DRY principle with <5% code duplication threshold
  ✅ Single Responsibility Principle (max 50 lines per function)
  ✅ Dependency Injection with Awilix container
  ✅ Comprehensive error handling with Winston logging
  ✅ Database transaction boundaries for critical operations
  ✅ API versioning strategy (/api/v1/ with backward compatibility)
  ✅ Test-driven development with 80% coverage requirement
  ✅ ESLint + Prettier + jscpd tool chain
  ✅ JSDoc documentation standards
  ✅ Shared module architecture (/shared/utils, /shared/models, etc.)

Implementation Readiness:
  ✅ Ready for immediate AI Coding integration
  ✅ Tool chain configuration included
  ✅ Speckit template enhancement guidelines
  ✅ Quality gate automation setup

Rationale:
  1. Code Maintainability Critical: AI-generated code requires strict quality standards
  2. DRY Enforcement Essential: Prevent code duplication across 8 MVPs
  3. Quality Automation Necessary: Manual review insufficient for AI scale
  4. Shared Architecture Foundation: /shared/ structure enables true code reuse
  5. Long-term Sustainability: Principles ensure code stays maintainable

Templates Requiring Updates:
  ⚠️ All Speckit templates (spec, plan, tasks, checklist, analyze)
  ⚠️ AI Coding Guidelines document
  ⚠️ Project README.md
  ⚠️ Development environment setup scripts

Critical Implementation Dependencies:
  - ESLint configuration for all quality rules
  - jscpd duplicate detection (5% threshold)
  - Jest coverage configuration (80% threshold)
  - Husky pre-commit hooks
  - /shared/ directory structure creation
  - Dependency injection container setup
-->

# 百适体操馆项目宪法

**Project Constitution for CCMartMeet Gymnastics Management System**

---

## 元数据 (Metadata)

| 字段 | 值 |
|------|-----|
| **项目名称** | 百适体操馆运营管理系统 (CCMartMeet) |
| **宪法版本** | 3.0.0 |
| **批准日期** | 2025-11-17 |
| **最后修订** | 2025-11-17 12:00 |
| **适用范围** | 小程序前端、RuoYi管理后台、Spring Boot后端服务、数据库设计、共享代码库 |
| **核心价值** | 简单易用、数据准确、易于维护、分阶段交付、代码复用、质量可控、企业级架构 |

---

## 序言 (Preamble)

本宪法为百适体操馆运营管理系统的开发提供**不可妥协的工程原则**。鉴于：

1. **团队规模**：单人产品经理主导，依赖AI Coding工具实现开发
2. **业务复杂度**：涉及多用户管理、排课约课、钱包交易、飞书数据集成
3. **技术背景**：从CCSmartMeet系统迁移，重构为传统客户端-服务器架构
4. **开发模式**：分阶段迭代上线，无严格deadline，强调长期可维护性
5. **运营优先**：以运营效率为优先，避免过度安全设计增加成本
6. **代码质量**：AI生成代码必须遵循严格的质量标准以确保可维护性
7. **规模需求**：8个MVP模块需要强力的DRY原则防止代码重复

本宪法建立**十八大核心原则**，确保代码质量、系统稳定性和开发效率的平衡。

---

## 核心原则 (Core Principles)

### Principle 1: Simplicity First（简化优先 - AI驱动开发适配）

**原则声明**：
- 所有技术选型必须优先考虑AI Coding工具的熟悉度和代码生成质量
- 避免过度工程化，禁止引入"可能用到"的抽象层
- 每个功能模块必须能在不依赖外部文档的情况下，通过代码注释理解其用途

**技术栈选型（已确认迁移至RuoYi架构）**：

| 层级 | 技术 | 版本 | 选择理由 |
|------|------|------|---------|
| **小程序** | 微信原生框架(MINA) | 基础库 3.11.0+ | 保持不变，微信生态最佳选择 |
| **渲染引擎** | Skyline（可选启用） | 基础库 3.0.0+ | 性能提升，按需在特定页面启用 |
| **管理后台** | RuoYi-Vue-Pro | 最新版本 | 企业级管理后台，代码生成器+RBAC权限 |
| **后台前端栈** | Vue3 + TypeScript + Element Plus + Vite | 最新 | 现代化前端技术栈，开发效率高 |
| **后端** | Spring Boot + MyBatis-Plus | 3.1.x + 3.5.x | 企业级Java框架，生态成熟稳定 |
| **安全框架** | Spring Security + JWT | 6.x + | 完善的安全认证和权限管理 |
| **数据库** | MySQL | 8.0+ | 保持不变，ACID事务支持 |
| **缓存** | Redis | 7.0+ | 高性能缓存，Spring Session支持 |
| **ORM** | MyBatis-Plus | 3.5.x | 强大的ORM框架，代码生成支持 |
| **支付** | 微信支付Java SDK | 最新 | 官方Java版本支付SDK |
| **集成** | 飞书开放平台API | - | 数据导入/同步 |
| **部署** | Spring Boot + Docker | 3.x | 容器化部署，Spring Boot内置支持 |
| **构建工具** | Maven | 3.9.x | Java项目标准化构建工具 |
| **代码生成** | RuoYi代码生成器 | 内置 | 自动生成CRUD代码，提升开发效率 |

**Skyline启用策略**：
- **启用页面**：首页、课程列表、预约日历等高频交互页面
- **保持WebView**：设置页面、表单页面等简单静态页面
- **配置方式**：在页面`.json`文件添加：
  ```json
  {
    "renderer": "skyline",
    "componentFramework": "glass-easel"
  }
  ```

**RuoYi架构开发要求**：
- **MUST**: 基于RuoYi-Vue-Pro脚手架进行开发，充分利用其代码生成器和企业级功能
- **MUST**: 使用RuoYi的RBAC权限管理体系，实现多角色权限控制
- **MUST**: 遵循Spring Boot最佳实践，使用@Configuration和@Component注解
- **MUST**: 数据库操作优先使用MyBatis-Plus提供的Wrapper构造器和BaseMapper
- **MUST**: 前端页面使用Vue3 + Element Plus组件，遵循RuoYi前端开发规范
- **SHOULD**: 充分利用RuoYi代码生成器快速生成CRUD操作
- **SHOULD**: 使用Spring Security + JWT实现统一的安全认证
- **MUST NOT**: 绕过RuoYi框架自行实现重复功能（如权限管理、代码生成等）

**合规检查**：
- 每个MVP开发前评估："如何最大化利用RuoYi现有功能？"
- Plan阶段必须明确标注："RuoYi复用部分" vs "自定义扩展部分"
- 代码审查检查是否正确使用了RuoYi的企业级特性

---

### Principle 2: Data Integrity Above All（数据完整性至上）

**原则声明**：
- 金额、排课、约课、消课数据必须保证强一致性，零容忍数据错误
- 所有涉及钱包扣款、课程预约的操作必须使用数据库事务
- 关键业务逻辑必须有数据审计日志

**具体要求（Spring Boot事务管理）**：
- **MUST**: 使用Spring Boot的`@Transactional`注解保护所有金额变更操作
- **MUST**: 钱包扣款/充值操作必须记录到`wallet_transaction`表，使用Spring事务确保一致性
- **MUST**: 课程预约/取消操作必须记录到`booking_audit_log`表，事务回滚时保证数据完整性
- **MUST**: 使用MyBatis-Plus的`@Version`注解实现乐观锁，防止超售（课程名额、库存锁定）
- **MUST**: 关键表字段使用`NOT NULL`约束和合理的默认值
- **MUST**: 每日增量备份数据库（建议使用Spring Boot定时任务）
- **SHOULD**: 利用Spring Boot Actuator监控事务状态和数据库连接

**合规检查**：
- Plan阶段必须明确标注哪些操作需要事务保护
- Tasks阶段必须包含"数据一致性测试"任务
- 涉及金额的功能必须通过双人核验（产品+技术朋友审查）

---

### Principle 3: Maintainability & Readability（可维护性与可读性）

**原则声明**：
- 代码必须能让"3个月后的自己"或"技术朋友"快速理解
- 项目结构必须清晰分层，避免"意大利面条式"依赖

**具体要求（Spring Boot + Vue3架构）**：
- **MUST**: 后端遵循Spring Boot分层架构（Controller、Service、Repository/Mapper）
- **MUST**: 前端Vue3组件遵循单一职责原则（一个组件只做一件事）
- **MUST**: Java类命名使用语义化命名（如`BookingController.java`、`WalletCard.vue`）
- **MUST**: 关键业务逻辑提取为独立Service方法，避免超过50行的方法体
- **MUST**: 使用Java强类型系统和TypeScript，确保类型安全
- **MUST**: 遵循RuoYi的包结构规范（com.ruoyi.project.模块名）
- **MUST**: Git提交信息遵循约定式提交（Conventional Commits）

**合规检查**：
- Code Review时检查函数长度和复杂度
- 每个功能模块必须有README说明其职责

---

### Principle 4: API-First Architecture（API优先架构）

**原则声明**：
- 前后端通过RESTful API解耦，支持未来多端扩展
- 所有外部集成（飞书、微信支付）通过统一API层封装

**具体要求（Spring Boot RESTful API）**：
- **MUST**: 后端API遵循Spring Boot RESTful规范（@GetMapping、@PostMapping等）
- **MUST**: API响应使用RuoYi统一格式（AjaxResult类）：
  ```json
  {
    "code": 200,
    "msg": "操作成功",
    "data": {}
  }
  ```
- **MUST**: 所有API端点必须有版本前缀（如`/api/v1/bookings`）
- **MUST**: 敏感操作（支付回调）必须验证签名
- **SHOULD**: 使用SpringFox/Swagger3自动生成API文档
- **MUST**: 飞书数据导入通过独立的`/api/v1/feishu/import`端点
- **MUST**: 使用Spring Boot统一异常处理机制

**合规检查**：
- Plan阶段必须定义完整API契约（路径、参数、响应格式）
- 每个API端点必须有对应的集成测试

---

### Principle 5: Incremental Delivery（增量交付 - 纵向切片策略）

**原则声明**：
- 采用**Vertical Slice（纵向切片）**架构，每个MVP完成一个端到端的完整功能
- 每个切片必须包含：数据库表 + 后端API + 前端页面（小程序或Web后台）
- 优先交付小程序端功能，Web后台延后开发

**MVP阶段划分（超细颗粒度）**：

#### MVP-1：用户身份系统（1-2周）⭐⭐⭐⭐⭐
**交付物**：
- 数据库：`user`、`student`、`user_student_relation`表
- 后端：登录API（`/api/v1/auth/login`）、学员CRUD API（`/api/v1/students`）
- 小程序：登录页、学员管理页、切换学员组件
- Web后台：**暂不开发**

**验收标准**：
- ✅ 微信授权登录成功，获取用户OpenID
- ✅ 家长可创建多个学员档案（姓名、年龄、头像）
- ✅ 切换学员时页面顶部显示当前学员名称和头像
- ✅ 切换学员后弹出确认提示："当前操作学员：XXX"

---

#### MVP-2：课程浏览与预约（2-3周）⭐⭐⭐⭐⭐
**交付物**：
- 数据库：`course`、`booking`表
- 后端：课程查询API（`/api/v1/courses`）、预约API（`/api/v1/bookings`）
- 小程序：课程列表页、详情页、预约弹窗
- Web后台：**课程管理页面**（首次开发后台功能，CRUD课程）

**验收标准**：
- ✅ 运营可在后台添加/编辑/删除课程
- ✅ 小程序按年龄筛选课程（儿童/成人）
- ✅ 预约时检查课程剩余名额，满员则提示
- ✅ 预约时锁定库存（使用乐观锁防止超售）

---

#### MVP-3：支付集成（1-2周）⭐⭐⭐⭐
**交付物**：
- 数据库：`payment_order`表
- 后端：支付发起API（`/api/v1/payments/create`）、回调API（`/api/v1/payments/callback`）
- 小程序：集成`wx.requestPayment`
- Web后台：**暂不开发**

**验收标准**：
- ✅ 体验课预约可发起微信支付
- ✅ 支付成功后订单状态更新为"已支付"
- ✅ 支付回调使用官方SDK验证签名（wechatpayv3）
- ✅ 检查订单是否已处理（防止重复回调）

---

#### MVP-4：钱包系统（2-3周）⭐⭐⭐⭐
**交付物**：
- 数据库：`wallet`、`wallet_transaction`表
- 后端：余额查询API（`/api/v1/wallet/my`）、充值API（`/api/v1/admin/wallets/recharge`）
- 小程序：钱包页面、交易记录页
- Web后台：**充值管理页面**（运营人工录入充值金额）

**验收标准**：
- ✅ 运营可在后台为指定用户充值
- ✅ 用户可在小程序查看余额和交易记录
- ✅ 消课后自动扣款（使用数据库事务保护）
- ✅ 每笔交易记录到`wallet_transaction`表

---

#### MVP-5：候补与补课系统（2-3周）⭐⭐⭐
**交付物**：
- 数据库：`waitlist`、`makeup_booking`、`class_credit_compensation`表
- 后端：候补队列API（`/api/v1/waitlist`）、补课API（`/api/v1/makeup`）
- 小程序：候补按钮、补课选择页面
- Web后台：**候补管理页面**

**验收标准**：
- ✅ 课程满员时显示"加入候补"按钮
- ✅ 有空位时微信推送模板消息通知候补用户
- ✅ 用户确认参加后自动预约成功
- ✅ 补课系统支持课时补偿机制

---

#### MVP-6：长期约课系统（3-4周）⭐⭐⭐
**交付物**：
- 数据库：`course_schedule`、`recurring_booking`表
- 后端：排课API（`/api/v1/schedules`）、长期约课API（`/api/v1/bookings/recurring`）
- 小程序：排课日历组件、约课确认页
- Web后台：**排课管理页面**

**验收标准**：
- ✅ 运营可在后台设置长期课程时间表
- ✅ 家长可预约长期班（每周固定时间）
- ✅ 长期约课优先级高于临时约课

---

#### MVP-7：私教课系统（2-3周）⭐⭐⭐
**交付物**：
- 数据库：`private_course`、`private_booking`表
- 后端：私教课API（`/api/v1/private-courses`）、预约API（`/api/v1/private-bookings`）
- 小程序：私教课列表、预约页面
- Web后台：**私教课管理页面**

**验收标准**：
- ✅ 支持一对一私教课预约
- ✅ 教练可在后台添加私教课程
- ✅ 支持灵活的时间安排

---

#### MVP-8：运营工具与数据看板（2-3周）⭐⭐
**交付物**：
- 后端：数据统计API、导出功能
- Web后台：**数据看板、报表导出、用户管理**
- 数据库：优化索引、视图等

**验收标准**：
- ✅ 运营可查看关键业务指标
- ✅ 支持数据导出为Excel
- ✅ 用户管理功能完善

---

**关键原则**：
- **MUST**: 每个MVP必须能独立演示完整业务流程
- **MUST**: 数据库表按需设计，避免过度设计
- **MUST**: 后端API先写测试用例再实现（TDD）
- **SHOULD**: Web后台功能延后至MVP-2及以后
- **MUST NOT**: 在前一个MVP未完成前开始下一个MVP

---

### Principle 6: User-Centric Design（以用户为中心）

**原则声明**：
- 设计决策优先考虑目标用户（家长、教练、管理员）的实际使用场景
- 防呆设计优于事后提醒

**具体要求**：
- **MUST**: 关键操作必须有二次确认（如切换学员身份后的预约确认）
- **MUST**: 错误提示必须清晰说明原因和解决方案（不要只显示"操作失败"）
- **MUST**: 主页必须支持一键跳转到预约/课程/钱包（混合型设计）
- **SHOULD**: 学员切换时显示当前选中学员的头像和姓名
- **SHOULD**: 候补成功通知使用微信服务号模板消息推送

**合规检查**：
- Spec阶段必须包含用户操作流程图
- UI设计必须标注"防误操作"的交互细节

---

### Principle 7: Test-Driven Data Operations（测试驱动的数据操作）

**原则声明**：
- 涉及金额、库存的关键业务逻辑必须先写测试用例
- 数据操作必须可回滚和可审计

**具体要求**：
- **MUST**: 钱包扣款/充值操作必须有单元测试覆盖
- **MUST**: 课程库存锁定逻辑必须有并发测试（模拟多人同时预约）
- **MUST**: 所有数据库迁移脚本必须有回滚脚本
- **SHOULD**: 关键API端点必须有端到端自动化测试
- **MUST**: 测试数据与生产数据严格隔离

**合规检查**：
- Tasks阶段必须包含"编写测试用例"任务（在实现代码前）
- 每个数据库变更必须经过测试环境验证

---

### Principle 8: Security & Compliance（安全与合规 - 极简实用版）

**核心原则**：
- 信任微信登录和微信支付的安全机制
- 重点防护后端API的基本权限控制
- **以运营效率为优先**，避免过度设计

---

#### 一、小程序端（3条必须做的）

**1. 用户数据隔离**
- API必须验证：学员、钱包、订单数据属于当前登录用户
- 实现方式：Spring Security的`@PreAuthorize`注解 + 自定义安全表达式
- 示例代码：
  ```java
  @GetMapping("/students/{studentId}")
  @PreAuthorize("@ss.hasPermission('student:read', #studentId)")
  public AjaxResult getStudent(@PathVariable Long studentId) {
      Student student = studentService.selectStudentByStudentId(studentId);
      if (!studentService.belongsToCurrentUser(studentId)) {
          return AjaxResult.error("无权访问该学员信息");
      }
      return AjaxResult.success(student);
  }
  ```

**2. 微信支付集成**
- 使用微信官方Java SDK
- 在回调接口调用SDK的签名验证方法
- 检查订单是否已处理（防止重复回调）
- 使用Spring Boot的`@Transactional`确保支付状态一致性

**3. JWT Token过期时间**
- 设置30天过期（平衡安全性和用户体验）
- Token存储在小程序storage（微信环境已加密）
- 使用Spring Security JWT处理Token验证

---

#### 二、Web后台端（4条必须做的 - 基于RuoYi）

**1. 管理员登录**
- 使用RuoYi内置的用户名+密码登录系统
- 密码使用BCrypt加密存储（RuoYi内置）
- 集成Spring Security + Session管理

**2. 角色权限控制（RuoYi RBAC）**
- **超级管理员**：全部权限（RuoYi admin角色）
- **运营人员**：查看学员/课程/钱包，手动充值（RuoYi custom角色）
- **教练**：只看自己负责的课程和学员（数据权限）
- **财务**：查看钱包/交易记录，导出报表（菜单权限控制）

**3. 数据直接显示（无需脱敏）**
- 学员姓名、手机号、钱包余额**直接显示**
- 提升运营效率，加快处理速度

**4. 敏感操作审计日志（RuoYi内置）**
- 充值、退款、删除学员操作自动记录日志
- 日志包含：操作人、时间、操作内容、IP地址
- 使用RuoYi的`@Log`注解自动记录操作日志

---

#### 三、基础设施（3条必须做的 - Spring Boot）

**1. HTTPS**
- 生产环境启用SSL证书
- Spring Boot配置SSL（application.yml）

**2. 环境变量**
- 数据库密码、微信AppSecret、支付密钥存储在application.yml
- 使用Spring Boot配置管理和@Value注解
- 支持多环境配置（dev/test/prod）

**3. 数据库备份**
- 每日增量备份（防止数据丢失）
- 使用Spring Boot定时任务@Scheduled自动备份
- 集成RuoYi的系统监控功能

---

#### 四、不需要做的（避免过度设计）

❌ 小程序端数据脱敏（家长看自己孩子信息，无需脱敏）
❌ 后台数据脱敏（运营需要快速查看，直接显示）
❌ 复杂的二次验证（无大额金融操作）
❌ 手机号验证码登录（微信登录已足够）
❌ 私域充值的回调验证（人工录入，无回调风险）
❌ IP白名单（小团队维护成本高）

---

**安全自查清单（RuoYi架构 - 只需5条）**：
- [ ] API是否使用Spring Security验证用户数据权限？
- [ ] 微信支付回调是否使用了官方Java SDK验证？
- [ ] 后台管理员密码是否使用RuoYi BCrypt加密存储？
- [ ] 后台是否实现了RuoYi RBAC角色权限？
- [ ] 生产环境Spring Boot是否配置了HTTPS？

---

### Principle 9: Migration & Integration Support（迁移与集成支持）

**原则声明**：
- 支持从飞书多维表格和现有CCSmartMeet系统平滑迁移数据
- 预留与飞书双向同步的能力
- 兼容现有业务流程和数据结构

**具体要求**：
- **MUST**: 提供飞书数据导入工具（Excel/CSV格式）
- **MUST**: 数据导入前必须校验格式和必填字段
- **MUST**: 导入失败时提供详细错误报告（哪一行哪个字段有问题）
- **MUST**: 支持现有CCSmartMeet用户数据迁移
- **SHOULD**: 后台支持批量数据导出功能
- **SHOULD**: 预留飞书开放平台Webhook接口，支持未来自动同步

**合规检查**：
- MVP-1 必须包含"数据导入工具"的Spec和实现
- 导入逻辑必须有完整的异常处理

---

## Code Quality & Maintainability (代码质量与可维护性原则)

### Principle 10: DRY - 代码复用与禁止重复

**核心理念**
单一真相源（Single Source of Truth）：每段逻辑、每个组件、每份配置只在一个位置定义，其他地方通过引用复用，避免复制粘贴导致维护噩梦。

**强制规则（MUST）**

1. **共享工具库强制复用**
   - 所有跨MVP的通用逻辑（如日期格式化、错误处理、JWT验证）**必须**抽取到`/shared/utils/`目录，禁止在多个MVP中重复实现。
   - 示例：时间校验逻辑（如6小时禁止取消）应在`shared/utils/timeValidator.js`中定义，MVP-002/003/004统一引用。
   - **验证方式**：tasks.md生成时，若检测到重复函数名（如`validateBookingTime`出现在多个文件），自动标记为DRY-VIOLATION并阻塞实现。

2. **组件库先查后创**
   - 小程序端新建UI组件前，**必须**先搜索`/miniprogram/components/shared/`已有组件库，优先复用（如通用Button、Modal、Form），仅在功能差异>30%时创建新组件。
   - 后端API中间件（如权限检查`authMiddleware.js`）全局唯一，禁止MVP各自实现鉴权逻辑。
   - **验证方式**：plan.md生成时，列出"复用组件清单"章节，明确哪些组件引用自共享库，哪些是新创建（需说明理由）。

3. **数据模型统一定义**
   - 跨MVP共享的数据库表（如user、wallet、course）**必须**在`/shared/models/`中定义ORM模型，各MVP导入使用，禁止重复定义Schema。
   - 示例：MVP-001定义`User`模型后，MVP-002/003/004直接引用`const { User } = require('@shared/models/user')`，不得重写`user`表结构。
   - **验证方式**：data-model.md生成时，标注"模型来源"（新建/引用共享），analyze.md检查是否有表名重复定义。

4. **配置集中管理**
   - 环境变量（如数据库连接、微信AppID）、业务常量（如6小时禁止取消阈值）**必须**在`/config/`目录统一管理（使用`dotenv` + `config.js`），禁止硬编码到各MVP代码中。
   - 示例：`config.js`定义`CANCELLATION_DEADLINE_HOURS = 6`，所有MVP引用此变量，后续修改仅需改一处。
   - **验证方式**：spec.md生成时，明确"配置依赖"章节，列出引用的全局配置项；implement阶段禁止使用魔法数字（如直接写`6 * 3600 * 1000`）。

5. **API响应格式标准化**
   - 所有RESTful API响应**必须**使用统一格式（如`{ code, message, data }`），通过`shared/utils/apiResponse.js`工具函数生成，禁止各MVP自定义响应结构。
   - 示例：成功响应`return success(data)`，错误响应`return error(message, code)`，工具函数内部封装格式细节。
   - **验证方式**：api-spec.json生成时，检查所有endpoint响应是否引用`@shared/utils/apiResponse`，非标准格式标记为DRY-VIOLATION。

**推荐规则（SHOULD）**

1. **业务逻辑服务层抽象**
   - 复杂业务逻辑（如候补队列算法、钱包扣费计算）**应该**抽取为独立Service类（如`WaitlistService.js`），供多个MVP或API复用，避免在Controller层重复实现。

2. **样式与主题统一**
   - 小程序/网页端**应该**使用统一的CSS变量（如主色、字体）定义在`/styles/theme.wxss`或`/styles/variables.css`，组件样式引用变量，避免颜色值重复硬编码。

3. **测试工具函数复用**
   - 单元测试中的Mock数据生成（如生成测试用户、测试课程）**应该**抽取到`/tests/fixtures/`，避免每个测试文件重复编写相同Mock逻辑。

**禁止规则（MUST NOT）**

1. **禁止复制粘贴代码**
   - 严禁从一个MVP复制代码到另一个MVP（如复制`validateUser`函数到多个文件），发现重复代码块>15行时，**必须**重构为共享函数。
   - **检测工具**：使用`jscpd`（JavaScript Copy/Paste Detector）在CI流程检测重复代码，重复率>5%拒绝合并。

2. **禁止MVP间直接依赖**
   - MVP-002**不得**直接引用MVP-003的代码（如`require('../mvp-003/utils/helper')`），跨MVP共享逻辑必须上提到`/shared/`目录。

3. **禁止同名文件不同实现**
   - 禁止在多个MVP创建同名但实现不同的文件（如`utils/dateFormatter.js`在MVP-002和MVP-003中都存在但逻辑不同），**必须**合并为统一实现。

---

### Principle 11: 单一职责与模块化（Single Responsibility Principle）

**核心理念**
每个文件/函数/类只做一件事，职责边界清晰，避免"上帝类"(God Class)导致难以测试和修改。

**强制规则**
- **函数职责限制**:单个函数不超过50行代码，超过则必须拆分为子函数；函数只做一件事(如`validateUser`不应同时发送邮件)。
- **文件职责限制**:Controller文件只处理HTTP请求/响应，业务逻辑必须抽离到Service层；Model文件只定义数据结构，不包含业务逻辑。
- **类职责限制**:类的public方法不超过7个，超过则说明职责混乱需重构。

**验证方式**
tasks.md生成时，标注每个Task的职责范围(如"Task: 实现用户登录API - 职责: 验证凭证+生成token,不含发送邮件")；implement阶段运行ESLint规则`max-lines-per-function: 50`。

---

### Principle 12: 明确的依赖注入与解耦（Dependency Injection & Loose Coupling）

**核心理念**
模块间通过接口/依赖注入通信，避免硬编码依赖导致牵一发动全身，降低测试难度。

**强制规则**
- **禁止直接require业务模块**:Controller不得直接`require('../services/UserService')`，必须通过依赖注入容器(如Awilix)管理，便于Mock测试。
- **配置外部化**:数据库连接/第三方API密钥等必须通过`config.js`或环境变量传入，禁止硬编码在Service中。
- **接口优先设计**:跨MVP调用必须先定义接口契约(如`IWalletService`)，实现时遵循接口，便于后期替换实现。

**验证方式**
plan.md中新增"依赖关系图"章节，明确模块间依赖方向；implement阶段检查`require`路径是否指向依赖注入容器。

---

### Principle 13: 强制错误处理与日志规范（Error Handling & Logging Discipline）

**核心理念**
所有可能失败的操作必须显式处理错误，不允许静默失败；统一日志格式，便于问题排查。

**强制规则**
- **全局错误捕获**:Express必须配置全局错误中间件(如`app.use(errorHandler)`)，捕获未处理异常返回统一格式；异步函数必须用try-catch或`.catch()`包裹。
- **分级日志记录**:使用Winston等工具，按ERROR(系统故障)/WARN(业务异常)/INFO(关键操作)分级记录；禁止使用`console.log`调试生产代码。
- **敏感信息保护**:日志中禁止记录密码/Token等敏感信息，错误消息返回给前端时需脱敏。

**验证方式**
checklist.md中新增"错误处理完整性"检查项；implement阶段运行`eslint no-console`规则禁止console.log。

---

### Principle 14: 数据库事务与一致性保证（Transaction & Data Consistency）

**核心理念**
涉及多表操作必须使用事务确保原子性，避免数据不一致(如扣款成功但预约记录未创建)。

**强制规则**
- **关键业务强制事务**:预约+扣款/候补+退款等跨表操作必须包裹在数据库事务中(如Sequelize的`transaction`)，任何步骤失败则全部回滚。
- **乐观锁防并发**:余额扣减/课程容量更新等并发场景必须使用乐观锁(version字段)或Redis分布式锁，防止超卖/重复扣款。
- **幂等性设计**:支付回调/消息队列消费等外部触发接口必须设计为幂等(如通过orderId去重)，防止重复处理。

**验证方式**
data-model.md中标注哪些操作需事务保护；spec.md中明确幂等性要求；tasks.md中标记`[TRANSACTION]`任务。

---

### Principle 15: API版本控制与向后兼容（API Versioning & Backward Compatibility）

**核心理念**
API一旦发布不得破坏性修改，新功能通过版本控制渐进升级，保护已有客户端。

**强制规则**
- **路径版本化**:所有API路径必须包含版本号(如`/api/v1/users`)，新版本不得删除v1已有字段，只能标记为deprecated。
- **字段只增不减**:API响应字段只能新增，不得删除或改类型；若必须修改，需发布v2版本，v1保持3个月过渡期。
- **文档同步更新**:api-spec.json必须标注每个字段的引入版本与废弃状态，生成Swagger文档时自动显示。

**验证方式**
plan.md中新增"API变更影响评估"章节；analyze.md检查API字段是否有删除操作。

---

### Principle 16: 测试优先与覆盖率要求（Test-First & Coverage Standards）

**核心理念**
关键业务逻辑必须先写测试再写实现(TDD思想)，确保代码可测试且质量可控。

**强制规则**
- **单元测试强制覆盖**:Service层业务逻辑单元测试覆盖率>80%，关键路径(如扣费/候补算法)需达到100%；使用Jest编写，禁止跳过测试。
- **集成测试覆盖核心流程**:每个MVP至少包含3条端到端集成测试(主成功路径+2条失败路径)，如预约流程测试"余额充足/余额不足/课程已满"。
- **测试数据隔离**:测试必须使用独立数据库或Mock数据，禁止污染生产/开发环境；使用`beforeEach`清理测试数据。

**验证方式**
tasks.md中每个实现任务后必须跟随测试任务；CI流程强制运行`npm test`，覆盖率不达标拒绝合并。

---

### Principle 17: 代码审查与Lint强制执行（Code Review & Linting Enforcement）

**核心理念**
AI生成代码必须经过自动化Lint检查+人工审查，确保符合团队规范，避免潜在坑点。

**强制规则**
- **ESLint规则配置**:项目根目录`.eslintrc.js`配置规则(如Airbnb规范+自定义规则)，包含`no-var`/`prefer-const`/`no-console`/`max-lines-per-function`等；CI流程运行`eslint .`，有error拒绝合并。
- **Prettier代码格式化**:强制使用Prettier统一代码风格(缩进/引号/分号等)，配置`.prettierrc`，Git Hook在commit前自动格式化。
- **人工审查清单**:每个PR需至少1人审查，审查清单包含"是否复用共享模块/是否包含测试/错误处理是否完整/是否有硬编码配置"等条目。

**验证方式**
package.json配置`husky`+`lint-staged`，在Git commit前自动运行ESLint+Prettier；配置Branch Protection规则强制Code Review。

---

### Principle 18: 文档即代码与注释规范（Documentation as Code & Comment Standards）

**核心理念**
关键逻辑必须配注释说明意图，复杂算法需配文档链接，避免后人看不懂"黑魔法"代码。

**强制规则**
- **JSDoc强制注释**:所有导出的函数/类必须包含JSDoc注释(描述用途/参数/返回值/异常)，如`@param {string} userId - 用户ID @returns {Promise<User>} 用户对象`。
- **复杂逻辑配解释**:超过10行的算法逻辑(如候补队列匹配算法)必须在函数上方注释说明算法思路/边界条件/参考文档链接。
- **README维护**:每个MVP目录需包含README.md，说明模块功能/目录结构/运行方式/依赖；修改时同步更新README。

**验证方式**
tasks.md中包含"文档编写"任务；ESLint配置`jsdoc`插件检查函数注释完整性；CI流程运行`jsdoc-to-markdown`生成API文档。

---

## 治理与合规 (Governance)

### Checklist Mapping (原则与工具链映射)

| 阶段 | 检查原则 | 关键检查项 | Speckit工具 |
|------|---------|-----------|-------------|
| **Spec阶段** | Principle 6, 9, 10, 15 | 用户流程图/数据迁移/DRY清单/API版本 | `/speckit check` |
| **Plan阶段** | Principle 1, 2, 4, 10, 12, 14 | 技术选型/事务设计/依赖关系图/复用分析 | `/speckit plan` |
| **Tasks阶段** | Principle 7, 10, 16, 17, 18 | 测试任务/DRY标记/Lint配置/文档任务 | `/speckit tasks` |
| **Implement阶段** | Principle 3, 5, 11-18 | 代码质量检查/自动化验证/人工审查 | `/speckit analyze` |

### 宪法修订流程
1. 任何原则的修改必须在此文档顶部添加修订记录（Sync Impact Report）
2. 版本号遵循语义化版本控制（Semantic Versioning）
3. 修订后必须同步更新依赖的模板文件（speckit模板、AI Coding指南）

### 合规审查
- **Spec阶段**：检查需求是否符合Principle 6（用户中心）、Principle 9（迁移支持）、Principle 10（DRY）
- **Plan阶段**：检查技术方案是否符合Principle 1（简化）、Principle 2（数据完整性）、Principle 4（API架构）、Principle 12（依赖注入）
- **Tasks阶段**：检查任务是否包含Principle 7（测试驱动）、Principle 16（覆盖率要求）的测试任务
- **Implement阶段**：检查代码是否符合Principle 3（可读性）、Principle 8（安全）、Principle 10-18（代码质量）

### 自动化质量检查
所有代码提交前必须通过以下自动化检查（Java生态工具链）：
```bash
mvn spotless:check   # Google Java Format代码格式检查
mvn spotbugs:check   # SpotBugs静态代码分析
mvn test             # JUnit测试覆盖率检查(>80%)
mvn jacoco:report    # JaCoCo代码覆盖率报告
mvn checkstyle:check # Checkstyle代码规范检查
```

### 例外情况处理
如果特定场景需要暂时偏离某项原则，必须：
1. 在Spec或Plan中显式说明原因
2. 标注`[CONSTITUTION_EXCEPTION: Principle X]`
3. 在后续迭代中评估是否修复

---

## 附录A：共享代码架构 (/shared/ 目录结构)

```
/shared/
├── utils/                    # 工具函数库
│   ├── apiResponse.js       # 统一API响应格式
│   ├── authMiddleware.js    # JWT认证中间件
│   ├── timeValidator.js     # 时间验证工具（6小时规则等）
│   ├── logger.js            # 统一日志工具(Winston)
│   └── errorHandler.js      # 全局错误处理中间件
├── models/                   # 数据库模型（ORM定义）
│   ├── User.js              # 用户模型（MVP-001定义，全局复用）
│   ├── Wallet.js            # 钱包模型
│   ├── Course.js            # 课程模型
│   └── index.js             # 模型导出文件
├── services/                 # 业务逻辑服务层
│   ├── WaitlistService.js   # 候补队列逻辑（MVP-005创建，MVP-002复用）
│   ├── PaymentService.js    # 支付逻辑
│   └── NotificationService.js # 通知服务
├── middleware/               # Express中间件
│   ├── auth.js              # 认证中间件
│   ├── validation.js        # 请求验证中间件
│   └── rateLimit.js         # 限流中间件
├── constants/                # 业务常量
│   ├── errorCodes.js        # 标准错误码
│   ├── timeConstants.js     # 时间相关常量（如6小时取消限制）
│   └── apiVersions.js       # API版本定义
└── __tests__/                # 共享模块测试
    ├── utils/               # 工具函数测试
    ├── services/            # 服务层测试
    └── fixtures/            # 测试数据
```

### 使用规范
1. **新增共享模块**：必须先评估是否会被≥2个MVP复用
2. **版本管理**：共享模块修改必须在CHANGELOG记录影响范围
3. **测试要求**：所有共享模块必须有单元测试，覆盖率>90%
4. **文档要求**：每个共享模块必须有JSDoc注释和使用示例

---

## 附录B：关键业务规则速查表

| 业务场景 | 规则 | 对应原则 | 共享模块 |
|---------|------|---------|---------|
| 学员切换 | 单微信ID绑定多学员，切换时强提醒当前学员 | Principle 6 | `shared/utils/authMiddleware.js` |
| 钱包共享 | 家庭账号下所有学员共享钱包余额 | Principle 2 | `shared/models/Wallet.js` |
| 排课优先级 | 长期约课 > 临时约课，先到先得 | Principle 2 | `shared/services/BookingService.js` |
| 课程满员 | 提供候补机制,有空位时微信推送 | Principle 6 | `shared/services/WaitlistService.js` |
| 支付方式 | 体验课微信支付，正式课私域转账人工录入 | Principle 8 | `shared/services/PaymentService.js` |
| 数据迁移 | 支持从飞书Excel导入，带校验和错误报告 | Principle 9 | `shared/utils/dataImporter.js` |
| 6小时取消 | 预约后6小时内禁止取消 | Principle 10 | `shared/utils/timeValidator.js` |
| API响应格式 | 统一使用{code, message, data}格式 | Principle 10 | `shared/utils/apiResponse.js` |

---

## 附录C：自动化质量工具配置

### Checkstyle 配置 (checkstyle.xml)
```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
    <property name="charset" value="UTF-8"/>
    <property name="severity" value="warning"/>
    <property name="fileExtensions" value="java"/>

    <module name="TreeWalker">
        <module name="OuterTypeFilename"/>
        <module name="IllegalTokenText"/>
        <module name="AvoidEscapedUnicodeCharacters"/>
        <module name="LineLength">
            <property name="max" value="120"/>
        </module>
        <module name="AvoidStarImport"/>
        <module name="OneTopLevelClass"/>
        <module name="NoLineWrap"/>
        <module name="EmptyBlock"/>
        <module name="NeedBraces"/>
        <module name="LeftCurly"/>
        <module name="RightCurly"/>
        <module name="WhitespaceAround"/>
        <module name="OneStatementPerLine"/>
        <module name="MultipleVariableDeclarations"/>
        <module name="ArrayTypeStyle"/>
        <module name="MissingSwitchDefault"/>
        <module name="FallThrough"/>
        <module name="UpperEll"/>
        <module name="ModifierOrder"/>
        <module name="EmptyLineSeparator"/>
        <module name="SeparatorWrap"/>
        <module name="PackageName"/>
        <module name="TypeName"/>
        <module name="MemberName"/>
        <module name="ParameterName"/>
        <module name="LocalVariableName"/>
        <module name="ClassTypeParameterName"/>
        <module name="MethodTypeParameterName"/>
        <module name="InterfaceTypeParameterName"/>
        <module name="NoFinalizer"/>
        <module name="GenericWhitespace"/>
        <module name="Indentation"/>
        <module name="AbbreviationAsWordInName"/>
        <module name="OverloadMethodsDeclarationOrder"/>
        <module name="VariableDeclarationUsageDistance"/>
        <module name="CustomImportOrder"/>
        <module name="MethodParamPad"/>
        <module name="ParenPad"/>
        <module name="OperatorWrap"/>
        <module name="AnnotationLocation"/>
        <module name="NonEmptyAtclauseDescription"/>
        <module name="JavadocMethod"/>
        <module name="JavadocType"/>
        <module name="JavadocVariable"/>
        <module name="JavadocStyle"/>
    </module>
</module>
```

### SpotBugs 配置 (spotbugs.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<FindBugsFilter>
    <Match>
        <Bug code="NP_NULL_ON_SOME_PATH_FROM_RETURN_VALUE"/>
        <Priority value="1"/>
    </Match>
    <Match>
        <Bug pattern="EI_EXPOSE_REP,EI_EXPOSE_REP2"/>
        <Priority value="2"/>
    </Match>
</FindBugsFilter>
```

### JaCoCo 覆盖率配置 (pom.xml插件配置)
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.8</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <rules>
            <rule>
                <element>BUNDLE</element>
                <limits>
                    <limit>
                        <counter>INSTRUCTION</counter>
                        <value>COVEREDRATIO</value>
                        <minimum>0.80</minimum>
                    </limit>
                </limits>
            </rule>
        </rules>
    </configuration>
</plugin>
```

---

## 附录D：MVP优先级矩阵

| MVP | 核心价值 | 技术风险 | 开发周期 | 优先级 | 依赖关系 | 共享模块贡献 |
|-----|---------|---------|---------|--------|---------|-------------|
| MVP-1 | ⭐⭐⭐⭐⭐ | 低 | 1-2周 | P0 | 无 | User/Auth基础模块 |
| MVP-2 | ⭐⭐⭐⭐⭐ | 中 | 2-3周 | P0 | 依赖MVP-1 | Course/Booking模块 |
| MVP-3 | ⭐⭐⭐⭐ | 高 | 1-2周 | P0 | 依赖MVP-2 | Payment模块 |
| MVP-4 | ⭐⭐⭐⭐ | 中 | 2-3周 | P1 | 依赖MVP-3 | Wallet核心模块 |
| MVP-5 | ⭐⭐⭐ | 中 | 2-3周 | P1 | 依赖MVP-4 | Waitlist/Makeup模块 |
| MVP-6 | ⭐⭐⭐ | 高 | 3-4周 | P1 | 依赖MVP-2 | Schedule模块 |
| MVP-7 | ⭐⭐⭐ | 中 | 2-3周 | P2 | 依赖MVP-2 | PrivateCourse模块 |
| MVP-8 | ⭐⭐ | 低 | 2-3周 | P2 | 依赖所有 | Dashboard/Export模块 |

**说明**：
- **P0**：必须完成（核心业务）
- **P1**：重要功能（提升体验）
- **P2**：锦上添花（可延后）

---

## 附录E：技术栈版本清单（RuoYi架构）

| 层级 | 技术 | 版本 | 安装命令 | 质量工具 |
|------|------|------|---------|---------|
| 小程序 | 微信开发者工具 | 最新稳定版 | 官网下载 | - |
| 后端 | Java JDK | 17+ | `java --version` | SpotBugs, SonarQube |
| 后端框架 | Spring Boot | 3.1.x | Maven依赖 | ✅ |
| 安全框架 | Spring Security | 6.x | Maven依赖 | ✅ |
| 数据库 | MySQL | 8.0+ | 官网下载 | - |
| 缓存 | Redis | 7.0+ | 官网下载 | - |
| ORM | MyBatis-Plus | 3.5.x | Maven依赖 | ✅ |
| 支付SDK | 微信支付Java SDK | 最新 | Maven依赖 | ✅ |
| 管理后台 | RuoYi-Vue-Pro | 最新 | 克隆源码 | ✅ |
| 前端框架 | Vue3 | 3.3.x | `npm install vue@3` | ✅ |
| UI组件库 | Element Plus | 2.4.x | `npm install element-plus` | ✅ |
| 构建工具 | Vite | 5.x | `npm install vite` | ✅ |
| 包管理 | Maven | 3.9.x | `mvn --version` | ✅ |
| 代码质量 | SpotBugs | 最新 | Maven插件 | ✅ |
| 代码格式 | Google Java Format | 最新 | IDE插件 | ✅ |
| 测试框架 | JUnit + Mockito | 最新 | Maven依赖 | ✅ |
| API文档 | SpringFox Swagger3 | 最新 | Maven依赖 | ✅ |

---

**本宪法自2025年11月17日12:00起生效，版本号v3.0.0。**

**所有后续开发活动必须基于RuoYi架构进行，遵循本宪法的十八大核心原则，并通过自动化质量检查验证。**

**Spring Boot + MyBatis-Plus技术栈开发必须严格符合RuoYi企业级开发规范和代码质量要求。**
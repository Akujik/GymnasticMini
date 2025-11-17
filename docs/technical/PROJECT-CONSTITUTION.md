# 百适体操馆项目宪法 - 完整版本

**Project Constitution for CCMartMeet Gymnastics Management System**

**宪法版本**: 2.3.0
**批准日期**: 2025-11-08
**最后修订**: 2025-11-08 12:00
**适用范围**: 小程序前端、Web后台、后端服务、数据库设计、共享代码库
**核心价值**: 简单易用、数据准确、易于维护、分阶段交付、代码复用、质量可控

---

## 📋 元数据 (Metadata)

| 字段 | 值 |
|------|-----|
| **项目名称** | 百适体操馆运营管理系统 (CCMartMeet) |
| **宪法版本** | 2.3.0 |
| **批准日期** | 2025-11-08 |
| **最后修订** | 2025-11-08 12:00 |
| **适用范围** | 小程序前端、Web后台、后端服务、数据库设计、共享代码库 |
| **核心价值** | 简单易用、数据准确、易于维护、分阶段交付、代码复用、质量可控 |

---

## 📜 序言 (Preamble)

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

## 🎯 核心原则 (Core Principles)

### 第一类：基础原则 (Principle 1-9)

#### Principle 1: Simplicity First（简化优先 - AI驱动开发适配）

**原则声明**：
- 所有技术选型必须优先考虑AI Coding工具的熟悉度和代码生成质量
- 避免过度工程化，禁止引入"可能用到"的抽象层
- 每个功能模块必须能在不依赖外部文档的情况下，通过代码注释理解其用途

**技术栈选型（已调研确认）**：

| 层级 | 技术 | 版本 | 选择理由 |
|------|------|------|---------|
| **小程序** | 微信原生框架(MINA) | 基础库 3.11.0+ | AI Coding支持度最高，官方文档完善 |
| **渲染引擎** | Skyline（可选启用） | 基础库 3.0.0+ | 性能提升，按需在特定页面启用 |
| **后台前端** | React + TypeScript + Ant Design Pro | 3.x | 成熟UI组件库，开发效率高 |
| **后端** | Python FastAPI | 0.100+ | 异步高性能，AI Coding友好 |
| **数据库** | MySQL | 8.0+ | 关系型数据库，支持ACID事务 |
| **ORM** | SQLAlchemy | 2.x | Python标准ORM工具 |
| **认证** | JWT + 微信OpenID | - | 双重身份验证 |
| **支付** | 微信支付API | v3 | 官方SDK（wechatpayv3） |
| **集成** | 飞书开放平台API | - | 数据导入/同步 |
| **部署** | Docker + Nginx | - | 容器化部署 |

**具体要求**：
- **MUST**: 使用上述技术栈，不得引入未列出的框架
- **MUST**: 每个函数/方法添加中文注释说明输入输出和业务逻辑
- **MUST**: 避免自定义DSL、元编程、过度抽象的设计模式
- **SHOULD**: 优先使用框架内置功能，而非第三方库
- **MUST NOT**: 引入需要专业DevOps知识才能部署的技术栈

---

#### Principle 2: Data Integrity Above All（数据完整性至上）

**原则声明**：
- 金额、排课、约课、消课数据必须保证强一致性，零容忍数据错误
- 所有涉及钱包扣款、课程预约的操作必须使用数据库事务
- 关键业务逻辑必须有数据审计日志

**具体要求**：
- **MUST**: 使用MySQL的ACID事务保护所有金额变更
- **MUST**: 钱包扣款/充值操作必须记录到`wallet_transaction`表
- **MUST**: 课程预约/取消操作必须记录到`booking_audit_log`表
- **MUST**: 实现乐观锁机制防止超售（课程名额、库存锁定）
- **MUST**: 关键表字段使用`NOT NULL`约束和合理的默认值
- **MUST**: 每日增量备份数据库（建议使用自动化脚本）

---

#### Principle 3: Maintainability & Readability（可维护性与可读性）

**原则声明**：
- 代码必须能让"3个月后的自己"或"技术朋友"快速理解
- 项目结构必须清晰分层，避免"意大利面条式"依赖

**具体要求**：
- **MUST**: 后端遵循MVC分层架构（Model、Service、Controller）
- **MUST**: 前端组件遵循单一职责原则（一个组件只做一件事）
- **MUST**: 文件命名使用语义化命名（如`booking_service.py`、`WalletCard.vue`）
- **MUST**: 关键业务逻辑提取为独立函数，避免超过50行的函数体
- **SHOULD**: 使用类型提示（Python Type Hints、Vue3 TypeScript）
- **MUST**: Git提交信息遵循约定式提交（Conventional Commits）

---

#### Principle 4: API-First Architecture（API优先架构）

**原则声明**：
- 前后端通过RESTful API解耦，支持未来多端扩展
- 所有外部集成（飞书、微信支付）通过统一API层封装

**具体要求**：
- **MUST**: 所有API路径包含版本前缀（如：`/api/v1/bookings`）
- **MUST**: 统一响应格式：`{code, message, data, timestamp}`
- **MUST**: 使用标准HTTP状态码（200成功，4xx客户端错误，5xx服务端错误）
- **MUST**: API文档使用FastAPI自动生成的Swagger UI
- **SHOULD**: 实现API限流和缓存机制

---

#### Principle 5: Incremental Delivery（增量交付 - 纵向切片策略）

**原则声明**：
- 每个MVP必须能独立交付并产生业务价值
- 采用纵向切片而非水平切片，确保每个阶段都有完整的用户体验

**具体要求**：
- **MUST**: 每个MVP包含前端界面、后端API、数据库表设计
- **MUST**: MVP之间有明确的依赖关系和上线顺序
- **MUST**: 实现数据迁移脚本，确保平滑升级
- **SHOULD**: 每个MVP上线后收集用户反馈，指导下个阶段开发

**MVP依赖关系**：
```
MVP-001 (用户身份) → MVP-002 (课程预约) → MVP-003 (等候补课)
                     ↓
MVP-004 (私教课) → MVP-005 (支付) → MVP-006 (钱包)
                                          ↓
MVP-007 (管理后台) ← MVP-008 (标签系统)
```

---

#### Principle 6: User-Centric Design（以用户为中心）

**原则声明**：
- 所有功能设计必须从用户实际使用场景出发
- 简化操作流程，减少用户认知负担

**具体要求**：
- **MUST**: 用户能在3步内完成核心操作（如预约课程）
- **MUST**: 错误信息友好易懂，提供明确的解决建议
- **MUST**: 关键操作有确认提示，避免误操作
- **SHOULD**: 实现操作引导和帮助提示

---

#### Principle 7: Test-Driven Data Operations（测试驱动的数据操作）

**原则声明**：
- 所有涉及数据变更的操作必须有对应的测试用例
- 关键业务逻辑必须有单元测试和集成测试覆盖

**具体要求**：
- **MUST**: 测试覆盖率不低于80%
- **MUST**: 金额相关操作必须有精确到分的测试用例
- **MUST**: 边界条件（如最大预约数、最小充值额）必须有测试
- **SHOULD**: 使用Mock测试隔离外部依赖

---

#### Principle 8: Security & Compliance（极简安全与合规）

**原则声明**：
- 在满足业务需求的前提下，采用最简单的安全策略
- 信任微信生态系统的安全保障

**具体要求**：
- **MUST**: 使用JWT进行API认证，避免复杂的RBAC系统
- **MUST**: 信任微信OpenID，不进行额外的身份验证
- **MUST**: 敏感操作记录操作日志，但不进行实时监控
- **MUST**: 遵循微信小程序开发规范和数据隐私要求
- **SHOULD**: 实现基础的SQL注入防护

---

#### Principle 9: Migration & Integration Support（迁移与集成支持）

**原则声明**：
- 系统必须支持从现有CCSmartMeet系统的平滑数据迁移
- 预留与飞书、微信支付等第三方系统的集成接口

**具体要求**：
- **MUST**: 设计数据迁移脚本，确保历史数据完整性
- **MUST**: 实现与飞书API的数据同步机制
- **MUST**: 微信支付集成使用官方SDK，确保合规性
- **SHOULD**: 设计通用数据导入/导出接口

---

### 第二类：质量原则 (Principle 10-18)

#### Principle 10: DRY - Code Reuse & Duplication Prevention（代码复用与禁止重复）

**原则声明**：
- 代码重复率必须控制在5%以内，使用jscpd工具检测
- 所有可复用的逻辑必须抽取到共享模块(/shared/目录)
- 禁止复制粘贴代码，所有重复逻辑必须重构为共享函数

**具体要求**：
- **MUST**: 代码重复率检查通过 `npm run dry:check`，<5%通过
- **MUST**: 使用shared/utils/apiResponse.js统一API响应格式
- **MUST**: 使用shared/utils/logger.js统一日志记录格式
- **MUST**: 使用shared/constants/errorCodes.js标准错误码
- **MUST**: 使用shared/middleware/authMiddleware.js统一认证
- **MUST**: 无硬编码魔法数字，使用shared/constants/配置常量
- **MUST**: 小程序组件库复用（列出复用组件清单）

**共享模块架构**：
```
shared/
├── utils/           # 工具函数
│   ├── apiResponse.js
│   ├── logger.js
│   ├── validator.js
│   └── timeValidator.js
├── services/        # 业务服务
│   ├── fourDimensionalMatcher.js
│   ├── pricingService.js
│   └── notificationService.js
├── middleware/      # 中间件
│   ├── authMiddleware.js
│   └── errorHandler.js
├── models/         # 数据模型
│   └── baseModel.js
└── constants/      # 常量定义
    ├── errorCodes.js
    └── timeConstants.js
```

---

#### Principle 11: Single Responsibility & Modularity（单一职责与模块化）

**原则声明**：
- 每个函数必须职责单一，代码行数<50行
- 每个文件必须只有一个主要职责
- 避免循环依赖，保持模块间清晰的依赖关系

**具体要求**：
- **MUST**: Controller文件只处理HTTP请求/响应，不含业务逻辑
- **MUST**: Service层函数<50行代码，职责单一
- **MUST**: Model文件只定义数据结构，不含业务逻辑
- **MUST**: 函数复杂度<10（通过ESLint complexity检查）
- **MUST**: 每个文件只有一个主要职责
- **MUST**: 模块间依赖关系清晰，无循环依赖

---

#### Principle 12: Dependency Injection & Decoupling（依赖注入与解耦）

**原则声明**：
- 使用依赖注入避免硬编码依赖关系
- 配置通过环境变量或config.js外部化
- Controller不直接require业务模块

**具体要求**：
- **MUST**: Controller不直接require业务模块
- **MUST**: 使用依赖注入容器管理依赖
- **MUST**: 配置通过process.env和config.js外部化
- **MUST**: 模块间依赖关系清晰，无循环依赖

**依赖关系图**：
```
[Frontend] ←→ [Controller] ←→ [Service] ←→ [Model] ←→ [Database]
                ↑              ↑              ↑
            shared/middleware shared/services shared/models
```

---

#### Principle 13: Comprehensive Error Handling & Logging（强制错误处理与日志规范）

**原则声明**：
- 所有async函数必须包含try-catch
- 使用统一错误响应格式和日志记录
- 关键业务操作必须记录日志

**具体要求**：
- **MUST**: 所有async函数包含try-catch
- **MUST**: 使用shared/utils/logger.js统一日志格式
- **MUST**: 错误信息使用shared/constants/errorCodes.js标准错误码
- **MUST**: 敏感信息已脱敏处理
- **MUST**: 无console.log在生产代码中

**错误处理层级**：
1. **Controller层**: 使用shared/utils/apiResponse.js统一响应格式
2. **Service层**: 使用shared/constants/errorCodes.js标准错误码
3. **全局中间件**: 捕获未处理异常，返回统一错误格式
4. **日志记录**: 使用shared/utils/logger.js分级记录

---

#### Principle 14: Database Transaction & Consistency Guarantee（数据库事务与一致性保证）

**原则声明**：
- 跨表操作必须使用数据库事务保护
- 涉及金额操作强制事务
- 使用乐观锁防止并发冲突

**具体要求**：
- **MUST**: 跨表操作使用数据库事务保护
- **MUST**: 涉及金额操作强制事务
- **MUST**: 使用乐观锁防止并发冲突
- **MUST**: 关键操作支持幂等性

**需要事务保护的操作**：
- 跨表操作1: 预约创建+名额扣减
- 跨表操作2: 支付处理+余额更新
- 涉及金额操作: 强制使用数据库事务

**并发控制**：
- 使用乐观锁防止并发场景1
- 使用Redis锁防止并发场景2
- 幂等性设计: 关键操作名称

---

#### Principle 15: API Versioning & Backward Compatibility（API版本控制与向后兼容）

**原则声明**：
- API路径包含版本前缀/api/v1/
- 响应字段只增不减
- 废弃字段标记deprecated

**具体要求**：
- **MUST**: API路径包含版本前缀/api/v1/
- **MUST**: 响应字段只增不减
- **MUST**: 废弃字段标记deprecated
- **MUST**: API文档自动生成并更新

**版本管理**：
- 当前版本: /api/v1/
- 响应格式: {code, message, data, timestamp}
- 字段变更策略: 只增不减，旧字段标记deprecated

**兼容性检查**：
- 新增字段: ✅ 兼容
- 修改字段: ❌ 需要新版本
- 删除字段: ❌ 需要新版本

---

#### Principle 16: Test-First & Coverage Requirements（测试优先与覆盖率要求）

**原则声明**：
- 整体测试覆盖率>80%
- 核心业务逻辑覆盖率=100%
- 共享模块测试覆盖率>90%

**具体要求**：
- **MUST**: 整体测试覆盖率>80%（npm test检查）
- **MUST**: 核心业务逻辑覆盖率=100%
- **MUST**: 共享模块测试覆盖率>90%
- **MUST**: API端点完整覆盖
- **MUST**: 单元测试、集成测试、端到端测试完整

**Test Coverage Requirements**:
- 整体覆盖率: > 80%
- 核心业务逻辑: = 100%
- 共享模块: > 90%
- API端点: 完整覆盖

**Quality Gates**:
```bash
npm run lint      # ESLint检查通过
npm run test      # 测试覆盖率达标
npm run dry:check # 代码重复率<5%
npm run format    # 代码格式统一
```

---

#### Principle 17: Code Review & Lint Enforcement（代码审查与Lint强制执行）

**原则声明**：
- ESLint检查无error
- Prettier格式检查通过
- 函数包含JSDoc注释
- Git提交信息规范

**具体要求**：
- **MUST**: ESLint检查无error（npm run lint）
- **MUST**: Prettier格式检查通过（npm run format:check）
- **MUST**: 函数包含JSDoc注释
- **MUST**: Git提交信息规范
- **MUST**: 代码审查已完成

**Code Review Checklist**:
- ESLint检查无error
- Prettier格式检查通过
- 代码重复率<5%
- 函数复杂度<10
- JSDoc注释完整性
- 业务逻辑正确性
- 安全检查通过

---

#### Principle 18: Documentation as Code & Comment Standards（文档即代码与注释规范）

**原则声明**：
- 所有导出函数包含JSDoc注释
- JSDoc包含参数、返回值、异常说明
- 复杂算法有注释说明

**具体要求**：
- **MUST**: 所有导出函数包含JSDoc注释
- **MUST**: JSDoc包含参数、返回值、异常说明
- **MUST**: 复杂算法有注释说明
- **MUST**: README文档完整且最新
- **MUST**: API文档自动生成

**JSDoc注释示例**：
```javascript
/**
 * 创建用户预约
 *
 * @description 创建新的课程预约，包含业务规则验证和库存检查
 * @param {Object} bookingData - 预约数据
 * @param {string} bookingData.userId - 用户ID
 * @param {string} bookingData.courseId - 课程ID
 * @param {Date} bookingData.bookingTime - 预约时间
 * @returns {Promise<Object>} 创建的预约记录
 * @throws {ValidationError} 当预约数据无效时
 * @throws {BusinessError} 当业务规则不满足时
 * @example
 * const booking = await createBooking({
 *   userId: 'user123',
 *   courseId: 'course456',
 *   bookingTime: new Date('2025-12-01T10:00:00Z')
 * });
 */
async function createBooking(bookingData) {
  // 实现逻辑
}
```

---

## 🛠️ 实施保障机制

### 自动化质量工具链
```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.ts,.vue",
    "lint:fix": "eslint . --ext .js,.ts,.vue --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "dry:check": "jscpd . --min-lines 10",
    "dry:report": "jscpd . --min-lines 10 --reporters html",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "build": "npm run lint && npm test && npm run dry:check"
  }
}
```

### Git Hooks配置
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run build"
    }
  },
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### CI/CD质量门禁
- **代码检查**: ESLint + Prettier自动修复
- **重复检测**: jscpd < 5%阈值
- **测试覆盖**: Jest > 80%覆盖率
- **构建验证**: 所有质量检查通过

---

## 📊 宪法合规性检查清单

### 原则遵循验证
每个MVP开发完成后必须进行宪法原则合规性检查：

- [ ] **Principle 1**: 简化优先 - AI驱动开发适配
- [ ] **Principle 2**: 数据完整性至上
- [ ] **Principle 3**: 可维护性与可读性
- [ ] **Principle 4**: API优先架构
- [ ] **Principle 5**: 增量交付
- [ ] **Principle 6**: 以用户为中心
- [ ] **Principle 7**: 测试驱动的数据操作
- [ ] **Principle 8**: 安全与合规
- [ ] **Principle 9**: 迁移与集成支持
- [ ] **Principle 10**: DRY - 代码复用与禁止重复
- [ ] **Principle 11**: 单一职责与模块化
- [ ] **Principle 12**: 依赖注入与解耦
- [ ] **Principle 13**: 强制错误处理与日志规范
- [ ] **Principle 14**: 数据库事务与一致性保证
- [ ] **Principle 15**: API版本控制与向后兼容
- [ ] **Principle 16**: 测试优先与覆盖率要求
- [ ] **Principle 17**: 代码审查与Lint强制执行
- [ ] **Principle 18**: 文档即代码与注释规范

### 质量指标监控
- **代码重复率**: < 5%（jscpd检测）
- **测试覆盖率**: > 80%（Jest统计）
- **ESLint错误**: 0个（严格模式）
- **函数复杂度**: < 10（ESLint规则）
- **代码行数**: 函数< 50行

---

## 🔄 修订与治理

### 宪法修订流程
1. **提案**: 任何团队成员可提交宪法修订提案
2. **评审**: 核心团队进行技术影响评估
3. **投票**: 超过2/3成员同意方可修订
4. **公示**: 修订内容需在团队内公示7天
5. **生效**: 公示期结束后正式生效

### 合规性监督
- **阶段检查**: 每个MVP开发阶段完成后进行合规性检查
- **工具验证**: 自动化工具持续监控代码质量指标
- **定期审计**: 每月进行宪法遵循情况审计
- **违规处理**: 发现违规必须立即整改并记录

---

## 📞 联系与支持

**宪法维护者**: 产品经理 + 技术负责人
**技术支持**: AI Coding工具链支持
**最后更新**: 2025-11-08
**文档状态**: 当前生效版本

---

**声明**: 本宪法为百适体操馆运营管理系统开发的最高指导原则，所有开发活动必须严格遵守。任何违反宪法原则的技术决策都需要经过正式的修订流程。

**Synch Impact Report**: 本文档已整合从v2.0.0到v2.3.0的所有代码质量和DRY原则增强内容，为AI Coding开发提供了完整的质量保障框架。
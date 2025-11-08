# 实施任务： User Identity System

**Feature**: 001-user-identity-system
**创建时间**: 2025-10-26
**Total Tasks**: 67

## Phase 1: Setup & Infrastructure

### T001: 初始化项目结构
**描述**: 创建完整的后端和小程序项目目录结构，包含所有必要的配置文件和目录
**Depends on**: None
**Parallel**: No
**Done When**:
- [ ] 后端项目结构创建完成：backend/app/{models,schemas,services,controllers,utils,tests}
- [ ] 小程序项目结构创建完成：miniprogram/{pages,components,utils,images}
- [ ] 配置文件创建完成：requirements.txt, app.json, app.js
- [ ] 环境配置文件创建完成：.env.example, .gitignore

### T002: [P] 配置FastAPI项目环境
**描述**: 安装和配置Python FastAPI开发环境，包括所有依赖包
**Depends on**: None
**Parallel**: Yes（可与T001并行）
**Done When**:
- [ ] Python 3.11+ 环境配置完成
- [ ] requirements.txt 安装完成（FastAPI, SQLAlchemy, Pydantic等）
- [ ] 虚拟环境创建完成
- [ ] 开发工具配置完成（VS Code + Python插件）
- [ ] 基础FastAPI应用可启动

### T003: [P] 初始化MySQL数据库
**描述**: 安装MySQL 8.0+，创建数据库和基本配置
**Depends on**: None
**Parallel**: Yes（可与T001并行）
**Done When**:
- [ ] MySQL 8.0+ 安装完成
- [ ] 数据库ccmartmeet创建完成
- [ ] 数据库用户权限配置完成
- [ ] 字符集设置为utf8mb4
- [ ] 基础连接测试通过

### T004: [P] 配置微信开发者工具
**描述**: 安装微信开发者工具，创建小程序项目，配置基本信息
**Depends on**: None
**Parallel**: Yes（可与T001并行）
**Done When**:
- [ ] 微信开发者工具安装完成
- [ ] 小程序项目创建完成
- [ ] AppID配置完成（或使用测试号）
- [ ] 基础项目可预览运行
- [ ] 项目基本信息设置完成（名称、图标等）

### T005: [P] 设置Git仓库和版本控制
**描述**: 初始化Git仓库，设置.gitignore，创建初始提交
**Depends on**: T001
**Parallel**: Yes（可与T002并行）
**Done When**:
- [ ] Git仓库初始化完成
- [ ] .gitignore文件配置完成（排除敏感文件和临时文件）
- [ ] README.md文件创建完成
- [ ] 初始提交完成
- [ ] GitHub/GitLab远程仓库配置完成（可选）

**Checkpoint 1: 基础环境**
- [ ] 开发环境配置完成（Python, MySQL, 微信开发者工具）
- [ ] 项目结构创建完成
- [ ] 基础工具链可正常工作
- [ ] 版本控制系统就绪

---

## Phase 2: Core Features - User Story 1: 微信静默登录

### T006: 实现JWT工具模块
**描述**: 创建JWT token生成、验证、解析的工具函数
**Depends on**: T002
**Parallel**: No
**Done When**:
- [ ] backend/app/utils/jwt.py 文件创建完成
- [ ] JWT生成函数实现完成（支持30天有效期）
- [ ] JWT验证函数实现完成（支持异常处理）
- [ ] JWT解析函数实现完成
- [ ] 单元测试编写完成（测试token生成、验证、过期处理）
- [ ] 代码覆盖率 > 90%

### T007: 实现微信API工具模块
**描述**: 创建调用微信API的工具函数，包括code2session和手机号获取
**Depends on**: T002
**Parallel**: Yes（可与T006并行）
**Done When**：
- [ ] backend/app/utils/wechat.py 文件创建完成
- [ ] code2session函数实现完成（调用微信API）
- [ ] 手机号解密函数实现完成
- [ ] 微信API异常处理实现完成
- [ ] 配置管理实现完成（AppID, AppSecret）
- [ ] 单元测试编写完成（模拟微信API响应）

### T008: 创建数据库模型 - account表
**描述**: 创建account表的SQLAlchemy模型类
**Depends on**: T003
**Parallel**: No
**Done When**:
- [ ] backend/app/models/account.py 文件创建完成
- [ ] Account类定义完成（包含所有字段）
- [ ] 数据库约束定义完成（主键、外键、唯一约束）
- [ ] 模型关系定义完成（与profile的关系）
- [ ] 模型验证方法实现完成
- [ ] 数据库迁移脚本创建完成

### T009: 创建数据库模型 - profile表
**描述**: 创建profile表的SQLAlchemy模型类
**Depends on**: T003
**Parallel**: Yes（可与T008并行）
**Done When**:
- [ ] backend/app/models/profile.py 文件创建完成
- [ ] Profile类定义完成（包含所有字段）
- [ ] 数据库约束定义完成（主键、索引、非空约束）
- [ ] 年龄计算方法实现（精确到0.1岁）
- [ ] 模型验证方法实现完成
- [ ] 数据库迁移脚本创建完成

### T010: 创建数据库模型 - profile_relation表
**描述**: 创建profile_relation表的SQLAlchemy模型类
**Depends on**: T008, T009
**Parallel**: No
**Done When**:
- [ ] backend/app/models/profile_relation.py 文件创建完成
- [ ] ProfileRelation类定义完成
- [ ] 复合主键和唯一约束定义完成
- [ ] 外键关系定义完成（与account和profile的关系）
- [ ] 枚举类型定义完成（relation_type）
- [ ] 数据库迁移脚本创建完成

### T011: 创建数据库连接配置
**描述**: 配置SQLAlchemy数据库连接，包括连接池和会话管理
**Depends on**: T008, T009, T010
**Parallel**: No
**Done When**:
- [ ] backend/app/database.py 文件创建完成
- [ ] 数据库连接字符串配置完成
- [ ] 连接池配置完成
- [ ] 会话管理配置完成
- [ ] 数据库初始化脚本创建完成
- [ ] 数据库连接测试通过

### T012: 创建Pydantic数据验证模型 - 认证相关
**描述**: 创建登录和认证相关的Pydantic模型，用于请求和响应验证
**Depends on**: T006
**Parallel**: No
**Done When**:
- [ ] backend/app/schemas/auth.py 文件创建完成
- [ ] LoginRequest模型创建完成
- [ ] LoginResponse模型创建完成
- [ ] PhoneRequest模型创建完成
- [ ] PhoneResponse模型创建完成
- [ ] 模型验证规则定义完成（字段类型、长度、格式等）

### T013: 创建认证服务层
**描述**: 实现用户认证的核心业务逻辑，包括登录、token验证等
**Depends on**: T006, T007, T008, T011, T012
**Parallel**: No
**Done When**:
- [ ] backend/app/services/auth_service.py 文件创建完成
- [ ] login_service方法实现完成（微信登录流程）
- [ ] get_phone_service方法实现完成（获取手机号）
- [ ] validate_token_service方法实现完成（token验证）
- [ ] 异常处理实现完成（网络异常、微信API异常等）
- [ ] 单元测试编写完成（覆盖所有业务逻辑）

### T014: 创建认证控制器
**描述**: 实现认证相关的API端点，包括/login和/phone接口
**Depends on**: T013
**Parallel**: No
**Done When**:
- [ ] backend/app/controllers/auth.py 文件创建完成
- [ ] POST /auth/login 端点实现完成
- [ ] POST /auth/phone 端点实现完成
- [ ] JWT中间件实现完成（token验证装饰器）
- [ ] 错误处理实现完成（400/401/500等）
- [ ] API测试用例编写完成（Postman或pytest）

### T015: 实现微信小程序登录页面
**描述**: 创建小程序登录页面，实现自动登录逻辑
**Depends on**: T004
**Parallel**: Yes（可与后端任务并行）
**Done When**:
- [ ] miniprogram/pages/login/login.wxml 文件创建完成
- [ ] miniprogram/pages/login/login.wxss 文件创建完成
- [ ] miniprogram/pages/login/login.js 文件创建完成
- [ ] 自动登录逻辑实现完成（wx.login调用）
- [ ] 错误处理实现完成（网络异常、授权失败等）
- [ ] 小程序预览测试通过

### T016: 实现API请求封装模块
**描述**: 创建小程序端的HTTP请求封装，包含认证和错误处理
**Depends on**: T015
**Parallel**: No
**Done When**:
- [ ] miniprogram/utils/request.js 文件创建完成
- [ ] 基础请求函数实现完成（支持GET/POST/PUT/DELETE）
- [ ] Token自动附加机制实现完成
- [ ] 错误处理机制实现完成（统一错误提示）
- [ ] 请求拦截器实现完成（自动处理认证）
- [ ] 单元测试编写完成

**Checkpoint 2: 登录功能**
- [ ] 微信静默登录功能完整可用
- [ ] JWT认证机制正常工作
- [ ] 小程序与后端API对接成功
- [ ] 错误处理机制完善
- [ ] 数据库表创建完成

- [ ] 数据验证测试完成
- [ ] 验证器测试用例通过

---

## Phase 3: Core Features - User Story 2: 选择报课目的并创建档案

### T046: 实现报课目的选择弹框组件
**描述**: 创建微信风格的报课目的选择弹框组件，支持自己、孩子、家人朋友三个选项
**Depends on**: T015
**Parallel**: Yes（可与T017并行）
**Done When**:
- [ ] miniprogram/components/purpose-selector/ 目录创建完成
- [ ] purpose-selector.wxml 文件创建完成，包含三个选项和图标
- [ ] purpose-selector.wxss 文件创建完成，微信风格样式实现
- [ ] purpose-selector.js 文件创建完成，包含选择和关闭事件处理
- [ ] 组件在登录页面正确集成
- [ ] 小程序预览测试通过，交互体验符合微信标准

### T047: 更新登录流程集成选择弹框
**描述**: 修改登录页面，在登录成功后自动弹出报课目的选择弹框
**Depends on**: T015, T046
**Parallel**: No
**Done When**:
- [ ] miniprogram/pages/login/login.js 登录成功逻辑更新完成
- [ ] 选择弹框调用逻辑实现完成
- [ ] 选择结果传递到创建页面逻辑实现完成
- [ ] 登录成功→选择弹框→创建页面的完整流程测试通过
- [ ] 选择弹框关闭重试逻辑实现完成
- [ ] 错误处理机制完善（网络异常、选择失败等）

### T048: 更新档案创建流程支持relation_type
**描述**: 修改档案创建页面，根据选择的报课目的设置relation_type和相关页面元素
**Depends on**: T051, T047
**Parallel**: No
**Done When**:
- [ ] miniprogram/pages/profile/create/create.js 页面参数接收逻辑实现完成
- [ ] 根据relation_type设置页面标题和导航栏标题逻辑实现完成
- [ ] 创建档案API调用时包含relation_type参数
- [ ] 三种报课目的页面差异化展示（自己/孩子/家人朋友）
- [ ] 端到端选择→创建流程测试通过
- [ ] 页面跳转和数据传递逻辑验证完成

### T049: 更新后端档案创建API支持relation_type
**描述**: 修改后端档案创建API，支持relation_type参数的接收和验证
**Depends on**: T017
**Parallel**: Yes（可与T048并行）
**Done When**:
- [ ] backend/app/schemas/profile.py CreateProfileRequest 模型更新完成
- [ ] relation_type字段验证规则实现完成（self/child/spouse枚举）
- [ ] backend/app/services/profile_service.py 创建逻辑更新完成
- [ ] profile_relation表关联逻辑更新完成
- [ ] API参数验证和错误处理实现完成
- [ ] 单元测试编写完成，覆盖所有relation_type场景

### T050: 更新档案列表显示关系类型信息
**描述**: 修改档案列表页面，显示每个档案的关系类型信息
**Depends on**: T018, T049
**Parallel**: No
**Done When**:
- [ ] GET /profiles API响应包含relation_type信息
- [ ] miniprogram/pages/profile/list/list.wxml 关系类型显示组件实现完成
- [ ] 关系类型文案映射实现（self→自己，child→孩子，spouse→家人朋友）
- [ ] 档案列表页面显示效果优化完成
- [ ] 列表页和详情页的关系信息一致性验证完成
- [ ] 端到端档案列表显示测试通过

**Checkpoint 3: 报课目的选择功能**
- [ ] 报课目的选择弹框功能完整可用
- [ ] 三种报课目的创建流程正常工作
- [ ] relation_type字段正确设置和存储
- [ ] 档案列表正确显示关系类型信息
- [ ] 选择到创建的完整用户流程验证通过

---

## Phase 4: Core Features - User Story 5: 虚拟年龄设置

### T046: 创建虚拟年龄验证工具函数
**描述**: 创建虚拟年龄设置验证的工具函数，包括范围检查和合理性验证
**Depends on**: T018
**Parallel**: Yes（可与T051并行）
**Done When**:
- [ ] backend/app/utils/virtual_age_validator.py 文件创建完成
- [ ] 虚拟年龄范围验证函数实现完成（2-18岁范围检查）
- [ ] 虚拟年龄合理性验证函数实现完成（与实际年龄差异±3岁建议）
- [ ] 虚拟年龄边界情况处理实现完成
- [ ] 单元测试编写完成（覆盖所有验证场景）
- [ ] 代码覆盖率 > 95%

### T047: 创建虚拟年龄日志记录模型
**描述**: 创建virtual_age_log表的SQLAlchemy模型类
**Depends on**: T010
**Parallel**: Yes（可与T046并行）
**Done When**:
- [ ] backend/app/models/virtual_age_log.py 文件创建完成
- [ ] VirtualAgeLog类定义完成（包含所有字段）
- [ ] 数据库约束定义完成（外键、索引）
- [ ] 模型关系定义完成（与profile的关系）
- [ ] 模型验证方法实现完成
- [ ] 数据库迁移脚本创建完成

### T048: 更新档案模型支持虚拟年龄
**描述**: 更新profile模型，添加virtual_age和virtual_age_reason字段
**Depends on**: T009
**Parallel**: No
**Done When**:
- [ ] backend/app/models/profile.py 更新完成
- [ ] virtual_age字段定义完成（DECIMAL(3,1)类型）
- [ ] virtual_age_reason字段定义完成（TEXT类型）
- [ ] 虚拟年龄计算方法实现完成
- [ ] 模型验证规则更新完成
- [ ] 数据库迁移脚本创建完成

### T049: 更新账号模型支持体验课购买记录
**描述**: 更新account模型，添加has_purchased_trial字段
**Depends on**: T008
**Parallel**: Yes（可与T048并行）
**Done When**:
- [ ] backend/app/models/account.py 更新完成
- [ ] has_purchased_trial字段定义完成（BOOLEAN类型）
- [ ] 默认值设置完成（DEFAULT FALSE）
- [ ] 相关业务逻辑更新完成
- [ ] 数据库迁移脚本创建完成

### T050: 创建虚拟年龄服务层
**描述**: 实现虚拟年龄设置、验证和日志记录的核心业务逻辑
**Depends on**: T046, T047, T048
**Parallel**: No
**Done When**:
- [ ] backend/app/services/virtual_age_service.py 文件创建完成
- [ ] set_virtual_age_service方法实现完成（设置虚拟年龄）
- [ ] clear_virtual_age_service方法实现完成（清空虚拟年龄）
- [ ] get_virtual_age_log_service方法实现完成（获取变更记录）
- [ ] 虚拟年龄验证逻辑集成完成
- [ ] 日志记录逻辑集成完成
- [ ] 异常处理实现完成（验证失败、权限不足等）
- [ ] 单元测试编写完成

### T051: 创建虚拟年龄控制器
**描述**: 实现虚拟年龄相关的API端点，包括设置、清空、查询变更记录
**Depends on**: T050
**Parallel**: No
**Done When**:
- [ ] backend/app/controllers/virtual_age.py 文件创建完成
- [ ] PUT /profiles/{id}/virtual-age 端点实现完成
- [ ] DELETE /profiles/{id}/virtual-age 端点实现完成
- [ ] GET /profiles/{id}/virtual-age/log 端点实现完成
- [ ] 权限验证中间件应用完成
- [ ] 请求数据验证实现完成
- [ ] 错误处理实现完成（400/401/403/500等）
- [ ] API测试用例编写完成

### T052: 实现虚拟年龄前端界面组件
**描述**: 创建虚拟年龄设置的前端界面组件，集成到档案创建和编辑页面
**Depends on**: T021
**Parallel**: Yes（可与后端任务并行）
**Done When**:
- [ ] miniprogram/components/virtual-age-input/ 目录创建完成
- [ ] virtual-age-input.wxml 文件创建完成（实际年龄+虚拟年龄输入）
- [ ] virtual-age-input.wxss 文件创建完成（样式设计）
- [ ] virtual-age-input.js 文件创建完成（验证和提交逻辑）
- [ ] 虚拟年龄范围验证前端实现完成（2-18岁）
- [ ] 合理性提示前端实现完成（差异过大警告）
- [ ] 组件在创建页面正确集成
- [ ] 组件在编辑页面正确集成
- [ ] 小程序预览测试通过

### T053: 更新档案创建流程支持虚拟年龄
**描述**: 修改档案创建页面，集成虚拟年龄设置功能
**Depends on**: T021, T052
**Parallel**: No
**Done When**:
- [ ] miniprogram/pages/profile/create/create.js 更新完成
- [ ] 虚拟年龄组件集成完成
- [ ] 虚拟年龄表单验证逻辑实现完成
- [ ] 虚拟年龄API调用逻辑实现完成
- [ ] 错误处理机制完善（验证失败、设置失败等）
- [ ] 创建成功后虚拟年龄显示逻辑实现完成
- [ ] 端到端创建流程测试通过（包含虚拟年龄设置）

### T054: 更新档案编辑流程支持虚拟年龄
**描述**: 修改档案编辑页面，支持虚拟年龄的查看和修改
**Depends on**: T027, T053
**Parallel**: No
**Done When**:
- [ ] miniprogram/pages/profile/edit/edit.js 更新完成
- [ ] 虚拟年龄组件集成完成（显示当前值+支持修改）
- [ ] 虚拟年龄更新API调用逻辑实现完成
- [ ] 虚拟年龄清空功能实现完成
- [ ] 实际年龄和虚拟年龄对比显示实现完成
- [ ] 变更历史查看功能实现完成（可选）
- [ ] 编辑保存后虚拟年龄更新验证完成
- [ ] 端到端编辑流程测试通过（包含虚拟年龄修改）

### T055: 更新档案详情页显示虚拟年龄信息
**描述**: 修改档案详情页面，同时显示实际年龄和虚拟年龄信息
**Depends on**: T022, T053
**Parallel**: No
**Done When**:
- [ ] GET /profiles/{id} API响应包含虚拟年龄信息
- [ ] miniprogram/pages/profile/detail/detail.wxml 虚拟年龄显示组件实现完成
- [ ] 实际年龄和虚拟年龄对比显示实现完成
- [ ] 虚拟年龄标注显示实现完成（"用于课程匹配"）
- [ ] 虚拟年龄设置原因显示实现完成
- [ ] 详情页信息布局优化完成
- [ ] 端到端详情页显示测试通过

**Checkpoint 4: 虚拟年龄功能**
- [ ] 虚拟年龄设置功能完整可用
- [ ] 虚拟年龄验证机制正常工作
- [ ] 虚拟年龄日志记录完整
- [ ] 前端界面友好易用
- [ ] 实际年龄和虚拟年龄对比显示准确

---

## Phase 5: Core Features - User Story 3: 档案查看和管理

### T056: 创建Pydantic数据验证模型 - 档案相关
**描述**: 创建档案管理相关的Pydantic模型，用于请求和响应验证
**Depends on**: T012
**Parallel**: No
**Done When**:
- [ ] backend/app/schemas/profile.py 文件创建完成
- [ ] CreateProfileRequest模型创建完成
- [ ] ProfileResponse模型创建完成
- [ ] UpdateProfileRequest模型创建完成
- [ ] ProfileListResponse模型创建完成
- [ ] 模型验证规则定义完成（包含年龄计算、手机号格式等）

### T017: 实现年龄计算工具函数
**描述**: 创建精确计算年龄的工具函数，支持小数点后1位精度
**Depends on**: T009
**Parallel**: Yes（可与T017并行）
**Done When**:
- [ ] backend/app/utils/age_calculator.py 文件创建完成
- [ ] calculate_age函数实现完成（精确到0.1岁）
- [ ] 边界情况处理完成（闰年、生日等）
- [ ] 单元测试编写完成（包含各种生日情况的测试）
- [ ] 代码覆盖率 > 95%
- [ ] 性能测试通过（1000次计算 < 100ms）

### T018: 创建档案服务层 - 创建功能
**描述**: 实现档案创建的核心业务逻辑，包括数据验证和关系建立
**Depends on**: T009, T010, T011, T056, T017
**Parallel**: No
**Done When**:
- [ ] backend/app/services/profile_service.py 文件创建完成
- [ ] create_profile_service方法实现完成
- [ ] 档案数量检查逻辑实现完成（5个档案上限）
- [ ] account与profile关联逻辑实现完成
- [ ] 年龄自动计算逻辑实现完成
- [ ] 数据验证和异常处理实现完成

### T019: 创建档案控制器 - 创建功能
**描述**: 实现档案创建的API端点，支持POST /profiles接口
**Depends on**: T018
**Parallel**: No
**Done When**:
- [ ] backend/app/controllers/profile.py 文件创建完成
- [ ] POST /profiles 端点实现完成
- [ ] 请求数据验证实现完成
- [ ] 响应数据格式化实现完成
- [ ] 错误处理实现完成（400/401/500等）
- [ ] API测试用例编写完成

### T020: 实现微信小程序档案创建页面
**描述**: 创建档案创建页面，包含表单验证和提交逻辑
**Depends on**: T016
**Parallel**: Yes（可与后端任务并行）
**Done When**:
- [ ] miniprogram/pages/profile/create/create.wxml 文件创建完成
- [ ] miniprogram/pages/profile/create/create.wxss 文件创建完成
- [ ] miniprogram/pages/profile/create/create.js 文件创建完成
- [ ] 表单验证逻辑实现完成（必填字段、格式验证）
- [ ] 微信手机号授权实现完成
- [ ] 年龄实时计算显示实现完成
- [ ] 小程序预览测试通过

### T021: 实现档案列表页面
**描述**: 创建档案列表页面，显示当前用户的所有档案
**Depends on**: T020
**Parallel**: No
**Done When**:
- [ ] miniprogram/pages/profile/list/list.wxml 文件创建完成
- [ ] miniprogram/pages/profile/list/list.wxss 文件创建完成
- [ ] miniprogram/pages/profile/list/list.js 文件创建完成
- [ ] 档案列表获取逻辑实现完成
- [ ] 档案卡片显示组件实现完成
- [ ] 空状态页面实现完成（无档案时的引导）
- [ ] 小程序预览测试通过

### T022: 创建档案服务层 - 查询功能
**描述**: 实现档案查询的核心业务逻辑，包括列表查询和详情查询
**Depends on**: T018
**Parallel**: No
**Done When**:
- [ ] get_profiles_service方法实现完成（获取档案列表）
- [ ] get_profile_service方法实现完成（获取档案详情）
- [ ] 关系查询逻辑实现完成（验证用户权限）
- [ ] 数据分页逻辑实现完成
- [ ] 异常处理实现完成（404、403等）
- [ ] 单元测试编写完成

### T023: 创建档案控制器 - 查询功能
**描述**: 实现档案查询的API端点，支持GET /profiles和GET /profiles/{id}
**Depends on**: T022
**Parallel**: No
**Done When**:
- [ ] GET /profiles 端点实现完成
- [ ] GET /profiles/{id} 端点实现完成
- [ ] 权限验证中间件应用完成
- [ ] 响应数据格式化实现完成
- [ ] 错误处理实现完成（404/403/500等）
- [ ] API测试用例编写完成

**Checkpoint 3: 档案创建和查看**
- [ ] 档案创建功能完整可用
- [ ] 档案列表显示正常
- [ ] 数据验证机制完善
- [ ] 年龄计算准确无误
- [ ] 用户界面友好易用

---

## Phase 4: Core Features - User Story 3: 为孩子创建档案 & User Story 4: 档案切换

### T025: 创建档案服务层 - 更新功能
**描述**: 实现档案更新和管理的核心业务逻辑
**Depends on**: T023
**Parallel**: No
**Done When**:
- [ ] update_profile_service方法实现完成
- [ ] 字段权限验证实现完成（只允许修改指定字段）
- [ ] 数据更新逻辑实现完成
- [ ] 版本控制逻辑实现完成（可选）
- [ ] 异常处理实现完成
- [ ] 单元测试编写完成

### T026: 创建档案控制器 - 更新功能
**描述**: 实现档案更新的API端点，支持PUT /profiles/{id}
**Depends on**: T025
**Parallel**: No
**Done When**:
- [ ] PUT /profiles/{id} 端点实现完成
- [ ] 只读字段验证实现完成（生日、性别不可修改）
- [ ] 更新权限验证实现完成
- [ ] 响应数据格式化实现完成
- [ ] 错误处理实现完成
- [ ] API测试用例编写完成

### T027: 实现档案编辑页面
**描述**: 创建档案编辑页面，支持修改档案信息
**Depends on**: T024
**Parallel**: Yes（可与后端任务并行）
**Done When**:
- [ ] miniprogram/pages/profile/edit/edit.wxml 文件创建完成
- [ ] miniprogram/pages/profile/edit/edit.wxss 文件创建完成
- [ ] miniprogram/pages/profile/edit/edit.js 文件创建完成
- [ ] 表单数据回填逻辑实现完成
- [ ] 只读字段禁用逻辑实现完成
- [ ] 数据更新提交逻辑实现完成
- [ ] 小程序预览测试通过

### T028: 创建档案服务层 - 切换功能
**描述**: 实现档案切换的核心业务逻辑
**Depends on**: T023
**Parallel**: No
**Done When**:
- [ ] switch_profile_service方法实现完成
- [ ] 档案归属验证实现完成
- [ ] 切换状态管理实现完成
- [ ] 会话更新逻辑实现完成
- [ ] 异常处理实现完成
- [ ] 单元测试编写完成

### T029: 创建档案控制器 - 切换功能
**描述**: 实现档案切换的API端点，支持POST /profiles/switch
**Depends on**: T028
**Parallel**: No
**Done When**:
- [ ] POST /profiles/switch 端点实现完成
- [ ] 切换权限验证实现完成
- [ ] 新token生成逻辑实现完成（可选）
- [ ] 响应数据格式化实现完成
- [ ] 错误处理实现完成
- [ ] API测试用例编写完成

### T030: 实现档案切换组件
**描述**: 创建档案切换组件，显示当前档案并支持切换
**Depends on**: T027
**Parallel**: No
**Done When**:
- [ ] miniprogram/components/profile-switcher/profile-switcher.wxml 文件创建完成
- [ ] miniprogram/components/profile-switcher/profile-switcher.wxss 文件创建完成
- [ ] miniprogram/components/profile-switcher/profile-switcher.js 文件创建完成
- [ ] 当前档案显示逻辑实现完成
- [ ] 切换弹窗逻辑实现完成
- [ ] 切换确认提示实现完成
- [ ] 组件预览测试通过

### T031: 创建档案服务层 - 上限控制
**描述**: 实现档案数量上限控制的核心业务逻辑
**Depends on**: T028
**Parallel**: No
**Done When**:
- [ ] validate_profile_limit_service方法实现完成
- [ ] 档案数量统计逻辑实现完成
- [ ] 上限检查逻辑实现完成（5个档案）
- [ ] 状态验证逻辑实现完成（排除已删除档案）
- [ ] 异常处理实现完成
- [ ] 单元测试编写完成

### T032: 创建档案控制器 - 上限控制
**描述**: 实现档案数量检查的API端点，支持GET /profiles/validate-limit
**Depends on**: T031
**Parallel**: No
**Done When**:
- [ ] GET /profiles/validate-limit 端点实现完成
- [ ] 当前数量统计实现完成
- [ ] 上限检查逻辑实现完成
- [ ] 响应数据格式化实现完成
- [ ] 错误处理实现完成
- [ ] API测试用例编写完成

### T033: 实现当前档案获取功能
**描述**: 实现获取当前选中档案的功能
**Depends on**: T029
**Parallel**: No
**Done When**:
- [ ] backend/app/services/auth_service.py 中添加get_current_profile方法
- [ ] 当前档案查询逻辑实现完成
- [ ] token解析逻辑更新完成
- [ ] 异常处理实现完成（无当前档案的情况）
- [ ] 单元测试编写完成

### T034: 创建档案控制器 - 当前档案获取
**描述**: 实现获取当前档案的API端点，支持GET /profiles/current
**Depends on**: T033
**Parallel**: No
**Done When**:
- [ ] GET /profiles/current 端点实现完成
- [ ] 当前档案查询实现完成
- [ ] 响应数据格式化实现完成
- [ ] 错误处理实现完成（404无当前档案）
- [ ] API测试用例编写完成

### T035: 更新档案列表页面 - 添加切换功能
**描述**: 在档案列表页面中添加档案切换和操作按钮
**Depends on**: T030
**Parallel**: No
**Done When**:
- [ ] miniprogram/pages/profile/list/list.js 更新完成
- [ ] 切换按钮逻辑实现完成
- [ ] 编辑按钮逻辑实现完成
- [ ] 当前档案标识显示实现完成
- [ ] 档案操作弹窗实现完成
- [ ] 小程序预览测试通过

### T036: 实现本地存储管理模块
**描述**: 创建小程序本地存储管理，包括token和当前档案信息
**Depends on**: T016
**Parallel**: Yes（可与后端任务并行）
**Done When**:
- [ ] miniprogram/utils/storage.js 文件创建完成
- [ ] token存储方法实现完成
- [ ] 当前档案存储方法实现完成
- [ ] 数据过期检查实现完成
- [ ] 数据清理方法实现完成
- [ ] 单元测试编写完成

**Checkpoint 4: 档案管理完整功能**
- [ ] 档案CRUD功能完整可用
- [ ] 档案切换功能正常工作
- [ ] 数量上限控制有效
- [ ] 用户界面体验良好
- [ ] 数据一致性得到保证

---

## Phase 5: Integration & Testing

### T037: 实现API集成测试套件
**描述**: 创建完整的API集成测试，验证所有端点的功能
**Depends on**: T034
**Parallel**: No
**Done When**:
- [ ] backend/tests/test_integration.py 文件创建完成
- [ ] 登录流程测试编写完成
- [ ] 档案CRUD测试编写完成
- [ ] 档案切换测试编写完成
- [ ] 错误处理测试编写完成
- [ ] 测试覆盖率 > 85%
- [ ] 所有测试用例通过

### T038: 实现小程序端到端测试
**描述**: 创建小程序的端到端测试，验证完整用户流程
**Depends on**: T036
**Parallel**: No
**Done When**:
- [ ] miniprogram/tests/e2e/ 目录创建完成
- [ ] 登录流程测试编写完成
- [ ] 档案创建流程测试编写完成
- [ ] 档案切换流程测试编写完成
- [ ] 异常情况测试编写完成
- [ ] 测试覆盖率 > 80%
- [ ] 所有测试用例通过

### T039: 实现错误处理和日志系统
**描述**: 完善错误处理机制和日志记录系统
**Depends on**: T037
**Parallel**: No
**Done When**:
- [ ] backend/app/utils/logger.py 文件创建完成
- [ ] 结构化日志配置完成
- [ ] 错误分类和处理机制完善
- [ ] 日志轮转配置完成
- [ ] 监控告警配置完成（可选）
- [ ] 错误追踪测试完成

### T040: 性能优化和缓存实现
**描述**: 优化API性能，实现必要的缓存机制
**Depends on**: T038
**Parallel**: No
**Done When**:
- [ ] 数据库查询优化完成（索引使用验证）
- [ ] API响应时间优化完成（目标 < 500ms）
- [ ] Redis缓存配置完成（可选）
- [ ] 静态资源优化完成
- [ ] 性能测试报告生成完成
- [ ] 性能基准测试通过

### T041: 安全性检查和加固
**描述**: 进行安全性检查，修复潜在的安全问题
**Depends on**: T039
**Parallel**: No
**Done When**:
- [ ] 输入验证安全检查完成
- [ ] SQL注入防护验证完成
- [ ] XSS防护验证完成
- [ ] CSRF防护配置完成
- [ ] 权限验证测试完成
- [ ] 安全扫描报告生成完成

### T042: 创建部署脚本和配置
**描述**: 创建生产环境部署脚本和配置文件
**Depends on**: T040
**Parallel**: No
**Done When**:
- [ ] Docker配置文件创建完成（Dockerfile, docker-compose.yml）
- [ ] 数据库迁移脚本创建完成
- [ ] 环境变量配置模板创建完成
- [ ] 部署脚本创建完成
- [ ] 健康检查端点实现完成
- [ ] 部署测试通过

### T043: 代码审查和重构
**描述**: 进行代码审查，重构优化代码质量
**Depends on**: T041
**Parallel**: No
**Done When**:
- [ ] 代码风格检查完成（使用flake8/black）
- [ ] 代码复杂度分析完成
- [ ] 重构优化实施完成
- [ ] 代码注释完善完成
- [ ] 技术债务清单更新完成
- [ ] 代码质量报告生成完成

### T044: 文档完善和知识整理
**描述**: 完善技术文档，整理开发知识库
**Depends on**: T043
**Parallel**: No
**Done When**:
- [ ] API文档更新完成（基于最新代码）
- [ ] 部署文档编写完成
- [ ] 运维手册编写完成
- [ ] 故障排查指南编写完成
- [ ] 开发规范文档更新完成
- [ ] 知识库整理完成

### T045: 最终验收测试和上线准备
**描述**: 进行最终验收测试，准备生产环境上线
**Depends on**: T044
**Parallel**: No
**Done When**:
- [ ] 完整功能验收测试完成
- [ ] 性能基准测试完成
- [ ] 安全验收测试完成
- [ ] 用户验收测试完成
- [ ] 上线检查清单完成
- [ ] 发布计划制定完成

**Checkpoint 5: 项目交付**
- [ ] 所有功能完整可用
- [ ] 测试覆盖率达标
- [ ] 性能指标满足要求
- [ ] 安全检查通过
- [ ] 文档完善
- [ ] 准备生产环境部署

---

## 🚫 移除的任务（后续MVP实现）

以下任务在原外部AI文档中包含，但根据spec.md的"Out of Scope"标记，将在后续MVP中实现：

### 移除原因说明
根据spec.md中的明确标记：
```markdown
## Out of Scope (MVP-1 不实现)
- ❌ 档案删除功能 (留到MVP-2)
```

### 移除的任务列表
- **DELETE /profiles/{id} 端点实现** - 档案删除功能
- **软删除机制实现** - 档案status字段管理
- **删除权限验证** - 预约记录检查
- **删除历史记录管理** - 数据完整性保证

### 后续实现计划
这些功能将在MVP-2或后续版本中实现，具体时机将根据用户反馈和业务需求确定。

---

## 📊 任务执行策略

### 单人AI辅助开发策略

1. **任务优先级**: 按照Phase 1-5的顺序执行，确保基础设施先完成
2. **并行执行**: 充分利用[P]标记的并行任务，提高开发效率
3. **AI辅助**: 每个任务都设计为可独立执行，便于AI协助完成
4. **质量保证**: 每个Checkpoint都要通过验证后才能进入下一阶段

### 宪法合规检查

每个Phase完成后都要进行宪法合规检查：
- ✅ **Principle 1**: 简化优先，AI Coding友好，复用现有relation_type字段实现简化
- ✅ **Principle 2**: 数据完整性至上，relation_type关联关系数据一致性
- ✅ **Principle 3**: 可维护性与可读性，选择流程逻辑简洁清晰
- ✅ **Principle 4**: API优先架构，relation_type参数设计合理
- ✅ **Principle 5**: 增量交付，选择功能作为独立功能点交付
- ✅ **Principle 6**: 以用户为中心，选择流程用户体验友好
- ✅ **Principle 7**: 测试驱动的数据操作，relation_type数据验证完善
- ✅ **Principle 8**: 安全与合规，关系权限验证机制
- ✅ **Principle 9**: 迁移与集成支持，为后续功能预留空间

### 风险缓解策略

1. **技术风险**: 每个任务都有明确的Done标准，降低实现风险
2. **进度风险**: 并行任务最大化，关键路径明确
3. **质量风险**: 测试覆盖率和代码审查双重保障
4. **集成风险**: 分阶段集成，早期发现问题

---

## 🎯 成功标准

### 功能标准
- [ ] 微信静默登录成功率 > 99%
- [ ] 档案创建成功率 > 95%
- [ ] 档案切换响应时间 < 500ms
- [ ] 数据准确性 100%

### 质量标准
- [ ] 代码覆盖率 > 85%
- [ ] API响应时间 < 500ms
- [ ] 错误率 < 1%
- [ ] 安全漏洞 = 0

### 用户体验标准
- [ ] 登录流程 < 3秒
- [ ] 档案创建 < 2分钟
- [ ] 界面友好度评分 > 4.5/5
- [ ] 用户满意度 > 90%

---

**创建人**: Claude Code Assistant
**最后更新**: 2025-10-26
**版本**: v1.0.0
**状态**: 就绪
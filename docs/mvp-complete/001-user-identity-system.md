# MVP-001: 用户身份系统 - 完整文档汇总

**功能分支**: `001-user-identity-system`
**创建时间**: 2025-10-26
**最后更新**: 2025-11-17
**版本**: v1.1.0
**状态**: Updated (基于外部AI专家反馈优化)

---

## 📋 项目概览

### 功能范围和核心目标
用户身份系统是整个百适体操馆运营管理系统的基础，实现微信静默登录、多档案管理、虚拟年龄设置等核心功能。该系统为后续所有MVP模块提供用户身份验证和权限管理基础。

### 与其他MVP的依赖关系
- **前置依赖**: 无（这是MVP-1，为基础模块）
- **后续支撑**: 为MVP-2至MVP-8提供用户身份验证和档案数据
- **核心支撑**: 为课程预约、支付、管理后台等所有功能提供用户基础数据

### 关键技术决策
- 采用微信静默登录，提供无感知用户体验
- 三表设计（account、profile、profile_relation）实现灵活的多档案管理
- 虚拟年龄系统支持特殊情况的课程匹配
- JWT认证机制保证API安全性
- 基于年龄的自动类型识别（成人/儿童）

---

## 📚 功能规格 (spec.md)

### 用户故事详细描述

#### User Story 1 - 微信静默登录 (Priority: P1)
家长打开小程序时,系统自动完成微信授权登录,无需任何用户操作,直接进入主页。

**关键验收场景**:
- 用户首次打开小程序自动调用wx.login获取code
- 后端调用微信API换取OpenID并创建用户记录
- 返回JWT Token并设置30天过期时间
- 已登录用户再次打开直接进入主页

#### User Story 2 - 引导式档案创建 (Priority: P1)
登录成功后,如果用户没有学员档案,系统显示浮动提示条引导用户创建档案。

**关键验收场景**:
- 无档案用户在操作Tab上方显示浮动提示条
- 点击提示条弹出"为谁报课？"选择弹框
- 根据选择(self/child/spouse)设置对应relation_type
- 拦截无档案用户的预约操作并引导创建档案

#### User Story 3 - 切换档案身份 (Priority: P2)
家长可以在顶部导航栏点击当前档案,弹出档案列表,切换到其他档案。

**关键验收场景**:
- 顶部显示当前档案头像和姓名
- 点击弹出档案列表供选择
- 切换后显示Toast提示并更新页面数据
- 预约操作显示当前档案确认信息

#### User Story 4 - 查看和编辑档案 (Priority: P3)
家长可以查看档案详情,并编辑可修改字段信息。

**关键验收场景**:
- 支持编辑姓名、常用名、手机号、运动情况
- 禁止修改生日和性别（业务规则）
- 支持软删除档案(status=0)
- 保留历史记录完整性

#### User Story 5 - 虚拟年龄偏移量设置 (Priority: P1)
系统支持为档案设置虚拟年龄偏移量，由家长直接设定偏移年数，简化设置流程。

**关键验收场景**:
- 分别显示"实际年龄"和"显示年龄(含偏移)"字段
- 虚拟年龄偏移量范围：-5到+5岁，正数增加年龄，负数减少年龄
- 显示年龄 = 实际年龄 + 虚拟年龄偏移量，用于课程匹配
- 记录每次偏移量变更到virtual_age_offset_log表
- 支持清空偏移量设置，恢复使用实际年龄

#### User Story 6 - 基于年龄的自动类型识别 (Priority: P1)
系统根据学员档案中的年龄自动判断成人/儿童类型（18岁及以上为成人，18岁以下为儿童）。

**关键验收场景**:
- 18岁及以上自动识别为成人类型
- 18岁以下自动识别为儿童类型
- 档案创建/编辑后重新计算类型
- 切换档案时立即更新类型信息

### 功能需求清单

#### 登录相关需求 (FR-001 到 FR-006)
- 微信静默登录支持
- OpenID直接存储（不加密，符合简化优先原则）
- JWT Token生成和30天过期管理
- 小程序storage中Token存储

#### 档案管理需求 (FR-015 到 FR-033)
- 档案CRUD操作支持
- 每个账号最多5个档案限制
- 档案关联关系管理(relation_type)
- 软删除机制保护历史数据

#### 虚拟年龄偏移量需求 (FR-031 到 FR-038)
- 虚拟年龄偏移量设置，范围-5到+5岁
- 显示年龄 = 实际年龄 + 虚拟年龄偏移量
- 虚拟年龄偏移量变更历史记录到virtual_age_offset_log表
- 支持清空偏移量设置，恢复使用实际年龄

### 边界情况处理

#### 异常场景处理
- **网络异常**: 立即显示错误页面，提供"重新登录"按钮
- **微信授权拒绝**: 提示"需要手机号才能创建档案"，允许跳过但限制功能
- **重复创建**: 前端按钮置灰+loading，后端使用唯一约束防止
- **年龄边界**: 前端验证生日不得晚于今天

#### 虚拟年龄偏移量特殊场景
- **超范围偏移**: 系统拦截并提示"偏移量应在-5到+5岁范围内"
- **历史追溯**: 通过virtual_age_offset_log表查询历史变更记录
- **偏移量计算**: 显示年龄仅在课程匹配时计算，不物理存储
- **变更原因**: 建议填写变更原因，便于运营分析

### 成功标准

#### 可量化指标
- 用户首次打开小程序后3秒内完成静默登录
- 家长能在2分钟内完成选择报课目的和档案创建
- 切换档案后页面响应时间小于500ms
- 档案创建成功率达到95%(排除网络异常)
- 虚拟年龄偏移量设置成功率>99%

#### 质量指标
- 档案数据准确率100%
- 5个档案上限100%阻止创建
- 软删除档案后历史记录保留率100%
- 虚拟年龄偏移量在课程匹配中应用准确率100%

---

## 🏗️ 技术实现计划 (plan.md)

### 系统架构设计

#### 技术栈选择
| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **小程序前端** | 微信原生框架(MINA) | 基础库 3.11.0+ | 界面渲染、用户交互 |
| **渲染引擎** | Skyline | 基础库 3.0.0+ | 高频页面性能优化 |
| **后端框架** | Python FastAPI | 0.100+ | RESTful API服务 |
| **数据库** | MySQL | 8.0+ | 关系型数据存储 |
| **ORM** | SQLAlchemy | 2.x | Python数据库操作 |
| **认证** | JWT | - | Token生成和验证 |

#### 项目结构设计
```
/Users/cc/Documents/GymnasticMini/
├── backend/                      # 后端服务
│   ├── app/
│   │   ├── models/              # 数据模型
│   │   ├── schemas/             # Pydantic数据验证
│   │   ├── services/            # 业务逻辑层
│   │   ├── controllers/         # API控制器
│   │   ├── utils/               # 工具函数
│   │   └── main.py              # FastAPI入口
│   ├── migrations/              # 数据库迁移脚本
│   └── tests/                   # 单元测试
└── miniprogram/                 # 小程序前端
    ├── pages/                   # 页面
    ├── components/              # 组件
    ├── utils/                   # 工具函数
    ├── app.js
    └── app.json
```

### 数据库设计

#### 表1: account（账号表）
```sql
CREATE TABLE `account` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '账号ID',
  `openid` VARCHAR(64) UNIQUE NOT NULL COMMENT '微信OpenID',
  `profile_id` INT DEFAULT NULL COMMENT '关联的主档案ID',
  `has_purchased_trial` BOOLEAN DEFAULT FALSE COMMENT '是否已购买过体验课',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_openid` (`openid`),
  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 表2: profile（档案表）
```sql
CREATE TABLE `profile` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '档案ID',
  `name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '常用名/昵称',
  `birthday` DATE NOT NULL COMMENT '生日',
  `gender` TINYINT NOT NULL COMMENT '性别：1=男,2=女',
  `virtual_age_offset` INT DEFAULT 0 COMMENT '虚拟年龄偏移量（正数增加，负数减少，由家长设定）',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `sports_background` TEXT DEFAULT NULL COMMENT '运动情况',
  `level` ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6') DEFAULT 'L1',
  `development` ENUM('interest', 'professional', 'competition', 'long_term') DEFAULT NULL COMMENT '发展标签',
  `privilege` ENUM('old_user', 'new_user', 'friend_discount') DEFAULT 'new_user' COMMENT '权益标签',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1=正常,0=已删除',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_name` (`name`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_level` (`level`),
  INDEX `idx_development` (`development`),
  INDEX `idx_privilege` (`privilege`),
  INDEX `idx_status` (`status`),
  INDEX `idx_birthday` (`birthday`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='档案表（家长和学员统一）';
```

#### 表3: profile_relation（档案关联表）
```sql
CREATE TABLE `profile_relation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `account_id` INT NOT NULL COMMENT '账号ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `relation_type` ENUM('self', 'child', 'parent', 'spouse') DEFAULT 'self',
  `can_book` TINYINT DEFAULT 1 COMMENT '是否可预约',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_account_profile` (`account_id`, `profile_id`),
  INDEX `idx_account` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 表4: virtual_age_offset_log（虚拟年龄偏移量变更记录表）
```sql
CREATE TABLE `virtual_age_offset_log` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `old_offset` INT NULL COMMENT '原偏移量',
  `new_offset` INT NULL COMMENT '新偏移量',
  `change_reason` TEXT NULL COMMENT '变更原因',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',

  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  INDEX `idx_profile` (`profile_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟年龄偏移量变更记录表';
```

### API设计详细规范

#### API基础信息
- **开发环境**: `http://localhost:8000/api/v1`
- **生产环境**: `https://api.ccmartmeet.com/api/v1`
- **认证方式**: JWT Token（Header: Authorization: Bearer <token>）

#### 统一响应格式
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 业务数据
  }
}
```

#### 核心API端点

**1. POST /api/v1/auth/login - 微信静默登录**
- 接收wx.login返回的code
- 调用微信API换取OpenID
- 生成JWT Token（30天有效期）
- 返回token和账号信息

**2. POST /api/v1/profiles - 创建档案**
- 验证JWT Token获取account_id
- 检查档案数量是否超过5个
- 创建profile记录和关联关系
- 支持relation_type: 'self'|'child'|'spouse'

**3. GET /api/v1/profiles - 获取档案列表**
- 获取当前账号可管理的所有档案
- 返回档案详情和关联关系
- 标识当前选中的档案

**4. PUT /api/v1/profiles/{id}/virtual-age-offset - 设置虚拟年龄偏移量**
- 验证偏移量范围（-5到+5岁）
- 计算显示年龄 = 实际年龄 + 偏移量
- 记录变更历史到virtual_age_offset_log表

**5. DELETE /api/v1/profiles/{id}/virtual-age-offset - 清空虚拟年龄偏移量**
- 清空偏移量设置，恢复使用实际年龄
- 记录清空操作到历史日志

**6. GET /api/v1/profiles/{id}/virtual-age-offset/log - 获取虚拟年龄偏移量变更记录**
- 分页查询偏移量变更历史
- 按变更时间倒序显示

**7. POST /api/v1/profiles/switch - 切换当前档案**
- 验证档案归属权限
- 更新当前操作档案
- 返回切换后的档案信息

### 前端页面设计

#### 页面1: 登录页 (pages/login/login)
**功能**: 微信静默登录，无用户操作自动完成
**关键逻辑**:
- onLoad时自动调用wx.login()
- 获取code后调用后端API
- 存储JWT Token
- 根据是否有档案跳转到对应页面

#### 页面2: 创建档案页 (pages/profile/create)
**功能**: 档案创建表单，支持不同报课目的
**关键特性**:
- 根据relation_type显示不同页面标题
- 支持微信授权获取手机号
- 实时验证档案数量上限
- 表单验证和提交处理

#### 组件: 档案切换器 (components/profile-switcher)
**功能**: 顶部导航栏显示和切换当前档案
**设计要点**:
- 显示当前档案头像和姓名
- 点击弹出档案选择列表
- 切换后显示Toast提示
- 支持快速切换操作

### 关键业务逻辑实现

#### 年龄计算逻辑（精确到0.1岁）
```python
def calculate_age(birthday: date) -> float:
    """计算年龄，精确到小数点后1位"""
    today = date.today()
    days = (today - birthday).days
    age = days / 365.25  # 考虑闰年
    return round(age, 1)
```

#### 档案权限验证
```python
@require_profile_permission('read')
def get_profile(profile_id: int):
    """验证用户对档案的访问权限"""
    pass

@require_profile_permission('book')
def create_booking(profile_id: int):
    """验证用户对档案的预约权限"""
    pass
```

#### 虚拟年龄自动增长机制
- 定期任务检查学员生日
- 自动增加虚拟年龄保持同步
- 记录更新时间和变更日志
- 支持手动调整和审核流程

---

## 📊 数据模型设计 (data-model.md)

### 数据模型设计原则
1. **数据完整性至上**: 使用外键约束确保数据一致性
2. **简化优先**: 避免过度设计，直接存储OpenID
3. **扩展性考虑**: 预留字段支持后续功能扩展
4. **性能优化**: 合理设计索引提升查询性能

### 核心实体关系

#### account（账号实体）
- **作用**: 代表微信登录账号，一个微信用户对应一个account
- **核心字段**: id, openid, profile_id, has_purchased_trial
- **业务规则**: openid唯一标识微信用户，profile_id关联主档案

#### profile（档案实体）
- **作用**: 存储学员档案信息，家长和孩子使用同一张表
- **核心字段**: name, birthday, gender, virtual_age_offset, phone, avatar_url
- **业务规则**: virtual_age_offset用于课程匹配计算显示年龄，status支持软删除

#### profile_relation（关联关系实体）
- **作用**: 定义"谁能管理谁"和"报课目的"的映射关系
- **核心字段**: account_id, profile_id, relation_type, can_book
- **业务规则**: relation_type映射报课目的，支持灵活的家庭关系管理

#### virtual_age_offset_log（虚拟年龄偏移量日志实体）
- **作用**: 记录虚拟年龄偏移量的历史变更
- **核心字段**: profile_id, old_offset, new_offset, change_reason
- **业务规则**: 每次变更都记录，支持运营分析和历史追溯

### 数据验证规则

#### 输入验证
- **身份证号**: 18位数字+校验码
- **护照号**: 1-20位字母数字
- **手机号**: 11位数字
- **生日**: 不得晚于今天
- **虚拟年龄偏移量**: -5到+5岁范围

#### 业务验证
- 档案数量上限：每个账号最多5个档案
- 权限验证：所有操作验证档案归属
- 状态检查：软删除档案不影响历史记录
- 关系验证：relation_type枚举值验证

---

## ✅ 任务分解清单 (tasks.md)

### Phase 1: Setup & Infrastructure (4个任务)
- **T001**: 初始化项目结构 - 创建后端和小程序目录结构
- **T002**: 配置FastAPI项目环境 - 安装Python依赖和开发工具
- **T003**: 初始化MySQL数据库 - 创建数据库和基本配置
- **T004**: 配置微信开发者工具 - 创建小程序项目和基本配置

### Phase 2: Database & Models (6个任务)
- **T005**: 创建数据库表结构 - 实现三表设计和外键约束
- **T006**: 实现SQLAlchemy模型 - Python ORM模型定义
- **T007**: 创建Pydantic验证模式 - API请求和响应验证
- **T008**: 数据库迁移脚本 - Alembic迁移配置
- **T009**: 基础测试数据 - 开发和测试用数据准备
- **T010**: 数据库连接配置 - SQLAlchemy连接池设置

### Phase 3: Authentication Service (8个任务)
- **T011**: 微信API集成 - wx.login和wx.getPhoneNumber支持
- **T012**: JWT认证服务 - Token生成和验证逻辑
- **T013**: 登录API端点 - /api/v1/auth/login实现
- **T014**: 手机号获取API - /api/v1/auth/phone实现
- **T015**: 认证中间件 - JWT Token验证中间件
- **T016**: 权限验证装饰器 - 档案访问权限检查
- **T017**: 错误处理机制 - 认证异常统一处理
- **T018**: 认证服务单元测试 - 登录和权限测试覆盖

### Phase 4: Profile Management Service (12个任务)
- **T019**: 档案CRUD服务 - 创建、读取、更新、删除档案
- **T020**: 档案关联服务 - 管理账号与档案关系
- **T021**: 档案数量限制 - 5个档案上限控制
- **T022**: 软删除实现 - status字段软删除逻辑
- **T023**: 年龄计算服务 - 精确到0.1岁的年龄计算
- **T024**: 虚拟年龄偏移量服务 - 偏移量设置和验证
- **T025**: 类型自动识别 - 基于年龄的成人/儿童判断
- **T026**: 档案切换服务 - 当前操作档案切换
- **T027**: 数据验证服务 - 输入数据验证逻辑
- **T028**: 头像管理服务 - 微信头像获取和默认头像
- **T029**: 档案搜索服务 - 姓名和手机号搜索
- **T030**: 业务规则验证 - 档案管理业务规则

### Phase 5: API Controllers (15个任务)
- **T031**: Auth Controller - 登录和手机号API
- **T032**: Profile Controller - 档案管理API端点
- **T033**: 创建档案API - POST /api/v1/profiles
- **T034**: 档案列表API - GET /api/v1/profiles
- **T035**: 档案详情API - GET /api/v1/profiles/{id}
- **T036**: 更新档案API - PUT /api/v1/profiles/{id}
- **T037**: 删除档案API - DELETE /api/v1/profiles/{id}
- **T038**: 切换档案API - POST /api/v1/profiles/switch
- **T039**: 当前档案API - GET /api/v1/profiles/current
- **T040**: 档案限制检查API - GET /api/v1/profiles/validate-limit
- **T041**: 虚拟年龄偏移量设置API - PUT /api/v1/profiles/{id}/virtual-age-offset
- **T042**: 虚拟年龄偏移量清空API - DELETE /api/v1/profiles/{id}/virtual-age-offset
- **T043**: 虚拟年龄偏移量日志API - GET /api/v1/profiles/{id}/virtual-age-offset/log
- **T044**: API响应格式统一 - 统一成功和错误响应
- **T045**: API文档生成 - FastAPI自动文档

### Phase 6: Frontend Development (16个任务)
- **T046**: 登录页面实现 - 微信静默登录页面
- **T047**: 创建档案页面 - 档案创建表单页面
- **T048**: 档案列表页面 - 档案管理列表页面
- **T049**: 档案详情页面 - 档案信息展示页面
- **T050**: 档案编辑页面 - 档案信息编辑页面
- **T051**: 报课目的选择组件 - 关系类型选择弹框
- **T052**: 档案切换组件 - 顶部档案切换器
- **T053**: 表单验证组件 - 前端表单验证逻辑
- **T054**: 微信授权组件 - 手机号获取组件
- **T055**: 日期选择组件 - 生日日期选择器
- **T056**: 图片上传组件 - 头像上传组件（预留）
- **T057**: 页面导航逻辑 - 页面间跳转逻辑
- **T058**: 错误提示组件 - 统一错误提示
- **T059**: Loading状态组件 - 加载状态显示
- **T060**: Toast提示组件 - 操作反馈提示
- **T061**: 响应式布局适配 - 不同屏幕尺寸适配

### Phase 7: Integration & Testing (10个任务)
- **T062**: API集成测试 - 后端API集成测试
- **T063**: 前后端集成测试 - 端到端功能测试
- **T064**: 微信API集成测试 - 微信接口集成测试
- **T065**: 数据库集成测试 - 数据操作完整性测试
- **T066**: 权限系统测试 - 访问权限验证测试
- **T067**: 虚拟年龄偏移量功能测试 - 偏移量特性测试
- **T068**: 异常场景测试 - 错误处理和边界情况测试
- **T069**: 性能测试 - API响应时间和并发测试
- **T070**: 兼容性测试 - 微信版本和设备兼容性
- **T071**: 用户体验测试 - 完整用户流程测试

### Phase 8: Deployment & Optimization (6个任务)
- **T072**: 生产环境配置 - 服务器和数据库配置
- **T073**: 数据库迁移 - 生产数据库结构更新
- **T074**: 小程序发布审核 - 微信小程序提审流程
- **T075**: 性能监控配置 - API性能和错误监控
- **T076**: 日志系统配置 - 结构化日志记录
- **T077**: 备份策略实施 - 数据备份和恢复方案

### 任务统计
- **总任务数**: 77个任务
- **预估工作量**: 14个工作日
- **关键里程碑**:
  - Day 3: 完成基础架构和数据模型
  - Day 7: 完成认证和档案服务
  - Day 10: 完成API和前端页面
  - Day 12: 完成集成测试
  - Day 14: 完成部署和优化

---

## 🔍 质量检查清单

### 需求质量检查
- ✅ 每个用户故事都有明确的优先级 (P1, P2, P3)
- ✅ 每个用户故事都有独立的测试方法
- ✅ 每个用户故事都有完整的验收场景 (Given/When/Then)
- ✅ 边界情况都已考虑并有处理方案

### 设计质量检查
- ✅ 遵循宪法Principle 1 (简化优先)
- ✅ 技术栈符合AI Coding友好原则
- ✅ 没有引入不必要的复杂性
- ✅ 数据完整性设计完善
- ✅ API设计符合RESTful规范

### 实现质量检查
- ✅ 代码结构清晰分层
- ✅ 函数和类的职责单一
- ✅ 有充分的注释说明
- ✅ 关键业务逻辑有测试覆盖

### 文档质量检查
- ✅ 用户故事描述清晰
- ✅ 功能需求具体明确
- ✅ 成功标准可衡量
- ✅ 边界情况考虑充分
- ✅ API文档完整准确
- ✅ 数据模型设计规范

---

## 📈 项目信息

### 开发工作量统计
- **总任务数**: 77个详细任务
- **预估工作量**: 14个工作日
- **开发阶段**: 8个主要阶段
- **关键里程碑**: 5个重要节点

### 风险评估和缓解措施
| 风险项 | 概率 | 影响 | 应对措施 |
|--------|------|------|----------|
| 微信API变更 | 中 | 高 | 关注官方公告，预留适配时间 |
| 并发控制 | 低 | 中 | 数据库唯一约束防止重复 |
| 数据一致性 | 低 | 高 | 外键约束和事务保护 |
| 用户体验 | 中 | 中 | 充分测试和用户反馈收集 |

### 成功标准和验收条件
- **技术标准**:
  - API响应时间 < 500ms
  - 登录成功率 > 99%
  - 数据准确率 = 100%
- **业务标准**:
  - 用户3秒内完成静默登录
  - 2分钟内完成档案创建
  - 支持5个档案管理
- **质量标准**:
  - 单元测试覆盖率 > 80%
  - 集成测试通过率 = 100%
  - 异常场景处理完整

### 宪法原则遵循
- ✅ **Principle 1**: 简化优先 - 微信原生框架，直接存储OpenID
- ✅ **Principle 2**: 数据完整性 - 外键约束，软删除保护
- ✅ **Principle 3**: 可维护性 - 清晰分层，标准命名
- ✅ **Principle 4**: API优先 - RESTful设计，前后端解耦
- ✅ **Principle 5**: 增量交付 - MVP纵向切片，独立可交付
- ✅ **Principle 6**: 用户中心 - 3步完成核心操作，无感知登录
- ✅ **Principle 7**: 测试驱动 - 关键操作测试覆盖
- ✅ **Principle 8**: 安全合规 - JWT认证，微信安全机制

---

**汇总完成时间**: 2025-11-17
**汇总人**: AI Claude
**文档状态**: 已更新（基于外部AI专家反馈优化虚拟年龄偏移量设计）
**适用范围**: 外部AI专家审核，开发团队实施参考
**主要更新**:
- 优化虚拟年龄设计为virtual_age_offset偏移量模式
- 添加development和privilege标签支持课程匹配
- 完善API接口和数据模型设计
- 更新业务规则和边界情况处理
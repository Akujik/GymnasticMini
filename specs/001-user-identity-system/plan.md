# Implementation Plan: User Identity System

**Feature**: 001-user-identity-system
**创建时间**: 2025-10-26
**状态**: Draft

## Technical Context

### Technology Stack

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **小程序前端** | 微信原生框架(MINA) | 基础库 3.11.0+ | 界面渲染、用户交互 |
| **渲染引擎** | Skyline | 基础库 3.0.0+ | 高频页面性能优化 |
| **后端框架** | Python FastAPI | 0.100+ | RESTful API服务 |
| **数据库** | MySQL | 8.0+ | 关系型数据存储 |
| **ORM** | SQLAlchemy | 2.x | Python数据库操作 |
| **认证** | JWT | - | Token生成和验证 |
| **微信API** | wx.login, wx.getPhoneNumber | - | 微信授权接口 |

### Project Structure

```
/Users/cc/Documents/GymnasticMini/
├── backend/                      # 后端服务
│   ├── app/
│   │   ├── models/              # 数据模型
│   │   │   ├── account.py
│   │   │   ├── profile.py
│   │   │   └── profile_relation.py
│   │   ├── schemas/             # Pydantic数据验证
│   │   │   ├── auth.py
│   │   │   └── profile.py
│   │   ├── services/            # 业务逻辑层
│   │   │   ├── auth_service.py
│   │   │   └── profile_service.py
│   │   ├── controllers/         # API控制器
│   │   │   ├── auth.py
│   │   │   └── profile.py
│   │   ├── utils/               # 工具函数
│   │   │   ├── jwt.py
│   │   │   ├── wechat.py
│   │   │   └── age_calculator.py
│   │   └── main.py              # FastAPI入口
│   ├── migrations/              # 数据库迁移脚本
│   ├── tests/                   # 单元测试
│   ├── requirements.txt
│   └── .env                     # 环境变量
│
└── miniprogram/                 # 小程序前端
    ├── pages/
    │   ├── login/               # 登录页
    │   ├── profile/
    │   │   ├── create/          # 创建档案
    │   │   ├── list/            # 档案列表
    │   │   ├── detail/          # 档案详情
    │   │   └── edit/            # 编辑档案
    ├── components/
    │   └── profile-switcher/    # 档案切换组件
    ├── utils/
    │   ├── request.js           # API请求封装
    │   ├── storage.js           # 本地存储管理
    │   └── auth.js              # 认证状态管理
    ├── app.js
    └── app.json
```

### Constraints

- **宪法 Principle 1**：简化优先，避免过度设计
- **宪法 Principle 2**：数据完整性至上，使用事务保护
- **宪法 Principle 8**：极简安全策略，信任微信登录

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    微信小程序前端                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 登录页   │  │ 档案管理 │  │ 切换组件 │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │             │             │                       │
│       └─────────────┴─────────────┘                       │
│                     │                                     │
│            ┌────────▼────────┐                            │
│            │  API Request    │ (JWT Token认证)            │
│            │   (HTTPS)       │                            │
└────────────┴─────────────────┴────────────────────────────┘
                     │
                     │ /api/v1/*
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Python FastAPI 后端服务                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Auth Controller    │  Profile Controller         │  │
│  │  (登录、手机号)      │  (CRUD档案)                 │  │
│  └────────┬────────────┴───────────┬─────────────────┘  │
│           │                        │                     │
│  ┌────────▼────────────────────────▼─────────────────┐  │
│  │           Service Layer (业务逻辑)                 │  │
│  │  - 微信API调用  - 档案CRUD  - 档案切换            │  │
│  └────────┬──────────────────────────────────────────┘  │
│           │                                              │
│  ┌────────▼──────────────────────────────────────────┐  │
│  │     SQLAlchemy ORM (数据访问层)                   │  │
│  └────────┬──────────────────────────────────────────┘  │
└───────────┼──────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                    MySQL 数据库                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐       │
│  │ account  │  │ profile  │  │ profile_relation │       │
│  └──────────┘  └──────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### 表1：account（账号表）

```sql
CREATE TABLE `account` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '账号ID',
  `openid` VARCHAR(64) UNIQUE NOT NULL COMMENT '微信OpenID',
  `profile_id` INT DEFAULT NULL COMMENT '关联的主档案ID（该微信属于谁），首次登录时为NULL，创建档案后更新',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX `idx_openid` (`openid`),
  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号表（微信登录账号）';
```

**字段说明**：
- `openid`：微信用户唯一标识，直接存储（不加密）
- `profile_id`：指向该微信账号的主档案（家长自己的档案）

### 表2：profile（档案表）

```sql
CREATE TABLE `profile` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '档案ID',
  `name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '常用名/昵称',
  `id_number` VARCHAR(50) DEFAULT NULL COMMENT '身份证号或护照号（宽松验证）',
  `birthday` DATE NOT NULL COMMENT '生日（用于计算年龄）',
  `gender` TINYINT NOT NULL COMMENT '性别：1=男,2=女',
  `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '头像URL（微信头像或默认头像）',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号（可选，报名体验课时必填）',
  `sports_background` TEXT DEFAULT NULL COMMENT '运动情况（自由文本输入）',
  `level` ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6') DEFAULT 'L1' COMMENT '课程等级（由运营在后台手动设置）',
  `virtual_age` DECIMAL(3,1) NULL COMMENT '虚拟年龄（用于特殊情况的课程匹配）',
  `virtual_age_reason` TEXT NULL COMMENT '虚拟年龄设置原因',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1=正常,0=已删除（软删除）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_name` (`name`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='档案表（家长和学员统一）';
```

**字段说明**：
- `name`：真实姓名（必填）
- `nickname`：常用名，用于后台搜索（选填）
- `id_number`：身份证或护照号，宽松验证（选填）
- `birthday`：生日，用于计算年龄（精确到0.1岁）
- `avatar_url`：头像URL，可存储微信头像或默认头像
- `phone`：手机号，报名体验课时强制要求
- `sports_background`：运动情况，自由文本输入
- `status`：软删除标记，0=已删除但保留历史记录

### 表3：profile_relation（档案关联表）

```sql
CREATE TABLE `profile_relation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `account_id` INT NOT NULL COMMENT '账号ID（谁登录）',
  `profile_id` INT NOT NULL COMMENT '档案ID（能管理谁）',
  `relation_type` ENUM('self', 'child', 'parent', 'spouse') DEFAULT 'self' COMMENT '关系类型',
  `can_book` TINYINT DEFAULT 1 COMMENT '是否可预约（1=可以,0=不可以）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_account_profile` (`account_id`, `profile_id`),
  INDEX `idx_account` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='档案关联表（谁能管理谁）';
```

**关系类型说明**：
- `self`：自己管理自己（如成年学员张三）
- `child`：家长管理孩子（如妈妈管理小明）
- `parent`：子女管理父母（如女儿帮妈妈报课）
- `spouse`：配偶关系（如丈夫帮妻子报课）

### 数据库初始化脚本

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS ccmartmeet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ccmartmeet;

-- 按依赖顺序创建表
-- 1. profile表（无外键依赖）
CREATE TABLE `profile` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '档案ID',
  `name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '常用名/昵称',
  `id_number` VARCHAR(50) DEFAULT NULL COMMENT '身份证号或护照号（宽松验证）',
  `birthday` DATE NOT NULL COMMENT '生日（用于计算年龄）',
  `gender` TINYINT NOT NULL COMMENT '性别：1=男,2=女',
  `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '头像URL（微信头像或默认头像）',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号（可选，报名体验课时必填）',
  `sports_background` TEXT DEFAULT NULL COMMENT '运动情况（自由文本输入）',
  `level` ENUM('L1', 'L2', 'L3', 'L4', 'L5', 'L6') DEFAULT 'L1' COMMENT '课程等级（由运营在后台手动设置）',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1=正常,0=已删除（软删除）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_name` (`name`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='档案表（家长和学员统一）';

-- 2. account表（依赖profile）
CREATE TABLE `account` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '账号ID',
  `openid` VARCHAR(64) UNIQUE NOT NULL COMMENT '微信OpenID',
  `profile_id` INT DEFAULT NULL COMMENT '关联的主档案ID（该微信属于谁）',
  `has_purchased_trial` BOOLEAN DEFAULT FALSE COMMENT '是否已购买过体验课',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX `idx_openid` (`openid`),
  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号表（微信登录账号）';

-- 3. profile_relation表（依赖account和profile）
CREATE TABLE `profile_relation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `account_id` INT NOT NULL COMMENT '账号ID（谁登录）',
  `profile_id` INT NOT NULL COMMENT '档案ID（能管理谁）',
  `relation_type` ENUM('self', 'child', 'parent', 'spouse') DEFAULT 'self' COMMENT '关系类型',
  `can_book` TINYINT DEFAULT 1 COMMENT '是否可预约（1=可以,0=不可以）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_account_profile` (`account_id`, `profile_id`),
  INDEX `idx_account` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='档案关联表（谁能管理谁）';

-- 4. virtual_age_log表（虚拟年龄变更记录）
CREATE TABLE `virtual_age_log` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `old_virtual_age` DECIMAL(3,1) NULL COMMENT '原虚拟年龄',
  `new_virtual_age` DECIMAL(3,1) NULL COMMENT '新虚拟年龄',
  `change_reason` TEXT NULL COMMENT '变更原因',
  `admin_id` INT NULL COMMENT '操作管理员ID（运营人员调整时使用）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',

  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  INDEX `idx_profile` (`profile_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='虚拟年龄变更记录表';
```

## API Design

### API Base URL

- **开发环境**: `http://localhost:8000/api/v1`
- **生产环境**: `https://api.ccmartmeet.com/api/v1`

### API统一响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 业务数据
  }
}
```

**错误响应**：
```json
{
  "code": 400,
  "message": "参数错误：姓名不能为空",
  "data": null
}
```

### API端点详细设计

#### 1. POST /api/v1/auth/login（微信静默登录）

**功能**：接收小程序的wx.login返回的code，换取OpenID并生成JWT Token

**请求参数**：
```json
{
  "code": "string (微信授权code)"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "account_id": 1,
    "profile_id": null,
    "expires_at": "2025-11-25T00:00:00Z"
  }
}
```

**业务逻辑**：
1. 调用微信API: `https://api.weixin.qq.com/sns/jscode2session`
2. 获取OpenID后查询account表
3. 如果OpenID不存在，创建新account记录（profile_id暂时为null）
4. 生成JWT Token（有效期30天）
5. 返回token和account_id

#### 2. POST /api/v1/auth/phone（获取手机号）

**功能**：解密微信返回的手机号

**请求参数**：
```json
{
  "code": "string (wx.getPhoneNumber返回的code)"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "phone": "13800138000"
  }
}
```

#### 3. POST /api/v1/profiles（创建档案）

**功能**：创建新的档案（根据报课目的创建对应类型档案）

**请求参数**：
```json
{
  "name": "李女士",
  "nickname": "小李",
  "id_number": "110101199001011234",
  "birthday": "1990-01-01",
  "gender": 2,
  "relation_type": "self|child|spouse",
  "avatar_url": "https://wx.qlogo.cn/...",
  "phone": "13800138000",
  "sports_background": "曾练习过瑜伽和游泳"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "profile_id": 1,
    "age": 35.8,
    "created_at": "2025-10-26T23:00:00Z"
  }
}
```

**业务逻辑**：
1. 验证JWT Token获取account_id
2. 检查档案数量是否超过5个
3. 验证relation_type枚举值（'self'/'child'/'spouse'）
4. 如果是首次创建（account.profile_id为null），将此档案设为主档案
5. 创建profile记录
6. 在profile_relation表建立关联关系，使用传入的relation_type
7. 返回档案ID和年龄

#### 4. GET /api/v1/profiles（获取档案列表）

**功能**：获取当前账号可管理的所有档案

**请求参数**：无（从JWT Token中提取account_id）

**响应示例**：
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "profiles": [
      {
        "profile_id": 1,
        "name": "李女士",
        "nickname": "小李",
        "birthday": "1990-01-01",
        "age": 35.8,
        "gender": 2,
        "avatar_url": "https://...",
        "relation_type": "self",
        "is_current": true
      },
      {
        "profile_id": 2,
        "name": "小明",
        "nickname": "明明",
        "birthday": "2015-03-10",
        "age": 10.6,
        "gender": 1,
        "avatar_url": "https://...",
        "relation_type": "child",
        "is_current": false
      }
    ],
    "total": 2,
    "limit": 5
  }
}
```

#### 5. GET /api/v1/profiles/{id}（获取档案详情）

**功能**：获取指定档案的详细信息

**请求参数**：无

**响应示例**：
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "profile_id": 1,
    "name": "李女士",
    "nickname": "小李",
    "id_number": "110101199001011234",
    "birthday": "1990-01-01",
    "age": 35.8,
    "gender": 2,
    "avatar_url": "https://...",
    "phone": "13800138000",
    "sports_background": "曾练习过瑜伽和游泳",
    "status": 1,
    "created_at": "2025-10-26T23:00:00Z"
  }
}
```

**权限验证**：检查该档案是否属于当前account

#### 6. PUT /api/v1/profiles/{id}（更新档案）

**功能**：更新档案信息（姓名、常用名、手机号、运动情况可修改）

**请求参数**：
```json
{
  "name": "李女士",
  "nickname": "小李姐",
  "phone": "13900139000",
  "sports_background": "增加了跑步训练"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "profile_id": 1,
    "updated_at": "2025-10-26T23:30:00Z"
  }
}
```

**业务规则**：
- ❌ 不允许修改：birthday, gender
- ✅ 允许修改：name, nickname, phone, sports_background, avatar_url

#### 7. DELETE /api/v1/profiles/{id}（删除档案）

**功能**：软删除档案（status=0）

**请求参数**：无

**响应示例**：
```json
{
  "code": 200,
  "message": "删除成功（历史记录已保留）",
  "data": {
    "profile_id": 1,
    "deleted_at": "2025-10-26T23:45:00Z"
  }
}
```

**业务逻辑**：
1. 检查该档案是否有未完成的预约
2. 如果有预约，弹出确认提示（前端处理）
3. 更新status=0（软删除）
4. 预约记录保留，仍然有效

#### 8. POST /api/v1/profiles/switch（切换当前档案）

**功能**：切换当前操作的档案

**请求参数**：
```json
{
  "profile_id": 2
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "已切换至：小明",
  "data": {
    "profile_id": 2,
    "name": "小明",
    "age": 10.6
  }
}
```

**业务逻辑**：
1. 验证profile_id是否属于当前account
2. 更新session或返回新token（包含current_profile_id）
3. 前端显示Toast提示

#### 9. GET /api/v1/profiles/current（获取当前档案）

**功能**：获取当前选中的档案

**请求参数**：无（从JWT Token或session中提取）

**响应示例**：
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "profile_id": 1,
    "name": "李女士",
    "age": 35.8,
    "avatar_url": "https://..."
  }
}
```

#### 10. GET /api/v1/profiles/validate-limit（检查档案数量上限）

**功能**：检查当前账号是否达到档案上限（5个）

**请求参数**：无

**响应示例**：
```json
{
  "code": 200,
  "message": "未达上限",
  "data": {
    "current_count": 3,
    "limit": 5,
    "can_create": true
  }
}
```

#### 11. PUT /api/v1/profiles/{id}/virtual-age（设置虚拟年龄）

**功能**：为档案设置或更新虚拟年龄，用于特殊情况下的课程匹配

**请求参数**：
```json
{
  "virtual_age": 6.5,
  "change_reason": "身高较高，建议匹配6岁课程"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "虚拟年龄设置成功",
  "data": {
    "profile_id": 1,
    "actual_age": 5.8,
    "virtual_age": 6.5,
    "age_difference": 0.7,
    "updated_at": "2025-10-31T10:30:00Z"
  }
}
```

**业务逻辑**：
1. 验证虚拟年龄范围（2-18岁）
2. 检查与实际年龄的合理性差异（建议不超过±3岁）
3. 记录变更历史到virtual_age_log表
4. 返回实际年龄和虚拟年龄的对比信息

#### 12. DELETE /api/v1/profiles/{id}/virtual-age（清空虚拟年龄）

**功能**：清空档案的虚拟年龄设置，恢复使用实际年龄

**请求参数**：无

**响应示例**：
```json
{
  "code": 200,
  "message": "虚拟年龄已清空",
  "data": {
    "profile_id": 1,
    "actual_age": 5.8,
    "virtual_age": null,
    "updated_at": "2025-10-31T10:35:00Z"
  }
}
```

#### 13. GET /api/v1/profiles/{id}/virtual-age/log（获取虚拟年龄变更记录）

**功能**：获取档案的虚拟年龄历史变更记录，用于运营分析

**请求参数**：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）

**响应示例**：
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "logs": [
      {
        "id": 1,
        "old_virtual_age": null,
        "new_virtual_age": 6.5,
        "change_reason": "身高较高，建议匹配6岁课程",
        "admin_id": null,
        "created_at": "2025-10-31T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

## Frontend Pages Design

### 页面1：登录页（pages/login/login）

**路径**：`/pages/login/login`

**功能**：微信静默登录

**页面结构**：
```xml
<view class="login-container">
  <image src="/images/logo.png"></image>
  <text class="title">百适体操馆</text>
  <text class="subtitle">欢迎您</text>
  <view class="loading" wx:if="{{isLoading}}">
    <text>正在登录...</text>
  </view>
</view>
```

**业务逻辑**（login.js）：
```javascript
Page({
  data: {
    isLoading: true
  },

  onLoad() {
    this.autoLogin();
  },

  async autoLogin() {
    try {
      // 1. 微信静默登录
      const { code } = await wx.login();

      // 2. 发送code到后端
      const res = await request.post('/auth/login', { code });

      // 3. 存储token
      wx.setStorageSync('token', res.data.token);
      wx.setStorageSync('account_id', res.data.account_id);

      // 4. 判断是否有档案
      if (res.data.profile_id === null) {
        // 首次登录，跳转到创建档案页
        wx.redirectTo({ url: '/pages/profile/create?first=true' });
      } else {
        // 已有档案，跳转到主页
        wx.switchTab({ url: '/pages/index/index' });
      }
    } catch (err) {
      // 5. 登录失败处理
      wx.showModal({
        title: '登录失败',
        content: '请检查网络后重试',
        confirmText: '重新登录',
        success: (res) => {
          if (res.confirm) {
            this.autoLogin();
          }
        }
      });
    }
  }
});
```

### 组件：报课目的选择弹框（components/purpose-selector）

**功能**：微信风格的报课目的选择弹框

**组件结构**：
```xml
<!-- components/purpose-selector/purpose-selector.wxml -->
<view class="purpose-selector" wx:if="{{showSelector}}">
  <view class="mask" bindtap="handleClose"></view>
  <view class="selector-content" animation="{{animationData}}">
    <view class="selector-header">
      <text class="title">为谁报课？</text>
    </view>
    <view class="selector-options">
      <view class="option" bindtap="handleSelect" data-type="self">
        <image class="option-icon" src="/images/icon-self.png"/>
        <view class="option-text">
          <text class="option-title">自己</text>
          <text class="option-desc">为本人购买课程</text>
        </view>
      </view>
      <view class="option" bindtap="handleSelect" data-type="child">
        <image class="option-icon" src="/images/icon-child.png"/>
        <view class="option-text">
          <text class="option-title">孩子</text>
          <text class="option-desc">为孩子购买课程</text>
        </view>
      </view>
      <view class="option" bindtap="handleSelect" data-type="spouse">
        <image class="option-icon" src="/images/icon-family.png"/>
        <view class="option-text">
          <text class="option-title">家人朋友</text>
          <text class="option-desc">为家人朋友购买课程</text>
        </view>
      </view>
    </view>
  </view>
</view>
```

**业务逻辑**：
```javascript
// components/purpose-selector/purpose-selector.js
Component({
  properties: {
    showSelector: Boolean
  },

  methods: {
    handleSelect(e) {
      const { type } = e.currentTarget.dataset;
      this.triggerEvent('select', { relation_type: type });
    },

    handleClose() {
      this.triggerEvent('close');
    }
  }
});
```

### 页面2：创建档案页（pages/profile/create）

**路径**：`/pages/profile/create`

**功能**：创建档案表单

**页面结构**：
```xml
<form bindsubmit="handleSubmit">
  <view class="form-item">
    <text class="label">真实姓名 *</text>
    <input name="name" placeholder="请输入真实姓名" maxlength="50"/>
  </view>

  <view class="form-item">
    <text class="label">常用名</text>
    <input name="nickname" placeholder="便于搜索（选填）"/>
  </view>

  <view class="form-item">
    <text class="label">生日 *</text>
    <picker mode="date" end="{{today}}" bindchange="handleBirthdayChange">
      <view class="picker">{{birthday || '请选择生日'}}</view>
    </picker>
  </view>

  <view class="form-item">
    <text class="label">性别 *</text>
    <radio-group name="gender">
      <label><radio value="1"/>男</label>
      <label><radio value="2"/>女</label>
    </radio-group>
  </view>

  <view class="form-item">
    <text class="label">手机号</text>
    <button open-type="getPhoneNumber" bindgetphonenumber="handleGetPhone">
      微信授权获取手机号
    </button>
  </view>

  <view class="form-item">
    <text class="label">身份证/护照</text>
    <input name="id_number" placeholder="选填"/>
  </view>

  <view class="form-item">
    <text class="label">运动情况</text>
    <textarea name="sports_background"
              placeholder="请描述孩子的运动历史和擅长项目（选填）"
              maxlength="500"/>
  </view>

  <button formType="submit" class="submit-btn">保存档案</button>
  <button wx:if="{{canSkip}}" bindtap="handleSkip" class="skip-btn">
    暂不创建
  </button>
</form>
```

**业务逻辑**（create.js）：
```javascript
Page({
  data: {
    birthday: '',
    phone: '',
    relation_type: '',
    pageTitle: '创建档案',
    canSkip: false,
    today: new Date().toISOString().split('T')[0]
  },

  onLoad(options) {
    this.setData({
      canSkip: !options.first,
      relation_type: options.relation_type || ''
    });

    // 根据relation_type设置页面标题
    const titles = {
      'self': '创建我的档案',
      'child': '创建孩子档案',
      'spouse': '创建家人档案'
    };

    if (options.relation_type && titles[options.relation_type]) {
      this.setData({ pageTitle: titles[options.relation_type] });
      wx.setNavigationBarTitle({ title: titles[options.relation_type] });
    }
  },

  async handleGetPhone(e) {
    if (e.detail.code) {
      const res = await request.post('/auth/phone', { code: e.detail.code });
      this.setData({ phone: res.data.phone });
    }
  },

  async handleSubmit(e) {
    const formData = e.detail.value;

    // 验证必填字段
    if (!formData.name || !this.data.birthday || !formData.gender) {
      wx.showToast({ title: '请填写必填项', icon: 'none' });
      return;
    }

    // 检查档案数量上限
    const limitRes = await request.get('/profiles/validate-limit');
    if (!limitRes.data.can_create) {
      wx.showModal({
        title: '提示',
        content: `最多创建${limitRes.data.limit}个档案`,
        showCancel: false
      });
      return;
    }

    // 提交创建
    try {
      await request.post('/profiles', {
        ...formData,
        birthday: this.data.birthday,
        phone: this.data.phone,
        relation_type: this.data.relation_type
      });

      wx.showToast({ title: '创建成功', icon: 'success' });

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  handleSkip() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
```

### 页面3：档案列表页（pages/profile/list）

**功能**：显示所有档案，支持切换、编辑、删除

**页面结构**：
```xml
<view class="profile-list">
  <view class="profile-item" wx:for="{{profiles}}" wx:key="profile_id">
    <image class="avatar" src="{{item.avatar_url}}"/>
    <view class="info">
      <text class="name">{{item.name}}</text>
      <text class="age">{{item.age}}岁</text>
      <text class="relation">{{item.relation_text}}</text>
    </view>
    <view class="actions">
      <button size="mini" bindtap="handleSwitch" data-id="{{item.profile_id}}">
        切换
      </button>
      <button size="mini" bindtap="handleEdit" data-id="{{item.profile_id}}">
        编辑
      </button>
      <button size="mini" bindtap="handleDelete" data-id="{{item.profile_id}}">
        删除
      </button>
    </view>
  </view>

  <button class="add-btn" bindtap="handleAdd" disabled="{{!canAdd}}">
    添加家人档案 ({{profiles.length}}/{{limit}})
  </button>
</view>
```

### 组件：档案切换器（components/profile-switcher）

**功能**：顶部导航栏显示当前档案，点击切换

**组件结构**：
```xml
<view class="switcher" bindtap="showModal">
  <image class="avatar" src="{{currentProfile.avatar_url}}"/>
  <text class="name">{{currentProfile.name}}</text>
  <image class="arrow" src="/images/arrow-down.png"/>
</view>

<modal show="{{showModal}}">
  <view class="profile-list">
    <view class="item" wx:for="{{profiles}}" wx:key="profile_id"
          bindtap="handleSwitch" data-id="{{item.profile_id}}">
      <image src="{{item.avatar_url}}"/>
      <text>{{item.name}}</text>
      <icon wx:if="{{item.is_current}}" type="success"/>
    </view>
  </view>
</modal>
```

## Implementation Details

### Key Business Logic

#### 年龄计算逻辑（精确到0.1岁）

```python
# backend/app/utils/age_calculator.py
from datetime import date

def calculate_age(birthday: date) -> float:
    """
    计算年龄，精确到小数点后1位
    示例：2023-04-01 → 2.6岁
    """
    today = date.today()
    days = (today - birthday).days
    age = days / 365.25  # 考虑闰年
    return round(age, 1)  # 保留1位小数
```

#### 档案数量上限控制

```python
# backend/app/services/profile_service.py
async def can_create_profile(account_id: int) -> bool:
    """检查是否可以创建新档案"""
    count = await db.query(ProfileRelation).filter(
        ProfileRelation.account_id == account_id
    ).count()

    return count < 5  # 上限5个档案
```

#### 档案删除逻辑

```python
async def delete_profile(profile_id: int, account_id: int):
    """软删除档案"""
    # 1. 验证权限
    relation = await verify_profile_access(account_id, profile_id)
    if not relation:
        raise PermissionError("无权删除该档案")

    # 2. 检查预约记录
    has_bookings = await check_active_bookings(profile_id)
    if has_bookings:
        # 前端已弹窗确认，这里直接执行
        pass

    # 3. 软删除
    await db.query(Profile).filter(Profile.id == profile_id).update({
        'status': 0
    })

    return {"message": "删除成功（历史记录已保留）"}
```

### Security Considerations

- **用户数据隔离**：每个API调用都验证档案归属，防止越权访问
- **API权限验证**：JWT Token验证，确保只有合法用户能操作
- **输入验证**：Pydantic模型验证所有输入参数
- **敏感数据处理**：OpenID直接存储，信任微信安全机制

### Performance Optimization

- **数据库优化**：在关键字段上建立索引（openid, name, phone）
- **缓存策略**：档案列表可缓存，减少数据库查询
- **前端性能**：使用微信小程序原生组件，避免复杂DOM操作
- **API性能**：异步处理，避免阻塞

## Testing Strategy

### Unit Tests
- **业务逻辑测试**：年龄计算、档案上限检查等
- **API测试**：每个端点的正常和异常情况
- **数据验证测试**：Pydantic模型验证逻辑

### Integration Tests
- **数据库集成测试**：CRUD操作完整性
- **微信API集成测试**：登录、手机号获取流程
- **JWT认证测试**：Token生成和验证流程

### End-to-End Tests
- **完整用户流程**：从登录到档案管理
- **跨平台测试**：小程序不同版本兼容性
- **异常处理测试**：网络异常、权限异常等

## Constitution Compliance

- ✅ **Principle 1**: 使用微信原生框架，AI Coding友好，复用现有relation_type字段实现简化优先
- ✅ **Principle 2**: 档案软删除保护历史数据，年龄实时计算确保数据一致性
- ✅ **Principle 3**: 代码结构清晰分层，可维护性好，选择流程逻辑简洁
- ✅ **Principle 4**: RESTful API设计，前后端解耦，relation_type参数设计合理
- ✅ **Principle 5**: MVP纵向切片，完整用户身份系统可独立交付
- ✅ **Principle 6**: 以用户体验为中心，3步内完成核心操作（登录→选择→创建）
- ✅ **Principle 7**: 关键数据操作有测试覆盖，relation_type数据验证完善
- ✅ **Principle 8**: 极简安全策略，JWT Token + 微信登录
- ✅ **Principle 9**: 数据模型设计支持后续扩展迁移

## Deployment Plan

### Environment Requirements
- **开发环境**：Python 3.11+, MySQL 8.0+, 微信开发者工具
- **测试环境**：Docker容器化部署
- **生产环境**：云服务器 + CDN + 负载均衡

### Migration Strategy
- **数据库迁移**：使用Alembic进行版本控制
- **数据迁移**：软删除机制保护历史数据
- **API版本控制**：URL路径版本控制（/api/v1/）

### Monitoring & Logging
- **应用监控**：FastAPI内置监控 + 自定义健康检查
- **错误日志**：结构化日志记录，便于排查问题
- **性能监控**：API响应时间、数据库查询性能监控

## Risk Assessment

### Technical Risks
- **微信API变更**：微信接口可能调整，需要关注官方公告
- **并发控制**：档案创建时的并发控制，使用数据库唯一约束
- **数据一致性**：软删除和关联数据的一致性维护

### Business Risks
- **用户隐私**：微信用户数据保护，遵循微信隐私政策
- **数据安全**：OpenID等敏感信息存储安全
- **用户体验**：首次登录流程复杂度，需要充分测试

## Timeline Estimation

### Development Phases
- **Phase 1**: 数据库设计和后端API开发 - 5天
- **Phase 2**: 小程序前端页面开发 - 4天
- **Phase 3**: 集成测试和异常处理 - 3天
- **Phase 4**: 用户体验优化和部署 - 2天

### Total Estimated Time
**14天**（约2-3周，包含测试和优化时间）
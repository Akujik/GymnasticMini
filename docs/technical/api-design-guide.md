# 🔌 API设计指南 - RESTful API规范

**API Design Guide - RESTful API Standards**

**版本**: 1.0.0
**最后更新**: 2025-11-17
**适用于**: 后端开发人员、API消费者、前端开发者

---

## 📋 设计原则

### RESTful架构原则
- **资源导向**: URL表示资源，HTTP方法表示操作
- **无状态**: 每个请求包含处理所需的所有信息
- **统一接口**: 使用标准的HTTP方法和状态码
- **分层系统**: 客户端不需要知道是否直接连接到最终服务器

### 设计目标
- 🎯 **一致性**: 所有API遵循统一的设计模式
- 🚀 **性能**: 响应时间 < 500ms，支持高并发
- 🔒 **安全**: 完善的认证授权机制
- 📖 **易用**: 清晰的文档和错误信息

## 🔗 API版本控制

### 版本策略
```
/api/v1/users          # v1版本
/api/v2/users          # v2版本
```

### 版本兼容性
- **向后兼容**: 新版本保持对旧版本客户端的兼容
- **废弃通知**: 提前3个月通知API废弃
- **迁移指南**: 提供详细的版本迁移文档

### HTTP头版本控制
```http
GET /api/users
Accept: application/vnd.ccmartmeet.v1+json
```

## 🏗️ URL设计规范

### 基础URL结构
```
https://api.ccmartmeet.com/api/v1/{resource}
```

### 资源命名规范
- **复数名词**: `/api/v1/users`、`/api/v1/courses`
- **小写字母**: `/api/v1/user-profiles`
- **连字符分隔**: `/api/v1/course-schedules`
- **避免缩写**: 使用完整词汇 `/api/v1/students` 而非 `/api/v1/stus`

### 层级关系
```
# 基础资源
/api/v1/users                    # 用户列表
/api/v1/users/{user_id}           # 特定用户

# 嵌套资源
/api/v1/users/{user_id}/profiles     # 用户的档案
/api/v1/users/{user_id}/bookings     # 用户的预约
/api/v1/courses/{course_id}/sessions # 课程的课时
```

### 查询参数
```http
# 分页
GET /api/v1/users?page=2&limit=20

# 排序
GET /api/v1/users?sort=created_at&order=desc

# 过滤
GET /api/v1/users?status=active&role=student

# 搜索
GET /api/v1/users?search=张三&fields=name,phone

# 时间范围
GET /api/v1/bookings?start_date=2025-01-01&end_date=2025-12-31

# 字段选择
GET /api/v1/users?fields=id,name,email,created_at
```

## 📤 HTTP方法使用

### 标准HTTP方法

| 方法 | 用途 | 示例 | 幂等性 |
|------|------|------|--------|
| GET | 获取资源 | `GET /api/v1/users` | ✅ |
| POST | 创建资源 | `POST /api/v1/users` | ❌ |
| PUT | 完整更新资源 | `PUT /api/v1/users/1` | ✅ |
| PATCH | 部分更新资源 | `PATCH /api/v1/users/1` | ❌ |
| DELETE | 删除资源 | `DELETE /api/v1/users/1` | ✅ |

### 自定义动作
对于不适合CRUD的操作，使用POST方法：
```http
# 用户操作
POST /api/v1/users/{user_id}/activate
POST /api/v1/users/{user_id}/deactivate

# 业务操作
POST /api/v1/bookings/{booking_id}/cancel
POST /api/v1/bookings/{booking_id}/confirm
POST /api/v1/wallets/{wallet_id}/adjust
```

## 📊 HTTP状态码

### 成功状态码
- **200 OK**: 请求成功
- **201 Created**: 资源创建成功
- **204 No Content**: 操作成功，无返回内容

### 客户端错误状态码
- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足
- **404 Not Found**: 资源不存在
- **409 Conflict**: 资源冲突
- **422 Unprocessable Entity**: 业务验证失败
- **429 Too Many Requests**: 请求过于频繁

### 服务器错误状态码
- **500 Internal Server Error**: 服务器内部错误
- **502 Bad Gateway**: 网关错误
- **503 Service Unavailable**: 服务不可用

## 📦 请求和响应格式

### 请求格式

#### Content-Type
```http
# JSON请求
Content-Type: application/json

# 表单请求
Content-Type: application/x-www-form-urlencoded

# 文件上传
Content-Type: multipart/form-data
```

#### 请求体示例
```json
// 创建用户
POST /api/v1/users
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "phone": "13812345678",
  "profiles": [
    {
      "name": "小明",
      "birthday": "2018-05-15",
      "gender": "male"
    }
  ]
}
```

### 响应格式

#### 统一响应结构
```json
{
  "success": true,
  "data": {
    // 实际数据
  },
  "message": "操作成功",
  "timestamp": "2025-11-17T12:00:00Z",
  "request_id": "req_123456789"
}
```

#### 错误响应结构
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2025-11-17T12:00:00Z",
  "request_id": "req_123456789"
}
```

#### 分页响应结构
```json
{
  "success": true,
  "data": {
    "items": [
      // 资源列表
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

## 🔐 认证和授权

### JWT Token认证
```http
# 登录获取Token
POST /api/v1/auth/login
{
  "wechat_code": "wx_code_here"
}

// 响应
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "name": "张三"
    }
  }
}
```

### 请求头认证
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 权限控制
```http
# 管理员专用API
GET /api/v1/admin/users
Authorization: Bearer {admin_token}

# 用户专用API
GET /api/v1/users/me/profile
Authorization: Bearer {user_token}
```

## 📝 数据验证

### Pydantic模式示例
```python
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    profiles: List[UserProfileCreate] = []

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('姓名不能为空')
        return v.strip()

    @validator('phone')
    def validate_phone(cls, v):
        import re
        if not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('手机号格式不正确')
        return v

class UserProfileCreate(BaseModel):
    name: str
    birthday: datetime
    gender: str

    @validator('gender')
    def validate_gender(cls, v):
        if v not in ['male', 'female']:
            raise ValueError('性别只能是male或female')
        return v
```

### 错误响应示例
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确",
        "code": "INVALID_EMAIL"
      },
      {
        "field": "phone",
        "message": "手机号格式不正确",
        "code": "INVALID_PHONE"
      }
    ]
  }
}
```

## 🔍 搜索和过滤

### 通用过滤参数
```http
# 时间过滤
GET /api/v1/bookings?start_date=2025-01-01&end_date=2025-12-31

# 状态过滤
GET /api/v1/users?status=active,verified

# 精确匹配
GET /api/v1/courses?type=private&level=l1

# 模糊搜索
GET /api/v1/users?search=张三&search_fields=name,phone

# 数值范围
GET /api/v1/courses?min_price=100&max_price=500

# 排序
GET /api/v1/users?sort=created_at&order=desc

# 分页
GET /api/v1/users?page=2&limit=20
```

### 高级搜索
```http
POST /api/v1/users/search
{
  "filters": {
    "status": ["active", "verified"],
    "created_at": {
      "gte": "2025-01-01",
      "lte": "2025-12-31"
    },
    "profiles.gender": "female"
  },
  "search": "张",
  "search_fields": ["name", "phone"],
  "sort": [
    {"field": "created_at", "order": "desc"},
    {"field": "name", "order": "asc"}
  ],
  "page": 1,
  "limit": 20
}
```

## ⚡ 性能优化

### 分页策略
```http
# 偏移分页（适用于少量数据）
GET /api/v1/users?page=1&limit=20

# 游标分页（适用于大量数据）
GET /api/v1/users?limit=20&after=cursor_value
```

### 缓存策略
```http
# 缓存控制头
Cache-Control: public, max-age=300

# ETag支持
GET /api/v1/users/1
ETag: "abc123"

# 条件请求
GET /api/v1/users/1
If-None-Match: "abc123"
```

### 字段选择
```http
# 只返回需要的字段
GET /api/v1/users?fields=id,name,email
```

### 嵌套资源限制
```http
# 限制嵌套资源返回数量
GET /api/v1/users/1/bookings?limit=10&include=course

# 避免N+1查询问题
GET /api/v1/users?include=profiles,bookings
```

## 📚 API文档

### OpenAPI规范
```yaml
openapi: 3.0.0
info:
  title: 百适体操馆管理系统API
  version: 1.0.0
  description: RESTful API文档

paths:
  /api/v1/users:
    get:
      summary: 获取用户列表
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
```

### 自动文档生成
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## 🛡️ 安全最佳实践

### 输入验证
- 所有输入数据必须验证
- 使用类型安全的序列化器
- 防止SQL注入、XSS攻击

### 输出过滤
```json
// 敏感信息不返回
{
  "id": 1,
  "name": "张三",
  // "password": "密码不返回",
  // "internal_id": "内部ID不返回"
}
```

### 速率限制
```http
# 速率限制头
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### CORS配置
```http
# 预检请求响应
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## 🧪 测试

### API测试示例
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestUserAPI:
    def test_create_user_success(self):
        """测试创建用户成功"""
        user_data = {
            "name": "测试用户",
            "email": "test@example.com",
            "phone": "13812345678"
        }

        response = client.post("/api/v1/users", json=user_data)

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == user_data["name"]
        assert "id" in data["data"]

    def test_get_user_not_found(self):
        """测试获取不存在的用户"""
        response = client.get("/api/v1/users/999999")

        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert "not found" in data["error"]["message"].lower()
```

## 📈 监控和日志

### API监控指标
- **响应时间**: 平均、P95、P99
- **错误率**: 按状态码和端点分类
- **请求量**: 总请求数、QPS
- **并发数**: 同时处理的请求数

### 日志格式
```json
{
  "timestamp": "2025-11-17T12:00:00Z",
  "level": "INFO",
  "message": "User created successfully",
  "request_id": "req_123456789",
  "user_id": 123,
  "endpoint": "/api/v1/users",
  "method": "POST",
  "duration_ms": 150,
  "status_code": 201
}
```

## 🔧 开发工具

### API测试工具
- **Postman**: API测试和调试
- **Insomnia**: 轻量级API客户端
- **HTTPie**: 命令行HTTP客户端
- **curl**: 基础HTTP客户端

### 文档工具
- **Swagger Editor**: OpenAPI规范编辑器
- **Postman Collections**: API集合管理
- **API Blueprint**: API文档标记语言

## 📋 检查清单

### 设计检查清单
- [ ] URL遵循RESTful规范
- [ ] HTTP方法使用正确
- [ ] 状态码使用恰当
- [ ] 输入验证完整
- [ ] 错误处理完善
- [ ] 认证授权正确实现
- [ ] 性能优化措施到位
- [ ] 文档完整准确

### 代码检查清单
- [ ] 遵循项目代码规范
- [ ] 有足够的单元测试
- [ ] 集成测试覆盖主要流程
- [ ] 日志记录完善
- [ ] 错误处理健壮
- [ ] 数据库查询优化
- [ ] 缓存策略合理

---

**📝 重要提醒**: 本指南会根据项目发展和使用反馈持续更新，请定期查看最新版本。

**Happy API Design! 🚀**
# API契约文档: 004-private-lesson

**功能**: Private Lesson System API Contracts
**创建时间**: 2025-11-08
**版本**: 1.0.0
**API版本**: v1
**基础URL**: https://api.ccmartmeet.com/api/v1

---

## 契约概述

本文档定义了私教课系统的前后端接口契约，包括请求/响应格式、错误处理、认证机制等技术规范。所有API必须严格遵循FR-042仅浏览模式和FR-040 4维标签匹配要求。

### 核心原则

1. **仅浏览模式**: 不提供直接在线预约API，仅支持浏览和咨询
2. **4维匹配**: 严格遵循等级+年龄+性别+类型的白名单匹配
3. **咨询驱动**: 通过咨询流程连接用户和运营人员
4. **线下支付**: 不处理在线支付，仅记录预约信息

### 通用规范

#### HTTP状态码规范
```json
{
  "200": "请求成功",
  "400": "请求参数错误",
  "401": "未授权访问",
  "403": "权限不足",
  "404": "资源不存在",
  "409": "资源冲突",
  "422": "数据验证失败",
  "429": "请求频率限制",
  "500": "服务器内部错误"
}
```

#### 统一响应格式
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 错误响应格式
```json
{
  "code": 400,
  "message": "请求参数错误",
  "errors": [
    {
      "field": "profile_id",
      "message": "学员档案ID不能为空"
    }
  ],
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 认证授权契约

### JWT Token格式
```json
{
  "sub": "user_id",
  "exp": 1736409600,
  "iat": 1736323200,
  "iss": "ccmartmeet",
  "aud": "ccmartmeet-app",
  "scope": ["read:private_lessons", "write:inquiries"],
  "user_type": "parent"
}
```

### Authorization Header
```
Authorization: Bearer <JWT_TOKEN>
```

### 权限范围定义
- `read:private_lessons`: 浏览私教课程信息
- `write:inquiries`: 提交和管理咨询申请
- `admin:private_bookings`: 管理私教预约（运营后台）
- `admin:instructors`: 管理教练信息（运营后台）

---

## 1. 私教课浏览API契约

### 1.1 获取私教教练列表

**接口**: `GET /api/v1/private-lessons`

**功能描述**: 根据学员档案信息获取匹配的私教教练列表，严格应用4维标签匹配

**请求参数**:
```json
{
  "profile_id": {
    "type": "integer",
    "required": true,
    "description": "学员档案ID，用于4维匹配"
  },
  "page": {
    "type": "integer",
    "default": 1,
    "min": 1,
    "description": "页码"
  },
  "limit": {
    "type": "integer",
    "default": 20,
    "min": 1,
    "max": 50,
    "description": "每页数量"
  },
  "sort": {
    "type": "string",
    "enum": ["match_score", "rating", "experience", "price"],
    "default": "match_score",
    "description": "排序方式"
  },
  "order": {
    "type": "string",
    "enum": ["asc", "desc"],
    "default": "desc",
    "description": "排序方向"
  }
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "instructors": [
      {
        "id": 1,
        "name": "张教练",
        "avatar_url": "https://example.com/avatar1.jpg",
        "bio": "10年体操教学经验，擅长儿童启蒙教学",
        "specialties": ["儿童体操", "平衡木", "自由体操"],
        "price_per_hour": 300,
        "rating": 4.8,
        "teaching_hours": 1200,
        "level_range": "L1-L3",
        "age_range": "4-8岁",
        "gender": "female",
        "course_type": "private",
        "skill_types": ["balance_beam", "floor_exercise"],
        "match_score": 100.0,
        "match_details": {
          "level_match": true,
          "age_match": true,
          "gender_match": true,
          "type_match": true,
          "match_reason": "完全匹配您的需求"
        },
        "popularity_score": 95,
        "available_slots": 15
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_count": 45,
      "has_next": true,
      "has_prev": false
    },
    "search_summary": {
      "profile_tags": {
        "level": "L2",
        "age": "6岁",
        "gender": "female",
        "course_type": "private"
      },
      "matched_count": 45,
      "total_instructors": 80
    }
  },
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**错误响应**:
- **400** (缺少必需参数):
```json
{
  "code": 400,
  "message": "请求参数错误",
  "errors": [
    {
      "field": "profile_id",
      "message": "学员档案ID不能为空"
    }
  ]
}
```

- **404** (学员档案不存在):
```json
{
  "code": 404,
  "message": "学员档案不存在",
  "errors": [
    {
      "field": "profile_id",
      "message": "指定的学员档案ID不存在"
    }
  ]
}
```

### 1.2 获取私教教练详情

**接口**: `GET /api/v1/private-lessons/{instructor_id}`

**功能描述**: 获取指定私教教练的详细信息，包括4维匹配详情

**路径参数**:
```json
{
  "instructor_id": {
    "type": "integer",
    "required": true,
    "description": "教练ID"
  }
}
```

**查询参数**:
```json
{
  "profile_id": {
    "type": "integer",
    "required": true,
    "description": "学员档案ID，用于计算匹配度"
  }
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "instructor": {
      "id": 1,
      "name": "张教练",
      "avatar_url": "https://example.com/avatar1.jpg",
      "bio": "10年体操教学经验，擅长儿童启蒙教学，国家一级体操运动员，持有体操教练资格证",
      "specialties": ["儿童体操", "平衡木", "自由体操"],
      "price_per_hour": 300,
      "rating": 4.8,
      "teaching_hours": 1200,
      "certifications": ["国家一级运动员", "体操教练资格证", "儿童心理指导师"],
      "experience_years": 10,
      "level_range": "L1-L3",
      "age_range": "4-8岁",
      "gender": "female",
      "course_type": "private",
      "skill_types": ["balance_beam", "floor_exercise", "vault"],
      "teaching_style": "耐心细致，注重基础动作规范",
      "student_feedback": [
        {
          "student_name": "小明**",
          "rating": 5,
          "comment": "张教练很专业，孩子进步很快",
          "lesson_count": 12
        }
      ],
      "match_score": 100.0,
      "match_details": {
        "level_match": {
          "matched": true,
          "instructor_range": "L1-L3",
          "student_level": "L2",
          "detail": "学员等级L2在教练教学范围L1-L3内"
        },
        "age_match": {
          "matched": true,
          "instructor_range": "4-8岁",
          "student_age": "6岁",
          "detail": "学员年龄6岁在教练教学范围4-8岁内"
        },
        "gender_match": {
          "matched": true,
          "instructor_gender": "female",
          "student_gender": "female",
          "detail": "教练性别要求与学员性别匹配"
        },
        "type_match": {
          "matched": true,
          "instructor_type": "private",
          "student_type": "private",
          "detail": "课程类型匹配"
        },
        "overall_match": "完全匹配您的需求"
      },
      "availability_summary": {
        "available_days": ["周三", "周五", "周六"],
        "available_slots_count": 15,
        "next_available_slot": "2025-11-13T14:00:00Z"
      }
    }
  },
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 1.3 获取教练可用时间

**接口**: `GET /api/v1/private-lessons/{instructor_id}/available-slots`

**功能描述**: 获取教练在未来7天内的可用时间段

**路径参数**:
```json
{
  "instructor_id": {
    "type": "integer",
    "required": true,
    "description": "教练ID"
  }
}
```

**查询参数**:
```json
{
  "start_date": {
    "type": "string",
    "format": "date",
    "description": "开始日期 (YYYY-MM-DD)，默认为今天"
  },
  "end_date": {
    "type": "string",
    "format": "date",
    "description": "结束日期 (YYYY-MM-DD)，默认为7天后"
  }
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "instructor_id": 1,
    "available_slots": [
      {
        "date": "2025-11-13",
        "weekday": "周三",
        "slots": [
          {
            "start_time": "14:00",
            "end_time": "15:00",
            "available": true
          },
          {
            "start_time": "15:00",
            "end_time": "16:00",
            "available": true
          },
          {
            "start_time": "16:00",
            "end_time": "17:00",
            "available": false,
            "reason": "已有预约"
          }
        ]
      }
    ],
    "schedule_note": "建议提前2-3天预约，具体时间以教练确认为准"
  },
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 2. 咨询流程API契约

### 2.1 提交咨询申请

**接口**: `POST /api/v1/private-inquiries`

**功能描述**: 用户提交私教课程咨询申请，创建咨询记录

**请求头**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**:
```json
{
  "instructor_id": {
    "type": "integer",
    "required": true,
    "description": "咨询的教练ID"
  },
  "profile_id": {
    "type": "integer",
    "required": true,
    "description": "学员档案ID"
  },
  "inquiry_content": {
    "type": "string",
    "min_length": 10,
    "max_length": 500,
    "required": true,
    "description": "咨询内容，详细描述需求和问题"
  },
  "contact_info": {
    "type": "string",
    "pattern": "^1[3-9]\\d{9}$|^[a-zA-Z][a-zA-Z0-9_]{5,19}$",
    "required": true,
    "description": "联系方式（手机号或微信号）"
  },
  "preferred_time": {
    "type": "string",
    "description": "期望的上课时间，如：周末下午"
  },
  "preferred_duration": {
    "type": "integer",
    "enum": [60, 90, 120],
    "description": "期望的课程时长（分钟）"
  },
  "budget_range": {
    "type": "string",
    "enum": ["200-300", "300-400", "400-500", "500+"],
    "description": "预算范围"
  },
  "source": {
    "type": "string",
    "enum": ["wechat", "app", "website", "referral"],
    "default": "app",
    "description": "咨询来源"
  }
}
```

**成功响应** (201):
```json
{
  "code": 201,
  "message": "咨询申请提交成功，运营人员将在24小时内联系您",
  "data": {
    "inquiry_id": 1001,
    "inquiry_number": "INQ20251108001",
    "status": "pending",
    "created_at": "2025-11-08T10:00:00Z",
    "expected_response_time": "2025-11-09T10:00:00Z",
    "next_steps": [
      "运营人员将在24小时内通过您提供的联系方式联系您",
      "请保持电话畅通，及时回复微信消息",
      "您可以在'我的咨询'中查看处理进度"
    ],
    "contact_info": "客服电话：400-123-4567，工作时间：9:00-18:00"
  },
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**错误响应**:
- **400** (参数验证失败):
```json
{
  "code": 400,
  "message": "请求参数错误",
  "errors": [
    {
      "field": "inquiry_content",
      "message": "咨询内容不能为空，至少10个字符"
    },
    {
      "field": "contact_info",
      "message": "请输入有效的手机号或微信号"
    }
  ]
}
```

- **409** (重复咨询):
```json
{
  "code": 409,
  "message": "您已提交过该教练的咨询申请，请勿重复提交",
  "data": {
    "existing_inquiry_id": 999,
    "existing_status": "pending",
    "created_at": "2025-11-07T15:30:00Z"
  }
}
```

### 2.2 获取咨询记录

**接口**: `GET /api/v1/private-inquiries`

**功能描述**: 获取用户的咨询记录列表

**请求头**:
```
Authorization: Bearer <JWT_TOKEN>
```

**查询参数**:
```json
{
  "status": {
    "type": "string",
    "enum": ["all", "pending", "contacted", "booked", "not_interested", "expired"],
    "default": "all",
    "description": "咨询状态筛选"
  },
  "page": {
    "type": "integer",
    "default": 1,
    "min": 1,
    "description": "页码"
  },
  "limit": {
    "type": "integer",
    "default": 10,
    "min": 1,
    "max": 20,
    "description": "每页数量"
  }
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "inquiries": [
      {
        "id": 1001,
        "inquiry_number": "INQ20251108001",
        "instructor": {
          "id": 1,
          "name": "张教练",
          "avatar_url": "https://example.com/avatar1.jpg"
        },
        "profile": {
          "id": 123,
          "student_name": "小明"
        },
        "inquiry_content": "想了解私教课程的具体安排和价格",
        "status": "pending",
        "status_display": "待联系",
        "created_at": "2025-11-08T10:00:00Z",
        "follow_up_count": 0,
        "last_follow_up": null,
        "expires_at": "2025-11-15T10:00:00Z",
        "days_since_created": 0
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_count": 15,
      "has_next": true,
      "has_prev": false
    },
    "status_counts": {
      "pending": 3,
      "contacted": 8,
      "booked": 2,
      "not_interested": 1,
      "expired": 1
    }
  },
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2.3 获取咨询详情

**接口**: `GET /api/v1/private-inquiries/{inquiry_id}`

**功能描述**: 获取咨询申请的详细信息

**路径参数**:
```json
{
  "inquiry_id": {
    "type": "integer",
    "required": true,
    "description": "咨询ID"
  }
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "inquiry": {
      "id": 1001,
      "inquiry_number": "INQ20251108001",
      "instructor": {
        "id": 1,
        "name": "张教练",
        "avatar_url": "https://example.com/avatar1.jpg",
        "phone": "138****1234"
      },
      "profile": {
        "id": 123,
        "student_name": "小明",
        "age": 6,
        "gender": "女",
        "level": "L2"
      },
      "inquiry_content": "想了解私教课程的具体安排和价格，希望周末下午上课",
      "contact_info": "13812345678",
      "preferred_time": "周末下午",
      "preferred_duration": 60,
      "budget_range": "300-400",
      "status": "contacted",
      "status_display": "已联系",
      "created_at": "2025-11-08T10:00:00Z",
      "updated_at": "2025-11-08T14:30:00Z",
      "follow_up_count": 1,
      "last_follow_up": "2025-11-08T14:30:00Z",
      "expires_at": "2025-11-15T10:00:00Z",
      "consultations": [
        {
          "id": 501,
          "consultation_method": "phone",
          "consultation_time": "2025-11-08T14:30:00Z",
          "consultation_result": "用户需求明确，预算合适，时间可协调",
          "admin_operator": "李老师",
          "follow_up_actions": ["准备周末下午时间段", "发送课程详细介绍"],
          "created_at": "2025-11-08T14:30:00Z"
        }
      ],
      "timeline": [
        {
          "action": "用户提交咨询",
          "time": "2025-11-08T10:00:00Z",
          "operator": "系统"
        },
        {
          "action": "运营人员联系",
          "time": "2025-11-08T14:30:00Z",
          "operator": "李老师"
        }
      ]
    }
  },
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 3. 运营后台API契约

### 3.1 咨询列表管理

**接口**: `GET /api/v1/admin/private-inquiries`

**功能描述**: 运营人员获取咨询列表，支持多维度筛选

**请求头**:
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**查询参数**:
```json
{
  "status": {
    "type": "string",
    "enum": ["all", "pending", "contacted", "booked", "not_interested", "expired"],
    "default": "all",
    "description": "状态筛选"
  },
  "instructor_id": {
    "type": "integer",
    "description": "教练ID筛选"
  },
  "user_id": {
    "type": "integer",
    "description": "用户ID筛选"
  },
  "created_from": {
    "type": "string",
    "format": "date",
    "description": "创建时间起始"
  },
  "created_to": {
    "type": "string",
    "format": "date",
    "description": "创建时间结束"
  },
  "page": {
    "type": "integer",
    "default": 1,
    "min": 1,
    "description": "页码"
  },
  "limit": {
    "type": "integer",
    "default": 20,
    "min": 1,
    "max": 100,
    "description": "每页数量"
  }
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "inquiries": [
      {
        "id": 1001,
        "inquiry_number": "INQ20251108001",
        "user": {
          "id": 456,
          "nickname": "小明妈妈",
          "phone": "138****1234"
        },
        "instructor": {
          "id": 1,
          "name": "张教练",
          "phone": "139****5678"
        },
        "profile": {
          "id": 123,
          "student_name": "小明",
          "age": 6,
          "gender": "女",
          "level": "L2"
        },
        "inquiry_content": "想了解私教课程的具体安排和价格",
        "contact_info": "13812345678",
        "preferred_time": "周末下午",
        "budget_range": "300-400",
        "status": "pending",
        "status_display": "待联系",
        "priority": "high",
        "follow_up_count": 0,
        "last_follow_up": null,
        "created_at": "2025-11-08T10:00:00Z",
        "expires_at": "2025-11-15T10:00:00Z",
        "days_pending": 0,
        "urgency_level": "normal"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 98,
      "has_next": true,
      "has_prev": false
    },
    "summary": {
      "total_count": 98,
      "pending_count": 12,
      "contacted_count": 45,
      "booked_count": 28,
      "not_interested_count": 8,
      "expired_count": 5,
      "conversion_rate": 28.6
    }
  },
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 3.2 更新咨询状态

**接口**: `PATCH /api/v1/admin/private-inquiries/{inquiry_id}/status`

**功能描述**: 运营人员更新咨询状态

**路径参数**:
```json
{
  "inquiry_id": {
    "type": "integer",
    "required": true,
    "description": "咨询ID"
  }
}
```

**请求体**:
```json
{
  "status": {
    "type": "string",
    "enum": ["contacted", "booked", "not_interested"],
    "required": true,
    "description": "新状态"
  },
  "admin_notes": {
    "type": "string",
    "max_length": 500,
    "description": "管理员备注"
  },
  "consultation_method": {
    "type": "string",
    "enum": ["phone", "wechat", "sms", "email"],
    "description": "联系方式（更新为contacted时）"
  },
  "consultation_result": {
    "type": "string",
    "max_length": 500,
    "description": "咨询结果（更新为contacted时）"
  },
  "follow_up_actions": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "max_items": 10,
    "description": "后续行动列表"
  },
  "booking_info": {
    "type": "object",
    "description": "预约信息（更新为booked时）",
    "properties": {
      "booking_time": {
        "type": "string",
        "format": "date-time",
        "description": "预约时间"
      },
      "duration": {
        "type": "integer",
        "enum": [60, 90, 120],
        "description": "课程时长"
      },
      "actual_price": {
        "type": "number",
        "min": 0,
        "description": "实际价格"
      }
    }
  }
}
```

**成功响应** (200):
```json
{
  "code": 200,
  "message": "状态更新成功",
  "data": {
    "inquiry_id": 1001,
    "old_status": "pending",
    "new_status": "contacted",
    "updated_at": "2025-11-08T14:30:00Z",
    "consultation_id": 501,
    "next_actions": [
      "建议在48小时内跟进用户反馈",
      "可准备预约时间方案"
    ]
  },
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 3.3 录入私教预约

**接口**: `POST /api/v1/admin/private-bookings`

**功能描述**: 运营人员录入线下确认的私教预约

**请求头**:
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**请求体**:
```json
{
  "inquiry_id": {
    "type": "integer",
    "required": true,
    "description": "关联的咨询ID"
  },
  "user_id": {
    "type": "integer",
    "required": true,
    "description": "用户ID"
  },
  "profile_id": {
    "type": "integer",
    "required": true,
    "description": "学员档案ID"
  },
  "instructor_id": {
    "type": "integer",
    "required": true,
    "description": "教练ID"
  },
  "booking_time": {
    "type": "string",
    "format": "date-time",
    "required": true,
    "description": "预约时间"
  },
  "duration": {
    "type": "integer",
    "enum": [60, 90, 120],
    "required": true,
    "description": "课程时长（分钟）"
  },
  "actual_price": {
    "type": "number",
    "min": 0,
    "required": true,
    "description": "实际价格"
  },
  "payment_method": {
    "type": "string",
    "enum": ["offline"],
    "default": "offline",
    "description": "支付方式（仅支持线下）"
  },
  "confirmation_notes": {
    "type": "string",
    "max_length": 500,
    "description": "确认备注"
  },
  "send_notification": {
    "type": "boolean",
    "default": true,
    "description": "是否发送通知给用户和教练"
  }
}
```

**成功响应** (201):
```json
{
  "code": 201,
  "message": "预约录入成功",
  "data": {
    "booking_id": 2001,
    "booking_number": "PRV20251108001",
    "inquiry_id": 1001,
    "booking_time": "2025-11-15T14:00:00Z",
    "end_time": "2025-11-15T15:00:00Z",
    "duration": 60,
    "actual_price": 300,
    "payment_method": "offline",
    "payment_status": "pending",
    "status": "confirmed",
    "created_at": "2025-11-08T15:00:00Z",
    "conflict_check": {
      "has_conflict": false,
      "checked_at": "2025-11-08T15:00:00Z"
    },
    "notifications_sent": {
      "user_notification": true,
      "instructor_notification": true,
      "sent_at": "2025-11-08T15:01:00Z"
    },
    "next_steps": [
      "联系用户确认付款方式和时间",
      "提醒教练准备课程内容",
      "课程前一天发送提醒通知"
    ]
  },
  "timestamp": "2025-11-08T15:00:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**错误响应**:
- **409** (时间冲突):
```json
{
  "code": 409,
  "message": "预约时间冲突",
  "errors": [
    {
      "field": "booking_time",
      "message": "该教练在此时间段已有其他预约"
    }
  ],
  "data": {
    "conflict_details": {
      "conflicting_booking_id": 1999,
      "conflicting_time": "2025-11-15T14:00:00Z",
      "conflict_duration": 60,
      "alternative_slots": [
        "2025-11-15T15:00:00Z",
        "2025-11-15T16:00:00Z",
        "2025-11-16T14:00:00Z"
      ]
    }
  }
}
```

### 3.4 教练管理API

#### 3.4.1 创建教练

**接口**: `POST /api/v1/admin/private-instructors`

**功能描述**: 创建新的私教教练

**请求体**:
```json
{
  "name": {
    "type": "string",
    "min_length": 2,
    "max_length": 20,
    "required": true,
    "description": "教练姓名"
  },
  "avatar_url": {
    "type": "string",
    "format": "uri",
    "description": "头像URL"
  },
  "bio": {
    "type": "string",
    "max_length": 1000,
    "required": true,
    "description": "教练介绍"
  },
  "specialties": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "min_items": 1,
    "max_items": 10,
    "required": true,
    "description": "专长领域"
  },
  "price_per_hour": {
    "type": "number",
    "min": 0,
    "required": true,
    "description": "每小时价格"
  },
  "level_range": {
    "type": "string",
    "pattern": "^L[1-9](-L[1-9])?$",
    "required": true,
    "description": "教学等级范围，如：L1-L3"
  },
  "age_range": {
    "type": "string",
    "enum": ["3-6岁", "4-8岁", "6-12岁", "8-15岁", "12-18岁", "成人"],
    "required": true,
    "description": "教学年龄范围"
  },
  "gender": {
    "type": "string",
    "enum": ["male", "female", "both"],
    "required": true,
    "description": "教学性别要求"
  },
  "course_type": {
    "type": "string",
    "enum": ["private"],
    "default": "private",
    "description": "课程类型"
  },
  "skill_types": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "技能类型"
  },
  "certifications": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "资质证书"
  },
  "experience_years": {
    "type": "integer",
    "min": 0,
    "description": "教学经验年数"
  },
  "status": {
    "type": "string",
    "enum": ["active", "inactive"],
    "default": "active",
    "description": "状态"
  }
}
```

---

## 4. 数据模型契约

### 4.1 4维标签匹配格式

**学员档案标签格式**:
```json
{
  "level": "L2",
  "age": "6岁",
  "gender": "female",
  "course_type": "private"
}
```

**教练标签格式**:
```json
{
  "level_range": "L1-L3",
  "age_range": "4-8岁",
  "gender": "female",
  "course_type": "private"
}
```

**匹配结果格式**:
```json
{
  "match_score": 100.0,
  "match_details": {
    "level_match": {
      "matched": true,
      "student_level": "L2",
      "instructor_range": "L1-L3",
      "detail": "学员等级L2在教练教学范围L1-L3内"
    },
    "age_match": {
      "matched": true,
      "student_age": "6岁",
      "instructor_range": "4-8岁",
      "detail": "学员年龄6岁在教练教学范围4-8岁内"
    },
    "gender_match": {
      "matched": true,
      "student_gender": "female",
      "instructor_gender": "female",
      "detail": "教练性别要求与学员性别匹配"
    },
    "type_match": {
      "matched": true,
      "student_type": "private",
      "instructor_type": "private",
      "detail": "课程类型匹配"
    }
  },
  "overall_match": "完全匹配您的需求"
}
```

### 4.2 状态机契约

**咨询状态流转**:
```json
{
  "pending": {
    "description": "待联系",
    "next_states": ["contacted", "expired"],
    "actions": ["联系用户", "过期处理"]
  },
  "contacted": {
    "description": "已联系",
    "next_states": ["booked", "not_interested", "expired"],
    "actions": ["录入预约", "标记不感兴趣", "过期处理"]
  },
  "booked": {
    "description": "已预约",
    "next_states": [],
    "actions": [],
    "is_terminal": true
  },
  "not_interested": {
    "description": "不感兴趣",
    "next_states": [],
    "actions": [],
    "is_terminal": true
  },
  "expired": {
    "description": "已过期",
    "next_states": [],
    "actions": [],
    "is_terminal": true
  }
}
```

**预约状态流转**:
```json
{
  "confirmed": {
    "description": "已确认",
    "next_states": ["completed", "cancelled"],
    "actions": ["完成课程", "取消预约"]
  },
  "completed": {
    "description": "已完成",
    "next_states": [],
    "actions": [],
    "is_terminal": true
  },
  "cancelled": {
    "description": "已取消",
    "next_states": [],
    "actions": [],
    "is_terminal": true
  }
}
```

---

## 5. 错误处理契约

### 5.1 业务错误码

```json
{
  "4001": "学员档案不存在",
  "4002": "教练信息不存在",
  "4003": "4维匹配失败",
  "4004": "咨询申请重复提交",
  "4005": "咨询状态不允许当前操作",
  "4006": "预约时间冲突",
  "4007": "教练时间不可用",
  "4008": "价格计算错误",
  "4009": "咨询已过期",
  "4010": "操作权限不足"
}
```

### 5.2 错误消息模板

```json
{
  "validation_error": "参数验证失败：{field_details}",
  "not_found": "资源不存在：{resource_type}",
  "permission_denied": "权限不足：{required_permission}",
  "business_logic_error": "业务规则错误：{rule_description}",
  "system_error": "系统内部错误，请稍后重试",
  "service_unavailable": "服务暂时不可用，请稍后重试"
}
```

---

## 6. 性能与限流契约

### 6.1 响应时间要求

```json
{
  "instructor_list": {
    "p95_response_time": "500ms",
    "timeout": "5000ms"
  },
  "instructor_detail": {
    "p95_response_time": "300ms",
    "timeout": "3000ms"
  },
  "inquiry_submit": {
    "p95_response_time": "1000ms",
    "timeout": "10000ms"
  },
  "admin_booking": {
    "p95_response_time": "2000ms",
    "timeout": "15000ms"
  }
}
```

### 6.2 请求频率限制

```json
{
  "private_lessons_browse": {
    "limit": "100 requests/minute",
    "scope": "user"
  },
  "inquiry_submit": {
    "limit": "5 requests/hour",
    "scope": "user"
  },
  "admin_apis": {
    "limit": "1000 requests/hour",
    "scope": "admin"
  }
}
```

### 6.3 分页限制

```json
{
  "max_page_size": {
    "instructor_list": 50,
    "inquiry_list": 20,
    "admin_inquiry_list": 100
  },
  "default_page_size": {
    "instructor_list": 20,
    "inquiry_list": 10,
    "admin_inquiry_list": 20
  }
}
```

---

## 7. 缓存策略契约

### 7.1 缓存键设计

```json
{
  "instructor_list": "private_lessons:list:{profile_id}:{page}:{limit}:{filters_hash}",
  "instructor_detail": "private_lessons:detail:{instructor_id}",
  "inquiry_stats": "inquiries:stats:{user_id}",
  "match_result": "match:result:{profile_id}:{instructor_id}"
}
```

### 7.2 缓存过期时间

```json
{
  "instructor_list": "15 minutes",
  "instructor_detail": "1 hour",
  "inquiry_stats": "10 minutes",
  "match_result": "15 minutes",
  "user_profile": "30 minutes"
}
```

### 7.3 缓存更新策略

```json
{
  "instructor_info_update": "立即清除相关缓存",
  "inquiry_status_change": "清除用户统计缓存",
  "booking_created": "清除教练可用时间缓存",
  "schedule_update": "清除教练排班缓存"
}
```

---

## 8. 安全契约

### 8.1 数据脱敏规则

```json
{
  "phone_number": {
    "pattern": "replace_middle_4_chars",
    "example": "138****1234"
  },
  "wechat_id": {
    "pattern": "replace_last_3_chars",
    "example": "wechat***"
  },
  "student_name": {
    "pattern": "replace_last_char",
    "example": "小明*"
  }
}
```

### 8.2 敏感操作审计

```json
{
  "audited_actions": [
    "inquiry_status_change",
    "booking_create",
    "booking_cancel",
    "instructor_info_update",
    "user_data_access"
  ],
  "audit_log_format": {
    "timestamp": "2025-11-08T10:00:00Z",
    "user_id": 123,
    "action": "inquiry_status_change",
    "resource_id": 1001,
    "old_value": "pending",
    "new_value": "contacted",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  }
}
```

---

## 9. 集成契约

### 9.1 微信客服集成

```json
{
  "customer_service_redirect": {
    "api": "wx.openCustomerServiceAPI",
    "parameters": {
      "extInfo": {
        "instructor_id": "{instructor_id}",
        "inquiry_id": "{inquiry_id}",
        "source": "private_lesson"
      }
    }
  },
  "fallback_contact": {
    "phone": "400-123-4567",
    "wechat": "ccmartmeet_service",
    "qr_code": "https://example.com/wechat-service-qrcode.png"
  }
}
```

### 9.2 通知服务集成

```json
{
  "notification_events": {
    "inquiry_submitted": {
      "user": {
        "template": "inquiry_confirmation",
        "channels": ["wechat", "sms"]
      },
      "admin": {
        "template": "new_inquiry_alert",
        "channels": ["system", "email"]
      }
    },
    "booking_confirmed": {
      "user": {
        "template": "booking_confirmation",
        "channels": ["wechat", "sms"]
      },
      "instructor": {
        "template": "new_booking_notification",
        "channels": ["wechat", "sms"]
      }
    }
  }
}
```

---

## 10. 版本控制契约

### 10.1 API版本策略

```json
{
  "current_version": "v1",
  "version_format": "v{major}",
  "backward_compatibility": "maintained_for_6_months",
  "deprecation_notice": "3_months_before_removal"
}
```

### 10.2 字段变更策略

```json
{
  "add_field": "向后兼容，可选字段",
  "remove_field": "先标记deprecated，3个月后移除",
  "modify_field_type": "创建新字段，保留旧字段",
  "change_enum_values": "只能添加，不能移除现有值"
}
```

---

**创建人**: [AI Claude]
**最后更新**: 2025-11-08
**版本**: v1.0.0
**状态**: Draft
# Data Model: RuoYi-Vue-Pro 框架集成

**Feature**: 000-framework-setup
**Created**: 2025-11-19
**Version**: 1.0.0

## Database Schema

### Overview
基于RuoYi-Vue-Pro框架的数据库扩展，为百适体操馆业务系统提供数据支撑。主要包含用户管理、课程管理、预约管理等核心业务表结构。

### Entity Relationship Diagram
```
[用户表] sys_user --1:N--> [预约表] gym_appointment
[课程表] gym_course --1:N--> [预约表] gym_appointment
[教练表] gym_coach --1:N--> [课程表] gym_course
[用户表] sys_user --1:N--> [钱包表] gym_wallet
```

## Table Definitions

### gym_course - 课程表
**描述**: 体操馆各类课程的基础信息
**用途**: 存储课程名称、类型、难度、价格等基础数据

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 | 索引 |
|--------|----------|------|--------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | - | 主键ID | PRIMARY |
| course_name | VARCHAR(100) | NOT NULL | - | 课程名称 | INDEX |
| course_type | TINYINT | NOT NULL | 0 | 课程类型(0:团课 1:私教) | INDEX |
| difficulty_level | TINYINT | NOT NULL | 1 | 难度等级(1-5) | |
| max_participants | INT | NOT NULL | 10 | 最大参与人数 | |
| price | DECIMAL(10,2) | NOT NULL | 0.00 | 课程价格 | |
| duration | INT | NOT NULL | 60 | 课程时长(分钟) | |
| description | TEXT | | | 课程描述 | |
| status | TINYINT | NOT NULL | 1 | 状态(0:禁用 1:启用) | INDEX |
| creator | VARCHAR(64) | | | 创建者 | |
| create_time | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 | INDEX |
| updater | VARCHAR(64) | | | 更新者 | |
| update_time | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 | INDEX |
| deleted | TINYINT | NOT NULL | 0 | 是否删除 | INDEX |

### gym_appointment - 预约表
**描述**: 用户课程预约记录
**用途**: 管理用户预约状态和时间

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 | 索引 |
|--------|----------|------|--------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | - | 主键ID | PRIMARY |
| user_id | BIGINT | NOT NULL | - | 用户ID | INDEX |
| course_id | BIGINT | NOT NULL | - | 课程ID | INDEX |
| appointment_time | DATETIME | NOT NULL | - | 预约时间 | INDEX |
| status | TINYINT | NOT NULL | 0 | 状态(0:待确认 1:已确认 2:已完成 3:已取消) | INDEX |
| payment_status | TINYINT | NOT NULL | 0 | 支付状态(0:未支付 1:已支付 2:已退款) | |
| remark | VARCHAR(500) | | | 备注信息 | |
| creator | VARCHAR(64) | | | 创建者 | |
| create_time | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 | INDEX |
| updater | VARCHAR(64) | | | 更新者 | |
| update_time | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 | INDEX |
| deleted | TINYINT | NOT NULL | 0 | 是否删除 | INDEX |

### gym_coach - 教练表
**描述**: 体操馆教练信息
**用途**: 管理教练基本信息和专业资质

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 | 索引 |
|--------|----------|------|--------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | - | 主键ID | PRIMARY |
| coach_name | VARCHAR(50) | NOT NULL | - | 教练姓名 | INDEX |
| gender | TINYINT | NOT NULL | 0 | 性别(0:女 1:男) | |
| phone | VARCHAR(20) | | | 联系电话 | |
| specialty | VARCHAR(200) | | | 专业特长 | |
| certification | VARCHAR(100) | | | 资质证书 | |
| years_experience | INT | NOT NULL | 0 | 从业年限 | |
| hourly_rate | DECIMAL(10,2) | NOT NULL | 0.00 | 小时费率 | |
| status | TINYINT | NOT NULL | 1 | 状态(0:离职 1:在职) | INDEX |
| creator | VARCHAR(64) | | | 创建者 | |
| create_time | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 | INDEX |
| updater | VARCHAR(64) | | | 更新者 | |
| update_time | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 | INDEX |
| deleted | TINYINT | NOT NULL | 0 | 是否删除 | INDEX |

### Business Rules
- 课程预约需要检查课程容量和教练时间安排
- 用户取消预约需要遵循相应的退款政策
- 教练信息变更需要重新审核资质证书

## API Contracts

### GET /gym/course/list
**方法**: GET
**路径**: /gym/course/list
**描述**: 获取课程列表

#### Request
```json
{
  "pageNo": 1,
  "pageSize": 10,
  "courseName": "瑜伽基础",
  "status": 1
}
```

#### Response
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "courseName": "瑜伽基础",
        "courseType": 0,
        "difficultyLevel": 1,
        "maxParticipants": 15,
        "price": 88.00,
        "duration": 60,
        "status": 1,
        "createTime": "2025-11-19 10:00:00"
      }
    ],
    "total": 1
  }
}
```

### POST /gym/appointment/create
**方法**: POST
**路径**: /gym/appointment/create
**描述**: 创建课程预约

#### Request
```json
{
  "courseId": 1,
  "appointmentTime": "2025-11-20 14:00:00",
  "remark": "第一次体验"
}
```

#### Response
```json
{
  "code": 200,
  "message": "预约成功",
  "data": {
    "id": 1001,
    "userId": 12345,
    "courseId": 1,
    "appointmentTime": "2025-11-20 14:00:00",
    "status": 0,
    "paymentStatus": 0,
    "createTime": "2025-11-19 15:30:00"
  }
}
```

## Data Validation

### Input Validation
- 课程名称：2-100字符，不允许特殊字符
- 手机号码：11位数字，符合中国手机号格式
- 价格：非负数，最大值99999.99
- 预约时间：不能是过去时间，不能超过30天

### Business Validation
- 课程预约时检查课程容量是否已满
- 用户预约同一时间段不能有冲突
- 教练时间安排不能重叠
- 私教课程需要教练确认后才能正式预约

## Migration Strategy

### Version 1.0.0
- 执行RuoYi-Vue-Pro基础表结构初始化
- 创建gym_相关业务表
- 插入基础数据（课程类型、状态枚举等）
- 配置RuoYi数据权限规则

### Rollback Plan
- 删除gym_相关业务表
- 清理sys_menu中添加的体操馆菜单
- 移除相关配置文件中的业务模块配置

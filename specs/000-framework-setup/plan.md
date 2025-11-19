# Implementation Plan: RuoYi-Vue-Pro 框架集成

**Feature**: 000-framework-setup
**Created**: 2025-11-19
**Status**: Ready for Planning

## Technical Context

### Technology Stack

- **后端框架**: Spring Boot 2.7.x + Spring Security
- **前端框架**: Vue 3 + TypeScript + Element Plus
- **数据库**: MySQL 8.0 + Redis 7.0
- **ORM**: MyBatis-Plus 3.5.x
- **构建工具**: Maven 3.9.x + Vite
- **代码生成**: RuoYi Code Generator
- **容器化**: Docker + Nginx

### Constraints

- 必须使用RuoYi-Vue-Pro官方稳定版本
- 遵循RuoYi的代码规范和最佳实践
- 保持与RuoYi主版本的兼容性
- 生成的代码必须通过质量检查

## Architecture Overview

### Database Schema

基于RuoYi标准表结构扩展：

#### RuoYi系统表扩展
- `sys_user`: 扩展用户信息字段
- `sys_role`: 配置体操馆业务角色
- `sys_menu`: 添加体操馆业务菜单

#### 体操馆业务表
- `gym_course`: 课程基础信息表
- `gym_appointment`: 预约记录表
- `gym_coach`: 教练信息表
- `gym_wallet`: 用户钱包表

### API Endpoints

基于RuoYi RESTful规范：

#### GET /gym/course/page
**功能**：分页查询课程列表
**权限要求**：查看课程权限
**请求参数**：
```json
{
  "pageNo": 1,
  "pageSize": 10,
  "courseName": "课程名称",
  "status": 1
}
```
**响应格式**：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [...],
    "total": 100
  }
}
```

#### POST /gym/appointment/create
**功能**：创建课程预约
**权限要求**：用户预约权限
**请求参数**：
```json
{
  "courseId": 1,
  "appointmentTime": "2025-11-20 14:00:00"
}
```

### Frontend Pages

基于Vue 3 + Element Plus：

#### 1. 课程管理页面 (views/gym/course/index.vue)
**路径**：`/gym/course`
**功能**：课程列表展示、新增、编辑、删除
**组件结构**：
```
Course Management
├── CourseSearch (搜索组件)
├── CourseTable (表格组件)
├── CourseForm (新增/编辑表单)
└── CourseImport (批量导入)
```

#### 2. 预约管理页面 (views/gym/appointment/index.vue)
**路径**：`/gym/appointment`
**功能**：预约记录管理、状态更新
**组件结构**：
```
Appointment Management
├── AppointmentSearch
├── AppointmentTable
├── AppointmentDetail
└── AppointmentStatus
```

## Constitution Compliance

- ✅ **Principle 1**: 使用成熟的RuoYi框架，避免重复造轮子，简化开发流程
- ✅ **Principle 2**: 基于RuoYi完善的数据校验和事务管理机制
- ✅ **Principle 4**: 遵循RuoYi的RESTful API设计规范
- ✅ **Principle 8**: 集成RuoYi的权限管理和安全机制

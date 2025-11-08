#!/bin/bash

# 创建新功能的脚本 - 基于 Spec-Kit 规范
# 使用方法: ./create-new-feature.sh [feature-number] [feature-name]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ $# -ne 2 ]; then
    print_error "使用方法: $0 [feature-number] [feature-name]"
    print_info "示例: $0 007-user-management 'User Management System'"
    exit 1
fi

FEATURE_NUM=$1
FEATURE_NAME=$2
FEATURE_DIR="specs/${FEATURE_NUM}"

# 检查功能是否已存在
if [ -d "$FEATURE_DIR" ]; then
    print_error "功能目录已存在: $FEATURE_DIR"
    exit 1
fi

print_info "创建新功能: $FEATURE_NAME"
print_info "功能编号: $FEATURE_NUM"
print_info "功能目录: $FEATURE_DIR"

# 创建目录结构
print_info "创建目录结构..."
mkdir -p "$FEATURE_DIR/contracts"
mkdir -p "$FEATURE_DIR/checklists"

# 创建 spec.md
print_info "创建功能规格文档..."
cat > "$FEATURE_DIR/spec.md" << EOF
# Feature Specification: $FEATURE_NAME

**Feature Branch**: \`$FEATURE_NUM-[feature-name]\`
**Created**: $(date +%Y-%m-%d)
**Status**: Draft
**MVP**: [MVP-NUMBER]
**Input**: "User description: \$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - [Feature Name] (Priority: P1)

[Describe the user scenario in 1-2 sentences]

**Why this priority**: [Explain why this feature has this priority level]

**Independent Test**: [Describe how to test this feature independently]

**Acceptance Scenarios**:

1. **Given** [Context], **When** [Action], **Then** [Expected Outcome]
2. **Given** [Context], **When** [Action], **Then** [Expected Outcome]
3. **Given** [Context], **When** [Action], **Then** [Expected Outcome]

---

### Edge Cases

- [Edge case 1 with handling approach]
- [Edge case 2 with handling approach]
- [Edge case 3 with handling approach]

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: [Requirement description]
- **FR-002**: [Requirement description]
- **FR-003**: [Requirement description]
- **FR-004**: [Requirement description]
- **FR-005**: [Requirement description]

### Key Entities

- **[Entity Name]**: [Entity description]
  - Core attributes: [attribute1], [attribute2], [attribute3]
  - Business rules: [Rules and constraints]

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [Measurable outcome with specific metric]
- **SC-002**: [Measurable outcome with specific metric]
- **SC-003**: [Measurable outcome with specific metric]
- **SC-004**: [Measurable outcome with specific metric]

---

## Assumptions

- [Assumption 1]
- [Assumption 2]
- [Assumption 3]
- [Assumption 4]

---

## Out of Scope ([MVP-NUMBER] 不实现)

- ❌ [Feature not included in this MVP]
- ❌ [Feature not included in this MVP]
- ❌ [Feature not included in this MVP]

---

## Open Questions

1. **[NEEDS CLARIFICATION]** [Question that needs clarification]
   - 建议: [Suggested approach]

2. **[NEEDS CLARIFICATION]** [Question that needs clarification]
   - 建议: [Suggested approach]
EOF

# 创建 plan.md
print_info "创建技术计划文档..."
cat > "$FEATURE_DIR/plan.md" << EOF
# Implementation Plan: $FEATURE_NAME

**Feature**: $FEATURE_NUM-[feature-name]
**Created**: $(date +%Y-%m-%d)
**Status**: Draft

## Technical Context

### Technology Stack

- **小程序**: 微信原生框架(MINA) + Skyline (按需启用)
- **后台前端**: Vue 3 + Element Plus
- **后端**: Python FastAPI 0.100+
- **数据库**: MySQL 8.0+
- **ORM**: SQLAlchemy 2.x
- **认证**: JWT + 微信OpenID

### Constraints

- 必须遵循宪法 Principle 1（简化优先 - AI驱动开发适配）
- 必须遵循宪法 Principle 2（数据完整性至上）
- 必须遵循宪法 Principle 4（API优先架构）
- 必须遵循宪法 Principle 8（安全与合规 - 极简实用版）

## Architecture Overview

### Database Schema

#### 表1：[table_name]
| 字段名 | 类型 | 约束 | 说明 | 索引 |
|--------|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 | PRIMARY |
| [field1] | [type] | [constraints] | [description] | [index] |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 | [index] |

### API Endpoints

#### [METHOD] [endpoint_path]
**功能**：[API功能描述]
**权限要求**：[Required permissions]
**请求参数**：
\`\`\`json
{
  "param1": "类型说明",
  "param2": "类型说明"
}
\`\`\`
**响应格式**：
\`\`\`json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "field1": "类型说明",
    "field2": "类型说明"
  }
}
\`\`\`

### Frontend Pages

#### 1. [Page Name] (pages/[path]/[page].wxml)
**路径**：\`/[path]/[page]\`
**功能**：[页面功能描述]
**组件结构**：
\`\`\`
[Page]
├── [Component1]
└── [Component2]
\`\`\`

## Constitution Compliance

- ✅ **Principle 1**: [How it complies with Simplicity First]
- ✅ **Principle 2**: [How it ensures Data Integrity]
- ✅ **Principle 4**: [How it follows API-First Architecture]
- ✅ **Principle 8**: [How it addresses Security & Compliance]
EOF

# 创建 tasks.md
print_info "创建任务分解文档..."
cat > "$FEATURE_DIR/tasks.md" << EOF
# Implementation Tasks: $FEATURE_NAME

**Feature**: $FEATURE_NUM-[feature-name]
**Created**: $(date +%Y-%m-%d)
**Total Tasks**: [number]

## Phase 1: Setup & Infrastructure

### T001: 初始化项目结构
**Description**: [Task description]
**Depends on**: None
**Parallel**: No
**Estimated Time**: [time]
**Done When**:
- [ ] [Completion criteria 1]
- [ ] [Completion criteria 2]

### T002: [P] 配置开发环境
**Description**: [Task description]
**Depends on**: None
**Parallel**: Yes
**Estimated Time**: [time]
**Done When**:
- [ ] [Completion criteria 1]
- [ ] [Completion criteria 2]

## Phase 2: Core Features

### T003: 实现核心业务逻辑
**Description**: [Task description]
**Depends on**: T001, T002
**Parallel**: No
**Estimated Time**: [time]
**Done When**:
- [ ] [Completion criteria 1]
- [ ] [单元测试通过]

### T004: [P] 实现API端点
**Description**: [Task description]
**Depends on**: T003
**Parallel**: Yes
**Estimated Time**: [time]
**Done When**:
- [ ] [集成测试通过]

## Phase 3: Integration & Testing

### T005: 集成测试
**Description**: [Task description]
**Depends on**: T003, T004
**Parallel**: No
**Estimated Time**: [time]
**Done When**:
- [ ] [所有测试通过]

### T006: 代码审查和重构
**Description**: [Task description]
**Depends on**: T005
**Parallel**: No
**Estimated Time**: [time]
**Done When**:
- [ ] [代码审查完成]

## Phase 4: Polish & Documentation

### T007: 文档编写
**Description**: [Task description]
**Depends on**: T006
**Parallel**: Yes
**Estimated Time**: [time]
**Done When**:
- [ ] [文档完整]
EOF

# 创建 data-model.md
print_info "创建数据模型文档..."
cat > "$FEATURE_DIR/data-model.md" << EOF
# Data Model: $FEATURE_NAME

**Feature**: $FEATURE_NUM-[feature-name]
**Created**: $(date +%Y-%m-%d)
**Version**: 1.0.0

## Database Schema

### Overview
[数据模型的总体描述]

### Entity Relationship Diagram
\`\`\`
[ER图描述]
\`\`\`

## Table Definitions

### [table_name]
**描述**: [表的描述]
**用途**: [表的用途]

| 字段名 | 数据类型 | 约束 | 默认值 | 描述 | 索引 |
|--------|----------|------|--------|------|------|
| id | INT | PK, AUTO_INCREMENT | - | 主键ID | PRIMARY |
| [field1] | [type] | [constraints] | [default] | [description] | [index] |
| [field2] | [type] | [constraints] | [default] | [description] | [index] |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 | INDEX |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 更新时间 | INDEX |

### Business Rules
- [业务规则1]
- [业务规则2]
- [业务规则3]

## API Contracts

### [endpoint_name]
**方法**: [HTTP方法]
**路径**: [API路径]
**描述**: [API描述]

#### Request
\`\`\`json
{
  "field1": "type",
  "field2": "type"
}
\`\`\`

#### Response
\`\`\`json
{
  "code": 200,
  "message": "success",
  "data": {
    "field1": "type",
    "field2": "type"
  }
}
\`\`\`

## Data Validation

### Input Validation
- [验证规则1]
- [验证规则2]
- [验证规则3]

### Business Validation
- [业务验证1]
- [业务验证2]
- [业务验证3]

## Migration Strategy

### Version 1.0.0
- [迁移步骤1]
- [迁移步骤2]
- [迁移步骤3]

### Rollback Plan
- [回滚步骤1]
- [回滚步骤2]
EOF

# 创建 API 契约文件
print_info "创建API契约文件..."
cat > "$FEATURE_DIR/contracts/api-spec.json" << EOF
{
  "openapi": "3.0.0",
  "info": {
    "title": "$FEATURE_NAME API",
    "version": "1.0.0",
    "description": "API specifications for $FEATURE_NAME feature"
  },
  "servers": [
    {
      "url": "http://localhost:8000/api/v1",
      "description": "Development server"
    }
  ],
  "paths": {
    "/example": {
      "get": {
        "summary": "Example endpoint",
        "description": "Example API endpoint",
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "integer"
                    },
                    "message": {
                      "type": "string"
                    },
                    "data": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "StandardResponse": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "description": "Response code"
          },
          "message": {
            "type": "string",
            "description": "Response message"
          },
          "data": {
            "type": "object",
            "description": "Response data"
          }
        }
      }
    }
  }
}
EOF

# 创建质量检查清单
print_info "创建质量检查清单..."
cat > "$FEATURE_DIR/checklists/requirements.md" << EOF
# 质量检查清单: $FEATURE_NAME

**功能**: $FEATURE_NAME
**版本**: 1.0.0
**创建日期**: $(date +%Y-%m-%d)

## 需求质量检查

### 用户故事完整性
- [ ] 每个用户故事都有明确的优先级 (P1, P2, P3)
- [ ] 每个用户故事都有独立的测试方法
- [ ] 每个用户故事都有完整的验收场景 (Given/When/Then)
- [ ] 边界情况都已考虑并有处理方案

### 功能需求完整性
- [ ] 所有功能需求都有FR-XXX编号
- [ ] 每个需求都是具体且可测试的
- [ ] 需求覆盖了所有用户故事
- [ ] 没有模糊或歧义的描述

### 成功标准可衡量性
- [ ] 每个成功标准都有具体指标
- [ ] 所有指标都是可量化的
- [ ] 标准覆盖了关键业务价值
- [ ] 有明确的验收方法

## 设计质量检查

### 技术选型合规性
- [ ] 遵循宪法Principle 1 (简化优先)
- [ ] 技术栈符合AI Coding友好原则
- [ ] 没有引入不必要的复杂性

### 数据完整性
- [ ] 遵循宪法Principle 2 (数据完整性至上)
- [ ] 关键业务操作使用事务保护
- [ ] 数据模型设计合理
- [ ] 有适当的数据验证机制

### API设计合规性
- [ ] 遵循宪法Principle 4 (API优先架构)
- [ ] API设计符合RESTful规范
- [ ] 响应格式统一
- [ ] 有适当的错误处理

## 最终验收检查

### 功能完整性
- [ ] 所有用户故事都已实现
- [ ] 所有功能需求都已满足
- [ ] 所有成功标准都已达成
- [ ] 边界情况处理正确

### 质量标准
- [ ] 代码质量达到团队标准
- [ ] 测试覆盖率达到要求
- [ ] 性能指标符合预期
- [ ] 安全检查全部通过

### 文档完整性
- [ ] 所有必要文档都已创建
- [ ] 文档内容准确且最新
- [ ] 文档格式符合模板要求
- [ ] 技术文档对后续开发友好

## 检查结果

### 通过项目
- [ ] 需求质量检查 ✅
- [ ] 设计质量检查 ✅
- [ ] 实现质量检查 ✅
- [ ] 文档质量检查 ✅
- [ ] 最终验收检查 ✅

### 总体评估
- **质量评级**: [A/B/C/D]
- **建议**: [改进建议]
- **状态**: [通过/有条件通过/不通过]

---

**检查人**: [Reviewer Name]
**检查日期**: $(date +%Y-%m-%d)
**版本**: 1.0.0
EOF

# 创建 README 文件
print_info "创建README文件..."
cat > "$FEATURE_DIR/README.md" << EOF
# $FEATURE_NAME

功能编号: \`$FEATURE_NUM\`
状态: Draft
创建日期: $(date +%Y-%m-%d)

## 概述

[功能概述]

## 文档结构

- \`spec.md\` - 功能规格文档
- \`plan.md\` - 技术实现计划
- \`tasks.md\` - 开发任务分解
- \`data-model.md\` - 数据模型设计
- \`contracts/api-spec.json\` - API契约规范
- \`checklists/requirements.md\` - 质量检查清单

## 开发状态

- [ ] 功能规格 (Specify)
- [ ] 澄清问题 (Clarify)
- [ ] 技术计划 (Plan)
- [ ] 任务分解 (Tasks)
- [ ] 代码实现 (Implement)
- [ ] 测试验证 (Test)
- [ ] 部署上线 (Deploy)

## 相关链接

- [项目宪法](../../../.specify/memory/constitution.md)
- [开发计划](../../../开发计划和任务清单.md)
EOF

print_success "功能 '$FEATURE_NAME' 创建完成!"
print_info "目录位置: $FEATURE_DIR"
print_info "下一步操作:"
print_info "1. 编辑 $FEATURE_DIR/spec.md 完善功能规格"
print_info "2. 根据需要编辑其他文档"
print_info "3. 提交代码到 git"

# 显示创建的文件列表
print_info "已创建的文件:"
find "$FEATURE_DIR" -type f -name "*.md" -o -name "*.json" | sort
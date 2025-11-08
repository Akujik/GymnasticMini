# 实施计划：008-tag-system

**功能分支**: `008-tag-system`
**创建时间**: 2025-11-03
**状态**: 仅设计参考
**MVP**: 8 (设计参考)
**用途**: 标签系统设计参考，供MVP-2A和MVP-5实现时参考

## 概述

本文件概述了体操小程序综合标签系统的设计参考。标签系统作为智能课程推荐和学员管理的核心基础。本设计参考为多个MVP的实施提供了详细规范，特别是MVP-2A（课程显示和预约）和MVP-5（管理后台）。

## 架构设计

### 系统组件

#### 1. 标签数据模型
- **学员档案标签**: 多维度学员属性
- **课程标签**: 全面课程分类
- **标签匹配引擎**: 智能匹配算法
- **标签管理系统**: 标签CRUD操作

#### 2. 匹配算法框架
- **基于规则的匹配**: L3分界线规则
- **跨级匹配**: 支持L1+、L2+中级水平
- **加权评分**: 多维度评分系统
- **体验课特殊规则**: 体验课专用匹配

#### 3. 性能优化
- **缓存策略**: 基于Redis的标签缓存
- **数据库优化**: 高效标签查询
- **算法优化**: 早期过滤和批处理
- **实时更新**: 动态标签刷新机制

## 标签系统架构

### 学员标签维度（5个核心维度）

#### 1. 基础属性标签
- **年龄标签**: 基于生日自动计算
  - 3-4岁：学龄前幼儿
  - 4-5岁：学龄前儿童
  - 5-6岁：学龄儿童
  - 6岁以上：青少年
- **等级标签**: 运营手动设置
  - L1-L6：基础技能等级
  - 跨级匹配支持（如L1+表示L1.5）
- **性别标签**: 从profile.gender获取
  - male：男性
  - female：女性

#### 2. 发展特征标签
- **发展标签**: 运营手动设置，反映学习目标
  - interest：兴趣班（培养体操兴趣）
  - professional：专业班（技能提升）
  - competition：竞赛班（竞技训练）
  - long_term：长训班（长期培养）

#### 3. 权益属性标签
- **权益标签**: 根据学员状态自动计算
  - old_user：老用户（有消费记录）
  - new_user：新用户（首次注册）
  - friend_discount：亲友权益（推荐用户）

#### 4. 身份标识标签
- **关系标签**: 基于档案关联关系
  - self：本人报课
  - child：子女
  - spouse：配偶
  - parent：父母

#### 5. 自动计算标签
- **年龄标签**: 基于生日实时计算
- **活跃度标签**: 基于最近预约记录
- **消费等级标签**: 基于消费金额统计

### 课程标签维度（6个核心维度）

#### 1. Basic Attribute Tags
- **Level Range**: Support cross-level settings
  - JSON array support: ["L1+", "L2"]
  - Single level support: "L3"
- **Age Range**: Clear target age groups
  - 3-4: 3-4 years
  - 4-5: 4-5 years
  - 5-6: 5-6 years
  - 6+: 6+ years
  - all: No age limit
- **Gender Requirements**: Gender restrictions
  - male: Male only
  - female: Female only
  - both: No gender restriction

#### 2. Teaching Characteristic Tags
- **Course Types**: Reflect course nature
  - interest: Interest courses
  - professional: Professional skill courses
  - competition: Competitive training courses
  - long_term: Long-term cultivation courses
  - trial: Trial courses
  - private: Private courses
  - camp: Camp courses
- **Skill Types**: Specific skill directions
  - flexibility: Flexibility training
  - strength: Strength training
  - coordination: Coordination training
  - technique: Technique training

#### 3. Operations Attribute Tags
- **Main Instructor**: Course head coach
- **Assistant Support**: Whether teaching assistants are available
- **Course Intensity**: Course intensity level
  - light: Light intensity
  - medium: Medium intensity
  - high: High intensity
- **Popularity Level**: Course popularity
  - hot: Popular courses
  - normal: Regular courses
  - cold: Unpopular courses

## Matching Rules Design

### Rule 1: L3 Demarcation Rule

Different matching strategies based on student level:

#### L3 and Below Students (Basic Stage)
- **Matching Conditions**: Level match + Age match
- **Logic**: Young students mainly matched by age and basic level
- **Example**: 5-year-old L2 student → Match courses aged 4-5 with level L2

#### L3 and Above Students (Advanced Stage)
- **Matching Conditions**: Level match + Gender match
- **Logic**: Older students matched by skill level and gender
- **Example**: 8-year-old L4 male → Match courses with level L4 and male/unrestricted gender

#### Special Course Types
- **Long-term Classes**: Additional development tag matching
- **Trial Classes**: Age matching only + no trial class purchase history
- **Private Classes**: Support one-on-one precise matching

### Rule 2: Cross-level Tag Matching

Flexible cross-level matching mechanism:

#### Cross-level Tag Definitions
- **L1+**: Represents L1.5 (higher than L1 but not yet L2)
- **L2+**: Represents L2.5 (higher than L2 but not yet L3)
- **L3+**: Represents L3.5 (higher than L3 but not yet L4)

#### Matching Logic
- **Inclusive Matching**: Student level within course level range
- **Examples**:
  - Course tag ["L1+", "L2"]:
    - L1 student → No match (below minimum requirement)
    - L1+ student → Match
    - L2 student → Match

### Rule 3: Trial Class Special Rules

Special matching restrictions for trial classes:

#### Matching Conditions
1. **Age Tag**: Meets course age requirements
2. **No Purchase Limitation**: WeChat OpenID has not purchased trial class
3. **Non-formal Class**: Student wallet has no balance (not officially registered)
4. **Time Window**: No trial class purchase within 30 days

#### Exclusion Conditions
- Students who have purchased trial classes
- Students who have officially registered
- Students who do not meet age requirements

### Rule 4: Intelligent Weighted Matching

Multi-dimensional comprehensive scoring and sorting:

#### Weight Distribution
- **Basic Matching** (Level + Age/Gender): 60% weight
- **Development Matching** (Development tags): 25% weight
- **Rights Matching** (Rights tags): 10% weight
- **Time Matching** (Class time): 5% weight

#### Scoring Algorithm
```
Matching Score = Basic Match Score × 0.6 + Development Match Score × 0.25 + Rights Match Score × 0.1 + Time Match Score × 0.05
```

## Data Model Design

### Core Tables

#### course_tags Table
Store detailed course tag information, supporting complex tag configurations

#### tag_match_log Table
Record detailed tag matching processes for debugging and optimization

### Key Relationships
- **Course to Tags**: One-to-many relationship
- **Student Profile to Tags**: Embedded relationship
- **Matching Log**: Many-to-many relationship between students and courses

## API Design Reference

### Tag Matching Engine APIs

#### GET /api/v1/courses/match
Get course list matching current student tags (intelligent matching)

#### POST /api/v1/courses/feedback
User feedback on course recommendations for algorithm optimization

### Tag Management APIs

#### GET /api/v1/courses/{id}/tags
Get course tag information

#### PUT /api/v1/courses/{id}/tags
Update course tag information

#### GET /api/v1/profiles/{id}/tags
Get student tag information

#### PUT /api/v1/profiles/{id}/tags
Update student tag information

## Performance Optimization Strategy

### Database Optimization

#### Index Design
- **course_tags table**: Primary key, foreign key, business indexes
- **tag_match_log table**: Primary key, foreign key, query indexes
- **Composite indexes**: Optimize common query patterns

#### Query Optimization
- Use EXISTS subqueries instead of JOIN operations
- Use LIMIT to limit result sets reasonably
- Avoid full table scan operations

### Caching Strategy

#### Redis Caching
- **User Tag Cache**: Cache student tag information for 30 minutes
- **Course Tag Cache**: Cache course tag information for 1 hour
- **Matching Result Cache**: Cache matching results for 15 minutes

#### Cache Key Design
```
user:{profile_id}:tags          # User tag cache
course:{course_id}:tags        # Course tag cache
match:{profile_id}:{week}     # Matching result cache
```

## Testing Strategy

### Unit Tests
- Tag matching algorithm tests
- Data model tests
- Cross-level matching logic tests

### Integration Tests
- API integration tests
- Database integration tests
- Cache integration tests

### Performance Tests
- Matching algorithm performance tests
- Large dataset handling tests
- Concurrent user testing

## Implementation Reference Guidelines

### For MVP-2A Implementation
1. **Focus on Core Matching**: Implement basic tag matching logic
2. **Student Tag Management**: Support manual tag setting and auto-calculation
3. **Course Tag Configuration**: Support comprehensive course tag settings
4. **Matching API**: Provide intelligent course recommendation API

### For MVP-5 Implementation
1. **Admin Tag Management**: Backend tag CRUD operations
2. **Bulk Operations**: Support batch tag operations
3. **Tag Analytics**: Tag usage and matching effect analysis
4. **Tag Quality Control**: Tag data validation and conflict detection

### Integration Points
1. **User Identity System**: Student profile data source
2. **Course Management**: Course and schedule data source
3. **Payment System**: Rights tag calculation basis
4. **Admin Dashboard**: Tag management interface

## Data Validation Rules

### Input Validation
- **Course Tag Validation**: Valid level formats, predefined age ranges
- **Student Tag Validation**: Predefined development tags
- **Business Validation**: Age matching, level matching, gender matching

### Data Integrity
- **Required Fields**: Ensure all required fields have values
- **Foreign Key Constraints**: Ensure referential data integrity
- **Enum Values**: Ensure enum values within predefined ranges

## Deployment and Monitoring

### Database Migration
- Create tag system tables
- Initialize tag data
- Set up indexes and constraints

### Monitoring Metrics
- **Business Metrics**: Matching accuracy, click-through rate, booking conversion rate
- **Technical Metrics**: API response time, database query performance, cache hit rate

### Logging
- **Matching Logs**: Detailed matching process records
- **User Behavior Logs**: User interaction tracking
- **System Performance Logs**: Performance monitoring data

## Future Extension Plans

### Short-term Extensions (3 months)
- **Machine Learning Recommendations**: Collaborative filtering, content recommendations
- **Real-time Recommendations**: WebSocket push, dynamic adjustments
- **Social Recommendations**: Friend recommendations, group recommendations

### Mid-term Extensions (6 months)
- **Multi-dimensional Tags**: Time, location, price, coach preference tags
- **Intelligent Analysis**: Learning path analysis, skill assessment
- **Personalized Customization**: Custom weights, personalized interfaces

### Long-term Extensions (1 year)
- **AI-driven Recommendations**: Deep learning models, NLP, image recognition
- **Full-scenario Recommendations**: Cross-platform, full lifecycle, community-based

## Success Criteria

- [ ] Tag matching accuracy rate > 90%
- [ ] API response time < 100ms
- [ ] System supports 1000+ concurrent users
- [ ] Cache hit rate > 80%
- [ ] User satisfaction with recommendations > 85%
- [ ] Complete audit trail for all tag operations

---

**Note**: This is a design reference document. For specific implementation details, please refer to MVP-2A specification document and MVP-5 admin dashboard specification document.
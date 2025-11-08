# 数据模型： 008-tag-system

**功能分支**: `008-tag-system`
**创建时间**: 2025-11-03
**状态**: Design Reference Only
**MVP**: 8 (Design Reference)
**Purpose**: 标签系统数据模型设计，供MVP-2A和MVP-5实现参考

## 数据库架构设计

### Core Tag System Tables

### 1. course_tags Table

课程标签表，存储课程的详细标签信息，支持复杂的标签配置和多维度分类。

```sql
CREATE TABLE course_tags (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
    course_id INT NOT NULL COMMENT '课程ID',
    level_range VARCHAR(100) DEFAULT NULL COMMENT '等级范围(JSON数组,如["L1+","L2"])',
    age_range ENUM('3-4', '4-5', '5-6', '6+', 'all') DEFAULT 'all' COMMENT '年龄范围',
    gender ENUM('male', 'female', 'both') DEFAULT 'both' COMMENT '性别要求',
    course_type ENUM('interest', 'professional', 'competition', 'long_term', 'trial', 'private', 'camp') NOT NULL COMMENT '课程类型',
    skill_types JSON DEFAULT NULL COMMENT '技能类型(JSON数组)',
    intensity_level ENUM('light', 'medium', 'high') DEFAULT 'medium' COMMENT '课程强度',
    main_instructor VARCHAR(50) DEFAULT NULL COMMENT '主教老师',
    has_assistant BOOLEAN DEFAULT FALSE COMMENT '是否有助教',
    popularity ENUM('hot', 'normal', 'cold') DEFAULT 'normal' COMMENT '热门程度',
    min_age INT DEFAULT 0 COMMENT '最小年龄（计算用）',
    max_age INT DEFAULT 99 COMMENT '最大年龄（计算用）',
    level_min VARCHAR(10) DEFAULT 'L1' COMMENT '最低等级（计算用）',
    level_max VARCHAR(10) DEFAULT 'L6' COMMENT '最高等级（计算用）',
    cross_level_support BOOLEAN DEFAULT TRUE COMMENT '是否支持跨级',
    matching_rules JSON DEFAULT NULL COMMENT '自定义匹配规则',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    INDEX idx_course_id (course_id),
    INDEX idx_course_type (course_type),
    INDEX idx_age_range (age_range),
    INDEX idx_gender (gender),
    INDEX idx_intensity_level (intensity_level),
    INDEX idx_popularity (popularity),
    INDEX idx_level_range (level_range(50)),
    INDEX idx_course_age_type (course_type, age_range),
    INDEX idx_course_popularity (course_type, popularity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程标签表';
```

**Fields Description**:
- `level_range`: 支持跨级匹配，JSON格式存储多个等级，如["L1+", "L2"]
- `age_range`: 目标年龄段，支持灵活匹配，基于枚举值
- `gender`: 性别限制，both表示不限性别
- `course_type`: 课程类型，影响匹配策略和推荐算法
- `skill_types`: 技能类型JSON数组，支持多技能标签，如["flexibility", "coordination"]
- `intensity_level`: 课程强度，影响推荐排序和用户选择
- `main_instructor`: 主教老师，支持教练匹配和用户偏好
- `has_assistant`: 是否有助教，影响课程质量评估
- `popularity`: 热门程度，影响推荐排序和显示权重
- `min_age`/`max_age`: 计算字段，用于快速年龄匹配
- `level_min`/`level_max`: 计算字段，用于快速等级匹配
- `cross_level_support`: 是否支持跨级匹配，影响匹配算法
- `matching_rules`: 自定义匹配规则JSON，支持灵活配置

### 2. student_profile_tags Table

学员档案标签表，存储学员的多维度标签信息，支持自动计算和手动设置。

```sql
CREATE TABLE student_profile_tags (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
    profile_id INT NOT NULL COMMENT '学员档案ID',
    age_tag ENUM('3-4', '4-5', '5-6', '6+') NOT NULL COMMENT '年龄标签',
    level VARCHAR(10) NOT NULL COMMENT '等级标签',
    gender ENUM('male', 'female') NOT NULL COMMENT '性别标签',
    development_tag ENUM('interest', 'professional', 'competition', 'long_term') DEFAULT 'interest' COMMENT '发展标签',
    privilege_tag ENUM('old_user', 'new_user', 'friend_discount') DEFAULT 'new_user' COMMENT '权益标签',
    relationship_tag ENUM('self', 'child', 'spouse', 'parent') DEFAULT 'self' COMMENT '关系标签',
    virtual_age INT DEFAULT NULL COMMENT '虚拟年龄',
    active_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '活跃状态',
    consumption_level ENUM('low', 'medium', 'high') DEFAULT 'low' COMMENT '消费等级',
    preferred_time_slots JSON DEFAULT NULL COMMENT '偏好时间段',
    preferred_instructors JSON DEFAULT NULL COMMENT '偏好教练',
    skill_preferences JSON DEFAULT NULL COMMENT '技能偏好',
    auto_calculated_tags JSON DEFAULT NULL COMMENT '自动计算标签',
    custom_tags JSON DEFAULT NULL COMMENT '自定义标签',
    tag_version INT DEFAULT 1 COMMENT '标签版本',
    last_updated_by INT DEFAULT NULL COMMENT '最后更新人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (last_updated_by) REFERENCES admin_users(id) ON DELETE SET NULL,

    INDEX idx_profile_id (profile_id),
    INDEX idx_age_level_development (age_tag, level, development_tag),
    INDEX idx_privilege_tag (privilege_tag),
    INDEX idx_active_status (active_status),
    INDEX idx_consumption_level (consumption_level),
    INDEX idx_development_privilege (development_tag, privilege_tag),
    UNIQUE KEY uk_profile_id (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学员档案标签表';
```

**Fields Description**:
- `age_tag`: 基于生日自动计算的年龄标签，支持精确匹配
- `level`: 运营手动设置的技能等级，支持跨级标记
- `gender`: 从profile获取的性别信息
- `development_tag`: 发展目标标签，反映学员学习方向
- `privilege_tag`: 权益标签，根据消费记录自动计算
- `relationship_tag`: 关系标签，标识学员与用户的关系
- `virtual_age`: 虚拟年龄设置，支持特殊情况处理
- `active_status`: 活跃状态，基于最近预约记录计算
- `consumption_level`: 消费等级，基于消费金额统计
- `preferred_time_slots`: 时间偏好JSON数组，支持个性化推荐
- `preferred_instructors`: 教练偏好JSON数组，支持教练匹配
- `skill_preferences`: 技能偏好JSON数组，支持精准推荐
- `auto_calculated_tags`: 自动计算标签集合，包含系统计算的各类标签
- `custom_tags`: 自定义标签，支持运营灵活标记
- `tag_version`: 标签版本，支持标签变更追踪

### 3. tag_match_log Table

标签匹配日志表，记录标签匹配的详细过程，用于调试、优化和算法分析。

```sql
CREATE TABLE tag_match_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '匹配日志ID',
    profile_id INT NOT NULL COMMENT '档案ID',
    user_id INT NOT NULL COMMENT '用户ID',
    course_id INT NOT NULL COMMENT '课程ID',
    is_matched BOOLEAN NOT NULL COMMENT '是否匹配',
    match_score DECIMAL(5,2) DEFAULT NULL COMMENT '匹配分数(0-100)',
    match_details JSON DEFAULT NULL COMMENT '匹配详情',
    match_rule VARCHAR(50) DEFAULT NULL COMMENT '匹配规则类型',
    algorithm_version VARCHAR(20) DEFAULT 'v1.0' COMMENT '算法版本',
    execution_time_ms INT DEFAULT 0 COMMENT '执行时间(毫秒)',
    cache_hit BOOLEAN DEFAULT FALSE COMMENT '是否命中缓存',
    match_reason TEXT COMMENT '匹配原因说明',
    filter_applied JSON DEFAULT NULL COMMENT '应用的筛选条件',
    user_feedback ENUM('like', 'dislike', 'neutral') DEFAULT NULL COMMENT '用户反馈',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    INDEX idx_profile_id (profile_id),
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_matched (is_matched),
    INDEX idx_match_score (match_score),
    INDEX idx_algorithm_version (algorithm_version),
    INDEX idx_cache_hit (cache_hit),
    INDEX idx_user_feedback (user_feedback),
    INDEX idx_profile_created (profile_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签匹配日志表';
```

**Fields Description**:
- `is_matched`: 最终匹配结果，用于成功率和分析
- `match_score`: 匹配分数，用于排序和推荐质量评估
- `match_details`: 详细的匹配过程，包含各维度得分和匹配逻辑
- `match_rule`: 应用的匹配规则类型，如"under_L3"、"above_L3"、"trial_class"
- `algorithm_version`: 算法版本，支持算法迭代和A/B测试
- `execution_time_ms`: 执行时间，用于性能监控和优化
- `cache_hit`: 是否命中缓存，用于缓存效果评估
- `match_reason`: 匹配原因说明，用于调试和用户解释
- `filter_applied`: 应用的筛选条件，支持用户自定义筛选
- `user_feedback`: 用户反馈，用于算法优化和个性化

### 4. tag_feedback Table

标签反馈表，记录用户对推荐结果的反馈，用于算法优化和个性化。

```sql
CREATE TABLE tag_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '反馈ID',
    profile_id INT NOT NULL COMMENT '档案ID',
    user_id INT NOT NULL COMMENT '用户ID',
    course_id INT NOT NULL COMMENT '课程ID',
    feedback_type ENUM('like', 'dislike', 'not_interested', 'too_hard', 'too_easy', 'time_conflict', 'other') NOT NULL COMMENT '反馈类型',
    feedback_reason TEXT COMMENT '反馈原因',
    feedback_score INT DEFAULT 0 COMMENT '反馈评分(1-5)',
    match_score_at_time DECIMAL(5,2) DEFAULT NULL COMMENT '当时的匹配分数',
    tags_at_time JSON DEFAULT NULL COMMENT '当时的标签信息',
    improvement_suggestion TEXT COMMENT '改进建议',
    is_processed BOOLEAN DEFAULT FALSE COMMENT '是否已处理',
    processed_at DATETIME DEFAULT NULL COMMENT '处理时间',
    processing_result JSON DEFAULT NULL COMMENT '处理结果',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    INDEX idx_profile_id (profile_id),
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_is_processed (is_processed),
    INDEX idx_created_at (created_at),
    INDEX idx_feedback_score (feedback_score),
    INDEX idx_profile_feedback (profile_id, feedback_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签反馈表';
```

### 5. tag_metadata Table

标签元数据表，存储标签系统的配置信息和版本控制。

```sql
CREATE TABLE tag_metadata (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '元数据ID',
    meta_key VARCHAR(100) NOT NULL COMMENT '配置键',
    meta_value TEXT COMMENT '配置值',
    meta_type ENUM('string', 'number', 'boolean', 'json', 'array') DEFAULT 'string' COMMENT '数据类型',
    description TEXT COMMENT '配置描述',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统配置',
    version INT DEFAULT 1 COMMENT '配置版本',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_by INT DEFAULT NULL COMMENT '创建人',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_meta_key (meta_key, version),
    INDEX idx_meta_type (meta_type),
    INDEX idx_is_system (is_system),
    INDEX idx_is_active (is_active),

    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签元数据表';
```

### 6. tag_version_history Table

标签版本历史表，记录标签变更的历史记录。

```sql
CREATE TABLE tag_version_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '版本ID',
    profile_id INT NOT NULL COMMENT '档案ID',
    course_id INT NULL COMMENT '课程ID（课程标签变更）',
    change_type ENUM('profile_tag', 'course_tag', 'system_config') NOT NULL COMMENT '变更类型',
    old_data JSON DEFAULT NULL COMMENT '变更前数据',
    new_data JSON DEFAULT NULL COMMENT '变更后数据',
    change_reason TEXT COMMENT '变更原因',
    changed_by INT DEFAULT NULL COMMENT '变更人',
    change_version INT DEFAULT 1 COMMENT '变更版本',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_profile_id (profile_id),
    INDEX idx_course_id (course_id),
    INDEX idx_change_type (change_type),
    INDEX idx_changed_by (changed_by),
    INDEX idx_created_at (created_at),
    INDEX idx_change_version (change_version),

    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签版本历史表';
```

## 实体关系

### Relationship Diagram

```
student_profiles (1) -----> (1) student_profile_tags -----> (N) tag_match_log
      |                          |                           |
      |                          v                           v
      |                   tag_version_history <---- (N) tag_feedback
      |                          |
      |                          v
      +-------------------> (N) tag_metadata

courses (1) -----> (1) course_tags -----> (N) tag_match_log
      |                          |
      |                          v
      +-------------------> (N) tag_version_history
```

### Key Relationships

1. **Student Profile to Tags**: One-to-one relationship
   - Each student profile has exactly one tag record
   - Tags contain all dimensional information for matching

2. **Course to Tags**: One-to-one relationship
   - Each course has exactly one tag record
   - Course tags define matching criteria

3. **Profile/Course to Match Log**: Many-to-many relationship
   - Each profile-course matching attempt creates a log entry
   - Logs provide detailed matching process for analysis

4. **Tags to Feedback**: Many-to-many relationship
   - Users can provide feedback on recommended courses
   - Feedback used for algorithm optimization

5. **Tags to Version History**: One-to-many relationship
   - Each tag change creates version history
   - Supports audit trail and rollback

## 数据验证规则

### Course Tags Validation
- `level_range` must be valid JSON array with level strings
- `age_range` must be one of predefined enum values
- `gender` must be male, female, or both
- `course_type` must be one of predefined course types
- `skill_types` must be valid JSON array of skill types
- `popularity` defaults to normal if not specified

### Student Profile Tags Validation
- `age_tag` is auto-calculated based on birthday
- `level` must be a valid level string (L1-L6 with optional +)
- `gender` must match profile gender
- `development_tag` defaults to interest if not specified
- `privilege_tag` is auto-calculated based on purchase history

### Match Log Validation
- `match_score` must be between 0 and 100 if provided
- `match_details` must be valid JSON with required fields
- `execution_time_ms` must be positive integer
- `algorithm_version` must follow semantic versioning

### Feedback Validation
- `feedback_type` must be one of predefined enum values
- `feedback_score` must be between 1 and 5 if provided
- `match_score_at_time` must reference actual match score

## Indexing Strategy

### Primary Indexes
- All tables have auto-increment primary keys
- Business unique constraints where appropriate

### Foreign Key Indexes
- All foreign key columns indexed for join performance
- Composite indexes for common query patterns

### Performance Optimization Indexes
```sql
-- Course matching optimization
CREATE INDEX idx_course_matching ON course_tags(course_type, age_range, gender, popularity);

-- Student profile matching optimization
CREATE INDEX idx_student_matching ON student_profile_tags(age_tag, level, development_tag, privilege_tag);

-- Match log analysis optimization
CREATE INDEX idx_match_analysis ON tag_match_log(is_matched, match_score, algorithm_version, created_at);

-- Feedback analysis optimization
CREATE INDEX idx_feedback_analysis ON tag_feedback(feedback_type, feedback_score, is_processed);
```

## 数据迁移考虑

### Migration Scripts
1. Create tag system tables with proper constraints
2. Initialize existing course and profile data with default tags
3. Set up initial metadata configuration
4. Create default tag matching rules

### Data Initialization
```sql
-- Initialize course tags for existing courses
INSERT INTO course_tags (course_id, course_type, level_range, age_range, gender)
SELECT id, 'interest', '["L1", "L2"]', 'all', 'both' FROM courses;

-- Initialize student profile tags for existing profiles
INSERT INTO student_profile_tags (profile_id, level, gender, age_tag)
SELECT id, 'L1', gender,
       CASE
         WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 3 AND 4 THEN '3-4'
         WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 4 AND 5 THEN '4-5'
         WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 5 AND 6 THEN '5-6'
         ELSE '6+'
       END
FROM student_profiles;

-- Initialize tag metadata
INSERT INTO tag_metadata (meta_key, meta_value, meta_type, description, is_system)
VALUES
('matching_algorithm_version', 'v1.0', 'string', 'Current matching algorithm version', TRUE),
('default_matching_weights', '{"basic": 0.6, "development": 0.25, "privilege": 0.1, "time": 0.05}', 'json', 'Default matching weights', TRUE),
('cache_ttl_user_tags', '1800', 'number', 'User tags cache TTL in seconds', TRUE),
('cache_ttl_course_tags', '3600', 'number', 'Course tags cache TTL in seconds', TRUE);
```

## 性能考虑

### Read Patterns
- Course tag queries for matching (high frequency)
- Student profile tag queries for matching (high frequency)
- Match log queries for analysis (medium frequency)
- Feedback queries for optimization (low frequency)

### Write Patterns
- Tag updates and modifications (low frequency)
- Match log creation (high frequency during peak times)
- Feedback submission (medium frequency)
- Version history creation (low frequency)

### Caching Strategy
- Redis cache for student profile tags (30 min TTL)
- Redis cache for course tags (1 hour TTL)
- Cache for matching results (15 min TTL)
- Metadata configuration cache (1 hour TTL)

## JSON Field Structures

### match_details Structure
```json
{
  "level_match": {
    "score": 100,
    "reason": "等级完全匹配",
    "details": {
      "student_level": "L2",
      "course_levels": ["L1+", "L2"],
      "is_cross_level": false
    }
  },
  "age_match": {
    "score": 100,
    "reason": "年龄在目标范围内",
    "details": {
      "student_age": 5.2,
      "course_age_range": "4-5",
      "within_range": true
    }
  },
  "gender_match": {
    "score": 100,
    "reason": "性别不限",
    "details": {
      "student_gender": "male",
      "course_gender": "both",
      "match": true
    }
  },
  "development_match": {
    "score": 80,
    "reason": "发展标签部分匹配",
    "details": {
      "student_development": "interest",
      "course_type": "interest",
      "match_quality": "good"
    }
  },
  "overall_score": 92.0,
  "matching_rule": "under_L3",
  "execution_time_ms": 45
}
```

### auto_calculated_tags Structure
```json
{
  "age_calculated": {
    "actual_age": 5.2,
    "age_tag": "4-5",
    "calculation_date": "2025-11-03"
  },
  "privilege_calculated": {
    "total_spent": 0,
    "has_bookings": false,
    "privilege_tag": "new_user",
    "last_calculation": "2025-11-03"
  },
  "activity_status": {
    "last_booking_date": null,
    "days_inactive": 0,
    "active_status": "active",
    "calculation_date": "2025-11-03"
  },
  "consumption_metrics": {
    "total_amount": 0,
    "booking_count": 0,
    "consumption_level": "low",
    "last_updated": "2025-11-03"
  }
}
```

## 安全考虑

### Data Security
- Sensitive user data encrypted in JSON fields
- Input validation for all JSON data
- SQL injection prevention for JSON queries
- Audit logging for all tag modifications

### Access Control
- Role-based access to tag modification
- Permission-based tag management
- Audit trail for sensitive operations
- Data validation at application level

## Monitoring and Analytics

### Performance Metrics
- Tag matching execution time
- Cache hit/miss rates
- Database query performance
- API response times

### Business Metrics
- Tag matching accuracy rate
- User feedback analysis
- Recommendation success rate
- Tag coverage completeness

### System Health
- Data consistency checks
- Version synchronization
- Cache health monitoring
- Error rate tracking
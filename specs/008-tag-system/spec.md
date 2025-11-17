# RuoYi功能规格：008-tag-system

**功能ID**: 008-tag-system
**功能名称**: 标签系统设计参考
**状态**: 设计参考文档（由MVP-2A实现）
**创建时间**: 2025-10-31
**重构日期**: 2025-11-17
**版本**: v2.0.0 RuoYi架构重构
**技术栈**: RuoYi-Vue-Pro + MyBatis-Plus + Redis + Vue3
**目的**: 基于RuoYi企业级架构定义完整的标签体系和智能匹配算法，为MVP-2A/MVP-5提供参考

---

## 概述

基于RuoYi-Vue-Pro企业级架构的标签系统是百适体操馆项目的核心功能，通过MyBatis-Plus + Redis实现高性能的智能课程推荐和学员管理。系统采用3维硬匹配+软标签排序算法，结合Spring @Cacheable缓存优化，为每位学员精准推荐最适合的课程，同时为RuoYi管理后台提供数据驱动的运营分析基础。

### RuoYi架构设计目标

1. **企业级智能推荐**：基于MyBatis-Plus + Redis的学员标签自动匹配算法
2. **精准营销引擎**：支持基于发展标签的RuoYi级联课程推荐系统
3. **数据驱动决策**：为RuoYi管理后台提供实时数据分析和可视化
4. **用户体验优化**：Vue3 + Element Plus响应式界面提升使用体验

### RuoYi技术架构原则

- **企业级标准**：遵循RuoYi-Vue-Pro开发规范和设计模式
- **高性能架构**：MyBatis-Plus + Redis缓存 + Spring Boot性能优化
- **可扩展设计**：支持RuoYi模块化开发和微服务架构演进
- **安全可靠**：Spring Security权限控制和RuoYi审计日志完整追踪

---

## RuoYi-Vue-Pro标签体系架构

### RuoYi技术栈架构
```
┌─────────────────────────────────────────────────────────┐
│ Vue3 + Element Plus 前端标签管理界面                     │
├─────────────────────────────────────────────────────────┤
│ RuoYi Controller层：标签匹配RESTful API                  │
├─────────────────────────────────────────────────────────┤
│ RuoYi Service层：Spring @Transactional + @Cacheable       │
├─────────────────────────────────────────────────────────┤
│ MyBatis-Plus Mapper层：LambdaQueryWrapper查询优化       │
├─────────────────────────────────────────────────────────┤
│ Redis缓存层：Spring Cache + 3维匹配结果缓存             │
├─────────────────────────────────────────────────────────┤
│ MySQL数据层：course_tags表 + tag_match_log表            │
└─────────────────────────────────────────────────────────┘
```

### RuoYi学员标签维度（MyBatis-Plus实体设计）

#### 1. 基础属性标签
- **年龄标签**：基于birthday自动计算
  - 3-4岁：学龄前幼儿
  - 4-5岁：学龄前儿童
  - 5-6岁：学龄儿童
  - 6岁以上：青少年
- **等级标签**：运营手动设置
  - L1-L6：基础技能等级
  - 支持跨级匹配（如L1+表示L1.5）
- **性别标签**：从profile.gender获取
  - male：男性
  - female：女性

#### 2. 发展特征标签
- **发展标签**：运营手动设置，反映学员的学习目标
  - interest：兴趣班（培养体操兴趣）
  - professional：专业班（技能提升）
  - competition：竞赛班（竞技训练）
  - long_term：长训班（长期培养）

#### 3. 权益属性标签
- **权益标签**：自动根据学员状态计算
  - old_user：老用户（有消费记录）
  - new_user：新用户（首次注册）
  - friend_discount：亲友权益（推荐用户）

#### 4. 身份标识标签
- **关系标签**：基于档案关联关系
  - self：本人报课
  - child：子女
  - spouse：配偶
  - parent：父母

#### 5. RuoYi自动计算标签
- **年龄标签**：基于birthday实时计算（@Scheduled定时任务）
- **活跃度标签**：基于最近预约记录（MyBatis-Plus LambdaQueryWrapper统计）
- **消费等级标签**：基于消费金额统计（Redis缓存 + Spring Batch批处理）

**RuoYi学员标签实体设计**：
```java
@Data
@TableName("gym_student_profile")
public class GymStudentProfile extends BaseEntity {

    @TableId(value = "profile_id", type = IdType.AUTO)
    private Long profileId;

    @TableField("student_name")
    private String studentName;

    @TableField("birthday")
    private LocalDate birthday; // 自动计算年龄标签

    @TableField("gender")
    private String gender; // male/female

    @TableField("level")
    private String level; // L1-L6，支持跨级L1+

    @TableField("development_tag")
    private String developmentTag; // interest/professional/competition/long_term

    @TableField("privilege_tag")
    private String privilegeTag; // old_user/new_user/friend_discount

    @Version
    @TableField("version")
    private Integer version;

    // 虚拟字段 - 不存储在数据库，通过@Transient注解
    @TableField(exist = false)
    private String ageTag; // 基于birthday自动计算

    @TableField(exist = false)
    private String activeStatusTag; // 基于预约记录计算

    @TableField(exist = false)
    private String consumptionLevelTag; // 基于消费金额计算
}
```

#### 1. RuoYi基础属性标签
- **等级范围**：支持跨级设置
  - 支持JSON数组：["L1+", "L2"]
  - 支持单一等级："L3"
- **年龄范围**：明确的目标年龄段
  - 3-4：3-4岁
  - 4-5：4-5岁
  - 5-6：5-6岁
  - 6+：6岁以上
  - all：不限年龄
- **性别要求**：性别限制
  - male：仅限男性
  - female：仅限女性
  - both：不限性别

#### 2. 教学特征标签
- **课程类型**：反映课程性质
  - interest：兴趣课程
  - professional：专业技能课程
  - competition：竞技训练课程
  - long_term：长期培养课程
  - trial：体验课程
  - private：私教课程
  - camp：营地课程
- **技能类型**：具体技能方向
  - flexibility：柔韧训练
  - strength：力量训练
  - coordination：协调训练
  - technique：技巧训练

#### 3. 运营属性标签
- **主教老师**：课程主教练
- **助教支持**：是否有助教
- **课程强度**：课程强度等级
  - light：轻度
  - medium：中度
  - high：高强度
- **热门程度**：课程受欢迎程度
  - hot：热门课程
  - normal：常规课程
  - cold：冷门课程

**RuoYi课程标签实体设计**：
```java
@Data
@TableName("gym_course_tags")
public class GymCourseTags extends BaseEntity {

    @TableId(value = "tag_id", type = IdType.AUTO)
    private Long tagId;

    @TableField("course_id")
    private Long courseId;

    @TableField("level_range")
    private String levelRange; // JSON: ["L1+", "L2"]

    @TableField("age_range")
    private String ageRange; // 3-4/4-5/5-6/6+/all

    @TableField("gender")
    private String gender; // male/female/both（强制验证）

    @TableField("course_type")
    private String courseType; // 软标签：interest/professional/competition/trial/private/camp

    @TableField("skill_types")
    private String skillTypes; // JSON: ["flexibility", "coordination"]

    @TableField("intensity_level")
    private String intensityLevel; // light/medium/high

    @TableField("main_instructor")
    private String mainInstructor;

    @TableField("has_assistant")
    private Boolean hasAssistant;

    @TableField("popularity")
    private String popularity; // hot/normal/cold

    @TableField("waitlist_capacity")
    private Integer waitlistCapacity; // 候补队列容量

    @Version
    @TableField("version")
    private Integer version;

    @TableField("del_flag")
    private String delFlag;
}
```

**RuoYi标签匹配Service层示例**：
```java
@Service
@Log(title = "标签智能匹配", businessType = BusinessType.OTHER)
@Slf4j
public class GymTagMatchServiceImpl implements IGymTagMatchService {

    @Autowired
    private IGymCourseTagsService courseTagsService;

    @Autowired
    private IGymStudentProfileService studentProfileService;

    @Override
    @Cacheable(value = "tagMatches", key = "#profileId + '_' + #week",
               unless = "#result == null || #result.isEmpty()")
    public List<GymCourseMatchDTO> getMatchedCourses(Long profileId, Integer week) {
        // 1. 获取学员标签信息（Redis缓存优化）
        GymStudentProfile profile = studentProfileService.getById(profileId);

        // 2. 3维硬匹配查询（等级 + 年龄 + 性别）
        LambdaQueryWrapper<GymCourseTags> wrapper = new LambdaQueryWrapper<>();
        wrapper.apply("JSON_CONTAINS(level_range, '{0}')", profile.getLevel())
               .eq(GymCourseTags::getAgeRange, calculateAgeRange(profile.getBirthday()))
               .in(GymCourseTags::getGender, Arrays.asList(profile.getGender(), "both"));

        List<GymCourseTags> matchedTags = courseTagsService.list(wrapper);

        // 3. 软标签排序推荐
        return sortBySoftTags(matchedTags, profile);
    }

    private List<GymCourseMatchDTO> sortBySoftTags(List<GymCourseTags> tags,
                                                  GymStudentProfile profile) {
        // 软标签排序算法：类型匹配度(40%) + 发展标签(30%) + 热门程度(20%) + 时间(10%)
        return tags.stream()
                .map(tag -> calculateMatchScore(tag, profile))
                .sorted(Comparator.comparing(GymCourseMatchDTO::getRecommendationScore).reversed())
                .collect(Collectors.toList());
    }
}
```

---

## RuoYi 3维硬匹配+软标签排序算法

### 规则1：3维硬匹配白名单规则（FR-040）(根据Q4,Q11,Q16,Q19更新)

采用严格的3维硬匹配验证机制，只有同时满足所有3个硬性维度的课程才会显示：

#### 3维硬匹配验证框架
**所有课程必须通过以下3个硬性维度的白名单验证**：
1. **等级维度** (Level): 学员等级必须在课程等级范围内
2. **年龄维度** (Age): 学员年龄必须在课程年龄范围内
3. **性别维度** (Gender): 学员性别必须符合课程性别要求（强制验证）

**注意**: 课程类型(course_type)降级为软标签，仅用于推荐排序和定价，不参与硬匹配

#### L3以下学员（基础阶段）- 3维硬匹配
- **匹配条件**：等级 + 年龄 + 性别（3维全部强制匹配）
- **逻辑**：低龄学员需要3维硬匹配验证，类型标签作为软标签推荐
- **示例**：5岁L2男性学员 → 匹配等级包含L2 AND 年龄4-5岁 AND 男性/不限，然后按类型标签排序推荐

#### L3及以上学员（进阶阶段）- 3维硬匹配
- **匹配条件**：等级 + 年龄 + 性别（3维全部强制匹配）
- **逻辑**：高龄学员同样需要3维硬匹配验证
- **示例**：8岁L4男性学员 → 匹配等级包含L4 AND 年龄6+岁 AND 男性/不限，然后按类型和发展标签排序推荐

#### 特殊课程类型的3维硬匹配
- **体验课 (trial)**：等级 + 年龄 + 性别（硬匹配）+ OpenID限制，类型作为软标签
- **私教课 (private)**：等级 + 年龄 + 性别（硬匹配），类型=private作为软标签优先推荐
- **长训班 (long_term)**：3维硬匹配 + 发展标签作为软标签排序

#### 白名单验证逻辑
```
// 3维硬匹配验证算法
if (等级匹配 AND 年龄匹配 AND 性别匹配) {
  匹配结果 = 100%  // 硬匹配通过，进入推荐列表
  // 然后按软标签(类型、发展等)排序推荐
} else {
  匹配结果 = 0%    // 任一维度不匹配则排除
}
```

#### 强制性别验证
- **所有课程**：必须明确设置性别限制（male/female/both），不再使用默认值
- **性别验证**：从可选匹配改为强制白名单验证
- **性别枚举**：
  - `male`: 仅限男性学员
  - `female`: 仅限女性学员
  - `both`: 不限性别（但仍需验证学员性别符合条件）

### 规则2：跨级标签匹配

支持灵活的跨级匹配机制：

#### 跨级标签定义
- **L1+**：表示L1.5（比L1高，但不到L2）
- **L2+**：表示L2.5（比L2高，但不到L3）
- **L3+**：表示L3.5（比L3高，但不到L4）

#### 匹配逻辑
- **包含匹配**：学员等级在课程等级范围内
- **示例**：
  - 课程标签["L1+", "L2"]：
    - L1学员 → 不匹配（低于最低要求）
    - L1+学员 → 匹配
    - L2学员 → 匹配

### 规则3：体验课特殊规则

体验课有特殊的匹配限制：

#### 匹配条件
1. **年龄标签**：符合课程年龄要求
2. **未购买限制**：该微信OpenID未购买过体验课
3. **非正式课**：学员钱包无余额（未正式报名）
4. **时间窗口**：30天内未购买过体验课

#### 排除条件
- 已购买过体验课的学员
- 已正式报名的学员
- 年龄不符合的学员

### 规则4：3维硬匹配 + 软标签排序规则

采用3维硬匹配+软标签排序的逻辑，硬匹配决定是否显示，软标签决定推荐优先级：

#### 匹配条件
- **硬匹配必须完全通过**：等级、年龄、性别必须全部符合要求
- **软标签排序推荐**：通过硬匹配后，按类型、发展等软标签排序推荐
- **推荐优先级**：类型匹配度 > 发展标签匹配度 > 热门程度 > 开课时间

#### 匹配逻辑
```
if (等级匹配 AND 年龄匹配 AND 性别匹配) {
  硬匹配结果 = 100%  // 硬匹配通过，进入推荐池
  // 计算软标签推荐分数
  推荐分数 = 类型匹配分数 * 40% + 发展标签分数 * 30% + 热门分数 * 20% + 时间分数 * 10%
} else {
  匹配结果 = 0%      // 硬匹配失败，不显示
}
```

---

### 3维硬匹配规则说明 (根据Q4,Q11,Q16,Q19更新)

#### 完整的3维硬匹配+软标签排序逻辑
采用硬匹配过滤+软标签排序的规则，硬匹配决定是否显示，软标签决定推荐顺序：

1. **所有学员**：等级 + 年龄 + 性别（3维硬匹配强制验证）
2. **软标签排序**：通过硬匹配后，按类型匹配度、发展标签匹配度、热门程度、开课时间排序
3. **体验课特殊规则**：3维硬匹配 + OpenID限制，类型trial作为软标签优先推荐
4. **私教课特殊规则**：3维硬匹配，类型private作为软标签优先推荐

#### 软标签推荐排序优先级
当多个课程都通过3维硬匹配时，按以下优先级排序：
1. **类型匹配度**：课程类型与学员发展目标匹配程度（40%权重）
2. **发展标签匹配度**：发展特征标签匹配程度（30%权重）
3. **热门程度**：hot > normal > cold（20%权重）
4. **开课时间**：时间近的优先（10%权重）

#### 3维硬匹配边界情况处理

##### 1. 硬匹配失败的情况（不显示）
以下任一硬匹配条件不满足，课程都不会显示在推荐列表中：
- 学员等级不在课程等级范围内
- 学员年龄超出课程年龄范围
- 学员性别与课程性别要求不符
- 跨级标签不匹配
- **特别注意**：任一硬匹配维度失败 = 直接排除，不显示给用户

##### 2. 缺失标签处理
- **学员标签缺失**：提示完善档案信息后再查看课程
- **课程标签缺失**：运营人员必须完善所有3维硬匹配标签才能正常显示
- **性别标签未设置**：系统强制要求设置，默认为"both"但需要明确确认
- **软标签缺失**：影响推荐排序，但不影响是否显示

##### 3. 3维硬匹配性能优化
- **3维索引**：为等级、年龄、性别3个字段建立复合索引
- **分步过滤**：先硬匹配过滤，再软标签排序
- **缓存策略**：缓存硬匹配结果15分钟，软标签排序实时计算
- **分页加载**：每次最多显示20个通过硬匹配的课程

---

## 数据模型设计

### 表结构概览

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     profile     │         │    course       │         │  course_tags    │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │◄────────┤ id (PK)         │
│ name            │         │ name            │         │ course_id (FK)   │
│ birthday        │         │ description     │         │ level_range     │
│ gender          │         │ level           │         │ age_range       │
│ level           │         │ course_type     │         │ gender          │
│ development     │         │ max_capacity    │         │ course_type     │
│ privilege       │         │ price           │         │ main_instructor  │
│ ...             │         │ ...             │         │ has_assistant   │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                           ┌─────────────────┐
                           │ tag_match_log   │
                           ├─────────────────┤
                           │ id (PK)         │
                           │ profile_id (FK) │
                           │ course_id (FK) │
                           │ is_matched      │
                           │ match_details   │
                           │ match_rule      │
                           │ created_at      │
                           └─────────────────┘
```

### course_tags表

**描述**：存储课程的详细标签信息，支持复杂的标签配置

```sql
CREATE TABLE `course_tags` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
  `course_id` INT NOT NULL COMMENT '课程ID',
  `level_range` VARCHAR(100) DEFAULT NULL COMMENT '等级范围(JSON数组,如["L1+","L2"])',
  `age_range` ENUM('3-4', '4-5', '5-6', '6+', 'all') DEFAULT 'all' COMMENT '年龄范围',
  `gender` ENUM('male', 'female', 'both') NOT NULL DEFAULT 'both' COMMENT '性别要求（强制设置）',
  `course_type` ENUM('interest', 'professional', 'competition', 'long_term', 'trial', 'private', 'camp') NOT NULL COMMENT '课程类型（软标签，用于推荐排序）',
  `skill_types` JSON DEFAULT NULL COMMENT '技能类型(JSON数组)',
  `intensity_level` ENUM('light', 'medium', 'high') DEFAULT 'medium' COMMENT '课程强度',
  `main_instructor` VARCHAR(50) DEFAULT NULL COMMENT '主教老师',
  `has_assistant` BOOLEAN DEFAULT FALSE COMMENT '是否有助教',
  `popularity` ENUM('hot', 'normal', 'cold') DEFAULT 'normal' COMMENT '热门程度',
  `waitlist_capacity` INT NOT NULL DEFAULT 8 COMMENT '候补队列容量限制（FR-043）',
  `gender_validation` ENUM('required', 'optional') NOT NULL DEFAULT 'required' COMMENT '性别验证级别（3维硬匹配）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_course_type` (`course_type`),
  INDEX `idx_age_range` (`age_range`),
  INDEX `idx_gender` (`gender`),
  INDEX `idx_3d_match` (`age_range`, `gender`, `level_range`), -- 3维硬匹配复合索引
  INDEX `idx_waitlist_capacity` (`waitlist_capacity`),
  INDEX `idx_intensity_level` (`intensity_level`),
  INDEX `idx_popularity` (`popularity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程标签表（支持3维硬匹配和软标签推荐排序）';
```

**字段说明**：
- `level_range`：支持跨级匹配，JSON格式存储多个等级
- `age_range`：目标年龄段，支持灵活匹配
- `gender`：性别要求（强制设置），both表示不限但仍需验证
- `course_type`：课程类型（软标签），用于推荐排序，不参与硬匹配
- `skill_types`：技能类型JSON数组，支持多技能标签
- `intensity_level`：课程强度，影响推荐算法
- `main_instructor`：主教老师，支持教练匹配
- `has_assistant`：是否有助教，影响课程质量评估
- `popularity`：热门程度，影响推荐排序
- **FR-043字段**：
  - `waitlist_capacity`：候补队列容量限制，默认8人
- **3维硬匹配字段**：
  - `gender_validation`：性别验证级别，required=强制验证

### tag_match_log表

**描述**：记录标签匹配的详细过程，用于调试和优化匹配算法

```sql
CREATE TABLE `tag_match_log` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '匹配日志ID',
  `profile_id` INT NOT NULL COMMENT '档案ID',
  `course_id` INT NOT NULL COMMENT '课程ID',
  `is_matched` BOOLEAN NOT NULL COMMENT '是否匹配',
  `match_score` DECIMAL(5,2) DEFAULT NULL COMMENT '匹配分数(0-100)',
  `match_details` JSON DEFAULT NULL COMMENT '匹配详情',
  `match_rule` VARCHAR(50) DEFAULT NULL COMMENT '匹配规则类型',
  `algorithm_version` VARCHAR(20) DEFAULT 'v1.0' COMMENT '算法版本',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  INDEX `idx_profile_id` (`profile_id`),
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_is_matched` (`is_matched`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签匹配日志表';
```

**字段说明**：
- `is_matched`：最终匹配结果
- `match_score`：匹配分数，用于排序和推荐
- `match_details`：详细的匹配过程，包含各维度得分
- `match_rule`：应用的匹配规则类型
- `algorithm_version`：算法版本，支持算法迭代

**match_details结构示例（3维硬匹配+软标签）**：
```json
{
  "validation_type": "3d_hard_match_soft_tags",
  "overall_match": true,
  "match_score": 100.0,
  "hard_match_results": {
    "level_match": {
      "score": 100,
      "result": "matched",
      "reason": "学员等级L2在课程等级范围['L1+', 'L2']内",
      "required": true
    },
    "age_match": {
      "score": 100,
      "result": "matched",
      "reason": "学员年龄5.2岁在课程年龄范围4-5岁内",
      "required": true
    },
    "gender_match": {
      "score": 100,
      "result": "matched",
      "reason": "学员性别male符合课程性别要求both",
      "required": true
    }
  },
  "soft_tag_scores": {
    "course_type_match": {
      "score": 95,
      "result": "high_match",
      "reason": "学员目标interest匹配课程类型interest",
      "weight": 0.4
    },
    "development_match": {
      "score": 90,
      "result": "matched",
      "reason": "发展标签匹配",
      "weight": 0.3
    },
    "popularity_score": {
      "score": 80,
      "result": "normal",
      "reason": "课程热门程度normal",
      "weight": 0.2
    },
    "time_score": {
      "score": 85,
      "result": "good",
      "reason": "开课时间合适",
      "weight": 0.1
    }
  },
  "recommendation_score": 89.5,
  "validation_summary": {
    "hard_match_passed": true,
    "total_hard_dimensions": 3,
    "passed_hard_dimensions": 3,
    "recommendation_rank": 1,
    "algorithm_version": "v3.0_3d_soft"
  }
}
```

---

## RuoYi-Vue-Pro API设计

### RuoYi Controller层标签匹配引擎API

#### GET /gym/tag/courses/match（RuoYi标准路由）

**RuoYi Controller设计**：
```java
@RestController
@RequestMapping("/gym/tag")
@Api(tags = "标签智能匹配")
@RequiredArgsConstructor
public class GymTagController extends BaseController {

    private final IGymTagMatchService tagMatchService;

    @GetMapping("/courses/match")
    @ApiOperation("获取智能匹配课程列表")
    @PreAuthorize("@ss.hasPermi('gym:tag:match')")
    @Log(title = "标签智能匹配", businessType = BusinessType.OTHER)
    public AjaxResult getMatchedCourses(@RequestParam Long profileId,
                                       @RequestParam(defaultValue = "1") Integer week,
                                       @RequestParam(defaultValue = "20") Integer limit) {
        // 1. 参数验证
        if (profileId == null) {
            return error("学员档案ID不能为空");
        }

        // 2. 调用标签匹配服务（Redis缓存优化）
        List<GymCourseMatchDTO> matchedCourses = tagMatchService.getMatchedCourses(profileId, week);

        // 3. 分页处理
        List<GymCourseMatchDTO> pagedResults = matchedCourses.stream()
                .limit(limit)
                .collect(Collectors.toList());

        // 4. RuoYi标准返回格式
        return success(TableDataInfo.build(pagedResults, matchedCourses.size()));
    }
}
```

**方法**: GET
**路径**: /gym/tag/courses/match
**描述**: 基于RuoYi架构的3维硬匹配+软标签排序智能推荐算法

**Query Parameters**:
- `profile_id` (required): 档案ID
- `week` (optional): 周数，默认本周
- `limit` (optional): 返回数量限制，默认20
- `include_unmatched` (optional): 是否包含不匹配的课程，默认false

**RuoYi标准响应格式**：
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "total": 15,
    "rows": [
      {
        "courseId": 1,
        "courseName": "基础体操训练班",
        "levelRange": ["L1+", "L2"],
        "ageRange": "4-5",
        "gender": "both",
        "courseType": "interest",
        "waitlistCapacity": 8,
        "matchScore": 100.0,
        "validationResult": "hard_match_passed",
        "recommendationScore": 89.5,
        "hardMatchResults": {
          "levelMatch": { "score": 100, "result": "matched", "reason": "等级L2在范围内" },
          "ageMatch": { "score": 100, "result": "matched", "reason": "年龄5.2岁符合4-5岁" },
          "genderMatch": { "score": 100, "result": "matched", "reason": "性别male符合both要求" }
        },
        "softTagScores": {
          "courseTypeMatch": { "score": 95, "weight": 0.4, "reason": "类型interest高度匹配" },
          "developmentMatch": { "score": 90, "weight": 0.3, "reason": "发展标签匹配" },
          "popularityScore": { "score": 80, "weight": 0.2, "reason": "热门程度normal" }
        }
      }
    ]
  }
}
```

**Vue3前端组件设计**：
```vue
<template>
  <div class="tag-match-container">
    <!-- 学员标签信息展示 -->
    <el-card class="profile-tags-card" v-if="profileTags">
      <template #header>
        <span>学员标签信息</span>
        <el-button @click="refreshTags" size="small">刷新</el-button>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="年龄标签">{{ profileTags.ageTag }}</el-descriptions-item>
        <el-descriptions-item label="技能等级">{{ profileTags.level }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ profileTags.gender }}</el-descriptions-item>
        <el-descriptions-item label="发展方向">{{ profileTags.development }}</el-descriptions-item>
        <el-descriptions-item label="权益类型">{{ profileTags.privilege }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 匹配课程列表 -->
    <el-card class="matched-courses-card">
      <template #header>
        <span>智能推荐课程（3维硬匹配+软标签排序）</span>
        <el-tag type="success">{{ matchedCourses.length }}个匹配课程</el-tag>
      </template>

      <el-table :data="matchedCourses" style="width: 100%">
        <el-table-column prop="courseName" label="课程名称" min-width="150" />
        <el-table-column prop="matchScore" label="匹配分数" width="100">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.matchScore"
              :stroke-width="10"
              :show-text="true"
            />
          </template>
        </el-table-column>
        <el-table-column prop="recommendationScore" label="推荐指数" width="120">
          <template #default="scope">
            <el-rate
              v-model="scope.row.recommendationScore / 20"
              disabled
              show-score
            />
          </template>
        </el-table-column>
        <el-table-column prop="validationResult" label="匹配结果" width="120">
          <template #default="scope">
            <el-tag
              :type="scope.row.validationResult === 'hard_match_passed' ? 'success' : 'danger'"
            >
              {{ scope.row.validationResult === 'hard_match_passed' ? '通过' : '未通过' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button @click="showMatchDetails(scope.row)" size="small" type="primary">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 匹配详情弹窗 -->
    <el-dialog v-model="detailVisible" title="匹配详情分析" width="800px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="硬匹配结果" name="hard">
          <el-descriptions :column="1" border>
            <el-descriptions-item
              v-for="(result, key) in selectedCourse.hardMatchResults"
              :key="key"
              :label="getMatchLabel(key)"
            >
              <el-tag :type="result.result === 'matched' ? 'success' : 'danger'">
                {{ result.result === 'matched' ? '匹配' : '不匹配' }}
              </el-tag>
              <span class="ml-2">{{ result.reason }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="软标签评分" name="soft">
          <el-table :data="formatSoftScores(selectedCourse.softTagScores)" style="width: 100%">
            <el-table-column prop="name" label="评分项" />
            <el-table-column prop="score" label="分数" width="100" />
            <el-table-column prop="weight" label="权重" width="100" />
            <el-table-column prop="reason" label="说明" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMatchedCourses } from '@/api/gym/tag'
import { ElMessage } from 'element-plus'

const profileTags = ref(null)
const matchedCourses = ref([])
const detailVisible = ref(false)
const selectedCourse = ref({})
const activeTab = ref('hard')

const props = defineProps({
  profileId: {
    type: Number,
    required: true
  }
})

const loadMatchedCourses = async () => {
  try {
    const response = await getMatchedCourses({
      profileId: props.profileId,
      week: 1,
      limit: 50
    })

    if (response.code === 200) {
      matchedCourses.value = response.data.rows
    } else {
      ElMessage.error(response.msg)
    }
  } catch (error) {
    ElMessage.error('获取匹配课程失败')
  }
}

const showMatchDetails = (course) => {
  selectedCourse.value = course
  detailVisible.value = true
}

onMounted(() => {
  loadMatchedCourses()
})
</script>
```

#### POST /api/v1/courses/feedback

**方法**: POST
**路径**: /api/v1/courses/feedback
**描述**: 用户对课程推荐结果进行反馈，用于优化推荐算法

**Request**:
```json
{
  "profile_id": 1,
  "course_id": 1,
  "feedback_type": "like|dislike|not_interested",
  "reason": "课程内容很好，但时间不合适"
}
```

**Response**:
```json
{
  "code": 200,
  "message": "反馈已记录",
  "data": {
    "feedback_id": 123,
    "recorded_at": "2025-10-31T10:00:00Z"
  }
}
```

### 课程标签管理API

#### GET /api/v1/courses/{id}/tags

**方法**: GET
**路径**: /api/v1/courses/{id}/tags
**描述**: 获取课程的标签信息

**Response**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "course_id": 1,
    "level_range": ["L1+", "L2"],
    "age_range": "4-5",
    "gender": "both",
    "course_type": "interest",
    "skill_types": ["flexibility", "coordination"],
    "intensity_level": "medium",
    "main_instructor": "张教练",
    "has_assistant": true,
    "popularity": "normal"
  }
}
```

#### PUT /api/v1/courses/{id}/tags

**方法**: PUT
**路径**: /api/v1/courses/{id}/tags
**描述**: 更新课程标签信息

**Request**:
```json
{
  "level_range": ["L2", "L2+"],
  "age_range": "5-6",
  "course_type": "professional",
  "skill_types": ["strength", "technique"],
  "intensity_level": "high",
  "popularity": "hot"
}
```

### 学员标签管理API

#### GET /api/v1/profiles/{id}/tags

**方法**: GET
**路径**: /api/v1/profiles/{id}/tags
**描述**: 获取学员的标签信息

**Response**:
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "profile_id": 1,
    "age_tag": "4-5",
    "level": "L2",
    "gender": "male",
    "development": "interest",
    "privilege": "new_user",
    "auto_calculated_tags": {
      "age_tag": "4-5岁",
      "age_range": "4-5",
      "active_status": "active"
    }
  }
}
```

#### PUT /api/v1/profiles/{id}/tags

**方法**: PUT
**路径**: /api/v1/profiles/{id}/tags
**描述**: 更新学员标签信息

**Request**:
```json
{
  "development": "professional",
  "privilege": "old_user"
}
```

---

## 数据验证规则

### 输入验证

#### 课程标签验证
- **level_range**：必须是有效的等级格式
- **age_range**：必须是预定义的年龄范围
- **gender**：只能是male、female、both之一
- **course_type**：必须是预定义的课程类型之一
- **skill_types**：必须是预定义的技能类型数组

#### 学员标签验证
- **development**：必须是预定义的发展标签之一
- **privilege**：根据学员状态自动计算，不允许手动修改

### 业务验证

#### 标签匹配验证
- **年龄匹配**：学员年龄必须在课程年龄范围内
- **等级匹配**：学员等级必须包含在课程等级范围内
- **性别匹配**：学员性别必须符合课程性别要求
- **跨级匹配**：正确处理L1+、L2+等跨级标签

#### 数据完整性验证
- **必需字段**：确保所有必需字段都有值
- **外键约束**：确保引用的数据完整性
- **枚举值**：确保枚举值在预定义范围内

---

## 性能优化策略

### 数据库优化

#### 索引设计
- **course_tags表**：
  - 主键索引：`id`
  - 外键索引：`course_id`
  - 业务索引：`course_type`、`age_range`、`gender`
  - 复合索引：`(course_type, age_range)`、`(course_type, gender)`

- **tag_match_log表**：
  - 主键索引：`id`
  - 外键索引：`profile_id`、`course_id`
  - 查询索引：`created_at`、`is_matched`
  - 复合索引：`(profile_id, created_at)`

#### 查询优化
- 使用EXISTS子查询替代JOIN操作
- 合理使用LIMIT限制结果集
- 避免全表扫描操作

### 缓存策略

#### Redis缓存
- **用户标签缓存**：缓存学员标签信息30分钟
- **课程标签缓存**：缓存课程标签信息1小时
- **匹配结果缓存**：缓存匹配结果15分钟

#### 缓存键设计
```
user:{profile_id}:tags          # 用户标签缓存
course:{course_id}:tags        # 课程标签缓存
match:{profile_id}:{week}     # 匹配结果缓存
```

### 算法优化

#### 匹配算法优化
- **早期过滤**：先进行基础匹配，减少后续计算
- **权重计算**：使用预计算的权重值
- **批量处理**：支持批量匹配计算

#### 排序优化
- **预排序**：热门课程优先展示
- **动态权重**：根据反馈动态调整权重
- **分页加载**：避免一次性加载大量数据

---

## RuoYi-Vue-Pro测试策略

### RuoYi单元测试（JUnit 5 + Mockito）

#### RuoYi标签匹配Service测试
```java
@SpringBootTest
@ActiveProfiles("test")
class GymTagMatchServiceImplTest {

    @Autowired
    private IGymTagMatchService tagMatchService;

    @MockBean
    private IGymCourseTagsService courseTagsService;

    @MockBean
    private IGymStudentProfileService studentProfileService;

    @Test
    @DisplayName("3维硬匹配 - 等级匹配测试")
    void testLevelMatching() {
        // given
        GymStudentProfile profile = new GymStudentProfile();
        profile.setLevel("L2");
        profile.setAgeRange("4-5");
        profile.setGender("male");

        GymCourseTags courseTag = new GymCourseTags();
        courseTag.setLevelRange("[\"L1+\", \"L2\"]");
        courseTag.setAgeRange("4-5");
        courseTag.setGender("both");

        when(studentProfileService.getById(1L)).thenReturn(profile);
        when(courseTagsService.list(any())).thenReturn(List.of(courseTag));

        // when
        List<GymCourseMatchDTO> result = tagMatchService.getMatchedCourses(1L, 1);

        // then
        assertThat(result).isNotEmpty();
        assertThat(result.get(0).getMatchScore()).isEqualTo(100.0);
    }

    @Test
    @DisplayName("3维硬匹配 - 年龄匹配测试")
    void testAgeMatching() {
        // given
        GymStudentProfile profile = new GymStudentProfile();
        profile.setBirthday(LocalDate.of(2019, 6, 15)); // 5.2岁
        profile.setLevel("L2");
        profile.setGender("male");

        // when & then
        assertThat(calculateAgeRange(5.2)).isEqualTo("4-5");
        assertThat(calculateAgeRange(6.1)).isEqualTo("6+");
        assertThat(calculateAgeRange(3.8)).isEqualTo("3-4");
    }
}
```

#### RuoYi数据模型测试
```java
@SpringBootTest
class GymCourseTagsTest {

    @Test
    @DisplayName("课程标签实体创建测试")
    void testCourseTagsCreation() {
        // given
        GymCourseTags courseTag = new GymCourseTags();
        courseTag.setCourseId(1L);
        courseTag.setLevelRange("[\"L1+\", \"L2\"]");
        courseTag.setCourseType("interest");

        // when & then
        assertThat(courseTag.getLevelRange()).isEqualTo("[\"L1+\", \"L2\"]");
        assertThat(courseTag.getCourseType()).isEqualTo("interest");
        assertThat(courseTag.getVersion()).isEqualTo(0); // @Version默认值
    }
}
```

### 集成测试

#### API测试
```python
def test_courses_match_api():
    # 测试课程匹配API
    response = client.get("/api/v1/courses/match", params={
        "profile_id": 1,
        "week": 1
    })
    assert response.status_code == 200
    assert "matched_courses" in response.json()["data"]
    assert "profile_tags" in response.json()["data"]

def test_course_tags_api():
    # 测试课程标签API
    response = client.get("/api/v1/courses/1/tags")
    assert response.status_code == 200
    assert "level_range" in response.json()["data"]
```

### 性能测试

#### 匹配性能测试
```python
def test_matching_performance():
    # 测试匹配算法性能
    import time
    start_time = time.time()

    # 模拟1000次匹配计算
    for i in range(1000):
        match_courses(profile_id=i, week=1)

    end_time = time.time()
    avg_time = (end_time - start_time) / 1000

    # 平均匹配时间应小于50ms
    assert avg_time < 0.05
```

---

## 部署和监控

### 数据库迁移

#### 迁移脚本
```sql
-- 创建标签系统表
-- 执行course_tags和tag_match_log表的创建脚本

-- 初始化标签数据
UPDATE profile SET
  development = CASE
    WHEN level <= 'L2' THEN 'interest'
    WHEN level BETWEEN 'L3' AND 'L4' THEN 'professional'
    WHEN level >= 'L5' THEN 'competition'
    ELSE 'interest'
  END,
  privilege = CASE
    WHEN created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'old_user'
    ELSE 'new_user'
  END;
```

### 监控指标

#### 业务指标
- **匹配准确率**：用户对推荐结果的满意度
- **点击转化率**：推荐课程的点击率
- **预约转化率**：推荐课程的预约成功率
- **用户活跃度**：使用标签功能的用户活跃度

#### 技术指标
- **API响应时间**：标签匹配API的响应时间
- **数据库查询性能**：标签查询的执行时间
- **缓存命中率**：Redis缓存的命中率
- **算法准确性**：匹配算法的准确率

### 日志记录

#### 匹配日志
```json
{
  "timestamp": "2025-10-31T10:00:00Z",
  "profile_id": 1,
  "course_id": 1,
  "action": "tag_matching",
  "algorithm_version": "v1.0",
  "performance": {
    "execution_time_ms": 45,
    "cache_hit": false
  },
  "result": {
    "matched": true,
    "score": 95.5,
    "match_details": {...}
  }
}
```

#### 用户行为日志
```json
{
  "timestamp": "2025-10-31T10:05:00Z",
  "user_id": 1,
  "profile_id": 1,
  "action": "view_matched_courses",
  "context": {
    "filter_applied": false,
    "total_courses": 15,
    "matched_courses": 8
  }
}
```

---

## 未来扩展计划

### 短期扩展（3个月内）

#### 1. 机器学习推荐
- **协同过滤**：基于用户行为的推荐
- **内容推荐**：基于课程内容的推荐
- **混合推荐**：结合标签和机器学习的推荐

#### 2. 实时推荐
- **WebSocket推送**：实时推荐更新
- **动态调整**：基于用户行为实时调整推荐
- **A/B测试**：推荐算法的A/B测试

#### 3. 社交推荐
- **好友推荐**：基于好友关系的推荐
- **群体推荐**：基于相似群体的推荐
- **专家推荐**：基于专家评分的推荐

### 中期扩展（6个月内）

#### 1. 多维度标签
- **时间标签**：上课时间偏好
- **地点标签**：上课地点偏好
- **价格标签**：价格敏感度标签
- **教练标签**：教练偏好标签

#### 2. 智能分析
- **学习路径分析**：基于历史数据的学习路径推荐
- **技能评估**：基于表现数据的技能水平评估
- **成长预测**：学员成长潜力预测

#### 3. 个性化定制
- **自定义权重**：用户可调整推荐权重
- **个性化界面**：基于用户偏好的界面定制
- **智能提醒**：个性化的课程提醒

### 长期扩展（1年内）

#### 1. AI驱动推荐
- **深度学习模型**：基于深度学习的推荐算法
- **自然语言处理**：基于用户评论的情感分析
- **图像识别**：基于训练视频的技术分析

#### 2. 全场景推荐
- **跨平台推荐**：整合多平台数据
- **全生命周期推荐**：从入门到精通的完整推荐
- **社区推荐**：基于社区数据的推荐

---

## 附录

### 标签枚举值定义

#### 发展标签枚举
```python
DEVELOPMENT_TAGS = {
    'interest': {
        'name': '兴趣班',
        'description': '培养体操兴趣',
        'priority': 1
    },
    'professional': {
        'name': '专业班',
        'description': '专业技能提升',
        'priority': 2
    },
    'competition': {
        'name': '竞赛班',
        'description': '竞技训练',
        'priority': 3
    },
    'long_term': {
        'name': '长训班',
        'description': '长期培养',
        'priority': 4
    }
}
```

#### 权益标签枚举
```python
PRIVILEGE_TAGS = {
    'old_user': {
        'name': '老用户',
        'description': '有消费记录的用户',
        'benefits': ['课程优惠', '优先预约']
    },
    'new_user': {
        'name': '新用户',
        'description': '首次注册的用户',
        'benefits': ['体验优惠', '引导服务']
    },
    'friend_discount': {
        'name': '亲友权益',
        'description': '推荐用户',
        'benefits': ['推荐奖励', '亲友优惠']
    }
}
```

### 错误代码定义

#### 标签系统错误代码
- **TAG_001**: 标签格式错误
- **TAG_002**: 标签匹配失败
- **TAG_003**: 标签数据不一致
- **TAG_004**: 标签算法异常
- **TAG_005**: 标签缓存异常

#### HTTP状态码映射
```python
TAG_ERROR_CODES = {
    400: 'TAG_001',  # 请求参数错误
    404: 'TAG_002',  # 资源不存在
    422: 'TAG_003',  # 数据验证失败
    500: 'TAG_004',  # 服务器内部错误
    503: 'TAG_005'   # 服务不可用
}
```

### RuoYi错误代码定义

#### RuoYi标签系统错误代码
- **TAG_001**: 标签格式错误
- **TAG_002**: 3维硬匹配失败
- **TAG_003**: MyBatis-Plus数据不一致
- **TAG_004**: 标签算法异常
- **TAG_005**: Redis缓存异常

#### RuoYi HTTP状态码映射
```java
public enum TagErrorCode {
    TAG_001(400, "标签格式错误"),
    TAG_002(404, "3维硬匹配失败"),
    TAG_003(422, "数据验证失败"),
    TAG_004(500, "服务器内部错误"),
    TAG_005(503, "服务不可用");
}
```

---

## RuoYi架构成功指标

### 技术性能指标（基于RuoYi架构优化）
- [ ] SC-001: 3维硬匹配准确率100%（MyBatis- + Redis）
- [ ] SC-002: 标签匹配API响应时间<100ms（@Cacheable优化）
- [ ] SC-003: 软标签排序算法准确性>95%（推荐引擎优化）
- [ ] SC-004: Redis缓存命中率>90%（Spring Cache配置）
- [ ] SC-005: RuoYi审计日志完整性100%（@Log注解覆盖）

### RuoYi架构质量指标
- [ ] SC-006: MyBatis-Plus LambdaQueryWrapper使用率100%
- [ ] SC-007: Spring @Cacheable缓存策略正确率100%
- [ ] SC-008: RuoYi统一响应格式AjaxResult使用率100%
- [ ] SC-009: Vue3 Composition API组件覆盖率100%
- [ ] SC-010: Spring Security权限控制准确率100%
- [ ] SC-011: JUnit 5 + Mockito测试覆盖率>90%

### 企业级特性指标
- [ ] SC-012: RuoYi数据权限控制准确性100%（@DataScope）
- [ ] SC-013: MyBatis-Plus乐观锁并发控制100%有效
- [ ] SC-014: Spring @Scheduled定时任务可靠性100%
- [ ] SC-015: RuoYi代码生成器标准覆盖率100%
- [ ] SC-016: Spring Boot Actuator健康检查100%通过
- [ ] SC-017: RuoYi多数据源配置正确性100%

---

**文档版本**: v2.0.0 RuoYi架构重构
**创建日期**: 2025-10-31
**重构日期**: 2025-11-17
**技术栈**: RuoYi-Vue-Pro + MyBatis-Plus + Redis + Vue3
**最后更新**: 2025-11-17
**架构师**: AI Claude - RuoYi企业级架构重构

---

*本文档基于RuoYi-Vue-Pro企业级架构重构的标签系统设计参考，具体实现请参照MVP-2A规格文档和MVP-5运营后台规格文档。所有代码示例均遵循RuoYi开发规范和企业级最佳实践。*
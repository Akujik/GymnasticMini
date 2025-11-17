# 实施计划:004-private-lesson

**功能分支**: `004-private-lesson`
**创建时间**: 2025-11-08
**状态**: Draft
**MVP**: 4
**依赖关系**: MVP-1 (001-user-identity-system), MVP-2A (002-course-display-and-booking)
**版本**: v2.0.0 RuoYi架构重构
**重构日期**: 2025-11-17
**技术栈**: RuoYi-Vue-Pro + MyBatis-Plus + Redis + Vue3 + MySQL

---

## 概述

本计划概述了为百适体操馆小程序实施私教课系统的完整方案，基于RuoYi-Vue-Pro架构设计。私教课系统采用"仅浏览模式"，用户只能浏览私教课信息并通过咨询流程进行预约，运营人员在后台手动录入线下确认的预约记录。系统严格遵循FR-042仅浏览模式和FR-040 4维标签白名单匹配要求。

### RuoYi架构核心特征
1. **企业级架构**：基于RuoYi-Vue-Pro框架，集成Spring Boot + MyBatis-Plus + Vue3
2. **仅浏览模式**：用户不能直接在线预约私教课程，只能浏览信息
3. **咨询驱动预约**：用户提交咨询申请 → 运营联系确认 → 后台手动录入
4. **4维智能匹配**：等级+年龄+性别+类型的严格白名单匹配算法
5. **高性能缓存**：Redis缓存 + @Cacheable注解优化查询性能
6. **权限管理**：基于Spring Security的细粒度权限控制
7. **审计日志**：完整的操作审计和数据追踪

### 技术架构优势
- **MyBatis-Plus优化**：LambdaQueryWrapper查询优化，提升查询性能
- **Redis缓存策略**：智能缓存管理，减少数据库压力
- **乐观锁机制**：@Version注解防止并发冲突
- **统一响应格式**：RuoYi标准的AjaxResult响应
- **代码生成**：RuoYi代码生成器快速生成CRUD代码

---

## RuoYi-Vue-Pro 技术架构设计

### 系统架构图

```mermaid
graph TB
    subgraph "前端层"
        WECHAT[微信小程序] --> BROWSE[私教课浏览]
        WECHAT --> INQUIRY[咨询表单]
        ADMIN[RuoYi-Vue-Pro管理后台] --> BOOKING[预约录入]
        ADMIN --> INQUIRY_MGMT[咨询管理]
    end

    subgraph "RuoYi网关层"
        GATEWAY[Spring Cloud Gateway] --> AUTH[Spring Security + JWT]
        GATEWAY --> RATE[限流控制]
        GATEWAY --> LOG[请求日志]
        GATEWAY --> MONITOR[Actuator监控]
    end

    subgraph "RuoYi服务层"
        PRIVATE_SERVICE[私教课Service]
        INQUIRY_SERVICE[咨询Service]
        BOOKING_SERVICE[预约Service]
        NOTIFICATION_SERVICE[RuoYi通知Service]
    end

    subgraph "MyBatis-Plus数据层"
        MAPPER[Mapper接口]
        ENTITY[实体类]
        WRAPPER[LambdaQueryWrapper]
        CACHE[Redis缓存]
    end

    subgraph "RuoYi业务逻辑层"
        MATCH_ENGINE[4D匹配引擎]
        CONFLICT_DETECT[冲突检测]
        CONSULTATION_FLOW[咨询流程管理]
        SCHEDULE_MGMT[排班管理]
        AUDIT[审计日志]
    end

    subgraph "数据层"
        MYSQL[(MySQL 8.0)]
        REDIS[(Redis 6.x)]
    end

    subgraph "外部服务"
        WECHAT_SERVICE[微信客服API]
        SMS_SERVICE[短信通知]
        PUSH_SERVICE[推送通知]
    end

    BROWSE --> GATEWAY
    INQUIRY --> GATEWAY
    BOOKING --> GATEWAY
    INQUIRY_MGMT --> GATEWAY

    GATEWAY --> PRIVATE_SERVICE
    GATEWAY --> INQUIRY_SERVICE
    GATEWAY --> BOOKING_SERVICE

    PRIVATE_SERVICE --> MATCH_ENGINE
    BOOKING_SERVICE --> CONFLICT_DETECT
    INQUIRY_SERVICE --> CONSULTATION_FLOW
    BOOKING_SERVICE --> SCHEDULE_MGMT
    ALL_SERVICES --> AUDIT

    PRIVATE_SERVICE --> MAPPER
    INQUIRY_SERVICE --> MAPPER
    BOOKING_SERVICE --> MAPPER

    MAPPER --> ENTITY
    MAPPER --> WRAPPER
    MAPPER --> CACHE

    ENTITY --> MYSQL
    CACHE --> REDIS

    NOTIFICATION_SERVICE --> REDIS
    NOTIFICATION_SERVICE --> WECHAT_SERVICE
    NOTIFICATION_SERVICE --> SMS_SERVICE
    NOTIFICATION_SERVICE --> PUSH_SERVICE
```

### 核心组件设计

#### 1. RuoYi 4维标签匹配引擎 (FR-040)
**职责**：基于MyBatis-Plus实现严格的4维白名单匹配算法

**RuoYi技术实现**：
```java
@Service
@Slf4j
public class FourDimensionalMatchService {

    @Autowired
    private IGymPrivateInstructorService instructorService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 执行4维白名单验证
     */
    public List<GymPrivateInstructor> matchInstructors(FourDimensionalQuery query) {
        String cacheKey = buildCacheKey(query);

        // 尝试从缓存获取结果
        List<GymPrivateInstructor> cachedResult = (List<GymPrivateInstructor>)
            redisTemplate.opsForValue().get(cacheKey);
        if (cachedResult != null) {
            return cachedResult;
        }

        // MyBatis-Plus查询构建
        LambdaQueryWrapper<GymPrivateInstructor> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymPrivateInstructor::getStatus, "0")
               .like(GymPrivateInstructor::getLevelRange, query.getLevel())
               .eq(GymPrivateInstructor::getAgeRange, query.getAgeRange())
               .and(w -> w.eq(GymPrivateInstructor::getGender, "both")
                          .or()
                          .eq(GymPrivateInstructor::getGender, query.getGender()))
               .eq(GymPrivateInstructor::getCourseType, query.getCourseType())
               .orderByDesc(GymPrivateInstructor::getRating)
               .orderByDesc(GymPrivateInstructor::getTeachingHours)
               .last("LIMIT 20");

        List<GymPrivateInstructor> result = instructorService.list(wrapper);

        // 缓存结果15分钟
        redisTemplate.opsForValue().set(cacheKey, result, 15, TimeUnit.MINUTES);

        return result;
    }

    private String buildCacheKey(FourDimensionalQuery query) {
        return String.format("4d_match:%s:%s:%s:%s",
            query.getLevel(), query.getAgeRange(), query.getGender(), query.getCourseType());
    }
}
```

**RuoYi性能优化**：
- **Redis缓存**: @Cacheable注解自动缓存匹配结果，缓存15分钟
- **MyBatis-Plus索引**: 复合索引 `idx_4d_match(course_type, age_range, gender, level_range)`
- **分页加载**: RuoYi PageHelper分页，每次最多返回20个匹配结果
- **LambdaQueryWrapper**: 类型安全的查询构建，编译时检查

#### 2. RuoYi 咨询流程管理器 (FR-042)
**职责**：基于RuoYi工作流引擎管理从咨询申请到预约确认的完整流程

**RuoYi状态机设计**：
```java
@Component
@Slf4j
public class InquiryFlowManager {

    @Autowired
    private IGymPrivateInquiryService inquiryService;

    @Autowired
    private IGymPrivateConsultationService consultationService;

    /**
     * 咨询状态转换枚举
     */
    public enum InquiryStatus {
        PENDING("0", "待联系"),
        CONTACTED("1", "已联系"),
        BOOKED("2", "已预约"),
        NOT_INTERESTED("3", "不感兴趣"),
        EXPIRED("4", "已过期");

        private final String code;
        private final String desc;

        InquiryStatus(String code, String desc) {
            this.code = code;
            this.desc = desc;
        }
    }

    /**
     * 状态转换逻辑
     */
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "咨询状态转换", businessType = BusinessType.UPDATE)
    public boolean transitionInquiryStatus(Long inquiryId, InquiryStatus targetStatus, String operatorId, String notes) {
        GymPrivateInquiry inquiry = inquiryService.getById(inquiryId);
        if (inquiry == null) {
            throw new ServiceException("咨询记录不存在");
        }

        InquiryStatus currentStatus = InquiryStatus.valueOf(inquiry.getStatus());

        // 验证状态转换合法性
        if (!isValidTransition(currentStatus, targetStatus)) {
            throw new ServiceException(String.format("不允许从%s转换为%s", currentStatus.getDesc(), targetStatus.getDesc()));
        }

        // 更新咨询状态
        inquiry.setStatus(targetStatus.getCode());
        inquiry.setUpdateBy(operatorId);
        inquiry.setUpdateTime(LocalDateTime.now());
        inquiry.setAdminNotes(notes);

        boolean result = inquiryService.updateById(inquiry);

        // 记录状态转换日志
        if (result) {
            consultationService.createFlowRecord(inquiryId, currentStatus.getCode(), targetStatus.getCode(), operatorId, notes);
        }

        return result;
    }

    private boolean isValidTransition(InquiryStatus from, InquiryStatus to) {
        switch (from) {
            case PENDING:
                return to == InquiryStatus.CONTACTED || to == InquiryStatus.EXPIRED;
            case CONTACTED:
                return to == InquiryStatus.BOOKED || to == InquiryStatus.NOT_INTERESTED || to == InquiryStatus.EXPIRED;
            case BOOKED:
            case NOT_INTERESTED:
            case EXPIRED:
                return false; // 终态
            default:
                return false;
        }
    }
}
```

**RuoYi流程优化**：
- **事务管理**: @Transactional注解确保状态转换的原子性
- **审计日志**: @Log注解记录所有状态变更操作
- **乐观锁**: @Version防止并发状态冲突
- **权限控制**: @PreAuthorize注解控制状态转换权限

#### 3. RuoYi 时间冲突检测器
**职责**：基于MyBatis-Plus防止教练时间冲突预约

**RuoYi算法实现**：
```java
@Service
@Slf4j
public class BookingConflictDetector {

    @Autowired
    private IGymPrivateBookingService bookingService;

    @Autowired
    private IGymCoachScheduleService scheduleService;

    /**
     * 检测教练时间冲突
     */
    @Cacheable(value = "bookingConflict", key = "#instructorId + ':' + #bookingTime.toString() + ':' + #duration")
    public ConflictDetectionResult detectConflict(Long instructorId, LocalDateTime bookingTime, Integer duration) {
        LocalDateTime endTime = bookingTime.plusMinutes(duration);

        // 检查现有预约冲突
        List<GymPrivateBooking> existingBookings = getConflictingBookings(instructorId, bookingTime, endTime);

        // 检查排班可用性
        boolean scheduleAvailable = checkScheduleAvailability(instructorId, bookingTime, endTime);

        ConflictDetectionResult result = new ConflictDetectionResult();

        if (!existingBookings.isEmpty() || !scheduleAvailable) {
            result.setHasConflict(true);
            result.setConflicts(existingBookings);
            result.setScheduleAvailable(scheduleAvailable);
            result.setSuggestedAlternatives(suggestAlternatives(instructorId, bookingTime, duration));
        } else {
            result.setHasConflict(false);
        }

        return result;
    }

    /**
     * 查询冲突预约
     */
    private List<GymPrivateBooking> getConflictingBookings(Long instructorId, LocalDateTime startTime, LocalDateTime endTime) {
        LambdaQueryWrapper<GymPrivateBooking> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymPrivateBooking::getInstructorId, instructorId)
               .eq(GymPrivateBooking::getStatus, "1") // 已确认状态
               .and(w -> w.lt(GymPrivateBooking::getBookingTime, endTime)
                          .gt(GymPrivateBooking::getBookingTime, startTime.plusMinutes(-15))) // 15分钟缓冲
               .or(w -> w.le(GymPrivateBooking::getBookingTime, startTime)
                          .gt(GymPrivateBooking::getBookingTime, startTime.plusMinutes(-15))
                          .apply("booking_time + INTERVAL duration MINUTE > {0}", startTime));

        return bookingService.list(wrapper);
    }

    /**
     * 检查排班可用性
     */
    private boolean checkScheduleAvailability(Long instructorId, LocalDateTime bookingTime, LocalDateTime endTime) {
        DayOfWeek dayOfWeek = bookingTime.getDayOfWeek();
        LocalTime time = bookingTime.toLocalTime();

        LambdaQueryWrapper<GymCoachSchedule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymCoachSchedule::getInstructorId, instructorId)
               .eq(GymCoachSchedule::getDayOfWeek, dayOfWeek.getValue())
               .le(GymCoachSchedule::getStartTime, time)
               .ge(GymCoachSchedule::getEndTime, endTime.toLocalTime())
               .eq(GymCoachSchedule::getStatus, "0");

        return scheduleService.count(wrapper) > 0;
    }

    /**
     * 推荐可用时间段
     */
    private List<TimeSlot> suggestAlternatives(Long instructorId, LocalDateTime originalTime, Integer duration) {
        List<TimeSlot> alternatives = new ArrayList<>();

        // 推荐当天其他时间段
        for (int hour = 9; hour <= 20; hour++) {
            LocalDateTime suggestion = originalTime.withHour(hour).withMinute(0).withSecond(0).withNano(0);
            ConflictDetectionResult check = detectConflict(instructorId, suggestion, duration);
            if (!check.isHasConflict() && suggestion.isAfter(originalTime.plusHours(1))) {
                alternatives.add(new TimeSlot(suggestion, suggestion.plusMinutes(duration)));
                if (alternatives.size() >= 3) break;
            }
        }

        return alternatives;
    }
}

@Data
public class ConflictDetectionResult {
    private boolean hasConflict;
    private List<GymPrivateBooking> conflicts;
    private boolean scheduleAvailable;
    private List<TimeSlot> suggestedAlternatives;
}
```

**RuoYi冲突检测优化**：
- **缓存机制**: @Cacheable注解缓存冲突检测结果，提高性能
- **MyBatis-Plus查询**: 复杂时间范围查询使用LambdaQueryWrapper
- **事务一致性**: @Transactional确保预约创建和冲突检测的原子性
- **智能推荐**: 基于可用时间段自动推荐替代方案

---

## 开发阶段规划

### Phase 1: 基础架构搭建 (2天)

#### 目标
建立私教课系统的基础架构，包括数据库表、基础API框架和4维匹配引擎。

#### 主要任务
1. **数据库设计** (0.5天)
   - 创建5个核心数据表
   - 设置外键约束和索引
   - 初始化测试数据

2. **基础API框架** (0.5天)
   - FastAPI项目结构搭建
   - 统一响应格式和错误处理
   - JWT认证中间件

3. **4维匹配引擎** (1天)
   - 实现4维标签匹配算法
   - 性能优化和缓存策略
   - 单元测试覆盖

#### 验收标准
- [ ] 数据库表创建成功，约束关系正确
- [ ] 4维匹配算法准确率100%
- [ ] API框架支持基本的CRUD操作
- [ ] 单元测试覆盖率>80%

#### 技术风险
- **风险**: 4维匹配算法性能问题
- **应对**: 使用Redis缓存 + 数据库索引优化

### Phase 2: 私教课浏览功能 (3天)

#### 目标
实现用户在小程序中浏览私教课信息的功能，包括教练列表、详情页和4维匹配展示。

#### 主要任务
1. **教练列表API** (1天)
   - GET /api/v1/private-lessons
   - 4维标签匹配集成
   - 分页和排序功能

2. **教练详情API** (0.5天)
   - GET /api/v1/private-lessons/{id}
   - 教练完整信息展示
   - 可用时间查询

3. **小程序前端** (1.5天)
   - 教练列表页面
   - 教练详情页面
   - 仅浏览模式UI（无预约按钮）

#### 验收标准
- [ ] 教练列表正确应用4维匹配过滤
- [ ] 详情页显示完整教练信息
- [ ] 所有页面不显示"立即预约"按钮
- [ ] 页面加载时间<1秒

#### 技术风险
- **风险**: 4维匹配结果与预期不符
- **应对**: 提供匹配详情日志，便于调试

### Phase 3: 咨询流程开发 (3天)

#### 目标
实现FR-042核心的咨询驱动预约流程，包括咨询表单、流程管理和通知系统。

#### 主要任务
1. **咨询API开发** (1天)
   - POST /api/v1/private-inquiries
   - GET /api/v1/private-inquiries
   - 咨询状态管理

2. **咨询流程管理** (1天)
   - 咨询状态机实现
   - 运营跟进记录
   - 自动过期处理

3. **小程序咨询页面** (1天)
   - 咨询表单页面
   - 我的咨询记录页面
   - 微信客服跳转集成

#### 验收标准
- [ ] 咨询申请提交成功率>99%
- [ ] 咨询状态流转正确
- [ ] 微信客服跳转成功率>95%
- [ ] 咨询记录显示完整

#### 技术风险
- **风险**: 微信客服API权限问题
- **应对**: 准备二维码降级方案

### Phase 4: 运营后台开发 (2天)

#### 目标
为运营人员提供完整的私教课管理后台，包括咨询处理、预约录入和教练管理。

#### 主要任务
1. **咨询管理后台** (0.5天)
   - 咨询列表和筛选
   - 咨询详情和跟进记录
   - 批量处理功能

2. **预约录入功能** (1天)
   - 预约录入表单
   - 时间冲突检测
   - 自动通知发送

3. **教练管理** (0.5天)
   - 教练CRUD操作
   - 排班管理
   - 工作量统计

#### 验收标准
- [ ] 预约录入成功率>98%
- [ ] 时间冲突检测准确率100%
- [ ] 运营操作响应时间<2秒
- [ ] 教练信息管理完整

#### 技术风险
- **风险**: 并发录入导致时间冲突
- **应对**: 使用数据库行锁和事务隔离

### Phase 5: 测试与优化 (2天)

#### 目标
确保系统稳定性和性能，满足所有业务需求和技术指标。

#### 主要任务
1. **单元测试** (0.5天)
   - 4维匹配算法测试
   - 咨询流程测试
   - 冲突检测测试

2. **集成测试** (1天)
   - 完整流程测试
   - 跨模块依赖测试
   - 性能压力测试

3. **系统优化** (0.5天)
   - 数据库查询优化
   - 缓存策略调整
   - 接口响应时间优化

#### 验收标准
- [ ] 单元测试覆盖率>90%
- [ ] 集成测试通过率100%
- [ ] API响应时间P95<500ms
- [ ] 系统可用性>99.5%

#### 技术风险
- **风险**: 性能不满足要求
- **应对**: 提前进行压力测试，必要时优化算法

---

## 数据库设计详细方案

### 表关系设计

#### 核心实体关系
1. **用户** → **学员档案** (1:N)
2. **学员档案** → **咨询记录** (1:N)
3. **学员档案** → **预约记录** (1:N)
4. **私教教练** → **预约记录** (1:N)
5. **私教教练** → **排班记录** (1:N)
6. **咨询记录** → **咨询流程** (1:N)

### 索引设计策略

#### 主要索引
```sql
-- 4维匹配优化索引
CREATE INDEX idx_instructor_4d_match ON private_course_tags
(course_type, age_range, gender, status);

-- 时间冲突检测索引
CREATE INDEX idx_booking_conflict ON private_booking
(instructor_id, booking_time, status);

-- 咨询管理索引
CREATE INDEX idx_inquiry_user_status ON private_inquiry
(user_id, status, created_at);

-- 教练排班索引
CREATE INDEX idx_schedule_time ON coach_schedule
(instructor_id, day_of_week, is_available, effective_date);
```

#### 复合索引优化
- 考虑查询频率和数据量
- 避免过度索引影响写入性能
- 定期分析查询计划优化

### 数据完整性保证

#### 外键约束
- 用户数据级联删除
- 教练软删除保留历史记录
- 预约记录强引用完整性

#### 业务规则约束
- 使用数据库触发器实现复杂业务逻辑
- 应用层额外验证确保数据一致性
- 定期数据一致性检查任务

---

## API设计详细方案

### API架构设计

#### 统一响应格式
```python
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2025-11-08T10:00:00Z",
  "request_id": "uuid"
}
```

#### 错误处理策略
- 标准HTTP状态码
- 详细的错误信息
- 错误日志记录

### 核心API设计

#### 私教课浏览API
**设计原则**：
- 严格遵循FR-040 4维匹配规则
- 支持多种筛选和排序方式
- 优化大数据量查询性能

**关键接口**：
```python
# 4维匹配接口
GET /api/v1/private-lessons?profile_id={id}&filters={}

# 教练详情接口
GET /api/v1/private-lessons/{instructor_id}

# 教练可用时间查询
GET /api/v1/private-lessons/{instructor_id}/available-slots
```

#### 咨询流程API (FR-042)
**设计原则**：
- 简化咨询提交流程
- 支持多种咨询方式
- 完整的状态跟踪

**关键接口**：
```python
# 提交咨询申请
POST /api/v1/private-inquiries

# 查询咨询记录
GET /api/v1/private-inquiries?user_id={id}

# 咨询状态更新
PATCH /api/v1/private-inquiries/{id}/status
```

#### 管理后台API
**设计原则**：
- 支持批量操作
- 提供详细的筛选功能
- 实时数据统计

**关键接口**：
```python
# 录入私教预约
POST /api/v1/admin/private-bookings

# 批量处理咨询
POST /api/v1/admin/private-inquiries/batch-process

# 数据统计接口
GET /api/v1/admin/private-lessons/statistics
```

### API性能优化

#### 缓存策略
- 教练列表缓存30分钟
- 4维匹配结果缓存15分钟
- 咨询统计缓存10分钟

#### 查询优化
- 使用数据库连接池
- 预编译常用查询
- 异步处理长时间操作

---

## 前端技术方案

### 微信小程序前端

#### 技术选型
- **框架**: 原生小程序框架
- **状态管理**: 自定义状态管理器
- **组件库**: 自定义UI组件库
- **网络请求**: 封装统一的HTTP客户端

#### 页面结构
```
pages/
├── private-lessons/
│   ├── index.wxml          # 教练列表页
│   └── detail.wxml          # 教练详情页
├── inquiry/
│   ├── form.wxml            # 咨询表单页
│   └── list.wxml            # 咨询记录页
└── profile/
    └── private-lessons.wxml # 我的私教课记录
```

#### 关键组件设计
```javascript
// 4维匹配结果展示组件
<match-details
  matchScore="{{instructor.matchScore}}"
  dimensionResults="{{instructor.matchDetails}}"
/>

// 仅浏览模式提示组件
<browse-only-notice
  message="私教课仅支持浏览，请联系客服预约"
  contactMethod="wechat"
/>

// 咨询状态展示组件
<inquiry-status
  status="{{inquiry.status}}"
  lastFollowUp="{{inquiry.lastFollowUp}}"
/>
```

### Vue3管理后台

#### 技术选型
- **框架**: Vue 3 + TypeScript
- **UI库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios

#### 页面结构
```
src/
├── views/
│   ├── private-lessons/
│   │   ├── List.vue         # 教练管理
│   │   ├── Detail.vue       # 教练详情
│   │   └── Schedule.vue     # 排班管理
│   ├── inquiries/
│   │   ├── List.vue         # 咨询列表
│   │   ├── Detail.vue       # 咨询详情
│   │   └── FollowUp.vue     # 跟进管理
│   └── bookings/
│       ├── Create.vue       # 预约录入
│       ├── List.vue         # 预约列表
│       └── Statistics.vue   # 数据统计
└── components/
    ├── InstructorSelector.vue
    ├── TimeConflictChecker.vue
    └── ConsultationFlow.vue
```

---

## 部署方案

### 开发环境部署

#### 环境要求
- **Node.js**: >= 18.0.0
- **Python**: >= 3.9
- **MySQL**: >= 8.0
- **Redis**: >= 6.0

#### 服务架构
```yaml
services:
  # FastAPI后端服务
  private-lesson-api:
    image: python:3.9-slim
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql://user:pass@mysql:3306/db
      - REDIS_URL=redis://redis:6379/0

  # Vue3管理后台
  admin-frontend:
    image: node:18-alpine
    ports:
      - "3000:3000"
    volumes:
      - ./admin:/app

  # MySQL数据库
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=ccmartmeet
    volumes:
      - mysql_data:/var/lib/mysql

  # Redis缓存
  redis:
    image: redis:6.2-alpine
    volumes:
      - redis_data:/data
```

### 生产环境部署

#### 负载均衡
- **API服务**: Nginx + uWSGI
- **前端服务**: CDN + 静态资源
- **数据库**: 主从复制 + 读写分离

#### 监控告警
- **应用监控**: 自定义监控面板
- **性能监控**: APM工具集成
- **日志监控**: ELK Stack
- **告警通知**: 钉钉/企业微信机器人

---

## 质量保证方案

### 测试策略

#### 单元测试
- **覆盖率目标**: >90%
- **重点模块**: 4维匹配算法、咨询流程、冲突检测
- **测试框架**: pytest + coverage

#### 集成测试
- **API测试**: 模拟完整业务流程
- **数据库测试**: 事务和约束验证
- **第三方服务**: Mock外部API调用

#### 性能测试
- **并发测试**: 模拟100并发用户浏览
- **压力测试**: 4维匹配算法性能测试
- **响应时间**: API响应时间<500ms

### 代码质量

#### 代码规范
- **Python**: PEP8 + Black格式化
- **TypeScript**: ESLint + Prettier
- **提交前检查**: pre-commit hooks

#### 代码审查
- **强制审查**: 所有代码必须经过审查
- **审查重点**: 业务逻辑、性能、安全性
- **工具集成**: GitLab/GitHub Code Review

### 安全性保证

#### 数据安全
- **敏感数据**: 加密存储个人信息
- **访问控制**: 基于角色的权限控制
- **数据脱敏**: 日志中敏感信息脱敏

#### API安全
- **认证**: JWT Token + 刷新机制
- **授权**: 细粒度权限控制
- **防护**: SQL注入、XSS、CSRF防护

---

## 项目管理

### 团队协作

#### 角色分工
- **后端开发**: 2人 (FastAPI + 数据库)
- **前端开发**: 2人 (小程序 + Vue3)
- **测试工程师**: 1人 (自动化测试)
- **产品经理**: 1人 (需求确认)

#### 沟通机制
- **每日站会**: 上午9:30，15分钟
- **周例会**: 每周五下午，1小时
- **迭代回顾**: 每个阶段完成后
- **文档同步**: 实时更新项目文档

### 进度跟踪

#### 里程碑管理
```mermaid
gantt
    title 私教课系统开发计划
    dateFormat  YYYY-MM-DD
    section Phase 1
    基础架构搭建    :done, p1-1, 2025-11-08, 2d
    section Phase 2
    浏览功能开发    :p2-1, after p1-1, 3d
    section Phase 3
    咨询流程开发    :p3-1, after p2-1, 3d
    section Phase 4
    运营后台开发    :p4-1, after p3-1, 2d
    section Phase 5
    测试与优化      :p5-1, after p4-1, 2d
```

#### 风险管理
| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 4维匹配性能问题 | 中 | 高 | 提前性能测试，缓存优化 |
| 微信客服API限制 | 中 | 中 | 准备降级方案，备用联系方式 |
| 需求变更 | 高 | 中 | 灵活架构设计，预留扩展接口 |
| 人员变动 | 低 | 高 | 完善文档，知识共享 |

---

## 运维方案

### 监控体系

#### 应用监控
- **健康检查**: API健康状态监控
- **性能监控**: 响应时间、吞吐量监控
- **错误监控**: 异常日志收集和告警
- **业务监控**: 关键业务指标监控

#### 基础设施监控
- **服务器监控**: CPU、内存、磁盘、网络
- **数据库监控**: 连接数、查询性能、锁等待
- **缓存监控**: 命中率、内存使用、连接数

### 日志管理

#### 日志分类
- **应用日志**: 业务操作日志
- **访问日志**: HTTP请求日志
- **错误日志**: 异常和错误日志
- **审计日志**: 敏感操作审计日志

#### 日志处理
- **收集**: Filebeat + Logstash
- **存储**: Elasticsearch集群
- **分析**: Kibana可视化
- **告警**: 基于日志关键词的告警

### 备份策略

#### 数据备份
- **全量备份**: 每日凌晨执行
- **增量备份**: 每4小时执行
- **备份保留**: 30天
- **异地备份**: 云存储异地备份

#### 代码备份
- **版本控制**: Git仓库
- **分支策略**: feature分支开发
- **代码审查**: 强制Code Review
- **部署回滚**: 快速回滚机制

---

## 成功指标

### 业务指标
- **私教课浏览量**: >1000次/日
- **咨询转化率**: 咨询→预约 >20%
- **咨询响应时间**: <4小时
- **教练利用率**: >70%
- **客户满意度**: >4.5分

### 技术指标
- **系统可用性**: >99.5%
- **API响应时间**: P95<500ms
- **4维匹配准确率**: 100%
- **数据一致性**: 100%
- **安全事件**: 0次

### 用户体验指标
- **页面加载时间**: <1秒
- **咨询提交成功率**: >99%
- **运营操作效率**: 提升50%
- **用户满意度**: >90%

---

## 总结

本实施计划为百适体操馆私教课系统提供了完整的技术方案，严格遵循FR-042仅浏览模式和FR-040 4维标签匹配要求。通过分阶段开发、严格的质量保证和完善的运维方案，确保系统稳定可靠地支撑私教课业务的发展。

系统将为用户提供便捷的私教课浏览体验，为运营人员提供高效的管理工具，最终实现私教课业务的数字化升级。

---

**创建人**: [AI Claude]
**最后更新**: 2025-11-08
**版本**: v1.0.0
**状态**: Draft
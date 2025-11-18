# 功能规格说明：私教课程系统

**功能分支**: `004-private-lesson`
**创建时间**: 2025-11-05
**状态**: Draft
**MVP**: MVP-2C
**依赖关系**: MVP-2A (002-course-display-and-booking)
**输入需求**: "构建私教课程系统，家长可以浏览私教课程选项，提交咨询申请，通过运营协调管理私教课程预约"
**版本**: v2.0.0 RuoYi架构重构
**重构日期**: 2025-11-17

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 私教课程浏览与客服咨询 (Priority: P1) (根据Q9更新)

家长在小程序中浏览私教课程信息，查看教练介绍、课程类型、价格等，点击"咨询预约"后直接显示客服二维码，通过微信客服联系预约。

**Why this priority**: 私教课程是高价值服务，简化咨询流程提升用户体验，通过客服直接沟通确保服务质量。

**Independent Test**: 浏览私教课程列表，验证"咨询预约"按钮显示正确，点击后能正常显示客服二维码。

**Acceptance Scenarios**:

1. **Given** 用户进入私教课程页面，**When** 查看课程列表，**Then** 显示教练信息、课程类型、价格等，按钮文案为"咨询预约"
2. **Given** 用户点击某私教课程的"咨询预约"按钮，**When** 弹窗显示，**Then** 显示教练详细介绍和"联系客服"二维码
3. **Given** 用户扫描二维码或点击"联系客服"，**When** 跳转，**Then** 直接打开微信客服对话，咨询私教课程详情
4. **Given** 客服确认用户预约意向，**When** 运营后台录入，**Then** 系统生成私教预约记录，用户可查看预约详情
5. **Given** 微信客服API不可用，**When** 降级处理，**Then** 显示静态客服二维码图片，提示用户扫码添加客服

### User Story 2 - 冻结期间私教课程限制 (Priority: P0)

用户钱包冻结期间访问私教课程页面，系统显示冻结状态提示，禁止浏览私教课程和提交咨询申请，引导用户管理冻结状态。

**Why this priority**: 冻结期间需要全面限制用户访问所有课程服务，包括私教课程咨询，确保冻结政策的有效执行。

**Independent Test**: 设置用户冻结状态，访问私教课程页面，验证冻结提示和功能限制。

**Acceptance Scenarios**:

1. **Given** 用户钱包处于冻结状态，**When** 访问私教课程页面，**Then** 系统显示"课卡处于冻结阶段"提示，不显示私教课程列表
2. **Given** 用户点击"咨询预约"按钮，**When** 系统检测冻结状态，**Then** 显示冻结提示，不弹出客服二维码弹窗
3. **Given** 用户尝试提交私教咨询，**When** API验证冻结状态，**Then** 拒绝创建咨询记录并返回冻结状态错误
4. **Given** 用户查看冻结提示，**When** 点击"申请取消冻结"入口，**Then** 跳转到钱包管理页面显示冻结详情

---

### Edge Cases

- **教练临时取消**: 私教教练临时取消课程，如何处理？ → 运营人员及时通知用户，协助重新安排或退款
- **价格变动咨询**: 用户咨询时课程价格已调整，如何处理？ → 以咨询时有效价格为准，运营人员说明情况
- **教练档期冲突**: 用户希望的教练时间已满，如何处理？ → 运营人员推荐其他时间段或其他教练
- **咨询超时未响应**: 用户提交咨询后长期未收到联系，如何处理？ → 系统自动提醒运营人员，用户也可重新提交咨询
- **冻结期间咨询**: 用户冻结期间咨询私教课程，如何处理？ → 系统拒绝咨询申请并提示冻结状态，引导用户申请取消冻结

---

## 技术架构设计

### RuoYi-Vue-Pro 技术栈

**后端架构**：
- **框架**: Spring Boot 2.7.x + RuoYi-Vue-Pro
- **ORM**: MyBatis-Plus 3.5.x (LambdaQueryWrapper查询优化)
- **缓存**: Redis 6.x (Spring Cache + @Cacheable注解)
- **数据库**: MySQL 8.0 (主从复制)
- **认证**: Spring Security + JWT Token
- **事务**: @Transactional注解管理
- **日志**: Spring Boot Actuator + Logback
- **API文档**: Swagger 3.0 (OpenAPI)
- **定时任务**: Spring @Scheduled

**前端架构**：
- **小程序**: 原生微信小程序框架
- **管理后台**: Vue 3 + TypeScript + Element Plus
- **状态管理**: Pinia (Vue 3推荐)
- **HTTP客户端**: Axios
- **组件库**: 自定义组件库 + RuoYi-Vue-Pro组件

### 核心业务要求 (基于RuoYi架构重构)

- **FR-001**: 系统必须基于RuoYi权限管理显示私教课程列表，包含教练信息、课程类型、价格等
- **FR-002**: 系统必须显示"咨询预约"按钮，集成RuoYi工作流引擎
- **FR-003**: 系统必须显示微信客服二维码，支持RuoYi通知服务
- **FR-004**: 系统必须支持微信客服API跳转功能，使用RuoYi远程调用服务
- **FR-005**: 系统必须支持客服二维码降级显示（静态图片），集成RuoYi文件存储服务
- **FR-006**: 系统必须支持运营人员录入私教预约安排，使用RuoYi数据权限控制
- **FR-007**: 系统必须显示用户的私教预约记录和状态，基于RuoYi审计日志系统

#### 冻结状态检查相关 (FR-011~FR-014)

- **FR-011**: 系统必须在私教课程浏览前检查用户钱包冻结状态，冻结期间显示冻结提示而非课程列表
- **FR-012**: 系统必须在"咨询预约"操作前验证冻结状态，冻结期间点击咨询按钮显示"课卡处于冻结阶段"提示
- **FR-013**: 系统必须在私教咨询提交API中集成冻结状态检查，冻结状态下拒绝创建咨询记录
- **FR-014**: 系统必须在冻结提示中提供"申请取消冻结"入口，引导用户进入钱包管理页面

#### FR-040: 3维硬匹配白名单匹配相关（私教课扩展，根据Q4,Q11,Q16,Q19更新）

- **FR-040-PL**: 系统必须对私教课程实施3维硬匹配白名单验证：等级维度 + 年龄维度 + 性别维度，任一维度不匹配则私教课程不显示
- **FR-040-PL**: 系统必须在私教课程详情页显示匹配度信息，说明为什么该私教课程适合当前学员档案
- **FR-040-PL**: 系统必须支持私教课程的个性化价格显示，基于3维硬匹配结果和软标签排序

#### FR-042: 私教课仅浏览模式相关（根据Q9更新）

- **FR-042-01**: 系统必须将私教课程设置为仅浏览模式，用户只能查看私教信息，不能直接在线预约
- **FR-042-02**: 系统必须显示"咨询预约"按钮替代"立即预约"按钮，引导用户通过客服咨询了解私教服务
- **FR-042-03**: 系统必须点击"咨询预约"后显示微信客服二维码，支持直接联系客服
- **FR-042-04**: 系统必须支持微信客服API跳转，提供无缝的客服体验
- **FR-042-05**: 系统必须为运营人员提供后台管理界面，录入客服确认的私教预约
- **FR-042-06**: 系统必须支持线下支付流程，运营人员在后台录入私教预约后联系用户确认付款方式

### Data Requirements (根据Q9更新)

- **FR-008**: 系统必须存储私教课程信息：教练ID、课程类型、价格、课程介绍
- **FR-009**: 系统必须存储私教预约记录：用户ID、教练ID、预约时间、状态、价格
- **FR-010**: 系统必须存储客服二维码信息：客服微信号、二维码图片地址、更新时间
- **FR-011**: 系统必须记录客服点击事件追踪：用户ID、教练ID、点击时间、点击方式

### RuoYi架构核心实体设计

#### GymPrivateInstructor（私教教练实体）
```java
@Data
@TableName("gym_private_instructor")
@Accessors(chain = true)
public class GymPrivateInstructor extends BaseEntity implements Serializable {
    @TableId(value = "instructor_id", type = IdType.AUTO)
    private Long instructorId;

    @TableField("name")
    private String name;

    @TableField("avatar_url")
    private String avatarUrl;

    @TableField("bio")
    private String bio;

    @TableField("specialties")
    private String specialties; // JSON格式存储

    @TableField("price_per_hour")
    private BigDecimal pricePerHour;

    @TableField("status")
    private String status; // active/inactive

    @TableField("level_range")
    private String levelRange; // JSON格式，支持FR-040匹配

    @TableField("age_range")
    private String ageRange;

    @TableField("gender")
    private String gender;

    @TableField("course_type")
    private String courseType;

    @Version
    @TableField("version")
    private Integer version;
}
```

#### GymPrivateInquiry（私教咨询实体）
```java
@Data
@TableName("gym_private_inquiry")
@Accessors(chain = true)
public class GymPrivateInquiry extends BaseEntity implements Serializable {
    @TableId(value = "inquiry_id", type = IdType.AUTO)
    private Long inquiryId;

    @TableField("user_id")
    private Long userId;

    @TableField("profile_id")
    private Long profileId;

    @TableField("instructor_id")
    private Long instructorId;

    @TableField("inquiry_content")
    private String inquiryContent;

    @TableField("contact_info")
    private String contactInfo;

    @TableField("preferred_time")
    private String preferredTime;

    @TableField("status")
    private String status; // pending/contacted/booked/not_interested/expired

    @TableField("admin_notes")
    private String adminNotes;

    @Version
    @TableField("version")
    private Integer version;
}
```

#### GymPrivateBooking（私教预约实体）
```java
@Data
@TableName("gym_private_booking")
@Accessors(chain = true)
public class GymPrivateBooking extends BaseEntity implements Serializable {
    @TableId(value = "booking_id", type = IdType.AUTO)
    private Long bookingId;

    @TableField("user_id")
    private Long userId;

    @TableField("profile_id")
    private Long profileId;

    @TableField("instructor_id")
    private Long instructorId;

    @TableField("booking_time")
    private LocalDateTime bookingTime;

    @TableField("duration")
    private Integer duration;

    @TableField("actual_price")
    private BigDecimal actualPrice;

    @TableField("status")
    private String status; // pending/confirmed/completed/cancelled/no_show

    @TableField("payment_method")
    private String paymentMethod;

    @TableField("admin_id")
    private Long adminId;

    @TableField("confirmation_notes")
    private String confirmationNotes;

    @Version
    @TableField("version")
    private Integer version;
}
```

#### RuoYi业务服务层设计
```java
@Service
@Slf4j
public class GymPrivateInstructorServiceImpl extends ServiceImpl<GymPrivateInstructorMapper, GymPrivateInstructor> implements IGymPrivateInstructorService {

    @Override
    @Cacheable(value = "privateInstructors", key = "#profileId + ':' + #level + ':' + #ageRange + ':' + #gender")
    public List<GymPrivateInstructorVO> getMatchedInstructors(Long profileId, String level, String ageRange, String gender) {
        // 1. 获取学员档案信息
        GymProfile profile = profileMapper.selectById(profileId);

        // 2. 执行4维匹配 (FR-040)
        LambdaQueryWrapper<GymPrivateInstructor> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(GymPrivateInstructor::getStatus, "active")
                   .like(GymPrivateInstructor::getLevelRange, level)
                   .eq(GymPrivateInstructor::getAgeRange, ageRange)
                   .and(wrapper -> wrapper.eq(GymPrivateInstructor::getGender, "both")
                                        .or()
                                        .eq(GymPrivateInstructor::getGender, gender));

        return this.list(queryWrapper).stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "私教咨询", businessType = BusinessType.INSERT)
    public boolean submitInquiry(GymPrivateInquiryDTO inquiryDTO) {
        GymPrivateInquiry inquiry = BeanUtil.toBean(inquiryDTO, GymPrivateInquiry.class);
        boolean result = this.save(inquiry);

        // 发送通知给运营人员
        if (result) {
            notificationService.notifyAdminForInquiry(inquiry.getInquiryId());
        }

        return result;
    }
}
```

### RuoYi控制器层设计
```java
@RestController
@RequestMapping("/gym/private/instructors")
@Api(tags = "私教教练管理")
@RequiredArgsConstructor
public class GymPrivateInstructorController extends BaseController {

    private final IGymPrivateInstructorService instructorService;

    @GetMapping("/matched")
    @ApiOperation("获取匹配的私教教练列表")
    @PreAuthorize("@ss.hasPermi('gym:private:instructor:list')")
    public TableDataInfo<GymPrivateInstructorVO> getMatchedInstructors(
            @RequestParam Long profileId,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String ageRange,
            @RequestParam(required = false) String gender) {

        List<GymPrivateInstructorVO> instructors = instructorService.getMatchedInstructors(profileId, level, ageRange, gender);
        return getDataTable(instructors);
    }

    @PostMapping("/inquiry")
    @ApiOperation("提交私教咨询申请")
    @PreAuthorize("@ss.hasPermi('gym:private:inquiry:add')")
    public AjaxResult submitInquiry(@Valid @RequestBody GymPrivateInquiryDTO inquiryDTO) {
        return toAjax(instructorService.submitInquiry(inquiryDTO));
    }
}
```

---

## RuoYi架构成功指标

### 技术性能指标
- **SC-001**: 私教课程列表加载成功率>99%，信息显示准确率100%，响应时间<500ms
- **SC-002**: "咨询预约"按钮显示准确率100%，无直接预约按钮，集成RuoYi权限验证
- **SC-003**: 客服二维码显示成功率>99%，微信客服跳转成功率>95%，使用RuoYi文件服务
- **SC-004**: 客服二维码降级显示成功率100%，静态图片正常加载，RuoYi缓存命中率>90%
- **SC-005**: 运营人员录入预约成功率>98%，用户查看准确率100%，事务一致性保证
- **SC-006**: 客服点击事件追踪记录完整率100%，RuoYi审计日志完整性

### RuoYi架构质量指标
- **SC-007**: MyBatis-Plus查询优化率>95%，LambdaQueryWrapper使用率100%
- **SC-008**: Spring事务管理正确率100%，@Transactional注解覆盖所有关键业务
- **SC-009**: Redis缓存命中率>90%，@Cacheable注解优化所有查询接口
- **SC-010**: RuoYi数据权限控制正确率100%，@PreAuthorize注解完整覆盖
- **SC-011**: 乐观锁并发控制成功率>99%，@Version字段防止并发冲突
- **SC-012**: RuoYi统一响应格式使用率100%，AjaxResult/AjaxPageResult规范输出

#### FR-040: 3维硬匹配白名单匹配成功标准（根据Q4,Q11,Q16,Q19更新）

- **SC-007**: 私教课程3维硬匹配准确率100%（等级+年龄+性别任一维度不匹配则不显示）
- **SC-008**: 私教课程匹配度计算准确率>95%，匹配详情说明清晰易懂
- **SC-009**: 私教课程个性化价格显示准确率100%，基于3维硬匹配和软标签排序

#### FR-042: 私教课仅浏览模式成功标准（根据Q9更新）

- **SC-010**: 私教课程仅浏览模式执行准确率100%（无直接在线预约功能）
- **SC-011**: "咨询预约"按钮执行准确率100%，点击后正确显示客服二维码
- **SC-012**: 客服二维码展示准确率100%，包含客服微信号和扫描提示
- **SC-013**: 微信客服API跳转成功率>95%，提供无缝客服体验
- **SC-014**: 客服二维码降级机制执行准确率100%（API不可用时显示静态图片）
- **SC-015**: 线下私教预约录入成功率>98%，预约信息准确率100%
- **SC-016**: 客服咨询到预约转化率>20%，用户满意度>90%

---

## Assumptions

- 假设运营人员能够及时响应用户咨询（24小时内）
- 假设私教教练的档期和价格信息相对稳定
- 假设用户理解私教课程需要通过咨询确认安排

---

## Out of Scope (MVP-2C 不实现)

- ❌ 在线支付私教课程费用（线下支付）
- ❌ 用户自主选择私教时间（需要运营协调）
- ❌ 私教课程评价功能
- ❌ 私教课程自动排期系统

---

## RuoYi架构集成点

### RuoYi-Vue-Pro 系统集成

#### 与RuoYi核心模块的依赖关系
- **RuoYi用户认证**: 集成Spring Security + JWT，使用@PreAuthorize权限控制
- **RuoYi系统监控**: 集成Spring Boot Actuator，支持健康检查和性能监控
- **RuoYi代码生成**: 使用RuoYi代码生成器快速生成CRUD代码
- **RuoYi文件管理**: 集成RuoYi文件存储服务，支持客服二维码上传和管理
- **RuoYi通知服务**: 集成RuoYi消息通知，支持微信客服通知和系统提醒

#### 与MVP-2A的RuoYi架构集成
- **用户身份系统**: 基于RuoYi权限管理的用户登录和身份验证
- **课程展示系统**: 复用RuoYi架构的课程展示逻辑和Vue3组件

#### 与未来MVP的RuoYi架构集成
- **支付系统**: 基于RuoYi架构的在线支付集成（MVP-5）
- **运营后台**: 基于RuoYi-Vue-Pro的私教管理和咨询处理功能

### RuoYi部署架构
```yaml
# Docker Compose - RuoYi-Vue-Pro部署
version: '3.8'
services:
  ruoyi-gym-backend:
    image: ruoyi/gymsystem:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - REDIS_HOST=redis
      - MYSQL_HOST=mysql
    depends_on:
      - redis
      - mysql

  ruoyi-gym-admin:
    image: ruoyi/gymsystem-admin:latest
    ports:
      - "8081:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=gym_management
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:6.2-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

---

**创建人**: [AI Claude - RuoYi架构重构]
**最后更新**: 2025-11-17
**版本**: v2.0.0 RuoYi架构重构
**状态**: 已完成架构迁移
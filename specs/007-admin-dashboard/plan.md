# RuoYi实施计划：007-admin-dashboard

**功能分支**: `007-admin-dashboard`
**创建时间**: 2025-11-03
**重构日期**: 2025-11-17
**状态**: RuoYi架构重构中
**MVP**: MVP-7
**版本**: v2.0.0 RuoYi架构重构
**依赖关系**: MVP-1 (001-user-identity-system), MVP-5 (005-payment-integration), MVP-6 (006-wallet-system)
**输入**: 基于RuoYi-Vue-Pro构建全面的运营管理后台，包括用户管理、钱包调整、课程管理、数据分析和支付记录审计日志。

## 概述

本计划概述了基于RuoYi-Vue-Pro企业级架构的全面运营管理Web后台实施。系统将提供基于Spring Security的角色访问控制、用户管理、钱包调整、课程管理、出勤跟踪、数据分析以及全面的审计日志功能。

## RuoYi-Vue-Pro架构设计

### 技术栈升级
- **前端**: Vue3 + Element Plus + TypeScript
- **后端**: Spring Boot 2.7.x + RuoYi-Vue-Pro
- **数据库**: MySQL 8.0 + MyBatis-Plus 3.5.x
- **缓存**: Redis 6.x + Spring Cache
- **认证**: Spring Security + JWT + BCrypt密码哈希
- **UI框架**: RuoYi-Vue-Pro标准管理界面
- **图表**: ECharts + 数据可视化组件
- **文件导出**: Apache POI + Excel导出功能

### RuoYi系统组件
1. **RuoYi认证服务**: 基于Spring Security的登录、登出、会话管理
2. **RuoYi授权服务**: @PreAuthorize注解的RBAC权限控制
3. **用户管理服务**: MyBatis-Plus + LambdaQueryWrapper用户操作管理
4. **钱包管理服务**: Spring @Transactional事务性钱包调整和交易跟踪
5. **课程管理服务**: MyBatis-Plus乐观锁课程CRUD和排程
6. **分析服务**: Spring Batch + 数据聚合可视化
7. **RuoYi审计服务**: @Log注解 + Spring AOP全面日志监控
8. **RuoYi通知服务**: RuoYi消息通知模块系统告警提醒

## RuoYi-Vue-Pro实施阶段

### 阶段1：RuoYi核心基础设施 (5天)
- RuoYi-Vue-Pro项目初始化和配置
- Spring Security + JWT认证系统集成
- RuoYi @PreAuthorize RBAC权限控制
- Vue3 + Element Plus前端框架搭建
- RuoYi @Log注解审计日志基础设施
- Redis缓存集成和配置

### 阶段2：RuoYi用户管理 (5天)
- MyBatis-Plus用户列表和LambdaQueryWrapper搜索
- Vue3用户详情页（钱包信息集成）
- RuoYi对账记录管理Service层
- 基于事务的用户状态管理（冻结/解冻）
- Spring Cache用户信息缓存优化

### 阶段3：RuoYi钱包调整系统 (4天)
- Spring @Transactional钱包余额调整Service
- MyBatis-Plus交易历史查询优化
- Vue3 + Element Plus钱包调整表单
- RuoYi文件上传和收据管理
- Apache POI Excel财务报告导出

### 阶段4：RuoYi课程管理 (4天)
- MyBatis-Plus @Version乐观锁课程CRUD
- Vue3课程排程和教练分配界面
- RuoYi出勤跟踪Service + Redis缓存
- Spring Batch课程分析和报告生成
- Element Plus数据可视化组件

### 阶段5：RuoYi分析和报告 (5天)
- Vue3 + ECharts关键指标仪表板
- Spring Batch收入和用户数据分析
- Redis @Cacheable实时数据缓存
- Apache POI多格式Excel数据导出
- WebSocket实时数据推送

### 阶段6：RuoYi高级功能 (4天)
- Spring @Scheduled体验课跟进系统
- RuoYi客户标签和虚拟年龄管理
- MyBatis-Plus价格规则管理（优先级排序）
- Redis分布式锁候补队列管理
- Spring AOP私教课咨询和补课补偿

## RuoYi-MyBatis-Plus数据库设计

### RuoYi核心管理表（基于data-model.md）

#### gym_admin_user 表（RuoYi标准）
基于RuoYi-Vue-Pro架构的管理员用户表，继承BaseEntity审计字段。

**RuoYi实体类设计**：
```java
@Data
@TableName("gym_admin_user")
public class GymAdminUser extends BaseEntity {

    @TableId(value = "admin_id", type = IdType.AUTO)
    private Long adminId;

    @TableField("username")
    private String username;

    @TableField("password_hash")
    private String passwordHash; // BCrypt加密

    @TableField("role")
    private String role; // admin/operator/coach/finance

    @TableField("real_name")
    private String realName;

    @Version
    @TableField("version")
    private Integer version;

    @TableField("del_flag")
    private String delFlag;
}
```

#### gym_admin_operation_log 表（RuoYi审计标准）
基于RuoYi @Log注解和Spring AOP的操作日志表。

**RuoYi AOP配置**：
```java
@Aspect
@Component
@Slf4j
public class GymAdminLogAspect {

    @Around("@annotation(com.ruoyi.common.annotation.Log)")
    public Object around(ProceedingJoinPoint point, Log log) throws Throwable {
        // 1. 获取当前管理员信息
        // 2. 记录操作前状态
        // 3. 执行业务方法
        // 4. 记录操作后状态
        // 5. 保存审计日志
        return saveOperationLog(point, log);
    }
}
```

#### gym_admin_session 表（Redis会话管理）
基于Spring Session + Redis的会话管理表。

**RuoYi会话配置**：
```java
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800) // 30分钟
public class HttpSessionConfig {

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(
            new RedisStandaloneConfiguration("localhost", 6379));
    }
}
```

### RuoYi业务逻辑表（MyBatis-Plus标准）

#### gym_trial_class_follow_up 表（RuoYi事务管理）
基于Spring @Transactional和MyBatis-Plus的体验课跟进管理。

**RuoYi Service层实现**：
```java
@Service
@Transactional(rollbackFor = Exception.class)
@Log(title = "体验课跟进", businessType = BusinessType.UPDATE)
@Slf4j
public class GymTrialClassFollowUpServiceImpl
    extends ServiceImpl<GymTrialClassFollowUpMapper, GymTrialClassFollowUp>
    implements IGymTrialClassFollowUpService {

    @Override
    @Cacheable(value = "followUps", key = "#userId")
    public List<GymTrialClassFollowUp> getFollowUpsByUserId(Long userId) {
        LambdaQueryWrapper<GymTrialClassFollowUp> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymTrialClassFollowUp::getUserId, userId)
               .orderByDesc(GymTrialClassFollowUp::getCreateTime);
        return this.list(wrapper);
    }

    @Override
    @Scheduled(cron = "0 0 9 * * ?") // 每天9点执行
    public void processFollowUpReminders() {
        // 1. 查询需要跟进的记录
        // 2. 发送提醒给运营人员
        // 3. 更新跟进状态
    }
}
```

#### gym_user_reconciliation_record 表（RuoYi财务安全）
基于Spring Security和Redis事务性对账记录管理。

**RuoYi财务Service层**：
```java
@Service
@PreAuthorize("hasAnyRole('admin', 'finance')")
@Slf4j
public class GymWalletAdjustmentServiceImpl {

    @Autowired
    private IGymUserReconciliationRecordService reconciliationService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "钱包调整", businessType = BusinessType.UPDATE)
    public AjaxResult adjustWallet(GymWalletAdjustmentDTO adjustmentDTO) {
        // 1. 验证操作权限和金额合理性
        // 2. Redis分布式锁防止并发调整
        // 3. 创建对账记录
        // 4. 更新用户余额
        // 5. 记录操作日志
        String lockKey = "wallet_adjust:" + adjustmentDTO.getUserId();

        return redisTemplate.execute(
            new SetOperations().setIfAbsent(lockKey, "1", 30, TimeUnit.SECONDS),
            () -> processWalletAdjustment(adjustmentDTO)
        );
    }
}
```

#### gym_attendance_record 表（RuoYi乐观锁）
基于MyBatis-Plus @Version和Redis缓存的出勤记录管理。

**RuoYi出勤Service层**：
```java
@Service
@PreAuthorize("hasAnyRole('admin', 'coach')")
@Slf4j
public class GymAttendanceRecordServiceImpl
    extends ServiceImpl<GymAttendanceRecordMapper, GymAttendanceRecord>
    implements IGymAttendanceRecordService {

    @Override
    @CacheEvict(value = "attendance", key = "#scheduleId")
    @Transactional(rollbackFor = Exception.class)
    public boolean markAttendance(Long bookingId, Long studentProfileId,
                                 String status, String note) {
        // 1. 检查预约有效性
        // 2. 乐观锁防止重复标记
        // 3. 记录出勤状态
        GymAttendanceRecord attendance = new GymAttendanceRecord();
        attendance.setBookingId(bookingId);
        attendance.setStudentProfileId(studentProfileId);
        attendance.setStatus(status);
        attendance.setMarkedBy(SecurityUtils.getUserId());
        attendance.setMarkedAt(LocalDateTime.now());
        attendance.setNote(note);

        return this.save(attendance);
    }
}
```

## RuoYi-Vue-Pro UI/UX设计

### RuoYi标准布局（基于Element Plus）
```
┌─────────────────────────────────────────────────────────┐
│ RuoYi Header: Logo | 顶部菜单 | 用户信息 | 消息提醒         │
├─────────────────────────────────────────────────────────┤
│ RuoYi Sidebar            │ Vue3 Main Content Area       │
│ - 仪表板                 │ ┌─────────────────────────────┐│
│ - 用户管理               │ │ Element Plus 页面内容      ││
│ - 钱包管理               │ │                             ││
│ - 课程管理               │ │                             ││
│ - 出勤管理               │ │                             ││
│ - 数据分析               │ │                             ││
│ - 跟进管理               │ │                             ││
│ - 系统设置               │ └─────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### RuoYi-Vue-Pro关键页面（Vue3 + Element Plus）

#### 1. RuoYi仪表板页面
- Element Plus Card关键指标展示
- ECharts收入趋势图表（Vue3组件）
- 用户增长可视化（响应式图表）
- RuoYi活动记录流（实时更新）
- Element Plus快捷操作按钮

**Vue3组件示例**：
```vue
<template>
  <div class="dashboard-container">
    <!-- 关键指标卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in kpiCards" :key="item.title">
        <el-card class="kpi-card" :body-style="{ padding: '20px' }">
          <div class="kpi-content">
            <div class="kpi-title">{{ item.title }}</div>
            <div class="kpi-value">{{ item.value }}</div>
            <div class="kpi-trend" :class="item.trend">
              {{ item.trendText }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 收入趋势图表 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card title="收入趋势">
          <RevenueChart :data="revenueData" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="用户增长">
          <UserGrowthChart :data="userData" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
```

#### 2. RuoYi用户管理页面
- Element Plus Table + 搜索过滤
- Vue3 Composables用户状态管理
- Element Plus Tabs用户详情页：
  - 基础信息（Form组件）
  - 钱包与交易（Table + Pagination）
  - 预约历史（Timeline组件）
  - 跟进记录（List组件）

#### 3. RuoYi钱包调整弹窗
- Element Plus Form + Validation
- Vue3响应式余额预览
- Element Plus Select支付方式
- RuoYi文件上传组件
- 调整历史Table展示

**Vue3钱包调整表单**：
```vue
<template>
  <el-dialog v-model="visible" title="钱包余额调整" width="600px">
    <el-form :model="form" :rules="rules" ref="formRef">
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="form.userId" disabled />
      </el-form-item>
      <el-form-item label="当前余额" prop="currentBalance">
        <el-input v-model="form.currentBalance" disabled />
      </el-form-item>
      <el-form-item label="调整类型" prop="adjustmentType">
        <el-select v-model="form.adjustmentType" placeholder="请选择">
          <el-option label="充值" value="recharge" />
          <el-option label="扣费" value="deduct" />
          <el-option label="调整" value="adjust" />
        </el-select>
      </el-form-item>
      <el-form-item label="调整金额" prop="amount">
        <el-input-number v-model="form.amount" :min="0" :precision="2" />
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
```

#### 4. RuoYi课程管理页面
- Element Plus Table课程列表
- Vue3响应式课程表单
- 教练分配Transfer组件
- Element Plus Calendar排程管理
- MyBatis-Plus出勤跟踪集成

## RuoYi-Spring Security安全架构

### RuoYi认证安全
- BCrypt密码哈希（Spring Security标准）
- JWT Token + Redis Session管理
- 30分钟自动会话超时配置
- RuoYi失败登录尝试跟踪
- 5次失败后账户锁定机制

**RuoYi安全配置**：
```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authz -> authz
                .requestMatchers("/login", "/captchaImage").permitAll()
                .requestMatchers("/gym/admin/**").hasAnyRole("admin", "operator", "coach", "finance")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/index")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login")
                .permitAll()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
                .sessionRegistry(sessionRegistry())
            )
            .addFilterBefore(jwtAuthenticationTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### RuoYi授权安全
- @PreAuthorize注解RBAC权限控制
- Spring Security权限细粒度控制
- RuoYi数据权限@DataScope注解
- API端点Spring Security保护
- 敏感操作二次确认机制

**RuoYi权限注解示例**：
```java
@RestController
@RequestMapping("/gym/admin/wallet")
public class GymWalletController extends BaseController {

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('admin', 'finance')")
    @Log(title = "钱包调整", businessType = BusinessType.UPDATE)
    public AjaxResult adjustWallet(@RequestBody GymWalletAdjustmentDTO dto) {
        // 钱包调整逻辑
        return success();
    }

    @GetMapping("/balance/{userId}")
    @PreAuthorize("@ss.hasPermi('gym:wallet:query')")
    public AjaxResult getBalance(@PathVariable Long userId) {
        // 查询余额逻辑
        return success();
    }
}
```

### RuoYi数据安全
- Spring Validation JSR-303输入验证
- MyBatis-Plus SQL注入防护
- Spring Security XSS防护
- CSRF Token保护
- RuoYi安全文件上传处理

**RuoYi输入验证**：
```java
@Data
public class GymWalletAdjustmentDTO {
    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @NotNull(message = "调整金额不能为空")
    @DecimalMin(value = "0.01", message = "调整金额必须大于0")
    @DecimalMax(value = "99999.99", message = "调整金额不能超过99999.99")
    private BigDecimal amount;

    @NotBlank(message = "调整原因不能为空")
    @Length(max = 500, message = "调整原因长度不能超过500字符")
    private String reason;
}
```

### RuoYi审计安全
- @Log注解全面操作日志记录
- Spring AOP IP地址和User-Agent跟踪
- RuoYi风险评分可疑活动检测
- MyBatis-Plus不可变审计轨迹
- Redis缓存审计日志查询优化

**RuoYi审计AOP**：
```java
@Aspect
@Component
@Order(1)
public class GymAuditLogAspect {

    @Around("@annotation(com.ruoyi.common.annotation.Log)")
    public Object around(ProceedingJoinPoint point, Log log) throws Throwable {
        long beginTime = System.currentTimeMillis();
        Object result = null;
        Exception exception = null;

        try {
            result = point.proceed();
        } catch (Exception e) {
            exception = e;
            throw e;
        } finally {
            long time = System.currentTimeMillis() - beginTime;
            saveAuditLog(point, log, result, exception, time);
        }

        return result;
    }
}
```

## RuoYi-Vue-Pro性能优化

### MyBatis-Plus数据库优化
- RuoYi标准索引策略和复合索引设计
- LambdaQueryWrapper查询优化
- HikariCP高性能连接池配置
- MyBatis-Plus分页插件IPage优化
- Redis @Cacheable数据库查询缓存

**RuoYi查询优化示例**：
```java
@Service
@Slf4j
public class GymUserServiceImpl extends ServiceImpl<GymUserMapper, GymUser> implements IGymUserService {

    @Override
    @Cacheable(value = "users", key = "#username", unless = "#result == null")
    public GymUser selectUserByUsername(String username) {
        LambdaQueryWrapper<GymUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymUser::getUsername, username)
               .eq(GymUser::getStatus, "0")
               .select(GymUser::getUserId, GymUser::getUsername,
                      GymUser::getEmail, GymUser::getPhoneNumber);
        return this.getOne(wrapper);
    }

    @Override
    public IPage<GymUser> selectUserPage(GymUserDTO userDTO, PageQuery pageQuery) {
        LambdaQueryWrapper<GymUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.isNotEmpty(userDTO.getUsername()),
                   GymUser::getUsername, userDTO.getUsername())
               .eq(userDTO.getStatus() != null, GymUser::getStatus, userDTO.getStatus())
               .orderByDesc(GymUser::getCreateTime);

        Page<GymUser> page = new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize());
        return this.page(page, wrapper);
    }
}
```

### Vue3 + Element Plus前端优化
- Vue3 Composition API代码分割和懒加载
- Element Plus按需引入Tree-shaking优化
- Vue3虚拟滚动大列表组件
- Vite构建工具和代码压缩优化
- Vue3 Suspense异步组件加载

**Vue3性能优化组件**：
```vue
<template>
  <div class="user-list-container">
    <!-- 虚拟滚动用户列表 -->
    <el-virtual-list
      :data="userList"
      :height="600"
      :item-size="50"
      :key="item => item.userId"
    >
      <template #default="{ item, index }">
        <div class="user-item">
          <el-avatar :src="item.avatar" />
          <span>{{ item.username }}</span>
          <el-tag :type="getStatusType(item.status)">
            {{ getStatusText(item.status) }}
          </el-tag>
        </div>
      </template>
    </el-virtual-list>
  </div>
</template>

<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { debounce } from 'lodash-es'

const userStore = useUserStore()
const userList = shallowRef([])

// 防抖搜索
const handleSearch = debounce((keyword) => {
  userStore.searchUsers(keyword)
}, 300)

onMounted(async () => {
  await userStore.fetchUsers()
})
</script>
```

### RuoYi API性能优化
- Spring Cache @Cacheable响应缓存
- MyBatis-Plus分页查询大数据集
- Spring Boot Gzip响应压缩
- RuoYi @RateLimiter API限流
- Spring Validation请求验证优化

**RuoYi缓存配置**：
```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .build();
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
```

## Risk Assessment

### High Risk
- Security vulnerabilities in authentication
- Data integrity issues in financial operations
- Performance bottlenecks with large datasets
- Complex role-based access control implementation

### Medium Risk
- UI/UX complexity affecting usability
- Integration issues with existing systems
- Data migration challenges
- User training and adoption

### Low Risk
- Browser compatibility issues
- Minor UI inconsistencies
- Documentation completeness
- Testing coverage gaps

## Testing Strategy

### Unit Testing
- Authentication and authorization logic
- Business logic validation
- Data transformation functions
- API endpoint handlers
- Database operations

### Integration Testing
- Frontend-backend integration
- Database integration
- Third-party service integration
- Authentication flow testing
- File upload/download testing

### End-to-End Testing
- Complete user workflows
- Critical business scenarios
- Cross-browser compatibility
- Performance testing under load
- Security penetration testing

### User Acceptance Testing
- Operations staff workflow testing
- Coach attendance marking testing
- Finance user access testing
- Admin user management testing
- Reporting accuracy validation

## Deployment Plan

### Staging Environment
- Full system integration testing
- Performance testing with production-like data
- Security audit and penetration testing
- User acceptance testing with operations team

### Production Rollout
- Blue-green deployment strategy
- Database migration with rollback capability
- Feature flagging for gradual rollout
- Real-time monitoring and alerting
- Quick rollback procedures

## RuoYi-Vue-Pro成功指标

### 技术性能指标（基于RuoYi架构优化）
- [ ] SC-001: RuoYi认证成功率>99.5%（Spring Security + JWT）
- [ ] SC-002: 页面平均加载时间<2秒（Vue3 + Element Plus）
- [ ] SC-003: RuoYi审计日志覆盖率100%（@Log注解）
- [ ] SC-004: Spring Security安全漏洞零高危
- [ ] SC-005: 运营团队满意度>95%（用户体验优化）
- [ ] SC-006: 财务计算准确率100%（Spring @Transactional事务）

### RuoYi架构质量指标
- [ ] SC-007: MyBatis-Plus LambdaQueryWrapper使用率100%
- [ ] SC-008: Spring Security @PreAuthorize权限覆盖率100%
- [ ] SC-009: Redis缓存命中率>90%（@Cacheable优化）
- [ ] SC-010: RuoYi @Log审计日志完整性100%
- [ ] SC-011: Vue3 Composition API组件覆盖率100%
- [ ] SC-012: Spring Boot Actuator健康检查100%通过

### RuoYi企业级特性指标
- [ ] SC-013: RuoYi数据权限控制准确性100%（@DataScope）
- [ ] SC-014: MyBatis-Plus乐观锁并发控制100%有效
- [ ] SC-015: Spring @Scheduled定时任务可靠性100%
- [ ] SC-016: RuoYi统一响应格式AjaxResult使用率100%
- [ ] SC-017: Spring Security会话管理安全性100%
- [ ] SC-018: RuoYi代码生成器标准覆盖率100%

## Post-Launch Considerations

### Monitoring and Maintenance
- Real-time performance monitoring
- Security monitoring and alerting
- Error tracking and reporting
- User behavior analytics
- System health checks

### Training and Documentation
- Comprehensive user documentation
- Video tutorials for common workflows
- Admin user training sessions
- FAQ and troubleshooting guides
- Best practices documentation

### Future Enhancements
- Mobile-responsive admin interface
- Advanced analytics and reporting
- Automated workflow features
- Integration with additional third-party systems
- Enhanced security features
# 实施计划：005-payment-integration

**功能分支**: `005-payment-integration`
**创建时间**: 2025-11-03
**重构日期**: 2025-11-17
**状态**: RuoYi架构重构中
**MVP**: MVP-3
**版本**: v2.0.0 RuoYi架构重构
**输入**: 体验课预约系统的微信支付集成

## 概述

本计划概述了体操小程序体验课预约系统的微信支付集成实施。基于RuoYi-Vue-Pro企业级架构，系统将处理200元固定价格的体验课预约，包含完整的支付流程、座位管理和错误处理。

## RuoYi-Vue-Pro架构设计

### 技术栈升级
- **前端**: Vue3 + Element Plus + TypeScript
- **后端**: Spring Boot 2.7.x + RuoYi-Vue-Pro
- **数据库**: MySQL 8.0 + MyBatis-Plus 3.5.x
- **缓存**: Redis 6.x + Spring Cache
- **支付**: 微信支付Java SDK + RuoYi集成
- **事务管理**: Spring @Transactional + AOP
- **权限控制**: Spring Security + @PreAuthorize
- **日志审计**: RuoYi @Log注解 + Logback

### RuoYi系统组件
1. **RuoYi支付服务层**: 基于@Service的微信支付集成
2. **RuoYi订单管理**: 使用MyBatis-Plus的订单生命周期管理
3. **RuoYi座位管理**: 分布式锁+乐观锁的实时座位控制
4. **RuoYi通知系统**: 集成RuoYi消息通知模块
5. **RuoYi Webhook处理器**: 基于Controller的支付回调处理
6. **RuoYi代码生成器**: 快速生成CRUD代码
7. **RuoYi数据权限**: 基于角色的支付数据访问控制

## RuoYi-Vue-Pro实施阶段

### 阶段1：RuoYi数据库架构设置
- 基于RuoYi标准的4表设计（gym_payment_order, gym_payment_transaction, gym_seat_reservation, gym_payment_audit_log）
- MyBatis-Plus实体类生成（使用RuoYi代码生成器）
- RuoYi BaseAudit审计字段集成（create_time, update_time, create_by, update_by）
- 乐观锁字段配置（@Version注解）
- Redis缓存配置（@Cacheable注解）

### 阶段2：RuoYi微信支付集成
- 微信支付Java SDK集成到RuoYi架构
- RuoYi远程调用服务（@FeignClient或RestTemplate）
- 支付订单创建Service（@Transactional + @Log）
- 支付参数生成DTO（遵循RuoYi数据传输规范）
- Spring Retry重试机制配置

### 阶段3：RuoYi预约流程集成
- MyBatis-Plus座位可用性查询（LambdaQueryWrapper）
- Redis分布式锁座位预留（RedisTemplate + 分布式锁）
- RuoYi支付订单Service层事务管理
- 支付成功后预约确认（@EventListener事件驱动）
- Spring AOP切面记录操作日志

### 阶段4：RuoYi Webhook和通知
- 基于Controller的微信支付回调处理
- RuoYi统一响应格式（AjaxResult）
- 订单状态更新Service层（乐观锁防并发）
- RuoYi消息通知集成（微信通知模板）
- 幂等性处理（Redis防重复）

### 阶段5：RuoYi错误处理和边界情况
- RuoYi全局异常处理器（@RestControllerAdvice）
- 支付超时处理（@Scheduled定时任务）
- 座位冲突解决（MyBatis-Plus乐观锁机制）
- 退款处理（RuoYi权限控制 + @PreAuthorize）
- Spring Boot Actuator健康检查

## RuoYi-MyBatis-Plus数据库设计

### gym_payment_order 表（基于RuoYi标准）
- `payment_id`: BIGINT AUTO_INCREMENT PRIMARY KEY（MyBatis-Plus @TableId）
- `order_no`: VARCHAR(64) UNIQUE（订单号）
- `user_id`: BIGINT（用户ID，外键）
- `profile_id`: BIGINT（学员档案ID，外键）
- `course_schedule_id`: BIGINT（课程安排ID，外键）
- `amount`: DECIMAL(10,2) DEFAULT 200.00（固定200元）
- `status`: CHAR(1) DEFAULT '0'（支付状态枚举）
- `payment_method`: VARCHAR(32) DEFAULT 'wechat_pay'（支付方式）
- `wechat_order_id`: VARCHAR(64)（微信订单号）
- `prepay_id`: VARCHAR(64)（预支付ID）
- `paid_time`: DATETIME（支付时间）
- `expires_time`: DATETIME（过期时间）
- `version`: INT DEFAULT 0（MyBatis-Plus乐观锁@Version）
- `del_flag`: CHAR(1) DEFAULT '0'（RuoYi删除标志）
- `create_by`, `create_time`, `update_by`, `update_time`（RuoYi审计字段）

### gym_payment_transaction 表（基于RuoYi标准）
- `transaction_id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `payment_id`: BIGINT（支付订单ID，外键）
- `wechat_transaction_id`: VARCHAR(64) UNIQUE（微信交易号）
- `out_trade_no`: VARCHAR(64)（商户订单号）
- `trade_type`: VARCHAR(32) DEFAULT 'NATIVE'（交易类型）
- `trade_state`: VARCHAR(32)（交易状态）
- `bank_type`: VARCHAR(32)（付款银行）
- `total_fee`: BIGINT（订单金额，分为单位）
- `openid`: VARCHAR(128)（用户OpenID）
- `version`: INT DEFAULT 0（乐观锁）
- RuoYi审计字段（create_by, create_time, update_by, update_time）

### gym_seat_reservation 表（基于RuoYi标准）
- `reservation_id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `payment_id`: BIGINT UNIQUE（支付订单ID，一对一）
- `course_schedule_id`: BIGINT（课程安排ID，外键）
- `user_id`: BIGINT（用户ID，外键）
- `seat_count`: INT DEFAULT 1（预留座位数）
- `status`: CHAR(1) DEFAULT '0'（预留状态）
- `expires_time`: DATETIME（15分钟过期）
- `confirmed_time`: DATETIME（确认时间）
- `version`: INT DEFAULT 0（乐观锁）
- RuoYi审计字段

### gym_payment_audit_log 表（基于RuoYi标准）
- `audit_id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `payment_id`: BIGINT（支付订单ID，外键）
- `transaction_id`: BIGINT（交易ID，外键）
- `user_id`: BIGINT（用户ID，外键）
- `action_type`: VARCHAR(64)（操作类型）
- `action_detail`: TEXT（操作详情）
- `old_status`/`new_status`: VARCHAR(32)（状态变更）
- `ip_address`: VARCHAR(128)（IP地址）
- `request_data`/`response_data`: TEXT（JSON格式请求响应）
- `create_time`: DATETIME（创建时间）

## RuoYi-Vue-Pro API设计

### RuoYi Controller层API设计
```java
@RestController
@RequestMapping("/gym/payment")
@Api(tags = "支付管理")
@RequiredArgsConstructor
public class GymPaymentController extends BaseController {

    private final IGymPaymentOrderService paymentOrderService;

    @PostMapping("/order/create")
    @ApiOperation("创建支付订单")
    @PreAuthorize("@ss.hasPermi('gym:payment:add')")
    @Log(title = "支付订单创建", businessType = BusinessType.INSERT)
    public AjaxResult createPaymentOrder(@Valid @RequestBody GymPaymentOrderDTO paymentOrderDTO) {
        return toAjax(paymentOrderService.createPaymentOrder(paymentOrderDTO));
    }

    @GetMapping("/order/{paymentId}")
    @ApiOperation("查询支付订单详情")
    @PreAuthorize("@ss.hasPermi('gym:payment:query')")
    public AjaxResult getPaymentOrder(@PathVariable Long paymentId) {
        return success(paymentOrderService.selectGymPaymentOrderById(paymentId));
    }

    @PostMapping("/order/cancel/{paymentId}")
    @ApiOperation("取消支付订单")
    @PreAuthorize("@ss.hasPermi('gym:payment:edit')")
    @Log(title = "支付订单取消", businessType = BusinessType.UPDATE)
    public AjaxResult cancelPaymentOrder(@PathVariable Long paymentId) {
        return toAjax(paymentOrderService.cancelPaymentOrder(paymentId));
    }
}
```

### RuoYi微信支付集成API
- `POST /gym/payment/wxpay/create`: 创建微信支付（@PreAuthorize权限控制）
- `GET /gym/payment/wxpay/qrcode/{orderNo}`: 获取支付二维码（Swagger 3.0文档）
- `POST /gym/payment/wxpay/callback`: 微信支付回调（无需权限，签名验证）
- `POST /gym/payment/wxpay/query`: 查询微信支付状态（Spring Retry重试）

### RuoYi预约流程集成API
- `POST /gym/payment/seat/reserve`: 临时座位预留（Redis分布式锁）
- `POST /gym/payment/booking/confirm`: 支付后确认预约（@EventListener事件）
- `DELETE /gym/payment/seat/release`: 释放座位预留（@Scheduled定时清理）

### RuoYi数据传输对象设计
```java
@Data
@ApiModel("支付订单DTO")
public class GymPaymentOrderDTO {
    @NotNull(message = "用户ID不能为空")
    @ApiModelProperty("用户ID")
    private Long userId;

    @NotNull(message = "学员档案ID不能为空")
    @ApiModelProperty("学员档案ID")
    private Long profileId;

    @NotNull(message = "课程安排ID不能为空")
    @ApiModelProperty("课程安排ID")
    private Long courseScheduleId;

    @NotNull(message = "支付金额不能为空")
    @DecimalMin(value = "200.00", message = "支付金额必须为200元")
    @DecimalMax(value = "200.00", message = "支付金额必须为200元")
    @ApiModelProperty("支付金额（固定200元）")
    private BigDecimal amount;
}
```

## RuoYi-Vue-Pro安全架构设计

### RuoYi支付安全机制
- **微信支付签名验证**: 集成RuoYi安全验证框架，@PreAuthorize + 自定义验证器
- **订单金额验证**: MyBatis-Plus数据验证层 + JSR-303 Bean Validation
- **支付回调认证**: Spring Security过滤器链 + RuoYi统一签名验证
- **重复支付防护**: Redis分布式锁 + MyBatis-Plus乐观锁机制
- **IP白名单**: RuoYi网关层IP限制 + 微信支付API安全策略

### RuoYi数据安全架构
```java
@Configuration
@EnableWebSecurity
public class PaymentSecurityConfig {

    @Bean
    public SecurityFilterChain paymentFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authz -> authz
                .requestMatchers("/gym/payment/wxpay/callback").permitAll()
                .requestMatchers("/gym/payment/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(new JwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new WxPaySignatureValidationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### RuoYi数据权限控制
- **@PreAuthorize注解**: 细粒度权限控制（gym:payment:add, gym:payment:query等）
- **RuoYi数据权限**: 基于用户角色的数据访问范围控制
- **操作审计日志**: @Log注解自动记录所有支付操作
- **数据脱敏**: 敏感支付信息自动脱敏处理
- **数据库加密**: AES加密存储敏感字段

### RuoYi事务安全设计
```java
@Service
@Transactional(rollbackFor = Exception.class)
@Slf4j
public class GymPaymentOrderServiceImpl extends ServiceImpl<GymPaymentOrderMapper, GymPaymentOrder>
    implements IGymPaymentOrderService {

    @Override
    @Transactional(rollbackFor = Exception.class, timeout = 30)
    @Log(title = "支付订单创建", businessType = BusinessType.INSERT)
    public boolean createPaymentOrder(GymPaymentOrderDTO paymentOrderDTO) {
        // 固定价格验证防篡改
        if (paymentOrderDTO.getAmount().compareTo(new BigDecimal("200.00")) != 0) {
            throw new ServiceException("支付金额必须为200元");
        }

        // Redis分布式锁防止重复预约
        String lockKey = "payment_order:" + paymentOrderDTO.getUserId();
        return redisTemplate.execute(
            new SetOperations().setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS),
            () -> processPaymentOrderCreation(paymentOrderDTO)
        );
    }
}

## RuoYi架构风险评估

### RuoYi高风险项目
- **微信支付集成复杂度**: 微信支付Java SDK与RuoYi架构的深度集成，需要自定义签名验证和异常处理
- **支付回调处理可靠性**: 基于Spring Boot的webhook处理，需要确保幂等性和事务完整性
- **座位预留并发控制**: 高并发场景下的座位预留，需要Redis分布式锁 + MyBatis-Plus乐观锁双重保障

### RuoYi中等风险项目
- **支付超时处理**: Spring @Scheduled定时任务与RuoYi事务管理的协调
- **错误恢复机制**: RuoYi全局异常处理器与Spring Retry重试策略的集成
- **用户通知送达**: RuoYi消息模块与微信模板消息的集成

### RuoYi低风险项目（已通过架构优化解决）
- **数据库性能**: MyBatis-Plus查询优化 + Redis缓存策略
- **API限流**: RuoYi内置限流机制 + Spring Cloud Gateway
- **前端性能**: Vue3 + Element Plus企业级组件库

### RuoYi架构风险缓解措施
```java
@Component
@Slf4j
public class PaymentErrorHandler {

    @EventListener
    public void handlePaymentFailure(PaymentFailureEvent event) {
        // RuoYi日志记录
        log.error("支付失败: {}", event.getErrorMessage());

        // Redis分布式锁释放座位
        seatReservationService.releaseSeat(event.getReservationId());

        // RuoYi通知系统
        notificationService.sendPaymentFailureNotification(event.getUserId());
    }
}
```

## RuoYi-Vue-Pro测试策略

### RuoYi单元测试（JUnit 5 + Mockito）
- **Payment Service逻辑测试**: @SpringBootTest + @MockBean测试支付业务逻辑
- **Order管理功能测试**: MyBatis-Plus Service层CRUD操作测试
- **座位预留算法测试**: Redis分布式锁 + 乐观锁并发测试
- **异常处理场景测试**: RuoYi全局异常处理器测试
- **代码生成器测试**: RuoYi代码生成模板测试

```java
@SpringBootTest
@ActiveProfiles("test")
class GymPaymentOrderServiceTest {

    @Autowired
    private IGymPaymentOrderService paymentOrderService;

    @MockBean
    private RedisTemplate<String, Object> redisTemplate;

    @Test
    @DisplayName("创建支付订单 - 固定200元金额验证")
    void testCreatePaymentOrderWithFixedAmount() {
        // given
        GymPaymentOrderDTO paymentOrderDTO = new GymPaymentOrderDTO();
        paymentOrderDTO.setAmount(new BigDecimal("200.00"));

        // when
        boolean result = paymentOrderService.createPaymentOrder(paymentOrderDTO);

        // then
        assertTrue(result);
        verify(redisTemplate).execute(any(SetOperations.class), any());
    }
}
```

### RuoYi集成测试
- **微信支付API集成**: @TestConfiguration模拟微信支付SDK
- **预约流程端到端**: @SpringBootTest完整支付流程测试
- **数据库事务测试**: @Transactional测试事务回滚机制
- **Redis状态管理**: @DataRedisTest缓存一致性测试
- **RuoYi权限测试**: @WithMockUser权限控制测试

### RuoYi性能测试（JMeter + Spring Boot Actuator）
- **并发支付处理**: JMeter模拟高并发支付请求
- **数据库负载测试**: MyBatis-Plus查询性能 + 连接池监控
- **API响应时间**: Spring Boot Actuator + Micrometer指标监控
- **座位可用性查询**: Redis缓存命中率 + 数据库查询优化

### RuoYi安全测试
- **支付回调签名验证**: 自定义签名验证器单元测试
- **订单金额防篡改**: JSR-303验证 + 数据库约束测试
- **重复支付防护**: Redis分布式锁并发测试
- **权限控制测试**: @PreAuthorize注解权限测试

## RuoYi-Vue-Pro部署架构

### RuoYi测试环境（Docker Compose）
```yaml
version: '3.8'
services:
  ruoyi-gym-payment-test:
    image: ruoyi/gympayment:test
    ports:
      - "8081:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=test
      - REDIS_HOST=redis-test
      - MYSQL_HOST=mysql-test
      - WECHAT_PAY_ENV=sandbox
    depends_on:
      - redis-test
      - mysql-test
    volumes:
      - ./logs:/app/logs

  redis-test:
    image: redis:6.2-alpine
    command: redis-server --appendonly yes

  mysql-test:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=test123
      - MYSQL_DATABASE=gym_management_test
```

### RuoYi生产环境部署（Kubernetes）
- **微信支付沙箱测试**: 完整RuoYi架构 + 微信支付Java SDK测试
- **全集成测试**: Spring Boot Test + Testcontainers + MyBatis-Plus测试
- **性能验证**: JMeter + Spring Boot Actuator + Micrometer监控
- **安全审计**: RuoYi安全扫描 + 依赖漏洞检查

### RuoYi生产发布策略
- **分阶段功能发布**: Spring Boot Config Server动态配置
- **监控设置**: Spring Boot Admin + Prometheus + Grafana
- **回滚程序**: Kubernetes滚动回滚 + RuoYi配置热更新
- **用户沟通**: RuoYi消息通知 + 微信模板消息

### RuoYi容器化部署
```dockerfile
FROM openjdk:11-jre-slim

COPY target/ruoyi-gym-payment.jar app.jar
COPY docker/application-prod.yml /app/application.yml

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

## RuoYi-Vue-Pro监控和可观察性

### RuoYi关键指标监控（Spring Boot Actuator + Micrometer）
- **支付成功率**: >99%（@Timed + @Counted自定义指标）
- **订单处理时间**: <2秒（Spring Boot Actuator性能监控）
- **座位利用率**: Redis缓存命中率 + 实时统计
- **错误率追踪**: RuoYi异常监控 + 自定义Health Indicator
- **并发处理能力**: 数据库连接池 + Redis连接监控

### RuoYi告警系统（Prometheus + Grafana）
```java
@Component
public class PaymentMetrics {

    private final MeterRegistry meterRegistry;
    private final Counter paymentSuccessCounter;
    private final Timer paymentProcessingTimer;

    public PaymentMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.paymentSuccessCounter = Counter.builder("payment.success.count")
            .description("支付成功次数")
            .register(meterRegistry);
        this.paymentProcessingTimer = Timer.builder("payment.processing.time")
            .description("支付处理时间")
            .register(meterRegistry);
    }
}
```

### RuoYi实时监控
- **支付失败告警**: Spring Boot Admin + 钉钉/微信通知
- **高并发订单告警**: JVM线程池监控 + 数据库连接池告警
- **座位可用性警告**: Redis key过期监控 + 预留名额告警
- **系统性能问题**: GC监控 + 内存使用率告警

## RuoYi架构成功指标

### 技术性能指标（基于RuoYi架构优化）
- [ ] SC-001: 支付发起成功率>99%（RuoYi异常处理 + Spring Retry）
- [ ] SC-002: 支付回调处理准确率100%（MyBatis-Plus乐观锁 + Redis分布式锁）
- [ ] SC-003: 支付到账率100%（微信对账 + RuoYi审计日志）
- [ ] SC-004: 支付界面响应时间<3秒（Vue3 + Element Plus优化）
- [ ] SC-005: 支付失败名额释放及时率100%（Spring @EventListener + 事务回滚）
- [ ] SC-006: 重复预约拦截率100%（RuoYi缓存 + MyBatis-Plus查询）

### RuoYi架构质量指标
- [ ] SC-007: MyBatis-Plus查询优化率>95%（LambdaQueryWrapper使用率100%）
- [ ] SC-008: Spring事务管理正确率100%（@Transactional注解覆盖率）
- [ ] SC-009: Redis分布式锁成功率>99%（并发控制有效性）
- [ ] SC-010: RuoYi审计日志完整性100%（@Log注解覆盖率）
- [ ] SC-011: 微信支付签名验证准确率100%（安全验证机制）
- [ ] SC-012: RuoYi统一响应格式使用率100%（AjaxResult规范化输出）

**创建人**: [AI Claude - RuoYi架构重构]
**最后更新**: 2025-11-17
**版本**: v2.0.0 RuoYi架构重构
**状态**: 已完成RuoYi架构迁移
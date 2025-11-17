# 功能规格说明：支付集成系统

**功能分支**: `005-payment-integration`
**创建时间**: 2025-10-27
**状态**: Draft
**MVP**: MVP-3
**依赖关系**: MVP-1 (001-user-identity-system), MVP-2A (002-course-display-and-booking)
**输入需求**: "构建支付集成系统，支持体验课微信支付，固定价格200元每节，确保安全支付处理和成功付款后立即座位预留"
**版本**: v2.0.0 RuoYi架构重构
**重构日期**: 2025-11-17

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 体验课预约发起支付 (Priority: P0)

家长在体验课详情页点击"立即预约"，系统弹出支付确认窗口，显示固定价格200元，吊起微信支付完成付款。

**Why this priority**: 支付是体验课预约的核心环节，必须优先实现以确保商业模式闭环。

**Independent Test**: 预约体验课，验证支付流程和金额是否正确。

**Acceptance Scenarios**:

1. **Given** 用户在体验课详情页，**When** 点击"立即预约"，**Then** 系统显示支付确认窗口，金额固定为200元
2. **Given** 用户确认支付，**When** 点击"确认支付"，**Then** 系统吊起微信支付界面
3. **Given** 用户成功支付200元，**When** 支付完成，**Then** 系统自动创建预约记录并锁定课程名额
4. **Given** 用户取消支付，**When** 点击"取消支付"，**Then** 返回课程详情页，不创建预约记录

---

### User Story 2 - 支付成功与预约创建 (Priority: P0)

用户完成微信支付后，系统接收支付回调，验证支付成功，立即创建预约记录并锁定课程名额。

**Why this priority**: 支付成功后的预约创建是业务流程的关键环节，确保用户获得课程名额。

**Independent Test**: 完成支付后检查预约记录是否正确创建，课程名额是否正确减少。

**Acceptance Scenarios**:

1. **Given** 用户成功支付200元，**When** 系统接收支付回调，**Then** 验证签名并确认支付成功
2. **Given** 支付确认成功，**When** 系统处理预约，**Then** 自动创建预约记录，状态为"已预约"
3. **Given** 课程原剩余名额为3个，**When** 预约成功，**Then** 课程剩余名额减少为2个
4. **Given** 支付回调处理成功，**Then** 用户收到"预约成功"的微信通知

---

### User Story 3 - 支付失败处理与名额释放 (Priority: P0)

用户支付过程中出现失败（余额不足、取消支付等），系统正确处理异常情况，立即释放课程名额供其他用户预约。

**Why this priority**: 支付失败时立即释放名额确保课程资源的有效利用，避免名额长时间占用。

**Independent Test**: 模拟各种支付失败场景，验证名额是否立即释放。

**Acceptance Scenarios**:

1. **Given** 用户支付时余额不足，**When** 支付失败，**Then** 显示"支付失败"提示，课程名额立即释放
2. **Given** 用户取消支付，**When** 返回小程序，**Then** 显示"支付已取消"，课程名额立即释放
3. **Given** 网络异常导致支付失败，**When** 系统检测到失败，**Then** 课程名额立即释放，其他用户可预约
4. **Given** 支付回调重复收到，**When** 系统检测到重复订单，**Then** 忽略重复回调，避免重复处理

---

### Edge Cases

- **重复预约限制**: 用户已预约过体验课，再次预约时如何处理？ → 系统检查该微信OpenID是否已有体验课预约记录，如有则拒绝并提示"您已预约过体验课，无法重复预约"
- **支付失败名额释放**: 用户支付失败后，课程名额立即释放，其他用户可以继续预约
- **网络异常**: 支付回调时网络中断，如何处理？ → 微信支付有重试机制，系统需要幂等性处理
- **金额不一致**: 前端显示金额与后端订单金额不一致，如何处理？ → 以后端订单金额为准（固定200元），前端重新获取
- **部分退款**: 需要退款时如何处理？ → 体验课退款由运营人员手动发起，不根据absent标记自动生成退款任务，需要根据用户注册信息判断是否需要退款

---

## RuoYi架构设计

### 技术栈升级

**后端架构**：
- **框架**: Spring Boot 2.7.x + RuoYi-Vue-Pro
- **ORM**: MyBatis-Plus 3.5.x (LambdaQueryWrapper查询优化)
- **缓存**: Redis 6.x (Spring Cache + @Cacheable注解)
- **数据库**: MySQL 8.0 (主从复制)
- **认证**: Spring Security + JWT Token
- **事务**: @Transactional注解管理
- **日志**: Spring Boot Actuator + Logback + RuoYi @Log注解
- **API文档**: Swagger 3.0 (OpenAPI)
- **定时任务**: Spring @Scheduled

**支付集成**：
- **微信支付**: 微信支付Java SDK
- **签名验证**: RuoYi统一签名验证机制
- **幂等性**: Redis分布式锁 + MyBatis-Plus乐观锁

### RuoYi架构核心优势

- **统一响应格式**: RuoYi标准的AjaxResult响应
- **权限控制**: @PreAuthorize注解细粒度权限
- **审计日志**: @Log注解自动记录支付操作
- **事务管理**: @Transactional确保支付流程原子性
- **代码生成**: RuoYi代码生成器快速生成CRUD
- **异常处理**: RuoYi全局异常处理器

## 功能需求 (基于RuoYi架构重构)

### 支付发起相关 (FR-001~FR-007)

- **FR-001**: 系统必须基于RuoYi Service层支持生成体验课支付订单（关联预约记录）
- **FR-002**: 系统必须集成微信支付Java SDK获取支付参数，使用RuoYi远程调用服务
- **FR-003**: 系统必须使用固定价格200元，通过RuoYi数据验证确保价格不可篡改
- **FR-004**: 系统必须在订单中记录固定支付金额200元和课程信息，基于MyBatis-Plus实体
- **FR-005**: 系统必须在支付界面准确显示固定价格200元，使用RuoYi数据传输对象
- **FR-006**: 系统必须限制每个微信OpenID只能预约一次体验课，使用RuoYi缓存机制
- **FR-007**: 重复预约时系统必须提示"您已预约过体验课，无法重复预约"，使用RuoYi消息提示

### 支付回调处理 (FR-008~FR-012)

- **FR-008**: 系统必须接收微信支付回调通知，使用RuoYi Controller层处理
- **FR-009**: 系统必须验证微信支付回调的签名，集成RuoYi安全验证组件
- **FR-010**: 系统必须检查订单是否已处理（防止重复回调），使用Redis分布式锁
- **FR-011**: 支付成功后必须自动创建预约记录并锁定课程名额，使用@Transactional确保一致性
- **FR-012**: 系统必须记录支付完成时间和交易流水号，基于RuoYi审计日志系统

### 支付失败处理 (FR-013~FR-015)

- **FR-013**: 系统必须在支付失败后立即释放课程名额，使用MyBatis-Plus事务回滚
- **FR-014**: 系统必须支持支付失败时的用户提示和错误处理，使用RuoYi统一异常处理
- **FR-015**: 系统必须处理网络异常等临时性支付失败，使用Spring Retry重试机制

### 退款处理 (FR-018~FR-020)

- **FR-018**: 体验课退款必须由运营人员手动发起，系统不自动生成退款任务，使用RuoYi权限控制
- **FR-019**: 系统必须根据用户注册信息而非absent标记判断是否需要退款
- **FR-020**: 系统必须支持运营通过后台系统发起微信原路退款，并记录完整的RuoYi审计操作日志

### 安全验证 (FR-021~FR-024)

- **FR-021**: 系统必须验证支付回调的来源真实性，使用RuoYi安全验证框架
- **FR-022**: 系统必须防止订单金额篡改，通过MyBatis-Plus数据验证层
- **FR-023**: 系统必须记录支付操作日志，使用RuoYi @Log注解自动审计
- **FR-024**: 系统必须确保支付金额为固定200元（防价格篡改），通过RuoYi业务规则验证

#### 支付回调相关
- **FR-008**: 系统必须接收微信支付回调通知
- **FR-009**: 系统必须验证微信支付回调的签名
- **FR-010**: 系统必须检查订单是否已处理（防止重复回调）
- **FR-011**: 支付成功后必须自动创建预约记录并锁定课程名额
- **FR-012**: 系统必须记录支付完成时间和交易流水号

#### 支付失败处理相关
- **FR-013**: 系统必须在支付失败后立即释放课程名额
- **FR-014**: 系统必须支持支付失败时的用户提示和错误处理
- **FR-015**: 系统必须处理网络异常等临时性支付失败

#### 体验课退款处理相关
- **FR-018**: 体验课退款必须由运营人员手动发起，系统不自动生成退款任务
- **FR-019**: 系统必须根据用户注册信息而非absent标记判断是否需要退款
- **FR-020**: 系统必须支持运营通过后台系统发起微信原路退款，并记录完整的退款操作日志

#### 安全验证
- **FR-021**: 系统必须验证支付回调的来源真实性
- **FR-022**: 系统必须防止订单金额篡改
- **FR-023**: 系统必须记录支付操作日志
- **FR-024**: 系统必须确保支付金额为固定200元（防价格篡改）

## RuoYi-MyBatis-Plus 核心实体设计

### GymPaymentOrder（支付订单实体）
```java
@Data
@TableName("gym_payment_order")
@Accessors(chain = true)
public class GymPaymentOrder extends BaseEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "payment_id", type = IdType.AUTO)
    private Long paymentId;

    @TableField("order_no")
    private String orderNo; // 订单号

    @TableField("user_id")
    private Long userId;

    @TableField("profile_id")
    private Long profileId;

    @TableField("course_schedule_id")
    private Long courseScheduleId;

    @TableField("amount")
    private BigDecimal amount; // 固定200.00

    @TableField("currency")
    private String currency; // CNY

    @TableField("status")
    private String status; // pending/paid/failed/cancelled/expired

    @TableField("payment_method")
    private String paymentMethod; // wechat_pay

    @TableField("wechat_order_id")
    private String wechatOrderId;

    @TableField("prepay_id")
    private String prepayId;

    @TableField("paid_time")
    private LocalDateTime paidTime;

    @TableField("expires_time")
    private LocalDateTime expiresTime;

    @Version
    @TableField("version")
    private Integer version;

    @TableField("del_flag")
    private String delFlag;
}
```

### GymPaymentTransaction（支付交易实体）
```java
@Data
@TableName("gym_payment_transaction")
@Accessors(chain = true)
public class GymPaymentTransaction extends BaseEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "transaction_id", type = IdType.AUTO)
    private Long transactionId;

    @TableField("payment_id")
    private Long paymentId;

    @TableField("wechat_transaction_id")
    private String wechatTransactionId;

    @TableField("out_trade_no")
    private String outTradeNo;

    @TableField("trade_type")
    private String tradeType; // NATIVE

    @TableField("trade_state")
    private String tradeState;

    @TableField("bank_type")
    private String bankType;

    @TableField("settlement_total_fee")
    private BigDecimal settlementTotalFee;

    @TableField("cash_fee")
    private BigDecimal cashFee;

    @TableField("transaction_fee")
    private BigDecimal transactionFee;

    @TableField("total_fee")
    private Long totalFee; // 分为单位

    @TableField("fee_type")
    private String feeType; // CNY

    @TableField("time_end")
    private String timeEnd;

    @TableField("is_subscribe")
    private String isSubscribe; // Y/N

    @TableField("openid")
    private String openid;

    @Version
    @TableField("version")
    private Integer version;
}
```

### GymSeatReservation（座位预留实体）
```java
@Data
@TableName("gym_seat_reservation")
@Accessors(chain = true)
public class GymSeatReservation extends BaseEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "reservation_id", type = IdType.AUTO)
    private Long reservationId;

    @TableField("payment_id")
    private Long paymentId;

    @TableField("course_schedule_id")
    private Long courseScheduleId;

    @TableField("user_id")
    private Long userId;

    @TableField("seat_count")
    private Integer seatCount; // 固定为1

    @TableField("status")
    private String status; // temporary/confirmed/cancelled/expired

    @TableField("expires_time")
    private LocalDateTime expiresTime; // 15分钟过期

    @TableField("confirmed_time")
    private LocalDateTime confirmedTime;

    @Version
    @TableField("version")
    private Integer version;
}
```

### RuoYi业务服务层设计
```java
@Service
@Slf4j
public class GymPaymentOrderServiceImpl extends ServiceImpl<GymPaymentOrderMapper, GymPaymentOrder> implements IGymPaymentOrderService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "支付订单创建", businessType = BusinessType.INSERT)
    public boolean createPaymentOrder(GymPaymentOrderDTO paymentOrderDTO) {
        // 1. 验证固定价格200元
        if (paymentOrderDTO.getAmount().compareTo(new BigDecimal("200.00")) != 0) {
            throw new ServiceException("支付金额必须为200元");
        }

        // 2. 检查重复预约
        LambdaQueryWrapper<GymPaymentOrder> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(GymPaymentOrder::getUserId, paymentOrderDTO.getUserId())
                   .eq(GymPaymentOrder::getStatus, "paid")
                   .apply("created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)");

        if (this.count(queryWrapper) > 0) {
            throw new ServiceException("您已预约过体验课，无法重复预约");
        }

        // 3. 创建支付订单
        GymPaymentOrder paymentOrder = BeanUtil.toBean(paymentOrderDTO, GymPaymentOrder.class);
        paymentOrder.setOrderNo(generateOrderNo());
        paymentOrder.setStatus("pending");
        paymentOrder.setExpiresTime(LocalDateTime.now().plusMinutes(30));

        return this.save(paymentOrder);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "支付回调处理", businessType = BusinessType.UPDATE)
    public boolean handlePaymentCallback(String wechatTransactionId, String outTradeNo) {
        // 使用分布式锁防止重复处理
        String lockKey = "payment_callback:" + outTradeNo;
        return redisTemplate.execute(
            new SetOperations().setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS),
            () -> processPaymentCallback(wechatTransactionId, outTradeNo)
        );
    }
}
```

### RuoYi控制器层设计
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
    public AjaxResult createPaymentOrder(@Valid @RequestBody GymPaymentOrderDTO paymentOrderDTO) {
        return toAjax(paymentOrderService.createPaymentOrder(paymentOrderDTO));
    }

    @PostMapping("/wxpay/callback")
    @ApiOperation("微信支付回调")
    public String handleWxPayCallback(@RequestBody String callbackData) {
        try {
            // 验证签名
            if (!wxPayService.verifySignature(callbackData)) {
                return "FAIL";
            }

            // 处理回调
            boolean success = paymentOrderService.handlePaymentCallback(
                getTransactionId(callbackData),
                getOutTradeNo(callbackData)
            );

            return success ? "SUCCESS" : "FAIL";
        } catch (Exception e) {
            log.error("微信支付回调处理失败", e);
            return "FAIL";
        }
    }
}
```

---

## RuoYi架构成功指标

### 技术性能指标
- **SC-001**: 支付发起成功率大于99%（排除用户主动取消）
- **SC-002**: 支付回调处理准确率100%（无错误更新订单状态）
- **SC-003**: 支付成功到账率100%（与微信对账一致）
- **SC-004**: 支付界面响应时间小于3秒
- **SC-005**: 支付失败名额释放及时率100%
- **SC-006**: 重复预约拦截率100%
- **SC-007**: 体验课OpenID限制准确率100%

### RuoYi架构质量指标
- **SC-008**: MyBatis-Plus查询优化率>95%，LambdaQueryWrapper使用率100%
- **SC-009**: Spring事务管理正确率100%，@Transactional注解覆盖所有关键支付业务
- **SC-010**: Redis分布式锁成功率>99%，防止重复支付回调处理
- **SC-011**: RuoYi审计日志完整性100%，@Log注解记录所有支付操作
- **SC-012**: 微信支付签名验证准确率100%，集成RuoYi安全验证框架
- **SC-013**: 乐观锁并发控制成功率>99%，@Version字段防止支付冲突
- **SC-014**: RuoYi统一响应格式使用率100%，AjaxResult/AjaxPageResult规范输出
- **SC-015**: 代码生成器利用率>80%，使用RuoYi代码生成器快速生成CRUD

---

## Assumptions

- 假设已获得微信支付商户号和相关API权限
- 假设微信支付配置正确（证书、密钥等）
- 假设用户微信客户端支持微信支付功能
- 假设网络环境稳定，能够完成支付流程
- 体验课价格固定为200元，不支持动态调整

---

## Out of Scope (MVP-3 不实现)

- ❌ 订单超时机制（立即支付，无待支付状态）
- ❌ 待支付状态管理
- ❌ 动态定价功能
- ❌ 支付记录查询（属于钱包系统功能）
- ❌ 退款功能（留到后期）
- ❌ 分期支付（留到后期）
- ❌ 优惠券/折扣功能（留到后期）

---

## RuoYi架构集成点

### RuoYi-Vue-Pro 系统集成

#### 与RuoYi核心模块的依赖关系
- **RuoYi用户认证**: 集成Spring Security + JWT，使用@PreAuthorize权限控制支付操作
- **RuoYi系统监控**: 集成Spring Boot Actuator，支持支付系统健康检查和性能监控
- **RuoYi代码生成**: 使用RuoYi代码生成器快速生成支付CRUD代码
- **RuoYi通知服务**: 集成RuoYi消息通知，支持支付成功/失败通知
- **RuoYi文件管理**: 集成RuoYi文件存储服务，支持支付凭证上传

#### 与MVP-1的RuoYi架构集成
- **用户身份系统**: 基于RuoYi权限管理的用户登录和身份验证
- **学员档案**: 支付时关联学员档案信息

#### 与MVP-2A的RuoYi架构集成
- **课程显示系统**: 复用RuoYi架构的课程展示逻辑和Vue3组件
- **预约系统**: 支付成功后自动创建预约记录

#### 与MVP-6的RuoYi架构集成
- **钱包系统**: 支付记录集成到钱包系统，支持余额查询

### RuoYi部署架构
```yaml
# Docker Compose - RuoYi-Vue-Pro支付系统部署
version: '3.8'
services:
  ruoyi-gym-payment:
    image: ruoyi/gympayment:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - REDIS_HOST=redis
      - MYSQL_HOST=mysql
      - WECHAT_PAY_MCH_ID=${WECHAT_PAY_MCH_ID}
      - WECHAT_PAY_API_KEY=${WECHAT_PAY_API_KEY}
    depends_on:
      - redis
      - mysql

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

### RuoYi安全架构
```java
@Configuration
@EnableWebSecurity
public class PaymentSecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authz -> authz
                .requestMatchers("/gym/payment/wxpay/callback").permitAll()
                .requestMatchers("/gym/payment/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(new JwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

---

## Open Questions (RuoYi架构优化)

1. **[RuoYi优化]** 微信支付回调处理超时如何设置？
   - 建议: 使用RuoYi @Transactional超时设置5秒，确保回调处理及时完成

2. **[RuoYi优化]** 支付失败重试机制如何设计？
   - 建议: 使用Spring Retry注解实现用户手动重新发起支付，不自动重试

3. **[RuoYi优化]** 重复预约限制是否包含已取消的体验课？
   - 建议: 基于RuoYi缓存和数据库查询，已支付但取消的体验课不计入重复预约限制

**创建人**: [AI Claude - RuoYi架构重构]
**最后更新**: 2025-11-17
**版本**: v2.0.0 RuoYi架构重构
**状态**: 已完成架构迁移
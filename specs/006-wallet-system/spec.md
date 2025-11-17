# Feature Specification: Wallet System (RuoYi架构版)

**Feature Branch**: `006-wallet-system`
**Created**: 2025-10-27
**Updated**: 2025-11-17 (v2.0.0 RuoYi架构重构)
**Status**: Ready for Implementation
**MVP**: MVP-4
**Dependencies**: MVP-1 (001-user-identity-system), MVP-3 (005-payment-integration)
**Input**: "Build a wallet system that supports balance alerts, payment notifications, and manual admin adjustments for course fees (NO OVERDRAFT - 根据Q7,Q8,Q12,Q14更新)."

## 技术架构说明

**核心架构**: RuoYi-Vue-Pro + Spring Boot + MyBatis-Plus + Vue3
**实现框架**: 基于RuoYi脚手架的企业级钱包管理系统
**数据库**: MySQL 8.0 + Redis缓存
**前端**: 微信小程序 + RuoYi-Vue-Pro管理后台

### 关键架构特性
- **零透支机制**: 钱包余额不允许为负数，余额不足直接阻止预约
- **RuoYi集成**: 完全基于RuoYi的权限管理、操作审计、代码生成
- **企业级安全**: 分布式锁、事务管理、操作审计
- **Spring生态**: 完整的Spring Boot技术栈集成

## RuoYi技术实现架构

### 后端架构 (Spring Boot)
```
com.ruoyi.project.gymnastics.wallet
├── domain/           // MyBatis-Plus实体类
│   ├── GymWallet.java           // 钱包主表
│   ├── GymWalletTransaction.java // 交易记录表
│   └── GymWalletAdjustment.java  // 调整记录表
├── mapper/           // MyBatis-Plus Mapper接口
│   ├── GymWalletMapper.java
│   ├── GymWalletTransactionMapper.java
│   └── GymWalletAdjustmentMapper.java
├── service/          // Spring Service业务层
│   ├── IGymWalletService.java
│   ├── IGymWalletTransactionService.java
│   └── impl/
│       ├── GymWalletServiceImpl.java
│       └── GymWalletTransactionServiceImpl.java
└── controller/       // REST Controller层
    ├── GymWalletController.java
    └── GymWalletAdjustmentController.java
```

### 前端架构 (RuoYi-Vue-Pro)
```
src/views/gymnastics/wallet
├── index.vue         // 钱包管理主页面
├── walletDetail.vue  // 钱包详情页面
├── transactionList.vue // 交易记录列表
└── adjustment.vue    // 余额调整页面
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 查看钱包余额和交易记录 (Priority: P0)

用户可以在小程序钱包页面查看当前余额（仅允许非负数）和详细的交易记录，包括运营充值、课程扣费、调整记录等所有资金变动。

**Why this priority**: 余额查看是钱包系统的核心功能，用户需要了解可用余额和资金变动情况。

**RuoYi Implementation**: 使用MyBatis-Plus的分页查询和Redis缓存优化性能。

**Acceptance Scenarios**:

1. **Given** 用户进入"我的-钱包"页面，**When** 页面加载完成，**Then** 显示当前钱包余额（精确到分，仅允许非负数）
2. **Given** 用户有交易记录，**When** 查看交易历史，**Then** 按时间倒序显示所有交易记录
3. **Given** 用户点击某条交易记录，**When** 查看详情，**Then** 显示交易时间、金额、类型、操作人等信息
4. **Given** 用户没有交易记录，**When** 查看交易历史，**Then** 显示"暂无交易记录"提示
5. **Given** 家庭账号有多个学员，**When** 查看钱包，**Then** 显示家庭共享的统一余额

---

### User Story 2 - 正式课预约余额检查与扣费 (Priority: P0) (RuoYi事务管理)

用户预约正式课时，系统必须检查钱包余额是否充足，余额不足时直接阻止预约并提示联系运营充值。扣费仅限正式课，体验课通过微信支付直连。

**Why this priority**: 预约时立即扣费是核心业务逻辑，确保课程费用的及时收取。

**RuoYi Implementation**: 使用Spring Boot + MyBatis-Plus实现分布式事务管理，确保扣费操作的原子性。

**Acceptance Scenarios**:

1. **Given** 用户预约体验课200元，**When** 点击确认预约，**Then** 跳转微信支付直连，不经过钱包扣费
2. **Given** 用户预约正式课260元，钱包余额300元，**When** 点击确认预约，**Then** Spring Boot事务扣费260元，余额变为40元
3. **Given** 用户预约正式课800元，钱包余额300元，**When** 点击确认预约，**Then** RuoYi服务层阻止预约并提示"余额不足，请联系教务充值钱包"
4. **Given** 用户取消预约，**When** 取消成功（开课前≥6小时），**Then** @Transactional注解自动恢复钱包余额全额
5. **Given** 家庭账号有多个学员，**When** 系统处理，**Then** 使用MyBatis-Plus的SelectForUpdate确保并发扣费正确
6. **Given** 退款发生，**When** 系统处理，**Then** 退款交易记录不计入累计充值/消费统计

**RuoYi Technical Implementation**:
```java
@Service
@Transactional
public class GymWalletService {

    /**
     * 预约扣费 - 使用RuoYi事务管理
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean deductForBooking(Long walletId, BigDecimal amount, Long bookingId) {
        // 1. 使用悲观锁查询钱包
        GymWallet wallet = walletMapper.selectForUpdate(walletId);

        // 2. 检查余额是否充足（零透支机制）
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new ServiceException("余额不足，请联系教务充值钱包");
        }

        // 3. 扣费操作
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletMapper.updateById(wallet);

        // 4. 记录交易（使用RuoYi的BaseMapper）
        GymWalletTransaction transaction = new GymWalletTransaction();
        transaction.setWalletId(walletId);
        transaction.setType("deduction");
        transaction.setAmount(amount.negate());
        transaction.setReferenceType("booking");
        transaction.setReferenceId(bookingId.toString());
        walletTransactionMapper.insert(transaction);

        return true;
    }
}
```

---

### User Story 3 - 运营手动钱包管理 (Priority: P0) (RuoYi管理后台)

钱包仅支持运营人员在Web后台手动调整余额（充值/扣费），用户无法自助充值。系统记录完整的调整操作日志，确保资金管理透明。

**Why this priority**: 钱包余额调整是重要的资金管理功能，必须确保操作安全和审计完整。

**RuoYi Implementation**: 基于RuoYi-Vue-Pro管理后台，使用@PreAuthorize权限控制和@Log操作审计。

**Acceptance Scenarios**:

1. **Given** 运营在后台选择用户，填写调整金额+100元、调整原因"线下充值"、收款方式"微信"、订单号"wx123"，**When** 提交，**Then** 用户余额增加100元
2. **Given** 运营填写调整金额-50元、调整原因"线下退款"、收款方式"银行转账"、订单号"bank456"，**When** 提交，**Then** 用户余额减少50元
3. **Given** 调整成功，**When** 运营查看操作日志，**Then** 记录操作人、时间、金额、原因、收款方式、订单号等完整信息
4. **Given** 调整成功，**When** 系统提示，**Then** 显示"请将收款流水截图发送至飞书群"
5. **Given** 用户查看交易记录，**When** 进入钱包页面，**Then** 显示该笔调整记录和详细信息

**RuoYi Controller Implementation**:
```java
@RestController
@RequestMapping("/gym/wallet/adjustment")
public class GymWalletAdjustmentController extends BaseController {

    @Autowired
    private IGymWalletAdjustmentService adjustmentService;

    @PostMapping
    @PreAuthorize("@ss.hasPermission('gym:wallet:adjustment')")
    @Log(title = "钱包余额调整", businessType = BusinessType.UPDATE)
    public AjaxResult add(@Validated @RequestBody GymWalletAdjustment adjustment) {
        adjustment.setCreateBy(getUsername());
        return toAjax(adjustmentService.insertGymWalletAdjustment(adjustment));
    }

    @GetMapping("/list")
    @PreAuthorize("@ss.hasPermission('gym:wallet:adjustment:list')")
    public TableDataInfo list(GymWalletAdjustment adjustment) {
        startPage();
        List<GymWalletAdjustment> list = adjustmentService.selectGymWalletAdjustmentList(adjustment);
        return getDataTable(list);
    }
}
```

---

### User Story 4 - 余额不足预警通知 (Priority: P1)

用户钱包余额低于200元时，系统通过微信服务通知推送预警提醒，帮助用户及时充值。

**Why this priority**: 余额预警能提升用户体验，避免因余额不足影响课程预约。

**RuoYi Implementation**: 使用Spring Boot定时任务@Scheduled和Redis限流。

**Acceptance Scenarios**:

1. **Given** 用户钱包余额从300元消费到190元，**When** 余额低于200元，**Then** 立即推送微信通知"余额不足200元，请及时充值"
2. **Given** 用户钱包余额已低于200元，**When** 用户再次消费，**Then** 不重复推送预警通知
3. **Given** 用户充值后余额超过200元，**When** 再次消费到200元以下，**Then** 重新触发预警通知
4. **Given** 用户关闭微信通知权限，**When** 余额不足，**Then** 系统记录预警但无法推送，不影响其他功能

**RuoYi Service Implementation**:
```java
@Service
public class GymWalletNotificationService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    /**
     * 余额预警通知 - 使用Redis限流
     */
    public void sendLowBalanceAlert(Long userId, BigDecimal currentBalance) {
        String lockKey = "wallet:alert:" + userId;

        // 使用Redis限流，24小时内不重复发送
        if (redisTemplate.hasKey(lockKey)) {
            return;
        }

        // 发送微信通知
        WeChatNotificationUtils.sendLowBalanceAlert(userId, currentBalance);

        // 设置24小时过期
        redisTemplate.opsForValue().set(lockKey, "1", 24, TimeUnit.HOURS);
    }
}
```

---

### User Story 5 - 余额不足使用提醒 (Priority: P1)

当用户因余额不足无法预约课程时，系统主动提供充值引导，帮助用户完成课程预约。

**Why this priority**: 余额不足时的良好用户体验引导，提升预约成功率和用户满意度。

**Independent Test**: 测试余额不足场景下的引导和通知功能。

**Acceptance Scenarios**:

1. **Given** 用户预约课程时余额不足，**When** 系统检查，**Then** 显示"余额不足，请联系教务充值"并引导至客服
2. **Given** 余额不足用户多次尝试预约，**When** 系统检测，**Then** 使用Redis限流，避免频繁发送重复通知
3. **Given** 运营为用户充值后，**When** 用户再次预约，**Then** 正常执行预约流程，不再提示余额不足
4. **Given** 用户长期未使用钱包余额，**When** 运营查看，**Then** 可以看到该用户的余额状态，主动联系充值

---

## RuoYi技术实现规范

### 1. MyBatis-Plus实体类设计
```java
@TableName("gym_wallet")
@Data
@EqualsAndHashCode(callSuper = false)
public class GymWallet extends BaseEntity {

    @TableId(value = "wallet_id", type = IdType.AUTO)
    private Long walletId;

    @TableField("user_id")
    private Long userId;

    @TableField("balance")
    private BigDecimal balance; // 仅允许非负数

    @TableField("status")
    private String status; // active, frozen, closed

    @Version
    @TableField("version")
    private Integer version; // 乐观锁版本号
}
```

### 2. RuoYi服务层标准
```java
@Service
public class GymWalletServiceImpl implements IGymWalletService {

    @Autowired
    private GymWalletMapper walletMapper;

    @Override
    @DataSource(value = DataSourceType.MASTER)
    public GymWallet selectGymWalletByUserId(Long userId) {
        LambdaQueryWrapper<GymWallet> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymWallet::getUserId, userId)
               .eq(GymWallet::getStatus, "active");
        return walletMapper.selectOne(wrapper);
    }
}
```

### 3. Redis缓存策略
```java
@Service
public class GymWalletCacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 缓存钱包余额 - 使用RuoYi Redis工具类
     */
    public void cacheWalletBalance(Long userId, BigDecimal balance) {
        String key = "wallet:balance:" + userId;
        redisTemplate.opsForValue().set(key, balance, 1, TimeUnit.HOURS);
    }
}
```

---

## Edge Cases (RuoYi架构适配)

- **余额不足用户限制**: 使用Spring AOP拦截预约请求，余额不足直接抛出ServiceException
- **余额精度处理**: 使用BigDecimal进行精确计算，MyBatis-Plus自动处理DECIMAL(10,2)
- **并发扣费**: 使用MyBatis-Plus的SelectForUpdate悲观锁，确保并发安全
- **重复调整**: 使用RuoYi的@PreventDuplicateSubmission防重复提交注解
- **网络异常**: Spring Boot的@Transactional自动回滚机制
- **误操作撤销**: 运营后台支持反向调整操作，记录详细操作日志
- **家庭账号并发**: 使用Redis分布式锁，确保同一家庭账号的操作原子性
- **教练出勤标记**: 不触发扣费逻辑，费用在预约时已扣除
- **退费规则时间限制**: 使用Spring Boot定时任务检查退费时间窗口
- **退款统计处理**: 交易记录单独标记，统计时过滤退款交易
- **自助充值**: 前端隐藏自助充值入口，仅支持运营后台调整

---

## Requirements *(mandatory)*

### Functional Requirements (RuoYi架构适配)

#### 钱包余额相关 (根据Q7,Q8,Q12,Q14更新)
- **FR-001**: RuoYi系统必须支持查询用户钱包余额（仅允许非负数）
- **FR-002**: Spring Boot必须支持余额实时更新和Redis缓存
- **FR-003**: MyBatis-Plus必须支持家庭账号余额共享查询
- **FR-004**: BigDecimal必须支持余额精度处理（精确到分）
- **FR-005**: Spring Boot必须禁止钱包余额为负数（删除透支机制）
- **FR-006**: RuoYi前端必须禁止用户自助充值功能，仅支持运营后台手动调整

#### 预约扣费相关 (根据Q7,Q8,Q12,Q14更新)
- **FR-007**: Spring Boot服务层必须在预约正式课时检查余额是否充足
- **FR-008**: 体验课预约必须跳转微信支付直连（不经过钱包）
- **FR-009**: 余额不足时RuoYi必须直接阻止预约并提示联系运营
- **FR-010**: @Transactional必须在取消预约时自动恢复钱包余额（开课前≥6小时）
- **FR-011**: MyBatis-Plus必须生成详细的扣费交易记录
- **FR-012**: Spring Boot必须确保教练出勤标记不触发任何扣费逻辑
- **FR-013**: MyBatis-Plus必须支持家庭账号并发扣费时使用数据库行锁

#### 运营调整相关
- **FR-014**: RuoYi管理后台必须支持运营手动调整用户钱包余额（充值/扣费）
- **FR-015**: Spring Boot Validator必须要求填写调整原因（必填）
- **FR-016**: RuoYi前端必须要求填写收款方式（微信/支付宝/银行/现金）
- **FR-017**: Spring Boot必须支持填写外部订单号（选填）
- **FR-018**: RuoYi的@Log注解必须记录运营调整的操作日志
- **FR-019**: RuoYi前端必须提示"请将收款流水截图发送至飞书群"

#### 预警通知相关
- **FR-020**: Spring Boot@Scheduled必须在余额低于200元时推送预警通知
- **FR-021**: Redis限流必须避免重复推送同类型预警通知
- **FR-022**: Spring Boot必须在余额不足时推送充值提醒通知
- **FR-023**: Spring Boot必须在用户尝试预约但余额不足时推送充值提醒
- **FR-024**: Spring Boot必须在课程开课前1天推送余额不足提醒（如适用）

#### 交易记录相关
- **FR-025**: MyBatis-Plus必须记录所有钱包交易（充值、扣费、调整）
- **FR-026**: RuoYi分页查询必须支持交易记录查询和筛选
- **FR-027**: RuoYi前端必须显示详细的交易信息（时间、金额、类型、操作人）
- **FR-028**: Spring Boot必须确保交易记录不可篡改
- **FR-029**: 统计查询必须在"累计充值/累计消费"时不计入退款金额（Q14更新）

### Key Entities (MyBatis-Plus实体)

- **GymWallet**: 钱包实体，存储用户余额信息
  - 核心属性: walletId, userId, balance(仅允许非负数), status, version
  - 业务规则: 每个用户只有一个钱包，余额不能为负数，不支持透支（Q7,Q12更新）

- **GymWalletTransaction**: 钱包交易记录实体，记录所有资金变动
  - 核心属性: transactionId, walletId, type, amount, balanceAfter, referenceType, referenceId
  - 业务规则: 每次余额变动都产生交易记录，包含完整的操作信息

- **GymWalletAdjustment**: 运营调整记录实体，记录运营人员的手动调整操作
  - 核心属性: adjustmentId, walletId, adjustmentType, amount, reason, paymentMethod, adminId
  - 业务规则: 记录所有运营手动调整，确保审计完整性

---

## Success Criteria *(mandatory)*

### Measurable Outcomes (根据Q7,Q8,Q12,Q14更新)

- **SC-001**: RuoYi钱包余额查询准确率100%
- **SC-002**: Spring Boot预约余额检查与扣费操作准确率100%
- **SC-003**: 余额不足阻止预约准确率100%
- **SC-004**: 体验课微信支付直连成功率>99%
- **SC-005**: RuoYi管理后台余额调整操作成功率99.5%（排除异常情况）
- **SC-006**: MyBatis-Plus交易记录完整性100%
- **SC-007**: Spring Boot定时任务余额预警通知及时率100%
- **SC-008**: Redis缓存余额不足提醒通知覆盖率100%
- **SC-009**: 退款不计入累计统计准确率100%
- **SC-010**: RuoYi钱包页面响应时间小于2秒

---

## Assumptions

- 假设运营人员有权限访问RuoYi-Vue-Pro管理后台进行充值操作
- 假设用户理解钱包使用规则，钱包不允许透支
- 假设微信服务通知功能正常工作
- 假设网络环境稳定，能够完成余额调整操作
- 假设Spring Boot事务机制正常工作，支持并发操作
- 假设Redis缓存服务正常运行，支持分布式锁和限流

---

## Out of Scope (MVP-4 不实现)

- ❌ 自动充值功能（留到后期）
- ❌ 提现功能（留到后期）
- ❌ 转账功能（用户间转账）
- ❌ 钱包冻结/解冻功能（留到后期）
- ❌ 多币种支持（留到后期）
- ❌ 积分奖励系统（留到后期）

---

## Open Questions (根据Q7,Q8,Q12,Q14更新)

1. **[RESOLVED]** 是否支持钱包透支机制？
   - **已确定**: 不支持透支机制，余额不足直接阻止预约（Q7,Q12更新）

2. **[RESOLVED]** 用户是否可以自助充值？
   - **已确定**: 不支持自助充值，仅允许运营在后台手动调整（Q8更新）

3. **[RESOLVED]** 体验课支付是否经过钱包？
   - **已确定**: 体验课通过微信支付直连，不经过钱包（Q5更新）

4. **[NEEDS CLARIFICATION]** 余额预警的触发频率如何控制？
   - 建议: 使用Redis限流，每个用户每天最多触发1次同类型预警，避免骚扰

5. **[NEEDS CLARIFICATION]** 运营调整钱包是否需要审核流程？
   - 建议: 无需审核，直接生效，通过RuoYi操作日志和飞书截图确保透明度

---

## RuoYi部署架构

### 开发环境
```yaml
服务架构:
  - Spring Boot应用 (内置Tomcat)
  - MySQL数据库 (本地/容器)
  - Redis缓存 (本地/容器)
  - RuoYi-Vue-Pro前端开发服务器

配置管理:
  - application-dev.yml
  - RuoYi多环境配置
  - MyBatis-Plus配置
```

### 生产环境
```yaml
服务架构:
  - Spring Boot JAR包部署
  - MySQL主从复制
  - Redis Cluster集群
  - Nginx反向代理
  - RuoYi-Vue-Pro前端构建部署

监控运维:
  - Spring Boot Actuator
  - RuoYi系统监控
  - 操作审计日志
  - 自动化备份
```
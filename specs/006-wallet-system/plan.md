# 实施计划：006-wallet-system (RuoYi架构版)

**功能分支**: `006-wallet-system`
**创建时间**: 2025-11-03
**更新时间**: 2025-11-17 (v2.0.0 RuoYi架构重构)
**状态**: Ready for Implementation
**MVP**: 6
**依赖关系**: MVP-1 (001-user-identity-system), MVP-5 (005-payment-integration)
**输入**: 构建一个支持余额预警、支付通知和运营管理员手动调整课程费用的钱包系统（零透支机制）。

## RuoYi架构实施概述

本计划基于RuoYi-Vue-Pro企业级开发脚手架，采用Spring Boot + MyBatis-Plus + Vue3的完整技术栈，实现企业级钱包管理系统。

### 核心架构特性
- **零透支机制**: 余额不足直接阻止预约，确保资金安全
- **RuoYi集成**: 完整的权限管理、操作审计、代码生成
- **企业级安全**: Spring Boot事务管理、Redis分布式锁
- **高性能**: MyBatis-Plus查询优化、Redis缓存策略

## RuoYi技术栈架构

### 技术选型
```yaml
后端架构:
  - Spring Boot 2.7+: 企业级应用框架
  - MyBatis-Plus 3.5.x: ORM框架
  - MySQL 8.0+: 主数据库
  - Redis 7.0+: 缓存和分布式锁
  - Spring Security: 权限控制
  - Spring Transaction: 事务管理

前端架构:
  - RuoYi-Vue-Pro: 企业级管理后台
  - Vue 3.x: 前端框架
  - Element Plus: UI组件库
  - 微信小程序: 用户端

开发工具:
  - RuoYi代码生成器: 自动生成CRUD代码
  - MyBatis-Plus分页插件: 高效分页查询
  - Spring Boot监控: 应用性能监控
```

### 系统架构分层
```
┌─────────────────────────────────────────┐
│           RuoYi-Vue-Pro管理后台          │
├─────────────────────────────────────────┤
│        Spring Boot应用层                │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Controller  │  │   Service层     │   │
│  │ @RestController│  │  @Service     │   │
│  │ @PreAuthorize│  │ @Transactional│   │
│  └─────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│           MyBatis-Plus层                │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Entity实体  │  │  Mapper接口     │   │
│  │ @TableName  │  │ BaseMapper      │   │
│  │ @TableField │  │ LambdaQuery     │   │
│  └─────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│              数据存储层                  │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ MySQL 8.0   │  │  Redis 7.0      │   │
│  │ 主数据库     │  │  缓存+分布式锁   │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## RuoYi模块设计

### 后端模块结构
```
com.ruoyi.project.gymnastics.wallet
├── domain/                   // MyBatis-Plus实体类
│   ├── GymWallet.java       // 钱包实体
│   ├── GymWalletTransaction.java // 交易记录实体
│   └── GymWalletAdjustment.java  // 调整记录实体
├── mapper/                   // MyBatis-Plus Mapper
│   ├── GymWalletMapper.java
│   ├── GymWalletTransactionMapper.java
│   └── GymWalletAdjustmentMapper.java
├── service/                  // Spring Service层
│   ├── IGymWalletService.java
│   ├── IGymWalletTransactionService.java
│   ├── IGymWalletAdjustmentService.java
│   └── impl/
│       ├── GymWalletServiceImpl.java
│       ├── GymWalletTransactionServiceImpl.java
│       └── GymWalletAdjustmentServiceImpl.java
└── controller/               // REST Controller层
    ├── GymWalletController.java
    ├── GymWalletTransactionController.java
    └── GymWalletAdjustmentController.java
```

### 前端模块结构
```
src/views/gymnastics/wallet
├── index.vue              // 钱包管理主页面
├── walletDetail.vue       // 钱包详情页面
├── transactionList.vue    // 交易记录列表
├── adjustment.vue         // 余额调整页面
└── notification.vue       // 通知管理页面
```

## 实施阶段 (RuoYi架构)

### 阶段1：RuoYi基础设施搭建 (3天)

#### 1.1 数据库设计和MyBatis-Plus集成
**时间**: 1天
**内容**:
- 创建gym_wallet系列表
- 配置MyBatis-Plus连接池和分页插件
- 设置RuoYi标准审计字段
- 配置乐观锁和悲观锁机制

**交付物**:
```sql
-- RuoYi标准表结构
CREATE TABLE `gym_wallet` (
  `wallet_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `balance` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  -- RuoYi标准审计字段
  `create_by` VARCHAR(64),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_by` VARCHAR(64),
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `version` INT DEFAULT 0
);
```

#### 1.2 RuoYi代码生成和基础CRUD
**时间**: 1天
**内容**:
- 使用RuoYi代码生成器生成基础代码
- 配置Spring Boot事务管理
- 实现MyBatis-Plus乐观锁
- 集成RuoYi权限控制

**交付物**:
```java
// RuoYi生成的Service实现
@Service
public class GymWalletServiceImpl extends ServiceImpl<GymWalletMapper, GymWallet> implements IGymWalletService {

    @Autowired
    private GymWalletMapper walletMapper;

    @Override
    @Transactional
    public GymWallet selectGymWalletByUserId(Long userId) {
        LambdaQueryWrapper<GymWallet> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymWallet::getUserId, userId);
        return getOne(wrapper);
    }
}
```

#### 1.3 Redis缓存和分布式锁配置
**时间**: 1天
**内容**:
- 配置Redis连接池和缓存策略
- 实现分布式锁工具类
- 配置Spring Cache注解
- 设置缓存过期策略

**交付物**:
```java
@Component
public class RedisLockUtil {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public boolean tryLock(String key, String value, long expireTime) {
        // Redis分布式锁实现
    }
}
```

### 阶段2：核心钱包业务逻辑 (4天)

#### 2.1 零透支钱包核心服务
**时间**: 2天
**内容**:
- 实现余额检查和扣费逻辑
- 配置Spring Boot事务回滚
- 实现MyBatis-Plus悲观锁
- 集成预约系统集成

**关键实现**:
```java
@Service
@Transactional
public class GymWalletSecurityService {

    /**
     * 安全扣费 - 零透支机制
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean deductBalance(Long walletId, BigDecimal amount, String reason) {
        // 1. 使用悲观锁查询钱包
        GymWallet wallet = walletMapper.selectForUpdate(walletId);

        // 2. 零透支检查
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new ServiceException("余额不足，禁止透支");
        }

        // 3. 扣费操作
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletMapper.updateById(wallet);

        // 4. 记录交易
        recordTransaction(walletId, "deduct", amount.neg(), reason);

        return true;
    }
}
```

#### 2.2 预约系统集成
**时间**: 1天
**内容**:
- 集成课程预约系统
- 实现体验课微信支付直连
- 配置取消预约自动退款
- 支持家庭账号并发扣费

**集成接口**:
```java
@RestController
@RequestMapping("/gym/wallet/booking")
public class GymWalletBookingController {

    @PostMapping("/deduct")
    @PreAuthorize("@ss.hasPermission('gym:wallet:deduct')")
    @Log(title = "预约扣费", businessType = BusinessType.UPDATE)
    public AjaxResult deductForBooking(@RequestBody BookingDeductRequest request) {
        return success(walletSecurityService.deductBalance(
            request.getWalletId(),
            request.getAmount(),
            "课程预约扣费"
        ));
    }
}
```

#### 2.3 交易记录和统计服务
**时间**: 1天
**内容**:
- 实现完整交易记录
- 配置统计查询（排除退款）
- 实现MyBatis-Plus分页查询
- 集成RuoYi导出功能

**统计实现**:
```java
@Service
public class GymWalletStatisticsService {

    /**
     * 统计累计充值（排除退款）
     */
    public BigDecimal getTotalRecharge(Long walletId) {
        return walletTransactionMapper.selectTotalRecharged(walletId);
    }

    /**
     * 统计累计消费（排除退款）
     */
    public BigDecimal getTotalSpent(Long walletId) {
        return walletTransactionMapper.selectTotalSpent(walletId);
    }
}
```

### 阶段3：RuoYi管理后台开发 (4天)

#### 3.1 运营调整管理界面
**时间**: 2天
**内容**:
- 开发Vue3管理界面
- 集成Element Plus表单组件
- 实现RuoYi权限控制
- 配置操作审计日志

**Vue3组件**:
```vue
<template>
  <el-card class="box-card">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="用户选择" prop="userId">
        <el-select v-model="form.userId" placeholder="请选择用户">
          <el-option
            v-for="user in userList"
            :key="user.userId"
            :label="user.userName"
            :value="user.userId"/>
        </el-select>
      </el-form-item>

      <el-form-item label="调整金额" prop="amount">
        <el-input-number v-model="form.amount" :precision="2" :step="100" :min="-10000" :max="10000"/>
      </el-form-item>

      <el-form-item label="调整原因" prop="reason">
        <el-input v-model="form.reason" type="textarea" placeholder="请输入调整原因"/>
      </el-form-item>

      <el-form-item label="收款方式" prop="paymentMethod">
        <el-select v-model="form.paymentMethod" placeholder="请选择收款方式">
          <el-option label="微信" value="wechat"/>
          <el-option label="支付宝" value="alipay"/>
          <el-option label="银行转账" value="bank"/>
          <el-option label="现金" value="cash"/>
        </el-select>
      </el-form-item>
    </el-form>

    <div class="dialog-footer">
      <el-button @click="cancel">取 消</el-button>
      <el-button type="primary" @click="submitForm">确 定</el-button>
    </div>
  </el-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { listWalletAdjustment, addWalletAdjustment } from '@/api/gymnastics/wallet'

const form = reactive({
  userId: null,
  amount: 0,
  reason: '',
  paymentMethod: '',
  externalOrderNo: ''
})

const rules = {
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  amount: [{ required: true, message: '请输入调整金额', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择收款方式', trigger: 'change' }]
}

const submitForm = () => {
  proxy.$refs.formRef.validate(valid => {
    if (valid) {
      addWalletAdjustment(form).then(response => {
        proxy.$modal.msgSuccess("调整成功")
        open.value = false
        getList()
      })
    }
  })
}
</script>
```

#### 3.2 RuoYi权限控制和审计
**时间**: 1天
**内容**:
- 配置@PreAuthorize权限注解
- 实现操作审计@Log注解
- 集成RuoYi数据权限
- 配置敏感操作二次确认

**权限配置**:
```java
@RestController
@RequestMapping("/gym/wallet/adjustment")
public class GymWalletAdjustmentController extends BaseController {

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

#### 3.3 飞书通知集成
**时间**: 1天
**内容**:
- 集成飞书Webhook通知
- 实现调整成功通知
- 配置异常情况告警
- 支持通知模板自定义

**通知服务**:
```java
@Service
public class FeishuNotificationService {

    @Value("${feishu.webhook.url}")
    private String webhookUrl;

    public void sendAdjustmentNotification(GymWalletAdjustment adjustment) {
        JSONObject message = new JSONObject();
        message.put("msg_type", "text");

        JSONObject content = new JSONObject();
        String text = String.format("钱包调整通知：%s 调整了用户 %s 的钱包余额 %.2f 元，原因：%s",
            adjustment.getCreateBy(),
            adjustment.getUserId(),
            adjustment.getAmount(),
            adjustment.getReason());
        content.put("text", text);
        message.put("content", content);

        // 发送飞书通知
        restTemplate.postForObject(webhookUrl, message, String.class);
    }
}
```

### 阶段4：通知和预警系统 (3天)

#### 4.1 Spring Boot定时任务
**时间**: 1天
**内容**:
- 配置@Scheduled定时任务
- 实现余额阈值检查
- 集成Redis限流机制
- 支持任务监控和告警

**定时任务实现**:
```java
@Component
public class GymWalletScheduledTasks {

    @Autowired
    private IGymWalletService walletService;

    /**
     * 每小时检查余额预警
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void checkLowBalance() {
        List<GymWallet> lowBalanceWallets = walletService.selectLowBalanceWallets();

        for (GymWallet wallet : lowBalanceWallets) {
            if (shouldSendAlert(wallet.getUserId())) {
                sendLowBalanceAlert(wallet);
            }
        }
    }

    /**
     * 每天凌晨1点生成日报
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void generateDailyReport() {
        // 生成钱包运营日报
    }
}
```

#### 4.2 微信服务通知集成
**时间**: 1天
**内容**:
- 集成微信服务通知API
- 实现模板消息发送
- 配置通知重试机制
- 支持通知状态跟踪

**微信通知服务**:
```java
@Service
public class WeChatNotificationService {

    @Autowired
    private WeChatTemplateService templateService;

    public void sendLowBalanceAlert(Long userId, BigDecimal balance) {
        WeChatTemplateMessage message = new WeChatTemplateMessage();
        message.setTemplateId("low_balance_template");
        message.setTouser(getOpenIdByUserId(userId));

        Map<String, Object> data = new HashMap<>();
        data.put("balance", balance.toString());
        data.put("threshold", "200.00");
        data.put("time", new Date());

        message.setData(data);
        templateService.sendTemplateMessage(message);
    }
}
```

#### 4.3 Redis限流和缓存策略
**时间**: 1天
**内容**:
- 实现Redis分布式锁
- 配置通知频率限制
- 优化钱包余额缓存
- 支持缓存预热和失效

**限流实现**:
```java
@Service
public class NotificationLimitService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    public boolean isAllowed(String key, int maxCount, long timeWindow) {
        String redisKey = "notification:limit:" + key;

        Long currentCount = redisTemplate.opsForValue().increment(redisKey);
        if (currentCount == 1) {
            redisTemplate.expire(redisKey, timeWindow, TimeUnit.SECONDS);
        }

        return currentCount <= maxCount;
    }
}
```

### 阶段5：性能优化和安全加固 (3天)

#### 5.1 MyBatis-Plus查询优化
**时间**: 1天
**内容**:
- 优化SQL查询性能
- 配置数据库索引
- 实现查询结果缓存
- 支持分页查询优化

**查询优化**:
```java
@Service
public class GymWalletQueryOptimizer {

    /**
     * 优化的交易记录查询
     */
    public Page<GymWalletTransaction> selectTransactionPageOptimized(Long walletId, int pageNum, int pageSize) {
        Page<GymWalletTransaction> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<GymWalletTransaction> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymWalletTransaction::getWalletId, walletId)
               .orderByDesc(GymWalletTransaction::getCreateTime)
               .select(GymWalletTransaction::getTransactionId,
                      GymWalletTransaction::getType,
                      GymWalletTransaction::getAmount,
                      GymWalletTransaction::getCreateTime);

        return transactionMapper.selectPage(page, wrapper);
    }
}
```

#### 5.2 RuoYi安全加固
**时间**: 1天
**内容**:
- 配置Spring Security权限
- 实现敏感数据加密
- 加强操作审计日志
- 配置防重复提交

**安全配置**:
```java
@Configuration
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .antMatchers("/gym/wallet/**").hasAnyRole("ADMIN", "OPERATOR")
            .anyRequest().authenticated()
            .and()
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);
    }
}
```

#### 5.3 监控和告警系统
**时间**: 1天
**内容**:
- 集成Spring Boot Actuator
- 配置应用性能监控
- 实现业务指标监控
- 支持异常告警机制

**监控实现**:
```java
@Component
public class GymWalletMetrics {

    private final MeterRegistry meterRegistry;
    private final Counter walletDeductCounter;
    private final Gauge totalBalanceGauge;

    public GymWalletMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.walletDeductCounter = Counter.builder("wallet.deduct.count")
            .description("钱包扣费次数")
            .register(meterRegistry);
        this.totalBalanceGauge = Gauge.builder("wallet.total.balance")
            .description("钱包总余额")
            .register(meterRegistry, this, GymWalletMetrics::calculateTotalBalance);
    }

    public void recordDeduct() {
        walletDeductCounter.increment();
    }

    private double calculateTotalBalance() {
        // 计算所有钱包总余额
        return walletService.selectTotalBalance().doubleValue();
    }
}
```

## API设计 (RuoYi标准)

### 钱包管理API
```java
@RestController
@RequestMapping("/gym/wallet")
public class GymWalletController extends BaseController {

    @GetMapping("/user/{userId}")
    @PreAuthorize("@ss.hasPermission('gym:wallet:query')")
    public AjaxResult getWalletByUserId(@PathVariable Long userId) {
        GymWallet wallet = walletService.selectGymWalletByUserId(userId);
        return success(wallet);
    }

    @GetMapping("/balance/{userId}")
    @PreAuthorize("@ss.hasPermission('gym:wallet:query')")
    public AjaxResult getBalance(@PathVariable Long userId) {
        BigDecimal balance = walletService.getBalanceByUserId(userId);
        return success(balance);
    }

    @GetMapping("/transactions")
    @PreAuthorize("@ss.hasPermission('gym:wallet:transaction:list')")
    public TableDataInfo getTransactions(GymWalletTransaction transaction) {
        startPage();
        List<GymWalletTransaction> list = transactionService.selectGymWalletTransactionList(transaction);
        return getDataTable(list);
    }
}
```

### 运营调整API
```java
@RestController
@RequestMapping("/gym/wallet/adjustment")
public class GymWalletAdjustmentController extends BaseController {

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

## 部署架构

### 开发环境
```yaml
服务配置:
  Spring Boot:
    - 内置Tomcat服务器
    - 开发数据库连接池
    - 热重载开发支持
  MySQL:
    - 单实例开发数据库
    - 基础索引配置
  Redis:
    - 单实例缓存服务
    - 开发环境配置
  前端:
    - Vue3开发服务器
    - 热重载支持
    - 开发环境代理
```

### 生产环境
```yaml
服务配置:
  Spring Boot:
    - JAR包部署
    - 生产环境连接池
    - 性能监控集成
  MySQL:
    - 主从复制配置
    - 读写分离
    - 定时备份策略
  Redis:
    - Cluster集群部署
    - 高可用配置
    - 持久化策略
  前端:
    - Nginx静态资源服务
    - Vue3构建部署
    - CDN加速配置
  监控:
    - Spring Boot Actuator
    - Prometheus监控
    - ELK日志收集
```

## 质量保证

### 测试策略
```yaml
单元测试:
  - JUnit 5 + Mockito
  - MyBatis-Plus测试支持
  - Spring Boot Test
  - 覆盖率要求 > 80%

集成测试:
  - 数据库集成测试
  - Redis集成测试
  - 微信API模拟测试
  - 完整业务流程测试

性能测试:
  - JMeter压力测试
  - 并发扣费测试
  - 数据库性能测试
  - Redis缓存性能测试
```

### 代码质量
```yaml
代码规范:
  - Alibaba Java开发手册
  - Checkstyle静态检查
  - SonarQube代码分析
  - 代码审查流程

安全要求:
  - SQL注入防护
  - XSS攻击防护
  - CSRF保护
  - 敏感数据加密
```

## 成功标准

### 功能标准
- [ ] 100% 钱包余额计算准确性
- [ ] 零透支机制完整实现
- [ ] RuoYi权限控制正常工作
- [ ] 操作审计日志完整性
- [ ] 通知系统及时送达

### 性能标准
- [ ] 钱包查询响应时间 < 2秒
- [ ] 并发扣费支持 100+ TPS
- [ ] 系统可用性 > 99.9%
- [ ] 数据库查询优化完成

### 安全标准
- [ ] 所有财务操作审计
- [ ] 权限控制完整
- [ ] 敏感数据加密
- [ ] 安全测试通过

---

这个实施计划完全基于RuoYi-Vue-Pro架构，确保企业级的开发规范、安全性和可维护性，同时满足所有业务需求（特别是零透支机制）。
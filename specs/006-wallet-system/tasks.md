# 实施任务： 006-wallet-system (RuoYi架构版)

**功能分支**: `006-wallet-system`
**创建时间**: 2025-11-03
**更新时间**: 2025-11-17 (v2.0.0 RuoYi架构重构)
**状态**: Ready for Implementation
**MVP**: 6
**依赖关系**: MVP-1 (001-user-identity-system), MVP-5 (005-payment-integration)

## RuoYi架构任务分解

### Phase 1: RuoYi基础设施搭建 (3 天)

#### Task 1.1: 创建RuoYi标准数据库架构
**依赖关系**: None
**预估时间**: 4 hours
**描述**: 创建基于RuoYi标准的钱包系列数据库表，配置MyBatis-Plus集成
**验收标准**:
- [ ] gym_wallet表（基于RuoYi标准审计字段）
- [ ] gym_wallet_transaction表（交易记录表）
- [ ] gym_wallet_adjustment表（调整记录表）
- [ ] gym_balance_notification表（通知记录表）
- [ ] 所有表包含RuoYi标准字段（create_by, create_time, update_by, update_time, remark）
- [ ] 配置MyBatis-Plus乐观锁version字段
- [ ] 数据库索引优化（user_id, wallet_id外键索引）

**RuoYi交付物**:
```sql
-- RuoYi标准钱包表
CREATE TABLE `gym_wallet` (
  `wallet_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` BIGINT NOT NULL COMMENT '所属用户ID',
  `balance` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '钱包余额（仅允许非负数）',
  `credit_limit` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '信用额度（固定0，禁止透支）',
  `status` CHAR(1) DEFAULT '0' COMMENT '钱包状态（0正常 1冻结 2删除）',
  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',
  `version` INT DEFAULT 0 COMMENT '乐观锁版本号',
  UNIQUE KEY `uk_user_wallet` (`user_id`),
  INDEX `idx_balance` (`balance`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包主表（基于RuoYi扩展）';
```

---

#### Task 1.2: 配置RuoYi代码生成和基础CRUD
**依赖关系**: Task 1.1
**预估时间**: 6 hours
**描述**: 使用RuoYi代码生成器生成钱包模块的基础CRUD代码
**验收标准**:
- [ ] GymWallet.java实体类（基于RuoYi BaseEntity）
- [ ] GymWalletMapper.java（继承BaseMapper）
- [ ] IGymWalletService.java接口
- [ ] GymWalletServiceImpl.java（继承ServiceImpl）
- [ ] GymWalletController.java（基于RuoYi BaseController）
- [ ] 配置MyBatis-Plus分页插件
- [ ] 集成RuoYi统一响应格式AjaxResult
- [ ] 单元测试覆盖率 > 80%

**RuoYi关键实现**:
```java
// 基于RuoYi的Service实现
@Service
public class GymWalletServiceImpl extends ServiceImpl<GymWalletMapper, GymWallet> implements IGymWalletService {

    @Override
    @DataSource(value = DataSourceType.MASTER)
    public GymWallet selectGymWalletByUserId(Long userId) {
        LambdaQueryWrapper<GymWallet> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymWallet::getUserId, userId)
               .eq(GymWallet::getStatus, "0");
        return getOne(wrapper);
    }

    @Override
    @Transactional
    public int insertGymWallet(GymWallet gymWallet) {
        gymWallet.setCreateTime(DateUtils.getNowDate());
        return baseMapper.insert(gymWallet);
    }
}
```

---

#### Task 1.3: 配置Redis缓存和分布式锁
**依赖关系**: Task 1.2
**预估时间**: 4 hours
**描述**: 配置Redis缓存策略和分布式锁，支持高并发钱包操作
**验收标准**:
- [ ] Redis连接池配置优化
- [ ] 钱包余额缓存策略（1小时过期）
- [ ] Redis分布式锁工具类
- [ ] Spring Cache注解配置
- [ ] 缓存预热和失效机制
- [ ] Redis监控和告警

**RuoYi Redis配置**:
```java
@Component
public class GymWalletRedisUtils {

    private static final String WALLET_BALANCE_KEY = "wallet:balance:";
    private static final String WALLET_LOCK_KEY = "wallet:lock:";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 缓存钱包余额
     */
    public void cacheBalance(Long userId, BigDecimal balance) {
        String key = WALLET_BALANCE_KEY + userId;
        redisTemplate.opsForValue().set(key, balance, 1, TimeUnit.HOURS);
    }

    /**
     * 获取分布式锁
     */
    public boolean tryLock(Long userId, String requestId, long expireTime) {
        String key = WALLET_LOCK_KEY + userId;
        return redisTemplate.opsForValue().setIfAbsent(key, requestId, expireTime, TimeUnit.SECONDS);
    }
}
```

---

### Phase 2: 零透支钱包核心业务逻辑 (4 天)

#### Task 2.1: 实现零透支钱包安全服务
**依赖关系**: Task 1.3
**预估时间**: 8 hours
**描述**: 实现核心钱包业务逻辑，确保零透支机制和事务安全
**验收标准**:
- [ ] 零透支余额检查（balance >= 0）
- [ ] Spring Boot事务管理（@Transactional）
- [ ] MyBatis-Plus悲观锁（selectForUpdate）
- [ ] 余额精度处理（BigDecimal）
- [ ] 乐观锁版本控制
- [ ] 异常回滚机制
- [ ] 完整的操作日志记录

**核心业务实现**:
```java
@Service
@Transactional
public class GymWalletSecurityService {

    @Autowired
    private GymWalletMapper walletMapper;

    @Autowired
    private GymWalletTransactionMapper transactionMapper;

    /**
     * 安全扣费 - 零透支机制
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean deductBalance(Long userId, BigDecimal amount, String reason) {
        // 1. 获取用户钱包
        GymWallet wallet = walletMapper.selectByUserId(userId);
        if (wallet == null) {
            throw new ServiceException("用户钱包不存在");
        }

        // 2. 零透支检查
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new ServiceException("余额不足，禁止透支");
        }

        // 3. 使用乐观锁更新余额
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setUpdateTime(new Date());
        int updateResult = walletMapper.updateById(wallet);

        if (updateResult == 0) {
            throw new ServiceException("余额更新失败，请重试");
        }

        // 4. 记录交易
        recordTransaction(wallet.getWalletId(), amount.negate(), reason);

        return true;
    }
}
```

---

#### Task 2.2: 集成预约系统业务逻辑
**依赖关系**: Task 2.1, MVP-5完成
**预估时间**: 6 hours
**描述**: 集成课程预约系统，实现体验课微信支付直连和正式课钱包扣费
**验收标准**:
- [ ] 预约扣费接口集成
- [ ] 体验课微信支付直连（不经过钱包）
- [ ] 正式课钱包扣费（零透支检查）
- [ ] 取消预约自动退款（开课前≥6小时）
- [ ] 家庭账号并发扣费处理
- [ ] 预约失败事务回滚

**预约集成实现**:
```java
@RestController
@RequestMapping("/gym/wallet/booking")
public class GymWalletBookingController extends BaseController {

    @PostMapping("/deduct")
    @PreAuthorize("@ss.hasPermission('gym:wallet:deduct')")
    @Log(title = "预约扣费", businessType = BusinessType.UPDATE)
    public AjaxResult deductForBooking(@Validated @RequestBody BookingDeductRequest request) {
        // 体验课跳转微信支付
        if ("trial".equals(request.getCourseType())) {
            return success(redirectToWechatPay(request));
        }

        // 正式课使用钱包扣费
        boolean result = walletSecurityService.deductBalance(
            request.getUserId(),
            request.getAmount(),
            "课程预约扣费"
        );

        return success(result);
    }

    @PostMapping("/refund")
    @PreAuthorize("@ss.hasPermission('gym:wallet:refund')")
    @Log(title = "预约退款", businessType = BusinessType.UPDATE)
    public AjaxResult refundForBooking(@Validated @RequestBody BookingRefundRequest request) {
        // 检查退款时间窗口（开课前≥6小时）
        if (!isRefundAllowed(request.getBookingTime())) {
            return error("开课前6小时内不支持退款");
        }

        boolean result = walletSecurityService.addBalance(
            request.getUserId(),
            request.getAmount(),
            "预约取消退款"
        );

        return success(result);
    }
}
```

---

#### Task 2.3: 实现交易记录和统计服务
**依赖关系**: Task 2.2
**预估时间**: 6 hours
**描述**: 实现完整的交易记录系统，支持统计查询和数据导出
**验收标准**:
- [ ] 完整交易记录（充值、扣费、调整、退款）
- [ ] 交易前后余额记录
- [ ] 累计充值/消费统计（排除退款）
- [ ] MyBatis-Plus分页查询
- [ ] RuoYi数据导出功能
- [ ] 交易记录不可篡改

**统计服务实现**:
```java
@Service
public class GymWalletStatisticsService {

    @Autowired
    private GymWalletTransactionMapper transactionMapper;

    /**
     * 获取用户钱包统计信息
     */
    public GymWalletStatistics getUserStatistics(Long userId) {
        GymWallet wallet = walletService.selectGymWalletByUserId(userId);
        if (wallet == null) {
            return null;
        }

        GymWalletStatistics statistics = new GymWalletStatistics();
        statistics.setWalletId(wallet.getWalletId());
        statistics.setCurrentBalance(wallet.getBalance());

        // 统计累计充值（排除退款）
        statistics.setTotalRecharge(
            transactionMapper.selectTotalRecharged(wallet.getWalletId())
        );

        // 统计累计消费（排除退款）
        statistics.setTotalSpent(
            transactionMapper.selectTotalSpent(wallet.getWalletId())
        );

        return statistics;
    }
}
```

---

### Phase 3: RuoYi管理后台开发 (4 天)

#### Task 3.1: 开发Vue3钱包管理界面
**依赖关系**: Task 2.3
**预估时间**: 10 hours
**描述**: 基于RuoYi-Vue-Pro开发钱包管理的Vue3前端界面
**验收标准**:
- [ ] 钱包列表查询页面（index.vue）
- [ ] 钱包详情查看页面（walletDetail.vue）
- [ ] 交易记录列表页面（transactionList.vue）
- [ ] 钱包余额调整页面（adjustment.vue）
- [ ] Element Plus表单验证
- [ ] RuoYi权限控制集成
- [ ] 响应式布局设计

**Vue3管理界面实现**:
```vue
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户名称" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入用户名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="钱包状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="钱包状态" clearable>
          <el-option label="正常" value="0"/>
          <el-option label="冻结" value="1"/>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdjust"
          v-hasPermi="['gym:wallet:adjustment']"
        >余额调整</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['gym:wallet:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="walletList">
      <el-table-column label="用户ID" align="center" prop="userId"/>
      <el-table-column label="用户名称" align="center" prop="userName"/>
      <el-table-column label="当前余额" align="center" prop="balance">
        <template slot-scope="scope">
          <span v-if="scope.row.balance >= 0" style="color: #67C23A">
            ¥{{ scope.row.balance }}
          </span>
          <span v-else style="color: #F56C6C">
            ¥{{ scope.row.balance }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="累计充值" align="center" prop="totalRecharged"/>
      <el-table-column label="累计消费" align="center" prop="totalSpent"/>
      <el-table-column label="状态" align="center" prop="status">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['gym:wallet:query']"
          >详情</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleAdjust(scope.row)"
            v-hasPermi="['gym:wallet:adjustment']"
          >调整</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup>
import { listWallet, getWallet, adjustBalance } from "@/api/gymnastics/wallet"

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const walletList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  userName: '',
  status: ''
})

function getList() {
  loading.value = true
  listWallet(queryParams.value).then(response => {
    walletList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleAdjust(row) {
  // 调用余额调整对话框
  proxy.$refs.adjustmentRef.show(row)
}
</script>
```

---

#### Task 3.2: 实现RuoYi权限控制和操作审计
**依赖关系**: Task 3.1
**预估时间**: 6 hours
**描述**: 集成RuoYi的权限控制和操作审计功能
**验收标准**:
- [ ] @PreAuthorize权限注解配置
- [ ] @Log操作审计注解
- [ ] RuoYi数据权限控制
- [ ] 敏感操作二次确认
- [ ] 操作日志查询和分析
- [ ] 权限角色管理集成

**权限控制实现**:
```java
@RestController
@RequestMapping("/gym/wallet")
public class GymWalletController extends BaseController {

    @Autowired
    private IGymWalletService walletService;

    /**
     * 查询钱包列表
     */
    @GetMapping("/list")
    @PreAuthorize("@ss.hasPermission('gym:wallet:list')")
    public TableDataInfo list(GymWallet wallet) {
        startPage();
        List<GymWallet> list = walletService.selectGymWalletList(wallet);
        return getDataTable(list);
    }

    /**
     * 调整钱包余额
     */
    @Log(title = "钱包余额调整", businessType = BusinessType.UPDATE)
    @PostMapping("/adjust")
    @PreAuthorize("@ss.hasPermission('gym:wallet:adjust')")
    public AjaxResult adjust(@RequestBody GymWalletAdjustRequest request) {
        // 二次确认敏感操作
        if (!request.getConfirmed()) {
            return error("请确认调整操作");
        }

        request.setCreateBy(getUsername());
        return toAjax(walletService.adjustBalance(request));
    }

    /**
     * 导出钱包数据
     */
    @Log(title = "钱包数据导出", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    @PreAuthorize("@ss.hasPermission('gym:wallet:export')")
    public void export(HttpServletResponse response, GymWallet wallet) {
        List<GymWallet> list = walletService.selectGymWalletList(wallet);
        ExcelUtil<GymWallet> util = new ExcelUtil<GymWallet>(GymWallet.class);
        util.exportExcel(response, list, "钱包数据");
    }
}
```

---

#### Task 3.3: 集成飞书通知和异常告警
**依赖关系**: Task 3.2
**预估时间**: 6 hours
**描述**: 集成飞书Webhook通知，实现调整通知和异常告警
**验收标准**:
- [ ] 飞书Webhook通知集成
- [ ] 钱包调整成功通知
- [ ] 异常情况告警机制
- [ ] 通知模板自定义
- [ ] 通知发送状态跟踪
- [ ] 通知重试机制

**飞书通知实现**:
```java
@Service
public class FeishuNotificationService {

    @Value("${feishu.webhook.url}")
    private String webhookUrl;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * 发送钱包调整通知
     */
    public void sendAdjustmentNotification(GymWalletAdjustment adjustment) {
        try {
            JSONObject message = new JSONObject();
            message.put("msg_type", "interactive");

            JSONObject card = new JSONObject();
            card.put("config", Map.of("wide_screen_mode", true));

            JSONObject header = new JSONObject();
            header.put("title", Map.of("tag", "plain_text", "content", "钱包余额调整通知"));
            header.put("template", "blue");
            card.put("header", header);

            JSONObject elements = new JSONObject();
            List<Map<String, Object>> elementList = new ArrayList<>();

            // 操作人信息
            elementList.add(Map.of(
                "tag", "div",
                "text", Map.of(
                    "tag", "lark_md",
                    "content", String.format("**操作人**: %s", adjustment.getCreateBy())
                )
            ));

            // 调整信息
            elementList.add(Map.of(
                "tag", "div",
                "text", Map.of(
                    "tag", "lark_md",
                    "content", String.format("**调整金额**: %.2f 元", adjustment.getAmount())
                )
            ));

            // 调整原因
            elementList.add(Map.of(
                "tag", "div",
                "text", Map.of(
                    "tag", "lark_md",
                    "content", String.format("**调整原因**: %s", adjustment.getReason())
                )
            ));

            elements.put("elements", elementList);
            card.put("elements", elements);
            message.put("card", card);

            // 发送通知
            ResponseEntity<String> response = restTemplate.postForEntity(webhookUrl, message, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("飞书通知发送失败: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("飞书通知发送异常", e);
        }
    }
}
```

---

### Phase 4: 通知和预警系统 (3 天)

#### Task 4.1: 实现Spring Boot定时任务
**依赖关系**: Task 3.3
**预估时间**: 6 hours
**描述**: 实现Spring Boot定时任务，支持余额预警和系统监控
**验收标准**:
- [ ] @Scheduled定时任务配置
- [ ] 余额低于200元预警检查
- [ ] 每日运营报告生成
- [ ] 定时任务监控和告警
- [ ] 任务执行日志记录
- [ ] 异常任务处理机制

**定时任务实现**:
```java
@Component
@EnableScheduling
public class GymWalletScheduledTasks {

    @Autowired
    private IGymWalletService walletService;

    @Autowired
    private GymWalletNotificationService notificationService;

    private static final Logger log = LoggerFactory.getLogger(GymWalletScheduledTasks.class);

    /**
     * 每小时检查余额预警
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void checkLowBalanceAlerts() {
        try {
            log.info("开始执行余额预警检查任务");

            List<GymWallet> lowBalanceWallets = walletService.selectLowBalanceWallets();

            for (GymWallet wallet : lowBalanceWallets) {
                if (shouldSendAlert(wallet.getUserId())) {
                    notificationService.sendLowBalanceAlert(wallet);
                }
            }

            log.info("余额预警检查任务完成，处理了 {} 个钱包", lowBalanceWallets.size());

        } catch (Exception e) {
            log.error("余额预警检查任务执行失败", e);
        }
    }

    /**
     * 每天凌晨1点生成运营日报
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void generateDailyReport() {
        try {
            log.info("开始生成钱包运营日报");

            GymWalletDailyReport report = walletService.generateDailyReport();

            // 发送日报到飞书群
            notificationService.sendDailyReport(report);

            log.info("钱包运营日报生成完成");

        } catch (Exception e) {
            log.error("钱包运营日报生成失败", e);
        }
    }

    /**
     * 每周清理过期通知记录
     */
    @Scheduled(cron = "0 0 2 ? * MON")
    public void cleanupExpiredNotifications() {
        try {
            log.info("开始清理过期通知记录");

            int cleanedCount = notificationService.cleanupExpiredNotifications();

            log.info("过期通知记录清理完成，清理了 {} 条记录", cleanedCount);

        } catch (Exception e) {
            log.error("过期通知记录清理失败", e);
        }
    }
}
```

---

#### Task 4.2: 集成微信服务通知
**依赖关系**: Task 4.1
**预估时间**: 8 hours
**描述**: 集成微信服务通知API，实现模板消息推送
**验收标准**:
- [ ] 微信服务通知API集成
- [ ] 模板消息发送功能
- [ ] 余额不足预警通知
- [ ] 余额调整通知
- [ ] 通知发送状态跟踪
- [ ] 通知失败重试机制

**微信通知实现**:
```java
@Service
public class WeChatNotificationService {

    @Autowired
    private WeChatTemplateService templateService;

    @Autowired
    private ISysUserService userService;

    private static final Logger log = LoggerFactory.getLogger(WeChatNotificationService.class);

    /**
     * 发送余额不足预警通知
     */
    public void sendLowBalanceAlert(GymWallet wallet) {
        try {
            // 获取用户微信OpenID
            SysUser user = userService.selectUserById(wallet.getUserId());
            if (user == null || StringUtils.isEmpty(user.getOpenid())) {
                log.warn("用户 {} 没有绑定微信，无法发送通知", wallet.getUserId());
                return;
            }

            WeChatTemplateMessage message = new WeChatTemplateMessage();
            message.setTemplateId("low_balance_alert_template");
            message.setTouser(user.getOpenid());
            message.setPage("/pages/wallet/index");

            Map<String, WeChatTemplateData> data = new HashMap<>();
            data.put("balance", new WeChatTemplateData(wallet.getBalance().toString(), "#FF0000"));
            data.put("threshold", new WeChatTemplateData("200.00", "#173177"));
            data.put("time", new WeChatTemplateData(DateUtils.getNowDate(), "#173177"));
            data.put("remark", new WeChatTemplateData("请及时充值，以免影响课程预约。", "#173177"));

            message.setData(data);

            // 发送模板消息
            boolean result = templateService.sendTemplateMessage(message);

            if (result) {
                log.info("余额不足预警通知发送成功，用户ID: {}, 余额: {}",
                    wallet.getUserId(), wallet.getBalance());
            } else {
                log.error("余额不足预警通知发送失败，用户ID: {}", wallet.getUserId());
            }

        } catch (Exception e) {
            log.error("发送余额不足预警通知异常，用户ID: {}", wallet.getUserId(), e);
        }
    }

    /**
     * 发送余额调整通知
     */
    public void sendBalanceAdjustmentNotification(GymWalletAdjustment adjustment) {
        try {
            SysUser user = userService.selectUserById(adjustment.getUserId());
            if (user == null || StringUtils.isEmpty(user.getOpenid())) {
                log.warn("用户 {} 没有绑定微信，无法发送通知", adjustment.getUserId());
                return;
            }

            WeChatTemplateMessage message = new WeChatTemplateMessage();
            message.setTemplateId("balance_adjustment_template");
            message.setTouser(user.getOpenid());
            message.setPage("/pages/wallet/index");

            String amountText = adjustment.getAdjustmentType().equals("increase") ?
                "+" + adjustment.getAmount().toString() :
                "-" + adjustment.getAmount().toString();

            Map<String, WeChatTemplateData> data = new HashMap<>();
            data.put("amount", new WeChatTemplateData(amountText, "#FF0000"));
            data.put("reason", new WeChatTemplateData(adjustment.getReason(), "#173177"));
            data.put("time", new WeChatTemplateData(DateUtils.getNowDate(), "#173177"));
            data.put("balance", new WeChatTemplateData(getCurrentBalance(adjustment.getUserId()).toString(), "#173177"));

            message.setData(data);

            templateService.sendTemplateMessage(message);

        } catch (Exception e) {
            log.error("发送余额调整通知异常", e);
        }
    }
}
```

---

#### Task 4.3: 优化Redis限流和缓存策略
**依赖关系**: Task 4.2
**预估时间**: 6 hours
**描述**: 优化Redis缓存策略和通知限流机制
**验收标准**:
- [ ] Redis分布式锁优化
- [ ] 通知频率限制（24小时不重复）
- [ ] 钱包余额缓存策略
- [ ] 缓存预热和失效机制
- [ ] Redis性能监控
- [ ] 缓存命中率统计

**限流服务实现**:
```java
@Service
public class NotificationLimitService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final String LIMIT_PREFIX = "notification:limit:";
    private static final int DEFAULT_MAX_COUNT = 1; // 默认最大次数
    private static final long DEFAULT_TIME_WINDOW = 24 * 60 * 60; // 默认24小时

    /**
     * 检查是否允许发送通知
     */
    public boolean isAllowed(Long userId, String notificationType) {
        String key = LIMIT_PREFIX + notificationType + ":" + userId;

        return isAllowed(key, DEFAULT_MAX_COUNT, DEFAULT_TIME_WINDOW);
    }

    /**
     * 检查是否允许发送通知（自定义限制）
     */
    public boolean isAllowed(String key, int maxCount, long timeWindow) {
        try {
            // 获取当前计数
            Long currentCount = redisTemplate.opsForValue().increment(key);

            // 第一次设置，添加过期时间
            if (currentCount == 1) {
                redisTemplate.expire(key, timeWindow, TimeUnit.SECONDS);
            }

            return currentCount <= maxCount;

        } catch (Exception e) {
            log.error("检查通知限流异常: {}", key, e);
            // 异常情况下允许发送，避免影响业务
            return true;
        }
    }

    /**
     * 重置限流计数
     */
    public void resetLimit(Long userId, String notificationType) {
        String key = LIMIT_PREFIX + notificationType + ":" + userId;
        redisTemplate.delete(key);
    }

    /**
     * 获取限流信息
     */
    public Map<String, Object> getLimitInfo(Long userId, String notificationType) {
        String key = LIMIT_PREFIX + notificationType + ":" + userId;

        Map<String, Object> info = new HashMap<>();
        info.put("key", key);
        info.put("count", redisTemplate.opsForValue().get(key));
        info.put("ttl", redisTemplate.getExpire(key, TimeUnit.SECONDS));

        return info;
    }
}
```

---

### Phase 5: 性能优化和安全加固 (3 天)

#### Task 5.1: MyBatis-Plus查询性能优化
**依赖关系**: Task 4.3
**预估时间**: 6 hours
**描述**: 优化MyBatis-Plus查询性能，提升系统响应速度
**验收标准**:
- [ ] SQL查询优化
- [ ] 数据库索引优化
- [ ] 查询结果缓存
- [ ] 分页查询优化
- [ ] 慢查询监控
- [ ] 查询性能测试

**查询优化实现**:
```java
@Service
public class GymWalletQueryOptimizer {

    @Autowired
    private GymWalletMapper walletMapper;

    @Autowired
    private GymWalletTransactionMapper transactionMapper;

    /**
     * 优化的交易记录查询
     */
    public Page<GymWalletTransaction> selectTransactionPageOptimized(Long userId, int pageNum, int pageSize) {
        Page<GymWalletTransaction> page = new Page<>(pageNum, pageSize);

        // 使用索引优化的查询条件
        LambdaQueryWrapper<GymWalletTransaction> wrapper = new LambdaQueryWrapper<>();
        wrapper.inSql(GymWalletTransaction::getWalletId,
                     "SELECT wallet_id FROM gym_wallet WHERE user_id = " + userId)
               .orderByDesc(GymWalletTransaction::getCreateTime)
               // 只查询需要的字段，减少数据传输
               .select(GymWalletTransaction::getTransactionId,
                      GymWalletTransaction::getType,
                      GymWalletTransaction::getAmount,
                      GymWalletTransaction::getBalanceAfter,
                      GymWalletTransaction::getCreateTime,
                      GymWalletTransaction::getNotes);

        return transactionMapper.selectPage(page, wrapper);
    }

    /**
     * 优化的钱包统计查询
     */
    public Map<String, Object> getWalletStatisticsOptimized(Long userId) {
        // 使用原生SQL进行统计查询，减少数据库交互次数
        Map<String, Object> statistics = walletMapper.selectWalletStatistics(userId);
        return statistics;
    }
}
```

---

#### Task 5.2: RuoYi安全加固和数据保护
**依赖关系**: Task 5.1
**预估时间**: 6 hours
**描述**: 加强系统安全性和敏感数据保护
**验收标准**:
- [ ] Spring Security权限强化
- [ ] 敏感数据加密存储
- [ ] SQL注入防护
- [ ] XSS攻击防护
- [ ] CSRF保护
- [ ] 安全测试通过

**安全加固实现**:
```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WalletSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private JwtAuthenticationTokenFilter authenticationTokenFilter;

    @Autowired
    private AuthenticationEntryPointImpl unauthorizedHandler;

    @Autowired
    private AccessDeniedHandlerImpl accessDeniedHandler;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            // CSRF禁用，因为不使用session
            .csrf().disable()
            // 认证失败处理类
            .exceptionHandling().authenticationEntryPoint(unauthorizedHandler).accessDeniedHandler(accessDeniedHandler)
            .and()
            // 基于token，所以不需要session
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            // 过滤请求
            .authorizeRequests()
            // 钱包相关接口需要权限
            .antMatchers("/gym/wallet/**").hasAnyRole("admin", "operator", "finance")
            // 其他接口需要认证
            .anyRequest().authenticated()
            .and()
            // 添加JWT filter
            .addFilterBefore(authenticationTokenFilter, UsernamePasswordAuthenticationFilter.class)
            // 添加CORS filter
            .cors();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

/**
 * 敏感数据加密工具
 */
@Component
public class DataEncryptionUtils {

    private static final String AES_KEY = "gym_wallet_secret_key_2025";

    /**
     * 加密敏感字段
     */
    public static String encryptSensitiveData(String data) {
        if (StringUtils.isEmpty(data)) {
            return data;
        }

        try {
            // 使用AES加密
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            SecretKeySpec keySpec = new SecretKeySpec(AES_KEY.getBytes(), "AES");
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            byte[] encrypted = cipher.doFinal(data.getBytes());
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            log.error("数据加密失败", e);
            throw new ServiceException("数据加密失败");
        }
    }

    /**
     * 解密敏感字段
     */
    public static String decryptSensitiveData(String encryptedData) {
        if (StringUtils.isEmpty(encryptedData)) {
            return encryptedData;
        }

        try {
            // 使用AES解密
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            SecretKeySpec keySpec = new SecretKeySpec(AES_KEY.getBytes(), "AES");
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            byte[] decoded = Base64.getDecoder().decode(encryptedData);
            byte[] decrypted = cipher.doFinal(decoded);
            return new String(decrypted);
        } catch (Exception e) {
            log.error("数据解密失败", e);
            throw new ServiceException("数据解密失败");
        }
    }
}
```

---

#### Task 5.3: 系统监控和告警配置
**依赖关系**: Task 5.2
**预估时间**: 6 hours
**描述**: 配置系统监控和业务指标告警
**验收标准**:
- [ ] Spring Boot Actuator监控
- [ ] 业务指标监控（扣费次数、余额总额等）
- [ ] 异常告警配置
- [ ] 性能监控集成
- [ ] 日志收集和分析
- [ ] 监控仪表板配置

**监控实现**:
```java
@Component
public class GymWalletMetrics {

    private final MeterRegistry meterRegistry;
    private final Counter walletDeductCounter;
    private final Counter walletAdjustmentCounter;
    private final Gauge totalBalanceGauge;
    private final Timer balanceQueryTimer;

    public GymWalletMetrics(MeterRegistry meterRegistry, IGymWalletService walletService) {
        this.meterRegistry = meterRegistry;

        // 扣费次数计数器
        this.walletDeductCounter = Counter.builder("wallet.deduct.count")
            .description("钱包扣费次数")
            .register(meterRegistry);

        // 调整次数计数器
        this.walletAdjustmentCounter = Counter.builder("wallet.adjustment.count")
            .description("钱包调整次数")
            .register(meterRegistry);

        // 总余额仪表
        this.totalBalanceGauge = Gauge.builder("wallet.total.balance")
            .description("所有钱包总余额")
            .register(meterRegistry, this, GymWalletMetrics::calculateTotalBalance);

        // 查询响应时间计时器
        this.balanceQueryTimer = Timer.builder("wallet.balance.query.duration")
            .description("余额查询耗时")
            .register(meterRegistry);
    }

    /**
     * 记录扣费操作
     */
    public void recordDeduct() {
        walletDeductCounter.increment();
    }

    /**
     * 记录调整操作
     */
    public void recordAdjustment() {
        walletAdjustmentCounter.increment();
    }

    /**
     * 记录查询耗时
     */
    public void recordBalanceQuery(Duration duration) {
        balanceQueryTimer.record(duration);
    }

    /**
     * 计算总余额
     */
    private double calculateTotalBalance() {
        try {
            BigDecimal totalBalance = walletService.selectTotalBalance();
            return totalBalance.doubleValue();
        } catch (Exception e) {
            log.error("计算总余额失败", e);
            return 0.0;
        }
    }
}

/**
 * 系统健康检查
 */
@Component
public class GymWalletHealthIndicator implements HealthIndicator {

    @Autowired
    private IGymWalletService walletService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    public Health health() {
        try {
            // 检查数据库连接
            int walletCount = walletService.count();

            // 检查Redis连接
            String pong = redisTemplate.getConnectionFactory().getConnection().ping();

            if (!"PONG".equals(pong)) {
                return Health.down().withDetail("redis", "连接失败").build();
            }

            return Health.up()
                .withDetail("database", "连接正常")
                .withDetail("redis", "连接正常")
                .withDetail("wallet_count", walletCount)
                .build();

        } catch (Exception e) {
            return Health.down().withException(e).build();
        }
    }
}
```

---

## 质量保证和测试

### 单元测试要求
- [ ] 所有Service层单元测试覆盖率 > 80%
- [ ] 核心业务逻辑测试覆盖率 > 95%
- [ ] 零透支机制完整测试
- [ ] 事务回滚场景测试

### 集成测试要求
- [ ] 数据库集成测试
- [ ] Redis缓存集成测试
- [ ] 微信API模拟测试
- [ ] 完整业务流程测试

### 性能测试要求
- [ ] 并发扣费压力测试（100+ TPS）
- [ ] 数据库查询性能测试
- [ ] Redis缓存性能测试
- [ ] 系统响应时间测试（< 2秒）

### 安全测试要求
- [ ] SQL注入防护测试
- [ ] XSS攻击防护测试
- [ ] 权限控制测试
- [ ] 敏感数据加密测试

---

## 部署和运维

### 开发环境部署
```bash
# 1. 创建数据库
mysql -u root -p < docs/database/gym_wallet.sql

# 2. 配置Redis
redis-server --port 6379

# 3. 启动Spring Boot应用
mvn spring-boot:run

# 4. 启动Vue3前端
cd ruoyi-ui
npm run dev
```

### 生产环境部署
```bash
# 1. 构建应用
mvn clean package -P prod

# 2. 部署到服务器
java -jar gym-wallet.jar --spring.profiles.active=prod

# 3. 配置Nginx
# 4. 设置定时任务监控
# 5. 配置日志收集
```

### 监控和维护
- [ ] Spring Boot Actuator健康检查
- [ ] Prometheus + Grafana监控
- [ ] ELK日志收集和分析
- [ ] 自动化备份策略
- [ ] 性能监控和告警

---

这个任务分解完全基于RuoYi-Vue-Pro架构，确保企业级的开发规范、代码质量和系统安全性，同时满足零透支的核心业务需求。
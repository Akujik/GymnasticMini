# 实施计划：003-waitlist-and-makeup (RuoYi架构版)

**功能分支**: `003-waitlist-and-makeup`
**创建时间**: 2025-10-31
**更新时间**: 2025-11-17 (v2.0.0 RuoYi架构重构)
**状态**: Ready for Implementation
**MVP**: 3
**依赖关系**: MVP-1 (001-user-identity-system), MVP-2 (002-course-display-and-booking)
**输入**: 构建一个支持候补队列管理、6.5小时自动通知、30分钟响应窗口、自动顺位机制和14天课时补偿的候补补课系统。

## RuoYi架构实施概述

本计划完全基于RuoYi-Vue-Pro企业级开发脚手架，采用Spring Boot + MyBatis-Plus + Vue3的完整技术栈，实现企业级候补补课管理系统。

### 核心架构特性
- **6.5小时自动通知**: 开课前6.5小时自动发送微信通知
- **30分钟响应窗口**: 提供30分钟决策缓冲期
- **自动顺位机制**: 超时未响应自动顺位给下一个候补
- **14天课时补偿**: 取消预约自动生成14天有效课时补偿
- **RuoYi集成**: 完整的权限管理、操作审计、代码生成

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
  - Spring Task: 定时任务调度

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
com.ruoyi.project.gymnastics.waitlist
├── domain/                   // MyBatis-Plus实体类
│   ├── GymWaitlist.java                    // 候补队列表
│   ├── GymWaitlistNotification.java        // 候补通知记录
│   ├── GymWaitlistFlow.java                // 候补流程跟踪
│   ├── GymMakeupBooking.java               // 补课预约
│   ├── GymClassCreditCompensation.java     // 课时补偿
│   └── GymCompensationUsage.java           // 补偿使用记录
├── mapper/                   // MyBatis-Plus Mapper
│   ├── GymWaitlistMapper.java
│   ├── GymWaitlistNotificationMapper.java
│   ├── GymMakeupBookingMapper.java
│   └── GymClassCreditCompensationMapper.java
├── service/                  // Spring Service层
│   ├── IGymWaitlistService.java
│   ├── IGymWaitlistNotificationService.java
│   ├── IGymMakeupBookingService.java
│   ├── IGymClassCreditCompensationService.java
│   └── impl/
│       ├── GymWaitlistServiceImpl.java
│       ├── GymWaitlistNotificationServiceImpl.java
│       ├── GymMakeupBookingServiceImpl.java
│       └── GymClassCreditCompensationServiceImpl.java
└── controller/               // REST Controller层
    ├── GymWaitlistController.java
    ├── GymMakeupBookingController.java
    └── GymClassCreditCompensationController.java
```

### 前端模块结构
```
src/views/gymnastics/waitlist
├── index.vue                    // 候补管理主页面
├── waitlistDetail.vue           // 候补详情页面
├── notification.vue             // 通知管理页面
├── makeupBooking.vue            // 补课预约页面
├── compensation.vue             // 课时补偿页面
└── components/
    ├── WaitlistCard.vue         // 候补卡片组件
    ├── NotificationTimer.vue    // 通知倒计时组件
    └── CompensationBalance.vue  // 补偿余额组件
```

## 实施阶段 (RuoYi架构)

### 阶段1：RuoYi基础设施搭建 (3天)

#### 1.1 数据库设计和MyBatis-Plus集成
**时间**: 1天
**内容**:
- 创建gym_waitlist系列表
- 配置MyBatis-Plus连接池和分页插件
- 设置RuoYi标准审计字段
- 配置乐观锁和悲观锁机制

**交付物**:
```sql
-- RuoYi标准表结构
CREATE TABLE `gym_waitlist` (
  `waitlist_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `profile_id` BIGINT NOT NULL,
  `queue_position` INT NOT NULL,
  `status` CHAR(1) DEFAULT '0',
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
public class GymWaitlistServiceImpl extends ServiceImpl<GymWaitlistMapper, GymWaitlist> implements IGymWaitlistService {

    @Autowired
    private GymWaitlistMapper waitlistMapper;

    @Override
    @Transactional
    public GymWaitlist selectGymWaitlistByUserId(Long userId) {
        LambdaQueryWrapper<GymWaitlist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymWaitlist::getUserId, userId)
               .orderByDesc(GymWaitlist::getCreateTime);
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
- 设置候补队列缓存

**交付物**:
```java
@Component
public class WaitlistLockUtil {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public boolean tryLock(String key, String value, long expireTime) {
        // Redis分布式锁实现，用于候补队列并发控制
        return redisTemplate.opsForValue()
            .setIfAbsent(key, value, expireTime, TimeUnit.MILLISECONDS);
    }
}
```

### 阶段2：候补核心业务逻辑 (5天)

#### 2.1 候补队列管理和FIFO机制
**时间**: 2天
**内容**:
- 实现候补加入和队列管理
- 配置Spring Boot事务管理
- 实现MyBatis-Plus乐观锁
- 支持候补容量限制

**关键实现**:
```java
@Service
@Transactional
public class GymWaitlistQueueService {

    /**
     * 加入候补队列 - 使用分布式锁
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean joinWaitlist(Long userId, Long courseScheduleId) {
        String lockKey = "waitlist:join:" + courseScheduleId;

        try {
            if (waitlistLockUtil.tryLock(lockKey, userId.toString(), 10000)) {
                // 1. 检查候补容量
                if (isWaitlistFull(courseScheduleId)) {
                    throw new ServiceException("候补队列已满");
                }

                // 2. 计算队列位置
                int position = calculateQueuePosition(courseScheduleId);

                // 3. 创建候补记录
                GymWaitlist waitlist = new GymWaitlist();
                waitlist.setUserId(userId);
                waitlist.setCourseScheduleId(courseScheduleId);
                waitlist.setQueuePosition(position);
                waitlist.setStatus("0"); // 活跃状态
                waitlist.setCreateBy(SecurityUtils.getUsername());

                return waitlistMapper.insert(waitlist) > 0;
            }
            throw new ServiceException("系统繁忙，请稍后重试");
        } finally {
            waitlistLockUtil.unlock(lockKey, userId.toString());
        }
    }
}
```

#### 2.2 6.5小时自动通知机制
**时间**: 2天
**内容**:
- 实现Spring Boot定时任务
- 集成微信服务通知
- 配置通知限流和重试
- 支持30分钟响应窗口

**通知服务实现**:
```java
@Service
public class GymWaitlistNotificationService {

    /**
     * 6.5小时自动通知 - Spring Boot定时任务
     */
    @Scheduled(cron = "0 */30 * * * ?") // 每30分钟检查一次
    public void processWaitlistNotifications() {
        List<GymWaitlist> notifyList = waitlistMapper.selectWaitlistForNotification();

        for (GymWaitlist waitlist : notifyList) {
            try {
                sendWaitlistNotification(waitlist);
                updateNotificationRound(waitlist);
            } catch (Exception e) {
                log.error("发送候补通知失败: waitlistId={}", waitlist.getWaitlistId(), e);
            }
        }
    }

    private void sendWaitlistNotification(GymWaitlist waitlist) {
        // 创建通知记录
        GymWaitlistNotification notification = new GymWaitlistNotification();
        notification.setWaitlistId(waitlist.getWaitlistId());
        notification.setNotificationType("available");
        notification.setResponseDeadline(
            LocalDateTime.now().plusMinutes(30) // 30分钟响应窗口
        );
        notification.setCreateBy("system");

        waitlistNotificationMapper.insert(notification);

        // 发送微信通知
        weChatNotificationService.sendWaitlistNotification(waitlist, notification);
    }
}
```

#### 2.3 自动顺位和响应处理
**时间**: 1天
**内容**:
- 实现超时自动顺位逻辑
- 配置响应截止检查
- 支持多轮通知机制
- 集成RuoYi操作审计

**自动顺位实现**:
```java
@Service
public class GymWaitlistAutoPromotionService {

    /**
     * 处理候补响应 - RuoYi事务管理
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean handleWaitlistResponse(Long notificationId, String action) {
        GymWaitlistNotification notification = notificationMapper.selectById(notificationId);

        if (notification == null) {
            throw new ServiceException("通知记录不存在");
        }

        // 检查响应时间窗口
        if (LocalDateTime.now().isAfter(notification.getResponseDeadline())) {
            // 超时，自动顺位给下一个
            promoteNextWaitlist(notification.getWaitlistId());
            return false;
        }

        if ("accept".equals(action)) {
            // 接受候补，创建预约
            return createBookingFromWaitlist(notification);
        } else {
            // 拒绝候补，立即顺位
            promoteNextWaitlist(notification.getWaitlistId());
            return true;
        }
    }

    private void promoteNextWaitlist(Long currentWaitlistId) {
        // 获取下一个候补者
        GymWaitlist nextWaitlist = waitlistMapper.selectNextInQueue(currentWaitlistId);

        if (nextWaitlist != null) {
            // 发送通知给下一个候补者
            sendWaitlistNotification(nextWaitlist);
        }

        // 更新当前候补状态为过期
        GymWaitlist current = waitlistMapper.selectById(currentWaitlistId);
        current.setStatus("2"); // 过期
        waitlistMapper.updateById(current);
    }
}
```

### 阶段3：补课和课时补偿系统 (4天)

#### 3.1 补课预约管理
**时间**: 2天
**内容**:
- 实现补课预约流程
- 集成课程匹配算法
- 支持时长差异处理
- 配置预约冲突检查

**补课预约服务**:
```java
@Service
@Transactional
public class GymMakeupBookingService {

    /**
     * 预约补课 - RuoYi事务管理
     */
    @Transactional(rollbackFor = Exception.class)
    public GymMakeupBooking bookMakeupClass(MakeupBookingRequest request) {
        // 1. 检查课程容量和时间冲突
        if (!isTimeSlotAvailable(request.getProfileId(), request.getScheduleId())) {
            throw new ServiceException("时间段冲突或课程已满");
        }

        // 2. 计算时长差异
        int durationDiff = calculateDurationDifference(request);

        // 3. 处理课时补偿（如果需要）
        if (durationDiff > 0) {
            if (!useCompensation(request.getProfileId(), durationDiff)) {
                throw new ServiceException("课时补偿不足");
            }
        }

        // 4. 创建补课预约
        GymMakeupBooking makeup = new GymMakeupBooking();
        makeup.setUserId(SecurityUtils.getUserId());
        makeup.setProfileId(request.getProfileId());
        makeup.setCourseScheduleId(request.getScheduleId());
        makeup.setDurationDifference(durationDiff);
        makeup.setCreateBy(SecurityUtils.getUsername());

        makeupBookingMapper.insert(makeup);

        return makeup;
    }
}
```

#### 3.2 14天课时补偿系统
**时间**: 1天
**内容**:
- 实现14天有效期管理
- 配置自动过期清理
- 支持补偿使用优先级
- 集成RuoYi审计日志

**课时补偿服务**:
```java
@Service
@Transactional
public class GymClassCreditCompensationService {

    /**
     * 创建课时补偿 - 14天有效期
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean createCompensation(Long profileId, BigDecimal minutes, String sourceType, Long sourceId) {
        GymClassCreditCompensation compensation = new GymClassCreditCompensation();
        compensation.setProfileId(profileId);
        compensation.setTotalMinutes(minutes);
        compensation.setUsedMinutes(BigDecimal.ZERO);
        compensation.setRemainingMinutes(minutes);
        compensation.setSourceType(sourceType);
        compensation.setSourceId(sourceId);
        compensation.setExpireAt(LocalDateTime.now().plusDays(14)); // 14天有效期
        compensation.setStatus("0"); // 有效状态
        compensation.setCreateBy(SecurityUtils.getUsername());

        return compensationMapper.insert(compensation) > 0;
    }

    /**
     * 使用补偿时长 - 乐观锁控制
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean useCompensation(Long compensationId, BigDecimal minutes) {
        GymClassCreditCompensation compensation = compensationMapper.selectById(compensationId);

        if (compensation == null || compensation.getRemainingMinutes().compareTo(minutes) < 0) {
            throw new ServiceException("补偿余额不足");
        }

        // 使用乐观锁更新
        int updateCount = compensationMapper.useCompensation(
            compensationId, minutes, compensation.getVersion()
        );

        if (updateCount > 0) {
            // 记录使用明细
            recordCompensationUsage(compensation, minutes);
            return true;
        }

        throw new ServiceException("补偿使用失败，请重试");
    }
}
```

#### 3.3 补偿余额查询和过期处理
**时间**: 1天
**内容**:
- 实现补偿余额实时查询
- 配置自动过期清理任务
- 支持即将过期提醒
- 集成Redis缓存优化

**补偿查询实现**:
```java
@Service
public class GymCompensationQueryService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 查询学员补偿余额 - 使用Redis缓存
     */
    @Cacheable(value = "compensationBalance", key = "#profileId")
    public CompensationBalanceVO getCompensationBalance(Long profileId) {
        String cacheKey = "compensation:balance:" + profileId;

        // 尝试从Redis获取
        CompensationBalanceVO cached = (CompensationBalanceVO) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // 从数据库查询
        List<GymClassCreditCompensation> compensations = compensationMapper.selectValidByProfile(profileId);

        CompensationBalanceVO balance = new CompensationBalanceVO();
        balance.setProfileId(profileId);
        balance.setTotalCompensations(compensations.size());
        balance.setTotalMinutes(compensations.stream()
            .map(GymClassCreditCompensation::getRemainingMinutes)
            .reduce(BigDecimal.ZERO, BigDecimal::add));

        // 缓存结果
        redisTemplate.opsForValue().set(cacheKey, balance, 30, TimeUnit.MINUTES);

        return balance;
    }
}
```

### 阶段4：RuoYi管理后台开发 (3天)

#### 4.1 候补管理界面
**时间**: 1.5天
**内容**:
- 开发Vue3候补管理界面
- 集成Element Plus表格组件
- 实现RuoYi权限控制
- 配置批量操作功能

**Vue3管理界面**:
```vue
<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true">
      <el-form-item label="用户" prop="userId">
        <el-input v-model="queryParams.userId" placeholder="请输入用户ID" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态">
          <el-option label="活跃" value="0" />
          <el-option label="已确认" value="1" />
          <el-option label="已过期" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="waitlistList">
      <el-table-column label="候补ID" prop="waitlistId" />
      <el-table-column label="用户ID" prop="userId" />
      <el-table-column label="队列位置" prop="queuePosition" />
      <el-table-column label="状态" prop="status">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button @click="handleDetail(scope.row)">详情</el-button>
          <el-button @click="handleNotification(scope.row)" type="primary">通知</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { listWaitlist, sendManualNotification } from '@/api/gymnastics/waitlist'

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  userId: null,
  status: null
})

const waitlistList = ref([])
const loading = ref(false)
const total = ref(0)

const getList = () => {
  loading.value = true
  listWaitlist(queryParams).then(response => {
    waitlistList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

const handleNotification = (row) => {
  sendManualNotification({ waitlistId: row.waitlistId }).then(() => {
    proxy.$modal.msgSuccess("通知发送成功")
    getList()
  })
}
</script>
```

#### 4.2 补课预约管理
**时间**: 1天
**内容**:
- 开发补课预约管理界面
- 集成课时补偿显示
- 实现批量处理功能
- 支持预约统计报表

**补课管理组件**:
```vue
<template>
  <el-card class="box-card">
    <div slot="header" class="clearfix">
      <span>补课预约管理</span>
      <el-button style="float: right; padding: 3px 0" type="text" @click="handleExport">导出</el-button>
    </div>

    <el-table :data="makeupList" border>
      <el-table-column prop="makeupId" label="补课ID" width="100" />
      <el-table-column prop="profileName" label="学员姓名" />
      <el-table-column prop="courseName" label="课程名称" />
      <el-table-column prop="classDate" label="上课日期" />
      <el-table-column prop="durationDifference" label="时长差异">
        <template #default="scope">
          <span :class="scope.row.durationDifference > 0 ? 'text-danger' : 'text-success'">
            {{ scope.row.durationDifference > 0 ? '+' : '' }}{{ scope.row.durationDifference }}分钟
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="compensationUsed" label="使用补偿" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getMakeupStatusType(scope.row.status)">
            {{ getMakeupStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
```

#### 4.3 课时补偿管理
**时间**: 0.5天
**内容**:
- 开发补偿余额管理界面
- 集成即将过期提醒
- 实现补偿使用记录查询
- 支持手动补偿调整

### 阶段5：定时任务和监控 (2天)

#### 5.1 Spring Boot定时任务配置
**时间**: 1天
**内容**:
- 配置@Scheduled定时任务
- 实现候补过期清理
- 配置补偿过期提醒
- 支持任务监控告警

**定时任务实现**:
```java
@Component
public class GymWaitlistScheduledTasks {

    /**
     * 每小时检查6.5小时通知窗口
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void checkNotificationWindow() {
        List<GymWaitlist> notifyList = waitlistService.selectWaitlistForNotification();

        for (GymWaitlist waitlist : notifyList) {
            notificationService.sendWaitlistNotification(waitlist);
        }
    }

    /**
     * 每30分钟处理响应超时
     */
    @Scheduled(cron = "0 */30 * * * ?")
    public void processResponseTimeout() {
        List<GymWaitlistNotification> timeoutNotifications =
            notificationService.selectTimeoutNotifications();

        for (GymWaitlistNotification notification : timeoutNotifications) {
            waitlistService.promoteNextWaitlist(notification.getWaitlistId());
        }
    }

    /**
     * 每天凌晨2点清理过期补偿
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupExpiredCompensation() {
        List<GymClassCreditCompensation> expiredCompensations =
            compensationService.selectExpiredCompensations();

        for (GymClassCreditCompensation compensation : expiredCompensations) {
            compensation.setStatus("1"); // 过期状态
            compensationService.updateById(compensation);
        }
    }
}
```

#### 5.2 监控和告警系统
**时间**: 1天
**内容**:
- 集成Spring Boot Actuator
- 配置应用性能监控
- 实现业务指标监控
- 支持异常告警机制

**监控实现**:
```java
@Component
public class GymWaitlistMetrics {

    private final MeterRegistry meterRegistry;
    private final Counter waitlistJoinCounter;
    private final Gauge activeWaitlistGauge;
    private final Counter notificationSuccessCounter;

    public GymWaitlistMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.waitlistJoinCounter = Counter.builder("waitlist.join.count")
            .description("候补加入次数")
            .register(meterRegistry);
        this.activeWaitlistGauge = Gauge.builder("waitlist.active.count")
            .description("活跃候补数量")
            .register(meterRegistry, this, GymWaitlistMetrics::getActiveWaitlistCount);
        this.notificationSuccessCounter = Counter.builder("notification.success.count")
            .description("通知发送成功次数")
            .register(meterRegistry);
    }

    public void recordWaitlistJoin() {
        waitlistJoinCounter.increment();
    }

    public void recordNotificationSuccess() {
        notificationSuccessCounter.increment();
    }

    private double getActiveWaitlistCount() {
        return waitlistService.selectActiveWaitlistCount();
    }
}
```

## API设计 (RuoYi标准)

### 候补管理API
```java
@RestController
@RequestMapping("/gym/waitlist")
public class GymWaitlistController extends BaseController {

    @PostMapping("/join")
    @PreAuthorize("@ss.hasPermission('gym:waitlist:join')")
    @Log(title = "加入候补", businessType = BusinessType.INSERT)
    public AjaxResult join(@Validated @RequestBody GymWaitlist waitlist) {
        waitlist.setCreateBy(getUsername());
        return toAjax(waitlistService.insertGymWaitlist(waitlist));
    }

    @GetMapping("/list")
    @PreAuthorize("@ss.hasPermission('gym:waitlist:list')")
    public TableDataInfo list(GymWaitlist waitlist) {
        startPage();
        List<GymWaitlist> list = waitlistService.selectGymWaitlistList(waitlist);
        return getDataTable(list);
    }

    @GetMapping("/my")
    @PreAuthorize("@ss.hasPermi('gym:waitlist:query')")
    public AjaxResult getMyWaitlist() {
        Long userId = getUserId();
        List<GymWaitlist> list = waitlistService.selectWaitlistByUserId(userId);
        return success(list);
    }
}
```

### 补课管理API
```java
@RestController
@RequestMapping("/gym/makeup")
public class GymMakeupBookingController extends BaseController {

    @PostMapping("/book")
    @PreAuthorize("@ss.hasPermission('gym:makeup:book')")
    @Log(title = "预约补课", businessType = BusinessType.INSERT)
    public AjaxResult book(@Validated @RequestBody GymMakeupBooking makeup) {
        makeup.setCreateBy(getUsername());
        return toAjax(makeupService.insertGymMakeupBooking(makeup));
    }

    @GetMapping("/available")
    @PreAuthorize("@ss.hasPermi('gym:makeup:query')")
    public AjaxResult getAvailableMakeup(@RequestParam Long profileId) {
        List<MakeupClassVO> list = makeupService.selectAvailableMakeupClasses(profileId);
        return success(list);
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
  - 并发候补处理测试
  - 定时任务性能测试
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
- [ ] 100% 候补队列管理准确性
- [ ] 6.5小时通知机制正常工作
- [ ] 30分钟响应窗口准确执行
- [ ] 自动顺位机制完整性
- [ ] 14天课时补偿系统正常运行

### 性能标准
- [ ] 候补查询响应时间 < 2秒
- [ ] 通知发送成功率 > 99%
- [ ] 系统可用性 > 99.9%
- [ ] 并发候补处理支持 100+ TPS

### 业务标准
- [ ] 候补队列管理准确率100%
- [ ] 通知及时性100%
- [ ] 补课预约成功率 > 98%
- [ ] 课时补偿计算准确率100%

---

这个实施计划完全基于RuoYi-Vue-Pro架构，确保：
1. **企业级**: 基于RuoYi的完整企业级开发框架
2. **标准化**: 遵循RuoYi的命名规范和开发流程
3. **安全性**: 集成RuoYi的权限控制和操作审计
4. **性能**: 优化的缓存策略和并发处理能力
5. **可维护性**: 清晰的代码结构和完整的监控机制
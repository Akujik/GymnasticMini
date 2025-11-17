# Feature Specification: Waitlist and Makeup Class System (RuoYi架构版)

**Feature Branch**: `003-waitlist-and-makeup`
**Created**: 2025-10-27
**Updated**: 2025-11-17 (v2.0.0 RuoYi架构重构)
**Status**: Ready for Implementation
**MVP**: MVP-2B
**Dependencies**: MVP-2A (002-course-display-and-booking)
**Input**: "Build a waitlist queue system where parents can join a waitlist when a course is full, receive notifications when a spot opens up, and manage makeup classes after requesting leave."

## 技术架构说明

**核心架构**: RuoYi-Vue-Pro + Spring Boot + MyBatis-Plus + Vue3
**实现框架**: 基于RuoYi脚手架的企业级候补和补课管理系统
**数据库**: MySQL 8.0 + Redis缓存
**前端**: 微信小程序 + RuoYi-Vue-Pro管理后台

### 关键架构特性
- **自动候补确认**: 名额释放时直接分配给队列第一位用户，无需确认窗口
- **14天补课券管理**: 请假后自动生成补课券，支持免费预约补课
- **RuoYi集成**: 完整的权限管理、操作审计、代码生成
- **企业级通知**: 微信服务通知+Spring Boot定时任务

## RuoYi技术实现架构

### 后端架构 (Spring Boot)
```
com.ruoyi.project.gymnastics.waitlist
├── domain/           // MyBatis-Plus实体类
│   ├── GymWaitlist.java           // 候补主表
│   ├── GymWaitlistNotification.java // 候补通知表
│   ├── GymMakeupVoucher.java     // 补课券表
│   ├── GymMakeupBooking.java     // 补课预约表
│   └── GymCompensationUsage.java // 补偿使用表
├── mapper/           // MyBatis-Plus Mapper接口
│   ├── GymWaitlistMapper.java
│   ├── GymWaitlistNotificationMapper.java
│   ├── GymMakeupVoucherMapper.java
│   └── GymMakeupBookingMapper.java
├── service/          // Spring Service业务层
│   ├── IGymWaitlistService.java
│   ├── IGymWaitlistNotificationService.java
│   └── impl/
│       ├── GymWaitlistServiceImpl.java
│       └── GymWaitlistNotificationServiceImpl.java
└── controller/       // REST Controller层
    ├── GymWaitlistController.java
    └── GymWaitlistNotificationController.java
```

### 前端架构 (RuoYi-Vue-Pro)
```
src/views/gymnastics/waitlist
├── index.vue              // 候补管理主页面
├── waitlistDetail.vue       // 候补详情页面
├── makeupVoucher.vue       // 补课券管理页面
└── makeupBooking.vue       // 补课预约页面
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 加入候补队列 (Priority: P1) (RuoYi实现)

当课程已满员时,家长可以点击"加入候补"按钮,加入该课程的候补队列。系统支持动态候补容量管理(默认8人,可按课程类型调整),按FIFO原则管理。使用RuoYi的事务管理确保数据一致性。

**Why this priority**: 候补功能是课程预约系统的重要补充,直接提升用户满意度和课程满员率,是核心体验功能。

**RuoYi Implementation**: 使用Spring Boot事务管理和MyBatis-Plus乐观锁,确保并发场景下的数据一致性。

**Acceptance Scenarios**:

1. **Given** 课程已满员(如6/6人), **When** 用户查看课程详情, **Then** RuoYi系统显示"已满员"标签和"加入候补"按钮
2. **Given** 用户点击"加入候补", **When** 提交申请, **Then** Spring Boot事务处理,显示"已加入候补队列"Toast,按钮变为"已候补"(不可再点击)
3. **Given** 候补队列未满(如3/8人), **When** 用户加入, **Then** MyBatis-Plus插入记录成功,显示"您是第4位候补"
4. **Given** 候补队列已满(8/8人), **When** 用户尝试加入, **Then** 返回业务异常"候补队列已满,请选择其他课程"
5. **Given** 用户已加入候补, **When** 再次查看该课程, **Then** 显示"已候补"状态,提供"取消候补"按钮
6. **Given** 课程为热门课程(候补容量设置为10人), **When** 用户查看课程详情, **Then** 显示"候补: 5/10人"和"加入候补"按钮

**RuoYi Technical Implementation**:
```java
@Service
@Transactional
public class GymWaitlistServiceImpl implements IGymWaitlistService {

    @Autowired
    private GymWaitlistMapper waitlistMapper;

    @Autowired
    private GymCourseMapper courseMapper;

    /**
     * 加入候补队列 - 使用RuoYi事务管理
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean joinWaitlist(Long courseId, Long profileId) {
        // 1. 检查课程状态和容量
        GymCourse course = courseMapper.selectById(courseId);
        if (course == null || course.getStatus() != "0") {
            throw new ServiceException("课程不存在或已下架");
        }

        // 2. 检查是否已满员
        if (course.getCurrentEnrollment() < course.getMaxCapacity()) {
            return false; // 课程未满员，不需要候补
        }

        // 3. 检查候补容量
        int waitlistCapacity = course.getWaitlistCapacity() != null ?
            course.getWaitlistCapacity() : 8; // 默认8人

        LambdaQueryWrapper<GymWaitlist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymWaitlist::getCourseId, courseId)
               .eq(GymWaitlist::getStatus, "0")
               .orderByAsc(GymWaitlist::getJoinTime);

        int currentWaitlistCount = waitlistMapper.selectCount(wrapper);

        if (currentWaitlistCount >= waitlistCapacity) {
            throw new ServiceException("候补队列已满(" + waitlistCapacity + "人),请选择其他课程");
        }

        // 4. 检查是否已在候补中
        wrapper.clear();
        wrapper.eq(GymWaitlist::getCourseId, courseId)
               .eq(GymWaitlist::getProfileId, profileId)
               .eq(GymWaitlist::getStatus, "0");

        if (waitlistMapper.selectCount(wrapper) > 0) {
            throw new ServiceException("您已在候补队列中");
        }

        // 5. 计算候补位置
        int position = currentWaitlistCount + 1;

        // 6. 创建候补记录
        GymWaitlist waitlist = new GymWaitlist();
        waitlist.setCourseId(courseId);
        waitlist.setProfileId(profileId);
        waitlist.setStatus("0"); // 候补中
        waitlist.setJoinTime(new Date());
        waitlist.setPosition(position);
        waitlist.setCreateBy(SecurityUtils.getUsername());
        waitlist.setCreateTime(new Date());

        return waitlistMapper.insert(waitlist) > 0;
    }
}
```

---

### User Story 2 - 候补自动递补通知 (Priority: P1) (RuoYi定时任务)

当有人取消预约或请假时,系统自动通知所有候补队列中的用户,第一个确认的用户获得名额。系统在开课前6小时结束所有候补。通知通过微信服务消息发送,10秒内送达。

**Why this priority**: 自动递补是候补系统的核心机制,直接提升运营效率和用户体验,是P1级功能。

**RuoYi Implementation**: 使用Spring Boot的@Scheduled定时任务和微信服务通知集成。

**Acceptance Scenarios**:

1. **Given** 课程有3人在候补队列, **When** 有用户取消预约释放名额, **Then** Spring Boot异步任务同时向3人发送微信服务通知"XXX课程有名额了"
2. **Given** 候补用户收到通知, **When** 点击通知进入小程序, **Then** 跳转到课程详情页,显示"有名额,立即预约"按钮
3. **Given** 候补用户A点击"立即预约"并确认, **When** 系统处理, **Then** 用户A预约成功,其他候补用户的通知失效,提示"名额已被抢占"
4. **Given** 候补用户A确认预约, **When** 系统处理, **Then** MyBatis-Plus更新候补状态,其他用户排位前移(原第2位变为第1位)

**RuoYi Technical Implementation**:
```java
@Service
public class GymWaitlistNotificationService {

    @Autowired
    private GymWaitlistMapper waitlistMapper;

    @Autowired
    private GymWaitlistNotificationMapper notificationMapper;

    @Autowired
    private IGymBookingService bookingService;

    @Autowired
    private WeChatNotificationService wechatNotificationService;

    /**
     * 候补自动通知处理 - Spring Boot异步任务
     */
    @Async
    public void processWaitlistNotification(Long courseId, String reasonType, Long releasedByUserId) {
        try {
            log.info("开始处理候补通知，课程ID: {}, 原因: {}", courseId, reasonType);

            // 1. 获取候补队列
            List<GymWaitlist> waitlistQueue = getWaitlistQueue(courseId);

            if (CollectionUtils.isEmpty(waitlistQueue)) {
                log.info("候补队列为空，跳过通知处理");
                return;
            }

            // 2. 发送候补通知
            for (GymWaitlist waitlist : waitlistQueue) {
                sendWaitlistNotification(waitlist, courseId, reasonType);
            }

            // 3. 如果是开课前6小时外，启动24小时倒计时
            if (isBeforeClassStart(courseId, 6 * 60 * 60 * 1000L)) {
                scheduleWaitlistTimeout(courseId, 24 * 60 * 60 * 1000L);
            }

        } catch (Exception e) {
            log.error("候补通知处理失败", e);
        }
    }

    /**
     * 发送候补通知
     */
    private void sendWaitlistNotification(GymWaitlist waitlist, Long courseId, String reasonType) {
        try {
            // 获取课程信息
            GymCourse course = courseMapper.selectById(courseId);

            // 获取用户信息
            GymStudentProfile profile = profileService.selectGymStudentProfileByProfileId(waitlist.getProfileId());

            // 构建通知内容
            String messageContent = String.format(
                "🎉 恭喜！%s课程有名额了！\n" +
                "您在第%d位候补，现在可以立即预约。\n" +
                "请及时点击下方按钮完成预约。",
                course.getCourseName(),
                waitlist.getPosition()
            );

            // 发送微信服务通知
            WeChatTemplateMessage message = new WeChatTemplateMessage();
            message.setTemplateId("waitlist_notification_template");
            message.setTouser(getOpenIdByProfileId(waitlist.getProfileId()));
            message.setPage("/pages/course/detail?id=" + courseId);

            Map<String, WeChatTemplateData> data = new HashMap<>();
            data.put("course_name", new WeChatTemplateData(course.getCourseName(), "#FF0000"));
            data.put("position", new WeChatTemplateData(String.valueOf(waitlist.getPosition()), "#173177"));
            data.put("reason", new WeChatTemplateData(getReasonDescription(reasonType), "#173177"));
            data.put("time", new WeChatTemplateData(DateUtils.getNowDate(), "#173177"));
            data.put("message", new WeChatTemplateData(messageContent, "#173177"));

            message.setData(data);
            boolean result = wechatNotificationService.sendTemplateMessage(message);

            // 记录通知发送日志
            recordNotification(waitlist.getWaitlistId(), messageContent, result);

        } catch (Exception e) {
            log.error("发送候补通知失败", e);
        }
    }
}
```

---

### User Story 3 - 候补状态管理 (Priority: P1) (RuoYi前端集成)

用户可以在"我的候补"页面查看所有候补记录,包括候补位置、课程信息、等待时间等,并支持主动取消候补操作。

**Why this priority**: 候补管理是用户体验的重要组成部分,让用户清楚了解候补状态并能主动管理。

**RuoYi Implementation**: 基于RuoYi-Vue-Pro的Vue3前端组件和Element Plus表格组件。

**Acceptance Scenarios**:

1. **Given** 用户进入"我的"-"候补记录"页面, **When** 页面加载, **Then** RuoYi接口返回所有候补中的课程列表
2. **Given** 用户查看某候补记录, **When** 查看详情, **Then** 显示课程名称、候补位置(如第2位)、加入时间、预计等待时间
3. **Given** 前面有用户取消候补或成功预约, **When** 用户刷新页面, **Then** MyBatis-Plus更新候补位置,显示连续排位(如A/B/C取消后,原第4位变为第1位)
4. **Given** 用户不想再等某课程, **When** 点击"取消候补", **Then** RuoYi弹窗确认框,确认后MyBatis-Plus删除候补记录

**RuoYi Vue3前端实现**:
```vue
<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>我的候补记录</span>
      </div>

    <el-table v-loading="loading" :data="waitlistList">
      <el-table-column label="课程名称" prop="courseName" min-width="200">
        <template slot-scope="scope">
          <el-link type="primary" @click="viewCourse(scope.row.courseId)">
            {{ scope.row.courseName }}
          </el-link>
        </template>
      </el-table-column>

      <el-table-column label="候补位置" prop="position" width="100" align="center">
        <template slot-scope="scope">
          <el-tag type="warning">第{{ scope.row.position }}位</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="加入时间" prop="joinTime" width="160" align="center">
        <template slot-scope="scope">
          {{ parseTime(scope.row.joinTime) }}
        </template>
      </el-table-column>

      <el-table-column label="状态" prop="status" width="100" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === '0'" type="warning">候补中</el-tag>
          <el-tag v-else-if="scope.row.status === '1'" type="success">已预约</el-tag>
          <el-tag v-else-if="scope.row.status === '2'" type="info">已取消</el-tag>
          <el-tag v-else type="danger">已过期</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.status === '0'"
            size="mini"
            type="text"
            @click="cancelWaitlist(scope.row)"
          >取消候补</el-button>
          <el-button
            v-if="scope.row.status === '1'"
            size="mini"
            type="text"
            @click="viewBooking(scope.row)"
          >查看预约</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </el-card>

    <!-- 取消候补确认对话框 -->
    <el-dialog
      title="取消候补确认"
      :visible.sync="cancelDialogVisible"
      width="400px"
      append-to-body
    >
      <p>确定要取消该课程的候补吗？取消后将失去候补位置。</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmCancel">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { listWaitlist, cancelWaitlist } from '@/api/gymnastics/waitlist'

const loading = ref(true)
const waitlistList = ref([])
const total = ref(0)
const cancelDialogVisible = ref(false)
const currentWaitlist = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10
})

const getList = () => {
  loading.value = true
  listWaitlist(queryParams).then(response => {
    waitlist.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

const cancelWaitlist = (row) => {
  currentWaitlist.value = row
  cancelDialogVisible.value = true
}

const confirmCancel = () => {
  if (currentWaitlist.value) {
    cancelWaitlist(currentWaitlist.value.waitlistId).then(response => {
      cancelDialogVisible.value = false
      getList() // 刷新列表
      proxy.$modal.msgSuccess("取消候补成功")
    })
  }
}

onMounted(() => {
  getList()
})
</script>
```

---

### User Story 4 - 补课券管理 (Priority: P1) (RuoYi积分系统)

请假成功后系统自动生成补课券，有效期为14天，家长可以使用补课券免费预约补课课程。补课预约也走候补体系，与普通预约同队列同排序。

**Why this priority**: 补课券是请假功能的核心配套机制，14天有效期平衡用户便利性和运营管理，必须P1实现。

**RuoYi Implementation**: 使用RuoYi的积分券管理机制，支持补课券的生成、使用和过期处理。

**Acceptance Scenarios**:

1. **Given** 用户成功请假(固定班,开课前≥6小时), **When** 请假成功, **Then** Spring Boot服务自动生成1张补课券，有效期14天
2. **Given** 用户查看"补课券"页面, **When** 查看详情, **Then** 显示补课券数量、每张券的剩余有效期、原请假课程信息
3. **Given** 用户使用补课券预约补课课程, **When** 确认预约, **Then** 该课程免费(显示~~¥180~~ **¥0**)，消耗1张补课券
4. **Given** 补课课程满员, **When** 用户使用补课券预约, **Then** 加入候补队列，候补成功后自动使用补课券

**RuoYi Technical Implementation**:
```java
@Service
@Transactional
public class GymMakeupVoucherServiceImpl implements IGymVoucherService {

    @Autowired
    private GymMakeupVoucherMapper voucherMapper;

    /**
     * 生成补课券 - 请假成功后自动调用
     */
    public void generateMakeupVoucher(Long originalBookingId, Long profileId) {
        try {
            // 1. 获取原预约信息
            GymBooking originalBooking = bookingMapper.selectById(originalBookingId);
            if (originalBooking == null) {
                log.warn("原预约不存在，无法生成补课券");
                return;
            }

            // 2. 生成补课券
            GymMakeupVoucher voucher = new GymMakeupVoucher();
            voucher.setProfileId(profileId);
            voucher.setSourceBookingId(originalBookingId);
            voucher.setIssueDate(new Date());

            // 设置14天有效期
            Calendar calendar = Calendar.getInstance();
            calendar.add(Calendar.DAY_OF_MONTH, 14);
            voucher.setExpiryDate(calendar.getTime());

            voucher.setStatus("0"); // 待使用
            voucher.setCreateBy("system");
            voucher.setCreateTime(new Date());

            voucherMapper.insert(voucher);

            // 3. 发送通知
            sendVoucherNotification(voucher);

            log.info("补课券生成成功，原预约ID: {}, 学员档案ID: {}", originalBookingId, profileId);

        } catch (Exception e) {
            log.error("生成补课券失败", e);
            throw new ServiceException("补课券生成失败");
        }
    }

    /**
     * 使用补课券预约补课
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean useVoucherForBooking(Long voucherId, Long courseScheduleId, Long profileId) {
        // 1. 验证补课券有效性
        GymMakeupVoucher voucher = validateVoucher(voucherId, profileId);

        // 2. 检查补课课程限制
        GymCourseSchedule schedule = courseScheduleMapper.selectById(courseScheduleId);
        if (!canUseVoucherForCourse(voucher, schedule)) {
            throw new ServiceException("该课程不支持使用补课券");
        }

        // 3. 扣费补课券
        voucher.setStatus("1"); // 已使用
        voucher.setUsedTime(new Date());
        voucherMapper.updateById(voucher);

        // 4. 创建补课预约记录
        GymBooking makeupBooking = createMakeupBooking(voucher, courseScheduleId, profileId);
        bookingMapper.insert(makeupBooking);

        return true;
    }

    /**
     * 验证补课券
     */
    private GymMakeupVoucher validateVoucher(Long voucherId, Long profileId) {
        GymMakeupVoucher voucher = voucherMapper.selectById(voucherId);

        if (voucher == null) {
            throw new ServiceException("补课券不存在");
        }

        if (!voucher.getProfileId().equals(profileId)) {
            throw new ServiceException("补课券不属于当前学员");
        }

        if (!"0".equals(voucher.getStatus())) {
            if ("1".equals(voucher.getStatus())) {
                throw new ServiceException("补课券已使用");
            } else {
                throw new ServiceException("补课券已过期");
            }
        }

        Date now = new Date();
        if (voucher.getExpiryDate().before(now)) {
            // 标记为已过期
            voucher.setStatus("2");
            voucherMapper.updateById(voucher);
            throw new ServiceException("补课券已过期");
        }

        return voucher;
    }
}
```

---

### User Story 6 - 候补自动确认机制 (Priority: P0) (RuoYi事件驱动)

当有人取消预约或请假时，系统自动通知候补队列中的第一个用户，名额直接分配给第一个用户，无需确认窗口。

**Why this priority**: 简化候补确认流程，提升用户体验和运营效率，避免复杂的确认窗口管理，必须P0实现。

**RuoYi Implementation**: 使用RuoYi的事件驱动架构和分布式锁，确保候补自动确认的原子性。

**Acceptance Scenarios**:

1. **Given** 课程有3人在候补队列, **When** 有用户取消预约释放名额, **Then** 系统直接分配给队列第一位候补用户，发送"候补成功"通知
2. **Given** 候补用户A排在第一位, **When** 名额释放, **Then** 系统自动为A创建预约记录，发送"您已成功候补到XXX课程"通知
3. **Given** 候补用户A收到通知后不想上课, **When** 用户查看课程, **Then** 可以在6小时前自行取消(按正常取消规则处理)

**RuoYi Technical Implementation**:
```java
@Service
public class GymWaitlistAutoConfirmService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private GymWaitlistMapper waitlistMapper;

    /**
     * 候补自动确认 - 使用分布式锁确保原子性
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean autoConfirmWaitlist(Long courseId, Long releasedSlotId, String reasonType) {
        String lockKey = "waitlist:confirm:" + courseId;

        try {
            // 获取分布式锁
            boolean lockAcquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "locked", 30, TimeUnit.SECONDS);

            if (!lockAcquired) {
                log.warn("获取候补确认锁失败， courseId: {}", courseId);
                return false;
            }

            // 1. 获取候补队列第一位
            GymWaitlist firstWaitlist = getFirstWaitlist(courseId);
            if (firstWaitlist == null) {
                log.info("候补队列为空，跳过自动确认，courseId: {}", courseId);
                return false;
            }

            // 2. 验证候补资格
            if (!validateWaitlistEligibility(firstWaitlist)) {
                log.warn("候补用户资格验证失败，waitlistId: {}", firstWaitlist.getWaitlistId());
                return false;
            }

            // 3. 自动创建预约
            GymBooking booking = createAutoBooking(firstWaitlist, courseId, releasedSlotId);

            // 4. 更新候补状态
            updateWaitlistStatus(firstWaitlist.getWaitlistId(), "1"); // 已预约

            // 5. 发送候补成功通知
            sendAutoConfirmNotification(firstWaitlist, booking);

            // 6. 释放锁
            redisTemplate.delete(lockKey);

            log.info("候补自动确认成功, 候补ID: {}, 预约ID: {}",
                firstWaitlist.getWaitlistId(), booking.getBookingId());

            return true;

        } catch (Exception e) {
            log.error("候补自动确认失败", e);
            // 释放锁
            redisTemplate.delete(lockKey);
            return false;
        }
    }

    /**
     * 获取候补队列第一位
     */
    private GymWaitlist getFirstWaitlist(Long courseId) {
        LambdaQueryWrapper<GymWaitlist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GymWaitlist::getCourseId, courseId)
               .eq(GymWaitlist::getStatus, "0") // 候补中
               .orderByAsc(GymWaitlist::getPosition); // 按位置排序

        return waitlistMapper.selectOne(wrapper);
    }

    /**
     * 创建自动预约记录
     */
    private GymBooking createAutoBooking(GymWaitlist waitlist, Long courseId, Long slotId) {
        GymBooking booking = new GymBooking();
        booking.setCourseId(courseId);
        booking.setProfileId(waitlist.getProfileId());
        booking.setCourseScheduleId(slotId);
        booking.setBookingType("makeup"); // 补课类型
        booking.setStatus("0"); // 已确认
        booking.setIsWaitlistSuccess(true); // 候补成功标记
        booking.setCreateTime(new Date());
        booking.setCreateBy("system");

        // 设置钱包扣费为0（使用补课券）
        booking.setOriginalPrice(BigDecimal.ZERO);
        booking.setActualPrice(BigDecimal.ZERO);

        return bookingMapper.insert(booking);
    }
}
```

---

## Requirements *(mandatory)*

### Core Requirements (RuoYi架构适配)

- **FR-001**: RuoYi系统必须支持候补队列,每个课程最多8人候补，使用MyBatis-Plus乐观锁
- **FR-002**: RuoYi系统必须按先到先得(FIFO)原则管理候补队列,使用数据库事务和乐观锁
- **FR-003**: RuoYi系统必须在取消预约/请假后10秒内通知所有候补用户
- **FR-004**: RuoYi系统必须集成微信服务通知发送候补通知
- **FR-005**: RuoYi系统必须在候补用户预约成功后,使用MyBatis-Plus将其从候补队列移除
- **FR-006**: RuoYi系统必须支持候补用户主动取消候补，使用软删除标记

### 补课券管理相关 (根据Q5,Q13更新)

- **FR-050**: RuoYi系统必须在请假成功后自动生成补课券，有效期为14天
- **FR-051**: RuoYi系统必须支持补课券免费预约补课课程，使用Spring Boot验证
- **FR-052**: RuoYi系统必须限制补课券不可用于用户自己长期固定班
- **FR-053**: RuoYi系统必须支持补课预约走候补体系，与普通预约同队列、同排序规则
- **FR-054**: RuoYi系统必须在补课券过期前3天提醒用户及时使用，使用@Scheduled定时任务

### 候补自动确认相关 (根据Q2,Q13,Q15更新)

- **FR-011**: RuoYi系统必须实施候补自动确认机制：名额释放时直接分配给队列第一位候补用户
- **FR-012**: RuoYi系统必须为候补成功用户自动创建预约记录，无需用户额外确认
- **FR-013**: RuoYi系统必须发送"候补成功"通知给成功获得名额的用户
- **FR-014**: RuoYi系统必须支持候补成功用户按正常6小时规则进行取消或请假

### Key Entities (MyBatis-Plus实体)

- **GymWaitlist**: 候补实体，存储用户的候补信息
  - 核心属性: waitlistId, courseId, profileId, status, joinTime, position
  - 业务规则: 按加入时间排序，支持优先级设置和资格验证
  - RuoYi标准字段: createBy, createTime, updateBy, updateTime, remark, version

- **GymWaitlistNotification**: 候补通知实体，记录通知发送和响应情况
  - 核心属性: notificationId, waitlistId, notificationType, sentTime, responseTime, status
  - 业务规则: 支持多种通知方式，记录完整的通知生命周期
  - RuoYi标准字段: createBy, createTime, updateBy, updateTime, remark

- **GymMakeupVoucher**: 补课券实体，记录用户获得的补课券
  - 核心属性: voucherId, profileId, sourceBookingId, issueDate, expiryDate, status
  - 业务规则: 自动生成补课券，14天有效期，1:1使用比例
  - RuoYi标准字段: createBy, createTime, updateBy, updateTime, remark, version

- **GymMakeupBooking**: 补课预约实体，记录用户的补课预约
  - 核心属性: bookingId, voucherId, courseScheduleId, status, originalDuration, makeupDuration
  - 业务规则: 关联原缺席记录，支持补课状态追踪，记录课时差异信息
  - RuoYi标准字段: createBy, createTime, updateBy, updateTime, remark, version

---

## Success Criteria *(mandatory)*

### Measurable Outcomes (RuoYi架构指标)

- **SC-001**: RuoYi候补加入成功率>99%, MyBatis-Plus候补队列排位准确率100%
- **SC-002**: 名额释放后,候补通知在10秒内送达, 微信通知送达率>95%
- **SC-003**: 候补用户点击通知进入小程序, Spring Boot路由跳转准确率100%
- **SC-004**: 候补抢名额成功率100%(第一个确认者必定成功)
- **SC-005**: 补课记录生成准确率100%(请假成功必定生成)
- **SC-006**: 补课课程筛选准确率100%(仅显示符合条件的课程)
- **SC-007**: 补课名额占用准确率100%(补课时正常名额-1)

### 候补自动确认成功标准 (根据Q2,Q13,Q15更新)

- **SC-008**: RuoYi候补自动确认成功率>99%(名额释放后系统自动分配给队列第一位用户)
- **SC-009**: 候补成功通知发送准确率>95%(用户收到"候补成功"通知)
- **SC-010**: RuoYi候补预约自动创建成功率100%(系统自动为候补成功用户创建预约记录)
- **SC-011**: RuoYi候补队列管理准确率100%(队列顺序和容量管理正确)
- **SC-012**: 6小时请假规则执行准确率100%(候补成功预约按正常6小时规则处理)

### 补课券管理成功标准 (根据Q5,Q13更新)

- **SC-013**: RuoYi补课券自动生成成功率>99%(请假成功后14天有效期补课券正确生成)
- **SC-014**: RuoYi补课券免费预约成功率100%(使用补课券预约补课课程完全免费)
- **SC-015**: RuoYi补课券限制规则执行准确率100%(不可用于长期固定班等限制正确执行)
- **SC-016**: RuoYi补课券过期处理准确率>99%(14天到期后正确标记为已过期状态)
- **SC-017**: RuoYi补课券提醒及时率>95%(过期前3天提醒功能正常工作)

---

## Assumptions

- 假设微信消息推送服务稳定可靠，能够及时送达用户
- 假设RuoYi系统稳定运行，事务管理和分布式锁正常工作
- 假设运营人员会合理安排补课课程，确保有足够的补课资源
- 假设用户理解候补和补课的规则，配合系统安排

---

## Out of Scope (MVP-2B 不实现)

- ❌ 候补优先级购买（留到后期）
- ❌ 补课费用计算（留到MVP-3支付系统）
- ❌ 补课课程评价功能（留到后期）
- ❌ 候补统计分析功能（留到运营后台）
- ❌ 自动推荐补课课程（留到后期）
- ❌ 补课转让功能（留到后期）

---

## Open Questions

1. **[RESOLVED]** 候补确认机制如何设计？
   - **已确定**: 候补自动确认机制，名额释放时直接分配给队列第一位用户，发送"候补成功"通知 (根据Q2,Q13,Q15更新)

2. **[RESOLVED]** 补课券有效期多长？
   - **已确定**: 补课券有效期为14天，平衡用户便利性和运营管理 (根据Q5,Q13更新)

3. **[NEEDS CLARIFICATION]** 用户每月最多可以申请多少次补课？
   - 建议: 每月最多2次补课，超出需要运营人员审核

4. **[NEEDS CLARIFICATION]** 补课课程是否可以和普通课程一样加入候补？
   - 建议: 补课课程也可以加入候补，但候补规则与普通课程略有不同

5. **[NEEDS CLARIFICATION]** 用户取消候补后，重新加入时是否从队列末尾开始？
   - 建议: 是的，取消后重新加入从末尾开始，确保公平性

---

## RuoYi技术实现架构总结

### 核心技术特性

- **RuoYi事务管理**: 使用Spring Boot的@Transactional注解确保候补和补课操作的事务性
- **MyBatis-Plus ORM**: 强大的查询构造器和乐观锁机制，支持复杂的候补队列查询
- **Redis分布式锁**: 确保高并发场景下的候补自动确认原子性
- **微信服务通知**: 集成微信模板消息推送，及时通知用户
- **定时任务**: 使用@Scheduled处理候补超时和补课券过期检查
- **Vue3前端**: 基于RuoYi-Vue-Pro的现代化前端界面，提供优秀的用户体验
- **企业级审计**: RuoYi的@Log注解自动记录所有操作日志

### 部署架构

```yaml
开发环境:
  - Spring Boot应用 (内置Tomcat)
  - MySQL数据库 (本地/容器)
  - Redis缓存 (本地/容器)
  - RuoYi-Vue-Pro前端开发服务器

生产环境:
  - Spring Boot JAR包部署
  - MySQL主从复制
  - Redis Cluster集群
  - Nginx反向代理
  - RuoYi-Vue-Pro前端构建部署
```

---

这个候补和补课系统设计完全基于RuoYi架构，确保企业级的稳定性、可维护性和用户体验。通过自动候补确认机制和14天补课券管理，显著提升了系统的运营效率和用户满意度。
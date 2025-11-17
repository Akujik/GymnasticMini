# 百适体操馆RuoYi技术架构总览

## 架构概述

百适体操馆运营管理系统基于RuoYi-Vue-Pro脚手架构建，采用Spring Boot + MyBatis-Plus + Vue3的企业级技术栈。本架构充分利用RuoYi的代码生成器、RBAC权限管理、操作审计等企业级功能，确保系统的高效开发和稳定运行。

## 技术栈架构

### 后端架构
```
┌─────────────────────────────────────────┐
│              Spring Boot应用              │
├─────────────────────────────────────────┤
│  Controller层     │  Service层         │
│  ┌─────────────┐  │  ┌─────────────┐   │
│  │ RestController│  │  │ @Service   │   │
│  │ @RestController│  │  │ 业务逻辑   │   │
│  │ @PostMapping │  │  │ @Transactional│  │
│  └─────────────┘  │  └─────────────┘   │
├─────────────────────────────────────────┤
│           Repository/Mapper层           │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ MyBatis-Plus│  │  BaseMapper     │  │
│  │ @Mapper     │  │  CRUD操作       │  │
│  │ Wrapper构造器│  │  分页查询       │  │
│  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────┤
│              数据存储层                  │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ MySQL 8.0   │  │  Redis 7.0      │  │
│  │ 主数据库     │  │  缓存+Session   │  │
│  │ MyBatis-Plus │  │  分布式锁       │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

### 前端架构
```
┌─────────────────────────────────────────┐
│          RuoYi-Vue-Pro管理后台           │
├─────────────────────────────────────────┤
│  Vue3 + TypeScript + Element Plus       │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ 路由管理     │  │  组件库         │  │
│  │ Vue Router  │  │  Element Plus   │  │
│  │ 权限控制     │  │  封装组件       │  │
│  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────┤
│  状态管理 + 构建工具                     │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ Pinia       │  │  Vite           │  │
│  │ 全局状态     │  │  构建工具       │  │
│  │ 用户信息     │  │  热重载         │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

## 系统模块划分

### 1. 用户身份与权限模块（基于RuoYi）
```java
// RuoYi用户管理模块扩展
com.ruoyi.project.gymnastics
├── domain/           // 实体类
│   ├── User.java           // 用户表（扩展微信OpenID）
│   ├── Student.java        // 学员档案表
│   └── UserStudent.java    // 用户学员关联表
├── mapper/           // 数据访问层
│   ├── UserMapper.java
│   ├── StudentMapper.java
│   └── UserStudentMapper.java
├── service/          // 业务逻辑层
│   ├── IUserService.java
│   ├── IStudentService.java
│   └── impl/
└── controller/       // 控制器层
    ├── UserController.java
    └── StudentController.java
```

### 2. 课程管理模块
```java
com.ruoyi.project.gymnastics.course
├── domain/
│   ├── Course.java          // 课程表
│   ├── CourseSchedule.java  // 课程排期表
│   └── CourseType.java      // 课程类型表
├── service/
│   ├── ICourseService.java
│   ├── CourseMatchingService.java  // 3D匹配算法服务
│   └── impl/
└── controller/
    ├── CourseController.java
    └── CourseMatchingController.java
```

### 3. 预约系统模块
```java
com.ruoyi.project.gymnastics.booking
├── domain/
│   ├── Booking.java         // 预约表
│   ├── BookingLog.java      // 预约操作日志
│   └── Waitlist.java        // 候补队列表
├── service/
│   ├── IBookingService.java
│   ├── IWaitlistService.java
│   ├── BookingConflictService.java  // 时间冲突检测
│   └── impl/
└── controller/
    ├── BookingController.java
    └── WaitlistController.java
```

### 4. 钱包与支付模块
```java
com.ruoyi.project.gymnastics.wallet
├── domain/
│   ├── Wallet.java          // 钱包表
│   ├── WalletTransaction.java // 钱包交易表
│   └── PaymentOrder.java    // 支付订单表
├── service/
│   ├── IWalletService.java
│   ├── IPaymentService.java
│   ├── WalletSecurityService.java // 钱包安全服务
│   └── impl/
└── controller/
    ├── WalletController.java
    └── PaymentController.java
```

### 5. 私教课程模块
```java
com.ruoyi.project.gymnastics.private
├── domain/
│   ├── PrivateCourse.java   // 私教课程表
│   ├── PrivateBooking.java  // 私教预约表
│   └── Coach.java           // 教练表
├── service/
│   ├── IPrivateCourseService.java
│   ├── ICoachService.java
│   └── impl/
└── controller/
    ├── PrivateCourseController.java
    └── CoachController.java
```

## 核心技术特性

### 1. RuoYi代码生成器应用
```yaml
自动生成内容:
  - Controller层基础CRUD操作
  - Service层接口和实现类
  - MyBatis-Plus Mapper接口
  - Vue3前端页面（列表、表单、详情）
  - Element Plus表单组件
  - 路由配置和权限配置

自定义扩展:
  - 复杂业务逻辑Service方法
  - 3D课程匹配算法
  - 钱包事务处理逻辑
  - 微信支付回调处理
```

### 2. RBAC权限管理体系
```yaml
角色定义:
  - 超级管理员 (admin): 系统全部权限
  - 运营人员 (operator): 学员管理、课程管理、钱包充值
  - 教练 (coach): 查看自己负责的课程和学员
  - 财务 (finance): 钱包查看、交易记录、报表导出

权限控制:
  - 菜单权限: 控制页面访问
  - 按钮权限: 控制操作权限
  - 数据权限: 控制数据访问范围
```

### 3. 企业级功能集成
```yaml
审计日志:
  - 使用@Log注解自动记录操作
  - 记录操作人、时间、IP、操作内容
  - 支持日志查询和分析

系统监控:
  - Spring Boot Actuator健康检查
  - 系统性能监控
  - 数据库连接池监控
  - Redis缓存监控

定时任务:
  - 课程提醒任务
  - 数据备份任务
  - 统计报表生成
```

## 关键业务算法实现

### 1. 3D课程匹配算法
```java
@Service
public class CourseMatchingService {

    /**
     * 3维硬匹配算法：等级+年龄+性别
     */
    public List<Course> findMatchedCourses(Long studentId) {
        Student student = studentService.selectStudentByStudentId(studentId);

        LambdaQueryWrapper<Course> wrapper = new LambdaQueryWrapper<>();

        // 等级匹配
        wrapper.eq(Course::getLevel, student.getLevel());

        // 年龄匹配
        wrapper.le(Course::getMinAge, student.getAge())
               .ge(Course::getMaxAge, student.getAge());

        // 性别匹配（如果有性别限制）
        if (student.getGender() != null) {
            wrapper.and(w -> w.isNull(Course::getGenderRestriction)
                    .or().eq(Course::getGenderRestriction, student.getGender()));
        }

        return courseMapper.selectList(wrapper);
    }
}
```

### 2. 钱包安全事务处理
```java
@Service
@Transactional
public class WalletSecurityService {

    /**
     * 安全扣款操作
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean deductBalance(Long walletId, BigDecimal amount, String reason) {
        // 1. 检查余额（使用悲观锁）
        Wallet wallet = walletMapper.selectForUpdate(walletId);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new ServiceException("余额不足，禁止透支");
        }

        // 2. 扣款
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletMapper.updateById(wallet);

        // 3. 记录交易
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWalletId(walletId);
        transaction.setAmount(amount.negate());
        transaction.setType(TransactionType.DEDUCT.getCode());
        transaction.setReason(reason);
        walletTransactionMapper.insert(transaction);

        return true;
    }
}
```

### 3. 时间冲突检测算法
```java
@Service
public class BookingConflictService {

    /**
     * 检查预约时间冲突
     */
    public boolean hasTimeConflict(Long studentId, LocalDateTime startTime, LocalDateTime endTime) {
        LambdaQueryWrapper<Booking> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Booking::getStudentId, studentId)
               .ne(Booking::getStatus, BookingStatus.CANCELLED.getCode())
               .and(w -> w
                   // 情况1: 新预约开始时间在已有预约时间范围内
                   .between(Booking::getStartTime, startTime, endTime)
                   // 情况2: 新预约结束时间在已有预约时间范围内
                   .or().between(Booking::getEndTime, startTime, endTime)
                   // 情况3: 新预约完全包含已有预约
                   .or().le(Booking::getStartTime, startTime)
                        .ge(Booking::getEndTime, endTime));

        Long count = bookingMapper.selectCount(wrapper);
        return count > 0;
    }
}
```

## 数据库设计规范

### 1. MyBatis-Plus实体类规范
```java
@TableName("gym_course")
@Data
@EqualsAndHashCode(callSuper = false)
public class Course extends BaseEntity {

    @TableId(value = "course_id", type = IdType.AUTO)
    private Long courseId;

    @TableField("course_name")
    @NotBlank(message = "课程名称不能为空")
    private String courseName;

    @TableField("level")
    private String level;

    @TableField("min_age")
    private Integer minAge;

    @TableField("max_age")
    private Integer maxAge;

    @TableField("gender_restriction")
    private String genderRestriction;

    @TableField("capacity")
    private Integer capacity;

    @TableField("current_bookings")
    private Integer currentBookings;

    @Version
    @TableField("version")
    private Integer version;  // 乐观锁版本号
}
```

### 2. 统一响应格式
```java
@RestController
@RequestMapping("/gym/courses")
public class CourseController extends BaseController {

    @GetMapping("/matched/{studentId}")
    @PreAuthorize("@ss.hasPermission('gym:course:query')")
    public TableDataInfo getMatchedCourses(@PathVariable Long studentId) {
        startPage();
        List<Course> list = courseMatchingService.findMatchedCourses(studentId);
        return getDataTable(list);
    }

    @PostMapping
    @PreAuthorize("@ss.hasPermission('gym:course:add')")
    @Log(title = "课程管理", businessType = BusinessType.INSERT)
    public AjaxResult add(@Validated @RequestBody Course course) {
        return toAjax(courseService.insertCourse(course));
    }
}
```

## 部署架构

### 1. 开发环境
```yaml
服务架构:
  - Spring Boot应用 (内置Tomcat)
  - MySQL数据库 (本地/容器)
  - Redis缓存 (本地/容器)
  - Node.js前端开发服务器

配置管理:
  - application-dev.yml
  - 环境变量配置
  - Maven多环境配置
```

### 2. 生产环境
```yaml
服务架构:
  - Spring Boot JAR包部署
  - MySQL主从复制
  - Redis Cluster集群
  - Nginx反向代理
  - Docker容器化部署

监控运维:
  - Spring Boot Actuator
  - Prometheus + Grafana
  - ELK日志收集
  - 自动化备份
```

## 开发规范

### 1. 代码规范
```yaml
Java规范:
  - 遵循Alibaba Java开发手册
  - 统一使用Google Java Format
  - 类名使用大驼峰命名
  - 方法名使用小驼峰命名
  - 常量使用全大写下划线分隔

Vue3规范:
  - 组件使用PascalCase命名
  - 文件使用kebab-case命名
  - 使用TypeScript类型注解
  - 统一使用Composition API
```

### 2. Git规范
```yaml
分支策略:
  - main: 主分支，生产环境
  - develop: 开发分支
  - feature/*: 功能分支
  - hotfix/*: 热修复分支

提交规范:
  - feat: 新功能
  - fix: 修复bug
  - docs: 文档更新
  - style: 代码格式调整
  - refactor: 代码重构
  - test: 测试相关
  - chore: 构建工具或辅助工具的变动
```

## 性能优化策略

### 1. 数据库优化
```sql
-- 核心表索引设计
CREATE INDEX idx_student_level ON gym_student(level, age);
CREATE INDEX idx_booking_student_time ON gym_booking(student_id, start_time, end_time);
CREATE INDEX idx_wallet_user_id ON gym_wallet(user_id);
CREATE INDEX idx_course_level_age ON gym_course(level, min_age, max_age);
```

### 2. 缓存策略
```java
@Service
public class CourseService {

    @Cacheable(value = "courses", key = "#studentId")
    public List<Course> getMatchedCourses(Long studentId) {
        return courseMatchingService.findMatchedCourses(studentId);
    }

    @CacheEvict(value = "courses", key = "#studentId")
    public void clearCourseCache(Long studentId) {
        // 清除缓存
    }
}
```

### 3. 并发控制
```java
@Service
public class BookingService {

    /**
     * 使用分布式锁处理并发预约
     */
    @Transactional
    public boolean createBooking(Booking booking) {
        String lockKey = "booking_lock:" + booking.getCourseId() + ":" + booking.getStudentId();

        return redisTemplate.execute(new SessionCallback<Boolean>() {
            @Override
            public Boolean execute(RedisOperations operations) throws DataAccessException {
                operations.multi();
                try {
                    // 获取分布式锁
                    operations.opsForValue().setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);

                    // 执行预约逻辑
                    boolean result = doCreateBooking(booking);

                    operations.exec();
                    return result;
                } catch (Exception e) {
                    operations.discard();
                    throw e;
                } finally {
                    // 释放锁
                    operations.delete(lockKey);
                }
            }
        });
    }
}
```

这个技术架构文档为RuoYi版本的百适体操馆系统提供了完整的技术框架和实现指导，确保企业级的开发规范和系统稳定性。
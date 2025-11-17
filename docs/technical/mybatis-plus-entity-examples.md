# MyBatis-Plus实体类设计示例

## 实体类设计规范

### 1. 基础实体类

#### BaseEntity - RuoYi标准基类
```java
package com.ruoyi.common.core.domain;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Entity基类 - 基于RuoYi标准扩展
 */
@Data
public class BaseEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 主键ID */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** 搜索值 */
    @TableField(exist = false)
    private String searchValue;

    /** 创建者 */
    @TableField(fill = FieldFill.INSERT)
    private String createBy;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;

    /** 更新者 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String updateBy;

    /** 更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;

    /** 备注 */
    private String remark;

    /** 乐观锁版本号 */
    @Version
    @TableField(fill = FieldFill.INSERT)
    private Integer version;

    /** 逻辑删除标志 */
    @TableLogic
    @TableField(fill = FieldFill.INSERT)
    private String delFlag;

    /** 请求参数 */
    @TableField(exist = false)
    private Map<String, Object> params;

    public Map<String, Object> getParams() {
        if (params == null) {
            params = new HashMap<>();
        }
        return params;
    }
}
```

### 2. 业务实体类

#### GymStudentProfile - 学员档案实体
```java
package com.ruoyi.project.gymnastics.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.ruoyi.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * 学员档案对象 gym_student_profile
 *
 * @author ccmartmeet
 * @date 2025-11-17
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("gym_student_profile")
public class GymStudentProfile extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 档案ID */
    @TableId(value = "profile_id", type = IdType.AUTO)
    private Long profileId;

    /** 所属用户ID */
    @TableField("user_id")
    private Long userId;

    /** 学员姓名 */
    @TableField("student_name")
    @NotBlank(message = "学员姓名不能为空")
    @Size(max = 100, message = "学员姓名长度不能超过100个字符")
    private String studentName;

    /** 出生日期 */
    @TableField("birthday")
    @NotNull(message = "出生日期不能为空")
    @Past(message = "出生日期必须是过去的日期")
    private Date birthday;

    /** 性别（0男 1女） */
    @TableField("gender")
    @NotBlank(message = "性别不能为空")
    @Pattern(regexp = "^[01]$", message = "性别只能是0或1")
    private String gender;

    /** 技能等级 */
    @TableField("skill_level")
    @Pattern(regexp = "^L[1-6]\\+?$", message = "技能等级格式不正确")
    private String skillLevel;

    /** 发展标签 */
    @TableField("development_tag")
    @Pattern(regexp = "^(interest|professional|competition|long_term)$", message = "发展标签格式不正确")
    private String developmentTag;

    /** 虚拟年龄 */
    @TableField("virtual_age")
    @Min(value = 0, message = "虚拟年龄不能小于0")
    @Max(value = 18, message = "虚拟年龄不能大于18")
    private Integer virtualAge;

    /** 当前等级对应年龄 */
    @TableField("current_level_age")
    private Integer currentLevelAge;

    /** 身高(cm) */
    @TableField("height")
    @DecimalMin(value = "50.0", message = "身高不能小于50cm")
    @DecimalMax(value = "250.0", message = "身高不能大于250cm")
    private Double height;

    /** 体重(kg) */
    @TableField("weight")
    @DecimalMin(value = "10.0", message = "体重不能小于10kg")
    @DecimalMax(value = "200.0", message = "体重不能大于200kg")
    private Double weight;

    /** 特殊说明（过敏史、健康状况等） */
    @TableField("special_notes")
    @Size(max = 1000, message = "特殊说明长度不能超过1000个字符")
    private String specialNotes;

    /** 学员头像URL */
    @TableField("avatar_url")
    @Size(max = 500, message = "头像URL长度不能超过500个字符")
    private String avatarUrl;

    /** 年龄（计算字段，不存数据库） */
    @TableField(exist = false)
    private Integer age;
}
```

#### GymCourse - 课程实体
```java
package com.ruoyi.project.gymnastics.domain;

import com.baomidou.mybatisplus.annotation.*;
import com.ruoyi.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;
import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * 课程对象 gym_course
 *
 * @author ccmartmeet
 * @date 2025-11-17
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("gym_course")
public class GymCourse extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /** 课程ID */
    @TableId(value = "course_id", type = IdType.AUTO)
    private Long courseId;

    /** 课程名称 */
    @TableField("course_name")
    @NotBlank(message = "课程名称不能为空")
    @Size(max = 200, message = "课程名称长度不能超过200个字符")
    private String courseName;

    /** 课程编码 */
    @TableField("course_code")
    @Size(max = 50, message = "课程编码长度不能超过50个字符")
    private String courseCode;

    /** 课程类型 */
    @TableField("course_type")
    @NotBlank(message = "课程类型不能为空")
    @Pattern(regexp = "^(group|private_1v1|private_1v2|trial|camp)$", message = "课程类型格式不正确")
    private String courseType;

    /** 课程描述 */
    @TableField("description")
    @Size(max = 2000, message = "课程描述长度不能超过2000个字符")
    private String description;

    /** 基础价格 */
    @TableField("base_price")
    @NotNull(message = "基础价格不能为空")
    @DecimalMin(value = "0.01", message = "基础价格必须大于0")
    @Digits(integer = 8, fraction = 2, message = "基础价格格式不正确")
    private BigDecimal basePrice;

    /** 最大容量 */
    @TableField("max_capacity")
    @NotNull(message = "最大容量不能为空")
    @Min(value = 1, message = "最大容量必须大于0")
    @Max(value = 100, message = "最大容量不能超过100")
    private Integer maxCapacity;

    /** 当前报名人数 */
    @TableField("current_enrollment")
    @Min(value = 0, message = "当前报名人数不能小于0")
    private Integer currentEnrollment;

    /** 课程时长（分钟） */
    @TableField("duration_minutes")
    @NotNull(message = "课程时长不能为空")
    @Min(value = 15, message = "课程时长不能少于15分钟")
    @Max(value = 480, message = "课程时长不能超过480分钟")
    private Integer durationMinutes;

    /** 所需技能等级 */
    @TableField("skill_level_required")
    @Pattern(regexp = "^L[1-6]\\+?$", message = "所需技能等级格式不正确")
    private String skillLevelRequired;

    /** 最小年龄 */
    @TableField("min_age")
    @Min(value = 3, message = "最小年龄不能小于3岁")
    @Max(value = 18, message = "最小年龄不能大于18岁")
    private Integer minAge;

    /** 最大年龄 */
    @TableField("max_age")
    @Min(value = 3, message = "最大年龄不能小于3岁")
    @Max(value = 18, message = "最大年龄不能大于18岁")
    private Integer maxAge;

    /** 性别限制（0男 1女 2不限） */
    @TableField("gender_restriction")
    @Pattern(regexp = "^[012]$", message = "性别限制只能是0、1或2")
    private String genderRestriction;

    /** 难度等级 */
    @TableField("difficulty_level")
    @Pattern(regexp = "^(beginner|intermediate|advanced)$", message = "难度等级格式不正确")
    private String difficultyLevel;

    /** 课程器材 */
    @TableField("course_materials")
    private String courseMaterials;

    /** 学习目标 */
    @TableField("learning_objectives")
    @Size(max = 1000, message = "学习目标长度不能超过1000个字符")
    private String learningObjectives;

    /** 前置条件 */
    @TableField("prerequisites")
    @Size(max = 1000, message = "前置条件长度不能超过1000个字符")
    private String prerequisites;

    /** 课程图片URL */
    @TableField("course_image_url")
    @Size(max = 500, message = "课程图片URL长度不能超过500个字符")
    private String courseImageUrl;

    /** 状态（0正常 1停用） */
    @TableField("status")
    @Pattern(regexp = "^[01]$", message = "状态只能是0或1")
    private String status;

    /** 关联的排期列表（不存数据库） */
    @TableField(exist = false)
    private List<GymCourseSchedule> schedules;
}
```

### 3. Mapper接口示例

#### GymStudentProfileMapper
```java
package com.ruoyi.project.gymnastics.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ruoyi.project.gymnastics.domain.GymStudentProfile;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 学员档案Mapper接口
 *
 * @author ccmartmeet
 * @date 2025-11-17
 */
public interface GymStudentProfileMapper extends BaseMapper<GymStudentProfile> {

    /**
     * 查询学员档案
     *
     * @param profileId 学员档案主键
     * @return 学员档案
     */
    public GymStudentProfile selectGymStudentProfileByProfileId(Long profileId);

    /**
     * 查询学员档案列表
     *
     * @param gymStudentProfile 学员档案
     * @return 学员档案集合
     */
    public List<GymStudentProfile> selectGymStudentProfileList(GymStudentProfile gymStudentProfile);

    /**
     * 新增学员档案
     *
     * @param gymStudentProfile 学员档案
     * @return 结果
     */
    public int insertGymStudentProfile(GymStudentProfile gymStudentProfile);

    /**
     * 修改学员档案
     *
     * @param gymStudentProfile 学员档案
     * @return 结果
     */
    public int updateGymStudentProfile(GymStudentProfile gymStudentProfile);

    /**
     * 删除学员档案
     *
     * @param profileId 学员档案主键
     * @return 结果
     */
    public int deleteGymStudentProfileByProfileId(Long profileId);

    /**
     * 批量删除学员档案
     *
     * @param profileIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteGymStudentProfileByProfileIds(Long[] profileIds);

    /**
     * 根据用户ID查询学员档案列表
     *
     * @param userId 用户ID
     * @return 学员档案集合
     */
    public List<GymStudentProfile> selectProfilesByUserId(@Param("userId") Long userId);

    /**
     * 根据等级和年龄范围查询学员档案
     *
     * @param skillLevel 技能等级
     * @param minAge 最小年龄
     * @param maxAge 最大年龄
     * @param gender 性别
     * @return 学员档案集合
     */
    public List<GymStudentProfile> selectProfilesByLevelAge(@Param("skillLevel") String skillLevel,
                                                          @Param("minAge") Integer minAge,
                                                          @Param("maxAge") Integer maxAge,
                                                          @Param("gender") String gender);
}
```

### 4. XML映射文件示例

#### GymStudentProfileMapper.xml
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.ruoyi.project.gymnastics.mapper.GymStudentProfileMapper">

    <resultMap type="GymStudentProfile" id="GymStudentProfileResult">
        <result property="profileId" column="profile_id"/>
        <result property="userId" column="user_id"/>
        <result property="studentName" column="student_name"/>
        <result property="birthday" column="birthday"/>
        <result property="gender" column="gender"/>
        <result property="skillLevel" column="skill_level"/>
        <result property="developmentTag" column="development_tag"/>
        <result property="virtualAge" column="virtual_age"/>
        <result property="currentLevelAge" column="current_level_age"/>
        <result property="height" column="height"/>
        <result property="weight" column="weight"/>
        <result property="specialNotes" column="special_notes"/>
        <result property="avatarUrl" column="avatar_url"/>
        <result property="status" column="status"/>
        <result property="delFlag" column="del_flag"/>
        <result property="createBy" column="create_by"/>
        <result property="createTime" column="create_time"/>
        <result property="updateBy" column="update_by"/>
        <result property="updateTime" column="update_time"/>
        <result property="remark" column="remark"/>
        <result property="version" column="version"/>
    </resultMap>

    <sql id="selectGymStudentProfileVo">
        select profile_id, user_id, student_name, birthday, gender, skill_level,
               development_tag, virtual_age, current_level_age, height, weight,
               special_notes, avatar_url, status, del_flag, create_by, create_time,
               update_by, update_time, remark, version
        from gym_student_profile
    </sql>

    <select id="selectGymStudentProfileList" parameterType="GymStudentProfile" resultMap="GymStudentProfileResult">
        <include refid="selectGymStudentProfileVo"/>
        <where>
            <if test="userId != null "> and user_id = #{userId}</if>
            <if test="studentName != null  and studentName != ''"> and student_name like concat('%', #{studentName}, '%')</if>
            <if test="gender != null  and gender != ''"> and gender = #{gender}</if>
            <if test="skillLevel != null  and skillLevel != ''"> and skill_level = #{skillLevel}</if>
            <if test="developmentTag != null  and developmentTag != ''"> and development_tag = #{developmentTag}</if>
            and del_flag = '0'
        </where>
        order by create_time desc
    </select>

    <select id="selectGymStudentProfileByProfileId" parameterType="Long" resultMap="GymStudentProfileResult">
        <include refid="selectGymStudentProfileVo"/>
        where profile_id = #{profileId}
    </select>

    <select id="selectProfilesByUserId" parameterType="Long" resultMap="GymStudentProfileResult">
        <include refid="selectGymStudentProfileVo"/>
        where user_id = #{userId}
          and del_flag = '0'
        order by create_time desc
    </select>

    <select id="selectProfilesByLevelAge" resultMap="GymStudentProfileResult">
        <include refid="selectGymStudentProfileVo"/>
        where skill_level = #{skillLevel}
        <if test="minAge != null">
            and TIMESTAMPDIFF(YEAR, birthday, CURDATE()) >= #{minAge}
        </if>
        <if test="maxAge != null">
            and TIMESTAMPDIFF(YEAR, birthday, CURDATE()) &lt;= #{maxAge}
        </if>
        <if test="gender != null and gender != ''">
            and gender = #{gender}
        </if>
        and del_flag = '0'
        order by create_time desc
    </select>

    <insert id="insertGymStudentProfile" parameterType="GymStudentProfile" useGeneratedKeys="true" keyProperty="profileId">
        insert into gym_student_profile
        <trim prefix="(" suffix=")" suffixOverrides=",">
            <if test="userId != null">user_id,</if>
            <if test="studentName != null and studentName != ''">student_name,</if>
            <if test="birthday != null">birthday,</if>
            <if test="gender != null and gender != ''">gender,</if>
            <if test="skillLevel != null and skillLevel != ''">skill_level,</if>
            <if test="developmentTag != null and developmentTag != ''">development_tag,</if>
            <if test="virtualAge != null">virtual_age,</if>
            <if test="currentLevelAge != null">current_level_age,</if>
            <if test="height != null">height,</if>
            <if test="weight != null">weight,</if>
            <if test="specialNotes != null and specialNotes != ''">special_notes,</if>
            <if test="avatarUrl != null and avatarUrl != ''">avatar_url,</if>
            status, del_flag, create_by, create_time, remark
        </trim>
        <trim prefix="values (" suffix=")" suffixOverrides=",">
            <if test="userId != null">#{userId},</if>
            <if test="studentName != null and studentName != ''">#{studentName},</if>
            <if test="birthday != null">#{birthday},</if>
            <if test="gender != null and gender != ''">#{gender},</if>
            <if test="skillLevel != null and skillLevel != ''">#{skillLevel},</if>
            <if test="developmentTag != null and developmentTag != ''">#{developmentTag},</if>
            <if test="virtualAge != null">#{virtualAge},</if>
            <if test="currentLevelAge != null">#{currentLevelAge},</if>
            <if test="height != null">#{height},</if>
            <if test="weight != null">#{weight},</if>
            <if test="specialNotes != null and specialNotes != ''">#{specialNotes},</if>
            <if test="avatarUrl != null and avatarUrl != ''">#{avatarUrl},</if>
            '0', '0', #{createBy}, sysdate(), #{remark}
        </trim>
    </insert>

    <update id="updateGymStudentProfile" parameterType="GymStudentProfile">
        update gym_student_profile
        <trim prefix="SET" suffixOverrides=",">
            <if test="userId != null">user_id = #{userId},</if>
            <if test="studentName != null and studentName != ''">student_name = #{studentName},</if>
            <if test="birthday != null">birthday = #{birthday},</if>
            <if test="gender != null and gender != ''">gender = #{gender},</if>
            <if test="skillLevel != null and skillLevel != ''">skill_level = #{skillLevel},</if>
            <if test="developmentTag != null and developmentTag != ''">development_tag = #{developmentTag},</if>
            <if test="virtualAge != null">virtual_age = #{virtualAge},</if>
            <if test="currentLevelAge != null">current_level_age = #{currentLevelAge},</if>
            <if test="height != null">height = #{height},</if>
            <if test="weight != null">weight = #{weight},</if>
            <if test="specialNotes != null">special_notes = #{specialNotes},</if>
            <if test="avatarUrl != null and avatarUrl != ''">avatar_url = #{avatarUrl},</if>
            update_by = #{updateBy},
            update_time = sysdate(),
            <if test="remark != null">remark = #{remark},</if>
        </trim>
        where profile_id = #{profileId}
    </update>

    <delete id="deleteGymStudentProfileByProfileId" parameterType="Long">
        update gym_student_profile set del_flag = '2' where profile_id = #{profileId}
    </delete>

    <delete id="deleteGymStudentProfileByProfileIds" parameterType="String">
        update gym_student_profile set del_flag = '2' where profile_id in
        <foreach item="profileId" collection="array" open="(" separator="," close=")">
            #{profileId}
        </foreach>
    </delete>

</mapper>
```

## MyBatis-Plus配置

### application.yml数据库配置
```yaml
# 数据源配置
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    druid:
      # 主库数据源
      master:
        url: jdbc:mysql://localhost:3306/ccmartmeet?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
        username: root
        password: password
      # 从库数据源
      slave:
        # 从数据源开关/默认关闭
        enabled: false
        url:
        username:
        password:
      # 初始连接数
      initialSize: 5
      # 最小连接池数量
      minIdle: 10
      # 最大连接池数量
      maxActive: 20
      # 配置获取连接等待超时的时间
      maxWait: 60000
      # 配置间隔多久才进行一次检测，检测需要关闭的空闲连接，单位是毫秒
      timeBetweenEvictionRunsMillis: 60000
      # 配置一个连接在池中最小生存的时间，单位是毫秒
      minEvictableIdleTimeMillis: 300000
      # 配置一个连接在池中最大生存的时间，单位是毫秒
      maxEvictableIdleTimeMillis: 900000
      # 配置检测连接是否有效
      validationQuery: SELECT 1 FROM DUAL
      testWhileIdle: true
      testOnBorrow: false
      testOnReturn: false
      webStatFilter:
        enabled: true
      statViewServlet:
        enabled: true
        # 设置白名单，不填则允许所有访问
        allow:
      url-pattern: /druid/*
      # 控制台管理用户名和密码
      login-username: ruoyi
      login-password: 123456

# MyBatis Plus配置
mybatis-plus:
  # 搜索指定包别名
  type-aliases-package: com.ruoyi.project.**.domain
  # 配置mapper的扫描，找到所有的mapper.xml映射文件
  mapper-locations: classpath*:mapper/**/*Mapper.xml
  # 加载全局的配置文件
  config-location: classpath:mybatis/mybatis-config.xml
  # MyBatis-Plus全局配置
  global-config:
    db-config:
      # 主键类型（AUTO为自增）
      id-type: auto
      # 逻辑删除配置
      logic-delete-field: delFlag
      logic-delete-value: 2
      logic-not-delete-value: 0
      # 字段填充策略
      insert-strategy: not_null
      update-strategy: not_null
      select-strategy: not_empty
```

### MyBatis配置文件
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <settings>
        <!-- 开启驼峰命名转换 -->
        <setting name="mapUnderscoreToCamelCase" value="true"/>
        <!-- 开启二级缓存 -->
        <setting name="cacheEnabled" value="true"/>
        <!-- 延迟加载 -->
        <setting name="lazyLoadingEnabled" value="true"/>
        <!-- 积极延迟加载 -->
        <setting name="aggressiveLazyLoading" value="false"/>
        <!-- 设置超时时间 -->
        <setting name="defaultStatementTimeout" value="25000"/>
    </settings>
</configuration>
```

## 数据库连接池配置

### DruidConfig.java
```java
package com.ruoyi.framework.config;

import com.alibaba.druid.pool.DruidDataSource;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * druid 配置多数据源
 */
@Configuration
public class DruidConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.druid.master")
    public DataSource masterDataSource(DruidProperties druidProperties) {
        DruidDataSource dataSource = DruidDataSourceBuilder.create().build();
        return druidProperties.dataSource(dataSource);
    }

    @Bean
    @ConfigurationProperties("spring.datasource.druid.slave")
    @ConditionalOnProperty(prefix = "spring.datasource.druid.slave", name = "enabled", havingValue = "true")
    public DataSource slaveDataSource(DruidProperties druidProperties) {
        DruidDataSource dataSource = DruidDataSourceBuilder.create().build();
        return druidProperties.dataSource(dataSource);
    }

    @Bean(name = "dynamicDataSource")
    @Primary
    public DynamicDataSource dataSource(DataSource masterDataSource) {
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(DataSourceType.MASTER.name(), masterDataSource);
        return new DynamicDataSource(masterDataSource, targetDataSources);
    }
}
```

这些实体类和配置示例展示了如何基于RuoYi架构设计符合MyBatis-Plus规范的数据库访问层。
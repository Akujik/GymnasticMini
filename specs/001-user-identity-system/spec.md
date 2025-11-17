# Feature Specification: User Identity System (RuoYi架构版)

**Feature Branch**: `001-user-identity-system`
**Created**: 2025-11-17
**Status**: Draft
**MVP**: MVP-1
**架构**: RuoYi-Vue-Pro (Spring Boot + MyBatis-Plus + Vue3)
**Input**: "Build a user identity system where parents can login via WeChat, create profiles for themselves and their children, and switch between profiles to book classes."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 微信静默登录 (Priority: P1)

家长打开小程序时,系统自动完成微信授权登录,无需任何用户操作,直接进入主页。

**Why this priority**: 登录是所有功能的前置条件,必须最优先实现。静默登录提供无感知体验,降低用户流失率。

**Independent Test**: 可通过打开小程序验证是否自动完成登录,后端日志显示OpenID已获取。

**Acceptance Scenarios**:

1. **Given** 用户首次打开小程序, **When** App.onLaunch触发, **Then** 系统自动调用wx.login获取code并发送到后端
2. **Given** 后端收到code, **When** 调用微信API换取OpenID, **Then** 创建新用户记录并返回JWT Token
3. **Given** 用户已登录过, **When** 再次打开小程序, **Then** 检测到有效Token,直接进入主页

---

### User Story 2 - 引导式档案创建 (Priority: P1)

登录成功后,如果用户没有学员档案,系统在操作界面上方显示浮动提示条"填写学员资料，获取最合适的课程！"，引导用户创建档案。用户可以浏览内容，但点击任何预约操作时会被引导创建档案。

**Why this priority**: 引导式用户体验比强制拦截更友好，同时确保用户了解档案的价值，提升档案创建率。

**Independent Test**: 可通过新用户登录验证是否显示浮动提示，点击提示是否跳转到档案创建页面。

**Acceptance Scenarios**:

1. **Given** 用户登录成功且无学员档案, **When** 进入任何操作Tab（预约/课程/我的）, **Then** 在界面顶部显示浮动提示条"填写学员资料，获取最合适的课程！"
2. **Given** 浮动提示条显示中, **When** 用户点击提示条, **Then** 跳转到学员档案创建页面,弹出"为谁报课？"选择弹框
3. **Given** 用户选择"自己", **When** 进入档案创建页面, **Then** relation_type设为'self',页面标题显示"创建我的档案"
4. **Given** 用户选择"孩子", **When** 进入档案创建页面, **Then** relation_type设为'child',页面标题显示"创建孩子档案"
5. **Given** 用户选择"家人朋友", **When** 进入档案创建页面, **Then** relation_type设为'spouse',页面标题显示"创建家人档案"
6. **Given** 用户填写完必填字段, **When** 点击"保存", **Then** 创建profile记录,建立account与profile关联关系,relation_type对应选择
7. **Given** 用户跳过档案创建, **When** 点击任何预约操作（立即预约、加入候补等）, **Then** 系统拦截操作并引导创建档案
8. **Given** 用户已有学员档案, **When** 进入操作Tab, **Then** 不显示浮动提示条

---

### User Story 3 - 切换档案身份 (Priority: P2)

家长可以在顶部导航栏点击当前档案(显示头像+姓名),弹出档案列表,切换到其他档案(自己或孩子)。

**Why this priority**: 切换身份是多档案管理的核心功能,但不影响单个档案的使用。

**Independent Test**: 可独立测试切换功能,验证切换后页面显示和API请求是否正确过滤数据。

**Acceptance Scenarios**:

1. **Given** 家长已创建多个档案, **When** 点击顶部档案区域, **Then** 弹出档案列表(显示所有关联档案)
2. **Given** 档案列表弹出, **When** 家长点击"小明", **Then** 系统切换当前档案为"小明"并显示Toast提示"已切换至小明"
3. **Given** 当前档案为"小明", **When** 家长查看预约记录, **Then** 只显示"小明"的预约记录
4. **Given** 当前档案为"小明", **When** 家长点击预约课程, **Then** 弹出底部确认弹窗"当前预约课程为【小明】,请确认"

---

### User Story 4 - 查看和编辑档案 (Priority: P3)

家长可以查看档案详情,并编辑姓名、常用名、手机号、运动情况等信息(生日和性别不可修改)。

**Why this priority**: 编辑功能为辅助功能,不影响核心流程,可延后实现。

**Independent Test**: 可独立测试编辑功能,验证更新是否生效。

**Acceptance Scenarios**:

1. **Given** 家长在档案列表页, **When** 点击某个档案的"编辑"按钮, **Then** 进入档案编辑页面
2. **Given** 家长在编辑页面, **When** 修改姓名并保存, **Then** 系统更新profile表的name字段
3. **Given** 家长尝试修改生日, **When** 点击生日字段, **Then** 系统提示"生日不可修改"
4. **Given** 家长在编辑页面, **When** 点击"删除档案", **Then** 系统软删除档案(status=0),不影响历史记录

---

### User Story 5 - 虚拟年龄设置 (Priority: P1)

系统支持为档案设置虚拟年龄，用于特殊情况的课程匹配，如身高较高但年龄较小的学员。虚拟年龄仅用于课程推荐，不影响实际年龄计算和显示。

**Why this priority**: 虚拟年龄是课程匹配系统的重要功能，帮助特殊情况学员找到合适课程，必须P1实现。

**Independent Test**: 验证虚拟年龄设置功能，确认虚拟年龄在课程匹配中的正确应用。

**Acceptance Scenarios**:

1. **Given** 用户创建或编辑档案时, **When** 查看年龄字段, **Then** 显示"实际年龄"和"虚拟年龄(可选)"两个字段
2. **Given** 用户为5岁学员设置虚拟年龄为6岁, **When** 保存档案, **Then** 系统存储虚拟年龄并标注用于课程匹配
3. **Given** 档案设置虚拟年龄后, **When** 浏览课程列表, **Then** 系统使用虚拟年龄进行课程匹配和推荐
4. **Given** 用户查看档案详情, **When** 查看年龄信息, **Then** 显示"实际年龄：5岁，虚拟年龄：6岁(用于课程匹配)"
5. **Given** 教练查看学员档案, **When** 查看年龄信息, **Then** 同时显示实际年龄和虚拟年龄，帮助教练了解学员情况
6. **Given** 用户清空虚拟年龄设置, **When** 保存档案, **Then** 系统恢复使用实际年龄进行课程匹配
7. **Given** 虚拟年龄设置不合理(如3岁学员设为8岁), **When** 保存时, **Then** 系统提示"虚拟年龄差异过大，但仍允许保存"

---

### User Story 6 - 基于年龄的自动类型识别 (Priority: P1)

系统根据学员档案中的年龄自动判断成人/儿童类型（18岁及以上为成人，18岁以下为儿童），为后续预约流程提供类型信息，简化用户操作流程。

**Why this priority**: 自动识别减少用户操作步骤，提升用户体验，避免选择错误导致的预约问题，必须P1实现。

**Independent Test**: 创建不同年龄的学员档案，验证系统是否正确识别类型并在预约流程中使用。

**Acceptance Scenarios**:

1. **Given** 学员档案年龄为20岁，**When** 系统进行类型识别，**Then** 自动识别为成人类型并用于预约流程
2. **Given** 学员档案年龄为10岁，**When** 系统进行类型识别，**Then** 自动识别为儿童类型并用于预约流程
3. **Given** 学员档案年龄为18岁，**When** 系统进行类型识别，**Then** 自动识别为成人类型并用于预约流程
4. **Given** 学员档案年龄为17岁，**When** 系统进行类型识别，**Then** 自动识别为儿童类型并用于预约流程
5. **Given** 学员档案设置了虚拟年龄，**When** 进行课程匹配，**Then** 系统使用虚拟年龄进行匹配，但类型识别基于实际年龄
6. **Given** 用户切换到不同年龄的档案，**When** 类型识别更新，**Then** 系统立即更新反映当前档案的类型信息
7. **Given** 用户编辑档案年龄，**When** 保存后类型发生变化，**Then** 系统重新计算并更新类型识别

---

### User Story 7 - 档案上限控制 (Priority: P3)

系统限制每个微信账号最多创建5个档案(包括自己),超过时提示"最多创建5个档案"。

**Why this priority**: 防滥用功能,优先级较低。

**Independent Test**: 可独立测试上限控制,验证第6个档案创建时是否被阻止。

**Acceptance Scenarios**:

1. **Given** 家长已创建5个档案, **When** 点击"添加家人档案", **Then** 系统弹出提示"最多创建5个档案"
2. **Given** 家长删除一个档案, **When** 再次点击"添加家人档案", **Then** 允许创建新档案

### User Story 8 - 虚拟年龄自动增长 (Priority: P2)

系统定期检查学员的生日，自动增加虚拟年龄，确保虚拟年龄与实际年龄保持同步增长。

**Why this priority**: 虚拟年龄自动增长是维护系统数据一致性的重要功能，确保长期使用准确性。

**Independent Test**: 设置学员虚拟年龄，等待生日过后验证系统是否自动更新虚拟年龄。

**Acceptance Scenarios**:

1. **Given** 学员真实生日到了，**When** 系统定期检查，**Then** 系统自动增加虚拟年龄
2. **Given** 学员虚拟年龄为6岁，真实年龄增长到7岁，**When** 系统自动更新，**Then** 虚拟年龄变为7岁
3. **Given** 系统自动更新虚拟年龄，**When** 更新完成，**Then** 记录更新时间和变更日志
4. **Given** 用户查看档案详情，**When** 虚拟年龄已自动更新，**Then** 显示最新的虚拟年龄信息
5. **Given** 系统定期任务执行，**When** 检查所有学员档案，**Then** 自动更新所有过期的虚拟年龄

---

### Edge Cases

- **网络异常**: 登录时网络中断,如何处理? → 立即显示错误页面,提供"重新登录"按钮,由用户主动触发重试
- **微信授权拒绝**: 用户拒绝微信授权获取手机号,如何处理? → 提示"需要手机号才能创建档案",允许跳过但限制预约功能
- **选择弹框关闭**: 用户关闭选择弹框不选择,如何处理? → 提示"请选择报课目的才能继续",弹框重新出现
- **重复创建**: 用户重复点击保存按钮,如何防止重复创建? → 前端按钮点击后置灰+loading,后端使用唯一约束防止重复
- **档案上限**: 用户已有5个档案但尝试创建第6个,如何提示? → 弹窗提示"最多创建5个档案,请删除后再创建"
- **数据丢失**: 用户填写一半突然退出,如何处理? → 前端使用localStorage临时保存,下次进入时恢复
- **年龄边界**: 用户输入未来日期作为生日,如何处理? → 前端验证生日不得晚于今天
- **身份证格式**: 用户输入错误的身份证号,如何处理? → 前端验证18位数字格式,后端校验校验码
- **relation_type异常**: 后端收到无效relation_type,如何处理? → 返回400错误,前端重新选择

#### 虚拟年龄相关边界情况

- **虚拟年龄差异过大**: 用户设置虚拟年龄与实际年龄差异过大(如5岁vs 15岁)，如何处理？ → 系统提示"差异过大，建议联系客服评估"，但允许设置
- **虚拟年龄超范围**: 用户设置虚拟年龄超出2-18岁范围，如何处理？ → 系统拦截并提示"虚拟年龄应在2-18岁范围内"
- **虚拟年龄与课程不匹配**: 虚拟年龄对应的课程与实际能力不符，如何处理？ → 运营人员可评估调整虚拟年龄或推荐其他课程
- **多个档案虚拟年龄冲突**: 同一账号下多个档案设置不合理的虚拟年龄，如何处理？ → 系统记录异常模式，供运营人员主动联系用户
- **虚拟年龄历史追溯**: 需要查询某学员历史虚拟年龄设置，如何处理？ → 通过virtual_age_log表查询历史变更记录
- **教练端虚拟年龄显示**: 教练看到学员虚拟年龄产生疑问，如何处理？ → 系统同时显示实际年龄和虚拟年龄，教练可联系运营确认
- **虚拟年龄与实际年龄混用**: 系统部分功能误用实际年龄而非虚拟年龄，如何处理？ → 明确各功能的年龄使用规则，确保一致性

---

## Requirements *(mandatory)*

### Functional Requirements

#### 登录相关
- **FR-001**: 系统必须支持微信静默登录(无需用户点击授权按钮)
- **FR-002**: 系统必须在App.onLaunch时自动调用wx.login获取code
- **FR-003**: 后端必须调用微信API将code换取OpenID
- **FR-004**: 系统必须将OpenID直接存储到account表(不加密,符合宪法Principle 1简化优先)
- **FR-005**: 系统必须生成JWT Token并设置30天过期时间
- **FR-006**: 系统必须在小程序storage中存储JWT Token

#### 引导式档案创建相关
- **FR-007**: 系统必须在用户无档案时在操作Tab上方显示浮动提示条"填写学员资料，获取最合适的课程！"
- **FR-008**: 浮动提示条必须可点击并跳转到档案创建页面
- **FR-009**: 浮动提示条必须提供关闭选项，关闭后在下次应用启动时重新显示
- **FR-010**: 系统必须在点击浮动提示条后弹出"为谁报课？"选择弹框
- **FR-011**: 系统必须提供三个选择选项:自己、孩子、家人朋友
- **FR-012**: 系统必须根据选择结果设置对应的relation_type('self'/'child'/'spouse')
- **FR-013**: 系统必须在档案创建页面显示对应的页面标题和引导文案
- **FR-014**: 系统必须拦截无档案用户的所有预约相关操作并引导创建档案，提示文案为"请先创建学员档案，获取您的课程"

#### 档案创建相关
- **FR-015**: 系统必须支持用户创建档案(profile表)
- **FR-016**: 档案必填字段包括:姓名、生日、性别、relation_type
- **FR-017**: 档案选填字段包括:常用名、身份证号/护照、手机号、头像、运动情况
- **FR-018**: 系统必须支持微信授权获取手机号(wx.getPhoneNumber API)
- **FR-019**: 系统必须自动根据生日计算年龄(不存储年龄,每次计算,精确到0.1岁)
- **FR-020**: 系统必须为未上传头像的档案分配默认头像
- **FR-021**: 系统必须限制每个账号最多创建5个档案
- **FR-022**: 系统必须在profile_relation表中建立account与profile的关联关系,包含relation_type

#### 基于年龄的自动类型识别相关
- **FR-023**: 系统必须根据学员档案年龄自动判断成人/儿童类型（18岁及以上为成人，18岁以下为儿童）
- **FR-024**: 系统必须在档案创建或编辑后重新计算并更新类型识别
- **FR-025**: 系统必须在切换档案时立即更新类型识别反映当前档案特征
- **FR-026**: 系统必须在课程匹配时使用虚拟年龄（如果设置），但档案类型仍基于实际年龄

#### 档案管理相关
- **FR-027**: 系统必须支持切换当前操作档案
- **FR-028**: 系统必须在顶部导航栏显示当前档案的头像和姓名
- **FR-029**: 系统必须在切换档案后弹出Toast提示"已切换至XXX"
- **FR-030**: 系统必须根据当前档案过滤预约记录和课程记录
- **FR-031**: 系统必须支持编辑档案信息(姓名、常用名、手机号、运动情况可修改)
- **FR-032**: 系统必须禁止修改生日和性别(业务规则)
- **FR-033**: 系统必须支持软删除档案(status=0),保留历史记录

#### 虚拟年龄相关
- **FR-031**: 系统必须支持为档案设置虚拟年龄，用于课程匹配算法
- **FR-032**: 系统必须分别存储实际年龄(基于生日计算)和虚拟年龄
- **FR-033**: 系统必须在课程匹配时优先使用虚拟年龄(如果设置)
- **FR-034**: 系统必须在档案详情页同时显示实际年龄和虚拟年龄
- **FR-035**: 系统必须验证虚拟年龄的合理性(如不超过实际年龄±3岁)
- **FR-036**: 系统必须支持虚拟年龄的清空和重置功能
- **FR-037**: 系统必须在档案创建时提供虚拟年龄可选设置
- **FR-038**: 系统必须记录虚拟年龄设置的历史变更，用于运营分析

#### 数据验证
- **FR-026**: 系统必须验证身份证号格式(18位数字+校验码)
- **FR-027**: 系统必须验证护照号格式(1-20位字母数字)
- **FR-028**: 系统必须验证生日不得晚于今天
- **FR-029**: 系统必须验证手机号格式(11位数字)
- **FR-030**: 系统必须验证relation_type枚举值('self'/'child'/'spouse')
- **FR-039**: 系统必须验证虚拟年龄范围(2-18岁)和合理性差异

### Key Entities (基于RuoYi架构)

- **sys_user**: RuoYi用户表扩展,存储微信登录用户信息
  - 核心属性:user_id, user_name, nick_name, openid, unionid, session_key, status, del_flag
  - RuoYi标准:create_by, create_time, update_by, update_time, remark, version
  - 业务规则:基于RuoYi sys_user表扩展微信字段，保持RuoYi标准规范

- **gym_student_profile**: 学员档案实体,包含所有可报课人员(家长和孩子)的个人信息
  - 核心属性:profile_id, user_id, student_name, birthday, gender, skill_level, virtual_age
  - RuoYi标准:create_by, create_time, update_by, update_time, remark, version, status, del_flag
  - 业务规则:家长和孩子使用同一张表,字段完全一致;virtual_age用于课程匹配算法

- **gym_virtual_age_log**: 虚拟年龄变更记录实体,追踪虚拟年龄设置的历史变更
  - 核心属性:log_id, profile_id, old_virtual_age, new_virtual_age, change_reason, create_by
  - RuoYi标准:create_time, remark, version
  - 业务规则:记录每次虚拟年龄设置变更,支持运营分析和历史追溯

- **gym_student_relation**: 学员关联关系,定义"谁能管理谁"和"报课目的"
  - 核心属性:relation_id, user_id, profile_id, relation_type, can_book, is_primary
  - RuoYi标准:create_by, create_time, update_by, update_time, remark, version, status, del_flag
  - 业务规则:relation_type映射报课目的 - self(自己报课)、child(给孩子报课)、family(给家人朋友报课)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户首次打开小程序后3秒内完成静默登录
- **SC-002**: 家长能在2分钟内完成选择报课目的和档案创建
- **SC-003**: 切换档案后页面响应时间小于500ms
- **SC-004**: 档案创建成功率达到95%(排除网络异常)
- **SC-005**: 档案数据准确率100%(生日、性别、手机号等字段无错误)
- **SC-006**: 支持5个档案上限,超过时100%阻止创建
- **SC-007**: 软删除档案后历史记录保留率100%
- **SC-008**: 报课目的选择弹框响应时间小于300ms
- **SC-009**: 用户选择报课目的准确率100%(relation_type设置正确)

#### 虚拟年龄功能成功标准

- **SC-010**: 虚拟年龄设置成功率>99%(用户可成功设置和保存虚拟年龄)
- **SC-011**: 虚拟年龄在课程匹配中应用准确率100%(使用虚拟年龄进行课程推荐)
- **SC-012**: 虚拟年龄验证准确率>95%(系统正确拦截不合理的虚拟年龄设置)
- **SC-013**: 实际年龄和虚拟年龄同时显示准确率100%(档案详情页正确显示两个年龄)
- **SC-014**: 虚拟年龄变更记录完整性100%(每次设置变更都记录到日志中)
- **SC-015**: 虚拟年龄清空重置功能成功率100%(用户可正确清空虚拟年龄设置)

---

## 技术实现 (RuoYi架构)

### 后端技术栈

#### Spring Boot配置
```yaml
# application.yml 微信相关配置
wechat:
  miniapp:
    app-id: ${WECHAT_APP_ID}
    app-secret: ${WECHAT_APP_SECRET}
  login:
    jwt-secret: ${JWT_SECRET}
    jwt-expiration: 2592000 # 30天

# RuoYi标准配置
ruoyi:
  profile: /path/to/profile
  addressEnabled: false
```

#### 微信登录Controller
```java
@RestController
@RequestMapping("/gym/auth")
public class GymAuthController extends BaseController {

    @Autowired
    private IGymAuthService gymAuthService;

    @PostMapping("/wechat-login")
    @Log(title = "微信登录", businessType = BusinessType.OTHER)
    public AjaxResult wechatLogin(@RequestBody WechatLoginRequest request) {
        String code = request.getCode();
        if (StringUtils.isEmpty(code)) {
            return AjaxResult.error("微信授权码不能为空");
        }

        try {
            // 调用微信API获取OpenID
            WechatUserInfo wechatUser = gymAuthService.getWechatUserInfo(code);

            // 查询或创建用户
            SysUser user = gymAuthService.findOrCreateUser(wechatUser);

            // 生成JWT Token
            String token = gymAuthService.generateToken(user);

            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            result.put("user", user);
            result.put("hasProfiles", gymAuthService.hasStudentProfiles(user.getUserId()));

            return AjaxResult.success("登录成功", result);
        } catch (Exception e) {
            logger.error("微信登录失败", e);
            return AjaxResult.error("登录失败：" + e.getMessage());
        }
    }
}
```

#### 学员档案Service
```java
@Service
@Transactional
public class GymStudentProfileServiceImpl implements IGymStudentProfileService {

    @Autowired
    private GymStudentProfileMapper profileMapper;

    @Autowired
    private GymStudentRelationMapper relationMapper;

    @Override
    public List<GymStudentProfile> selectProfilesByUserId(Long userId) {
        return profileMapper.selectProfilesByUserId(userId);
    }

    @Override
    @Cacheable(value = "student_profile", key = "#profileId")
    public GymStudentProfile selectGymStudentProfileByProfileId(Long profileId) {
        return profileMapper.selectGymStudentProfileByProfileId(profileId);
    }

    @Override
    @CacheEvict(value = "student_profile", key = "#profile.profileId")
    public int insertGymStudentProfile(GymStudentProfile profile) {
        // 设置默认值
        profile.setStatus("0");
        profile.setDelFlag("0");
        profile.setVersion(0);

        // 验证虚拟年龄合理性
        validateVirtualAge(profile);

        return profileMapper.insertGymStudentProfile(profile);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int createStudentProfileWithRelation(GymStudentProfile profile, String relationType) {
        // 1. 插入学员档案
        profileMapper.insertGymStudentProfile(profile);

        // 2. 创建关联关系
        GymStudentRelation relation = new GymStudentRelation();
        relation.setUserId(SecurityUtils.getUserId());
        relation.setProfileId(profile.getProfileId());
        relation.setRelationType(relationType);
        relation.setCanBook("1");
        relation.setIsPrimary("0");

        return relationMapper.insertGymStudentRelation(relation);
    }

    private void validateVirtualAge(GymStudentProfile profile) {
        if (profile.getVirtualAge() != null) {
            int actualAge = calculateAge(profile.getBirthday());
            int virtualAge = profile.getVirtualAge();

            if (virtualAge < 2 || virtualAge > 18) {
                throw new ServiceException("虚拟年龄应在2-18岁范围内");
            }

            int ageDiff = Math.abs(actualAge - virtualAge);
            if (ageDiff > 3) {
                // 记录异常虚拟年龄设置
                logVirtualAgeAnomaly(profile, actualAge, virtualAge);
            }
        }
    }
}
```

### MyBatis-Plus实体类

#### GymStudentProfile实体
```java
@Data
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
@TableName("gym_student_profile")
public class GymStudentProfile extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @TableId(value = "profile_id", type = IdType.AUTO)
    private Long profileId;

    @TableField("user_id")
    private Long userId;

    @TableField("student_name")
    @NotBlank(message = "学员姓名不能为空")
    @Size(max = 100, message = "学员姓名长度不能超过100个字符")
    private String studentName;

    @TableField("birthday")
    @NotNull(message = "出生日期不能为空")
    private Date birthday;

    @TableField("gender")
    @NotBlank(message = "性别不能为空")
    private String gender;

    @TableField("skill_level")
    private String skillLevel;

    @TableField("development_tag")
    private String developmentTag;

    @TableField("virtual_age")
    @Min(value = 2, message = "虚拟年龄不能小于2")
    @Max(value = 18, message = "虚拟年龄不能大于18")
    private Integer virtualAge;

    // 计算字段，不存数据库
    @TableField(exist = false)
    private Integer age;

    @TableField(exist = false)
    private String ageType; // adult/child

    @TableField(exist = false)
    private String relationType;
}
```

### 小程序端集成

#### 微信登录封装
```javascript
// utils/wechat-auth.js
const wechatAuth = {
  // 静默登录
  async silentLogin() {
    try {
      // 获取登录凭证
      const { code } = await wx.login();

      // 调用后端登录接口
      const response = await this.request({
        url: '/gym/auth/wechat-login',
        method: 'POST',
        data: { code }
      });

      if (response.code === 200) {
        // 存储Token和用户信息
        wx.setStorageSync('token', response.data.token);
        wx.setStorageSync('user', response.data.user);
        wx.setStorageSync('hasProfiles', response.data.hasProfiles);

        return response.data;
      } else {
        throw new Error(response.msg || '登录失败');
      }
    } catch (error) {
      console.error('微信登录失败:', error);
      throw error;
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (!token) {
      return false;
    }

    // 检查Token是否过期（简单验证）
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  // 获取当前用户信息
  getCurrentUser() {
    return wx.getStorageSync('user') || null;
  }
};

module.exports = wechatAuth;
```

#### 学员档案管理
```javascript
// pages/profiles/profiles.js
Page({
  data: {
    profiles: [],
    currentProfile: null,
    showCreateGuide: false
  },

  onLoad() {
    this.checkLoginAndLoadProfiles();
  },

  async checkLoginAndLoadProfiles() {
    // 检查登录状态
    if (!wechatAuth.checkLoginStatus()) {
      await wechatAuth.silentLogin();
    }

    // 加载学员档案
    await this.loadProfiles();
  },

  async loadProfiles() {
    try {
      const response = await this.request({
        url: '/gym/profile/list',
        method: 'GET'
      });

      if (response.code === 200) {
        this.setData({
          profiles: response.data,
          currentProfile: response.data.find(p => p.isPrimary) || response.data[0] || null,
          showCreateGuide: response.data.length === 0
        });
      }
    } catch (error) {
      wx.showToast({
        title: '加载档案失败',
        icon: 'error'
      });
    }
  },

  // 切换当前档案
  async switchProfile(e) {
    const profileId = e.currentTarget.dataset.profileId;
    const profile = this.data.profiles.find(p => p.profileId === profileId);

    if (profile) {
      // 设置当前档案
      wx.setStorageSync('currentProfile', profile);

      this.setData({
        currentProfile: profile
      });

      wx.showToast({
        title: `已切换至${profile.studentName}`,
        icon: 'success'
      });

      // 触发页面刷新
      this.triggerEvent('profileChanged', { profile });
    }
  },

  // 创建学员档案
  navigateToCreateProfile() {
    wx.navigateTo({
      url: '/pages/profiles/create'
    });
  }
});
```

### 管理后台集成

#### RuoYi菜单配置
```sql
-- 管理后台菜单配置
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
VALUES
('学员管理', 2000, 1, 'gymnastics', NULL, 1, 0, 'M', '0', '0', 'gymnastics:profile:list', 'people', 'admin', sysdate(), '', NULL, '学员档案菜单'),
('学员档案', (SELECT menu_id FROM sys_menu WHERE menu_name = '学员管理'), 1, 'profile', 'gymnastics/profile/index', 1, 0, 'C', '0', '0', 'gymnastics:profile:list', 'user', 'admin', sysdate(), '', NULL, '学员档案菜单'),
('学员查询', (SELECT menu_id FROM sys_menu WHERE menu_name = '学员档案'), 1, '', '', 1, 0, 'F', '0', '0', 'gymnastics:profile:query', '#', 'admin', sysdate(), '', NULL, ''),
('学员新增', (SELECT menu_id FROM sys_menu WHERE menu_name = '学员档案'), 2, '', '', 1, 0, 'F', '0', '0', 'gymnastics:profile:add', '#', 'admin', sysdate(), '', NULL, ''),
('学员修改', (SELECT menu_id FROM sys_menu WHERE menu_name = '学员档案'), 3, '', '', 1, 0, 'F', '0', '0', 'gymnastics:profile:edit', '#', 'admin', sysdate(), '', NULL, ''),
('学员删除', (SELECT menu_id FROM sys_menu WHERE menu_name = '学员档案'), 4, '', '', 1, 0, 'F', '0', '0', 'gymnastics:profile:remove', '#', 'admin', sysdate(), '', NULL, '');
```

---

## Assumptions

- 假设用户已安装微信客户端(微信版本8.0.33+)
- 假设用户网络环境稳定(3G/4G/5G/Wi-Fi)
- 假设小程序基础库版本≥3.11.0
- 假设Spring Boot服务器正常运行
- 假设微信API可用(wx.login、wx.getPhoneNumber)
- 假设用户同意微信隐私协议
- 假设RuoYi-Vue-Pro脚手架已正确配置和部署

---

## Out of Scope (MVP-1 不实现)

- ❌ Web后台管理功能(留到MVP-2)
- ❌ 钱包充值功能(留到MVP-4)
- ❌ 课程预约功能(留到MVP-2)
- ❌ 头像上传功能(第一期使用默认头像或微信头像)
- ❌ 档案共享功能(如妈妈和爸爸共同管理孩子,留到后期)
- ❌ 实名认证功能(身份证/护照验证,留到后期)

---

## Open Questions

1. **[NEEDS CLARIFICATION]** 运动情况字段是否需要预设选项(如"游泳、跑步、无运动经验")还是完全自由输入?
   - 建议:第一期使用自由文本输入框,后期可改为标签选择

2. **[NEEDS CLARIFICATION]** 家长如果误删档案,是否需要提供"恢复"功能?
   - 建议:第一期不提供恢复,后期可在Web后台提供管理员恢复功能

3. **[NEEDS CLARIFICATION]** 档案切换时,是否需要记录"最近使用"顺序,优先显示常用档案?
   - 建议:第一期按创建时间倒序显示,后期可优化为按使用频率排序

4. **[NEW]** 虚拟年龄差异的合理范围是多少？
   - 建议: 允许±3岁差异，超出范围建议联系客服评估

5. **[NEW]** 虚拟年龄是否需要运营人员审核？
   - 建议: 差异≤2岁自动通过，差异>2岁建议运营审核

6. **[NEW]** 虚拟年龄设置是否需要设置有效期？
   - 建议: 每6个月重新评估一次，系统提醒用户确认虚拟年龄是否合适

7. **[NEW]** 教练是否可以申请调整学员的虚拟年龄？
   - 建议: 教练可提交申请，运营人员评估后调整

---

**创建人**: [产品经理]
**最后更新**: 2025-11-17
**版本**: v2.0.0
**状态**: Draft
**更新内容**: 技术栈重构为RuoYi架构 (Spring Boot + MyBatis-Plus + Vue3)

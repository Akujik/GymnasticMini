# 实施任务:004-private-lesson

**功能分支**: `004-private-lesson`
**创建时间**: 2025-11-08
**状态**: Draft
**MVP**: 4
**预估工作量**: 12个工作日

---

## 任务分解总览

### Phase 1: 基础架构搭建 (2天)

#### Task 1.1: 数据库设计实现
**优先级**: P0
**预估时间**: 4小时
**描述**: 创建私教课系统的5个核心数据表，建立完整的数据模型
**依赖关系**: None
**负责人**: 后端开发工程师

**子任务**:
1. 创建 `private_instructor` 表 (私教教练表)
   - 包含教练基础信息和4维标签字段
   - 设置外键约束和索引
   - 插入测试数据

2. 创建 `private_course_tags` 表 (私教课程标签表)
   - 实现4维标签匹配的存储结构
   - 设置复合索引优化查询性能
   - 关联教练表

3. 创建 `private_inquiry` 表 (私教咨询记录表)
   - 设计FR-042核心咨询流程数据结构
   - 设置用户和教练外键关系
   - 创建状态管理索引

4. 创建 `private_consultation` 表 (私教咨询流程表)
   - 扩展咨询流程管理功能
   - 设计运营跟进记录结构
   - 关联咨询记录表

5. 创建 `private_booking` 表 (私教预约记录表)
   - 实现运营录入预约的核心功能
   - 设计时间冲突检测索引
   - 关联用户、教练、档案表

6. 创建 `coach_schedule` 表 (教练排班表)
   - 支持教练排班管理
   - 设计可用时间查询索引
   - 关联教练表

**验收标准**:
- [ ] 所有表创建成功，DDL语法正确
- [ ] 外键约束正确设置，数据完整性保证
- [ ] 索引创建成功，性能优化到位
- [ ] 测试数据插入成功，数据关系正确
- [ ] 数据库迁移脚本可回滚

**交付物**:
- MySQL DDL脚本
- 数据库ER图更新
- 测试数据SQL脚本
- 数据字典文档

#### Task 1.2: FastAPI项目架构搭建
**优先级**: P0
**预估时间**: 3小时
**描述**: 搭建FastAPI项目基础架构，实现统一的API框架
**依赖关系**: Task 1.1
**负责人**: 后端开发工程师

**子任务**:
1. 创建FastAPI项目结构
   ```
   app/
   ├── api/
   │   ├── v1/
   │   │   ├── __init__.py
   │   │   ├── private_lessons.py
   │   │   ├── inquiries.py
   │   │   └── bookings.py
   ├── core/
   │   ├── config.py
   │   ├── security.py
   │   └── database.py
   ├── models/
   │   ├── private_instructor.py
   │   ├── private_inquiry.py
   │   └── private_booking.py
   ├── schemas/
   │   ├── instructor.py
   │   ├── inquiry.py
   │   └── booking.py
   └── services/
       ├── instructor_service.py
       ├── inquiry_service.py
       └── booking_service.py
   ```

2. 实现统一响应格式
   ```python
   @app.exception_handler(Exception)
   async def global_exception_handler(request: Request, exc: Exception):
       return JSONResponse(
           status_code=500,
           content={
               "code": 500,
               "message": "内部服务器错误",
               "data": None,
               "timestamp": datetime.utcnow().isoformat(),
               "request_id": request.headers.get("x-request-id")
           }
       )
   ```

3. 实现JWT认证中间件
   - 集成现有用户认证系统
   - 实现API权限控制
   - 添加请求ID追踪

4. 配置数据库连接
   - SQLAlchemy ORM配置
   - 数据库连接池设置
   - 事务管理

**验收标准**:
- [ ] 项目结构清晰，符合FastAPI最佳实践
- [ ] 统一响应格式实现正确
- [ ] JWT认证中间件正常工作
- [ ] 数据库连接配置正确
- [ ] API文档自动生成

**交付物**:
- FastAPI项目代码
- 配置文件模板
- API文档链接
- 项目启动脚本

#### Task 1.3: 4维标签匹配引擎实现
**优先级**: P0
**预估时间**: 5小时
**描述**: 实现FR-040核心的4维标签白名单匹配算法
**依赖关系**: Task 1.1, Task 1.2
**负责人**: 后端开发工程师

**子任务**:
1. 实现4维匹配算法
   ```python
   class FourDimensionalMatcher:
       def match(self, profile_tags, instructor_tags):
           """4维白名单匹配算法"""
           required_dimensions = ['level', 'age', 'gender', 'course_type']

           for dimension in required_dimensions:
               if not self._match_dimension(
                   profile_tags.get(dimension),
                   instructor_tags.get(dimension)
               ):
                   return 0.0  # 任一维度不匹配则返回0
           return 100.0  # 所有维度都匹配则返回100
   ```

2. 实现匹配结果缓存
   - Redis缓存配置
   - 缓存键设计规范
   - 缓存失效策略

3. 实现匹配详情记录
   - 详细的匹配过程记录
   - 各维度匹配结果说明
   - 匹配算法版本管理

4. 性能优化
   - 数据库查询优化
   - 复合索引利用
   - 批量查询优化

**验收标准**:
- [ ] 4维匹配算法准确率100%
- [ ] 匹配结果正确过滤和排序
- [ ] 缓存命中率>80%
- [ ] 匹配响应时间<100ms
- [ ] 单元测试覆盖率>95%

**交付物**:
- 4维匹配引擎代码
- 性能测试报告
- 单元测试代码
- 算法文档

### Phase 2: 私教课浏览功能 (3天)

#### Task 2.1: 教练列表API开发
**优先级**: P1
**预估时间**: 6小时
**描述**: 实现私教教练列表查询API，集成4维匹配算法
**依赖关系**: Phase 1完成
**负责人**: 后端开发工程师

**子任务**:
1. 实现 GET /api/v1/private-lessons API
   ```python
   @router.get("/private-lessons")
   async def get_private_lessons(
       profile_id: int,
       level: Optional[str] = None,
       age_range: Optional[str] = None,
       gender: Optional[str] = None,
       page: int = 1,
       limit: int = 20
   ):
   ```

2. 实现查询参数处理
   - 档案ID必填验证
   - 筛选参数校验
   - 分页参数处理

3. 集成4维匹配算法
   - 调用FourDimensionalMatcher
   - 应用匹配结果过滤
   - 实现匹配详情返回

4. 实现排序逻辑
   - 热门程度排序
   - 评分权重排序
   - 创建时间排序

**验收标准**:
- [ ] API正确返回4维匹配结果
- [ ] 查询参数验证正确
- [ ] 分页功能正常工作
- [ ] 响应时间<500ms
- [ ] 错误处理完善

**交付物**:
- API接口代码
- 接口测试用例
- API文档
- 性能测试报告

#### Task 2.2: 教练详情API开发
**优先级**: P1
**预估时间**: 4小时
**描述**: 实现私教教练详情查询API，提供完整教练信息
**依赖关系**: Task 2.1
**负责人**: 后端开发工程师

**子任务**:
1. 实现 GET /api/v1/private-lessons/{instructor_id} API
2. 实现教练信息聚合查询
3. 实现可用时间查询功能
4. 实现学员评价展示

**验收标准**:
- [ ] 教练详细信息正确返回
- [ ] 可用时间查询准确
- [ ] 评价信息展示完整
- [ ] 数据缓存正常工作

**交付物**:
- API接口代码
- 数据查询优化代码
- 缓存策略实现
- 测试用例

#### Task 2.3: 小程序教练列表页面
**优先级**: P1
**预估时间**: 4小时
**描述**: 开发小程序私教教练列表页面，实现FR-042仅浏览模式
**依赖关系**: Task 2.1
**负责人**: 前端开发工程师

**子任务**:
1. 创建教练列表页面 (pages/private-lessons/index)
2. 实现教练卡片组件
3. 实现4维匹配结果展示
4. 实现下拉刷新和分页加载

**页面结构**:
```xml
<view class="private-lessons-container">
  <!-- 4D匹配说明 -->
  <view class="match-notice">
    为您匹配的教练（4维100%匹配）
  </view>

  <!-- 教练列表 -->
  <view class="instructor-list">
    <view
      class="instructor-card"
      wx:for="{{instructors}}"
      wx:key="id"
      bindtap="navigateToDetail"
      data-id="{{item.id}}"
    >
      <!-- 教练头像和基本信息 -->
      <view class="instructor-basic">
        <image class="avatar" src="{{item.avatar_url}}" />
        <view class="info">
          <text class="name">{{item.name}}</text>
          <text class="title">{{item.bio}}</text>
          <view class="rating">
            <text class="score">{{item.rating}}</text>
            <text class="hours">{{item.teaching_hours}}课时</text>
          </view>
        </view>
      </view>

      <!-- 匹配详情 -->
      <view class="match-details">
        <text class="match-score">匹配度: {{item.match_score}}%</text>
        <view class="tags">
          <text class="tag">{{item.level_range}}</text>
          <text class="tag">{{item.age_range}}</text>
          <text class="tag">{{item.course_type}}</text>
        </view>
      </view>
    </view>
  </view>
</view>
```

**验收标准**:
- [ ] 页面加载时间<1秒
- [ ] 教练信息显示正确
- [ ] 4维匹配结果展示准确
- [ ] 下拉刷新和分页正常
- [ ] 仅浏览模式UI正确

**交付物**:
- 页面代码
- 组件代码
- 样式文件
- 页面测试报告

#### Task 2.4: 小程序教练详情页面
**优先级**: P1
**预估时间**: 5小时
**描述**: 开发小程序私教教练详情页面，展示完整教练信息
**依赖关系**: Task 2.2, Task 2.3
**负责人**: 前端开发工程师

**子任务**:
1. 创建教练详情页面 (pages/private-lessons/detail)
2. 实现教练信息展示组件
3. 实现联系客服功能（FR-042核心）
4. 实现微信客服跳转

**页面结构**:
```xml
<view class="instructor-detail-container">
  <!-- 教练基本信息 -->
  <view class="instructor-header">
    <image class="avatar" src="{{instructor.avatar_url}}" />
    <view class="info">
      <text class="name">{{instructor.name}}</text>
      <text class="title">{{instructor.bio}}</text>
      <view class="rating">
        <text class="score">⭐{{instructor.rating}}</text>
        <text class="hours">{{instructor.teaching_hours}}课时经验</text>
      </view>
    </view>
  </view>

  <!-- 教练专长 -->
  <view class="section">
    <text class="section-title">专长领域</text>
    <view class="specialties">
      <text
        class="specialty-tag"
        wx:for="{{instructor.specialties}}"
        wx:key="*this"
      >{{item}}</text>
    </view>
  </view>

  <!-- 4D匹配详情 -->
  <view class="section">
    <text class="section-title">匹配详情</text>
    <view class="match-details">
      <view class="dimension-item">
        <text class="dimension">等级匹配:</text>
        <text class="result success">✓{{instructor.match_details.level}}</text>
      </view>
      <view class="dimension-item">
        <text class="dimension">年龄匹配:</text>
        <text class="result success">✓{{instructor.match_details.age}}</text>
      </view>
      <view class="dimension-item">
        <text class="dimension">性别匹配:</text>
        <text class="result success">✓{{instructor.match_details.gender}}</text>
      </view>
      <view class="dimension-item">
        <text class="dimension">类型匹配:</text>
        <text class="result success">✓{{instructor.match_details.course_type}}</text>
      </view>
    </view>
  </view>

  <!-- 仅浏览模式说明 -->
  <view class="browse-only-notice">
    <text class="notice-icon">ℹ️</text>
    <text class="notice-text">
      私教课仅支持浏览，请联系客服预约
    </text>
  </view>

  <!-- 联系客服按钮 -->
  <view class="action-buttons">
    <button
      class="btn-contact"
      bindtap="contactCustomerService"
    >
      联系客服预约
    </button>
  </view>
</view>
```

**微信客服跳转实现**:
```javascript
contactCustomerService() {
  const { instructor, profile } = this.data;

  // 检查微信客服API可用性
  wx.openCustomerServiceChat({
    extInfo: {
      url: `https://your-domain.com/customer-service`,
      instructorId: instructor.id,
      instructorName: instructor.name,
      profileId: profile.id,
      profileName: profile.name
    },
    corpId: 'your-corp-id',
    showMessageCard: true,
    sendMessageTitle: `咨询${instructor.name}教练私教课`,
    sendMessagePath: `/pages/private-lessons/detail?id=${instructor.id}`,
    success: () => {
      console.log('客服对话框打开成功');
      // 记录客服点击事件
      this.trackCustomerServiceClick(instructor.id);
    },
    fail: (err) => {
      console.error('客服对话框打开失败', err);
      // 降级方案：显示二维码
      this.showQrCodeModal();
    }
  });
}
```

**验收标准**:
- [ ] 教练详情信息显示完整准确
- [ ] 4维匹配详情展示清晰
- [ ] 仅浏览模式提示正确显示
- [ ] 微信客服跳转成功率>95%
- [ ] 降级方案正常工作

**交付物**:
- 详情页面代码
- 组件代码
- 微信客服集成代码
- 降级方案代码

### Phase 3: 咨询流程开发 (3天)

#### Task 3.1: 咨询API开发
**优先级**: P1
**预估时间**: 6小时
**描述**: 实现FR-042核心的咨询申请和查询API
**依赖关系**: Phase 1完成
**负责人**: 后端开发工程师

**子任务**:
1. 实现咨询提交API
   ```python
   @router.post("/private-inquiries")
   async def create_inquiry(
       inquiry: InquiryCreate,
       current_user: User = Depends(get_current_user)
   ):
   ```

2. 实现咨询查询API
   ```python
   @router.get("/private-inquiries")
   async def get_inquiries(
       user_id: Optional[int] = None,
       status: Optional[str] = None,
       page: int = 1,
       limit: int = 10
   ):
   ```

3. 实现咨询状态更新API
   ```python
   @router.patch("/private-inquiries/{inquiry_id}/status")
   async def update_inquiry_status(
       inquiry_id: int,
       status_update: InquiryStatusUpdate
   ):
   ```

4. 实现咨询自动过期处理
   - 定时任务扫描过期咨询
   - 自动状态更新为expired
   - 通知运营人员处理

**验收标准**:
- [ ] 咨询提交成功率>99%
- [ ] 查询接口响应时间<500ms
- [ ] 状态更新正确执行
- [ ] 过期处理机制正常工作

**交付物**:
- API接口代码
- 数据验证代码
- 状态管理代码
- 定时任务代码

#### Task 3.2: 咨询流程管理服务
**优先级**: P1
**预估时间**: 5小时
**描述**: 实现咨询流程状态机和跟进管理
**依赖关系**: Task 3.1
**负责人**: 后端开发工程师

**子任务**:
1. 实现咨询状态机
   ```python
   class InquiryStateMachine:
       STATES = {
           'pending': ['contacted', 'expired'],
           'contacted': ['booked', 'not_interested', 'expired'],
           'booked': [],  # 终态
           'not_interested': [],  # 终态
           'expired': []  # 终态
       }

       def transition(self, current_state, action):
           valid_states = self.STATES.get(current_state, [])
           if action in valid_states:
               return action
           raise ValueError(f"Invalid transition: {current_state} -> {action}")
   ```

2. 实现跟进记录管理
   - 跟进时间记录
   - 跟进内容存储
   - 跟进次数统计

3. 实现自动提醒功能
   - 24小时未联系提醒
   - 7天未处理过期提醒
   - 转化率统计分析

**验收标准**:
- [ ] 状态转换逻辑正确
- [ ] 跟进记录完整保存
- [ ] 自动提醒及时发送
- [ ] 统计数据准确

**交付物**:
- 状态机代码
- 跟进管理代码
- 提醒服务代码
- 统计分析代码

#### Task 3.3: 小程序咨询表单页面
**优先级**: P1
**预估时间**: 4小时
**描述**: 开发小程序咨询表单页面，实现FR-042咨询提交流程
**依赖关系**: Task 3.1
**负责人**: 前端开发工程师

**子任务**:
1. 创建咨询表单页面 (pages/inquiry/form)
2. 实现表单验证逻辑
3. 实现咨询提交功能
4. 实现成功反馈页面

**页面结构**:
```xml
<view class="inquiry-form-container">
  <form bindsubmit="submitInquiry">
    <!-- 教练信息 -->
    <view class="section">
      <text class="section-title">意向教练</text>
      <picker bindchange="onInstructorChange" value="{{instructorIndex}}" range="{{instructors}}">
        <view class="picker">
          <text class="picker-text">
            {{instructors[instructorIndex].name || '请选择教练'}}
          </text>
        </view>
      </picker>
    </view>

    <!-- 学员选择 -->
    <view class="section">
      <text class="section-title">学员信息</text>
      <picker bindchange="onProfileChange" value="{{profileIndex}}" range="{{profiles}}">
        <view class="picker">
          <text class="picker-text">
            {{profiles[profileIndex].name || '请选择学员'}}
          </text>
        </view>
      </picker>
    </view>

    <!-- 咨询内容 -->
    <view class="section">
      <text class="section-title">咨询内容</text>
      <textarea
        class="textarea"
        placeholder="请描述您的需求..."
        bindinput="onContentChange"
        value="{{content}}"
        maxlength="500"
      ></textarea>
    </view>

    <!-- 联系方式 -->
    <view class="section">
      <text class="section-title">联系方式</text>
      <input
        class="input"
        placeholder="手机号或微信号"
        bindinput="onContactInfoChange"
        value="{{contactInfo}}"
      />
    </view>

    <!-- 期望时间 -->
    <view class="section">
      <text class="section-title">期望时间</text>
      <input
        class="input"
        placeholder="如：周末下午"
        bindinput="onPreferredTimeChange"
        value="{{preferredTime}}"
      />
    </view>

    <!-- 提交按钮 -->
    <view class="actions">
      <button
        class="btn-submit"
        form-type="submit"
        disabled="{{submitting}}"
      >
        {{submitting ? '提交中...' : '提交咨询'}}
      </button>
    </view>
  </form>
</view>
```

**表单提交逻辑**:
```javascript
async submitInquiry(e) {
  const { instructorIndex, profileIndex, content, contactInfo, preferredTime } = this.data;

  // 表单验证
  if (!instructorIndex && instructorIndex !== 0) {
    wx.showToast({ title: '请选择教练', icon: 'none' });
    return;
  }

  if (!content.trim()) {
    wx.showToast({ title: '请填写咨询内容', icon: 'none' });
    return;
  }

  this.setData({ submitting: true });

  try {
    const response = await wx.request({
      url: `${API_BASE_URL}/api/v1/private-inquiries`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: {
        instructor_id: this.data.instructors[instructorIndex].id,
        profile_id: this.data.profiles[profileIndex].id,
        inquiry_content: content,
        contact_info: contactInfo,
        preferred_time: preferredTime
      }
    });

    if (response.data.code === 200) {
      wx.showToast({
        title: '咨询提交成功',
        icon: 'success'
      });

      // 跳转到咨询记录页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/inquiry/list'
        });
      }, 1500);
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('提交咨询失败:', error);
    wx.showToast({
      title: '提交失败，请重试',
      icon: 'none'
    });
  } finally {
    this.setData({ submitting: false });
  }
}
```

**验收标准**:
- [ ] 表单验证逻辑正确
- [ ] 咨询提交成功率>99%
- [ ] 提交反馈及时准确
- [ ] 错误处理完善

**交付物**:
- 表单页面代码
- 表单验证代码
- 提交处理代码
- 错误处理代码

#### Task 3.4: 小程序咨询记录页面
**优先级**: P1
**预估时间**: 3小时
**描述**: 开发小程序咨询记录列表页面，展示用户的咨询历史
**依赖关系**: Task 3.1, Task 3.3
**负责人**: 前端开发工程师

**子任务**:
1. 创建咨询记录页面 (pages/inquiry/list)
2. 实现状态筛选功能
3. 实现咨询详情查看
4. 实现下拉刷新

**页面结构**:
```xml
<view class="inquiry-list-container">
  <!-- 状态筛选 -->
  <view class="filter-tabs">
    <view
      class="tab {{activeTab === 'all' ? 'active' : ''}}"
      bindtap="switchTab"
      data-tab="all"
    >
      全部 ({{counts.all}})
    </view>
    <view
      class="tab {{activeTab === 'pending' ? 'active' : ''}}"
      bindtap="switchTab"
      data-tab="pending"
    >
      待联系 ({{counts.pending}})
    </view>
    <view
      class="tab {{activeTab === 'contacted' ? 'active' : ''}}"
      bindtap="switchTab"
      data-tab="contacted"
    >
      已联系 ({{counts.contacted}})
    </view>
    <view
      class="tab {{activeTab === 'booked' ? 'active' : ''}}"
      bindtap="switchTab"
      data-tab="booked"
    >
      已预约 ({{counts.booked}})
    </view>
  </view>

  <!-- 咨询列表 -->
  <view class="inquiry-list">
    <view
      class="inquiry-item"
      wx:for="{{inquiries}}"
      wx:key="id"
      bindtap="navigateToDetail"
      data-id="{{item.id}}"
    >
      <view class="inquiry-header">
        <view class="instructor-info">
          <image class="avatar" src="{{item.instructor.avatar_url}}" />
          <text class="name">{{item.instructor.name}}</text>
        </view>
        <view class="status {{item.status}}">
          {{item.statusText}}
        </view>
      </view>

      <view class="inquiry-content">
        <text class="content">{{item.inquiry_content}}</text>
      </view>

      <view class="inquiry-meta">
        <text class="time">{{item.created_at}}</text>
        <text class="follow-up" wx:if="{{item.follow_up_count > 0}}">
          已跟进{{item.follow_up_count}}次
        </text>
      </view>
    </view>
  </view>

  <!-- 加载更多 -->
  <view class="load-more" wx:if="{{hasMore}}">
    <text bindtap="loadMore">加载更多</text>
  </view>
</view>
```

**验收标准**:
- [ ] 咨询记录显示完整准确
- [ ] 状态筛选功能正常
- [ ] 下拉刷新和加载更多正常
- [ ] 详情跳转正确

**交付物**:
- 列表页面代码
- 状态筛选代码
- 分页加载代码
- 详情跳转代码

### Phase 4: 运营后台开发 (2天)

#### Task 4.1: 咨询管理后台
**优先级**: P2
**预估时间**: 6小时
**描述**: 开发Vue3管理后台的咨询管理功能
**依赖关系**: Phase 3完成
**负责人**: 后端开发工程师

**子任务**:
1. 开发咨询列表页面 (views/inquiries/List.vue)
2. 实现咨询详情页面 (views/inquiries/Detail.vue)
3. 实现跟进记录功能 (views/inquiries/FollowUp.vue)
4. 实现批量处理功能

**页面结构**:
```vue
<template>
  <div class="inquiry-management">
    <!-- 查询筛选 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态">
            <el-option label="全部" value=""></el-option>
            <el-option label="待联系" value="pending"></el-option>
            <el-option label="已联系" value="contacted"></el-option>
            <el-option label="已预约" value="booked"></el-option>
            <el-option label="不感兴趣" value="not_interested"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 咨询列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>咨询列表</span>
          <el-button type="primary" size="small" @click="handleBatchProcess">
            批量处理
          </el-button>
        </div>
      </template>

      <el-table
        :data="inquiryList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="咨询ID" prop="id" width="80" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            {{ row.user?.name }}
          </template>
        </el-table-column>
        <el-table-column label="教练" width="120">
          <template #default="{ row }">
            {{ row.instructor?.name }}
          </template>
        </el-table-column>
        <el-table-column label="咨询内容" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.inquiry_content" placement="top">
              <span class="content-truncate">{{ row.inquiry_content }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="跟进次数" width="100" prop="follow_up_count" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="handleDetail(row)"
            >
              详情
            </el-button>
            <el-dropdown @command="handleCommand">
              <el-button size="small" type="text">
                更多<el-icon class="el-icon--right" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'contact', data: row }">
                    联系用户
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'book', data: row }">
                    录入预约
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'close', data: row }">
                    关闭咨询
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
  </div>
</template>
```

**验收标准**:
- [ ] 咨询列表显示正确完整
- [ ] 筛选和分页功能正常
- [ ] 批量处理功能正常工作
- [ ] 详情页面数据准确

**交付物**:
- Vue3页面代码
- API接口调用代码
- 样式文件
- 组件代码

#### Task 4.2: 预约录入功能
**优先级**: P2
**预估时间**: 5小时
**描述**: 开发运营后台的私教课预约录入功能，实现FR-042线下录入
**依赖关系**: Phase 4.1
**负责人**: 后端开发工程师

**子任务**:
1. 开发预约录入表单 (views/bookings/Create.vue)
2. 实现时间冲突检测
3. 实现自动通知发送
4. 实现预约列表管理

**预约录入表单**:
```vue
<template>
  <div class="booking-form">
    <el-form
      ref="bookingForm"
      :model="bookingForm"
      :rules="bookingRules"
      label-width="120px"
    >
      <!-- 学员选择 -->
      <el-form-item label="学员" prop="profile_id">
        <el-select
          v-model="bookingForm.profile_id"
          placeholder="请选择学员"
          filterable
          @change="handleProfileChange"
        >
          <el-option
            v-for="profile in profiles"
            :key="profile.id"
            :label="`${profile.name} (${profile.age}岁)`"
            :value="profile.id"
          />
        </el-select>
      </el-form-item>

      <!-- 教练选择 -->
      <el-form-item label="教练" prop="instructor_id">
        <el-select
          v-model="bookingForm.instructor_id"
          placeholder="请选择教练"
          filterable
          @change="handleInstructorChange"
        >
          <el-option
            v-for="instructor in instructors"
            :key="instructor.id"
            :label="instructor.name"
            :value="instructor.id"
          />
        </el-select>
      </el-form-item>

      <!-- 预约时间 -->
      <el-form-item label="预约时间" prop="booking_time">
        <el-date-picker
          v-model="bookingForm.booking_time"
          type="datetime"
          placeholder="选择预约时间"
          @change="handleTimeChange"
        />
      </el-form-item>

      <!-- 课程时长 -->
      <el-form-item label="课程时长" prop="duration">
        <el-select v-model="bookingForm.duration" placeholder="请选择时长">
          <el-option label="30分钟" :value="30" />
          <el-option label="60分钟" :value="60" />
          <el-option label="90分钟" :value="90" />
          <el-option label="120分钟" :value="120" />
        </el-select>
      </el-form-item>

      <!-- 实际价格 -->
      <el-form-item label="实际价格" prop="actual_price">
        <el-input-number
          v-model="bookingForm.actual_price"
          :precision="2"
          :step="10"
          :min="0"
          placeholder="请输入价格"
        />
      </el-form-item>

      <!-- 支付方式 -->
      <el-form-item label="支付方式" prop="payment_method">
        <el-radio-group v-model="bookingForm.payment_method">
          <el-radio label="offline">线下支付</el-radio>
          <el-radio label="wechat">微信支付</el-radio>
          <el-radio label="alipay">支付宝</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 备注 -->
      <el-form-item label="备注">
        <el-input
          v-model="bookingForm.confirmation_notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
        />
      </el-form-item>

      <!-- 冲突检测结果 -->
      <el-form-item v-if="conflictCheck.hasConflict">
        <el-alert
          title="时间冲突"
          type="error"
          :description="conflictCheck.description"
          show-icon
        />
      </el-form-item>

      <!-- 表单操作 -->
      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :disabled="conflictCheck.hasConflict">
          提交预约
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
```

**时间冲突检测逻辑**:
```javascript
async handleTimeChange(time) {
  if (!time || !this.bookingForm.instructor_id) return;

  try {
    const response = await this.$http.post('/api/v1/admin/private-bookings/check-conflict', {
      instructor_id: this.bookingForm.instructor_id,
      booking_time: time.toISOString(),
      duration: this.bookingForm.duration || 60
    });

    if (response.data.has_conflict) {
      this.conflictCheck = {
        hasConflict: true,
        description: response.data.description,
        conflicts: response.data.conflicts,
        suggestedAlternatives: response.data.suggestedAlternatives
      };

      this.$message.error('检测到时间冲突，请选择其他时间');
    } else {
      this.conflictCheck = { hasConflict: false };
    }
  } catch (error) {
    console.error('冲突检测失败:', error);
    this.$message.error('冲突检测失败，请重试');
  }
}
```

**验收标准**:
- [ ] 预约录入表单验证正确
- [ ] 时间冲突检测准确率100%
- [ ] 预约创建成功率>98%
- [ ] 通知发送及时准确

**交付物**:
- 表单页面代码
- 冲突检测代码
- API接口代码
- 通知服务代码

#### Task 4.3: 教练管理功能
**优先级**: P2
**预估时间**: 3小时
**描述**: 开发运营后台的教练管理功能，支持教练信息和排班管理
**依赖关系**: Task 4.2
**负责人**: 后端开发工程师

**子任务**:
1. 开发教练列表页面 (views/instructors/List.vue)
2. 开发教练详情页面 (views/instructors/Detail.vue)
3. 开发排班管理页面 (views/instructors/Schedule.vue)
4. 实现教练工作量统计

**验收标准**:
- [ ] 教练CRUD操作正常
- [ ] 排班管理功能完整
- [ ] 工作量统计准确
- [ ] 数据权限控制正确

**交付物**:
- 教练管理页面代码
- 排班管理代码
- 统计分析代码
- 权限控制代码

### Phase 5: 测试与优化 (2天)

#### Task 5.1: 单元测试开发
**优先级**: P0
**预估时间**: 6小时
**描述**: 开发完整的单元测试，确保代码质量和业务逻辑正确性
**依赖关系**: Phase 4完成
**负责人**: 测试工程师

**测试覆盖重点**:
1. **4维匹配算法测试**
   ```python
   def test_four_dimensional_matcher_perfect_match():
       matcher = FourDimensionalMatcher()
       profile_tags = {
           'level': 'L2',
           'age': '4-5',
           'gender': 'male',
           'course_type': 'interest'
       }
       instructor_tags = {
           'level': ['L1+', 'L2', 'L3'],
           'age': '4-5',
           'gender': 'both',
           'course_type': 'interest'
       }
       result = matcher.match(profile_tags, instructor_tags)
       assert result == 100.0

   def test_four_dimensional_matcher_no_match():
       # 测试任一维度不匹配的情况
   ```

2. **咨询流程测试**
   ```python
   def test_inquiry_state_machine():
       sm = InquiryStateMachine()
       assert sm.transition('pending', 'contacted') == 'contacted'
       assert sm.transition('contacted', 'booked') == 'booked'
       assert sm.transition('pending', 'expired') == 'expired'

   def test_inquiry_auto_expiry():
       # 测试咨询自动过期功能
   ```

3. **时间冲突检测测试**
   ```python
   def test_time_conflict_detection():
       # 测试正常情况无冲突
       # 测试时间冲突情况
       # 测试边界情况
   ```

**验收标准**:
- [ ] 单元测试覆盖率>90%
- [ ] 核心业务逻辑测试通过率100%
- [ ] 测试用例文档完整
- [ ] CI/CD集成测试通过

**交付物**:
- 单元测试代码
- 测试用例文档
- 测试报告
- CI/CD配置

#### Task 5.2: 集成测试开发
**优先级**: P0
**预估时间**: 5小时
**描述**: 开发端到端集成测试，验证完整的业务流程
**依赖关系**: Task 5.1
**负责人**: 测试工程师

**测试场景**:
1. **完整咨询流程测试**
   - 用户浏览教练列表
   - 提交咨询申请
   - 运营人员处理咨询
   - 录入预约记录
   - 用户查看预约记录

2. **4维匹配流程测试**
   - 不同标签组合的匹配结果
   - 匹配算法性能测试
   - 缓存机制测试

3. **时间冲突检测测试**
   - 单个教练时间冲突
   - 多个教练并发预约
   - 边界时间处理

4. **跨模块依赖测试**
   - 与用户系统集成
   - 与通知系统集成
   - 与支付系统集成(预留)

**验收标准**:
- [ ] 集成测试通过率100%
- [ ] 端到端流程测试通过
- [ ] 跨模块接口调用正常
- [ ] 性能测试达标

**交付物**:
- 集成测试代码
- 端到端测试脚本
- 测试环境配置
- 测试报告

#### Task 5.3: 性能优化
**优先级**: P1
**预估时间**: 3小时
**描述**: 进行系统性能优化，确保满足性能指标要求
**依赖关系**: Task 5.2
**负责人**: 后端开发工程师

**优化重点**:
1. **数据库查询优化**
   - 分析慢查询SQL
   - 优化索引使用
   - 实现查询缓存

2. **API响应时间优化**
   - 减少不必要的数据查询
   - 实现响应数据缓存
   - 优化序列化性能

3. **4维匹配算法优化**
   - 算法逻辑优化
   - 缓存策略优化
   - 并发处理优化

**性能目标**:
- [ ] API响应时间P95<500ms
- [ ] 4维匹配算法<100ms
- [ ] 数据库查询优化率>80%
- [ ] 缓存命中率>85%

**交付物**:
- 性能优化代码
- 数据库索引优化
- 缓存策略实现
- 性能测试报告

---

## 任务依赖关系图

```
Phase 1 (基础架构)
├── Task 1.1 (数据库设计)
├── Task 1.2 (API框架)
└── Task 1.3 (4D匹配引擎)
    └─> Phase 2 (浏览功能)

Phase 2 (浏览功能)
├── Task 2.1 (教练列表API)
├── Task 2.2 (教练详情API)
├── Task 2.3 (小程序列表页)
└── Task 2.4 (小程序详情页)
    └─> Phase 3 (咨询流程)

Phase 3 (咨询流程)
├── Task 3.1 (咨询API)
├── Task 3.2 (流程管理)
├── Task 3.3 (咨询表单页)
└── Task 3.4 (咨询记录页)
    └─> Phase 4 (运营后台)

Phase 4 (运营后台)
├── Task 4.1 (咨询管理)
├── Task 4.2 (预约录入)
└── Task 4.3 (教练管理)
    └─> Phase 5 (测试优化)

Phase 5 (测试优化)
├── Task 5.1 (单元测试)
├── Task 5.2 (集成测试)
└── Task 5.3 (性能优化)
```

---

## 总工作量估算

| Phase | Task | 预估时间 | 负责人 | 依赖关系 |
|-------|------|----------|----------|
| 1 | 1.1 数据库设计 | 4h | 后端 | - |
| 1 | 1.2 API框架 | 3h | 后端 | 1.1 |
| 1 | 1.3 4D匹配引擎 | 5h | 后端 | 1.1,1.2 |
| 2 | 2.1 教练列表API | 6h | 后端 | Phase 1 |
| 2 | 2.2 教练详情API | 4h | 后端 | 2.1 |
| 2 | 2.3 小程序列表页 | 4h | 前端 | 2.1 |
| 2 | 2.4 小程序详情页 | 5h | 前端 | 2.2,2.3 |
| 3 | 3.1 咨询API | 6h | 后端 | Phase 1 |
| 3 | 3.2 流程管理 | 5h | 后端 | 3.1 |
| 3 | 3.3 咨询表单页 | 4h | 前端 | 3.1 |
| 3 | 3.4 咨询记录页 | 3h | 前端 | 3.1,3.3 |
| 4 | 4.1 咨询管理后台 | 6h | 后端 | Phase 3 |
| 4 | 4.2 预约录入功能 | 5h | 后端 | 4.1 |
| 4 | 4.3 教练管理功能 | 3h | 后端 | 4.2 |
| 5 | 5.1 单元测试 | 6h | 测试 | Phase 4 |
| 5 | 5.2 集成测试 | 5h | 测试 | 5.1 |
| 5 | 5.3 性能优化 | 3h | 后端 | 5.2 |

**总计**: 84小时 ≈ **12个工作日**

---

## 里程碑

### 里程碑1: 基础架构完成 (Day 2)
- 数据库表创建完成
- API框架搭建完成
- 4维匹配引擎实现
- 基础测试通过

### 里程碑2: 浏览功能完成 (Day 5)
- 教练列表API完成
- 教练详情API完成
- 小程序浏览页面完成
- 4维匹配集成完成

### 里程碑3: 咨询流程完成 (Day 8)
- 咨询API完成
- 咨询流程管理完成
- 小程序咨询页面完成
- 微信客服集成完成

### 里程碑4: 运营后台完成 (Day 10)
- 咨询管理后台完成
- 预约录入功能完成
- 教练管理功能完成
- 运营培训材料完成

### 里程碑5: 系统上线 (Day 12)
- 所有测试通过
- 性能优化完成
- 文档完善
- 系统正式上线

---

## 风险管控

| 风险项 | 概率 | 影响 | 应对措施 |
|--------|------|------|----------|
| 4维匹配算法性能问题 | 中 | 高 | 提前性能测试，实现多级缓存 |
| 微信客服API限制 | 中 | 中 | 准备二维码降级方案 |
| 需求变更 | 高 | 中 | 灵活架构设计，预留扩展接口 |
| 人员变动 | 低 | 高 | 完善文档，知识共享 |
| 第三方服务依赖 | 中 | 中 | 准备备用方案，监控SLA |

---

## 成功标准

### 业务目标
- 私教课浏览量：>1000次/日
- 咨询转化率：咨询→预约 >20%
- 咨询响应时间：<4小时
- 客户满意度：>4.5分

### 技术目标
- 4维匹配准确率：100%
- API响应时间：P95<500ms
- 系统可用性：>99.5%
- 单元测试覆盖率：>90%

### 用户体验目标
- 页面加载时间：<1秒
- 咨询提交成功率：>99%
- 运营操作效率：提升50%
- 用户满意度：>90%

---

## 总结

本任务分解文档为004-private-lesson私教课系统提供了详细的实施计划，涵盖从基础架构到测试上线的完整开发流程。通过严格遵循FR-042仅浏览模式和FR-040 4维标签匹配要求，确保系统能够满足业务需求并实现预期的用户体验目标。

**创建人**: [AI Claude]
**最后更新**: 2025-11-08
**版本**: v1.0.0
**状态**: Draft
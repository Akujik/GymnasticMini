# RuoYi-Vue-Pro实施任务：005-payment-integration

**功能分支**: `005-payment-integration`
**创建时间**: 2025-11-03
**重构日期**: 2025-11-17
**状态**: RuoYi架构重构中
**MVP**: MVP-3
**版本**: v2.0.0 RuoYi架构重构

## RuoYi架构任务分解

### Phase 1: RuoYi数据库架构设置 (3 天)

#### Task 1.1: 创建gym_payment_order表（RuoYi标准）
**依赖关系**: None
**预估时间**: 6 hours
**描述**: 基于RuoYi-Vue-Pro标准创建支付订单表，使用MyBatis-Plus实体映射
**RuoYi技术要求**:
- [ ] 基于RuoYi BaseAudit审计字段设计（create_time, update_time, create_by, update_by）
- [ ] MyBatis-Plus @TableId主键策略 + @Version乐观锁配置
- [ ] RuoYi删除标志del_flag字段 + 软删除机制
- [ ] 使用RuoYi代码生成器生成实体类和Mapper接口
- [ ] 数据库索引优化（复合索引 + 单列索引）

**验收标准**:
- [ ] 表结构符合RuoYi-Vue-Pro标准规范
- [ ] MyBatis-Plus实体类注解配置完整（@TableName, @TableField, @Version等）
- [ ] 主键外键约束正确建立
- [ ] RuoYi代码生成器生成的CRUD接口可用
- [ ] 数据库迁移脚本通过RuoYi Flyway验证

#### Task 1.2: 创建gym_payment_transaction表（RuoYi事务管理）
**依赖关系**: Task 1.1
**预估时间**: 4 hours
**描述**: 基于MyBatis-Plus创建微信支付交易跟踪表，集成RuoYi事务管理
**RuoYi技术要求**:
- [ ] MyBatis-Plus实体类继承BaseEntity获得审计功能
- [ ] 微信交易号唯一性约束 + 数据库层验证
- [ ] @Transactional事务管理配置
- [ ] LambdaQueryWrapper查询优化配置
- [ ] Redis缓存@Cacheable注解集成

**验收标准**:
- [ ] MyBatis-Plus实体类与表字段映射正确
- [ ] 外键关系与gym_payment_order正确建立
- [ ] 事务状态枚举符合RuoYi枚举设计规范
- [ ] Redis缓存配置正确，查询性能提升>50%
- [ ] RuoYi单元测试通过

#### Task 1.3: 创建gym_seat_reservation表（分布式锁）
**依赖关系**: Task 1.1
**预估时间**: 5 hours
**描述**: 基于Redis分布式锁创建座位预留表，防止并发冲突
**RuoYi技术要求**:
- [ ] Redis分布式锁集成（RedisTemplate + SetOperations）
- [ ] MyBatis-Plus乐观锁@Version字段配置
- [ ] Spring @Scheduled定时任务清理过期预留
- [ ] 15分钟预留过期机制（Redis TTL）
- [ ] 座位可用性查询性能优化（Redis缓存）

**验收标准**:
- [ ] 座位预留15分钟过期机制正确工作
- [ ] 高并发场景下分布式锁防止超卖
- [ ] 临时预留状态枚举正确实现
- [ ] Redis缓存命中率>90%，查询响应时间<100ms
- [ ] 定时清理过期预留任务正常运行

#### Task 1.4: 创建gym_payment_audit_log表（RuoYi审计）
**依赖关系**: Task 1.2
**预估时间**: 3 hours
**描述**: 基于RuoYi @Log注解创建支付安全审计表
**RuoYi技术要求**:
- [ ] RuoYi @Log注解自动审计记录
- [ ] AOP切面记录所有支付操作
- [ ] JSON格式请求响应数据存储
- [ ] Spring Boot Actuator监控集成
- [ ] 审计日志数据保留策略配置

**验收标准**:
- [ ] 支付操作100%被@Log注解记录
- [ ] 审计查询性能优化（索引设计）
- [ ] 数据保留策略按RuoYi规范配置（2年）
- [ ] Spring Boot Admin监控面板显示审计数据
- [ ] 日志轮转策略正确配置

### Phase 2: RuoYi微信支付集成 (6 天)

#### Task 2.1: 微信支付Java SDK集成（RuoYi架构）
**依赖关系**: Task 1.1-1.4
**预估时间**: 8 hours
**描述**: 将微信支付Java SDK深度集成到RuoYi-Vue-Pro架构中
**RuoYi技术要求**:
- [ ] 微信支付Java SDK与Spring Boot 2.7.x集成
- [ ] RuoYi配置管理（application.yml + @ConfigurationProperties）
- [ ] Spring Security签名验证过滤器集成
- [ ] RuoYi远程调用服务（@FeignClient）配置
- [ ] 环境配置管理（test/prod配置分离）

**验收标准**:
- [ ] 微信支付沙箱环境与RuoYi架构正常通信
- [ ] API密钥安全存储（RuoYi加密配置）
- [ ] 生产环境配置正确且安全
- [ ] RuoYi健康检查包含微信支付连通性验证
- [ ] Swagger 3.0 API文档完整

#### Task 2.2: RuoYi支付订单Service层实现
**依赖关系**: Task 2.1
**预估时间**: 10 hours
**描述**: 基于RuoYi Service层实现支付订单创建，固定200元价格验证
**RuoYi技术要求**:
- [ ] @Service + @Transactional注解事务管理
- [ ] RuoYi @Log注解审计日志自动记录
- [ ] JSR-303 Bean Validation参数验证
- [ ] MyBatis-Plus LambdaQueryWrapper查询优化
- [ ] Redis分布式锁防止重复订单
- [ ] Spring Retry重试机制

**验收标准**:
- [ ] 支付订单创建API返回RuoYi AjaxResult格式
- [ ] 固定200.00元金额验证100%准确
- [ ] 订单号生成符合UUID规范且唯一
- [ ] 重复预约拦截率100%（基于OpenID限制）
- [ ] RuoYi全局异常处理正确捕获业务异常

#### Task 2.3: 微信支付二维码生成（Vue3前端）
**依赖关系**: Task 2.2
**预估时间**: 8 hours
**描述**: 基于Vue3 + Element Plus实现微信支付二维码生成界面
**RuoYi技术要求**:
- [ ] Vue3 + TypeScript前端组件开发
- [ ] Element Plus支付组件集成
- [ ] RuoYi前端路由权限控制
- [ ] Axios HTTP客户端与后端API集成
- [ ] 响应式设计适配小程序环境

**验收标准**:
- [ ] 二维码生成API响应时间<3秒
- [ ] 微信支付参数签名验证准确率100%
- [ ] 支付二维码清晰度符合微信标准
- [ ] 30分钟支付过期机制正确实现
- [ ] 支付界面用户体验流畅，错误提示友好

#### Task 2.4: RuoYi支付状态查询Service
**依赖关系**: Task 2.3
**预估时间**: 6 hours
**描述**: 基于RuoYi架构实现支付状态轮询和更新机制
**RuoYi技术要求**:
- [ ] Spring @Scheduled定时任务配置
- [ ] MyBatis-Plus乐观锁状态更新
- [ ] Redis缓存状态信息（@Cacheable）
- [ ] Spring Event事件驱动通知机制
- [ ] RuoYi异步任务处理（@Async）

**验收标准**:
- [ ] 支付状态查询API响应时间<1秒
- [ ] 微信支付状态映射准确率100%
- [ ] 状态轮询频率合理（10秒一次）
- [ ] 状态变更实时通知用户
- [ ] 支付超时自动清理机制正确工作

### Phase 3: RuoYi预约流程集成 (5 天)

#### Task 3.1: 座位可用性查询Service（MyBatis-Plus优化）
**依赖关系**: Task 1.3
**预估时间**: 8 hours
**描述**: 基于MyBatis-Plus LambdaQueryWrapper实现实时座位可用性查询
**RuoYi技术要求**:
- [ ] MyBatis-Plus LambdaQueryWrapper查询优化
- [ ] Redis分布式锁并发控制
- [ ] Spring Cache @Cacheable缓存策略
- [ ] RuoYi数据权限控制（@DataScope）
- [ ] 数据库连接池优化配置

**验收标准**:
- [ ] 座位可用性查询API响应时间<500ms
- [ ] 并发请求处理能力>100 TPS
- [ ] 座位计数逻辑准确率100%
- [ ] Redis缓存命中率>90%
- [ ] 座位冲突检测准确率100%

#### Task 3.2: 临时座位预留逻辑（分布式锁）
**依赖关系**: Task 3.1
**预估时间**: 10 hours
**描述**: 基于Redis分布式锁实现支付前临时座位预留
**RuoYi技术要求**:
- [ ] Redis分布式锁（RedisTemplate + SetOperations）
- [ ] Spring AOP切面记录预留操作
- [ ] MyBatis-Plus乐观锁@Version并发控制
- [ ] Spring @Scheduled定时清理过期预留
- [ ] RuoYi @Log注解审计预留操作

**验收标准**:
- [ ] 座位预留API支持高并发场景
- [ ] 15分钟预留过期机制准确执行
- [ ] 自动过期清理任务正常运行
- [ ] 竞态条件预防成功率达100%
- [ ] 预留状态跟踪完整准确

#### Task 3.3: 支付-预约集成流程（事务管理）
**依赖关系**: Task 2.4, Task 3.2
**预估时间**: 12 hours
**描述**: 基于RuoYi事务管理实现支付与预约确认的端到端集成
**RuoYi技术要求**:
- [ ] Spring @Transactional(rollbackFor = Exception.class)事务管理
- [ ] Spring Event事件驱动架构
- [ ] MyBatis-Plus批量操作优化
- [ ] 分布式事务管理（Seata集成）
- [ ] RuoYi异常处理链路跟踪

**验收标准**:
- [ ] 端到端预约流程事务完整性100%
- [ ] 支付成功自动触发预约确认
- [ ] 支付失败立即释放临时预留
- [ ] 事务回滚机制正确可靠
- [ ] 错误恢复流程完善友好

#### Task 3.4: 预约确认Service（事件驱动）
**依赖关系**: Task 3.3
**预估时间**: 8 hours
**描述**: 基于Spring Event实现支付成功后的最终预约确认
**RuoYi技术要求**:
- [ ] Spring @EventListener事件监听器
- [ ] RuoYi消息通知系统集成
- [ ] MyBatis-Plus批量更新优化
- [ ] Spring @Async异步通知处理
- [ ] 审计日志完整记录确认过程

**验收标准**:
- [ ] 预约确认API响应时间<2秒
- [ ] 座位状态更新为已确认
- [ ] 用户通知触发成功率100%
- [ ] 预约记录创建完整准确
- [ ] 支付订单状态正确完成

### Phase 4: RuoYi Webhook和通知系统 (4 天)

#### Task 4.1: 微信支付回调处理器（RuoYi Controller）
**依赖关系**: Task 2.4
**预估时间**: 10 hours
**描述**: 基于RuoYi Controller层实现安全的微信支付回调webhook
**RuoYi技术要求**:
- [ ] @RestController + @RequestMapping标准注解
- [ ] Spring Security过滤器链签名验证
- [ ] RuoYi统一响应格式AjaxResult
- [ ] Redis分布式锁幂等性处理
- [ ] @Log注解自动审计回调处理

**验收标准**:
- [ ] Webhook端点安全可靠，签名验证100%准确
- [ ] 微信回调签名验证机制正确工作
- [ ] 回调数据完整性验证通过
- [ ] 重复回调处理正确（幂等性100%）
- [ ] 错误日志和监控完整记录

#### Task 4.2: 订单状态自动更新（事务管理）
**依赖关系**: Task 4.1
**预估时间**: 8 hours
**描述**: 基于RuoYi事务管理实现回调驱动的订单状态自动更新
**RuoYi技术要求**:
- [ ] @Transactional(rollbackFor = Exception.class)事务管理
- [ ] MyBatis-Plus乐观锁并发状态更新
- [ ] Spring Event事件驱动通知机制
- [ ] RuoYi @Log注解记录状态变更
- [ ] Redis缓存同步更新

**验收标准**:
- [ ] 订单状态自动更新准确率100%
- [ ] 状态变更通知实时触发
- [ ] 审计日志完整记录所有变更
- [ ] 数据一致性验证100%通过
- [ ] 回滚机制正确可靠

#### Task 4.3: RuoYi用户通知系统（消息队列）
**依赖关系**: Task 4.2
**预估时间**: 6 hours
**描述**: 集成RuoYi消息通知模块实现支付事件用户通知
**RuoYi技术要求**:
- [ ] RuoYi消息通知系统集成
- [ ] Spring RabbitMQ异步消息处理
- [ ] 微信模板消息API集成
- [ ] Spring @Async异步通知处理
- [ ] 通知历史记录和重试机制

**验收标准**:
- [ ] 支付成功通知送达率>95%
- [ ] 支付失败通知及时准确发送
- [ ] 预约确认消息内容完整正确
- [ ] 微信模板消息格式符合规范
- [ ] 通知历史完整可追溯，支持重试

### Phase 5: RuoYi错误处理和边界情况 (4 天)

#### Task 5.1: 支付超时处理（定时任务）
**依赖关系**: Task 2.4
**预估时间**: 8 hours
**描述**: 基于Spring @Scheduled实现支付超时自动取消和清理
**RuoYi技术要求**:
- [ ] Spring @Scheduled定时任务配置
- [ ] MyBatis-Plus批量状态更新
- [ ] Spring Event事件驱动座位释放
- [ ] RuoYi @Async异步通知处理
- [ ] 事务管理确保数据一致性

**验收标准**:
- [ ] 30分钟支付超时机制准确执行
- [ ] 订单自动取消功能正确可靠
- [ ] 座位预留立即释放
- [ ] 用户超时通知及时送达
- [ ] 过期订单自动清理任务正常运行

#### Task 5.2: 支付失败恢复（全局异常处理）
**依赖关系**: Task 5.1
**预估时间**: 8 hours
**描述**: 基于RuoYi全局异常处理器实现支付失败恢复机制
**RuoYi技术要求**:
- [ ] @RestControllerAdvice全局异常处理
- [ ] Spring Retry重试机制配置
- [ ] RuoYi统一错误码和消息管理
- [ ] AOP切面记录异常日志
- [ ] 监控告警系统集成

**验收标准**:
- [ ] 支付失败优雅处理，用户体验友好
- [ ] 错误信息准确易懂，符合RuoYi规范
- [ ] 重试机制合理配置，不造成重复支付
- [ ] 失败订单自动清理，数据状态一致
- [ ] 错误分析统计完整，支持优化

#### Task 5.3: 座位冲突解决（乐观锁机制）
**依赖关系**: Task 3.2
**预估时间**: 6 hours
**描述**: 基于MyBatis-Plus乐观锁解决座位预留冲突和竞态条件
**RuoYi技术要求**:
- [ ] MyBatis-Plus @Version乐观锁配置
- [ ] Redis分布式锁二次保障
- [ ] Spring Data JPA冲突检测
- [ ] RuoYi异常处理层统一处理
- [ ] 座位分配算法公平性保证

**验收标准**:
- [ ] 冲突检测机制准确率100%
- [ ] 自动冲突解决算法公平合理
- [ ] 冲突情况用户通知及时准确
- [ ] 座位分配算法公平透明
- [ ] 高并发场景下零冲突遗留

#### Task 5.4: 退款处理逻辑（运营管理）
**依赖关系**: Task 4.2
**预估时间**: 6 hours
**描述**: 基于RuoYi权限控制实现运营人员手动退款处理
**RuoYi技术要求**:
- [ ] @PreAuthorize权限控制（gym:refund:manage）
- [ ] 微信支付退款API集成
- [ ] RuoYi数据权限范围控制
- [ ] 审计日志完整记录退款过程
- [ ] Spring工作流审批机制

**验收标准**:
- [ ] 退款申请API安全可控
- [ ] 微信原路退款集成正常
- [ ] 退款状态跟踪完整准确
- [ ] 退款通知系统正常工作
- [ ] 退款操作100%记录审计日志

### Phase 6: RuoYi测试和质量保证 (5 天)

#### Task 6.1: RuoYi单元测试开发（JUnit 5 + Mockito）
**依赖关系**: All previous tasks
**预估时间**: 16 hours
**描述**: 基于JUnit 5 + Mockito创建RuoYi支付服务的全面单元测试
**RuoYi技术要求**:
- [ ] @SpringBootTest + @TestPropertySource测试配置
- [ ] @MockBean模拟外部依赖（微信支付、Redis等）
- [ ] Testcontainers集成测试数据库
- [ ] JUnit 5参数化测试
- [ ] AssertJ断言库使用
- [ ] JaCoCo代码覆盖率报告

**验收标准**:
- [ ] 单元测试代码覆盖率>90%
- [ ] 所有支付场景都有对应测试用例
- [ ] 微信支付响应Mock完整准确
- [ ] 边界条件验证100%覆盖
- [ ] RuoYi Service层业务逻辑测试完整

#### Task 6.2: RuoYi集成测试开发（Testcontainers）
**依赖关系**: Task 6.1
**预估时间**: 12 hours
**描述**: 基于Testcontainers创建端到端支付流程集成测试
**RuoYi技术要求**:
- [ ] @SpringBootTest完整上下文测试
- [ ] Testcontainers MySQL + Redis容器测试
- [ ] @MockServer模拟微信支付沙箱环境
- [ ] WebMvcTest Controller层API测试
- [ ] @DataJpaTest数据访问层测试

**验收标准**:
- [ ] 完整支付流程集成测试通过
- [ ] 微信支付沙箱环境测试正常
- [ ] 数据库事务测试验证一致性
- [ ] Redis状态测试确保缓存正确
- [ ] API契约测试验证接口规范

#### Task 6.3: RuoYi性能测试（JMeter + Spring Boot Actuator）
**依赖关系**: Task 6.2
**预估时间**: 8 hours
**描述**: 基于JMeter + Spring Boot Actuator进行负载下性能测试
**RuoYi技术要求**:
- [ ] JMeter并发用户负载测试（100+ TPS）
- [ ] Spring Boot Actuator健康检查
- [ ] Micrometer指标监控收集
- [ ] 数据库连接池监控
- [ ] Redis连接和性能监控

**验收标准**:
- [ ] 支持100+并发用户支付处理
- [ ] 支付处理时间<2秒（RuoYi优化目标）
- [ ] 数据库查询优化，响应时间<100ms
- [ ] 内存使用稳定，无内存泄漏
- [ ] 压力测试场景下系统稳定

#### Task 6.4: RuoYi安全审计和验证（OWASP）
**依赖关系**: Task 6.3
**预估时间**: 8 hours
**描述**: 基于OWASP标准进行支付系统安全审计
**RuoYi技术要求**:
- [ ] Spring Security配置安全审查
- [ ] OWASP ZAP自动化安全扫描
- [ ] 微信支付签名验证安全测试
- [ ] RuoYi权限控制安全验证
- [ ] 敏感数据加密验证

**验收标准**:
- [ ] 支付数据加密符合安全标准
- [ ] API安全测试零高危漏洞
- [ ] 微信签名验证100%准确可靠
- [ ] RuoYi权限控制测试通过
- [ ] 完整安全审计报告生成

## RuoYi架构依赖关系和风险缓解

### RuoYi关键路径（Critical Path）
1. **RuoYi数据库设置** → **RuoYi微信支付集成** → **RuoYi预约流程集成** → **RuoYi测试质量保证**
2. **微信支付Java SDK集成**是关键路径阻塞点
3. **座位预留逻辑**依赖于正确的RuoYi数据库设计

### RuoYi架构风险缓解策略
- **微信支付集成复杂性**: 预留缓冲时间，准备备用支付方案，使用RuoYi远程调用容错机制
- **支付回调可靠性**: 实现Spring Retry重试机制，RuoYi手动覆盖选项，Redis幂等性处理
- **座位并发冲突**: 使用MyBatis-Plus乐观锁 + Redis分布式锁双重保障，Spring事务管理

## RuoYi架构成功指标

### 技术性能指标（基于RuoYi优化）
- [ ] SC-001: 支付成功率>99%（RuoYi异常处理 + Spring Retry）
- [ ] SC-002: 平均支付处理时间<2秒（MyBatis-Plus + Redis缓存）
- [ ] SC-003: 安全审计零漏洞（Spring Security + OWASP扫描）
- [ ] SC-004: 关键支付路径测试覆盖率100%（JUnit 5 + Testcontainers）
- [ ] SC-005: 微信支付沙箱集成100%成功（RuoYi远程调用）

### RuoYi架构质量指标
- [ ] SC-006: MyBatis-Plus LambdaQueryWrapper使用率100%
- [ ] SC-007: Spring @Transactional事务管理覆盖率100%
- [ ] SC-008: Redis分布式锁成功率>99%
- [ ] SC-009: RuoYi @Log审计日志完整性100%
- [ ] SC-010: RuoYi统一响应格式AjaxResult使用率100%

**创建人**: [AI Claude - RuoYi架构重构]
**最后更新**: 2025-11-17
**版本**: v2.0.0 RuoYi架构重构
**状态**: 已完成RuoYi架构迁移
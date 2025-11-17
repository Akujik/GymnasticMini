# 🗄️ 数据库设计文档 (RuoYi架构版)

**Database Design Documentation**

**版本**: 2.0.0
**最后更新**: 2025-11-17
**数据库版本**: MySQL 8.0+
**ORM**: MyBatis-Plus 3.5.x
**架构**: RuoYi-Vue-Pro

---

## 📋 数据库架构概览

### 设计原则
- **数据完整性**: 确保业务规则和数据一致性
- **性能优化**: 合理的索引设计和查询优化
- **可扩展性**: 支持未来功能扩展
- **安全性**: 敏感数据加密存储
- **审计追踪**: 关键操作记录完整日志

### 技术栈
- **数据库**: MySQL 8.0+
- **ORM**: MyBatis-Plus 3.5.x
- **迁移工具**: MyBatis-Plus Migration / Flyway
- **连接池**: HikariCP (Spring Boot内置)
- **缓存**: Redis 7.0+ (Spring Cache + Redis)
- **数据库连接**: Spring Boot DataSource + MyBatis-Plus

## 🏗️ 数据库结构

### 核心业务表

#### 1. 用户相关表

##### sys_user 表 - 用户主表 (基于RuoYi扩展)
```sql
CREATE TABLE `sys_user` (
  `user_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `dept_id` BIGINT COMMENT '部门ID（RuoYi标准）',
  `user_name` VARCHAR(30) COMMENT '用户账号',
  `nick_name` VARCHAR(30) COMMENT '用户昵称',
  `user_type` VARCHAR(2) DEFAULT '00' COMMENT '用户类型（00系统用户）',
  `email` VARCHAR(50) COMMENT '用户邮箱',
  `phonenumber` VARCHAR(11) COMMENT '手机号码',
  `sex` CHAR(1) COMMENT '用户性别（0男 1女 2未知）',
  `avatar` VARCHAR(100) COMMENT '头像地址',
  `password` VARCHAR(100) COMMENT '密码',
  `status` CHAR(1) DEFAULT '0' COMMENT '帐号状态（0正常 1停用）',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志（0代表存在 2代表删除）',
  `login_ip` VARCHAR(128) COMMENT '最后登录IP',
  `login_date` DATETIME COMMENT '最后登录时间',

  -- 体操馆扩展字段
  `openid` VARCHAR(128) UNIQUE COMMENT '微信OpenID',
  `unionid` VARCHAR(128) COMMENT '微信UnionID',
  `session_key` VARCHAR(128) COMMENT '会话密钥',

  -- RuoYi标准审计字段
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',
  `version` INT DEFAULT 0 COMMENT '乐观锁版本号',

  INDEX `idx_openid` (`openid`),
  INDEX `idx_user_name` (`user_name`),
  INDEX `idx_status` (`status`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户主表（基于RuoYi扩展）';
```

##### gym_student_profile 表 - 学员档案表
```sql
CREATE TABLE `gym_student_profile` (
  `profile_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '档案ID',
  `user_id` BIGINT NOT NULL COMMENT '所属用户ID',
  `student_name` VARCHAR(100) NOT NULL COMMENT '学员姓名',
  `birthday` DATE NOT NULL COMMENT '出生日期',
  `gender` CHAR(1) NOT NULL COMMENT '性别（0男 1女）',
  `skill_level` ENUM('L1', 'L1+', 'L2', 'L2+', 'L3', 'L3+', 'L4', 'L4+', 'L5', 'L5+', 'L6') DEFAULT 'L1' COMMENT '技能等级',
  `development_tag` ENUM('interest', 'professional', 'competition', 'long_term') DEFAULT 'interest' COMMENT '发展标签',
  `virtual_age` TINYINT COMMENT '虚拟年龄',
  `current_level_age` TINYINT COMMENT '当前等级对应年龄',
  `height` DECIMAL(5,2) COMMENT '身高(cm)',
  `weight` DECIMAL(5,2) COMMENT '体重(kg)',
  `special_notes` TEXT COMMENT '特殊说明（过敏史、健康状况等）',
  `avatar_url` VARCHAR(500) COMMENT '学员头像URL',

  -- RuoYi标准字段
  `status` CHAR(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志（0代表存在 2代表删除）',
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',
  `version` INT DEFAULT 0 COMMENT '乐观锁版本号',

  FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`user_id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_skill_level` (`skill_level`),
  INDEX `idx_age_gender` (`birthday`, `gender`),
  INDEX `idx_development` (`development_tag`),
  INDEX `idx_name` (`student_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学员档案表';
```

#### 2. 课程相关表

##### gym_course 表 - 课程主表
```sql
CREATE TABLE `gym_course` (
  `course_id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '课程ID',
  `course_name` VARCHAR(200) NOT NULL COMMENT '课程名称',
  `course_code` VARCHAR(50) COMMENT '课程编码',
  `course_type` ENUM('group', 'private_1v1', 'private_1v2', 'trial', 'camp') NOT NULL COMMENT '课程类型',
  `description` TEXT COMMENT '课程描述',
  `base_price` DECIMAL(10,2) NOT NULL COMMENT '基础价格',
  `max_capacity` INT NOT NULL COMMENT '最大容量',
  `current_enrollment` INT DEFAULT 0 COMMENT '当前报名人数',
  `duration_minutes` INT NOT NULL COMMENT '课程时长（分钟）',
  `skill_level_required` ENUM('L1', 'L1+', 'L2', 'L2+', 'L3', 'L3+', 'L4', 'L4+', 'L5', 'L5+', 'L6') COMMENT '所需技能等级',
  `min_age` INT COMMENT '最小年龄',
  `max_age` INT COMMENT '最大年龄',
  `gender_restriction` CHAR(1) DEFAULT '2' COMMENT '性别限制（0男 1女 2不限）',
  `difficulty_level` ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner' COMMENT '难度等级',
  `course_materials` JSON COMMENT '课程器材',
  `learning_objectives` TEXT COMMENT '学习目标',
  `prerequisites` TEXT COMMENT '前置条件',
  `course_image_url` VARCHAR(500) COMMENT '课程图片URL',

  -- RuoYi标准字段
  `status` CHAR(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `del_flag` CHAR(1) DEFAULT '0' COMMENT '删除标志（0代表存在 2代表删除）',
  `create_by` VARCHAR(64) COMMENT '创建者',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` VARCHAR(64) COMMENT '更新者',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` VARCHAR(500) COMMENT '备注',
  `version` INT DEFAULT 0 COMMENT '乐观锁版本号',

  INDEX `idx_course_type` (`course_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_price` (`base_price`),
  INDEX `idx_skill_level` (`skill_level_required`),
  INDEX `idx_age_range` (`min_age`, `max_age`),
  INDEX `idx_3d_match` (`skill_level_required`, `min_age`, `max_age`, `gender_restriction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程主表（3D硬匹配优化）';
```

##### course_tag 表 - 课程标签表
```sql
CREATE TABLE `course_tag` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '标签ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `level_range` VARCHAR(100) COMMENT '等级范围(JSON数组)',
  `age_range` ENUM('3-4', '4-5', '5-6', '6+', 'all') DEFAULT 'all' COMMENT '年龄范围',
  `gender` ENUM('male', 'female', 'both') NOT NULL DEFAULT 'both' COMMENT '性别要求',
  `skill_types` JSON COMMENT '技能类型',
  `intensity_level` ENUM('light', 'medium', 'high') DEFAULT 'medium' COMMENT '课程强度',
  `popularity` ENUM('hot', 'normal', 'cold') DEFAULT 'normal' COMMENT '热门程度',
  `waitlist_capacity` INT DEFAULT 8 COMMENT '候补容量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE,
  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_level_range` (`level_range`),
  INDEX `idx_age_gender` (`age_range`, `gender`),
  INDEX `idx_3d_match` (`age_range`, `gender`, `level_range`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程标签表（3维硬匹配）';
```

#### 3. 预约相关表

##### booking 表 - 预约主表
```sql
CREATE TABLE `booking` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '预约ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `profile_id` BIGINT NOT NULL COMMENT '学员档案ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `course_schedule_id` BIGINT NOT NULL COMMENT '课程排期ID',
  `status` ENUM('pending', 'confirmed', 'cancelled', 'completed', 'noshow') DEFAULT 'pending' COMMENT '预约状态',
  `booking_type` ENUM('regular', 'trial', 'makeup', 'private') NOT NULL COMMENT '预约类型',
  `original_price` DECIMAL(10,2) NOT NULL COMMENT '原价',
  `actual_price` DECIMAL(10,2) NOT NULL COMMENT '实付价格',
  `payment_method` VARCHAR(50) COMMENT '支付方式',
  `notes` TEXT COMMENT '备注',
  `cancelled_at` DATETIME COMMENT '取消时间',
  `cancel_reason` VARCHAR(200) COMMENT '取消原因',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE RESTRICT,
  INDEX `idx_user_profile` (`user_id`, `profile_id`),
  INDEX `idx_course_schedule` (`course_schedule_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约主表';
```

#### 4. 钱包相关表

##### wallet 表 - 钱包表
```sql
CREATE TABLE `wallet` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` BIGINT NOT NULL COMMENT '所属用户ID',
  `balance` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '余额（非负数）',
  `credit_limit` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '信用额度（固定0）',
  `status` ENUM('active', 'frozen', 'closed') DEFAULT 'active' COMMENT '钱包状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_wallet` (`user_id`),
  INDEX `idx_balance` (`balance`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包表（禁止透支）';
```

##### wallet_transaction 表 - 钱包交易记录表
```sql
CREATE TABLE `wallet_transaction` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '交易ID',
  `wallet_id` BIGINT NOT NULL COMMENT '钱包ID',
  `type` ENUM('recharge', 'consume', 'refund', 'adjustment') NOT NULL COMMENT '交易类型',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '交易金额',
  `balance_before` DECIMAL(10,2) NOT NULL COMMENT '交易前余额',
  `balance_after` DECIMAL(10,2) NOT NULL COMMENT '交易后余额',
  `reference_id` BIGINT COMMENT '关联ID（预约/调整等）',
  `reference_type` VARCHAR(50) COMMENT '关联类型',
  `payment_method` VARCHAR(50) COMMENT '支付方式',
  `external_order_no` VARCHAR(100) COMMENT '外部订单号',
  `notes` TEXT COMMENT '备注',
  `admin_id` INT COMMENT '操作管理员ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`wallet_id`) REFERENCES `wallet`(`id`) ON DELETE CASCADE,
  INDEX `idx_wallet_id` (`wallet_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_reference` (`reference_type`, `reference_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包交易记录表';
```

#### 5. 管理后台表

##### admin_user 表 - 管理员用户表
```sql
CREATE TABLE `admin_user` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
  `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `name` VARCHAR(100) NOT NULL COMMENT '姓名',
  `email` VARCHAR(100) COMMENT '邮箱',
  `phone` VARCHAR(20) COMMENT '电话',
  `avatar_url` VARCHAR(500) COMMENT '头像URL',
  `role` ENUM('admin') NOT NULL DEFAULT 'admin' COMMENT '角色（单一管理员）',
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '状态',
  `last_login_at` DATETIME COMMENT '最后登录时间',
  `login_count` INT DEFAULT 0 COMMENT '登录次数',
  `failed_login_attempts` INT DEFAULT 0 COMMENT '失败登录次数',
  `locked_until` DATETIME COMMENT '锁定到期时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_username` (`username`),
  INDEX `idx_status` (`status`),
  INDEX `idx_last_login` (`last_login_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员用户表';
```

##### admin_operation_log 表 - 管理员操作日志表
```sql
CREATE TABLE `admin_operation_log` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  `admin_user_id` INT NOT NULL COMMENT '管理员ID',
  `session_id` VARCHAR(128) COMMENT '会话ID',
  `action` VARCHAR(100) NOT NULL COMMENT '操作动作',
  `target_type` VARCHAR(50) NOT NULL COMMENT '目标类型',
  `target_id` BIGINT NOT NULL COMMENT '目标ID',
  `details` JSON COMMENT '操作详情',
  `ip_address` VARCHAR(45) COMMENT 'IP地址',
  `user_agent` TEXT COMMENT '用户代理',
  `risk_score` INT DEFAULT 0 COMMENT '风险评分',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (`admin_user_id`) REFERENCES `admin_user`(`id`) ON DELETE CASCADE,
  INDEX `idx_admin_user_id` (`admin_user_id`),
  INDEX `idx_target` (`target_type`, `target_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_risk_score` (`risk_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';
```

### 系统表

##### migration_history 表 - 数据库迁移历史
```sql
CREATE TABLE `migration_history` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '迁移ID',
  `version` VARCHAR(50) UNIQUE NOT NULL COMMENT '版本号',
  `description` TEXT COMMENT '迁移描述',
  `executed_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间',
  `execution_time_ms` INT COMMENT '执行耗时（毫秒）',

  INDEX `idx_version` (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据库迁移历史表';
```

## 🔍 索引设计

### 主要索引策略

#### 1. 主键索引
- 所有表都有自增主键
- 使用`BIGINT`支持大数据量

#### 2. 唯一索引
```sql
-- 防止重复数据
UNIQUE KEY `uk_user_openid` (`openid`);
UNIQUE KEY `uk_admin_username` (`username`);
UNIQUE KEY `uk_user_wallet` (`user_id`);
```

#### 3. 复合索引
```sql
-- 3维硬匹配复合索引
INDEX `idx_course_3d_match` (`age_range`, `gender`, `level_range`);

-- 查询优化复合索引
INDEX `idx_booking_user_profile` (`user_id`, `profile_id`);
INDEX `idx_transaction_wallet_type_date` (`wallet_id`, `type`, `created_at`);
```

#### 4. 覆盖索引
```sql
-- 包含查询所需的所有字段
INDEX `idx_user_list_cover` (`status`, `created_at`, `id`, `name`, `avatar_url`);
```

### 索引使用建议

#### 创建索引时机
- **高频查询字段**: 经常用于WHERE、ORDER BY、GROUP BY的字段
- **外键字段**: 所有外键都应该有索引
- **JOIN字段**: 用于表连接的字段

#### 索引数量控制
- 单个表索引数不超过10个
- 避免过度索引影响写入性能
- 定期分析索引使用情况

## 🔧 数据库配置

### MySQL配置建议

#### my.cnf配置
```ini
[mysqld]
# 基础配置
default-storage-engine=InnoDB
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# 内存配置
innodb_buffer_pool_size=2G
innodb_log_file_size=256M
innodb_log_buffer_size=16M

# 连接配置
max_connections=1000
max_connect_errors=100
wait_timeout=28800

# 查询缓存
query_cache_type=1
query_cache_size=64M

# 慢查询日志
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow.log
long_query_time=2

# 二进制日志
log-bin=mysql-bin
binlog_format=ROW
expire_logs_days=7
```

### SQLAlchemy配置

#### 数据库连接配置
```python
# core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

DATABASE_URL = "mysql+pymysql://user:password@localhost:3306/ccmartmeet"

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False  # 生产环境设为False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
```

## 📊 数据库迁移

### Alembic配置

#### alembic.ini
```ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = mysql+pymysql://user:password@localhost:3306/ccmartmeet

[post_write_hooks]
hooks = black
black.type = console_scripts
black.entrypoint = black
black.options = -l 88 REVISION_SCRIPT_FILENAME

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic
```

### 迁移脚本示例
```python
"""Add profile virtual age field

Revision ID: 001_add_profile_virtual_age
Revises: 000_initial_tables
Create Date: 2025-11-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001_add_profile_virtual_age'
down_revision = '000_initial_tables'
branch_labels = None
depends_on = None

def upgrade():
    # 添加虚拟年龄字段
    op.add_column('profile', sa.Column('virtual_age', sa.TINYINT, comment='虚拟年龄'))

    # 创建索引
    op.create_index('idx_profile_virtual_age', 'profile', ['virtual_age'])

def downgrade():
    # 移除索引
    op.drop_index('idx_profile_virtual_age', table_name='profile')

    # 移除字段
    op.drop_column('profile', 'virtual_age')
```

## 🔒 数据安全

### 数据加密

#### 敏感字段加密
```sql
-- 使用AES加密敏感数据
CREATE TABLE `user_sensitive_data` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `encrypted_phone` VARBINARY(255) NOT NULL COMMENT '加密手机号',
  `encrypted_id_card` VARBINARY(255) COMMENT '加密身份证号',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 数据脱敏
```python
# 数据脱敏工具
from cryptography.fernet import Fernet

class DataMasking:
    def __init__(self, key: str):
        self.cipher_suite = Fernet(key.encode())

    def encrypt_phone(self, phone: str) -> str:
        """加密手机号"""
        return self.cipher_suite.encrypt(phone.encode()).decode()

    def decrypt_phone(self, encrypted_phone: str) -> str:
        """解密手机号"""
        return self.cipher_suite.decrypt(encrypted_phone.encode()).decode()

    def mask_phone(self, phone: str) -> str:
        """手机号脱敏显示"""
        return phone[:3] + "****" + phone[-4:]
```

### 备份策略

#### 自动备份脚本
```bash
#!/bin/bash
# backup_database.sh

DB_NAME="ccmartmeet"
DB_USER="backup_user"
DB_PASS="backup_password"
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 全量备份
mysqldump -u$DB_USER -p$DB_PASS \
  --single-transaction \
  --routines \
  --triggers \
  --databases $DB_NAME \
  | gzip > $BACKUP_DIR/${DB_NAME}_full_$DATE.sql.gz

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

## 📈 性能优化

### 查询优化

#### 避免N+1查询
```python
# ❌ 不好的做法：N+1查询
def get_users_with_bookings_bad():
    users = session.query(User).all()
    for user in users:
        user.bookings  # 每次都查询数据库

# ✅ 好的做法：预加载关联数据
from sqlalchemy.orm import joinedload

def get_users_with_bookings_good():
    return session.query(User)\
        .options(joinedload(User.bookings))\
        .all()
```

#### 批量操作
```python
# 批量插入
def create_multiple_bookings(bookings_data):
    session.bulk_insert_mappings(Booking, bookings_data)
    session.commit()

# 批量更新
def update_multiple_statuses(booking_ids, status):
    session.query(Booking)\
        .filter(Booking.id.in_(booking_ids))\
        .update({"status": status}, synchronize_session=False)
    session.commit()
```

### 分区表设计

#### 时间分区
```sql
-- 按月分区的booking表
CREATE TABLE `booking_partitioned` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`, `created_at`)
) PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
  PARTITION p202511 VALUES LESS THAN (202512),
  PARTITION p202512 VALUES LESS THAN (202601),
  PARTITION p202601 VALUES LESS THAN (202602),
  PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

## 🔍 监控和维护

### 性能监控

#### 慢查询监控
```sql
-- 启用慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- 查看慢查询
SELECT * FROM mysql.slow_log
WHERE start_time > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY query_time DESC
LIMIT 10;
```

#### 索引使用分析
```sql
-- 查看索引使用情况
SELECT
  TABLE_NAME,
  INDEX_NAME,
  CARDINALITY,
  SUB_PART,
  PACKED,
  NULLABLE,
  INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'ccmartmeet'
ORDER BY TABLE_NAME, INDEX_NAME;

-- 查看未使用的索引
SELECT
  s.TABLE_SCHEMA,
  s.TABLE_NAME,
  s.INDEX_NAME,
  s.CARDINALITY
FROM information_schema.STATISTICS s
LEFT JOIN information_schema.INDEX_STATISTICS i
  ON s.TABLE_SCHEMA = i.TABLE_SCHEMA
  AND s.TABLE_NAME = i.TABLE_NAME
  AND s.INDEX_NAME = i.INDEX_NAME
WHERE s.TABLE_SCHEMA = 'ccmartmeet'
  AND i.TABLE_NAME IS NULL;
```

### 数据库维护

#### 定期维护脚本
```sql
-- 分析表
ANALYZE TABLE user, profile, course, booking;

-- 优化表
OPTIMIZE TABLE user, profile, course, booking;

-- 检查表
CHECK TABLE user, profile, course, booking;
```

## 📋 数据字典

### 字段命名规范
- **主键**: `id`
- **外键**: `{table}_id`
- **时间字段**: `created_at`, `updated_at`
- **布尔字段**: `is_*`, `has_*`
- **状态字段**: `status`
- **枚举字段**: 使用英文描述

### 常用数据类型
```sql
# 主键ID
BIGINT PRIMARY KEY AUTO_INCREMENT

# 普通文本
VARCHAR(255)  -- 短文本
TEXT          -- 长文本

# 数值
DECIMAL(10,2) -- 金额，精确到分
INT           -- 整数
TINYINT       -- 小整数（0-255）

# 时间
DATETIME      -- 精确到秒
DATE          -- 日期
TIMESTAMP     -- 时间戳

# 枚举
ENUM('active', 'inactive', 'suspended')
```

---

**📝 重要提醒**: 数据库设计会随着业务发展持续演进，请保持文档更新并及时调整数据库结构。

**Happy Database Design! 🚀**
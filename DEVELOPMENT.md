# 🛠️ 百适体操馆管理系统 - 开发指南

**CCMartMeet Gymnastics Management System - Development Guide**

**版本**: 1.0.0
**最后更新**: 2025-11-17
**适用于**: 开发团队成员、项目贡献者

---

## 📋 开发概览

本文档为百适体操馆管理系统的开发人员提供完整的开发规范、工作流程和最佳实践。所有开发活动必须遵循项目宪法（CONSTITUTION.md）中定义的18项核心原则。

## 🏗️ 开发环境要求

### 基础环境
- **Python**: 3.9+ (推荐3.11)
- **Node.js**: 16.0.0+ (用于工具链和小程序)
- **MySQL**: 8.0+
- **Redis**: 6.0+
- **Git**: 2.0+

### 必备工具
- **IDE**: VS Code (推荐) + Python扩展包
- **微信开发者工具**: 最新版本
- **API测试**: Postman 或 Insomnia
- **数据库管理**: MySQL Workbench 或 DBeaver

## 🔧 项目设置

### 1. 克隆和初始化

```bash
# 克隆项目
git clone https://github.com/your-org/ccmartmeet-gymnastics.git
cd ccmartmeet-gymnastics

# 设置Python虚拟环境
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 安装Python依赖
pip install -r requirements.txt

# 安装Node.js依赖
npm install

# 配置pre-commit hooks
npm run prepare
```

### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件，配置必要的开发环境变量：
```env
# 开发环境标识
ENVIRONMENT=development
DEBUG=true

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ccmartmeet_gymnastics_dev
DB_USER=dev_user
DB_PASSWORD=dev_password

# Redis配置
REDIS_URL=redis://localhost:6379/1

# JWT配置
JWT_SECRET_KEY=dev_secret_key_not_for_production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440  # 24小时

# 微信小程序配置（开发环境）
WECHAT_APP_ID=your_dev_app_id
WECHAT_APP_SECRET=your_dev_app_secret

# API配置
API_HOST=127.0.0.1
API_PORT=8000
```

## 📏 代码规范

### Python代码规范

#### 代码风格
- **格式化工具**: Black
- **代码检查**: Flake8 + MyPy
- **导入顺序**: 标准库 → 第三方库 → 本地模块
- **最大行长度**: 88字符
- **缩进**: 4个空格

#### 命名约定
```python
# 类名：PascalCase
class UserService:
    pass

# 函数和变量：snake_case
def get_user_profile(user_id: int) -> dict:
    user_data = {"id": user_id}
    return user_data

# 常量：UPPER_SNAKE_CASE
MAX_RETRY_COUNT = 3

# 私有变量：前缀下划线
class DatabaseConnection:
    def __init__(self):
        self._connection = None  # 私有
        self.__config = {}       # 更加私有
```

#### 类型注解要求
```python
from typing import List, Dict, Optional, Union
from datetime import datetime

def process_booking(
    user_id: int,
    course_id: int,
    booking_time: datetime,
    notes: Optional[str] = None
) -> Dict[str, Union[str, int, bool]]:
    """
    处理用户预约请求

    Args:
        user_id: 用户ID
        course_id: 课程ID
        booking_time: 预约时间
        notes: 备注信息，可选

    Returns:
        包含预约结果的字典

    Raises:
        ValueError: 当参数无效时
    """
    pass
```

### JavaScript/TypeScript代码规范

#### 小程序端
```javascript
// 文件命名：kebab-case
// user-service.js

// 函数命名：camelCase
function getUserProfile(userId) {
  return api.get(`/users/${userId}`);
}

// 常量命名：UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// 组件命名：PascalCase
Component({
  properties: {
    userId: {
      type: Number,
      value: 0
    }
  },

  methods: {
    handleTap() {
      // 事件处理函数
    }
  }
});
```

### 数据库规范

#### 表命名
- **命名风格**: snake_case
- **表前缀**: 无（或按MVP分组，如user_, course_）
- **单数形式**: 使用单数名词

```sql
-- 用户表
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 课程标签表
CREATE TABLE course_tag (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    tag_name VARCHAR(100) NOT NULL
);
```

## 🔄 开发工作流

### Git工作流

#### 分支策略
```bash
# 主分支
main              # 生产环境代码
develop           # 开发环境代码

# 功能分支
feature/mvp-001-user-auth
feature/mvp-002-course-booking

# 修复分支
hotfix/security-patch
bugfix/booking-validation

# 发布分支
release/v1.0.0
```

#### 提交信息规范
```bash
# 提交格式：<type>(<scope>): <description>

# 类型
feat:     新功能
fix:      修复bug
docs:     文档修改
style:    代码格式修改
refactor: 代码重构
test:     测试相关
chore:    构建工具或辅助工具的变动

# 示例
feat(auth): implement JWT token refresh mechanism
fix(booking): resolve timezone handling issue
docs(api): update authentication endpoint documentation
```

### 开发流程

#### 1. 开始新功能开发
```bash
# 从develop分支创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/mvp-name

# 开始开发...
```

#### 2. 开发过程中的检查
```bash
# 代码格式化
black .

# 代码检查
flake8 backend/
mypy backend/

# 运行测试
pytest

# 重复代码检查
jscpd . --min-lines 15 --threshold 5
```

#### 3. 提交代码
```bash
# 添加文件
git add .

# 提交（会自动运行pre-commit hooks）
git commit -m "feat(feature-name): implement new feature"

# 推送到远程
git push origin feature/mvp-name
```

#### 4. 创建Pull Request
- 标题遵循提交信息规范
- 描述中包含：
  - 功能说明
  - 测试情况
  - 相关Issue链接
- 设置至少一个代码审查者

## 🧪 测试规范

### 测试策略

#### 测试层级
```
E2E Tests (10%)     # 端到端测试，关键用户流程
└── Integration Tests (20%)   # 集成测试，API交互
    └── Unit Tests (70%)      # 单元测试，业务逻辑
```

#### 测试文件组织
```
backend/
├── __tests__/
│   ├── unit/           # 单元测试
│   ├── integration/    # 集成测试
│   ├── e2e/           # 端到端测试
│   └── conftest.py    # pytest配置
└── tests/             # 向后兼容
```

### 单元测试

#### 测试编写规范
```python
import pytest
from unittest.mock import Mock, patch
from services.user_service import UserService

class TestUserService:

    @pytest.fixture
    def user_service(self):
        return UserService()

    def test_get_user_success(self, user_service):
        """测试成功获取用户信息"""
        # Arrange
        user_id = 1
        expected_result = {"id": 1, "name": "Test User"}

        # Act
        result = user_service.get_user(user_id)

        # Assert
        assert result == expected_result

    def test_get_user_not_found(self, user_service):
        """测试用户不存在的情况"""
        # Arrange
        user_id = 999

        # Act & Assert
        with pytest.raises(ValueError, match="User not found"):
            user_service.get_user(user_id)

    @patch('services.user_service.external_api')
    def test_create_user_with_external_api(self, mock_api, user_service):
        """测试使用外部API创建用户"""
        # Arrange
        mock_api.post.return_value = {"id": 123, "status": "success"}
        user_data = {"name": "New User"}

        # Act
        result = user_service.create_user(user_data)

        # Assert
        assert result["external_id"] == 123
        mock_api.post.assert_called_once_with("/users", json=user_data)
```

#### 测试覆盖率要求
- **全局覆盖率**: ≥80%
- **分支覆盖率**: ≥80%
- **关键业务逻辑**: 100%

### API测试

#### 集成测试示例
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestUserAPI:

    def test_create_user_success(self):
        """测试创建用户API"""
        user_data = {
            "name": "Test User",
            "email": "test@example.com"
        }

        response = client.post("/api/v1/users", json=user_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == user_data["name"]
        assert "id" in data

    def test_get_user_not_found(self):
        """测试获取不存在的用户"""
        response = client.get("/api/v1/users/999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
```

## 🏛️ 架构和设计模式

### 项目架构

#### 后端架构
```
backend/
├── api/                    # API路由层
│   ├── v1/
│   │   ├── endpoints/      # API端点
│   │   └── dependencies.py # FastAPI依赖
├── core/                   # 核心配置
│   ├── config.py          # 配置管理
│   ├── security.py        # 安全相关
│   └── database.py        # 数据库连接
├── models/                 # 数据模型
│   ├── user.py
│   ├── course.py
│   └── wallet.py
├── services/               # 业务服务层
│   ├── user_service.py
│   ├── booking_service.py
│   └── wallet_service.py
├── schemas/                # Pydantic模式
│   ├── user.py
│   └── booking.py
├── utils/                  # 工具函数
│   ├── auth.py
│   ├── validators.py
│   └── helpers.py
└── main.py                # 应用入口
```

### 设计模式

#### 1. 依赖注入
```python
from typing import Annotated
from fastapi import Depends
from services.user_service import UserService

# FastAPI依赖注入
def get_user_service() -> UserService:
    return UserService()

@app.post("/users/")
def create_user(
    user_data: UserCreate,
    user_service: Annotated[UserService, Depends(get_user_service)]
):
    return user_service.create_user(user_data)
```

#### 2. 仓储模式
```python
from abc import ABC, abstractmethod
from typing import List, Optional

class UserRepository(ABC):
    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[User]:
        pass

    @abstractmethod
    def create(self, user_data: dict) -> User:
        pass

class SQLAlchemyUserRepository(UserRepository):
    def __init__(self, db_session):
        self.db = db_session

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
```

#### 3. 服务层模式
```python
class UserService:
    def __init__(self, user_repo: UserRepository, wallet_service: WalletService):
        self.user_repo = user_repo
        self.wallet_service = wallet_service

    def create_user_with_wallet(self, user_data: dict) -> User:
        # 业务逻辑
        user = self.user_repo.create(user_data)
        self.wallet_service.create_wallet(user.id)
        return user
```

## 🔐 安全开发规范

### 输入验证
```python
from pydantic import BaseModel, EmailStr, validator

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

    @validator('phone')
    def validate_phone(cls, v):
        import re
        if not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('Invalid phone number format')
        return v
```

### 错误处理
```python
from fastapi import HTTPException
from core.exceptions import BusinessError

@app.exception_handler(BusinessError)
async def business_error_handler(request, exc: BusinessError):
    return JSONResponse(
        status_code=400,
        content={"error": str(exc), "code": exc.code}
    )

class BusinessError(Exception):
    def __init__(self, message: str, code: str = "BUSINESS_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)
```

### 日志记录
```python
import logging
from utils.logger import get_logger

logger = get_logger(__name__)

class UserService:
    def create_user(self, user_data: dict):
        logger.info(f"Creating user with data: {user_data}")

        try:
            user = self.user_repo.create(user_data)
            logger.info(f"User created successfully: {user.id}")
            return user
        except Exception as e:
            logger.error(f"Failed to create user: {str(e)}")
            raise
```

## 📊 性能优化

### 数据库优化

#### 查询优化
```python
# ❌ 不好的做法：N+1查询问题
def get_users_with_bookings_slow():
    users = User.query.all()
    for user in users:
        user.bookings  # 每次都查询数据库

# ✅ 好的做法：预加载关联数据
def get_users_with_bookings():
    return User.query.options(
        joinedload(User.bookings)
    ).all()

# ✅ 使用索引优化
class User(Base):
    __tablename__ = "user"

    email = Column(String(255), index=True, nullable=False)  # 单列索引
    created_at = Column(DateTime, index=True)                # 单列索引

    __table_args__ = (
        Index('idx_user_email_created', 'email', 'created_at'),  # 复合索引
    )
```

### 缓存策略
```python
import redis
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_result(expire_time=300):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            # 尝试从缓存获取
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)

            # 执行函数并缓存结果
            result = func(*args, **kwargs)
            redis_client.setex(
                cache_key,
                expire_time,
                json.dumps(result, default=str)
            )
            return result
        return wrapper
    return decorator

@cache_result(expire_time=600)
def get_user_stats():
    # 复杂的统计查询
    pass
```

## 📋 代码审查清单

### 审查要点

#### 1. 功能性
- [ ] 功能实现是否符合需求
- [ ] 边界条件是否处理
- [ ] 错误处理是否完善

#### 2. 代码质量
- [ ] 代码是否符合Python PEP 8规范
- [ ] 是否有适当的类型注解
- [ ] 函数和类的设计是否合理

#### 3. 性能
- [ ] 数据库查询是否优化
- [ ] 是否有不必要的重复计算
- [ ] 缓存策略是否合理

#### 4. 安全
- [ ] 输入验证是否充分
- [ ] 敏感信息是否正确处理
- [ ] 权限检查是否到位

#### 5. 测试
- [ ] 是否有足够的单元测试
- [ ] 测试覆盖率是否达标
- [ ] 测试用例是否覆盖边界情况

### 审查工具

#### 自动化检查
```bash
# 运行所有质量检查
npm run build

# 或分别运行
npm run lint           # ESLint检查
npm run test           # 单元测试
npm run dry:check      # 重复代码检查
```

## 🚀 部署和发布

### 环境区分
- **开发环境**: `development`
- **测试环境**: `staging`
- **生产环境**: `production`

### 发布流程
1. **代码合并**: 合并到`develop`分支
2. **质量检查**: 运行所有自动化检查
3. **测试验证**: 在staging环境验证
4. **发布准备**: 创建release分支
5. **生产发布**: 合并到`main`分支
6. **监控验证**: 确认系统正常运行

## 📚 学习资源

### 必读文档
- [项目宪法](CONSTITUTION.md)
- [快速开始指南](quickstart.md)
- [API文档](http://localhost:8000/docs)

### 外部资源
- [Python最佳实践](https://docs.python-guide.org/)
- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

## 🆘 常见问题

### Q: 如何添加新的MVP？
**A**: 参考 `specs/` 目录下的现有MVP模板：
1. 创建新的MVP目录
2. 使用 `/speckit.specify` 生成规格
3. 使用 `/speckit.plan` 生成计划
4. 使用 `/speckit.tasks` 生成任务

### Q: 如何调试API？
**A**:
1. 使用FastAPI自动生成的文档：`http://localhost:8000/docs`
2. 查看日志：`tail -f logs/app.log`
3. 使用IDE的调试功能

### Q: 如何处理数据库迁移？
**A**:
1. 修改模型后创建迁移：`alembic revision --autogenerate`
2. 检查迁移文件
3. 应用迁移：`alembic upgrade head`

---

**📝 重要提醒**: 本文档会随着项目发展持续更新，请定期查看最新版本。

**Happy Coding! 🚀**
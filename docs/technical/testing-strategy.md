# 🧪 测试策略文档

**Testing Strategy Documentation**

**版本**: 1.0.0
**最后更新**: 2025-11-17
**测试框架**: pytest + coverage

---

## 📋 测试概览

### 测试目标
- 🎯 **质量保证**: 确保软件质量符合项目宪法18项原则
- 🔍 **缺陷发现**: 及时发现并修复软件缺陷
- 📊 **质量度量**: 提供客观的质量度量指标
- 🚀 **持续集成**: 支持CI/CD流程和自动化测试

### 测试原则
- **测试驱动**: 新功能开发前先编写测试
- **快速反馈**: 测试执行时间 < 5分钟
- **全面覆盖**: 覆盖关键业务流程和边界条件
- **可维护性**: 测试代码清晰易懂，易于维护

## 🏗️ 测试架构

### 测试金字塔
```
    E2E Tests (10%)        # 端到端测试，用户场景
    └── Integration Tests (20%)   # 集成测试，API交互
        └── Unit Tests (70%)      # 单元测试，业务逻辑
```

### 测试类型分布
- **单元测试**: 70% - 快速、独立、覆盖业务逻辑
- **集成测试**: 20% - API交互、数据库操作
- **端到端测试**: 10% - 完整用户流程、UI交互

### 测试覆盖率要求
- **全局覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 80%
- **关键业务逻辑**: 100%
- **API端点**: 100%

## 🔬 单元测试

### 测试结构
```
backend/
├── tests/
│   ├── unit/                    # 单元测试
│   │   ├── test_user_service.py
│   │   ├── test_booking_service.py
│   │   ├── test_wallet_service.py
│   │   └── conftest.py         # pytest配置
├── shared/
│   └── __tests__/
│       ├── test_utils.py
│       └── test_validators.py
└── __tests__/
    └── test_models.py        # 向后兼容
```

### 测试编写规范

#### 1. 测试文件命名
```python
# 文件命名：test_{module_name}.py
# 类命名：Test{ClassName}
# 方法命名：test_{function_name}_{scenario}

class TestUserService:
    def test_create_user_success(self):
        pass

    def test_create_user_with_invalid_email(self):
        pass
```

#### 2. 测试结构
```python
import pytest
from unittest.mock import Mock, patch
from services.user_service import UserService
from models.user import User

class TestUserService:
    """用户服务单元测试"""

    @pytest.fixture
    def user_service(self):
        """测试夹具：用户服务实例"""
        return UserService()

    @pytest.fixture
    def sample_user_data(self):
        """测试夹具：用户数据"""
        return {
            "name": "张三",
            "email": "zhangsan@example.com",
            "phone": "13812345678"
        }
```

#### 3. 测试编写模式
```python
def test_create_user_success(self, user_service, sample_user_data):
    """
    测试成功创建用户

    Given: 有效用户数据
    When: 调用创建用户方法
    Then: 用户创建成功并返回用户信息
    """
    # Arrange - 准备测试数据
    user_data = sample_user_data

    # Act - 执行测试
    result = user_service.create_user(user_data)

    # Assert - 验证结果
    assert result is not None
    assert result["name"] == user_data["name"]
    assert "id" in result
    assert result["email"] == user_data["email"]

def test_create_user_duplicate_email(self, user_service, sample_user_data):
    """
    测试重复邮箱创建用户

    Given: 已存在相同邮箱的用户
    When: 再次使用相同邮箱创建用户
    Then: 抛出业务异常
    """
    # Arrange
    user_service.create_user(sample_user_data)  # 创建第一个用户

    # Act & Assert
    with pytest.raises(BusinessError, match="邮箱已存在"):
        user_service.create_user(sample_user_data)

@patch('services.user_service.send_welcome_email')
def test_create_user_send_email(self, mock_email, user_service, sample_user_data):
    """测试创建用户时发送欢迎邮件"""
    # Act
    user_service.create_user(sample_user_data)

    # Assert
    mock_email.assert_called_once_with(
        sample_user_data["email"],
        sample_user_data["name"]
    )
```

### Mock和Fixture使用

#### Mock对象
```python
from unittest.mock import Mock, AsyncMock, patch

class TestBookingService:

    @pytest.fixture
    def mock_wallet_service(self):
        """Mock钱包服务"""
        mock_wallet = Mock()
        mock_wallet.check_balance.return_value = 100.0
        return mock_wallet

    @patch('services.booking_service.email_service')
    def test_booking_notification(self, mock_email):
        """使用patch装饰器Mock"""
        pass
```

#### 数据库Mock
```python
from sqlalchemy.orm import Session

@pytest.fixture
def mock_db_session():
    """Mock数据库会话"""
    session = Mock(spec=Session)
    session.query.return_value.filter.return_value.first.return_value = None
    return session

def test_get_user_not_found(self, mock_db_session):
    """测试用户不存在"""
    user_service = UserService(db=mock_db_session)
    result = user_service.get_user(999)
    assert result is None
```

## 🔗 集成测试

### API集成测试
```python
import pytest
from fastapi.testclient import TestClient
from main import app

class TestUserAPI:
    @pytest.fixture
    def client(self):
        """测试客户端"""
        return TestClient(app)

    @pytest.fixture
    def auth_headers(self):
        """认证头"""
        return {"Authorization": "Bearer test_token"}

    def test_create_user_api(self, client, auth_headers):
        """测试创建用户API"""
        user_data = {
            "name": "测试用户",
            "email": "test@example.com",
            "phone": "13812345678"
        }

        response = client.post(
            "/api/v1/users",
            json=user_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == user_data["name"]

    def test_create_user_invalid_data(self, client, auth_headers):
        """测试无效数据创建用户"""
        invalid_data = {
            "name": "",  # 空名称
            "email": "invalid-email"  # 无效邮箱
        }

        response = client.post(
            "/api/v1/users",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
        assert len(data["error"]["details"]) == 2
```

### 数据库集成测试
```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.base import Base
from models.user import User
from services.user_service import UserService

@pytest.fixture(scope="function")
def test_db():
    """测试数据库"""
    # 使用内存SQLite数据库
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    yield session

    session.close()

class TestUserServiceIntegration:
    def test_create_and_get_user(self, test_db):
        """测试数据库创建和获取用户"""
        user_service = UserService(db=test_db)

        # 创建用户
        user_data = {
            "openid": "test_openid_123",
            "name": "测试用户",
            "email": "test@example.com"
        }
        created_user = user_service.create_user(user_data)

        # 获取用户
        retrieved_user = user_service.get_user(created_user["id"])

        assert retrieved_user is not None
        assert retrieved_user["name"] == user_data["name"]
        assert retrieved_user["email"] == user_data["email"]
```

## 🌐 端到端测试

### 小程序E2E测试
```python
import pytest
from appium import webdriver
from appium.webdriver.common.appiumby import AppiumBy

class TestMiniProgramE2E:
    @pytest.fixture(scope="class")
    def driver(self):
        """Appium驱动"""
        desired_caps = {
            "platformName": "Android",
            "deviceName": "Android Emulator",
            "app": "/path/to/miniprogram.apk",
            "automationName": "UiAutomator2"
        }
        driver = webdriver.Remote("http://localhost:4723/wd/hub", desired_caps)
        yield driver
        driver.quit()

    def test_user_registration_flow(self, driver):
        """测试用户注册流程"""
        # 点击授权登录按钮
        auth_button = driver.find_element(AppiumBy.ID, "auth-button")
        auth_button.click()

        # 等待授权页面
        driver.implicitly_wait(10)

        # 输入用户信息
        name_input = driver.find_element(AppiumBy.ID, "name-input")
        name_input.send_keys("测试用户")

        phone_input = driver.find_element(AppiumBy.ID, "phone-input")
        phone_input.send_keys("13812345678")

        # 提交注册
        submit_button = driver.find_element(AppiumBy.ID, "submit-button")
        submit_button.click()

        # 验证注册成功
        driver.implicitly_wait(10)
        success_message = driver.find_element(AppiumBy.ID, "success-message")
        assert "注册成功" in success_message.text
```

### 管理后台E2E测试
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestAdminDashboardE2E:
    @pytest.fixture(scope="class")
    def driver(self):
        """Selenium驱动"""
        driver = webdriver.Chrome()
        driver.implicitly_wait(10)
        yield driver
        driver.quit()

    def test_admin_login_and_user_management(self, driver):
        """测试管理员登录和用户管理"""
        # 访问登录页面
        driver.get("http://localhost:3000/login")

        # 输入管理员凭据
        username_input = driver.find_element(By.ID, "username")
        username_input.send_keys("admin")

        password_input = driver.find_element(By.ID, "password")
        password_input.send_keys("admin123")

        # 点击登录
        login_button = driver.find_element(By.ID, "login-button")
        login_button.click()

        # 验证登录成功，跳转到仪表板
        WebDriverWait(driver, 10).until(
            EC.url_contains("/dashboard")
        )

        # 导航到用户管理页面
        user_management_link = driver.find_element(By.LINK_TEXT, "用户管理")
        user_management_link.click()

        # 验证用户列表加载
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "user-table"))
        )

        # 搜索用户
        search_input = driver.find_element(By.ID, "search-input")
        search_input.send_keys("张三")

        # 验证搜索结果
        user_rows = driver.find_elements(By.CSS_SELECTOR, ".user-table tbody tr")
        assert len(user_rows) > 0
```

## 📊 测试数据管理

### 测试数据生成
```python
# tests/factories.py
from faker import Faker
from models.user import User

fake = Faker("zh_CN")

class UserFactory:
    """用户数据工厂"""

    @staticmethod
    def create_user_data(**kwargs):
        """生成用户测试数据"""
        data = {
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "avatar_url": fake.image_url(),
            "status": "active"
        }
        data.update(kwargs)
        return data

    @staticmethod
    def create_user(**kwargs):
        """创建用户对象"""
        user_data = UserFactory.create_user_data(**kwargs)
        return User(**user_data)

class BookingFactory:
    """预约数据工厂"""

    @staticmethod
    def create_booking_data(**kwargs):
        """生成预约测试数据"""
        data = {
            "user_id": 1,
            "profile_id": 1,
            "course_id": 1,
            "status": "confirmed",
            "booking_type": "regular"
        }
        data.update(kwargs)
        return data
```

### 测试数据清理
```python
# tests/conftest.py
import pytest
from models.base import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture(scope="session")
def test_db():
    """测试数据库会话"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    yield session

    session.close()
    Base.metadata.drop_all(engine)

@pytest.fixture(autouse=True)
def cleanup_test_data(test_db):
    """自动清理测试数据"""
    yield
    # 测试后清理数据
    for table in reversed(Base.metadata.sorted_tables):
        test_db.execute(table.delete())
    test_db.commit()
```

## 🔧 测试配置

### pytest配置文件
```ini
# pytest.ini
[tool:pytest]
testpaths = tests __tests__
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
addopts =
    --strict-markers
    --strict-config
    --verbose
    --cov=backend
    --cov=shared
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    --cov-exclude=tests/*,__tests__/*,*/migrations/*
    --durations=10
    --maxfail=5
markers =
    unit: 单元测试
    integration: 集成测试
    e2e: 端到端测试
    slow: 慢速测试
    smoke: 冒烟测试
filterwarnings =
    ignore::UserWarning
    ignore::DeprecationWarning
    ignore::PendingDeprecationWarning
```

### 测试环境配置
```python
# tests/conftest.py
import os
import pytest
from unittest.mock import Mock

@pytest.fixture
def test_config():
    """测试配置"""
    return {
        "DATABASE_URL": "sqlite:///:memory:",
        "REDIS_URL": "redis://localhost:6379/15",
        "JWT_SECRET_KEY": "test_secret_key",
        "WECHAT_APP_ID": "test_app_id",
        "WECHAT_APP_SECRET": "test_app_secret"
    }

@pytest.fixture(autouse=True)
def set_test_env(test_config):
    """设置测试环境变量"""
    for key, value in test_config.items():
        os.environ[key] = value

@pytest.fixture
def mock_wechat_api():
    """Mock微信API"""
    mock_api = Mock()
    mock_api.code2session.return_value = {
        "openid": "test_openid",
        "session_key": "test_session_key"
    }
    return mock_api
```

## 🚀 测试执行

### 运行测试
```bash
# 运行所有测试
pytest

# 运行特定类型测试
pytest -m unit              # 只运行单元测试
pytest -m integration        # 只运行集成测试
pytest -m e2e               # 只运行端到端测试

# 运行特定文件
pytest tests/unit/test_user_service.py
pytest tests/integration/test_api.py

# 生成覆盖率报告
pytest --cov=backend --cov-report=html

# 并行运行测试
pytest -n auto

# 详细输出
pytest -v

# 显示执行时间
pytest --durations=10
```

### 持续集成配置
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: "3.11"

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov

    - name: Run tests
      run: |
        pytest --cov=backend --cov-report=xml

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
```

## 📈 质量门禁

### 代码质量检查
```python
# tests/conftest.py
import pytest

def pytest_runtest_setup(item):
    """测试前的质量检查"""
    # 检查测试文件命名
    if not item.fspath.name.startswith("test_"):
        pytest.fail(f"测试文件必须以'test_'开头: {item.fspath.name}")

    # 检查测试类命名
    for cls in item.cls.__mro__ if hasattr(cls, '__mro__'):
        if hasattr(cls, '__name__') and cls.__name__ == 'Test' and item.cls:
            if not cls.__name__.startswith("Test"):
                pytest.fail(f"测试类必须以'Test'开头: {cls.__name__}")

def pytest_collection_modifyitems(items):
    """动态调整测试"""
    # 标记慢速测试
    slow_tests = []
    for item in items:
        if "slow" in item.nodeid:
            item.add_marker(pytest.mark.slow)
            slow_tests.append(item)

    # 慢速测试最后执行
    slow_tests.extend([item for item in items if item not in slow_tests])
    items[:] = [item for item in items if item not in slow_tests] + slow_tests
```

### 覆盖率要求
```python
# tests/test_coverage.py
def test_coverage_requirements():
    """覆盖率要求检查"""
    import coverage
    import sys

    # 读取覆盖率报告
    cov = coverage.Coverage()
    cov.load()

    total_coverage = cov.report()

    # 检查覆盖率要求
    if total_coverage < 80:
        pytest.fail(f"测试覆盖率不达标: {total_coverage}% < 80%")

    # 检查关键模块覆盖率
    critical_modules = [
        'services/user_service.py',
        'services/booking_service.py',
        'services/wallet_service.py',
        'models/user.py',
        'models/booking.py'
    ]

    for module in critical_modules:
        module_coverage = cov.analysis2(morpheme=module)
        if module_coverage < 100:
            pytest.fail(f"关键模块覆盖率不足: {module} = {module_coverage}% < 100%")
```

## 🔍 测试报告

### HTML覆盖率报告
```bash
# 生成详细覆盖率报告
pytest --cov=backend --cov-report=html --cov-report=term-missing

# 查看报告
open htmlcov/index.html
```

### 测试结果分析
```python
# scripts/analyze_test_results.py
import pytest
import json
from collections import defaultdict

def analyze_test_results():
    """分析测试结果"""
    result = pytest.main(["--json-report", "--json-report-file=test_results.json"])

    # 读取测试结果
    with open("test_results.json", "r") as f:
        test_data = json.load(f)

    # 统计测试类型分布
    test_types = defaultdict(int)
    for test in test_data["tests"]:
        test_type = test.get("type", "unit")
        test_types[test_type] += 1

    print(f"测试分布:")
    for test_type, count in test_types.items():
        print(f"  {test_type}: {count}")

    print(f"总计: {sum(test_types.values())}")
    print(f"通过率: {test_data['summary']['passed'] / test_data['summary']['total'] * 100:.1f}%")

if __name__ == "__main__":
    analyze_test_results()
```

## 📝 测试最佳实践

### 1. 测试命名和文档
```python
def test_user_registration_with_valid_data_should_create_user_successfully():
    """
    测试用户注册 - 有效数据

    这个测试验证当提供有效的用户注册数据时，
    系统能够成功创建用户并返回用户信息。

    Given: 有效的用户注册数据
    When: 调用用户注册接口
    Then: 系统创建用户成功
    """
    pass
```

### 2. 测试隔离
```python
@pytest.fixture
def isolated_user_service():
    """隔离的用户服务，不依赖其他测试状态"""
    from services.user_service import UserService

    # 创建独立的数据库会话
    session = create_test_session()
    service = UserService(db=session)

    yield service

    session.close()
```

### 3. 异步测试
```python
import pytest
import asyncio
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_async_user_creation():
    """异步API测试"""
    async with AsyncClient() as client:
        response = await client.post("/api/v1/users", json=user_data)
        assert response.status_code == 201

@pytest.mark.asyncio
async def test_async_service():
    """异步服务测试"""
    user_service = AsyncUserService()
    user = await user_service.create_user(user_data)
    assert user is not None
```

### 4. 性能测试
```python
import time
import pytest

@pytest.mark.performance
def test_user_creation_performance():
    """性能测试：用户创建应该在100ms内完成"""
    start_time = time.time()

    user_service = UserService()
    result = user_service.create_user(sample_user_data)

    execution_time = time.time() - start_time
    assert execution_time < 0.1  # 100ms
    assert result is not None
```

---

**📝 重要提醒**: 测试策略会随着项目发展和团队实践持续演进，请定期回顾和更新测试策略文档。

**Happy Testing! 🚀**
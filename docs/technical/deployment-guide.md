# 🚀 部署指南

**Deployment Guide**

**版本**: 1.0.0
**最后更新**: 2025-11-17
**支持平台**: Linux (Ubuntu/CentOS), macOS, Windows

---

## 📋 部署概览

### 部署环境
- **开发环境**: 本地开发和测试
- **测试环境**: 功能测试和集成测试
- **预生产环境**: 生产前的最终验证
- **生产环境**: 正式运行环境

### 部署架构
```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                    │
├─────────────────────────────────────────────────────────┤
│              Frontend (React Admin Dashboard)                │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                     Application Servers                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   FastAPI App 1 │  │   FastAPI App 2 │  │   FastAPI App 3 │  │
│  │   (Gunicorn)   │  │   (Gunicorn)   │  │   (Gunicorn)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │     MySQL      │  │      Redis     │  │   File Storage │  │
│  │    (Master)    │  │    (Cache)      │  │  (MinIO/Local) │  │
│  │   (Replica)    │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 技术栈
- **后端**: Python 3.11 + FastAPI + Uvicorn/Gunicorn
- **前端**: React 18 + TypeScript + Ant Design Pro
- **数据库**: MySQL 8.0 + Redis 7.0
- **Web服务器**: Nginx
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana

## 🐳️ Docker部署

### Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户
RUN adduser --disabled-password --gecos "" appuser
RUN chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  # 数据库
  mysql:
    image: mysql:8.0
    container_name: ccmartmeet-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: ccmartmeet-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  # 后端API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ccmartmeet-backend
    environment:
      - DATABASE_URL=mysql+pymysql://${MYSQL_USER}:${MYSQL_PASSWORD}@mysql:3306/${MYSQL_DATABASE}
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - ENVIRONMENT=production
    ports:
      - "8000:8000"
    depends_on:
      - mysql
      - redis
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # 前端管理后台
  admin:
    build:
      context: ./admin
      dockerfile: Dockerfile
    container_name: ccmartmeet-admin
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
    environment:
      - REACT_APP_API_URL=http://backend:8000/api/v1

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: ccmartmeet-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./uploads:/var/www/uploads
    depends_on:
      - backend
      - admin
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
  uploads:
```

### Nginx配置
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log main;
    error_log   /var/log/nginx/error.log warn;

    # 基础配置
    sendfile        on;
    tcp_nopush      on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # 上游服务器
    upstream backend {
        server backend:8000;
    }

    # 主服务器配置
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        # HTTP重定向到HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL证书配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # SSL配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # API代理
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 超时设置
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # WebSocket支持
        location /ws/ {
            proxy_pass http://backend/ws;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 管理后台
        location / {
            proxy_pass http://admin:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 静态文件
        location /uploads/ {
            alias /var/www/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy";
            add_header Content-Type text/plain;
        }
    }
}
```

## 🚀 部署步骤

### 1. 环境准备
```bash
# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo usermod -aG docker $USER
newgrp docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 克隆代码
```bash
# 克隆项目
git clone https://github.com/your-org/ccmartmeet-gymnastics.git
cd ccmartmeet-gymnastics

# 创建环境变量文件
cp .env.example .env
vim .env  # 编辑配置
```

### 3. 构建和启动服务
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f backend
```

### 4. 数据库初始化
```bash
# 等待数据库启动
docker-compose up -d mysql

# 运行数据库迁移
docker-compose exec backend python manage.py migrate

# 创建初始数据
docker-compose exec backend python manage.py seed

# 创建管理员用户
docker-compose exec backend python manage.py create_admin \
  --username admin \
  --password admin123 \
  --name "系统管理员" \
  --email admin@company.com
```

### 5. 验证部署
```bash
# 检查服务健康状态
curl http://localhost/health

# 检查API服务
curl http://localhost/api/v1/health

# 检查前端服务
curl http://localhost:3000

# 检查数据库连接
docker-compose exec backend python -c "
from core.database import SessionLocal
session = SessionLocal()
print('Database connection OK')
"
```

## 🔒 安全配置

### SSL/TLS证书
```bash
# 使用Let's Encrypt证书
sudo apt-get install certbot
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 防火墙配置
```bash
# Ubuntu防火墙配置
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 8000/tcp
sudo ufw deny 3000/tcp
sudo ufw status
```

### 环境变量安全
```bash
# .env文件权限
chmod 600 .env

# 生产环境配置
cat >> .env <<EOF
# 生产环境特定配置
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your_super_secret_key_here
MYSQL_ROOT_PASSWORD=your_secure_password
JWT_SECRET_KEY=your_jwt_secret_key_here
EOF
```

## 📊 监控和日志

### Prometheus监控配置
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ccmartmeet-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']

  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql-exporter:9104']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### 日志配置
```python
# core/logging_config.py
import logging
import logging.config
from pathlib import Path

# 日志配置
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S"
        },
        "json": {
            "()": "pythonjsonlogger.JsonFormatter"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "default",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "INFO",
            "formatter": "json",
            "filename": "logs/app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "encoding": "utf8"
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "ERROR",
            "formatter": "json",
            "filename": "logs/error.log",
            "maxBytes": 10485760,
            "backupCount": 5,
            "encoding": "utf8"
        }
    },
    "loggers": {
        "": {
            "level": "INFO",
            "handlers": ["console", "file"],
            "propagate": False
        },
        "error": {
            "level": "ERROR",
            "handlers": ["console", "error_file"],
            "propagate": False
        }
    }
}

# 应用日志配置
logging.config.dictConfig(LOGGING_CONFIG)
```

## 🔄 CI/CD自动化

### GitHub Actions工作流
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

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

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3

    - name: Log in to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ secrets.DOCKER_USERNAME }}/ccmartmeet-backend:${{ github.sha }}

    - name: Build and push Admin image
      uses: docker/build-push-action@v4
      with:
        context: ./admin
        push: true
        tags: ${{ secrets.DOCKER_USERNAME }}/ccmartmeet-admin:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3

    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.PRODUCTION_HOST }}
        username: ${{ secrets.PRODUCTION_USER }}
        key: ${{ secrets.PRODUCTION_SSH_KEY }}
        script: |
          cd /opt/ccmartmeet-gymnastics
          docker-compose pull
          docker-compose down
          docker-compose up -d
          docker-compose exec backend python manage.py migrate
          docker-compose exec backend python manage.py collectstatic --noinput

    - name: Health check
      run: |
        sleep 30
        curl -f http://your-domain.com/health || exit 1
```

## 🚀 蓝屏部署

### 健康检查端点
```python
# main.py
from fastapi import FastAPI, status
from pydantic import BaseModel

app = FastAPI()

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    environment: str

@app.get("/health")
async def health_check():
    """健康检查端点"""
    try:
        # 检查数据库连接
        from core.database import engine
        with engine.connect() as conn:
            conn.execute("SELECT 1")

        # 检查Redis连接
        from core.redis_client import redis_client
        redis_client.ping()

        return HealthResponse(
            status="ok",
            timestamp=datetime.utcnow().isoformat(),
            version="1.0.0",
            environment=os.getenv("ENVIRONMENT", "unknown")
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service unavailable: {str(e)}"
        )
```

### 优雅关闭
```python
# main.py
import signal
import asyncio
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

class GracefulShutdown:
    def __init__(self):
        self.shutdown = False

    def signal_handler(self, signum, frame):
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.shutdown = True

    async def shutdown_tasks(self):
        """优雅关闭任务"""
        # 关闭数据库连接
        from core.database import engine
        engine.dispose()

        # 关闭Redis连接
        from core.redis_client import redis_client
        redis_client.close()

        logger.info("All services shut down gracefully")

# 注册信号处理器
shutdown_handler = GracefulShutdown()
signal.signal(signal.SIGINT, shutdown_handler.signal_handler)
signal.signal(signal.SIGTERM, shutdown_handler.signal_handler)

@app.on_event("shutdown")
async def app_shutdown():
    await shutdown_handler.shutdown_tasks()
```

## 📊 性能优化

### Gunicorn配置
```python
# gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 100
preload_app = True
worker_tmp_dir = "/tmp"

# 日志配置
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
error_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" "%(s)s "%(b)s "%(f)s" "%(a)s"'

# 性能调优
# worker_connections = 1000
# max_requests = 1000
# max_requests_jitter = 100
# timeout = 120
# keepalive = 5
# preload_app = True
```

### 启动脚本
```bash
#!/bin/bash
# scripts/start.sh

set -e

echo "Starting CCMartMeet Gymnastics Management System..."

# 检查环境变量
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

# 检查Docker服务
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# 等待依赖服务启动
echo "Waiting for MySQL..."
until docker-compose exec mysql mysqladmin ping -h mysql -u root -p$MYSQL_ROOT_PASSWORD --silent; do
    sleep 1
done

echo "Waiting for Redis..."
until docker-compose exec redis redis-cli ping; do
    sleep 1
done

# 运行数据库迁移
echo "Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# 收集静态文件
echo "Collecting static files..."
docker-compose exec -T backend python manage.py collectstatic --noinput

# 启动应用
echo "Starting application..."
docker-compose up -d

echo "Application started successfully!"
echo "Health check: http://localhost/health"
echo "API docs: http://localhost:8000/docs"
echo "Admin dashboard: http://localhost:3000"
```

## 📋 部署检查清单

### 部署前检查
- [ ] 环境变量配置正确
- [ ] SSL证书已配置
- [ ] 防火墙规则已设置
- [ ] 数据库已创建并迁移
- [ ] 文件存储权限已设置
- [ ] 监控系统已配置
- [ ] 备份策略已制定

### 部署后验证
- [ ] 所有服务正常启动
- [ ] 健康检查端点响应正常
- [ ] API接口访问正常
- [ ] 前端页面加载正常
- [ ] 数据库连接正常
- [ ] 日志记录正常
- [ ] 监控指标正常
- [ ] 备份任务运行正常

### 安全检查
- [ ] SSL/TLS配置正确
- [ ] 敏感信息已加密
- [ ] 访问控制已实施
- [ ] 输入验证已配置
- [ ] SQL注入防护已启用
- [ ] XSS防护已启用
- [ ] CSRF防护已启用
- [ ] 文件上传安全已配置

---

**📝 重要提醒**: 部署过程中请密切关注服务状态和日志输出，确保及时发现和解决问题。

**Happy Deploying! 🚀**
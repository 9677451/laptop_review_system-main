# 笔记本电脑评价系统 - 线上部署指南

本项目支持使用 **Docker** 和 **Docker Compose** 进行一键式部署。

## 1. 环境要求
- 已安装 [Docker](https://www.docker.com/)
- 已安装 [Docker Compose](https://docs.docker.com/compose/)

## 2. 部署方案选择

### 方案 A：普通服务器通用部署 (Docker Compose)
适用于任何支持 Docker 的云服务器（如腾讯云、华为云、个人服务器）。
具体步骤见下文第 3 节。

### 方案 B：阿里云云原生部署 (ECS + RDS + ACR)
适用于对稳定性要求更高、使用阿里云全家桶的用户。
具体步骤请参考：[README_ALIYUN.md](./README_ALIYUN.md)

## 3. 通用部署步骤 (方案 A)

### 第一步：准备代码
将整个项目目录上传到您的服务器。

### 第二步：配置环境变量
在 `backend` 目录下，根据 `.env.example` 创建 `.env` 文件，并修改数据库密码等敏感信息。
```bash
cp backend/.env.example backend/.env
# 使用编辑器修改 backend/.env
```

### 第三步：一键启动
在项目根目录下运行以下命令：
```bash
docker-compose up -d --build
```
此命令将：
1. 构建 Python 后端镜像。
2. 启动 MySQL 8.0 数据库容器。
3. 启动 Nginx 容器（负责提供前端静态文件和反向代理 API）。

### 第四步：初始化数据库
如果您的数据库是全新的，您可能需要导入初始 SQL 脚本。
```bash
# 获取数据库容器 ID
docker ps
# 导入 SQL（假设您有初始脚本 init.sql）
docker exec -i laptop_db mysql -uroot -p9677451 laptop_review_db < init.sql
```

## 3. 服务访问
- **前端地址**：`http://您的服务器IP`
- **后端 API**：`http://您的服务器IP/api`

## 4. 常用运维命令

### 查看容器日志
```bash
docker-compose logs -f
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 数据库备份
系统内置了备份功能，备份文件将保存在 `backend/backups` 目录下。

## 5. 注意事项
- 线上部署时，请务必修改 `backend/.env` 中的 `DB_PASSWORD` 和 `JWT_SECRET`。
- Nginx 配置在 `nginx.conf` 中，如需配置 HTTPS (SSL)，请在该文件中添加证书相关配置。

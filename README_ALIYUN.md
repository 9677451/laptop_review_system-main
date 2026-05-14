# 笔记本电脑评价系统 - 阿里云部署指南

本指南介绍了如何将系统部署到阿里云，推荐使用 **ECS (云服务器)** + **RDS (云数据库 MySQL)** 的组合。

## 1. 阿里云资源准备
- **ECS**: 建议 2核4G 或以上规格，系统选择 Ubuntu 或 CentOS。
- **RDS (MySQL 8.0)**: 创建一个数据库实例，并设置好白名单（允许 ECS 的私网 IP 访问）。
- **ACR (容器镜像服务)**: 用于存放后端镜像。

## 2. 数据库配置 (RDS)
1. 在 RDS 管理控制台创建数据库 `laptop_review_db`。
2. 创建一个高权限账号或普通账号并授权。
3. **关键步骤**: 将 ECS 的内网 IP 添加到 RDS 的白名单中。

## 3. 部署步骤

### 第一步：在本地构建并推送镜像
如果您使用了阿里云 ACR，可以按照以下步骤操作：
```bash
# 登录阿里云镜像仓库
docker login --username=您的用户名 registry.cn-hangzhou.aliyuncs.com

# 构建镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/您的命名空间/laptop-backend:v1 ./backend

# 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/您的命名空间/laptop-backend:v1
```

### 第二步：配置服务器环境变量
在服务器上创建 `.env` 文件，填入 RDS 的连接信息：
```bash
# .env 文件示例
DB_HOST=rm-xxxxxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=您的数据库用户名
DB_PASSWORD=您的数据库密码
DB_NAME=laptop_review_db
JWT_SECRET=您的随机秘钥
```

### 第三步：使用 Docker Compose 部署
修改服务器上的 `docker-compose.yml`，删除或注释掉 `db` 服务部分（因为我们改用 RDS），并将后端镜像指向 ACR：

```yaml
version: '3.8'
services:
  backend:
    image: registry.cn-hangzhou.aliyuncs.com/您的命名空间/laptop-backend:v1
    container_name: laptop_backend
    restart: always
    env_file: .env
    # 注意：不再需要 depends_on db

  nginx:
    image: nginx:alpine
    container_name: laptop_nginx
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./frontend:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
```

运行启动命令：
```bash
docker-compose up -d
```

## 4. 阿里云安全组设置
在 ECS 安全组中开放以下端口：
- **80**: 前端 HTTP 访问
- **443**: (可选) 如果您配置了 HTTPS
- **22**: SSH 远程管理

## 5. (进阶) 使用 OSS + CDN 加速前端
1. 将 `frontend` 目录下的所有文件上传到阿里云 **OSS** 存储桶。
2. 开启静态网站托管功能。
3. 绑定自定义域名并配置 **CDN** 加速。
4. 在 Nginx 配置中，只需要保留 API 转发功能即可。

## 6. 注意事项
- **内网访问**: 确保 ECS 和 RDS 在同一个 VPC 内，使用 RDS 的 **内网地址** 连接，速度更快且更安全。
- **备份**: 虽然系统内置了备份功能，但建议同时开启阿里云 RDS 的 **自动备份策略**。

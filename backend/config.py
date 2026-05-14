import os
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

class Config:
    """应用配置"""
    # 优先从环境变量读取，若不存在则使用默认值
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '9677451')
    DB_NAME = os.getenv('DB_NAME', 'laptop_review_db')
    
    JWT_SECRET = os.getenv('JWT_SECRET', 'laptop-review-system-secret-key-2024')
    JWT_EXPIRES_HOURS = int(os.getenv('JWT_EXPIRES_HOURS', 24))

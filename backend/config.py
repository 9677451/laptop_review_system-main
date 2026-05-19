import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_PATH = os.getenv('DB_PATH', os.path.join(os.path.dirname(__file__), 'data', 'laptop_review.db'))

    JWT_SECRET = os.getenv('JWT_SECRET', 'laptop-review-system-secret-key-2024')
    JWT_EXPIRES_HOURS = int(os.getenv('JWT_EXPIRES_HOURS', 24))

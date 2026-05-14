import bcrypt
from db import db

class UserModel:
    @staticmethod
    def hash_password(password):
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password, hashed):
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @staticmethod
    def create_user(user_id, username, password, occupation, email, phone, role='user'):
        hashed_pwd = UserModel.hash_password(password)
        query = """
            INSERT INTO users (user_id, username, password, occupation, email, phone, register_time, role)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
        """
        return db.execute_insert(query, (user_id, username, hashed_pwd, occupation, email, phone, role))
    
    @staticmethod
    def get_user_by_id(user_id):
        query = "SELECT user_id, username, email, phone, occupation, role, points, level FROM users WHERE user_id = %s"
        users = db.execute_query(query, (user_id,))
        return users[0] if users else None

    @staticmethod
    def add_points(user_id, points):
        # 增加积分并计算等级 (每 100 分升一级)
        db.execute_update("UPDATE users SET points = points + %s WHERE user_id = %s", (points, user_id))
        db.execute_update("UPDATE users SET level = FLOOR(points / 100) + 1 WHERE user_id = %s", (user_id,))
        return True
    
    @staticmethod
    def get_user_with_password(user_id):
        query = "SELECT * FROM users WHERE user_id = %s"
        result = db.execute_query(query, (user_id,))
        return result[0] if result else None
    
    @staticmethod
    def update_user(user_id, data):
        fields = []
        values = []
        for key, value in data.items():
            if value is not None:
                fields.append(f"{key} = %s")
                values.append(value)
        if not fields:
            return 0
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(fields)} WHERE user_id = %s"
        return db.execute_update(query, tuple(values))
    
    @staticmethod
    def update_password(user_id, new_password):
        hashed_pwd = UserModel.hash_password(new_password)
        query = "UPDATE users SET password = %s WHERE user_id = %s"
        return db.execute_update(query, (hashed_pwd, user_id))
    
    @staticmethod
    def delete_user(user_id):
        query = "DELETE FROM users WHERE user_id = %s"
        return db.execute_update(query, (user_id,))

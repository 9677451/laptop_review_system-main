import mysql.connector
from mysql.connector import Error, pooling
from config import Config
import time

class Database:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.pool = None
            cls._instance._init_pool()
        return cls._instance
    
    def _init_pool(self):
        try:
            if self.pool:
                return
            
            self.pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="laptop_pool",
                pool_size=5,
                pool_reset_session=True,
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
                charset='utf8mb4'
            )
        except Error as e:
            print(f"数据库连接池初始化失败: {e}")
            self.pool = None

    def get_connection(self):
        if not self.pool:
            self._init_pool()
        
        if not self.pool:
            raise Exception("数据库连接池不可用")
        
        try:
            conn = self.pool.get_connection()
            if conn.is_connected():
                conn.ping(reconnect=True, attempts=3, delay=1)
                return conn
            else:
                conn.close()
        except Error as e:
            print(f"获取数据库连接失败: {e}")
            self.pool = None
            self._init_pool()
        
        raise Exception("无法建立数据库连接")

    def execute_query(self, query, params=None):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(query, params or ())
            result = cursor.fetchall()
            return result
        except Error as e:
            print(f"执行查询失败: {e}")
            raise e
        finally:
            cursor.close()
            conn.close()

    def execute_update(self, query, params=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(query, params or ())
            conn.commit()
            return cursor.rowcount
        except Error as e:
            conn.rollback()
            print(f"执行更新失败: {e}")
            raise e
        finally:
            cursor.close()
            conn.close()

    def execute_insert(self, query, params=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(query, params or ())
            conn.commit()
            return cursor.lastrowid
        except Error as e:
            conn.rollback()
            print(f"执行插入失败: {e}")
            raise e
        finally:
            cursor.close()
            conn.close()

db = Database()

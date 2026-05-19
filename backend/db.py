import sqlite3
import os
from config import Config


class Database:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init()
        return cls._instance

    def _init(self):
        db_path = Config.DB_PATH
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA foreign_keys=ON")

    def execute_query(self, query, params=None):
        cursor = self.conn.cursor()
        try:
            cursor.execute(query, params or ())
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"查询失败: {e}")
            raise e
        finally:
            cursor.close()

    def execute_update(self, query, params=None):
        cursor = self.conn.cursor()
        try:
            cursor.execute(query, params or ())
            self.conn.commit()
            return cursor.rowcount
        except Exception as e:
            self.conn.rollback()
            print(f"更新失败: {e}")
            raise e
        finally:
            cursor.close()

    def execute_insert(self, query, params=None):
        cursor = self.conn.cursor()
        try:
            cursor.execute(query, params or ())
            self.conn.commit()
            return cursor.lastrowid
        except Exception as e:
            self.conn.rollback()
            print(f"插入失败: {e}")
            raise e
        finally:
            cursor.close()


db = Database()

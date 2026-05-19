from db import db

class QuestionModel:
    @staticmethod
    def create_question(laptop_id, user_id, content):
        query = """
            INSERT INTO questions (laptop_id, user_id, content, create_time)
            VALUES (?, ?, ?, datetime('now', 'localtime'))
        """
        return db.execute_insert(query, (laptop_id, user_id, content))
    
    @staticmethod
    def get_questions_by_laptop(laptop_id):
        query = """
            SELECT q.*, u.username, u.level
            FROM questions q
            JOIN users u ON q.user_id = u.user_id
            WHERE q.laptop_id = ?
            ORDER BY q.create_time DESC
        """
        return db.execute_query(query, (laptop_id,))
    
    @staticmethod
    def answer_question(question_id, answer):
        query = "UPDATE questions SET answer = ? WHERE question_id = ?"
        return db.execute_update(query, (answer, question_id))
    
    @staticmethod
    def delete_question(question_id):
        query = "DELETE FROM questions WHERE question_id = ?"
        return db.execute_update(query, (question_id,))

from db import db

class ReviewModel:
    @staticmethod
    def create_review(user_id, laptop_id, overall_score, performance_score, battery_score, experience_score, content, usage_duration):
        query = """
            INSERT INTO reviews (user_id, laptop_id, overall_score, performance_score, 
                                battery_score, experience_score, content, usage_duration, review_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """
        return db.execute_insert(query, (user_id, laptop_id, overall_score, performance_score, 
                                          battery_score, experience_score, content, usage_duration))
    
    @staticmethod
    def get_reviews_by_laptop(laptop_id, page=1, page_size=10):
        offset = (page - 1) * page_size
        query = """
            SELECT r.*, u.username, u.occupation, u.level, u.points
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.laptop_id = %s
            ORDER BY r.review_time DESC
            LIMIT %s OFFSET %s
        """
        return db.execute_query(query, (laptop_id, page_size, offset))
    
    @staticmethod
    def get_laptop_stats(laptop_id):
        query = """
            SELECT 
                COUNT(*) as total,
                AVG(overall_score) as avg_overall,
                AVG(performance_score) as avg_performance,
                AVG(battery_score) as avg_battery,
                AVG(experience_score) as avg_experience
            FROM reviews
            WHERE laptop_id = %s
        """
        result = db.execute_query(query, (laptop_id,))
        return result[0] if result else None
    
    @staticmethod
    def get_user_review(user_id, laptop_id):
        query = "SELECT * FROM reviews WHERE user_id = %s AND laptop_id = %s"
        result = db.execute_query(query, (user_id, laptop_id))
        return result[0] if result else None
    
    @staticmethod
    def update_review(review_id, data):
        fields = []
        values = []
        for key, value in data.items():
            if value is not None:
                fields.append(f"{key} = %s")
                values.append(value)
        if not fields:
            return 0
        values.append(review_id)
        query = f"UPDATE reviews SET {', '.join(fields)} WHERE review_id = %s"
        return db.execute_update(query, tuple(values))
    
    @staticmethod
    def delete_review(review_id):
        query = "DELETE FROM reviews WHERE review_id = %s"
        return db.execute_update(query, (review_id,))

    @staticmethod
    def get_score_distribution(laptop_id):
        query = """
            SELECT overall_score, COUNT(*) as count
            FROM reviews
            WHERE laptop_id = %s
            GROUP BY overall_score
            ORDER BY overall_score
        """
        return db.execute_query(query, (laptop_id,))

    @staticmethod
    def vote_review(review_id, vote_type):
        if vote_type not in ['helpful', 'unhelpful']:
            return 0
        column = "helpful_count" if vote_type == 'helpful' else "unhelpful_count"
        query = f"UPDATE reviews SET {column} = {column} + 1 WHERE review_id = %s"
        return db.execute_update(query, (review_id,))

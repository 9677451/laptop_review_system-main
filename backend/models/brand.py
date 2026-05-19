from db import db

class BrandModel:
    @staticmethod
    def create_brand(brand_name, official_website, headquarters, description, founded_date):
        query = """
            INSERT INTO brands (brand_name, official_website, headquarters, description, founded_date)
            VALUES (?, ?, ?, ?, ?)
        """
        return db.execute_insert(query, (brand_name, official_website, headquarters, description, founded_date))
    
    @staticmethod
    def get_all_brands(keyword=None):
        query = "SELECT * FROM brands WHERE 1=1"
        params = []
        if keyword:
            query += " AND brand_name LIKE ?"
            params.append(f"%{keyword}%")
        query += " ORDER BY brand_name"
        return db.execute_query(query, tuple(params))
    
    @staticmethod
    def get_brand_by_id(brand_id):
        query = "SELECT * FROM brands WHERE brand_id = ?"
        result = db.execute_query(query, (brand_id,))
        return result[0] if result else None
    
    @staticmethod
    def update_brand(brand_id, data):
        fields = []
        values = []
        for key, value in data.items():
            if value is not None:
                fields.append(f"{key} = ?")
                values.append(value)
        if not fields:
            return 0
        values.append(brand_id)
        query = f"UPDATE brands SET {', '.join(fields)} WHERE brand_id = ?"
        return db.execute_update(query, tuple(values))
    
    @staticmethod
    def delete_brand(brand_id):
        query = "DELETE FROM brands WHERE brand_id = ?"
        return db.execute_update(query, (brand_id,))
    
    @staticmethod
    def check_has_laptops(brand_id):
        query = "SELECT COUNT(*) as count FROM laptops WHERE brand_id = ?"
        result = db.execute_query(query, (brand_id,))
        return result[0]['count'] > 0
    
    @staticmethod
    def get_brand_stats():
        query = """
            SELECT b.brand_name, COUNT(l.laptop_id) as laptop_count
            FROM brands b
            LEFT JOIN laptops l ON b.brand_id = l.brand_id
            GROUP BY b.brand_id
        """
        return db.execute_query(query)

from db import db

class LaptopModel:
    @staticmethod
    def create_laptop(model, brand_id, specifications, price, release_date, cpu_type=None, ram_size=None, gpu_type=None, screen_size=None, image_url=None):
        query = """
            INSERT INTO laptops (model, brand_id, specifications, price, release_date, cpu_type, ram_size, gpu_type, screen_size, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        return db.execute_insert(query, (model, brand_id, specifications, price, release_date, cpu_type, ram_size, gpu_type, screen_size, image_url))
    
    @staticmethod
    def get_all_laptops(page=1, page_size=12, brand_id=None, keyword=None, sort_by='newest', min_price=None, max_price=None, cpu_type=None, ram_size=None, gpu_type=None):
        offset = (page - 1) * page_size

        base_from = """
            FROM laptops l
            JOIN brands b ON l.brand_id = b.brand_id
            LEFT JOIN (
                SELECT laptop_id,
                       AVG(overall_score) as avg_score,
                       COUNT(*) as review_count
                FROM reviews
                GROUP BY laptop_id
            ) r_stats ON l.laptop_id = r_stats.laptop_id
            WHERE 1=1
        """
        params = []

        if brand_id:
            base_from += " AND l.brand_id = ?"
            params.append(brand_id)
        if keyword:
            base_from += " AND (l.model LIKE ? OR l.specifications LIKE ?)"
            params.append(f"%{keyword}%")
            params.append(f"%{keyword}%")
        if min_price:
            base_from += " AND l.price >= ?"
            params.append(min_price)
        if max_price:
            base_from += " AND l.price <= ?"
            params.append(max_price)
        if cpu_type:
            base_from += " AND l.cpu_type LIKE ?"
            params.append(f"%{cpu_type}%")
        if ram_size:
            base_from += " AND l.ram_size LIKE ?"
            params.append(f"%{ram_size}%")
        if gpu_type:
            base_from += " AND l.gpu_type LIKE ?"
            params.append(f"%{gpu_type}%")

        # Count query
        count_query = "SELECT COUNT(*) as total " + base_from
        count_result = db.execute_query(count_query, tuple(params))
        total = count_result[0]['total'] if count_result else 0

        data_query = "SELECT l.*, b.brand_name, r_stats.avg_score, r_stats.review_count " + base_from

        if sort_by == 'price_asc':
            data_query += " ORDER BY l.price ASC"
        elif sort_by == 'price_desc':
            data_query += " ORDER BY l.price DESC"
        elif sort_by == 'score_desc':
            data_query += " ORDER BY r_stats.avg_score DESC"
        else:
            data_query += " ORDER BY l.laptop_id DESC"

        data_query += " LIMIT ? OFFSET ?"
        data_params = list(params) + [page_size, offset]

        data = db.execute_query(data_query, tuple(data_params))
        return data, total
    
    @staticmethod
    def get_laptop_by_id(laptop_id):
        query = """
            SELECT l.*, b.brand_name 
            FROM laptops l 
            JOIN brands b ON l.brand_id = b.brand_id 
            WHERE l.laptop_id = ?
        """
        result = db.execute_query(query, (laptop_id,))
        return result[0] if result else None
    
    @staticmethod
    def update_laptop(laptop_id, data):
        fields = []
        values = []
        for key, value in data.items():
            if value is not None:
                fields.append(f"{key} = ?")
                values.append(value)
        if not fields:
            return 0
            
        # 记录价格变动
        if 'price' in data:
            db.execute_update(
                "INSERT INTO price_history (laptop_id, price, change_date) VALUES (?, ?, NOW())",
                (laptop_id, data['price'])
            )
            
        values.append(laptop_id)
        query = f"UPDATE laptops SET {', '.join(fields)} WHERE laptop_id = ?"
        return db.execute_update(query, tuple(values))

    @staticmethod
    def get_price_history(laptop_id):
        query = "SELECT price, strftime('%Y-%m-%d', change_date) as date FROM price_history WHERE laptop_id = ? ORDER BY change_date ASC"
        return db.execute_query(query, (laptop_id,))
    
    @staticmethod
    def delete_laptop(laptop_id):
        query = "DELETE FROM laptops WHERE laptop_id = ?"
        return db.execute_update(query, (laptop_id,))

    @staticmethod
    def get_recommendations(laptop_id, brand_id, limit=4):
        query = """
            SELECT l.*, b.brand_name,
                   r_stats.avg_score
            FROM laptops l
            JOIN brands b ON l.brand_id = b.brand_id
            LEFT JOIN (
                SELECT laptop_id, AVG(overall_score) as avg_score
                FROM reviews
                GROUP BY laptop_id
            ) r_stats ON l.laptop_id = r_stats.laptop_id
            WHERE l.brand_id = ? AND l.laptop_id != ?
            ORDER BY r_stats.avg_score DESC, l.laptop_id DESC
            LIMIT ?
        """
        return db.execute_query(query, (brand_id, laptop_id, limit))

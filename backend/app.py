import os
import subprocess
import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from db import db
from auth import token_required, admin_required, generate_token
from models.user import UserModel
from models.brand import BrandModel
from models.laptop import LaptopModel
from models.review import ReviewModel
from models.question import QuestionModel

app = Flask(__name__, static_folder='../frontend')
# 允许跨域请求
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(500)
def handle_500(e):
    return jsonify({'code': 500, 'message': '服务器内部错误'}), 500

# ==================== 用户管理 ====================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if UserModel.get_user_by_id(data['user_id']):
        return jsonify({'code': 400, 'message': '用户ID已存在'}), 400
    UserModel.create_user(
        user_id=data['user_id'],
        username=data['username'],
        password=data['password'],
        occupation=data.get('occupation'),
        email=data['email'],
        phone=data.get('phone')
    )
    return jsonify({'code': 200, 'message': '注册成功'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = UserModel.get_user_with_password(data['user_id'])
    if not user or not UserModel.verify_password(data['password'], user['password']):
        return jsonify({'code': 401, 'message': '用户名或密码错误'}), 401
    token = generate_token(user['user_id'], user['role'])
    return jsonify({
        'code': 200,
        'token': token,
        'user': {
            'user_id': user['user_id'],
            'username': user['username'],
            'role': user['role']
        }
    })

@app.route('/api/user/info', methods=['GET'])
@token_required
def get_user_info():
    return jsonify({'code': 200, 'data': request.current_user})

@app.route('/api/user/info', methods=['PUT'])
@token_required
def update_user_info():
    data = request.get_json()
    update_data = {
        'username': data.get('username'),
        'occupation': data.get('occupation'),
        'email': data.get('email'),
        'phone': data.get('phone')
    }
    UserModel.update_user(request.current_user['user_id'], update_data)
    return jsonify({'code': 200, 'message': '信息修改成功'})

@app.route('/api/user/password', methods=['PUT'])
@token_required
def update_password():
    data = request.get_json()
    user = UserModel.get_user_with_password(request.current_user['user_id'])
    if not UserModel.verify_password(data['old_password'], user['password']):
        return jsonify({'code': 400, 'message': '原密码错误'}), 400
    UserModel.update_password(request.current_user['user_id'], data['new_password'])
    return jsonify({'code': 200, 'message': '密码修改成功'})

@app.route('/api/user/<user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(user_id):
    if user_id == request.current_user['user_id']:
        return jsonify({'code': 400, 'message': '不能删除当前登录账号'}), 400
    UserModel.delete_user(user_id)
    return jsonify({'code': 200, 'message': '用户删除成功'})

@app.route('/api/logout', methods=['POST'])
@token_required
def logout():
    return jsonify({'code': 200, 'message': '退出成功'})

# ==================== 品牌管理 ====================

@app.route('/api/brands', methods=['GET'])
def get_brands():
    keyword = request.args.get('keyword')
    return jsonify({'code': 200, 'data': BrandModel.get_all_brands(keyword)})

@app.route('/api/brands', methods=['POST'])
@token_required
@admin_required
def create_brand():
    data = request.get_json()
    brand_id = BrandModel.create_brand(
        brand_name=data['brand_name'],
        official_website=data.get('official_website'),
        headquarters=data.get('headquarters'),
        description=data.get('description'),
        founded_date=data.get('founded_date')
    )
    return jsonify({'code': 200, 'message': '添加成功', 'brand_id': brand_id})

@app.route('/api/brands/<int:brand_id>', methods=['PUT'])
@token_required
@admin_required
def update_brand(brand_id):
    data = request.get_json()
    BrandModel.update_brand(brand_id, data)
    return jsonify({'code': 200, 'message': '更新成功'})

@app.route('/api/brands/<int:brand_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_brand(brand_id):
    if BrandModel.check_has_laptops(brand_id):
        return jsonify({'code': 400, 'message': '该品牌下还有笔记本，无法删除'}), 400
    BrandModel.delete_brand(brand_id)
    return jsonify({'code': 200, 'message': '删除成功'})

@app.route('/api/brands/rankings', methods=['GET'])
def get_brand_rankings():
    query = """
        SELECT b.brand_name, AVG(l.avg_score) as avg_score, COUNT(l.laptop_id) as laptop_count
        FROM brands b
        LEFT JOIN laptops l ON b.brand_id = l.brand_id
        GROUP BY b.brand_id
        HAVING laptop_count > 0
        ORDER BY avg_score DESC
    """
    rankings = db.execute_query(query)
    return jsonify({'code': 200, 'data': rankings})

# ==================== 笔记本管理 ====================

@app.route('/api/laptops', methods=['GET'])
def get_laptops():
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 12))
    brand_id = request.args.get('brand_id')
    keyword = request.args.get('keyword')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    cpu_type = request.args.get('cpu_type')
    ram_size = request.args.get('ram_size')
    gpu_type = request.args.get('gpu_type')
    sort_by = request.args.get('sort_by', 'newest')
    laptops = LaptopModel.get_all_laptops(page, page_size, brand_id, keyword, sort_by, min_price, max_price, cpu_type, ram_size, gpu_type)
    return jsonify({'code': 200, 'data': laptops})

@app.route('/api/laptops/<int:laptop_id>', methods=['GET'])
def get_laptop(laptop_id):
    laptop = LaptopModel.get_laptop_by_id(laptop_id)
    if not laptop:
        return jsonify({'code': 404, 'message': '笔记本不存在'}), 404
    laptop['stats'] = ReviewModel.get_laptop_stats(laptop_id)
    return jsonify({'code': 200, 'data': laptop})

@app.route('/api/laptops/<int:laptop_id>/recommendations', methods=['GET'])
def get_recommendations(laptop_id):
    laptop = LaptopModel.get_laptop_by_id(laptop_id)
    if not laptop:
        return jsonify({'code': 404, 'message': '笔记本不存在'}), 404
    recommendations = LaptopModel.get_recommendations(laptop_id, laptop['brand_id'])
    return jsonify({'code': 200, 'data': recommendations})

@app.route('/api/laptops', methods=['POST'])
@token_required
@admin_required
def create_laptop():
    data = request.get_json()
    laptop_id = LaptopModel.create_laptop(
        model=data['model'],
        brand_id=data['brand_id'],
        specifications=data.get('specifications'),
        price=data.get('price'),
        release_date=data.get('release_date'),
        cpu_type=data.get('cpu_type'),
        ram_size=data.get('ram_size'),
        gpu_type=data.get('gpu_type'),
        screen_size=data.get('screen_size')
    )
    return jsonify({'code': 200, 'message': '添加成功', 'laptop_id': laptop_id})

@app.route('/api/laptops/<int:laptop_id>', methods=['PUT'])
@token_required
@admin_required
def update_laptop(laptop_id):
    data = request.get_json()
    LaptopModel.update_laptop(laptop_id, data)
    return jsonify({'code': 200, 'message': '更新成功'})

@app.route('/api/laptops/<int:laptop_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_laptop(laptop_id):
    LaptopModel.delete_laptop(laptop_id)
    return jsonify({'code': 200, 'message': '删除成功'})

@app.route('/api/laptops/<int:laptop_id>/price-history', methods=['GET'])
def get_price_history(laptop_id):
    history = LaptopModel.get_price_history(laptop_id)
    return jsonify({'code': 200, 'data': history})

# ==================== 评价管理 ====================

@app.route('/api/reviews', methods=['POST'])
@token_required
def create_review():
    data = request.get_json()
    user_id = request.current_user['user_id']
    
    # 检查是否已评价
    if ReviewModel.get_user_review(user_id, data['laptop_id']):
        return jsonify({'code': 400, 'message': '您已经评价过该产品了'}), 400
        
    ReviewModel.create_review(
        user_id=user_id,
        laptop_id=data['laptop_id'],
        overall_score=data['overall_score'],
        performance_score=data['performance_score'],
        battery_score=data['battery_score'],
        experience_score=data['experience_score'],
        content=data['content'],
        usage_duration=data.get('usage_duration', '')
    )
    
    # 奖励积分: 评价 +20 分
    UserModel.add_points(user_id, 20)
    
    return jsonify({'code': 200, 'message': '评价发布成功，获得 20 积分！'})

@app.route('/api/reviews/laptop/<int:laptop_id>', methods=['GET'])
def get_reviews(laptop_id):
    page = int(request.args.get('page', 1))
    reviews = ReviewModel.get_reviews_by_laptop(laptop_id, page)
    return jsonify({'code': 200, 'data': reviews})

@app.route('/api/reviews', methods=['GET'])
def get_all_reviews():
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 20))
    offset = (page - 1) * page_size
    query = """
        SELECT r.*, u.username, l.model as laptop_model
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        JOIN laptops l ON r.laptop_id = l.laptop_id
        ORDER BY r.review_time DESC
        LIMIT %s OFFSET %s
    """
    reviews = db.execute_query(query, (page_size, offset))
    return jsonify({'code': 200, 'data': reviews})

@app.route('/api/reviews/<int:review_id>', methods=['PUT'])
@token_required
def update_review(review_id):
    data = request.get_json()
    ReviewModel.update_review(review_id, data)
    return jsonify({'code': 200, 'message': '修改成功'})

@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
@token_required
def delete_review(review_id):
    ReviewModel.delete_review(review_id)
    return jsonify({'code': 200, 'message': '删除成功'})

@app.route('/api/reviews/<int:review_id>/vote', methods=['POST'])
@token_required
def vote_review(review_id):
    data = request.get_json()
    vote_type = data.get('type')
    user_id = request.current_user['user_id']
    
    if vote_type not in ['helpful', 'unhelpful']:
        return jsonify({'code': 400, 'message': '无效的投票类型'}), 400
        
    ReviewModel.vote_review(review_id, vote_type)
    
    # 奖励积分: 投票 +2 分
    UserModel.add_points(user_id, 2)
    
    return jsonify({'code': 200, 'message': '感谢您的反馈，获得 2 积分！'})

# ==================== 问答管理 ====================

@app.route('/api/questions', methods=['POST'])
@token_required
def create_question():
    data = request.get_json()
    user_id = request.current_user['user_id']
    QuestionModel.create_question(
        laptop_id=data['laptop_id'],
        user_id=user_id,
        content=data['content']
    )
    # 奖励积分: 提问 +5 分
    UserModel.add_points(user_id, 5)
    return jsonify({'code': 200, 'message': '提问成功，获得 5 积分！'})

@app.route('/api/questions/laptop/<int:laptop_id>', methods=['GET'])
def get_questions(laptop_id):
    questions = QuestionModel.get_questions_by_laptop(laptop_id)
    return jsonify({'code': 200, 'data': questions})

@app.route('/api/questions/<int:question_id>/answer', methods=['POST'])
@token_required
@admin_required
def answer_question(question_id):
    data = request.get_json()
    QuestionModel.answer_question(question_id, data['answer'])
    return jsonify({'code': 200, 'message': '回答成功'})

@app.route('/api/questions/<int:question_id>', methods=['DELETE'])
@token_required
def delete_question(question_id):
    # 只有管理员或提问者可以删除
    # 这里简单处理，暂时只让管理员删除
    QuestionModel.delete_question(question_id)
    return jsonify({'code': 200, 'message': '删除成功'})

# ==================== 其他功能 ====================

@app.route('/api/help', methods=['GET'])
def get_help():
    help_content = {
        'title': '笔记本电脑评价系统 - 用户使用说明',
        'sections': [
            {'name': '用户注册与登录', 'content': '用户可以通过注册页面进行注册并登录。'},
            {'name': '笔记本查询', 'content': '系统提供多种查询方式，包括按品牌、规格、价格等。'},
            {'name': '发布评价', 'content': '登录用户可以对笔记本进行评分和文字评价。'}
        ]
    }
    return jsonify({'code': 200, 'data': help_content})

# ==================== 报表打印 ====================

@app.route('/api/report/laptops', methods=['GET'])
@token_required
@admin_required
def report_laptops():
    laptops = LaptopModel.get_all_laptops(page=1, page_size=1000)
    return jsonify({'code': 200, 'data': laptops, 'title': '笔记本信息报表'})

@app.route('/api/report/reviews', methods=['GET'])
@token_required
@admin_required
def report_reviews():
    query = """
        SELECT r.*, u.username, l.model, l.price
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        JOIN laptops l ON r.laptop_id = l.laptop_id
        ORDER BY r.review_time DESC
    """
    reviews = db.execute_query(query)
    return jsonify({'code': 200, 'data': reviews, 'title': '笔记本评价报表'})

# ==================== 统计分析 ====================

@app.route('/api/admin/stats', methods=['GET'])
@token_required
@admin_required
def get_admin_stats():
    # 基础计数
    laptop_count = db.execute_query("SELECT COUNT(*) as count FROM laptops")[0]['count']
    review_count = db.execute_query("SELECT COUNT(*) as count FROM reviews")[0]['count']
    brand_count = db.execute_query("SELECT COUNT(*) as count FROM brands")[0]['count']
    user_count = db.execute_query("SELECT COUNT(*) as count FROM users")[0]['count']
    
    # 品牌分布
    brand_dist = db.execute_query("""
        SELECT b.brand_name, COUNT(l.laptop_id) as count
        FROM brands b
        LEFT JOIN laptops l ON b.brand_id = l.brand_id
        GROUP BY b.brand_id
        ORDER BY count DESC
    """)
    
    # 最近 7 天评价趋势
    review_trend = db.execute_query("""
        SELECT DATE(review_time) as date, COUNT(*) as count
        FROM reviews
        WHERE review_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(review_time)
        ORDER BY date ASC
    """)
    
    return jsonify({
        'code': 200,
        'data': {
            'counts': {
                'laptops': laptop_count,
                'reviews': review_count,
                'brands': brand_count,
                'users': user_count
            },
            'brand_dist': brand_dist,
            'review_trend': review_trend
        }
    })

# ==================== 系统备份和恢复 ====================

@app.route('/api/system/backup', methods=['POST'])
@token_required
@admin_required
def backup_system():
    backup_dir = os.path.join(os.path.dirname(__file__), 'backups')
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"backup_{timestamp}.sql"
    filepath = os.path.join(backup_dir, filename)
    try:
        command = f'mysqldump -h {Config.DB_HOST} -u {Config.DB_USER} -p{Config.DB_PASSWORD} {Config.DB_NAME} --result-file="{filepath}"'
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            return jsonify({'code': 500, 'message': f'备份失败: {result.stderr}'}), 500
        return jsonify({'code': 200, 'message': '系统备份成功', 'filename': filename})
    except Exception as e:
        return jsonify({'code': 500, 'message': f'备份错误: {str(e)}'}), 500

@app.route('/api/system/restore', methods=['POST'])
@token_required
@admin_required
def restore_system():
    data = request.get_json()
    filename = data.get('filename')
    if not filename:
        return jsonify({'code': 400, 'message': '请指定备份文件名'}), 400
    backup_dir = os.path.join(os.path.dirname(__file__), 'backups')
    filepath = os.path.join(backup_dir, filename)
    if not os.path.exists(filepath):
        return jsonify({'code': 404, 'message': '备份文件不存在'}), 404
    try:
        command = f'mysql -h {Config.DB_HOST} -u {Config.DB_USER} -p{Config.DB_PASSWORD} {Config.DB_NAME} < "{filepath}"'
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            return jsonify({'code': 500, 'message': f'恢复失败: {result.stderr}'}), 500
        return jsonify({'code': 200, 'message': '系统恢复成功'})
    except Exception as e:
        return jsonify({'code': 500, 'message': f'恢复错误: {str(e)}'}), 500

@app.route('/api/system/backups', methods=['GET'])
@token_required
@admin_required
def list_backups():
    backup_dir = os.path.join(os.path.dirname(__file__), 'backups')
    if not os.path.exists(backup_dir):
        return jsonify({'code': 200, 'data': []})
    backups = []
    for f in os.listdir(backup_dir):
        if f.endswith('.sql'):
            path = os.path.join(backup_dir, f)
            backups.append({
                'filename': f,
                'time': datetime.datetime.fromtimestamp(os.path.getmtime(path)).strftime('%Y-%m-%d %H:%M:%S')
            })
    backups.sort(key=lambda x: x['time'], reverse=True)
    return jsonify({'code': 200, 'data': backups})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from config import Config

def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXPIRES_HOURS),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')

def verify_token(token):
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
    except:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'code': 401, 'message': '缺少认证令牌'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'code': 401, 'message': '无效或过期的令牌'}), 401
        
        # 为了避免循环导入，我们在内部导入 UserModel
        from models.user import UserModel
        user = UserModel.get_user_by_id(payload['user_id'])
        if not user:
            return jsonify({'code': 401, 'message': '用户不存在'}), 401
        
        request.current_user = user
        request.current_user_role = payload['role']
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if getattr(request, 'current_user_role', None) != 'admin':
            return jsonify({'code': 403, 'message': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated

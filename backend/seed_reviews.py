"""
为所有笔记本生成评分和评价数据
"""
import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()

from models.laptop import LaptopModel
from models.review import ReviewModel
from models.user import UserModel
from db import db
import random

# 确保有测试用户
test_user = UserModel.get_user_by_id('testuser')
if not test_user:
    UserModel.create_user(
        user_id='testuser',
        username='笔记本爱好者',
        password='123456',
        occupation='IT工程师',
        email='test@example.com',
        phone='13800138000'
    )
    print('创建测试用户: testuser')

# 创建更多用户用于多样性
extra_users = [
    ('user01', '数码控小明', '学生'),
    ('user02', '程序员老王', 'IT工程师'),
    ('user03', '设计师范范', '设计师'),
    ('user04', '学生小李', '学生'),
    ('user05', '商务人士张总', '企业高管'),
]
for uid, uname, occ in extra_users:
    if not UserModel.get_user_by_id(uid):
        UserModel.create_user(
            user_id=uid, username=uname, password='123456',
            occupation=occ, email=f'{uid}@test.com', phone='13800000000'
        )

# 获取所有笔记本
laptops, _ = LaptopModel.get_all_laptops(page_size=100)

# 评价模板，按笔记本类型生成不同内容
def generate_reviews(laptop):
    brand = laptop.get('brand_name', '')
    model = laptop['model']
    price = float(laptop.get('price', 0))
    cpu = laptop.get('cpu_type', '') or ''
    gpu = laptop.get('gpu_type', '') or ''
    ram = laptop.get('ram_size', '') or ''

    lid = laptop['laptop_id']
    reviews = []

    # 基础分：按价格和配置估算
    base_score = 3.5
    if price > 10000:
        base_score = 4.5
    elif price > 6000:
        base_score = 4.0
    elif price < 4000:
        base_score = 3.5

    # 根据品牌微调
    if '苹果' in brand or 'MacBook' in model:
        base_score = 4.7
    elif 'ThinkPad' in model or 'XPS' in model:
        base_score = 4.3
    elif 'ROG' in model or '拯救者' in model:
        base_score = 4.4
    elif 'MateBook' in model or 'MagicBook' in model:
        base_score = 4.1

    # 评价模板
    templates = [
        {
            'overall': round(base_score + random.uniform(-0.3, 0.5), 1),
            'perf': round(3.5 + random.uniform(0, 1.5), 1),
            'battery': round(3.0 + random.uniform(0, 2), 1),
            'exp': round(3.5 + random.uniform(0, 1.5), 1),
            'content': '整体表现不错，日常办公绰绰有余。屏幕效果满意，键盘手感舒适。散热表现尚可，风扇声音控制得当。',
            'duration': '1-6个月',
            'user': random.choice(['testuser', 'user01', 'user02', 'user03', 'user04', 'user05'])
        },
        {
            'overall': round(base_score + random.uniform(-0.5, 0.3), 1),
            'perf': round(3.8 + random.uniform(0, 1.2), 1),
            'battery': round(3.2 + random.uniform(0, 1.8), 1),
            'exp': round(3.5 + random.uniform(0, 1.5), 1),
            'content': f'{"性能很强" if "i7" in cpu or "i9" in cpu or "RTX" in gpu else "日常使用足够"}，{"游戏体验流畅" if "RTX" in gpu or "游戏" in model else "办公绰绰有余"}。续航方面中规中矩，接口齐全够用。',
            'duration': '6个月-1年',
            'user': random.choice(['testuser', 'user01', 'user02', 'user03', 'user04', 'user05'])
        },
        {
            'overall': round(base_score + random.uniform(-0.4, 0.4), 1),
            'perf': round(3.5 + random.uniform(0, 1.5), 1),
            'battery': round(3.0 + random.uniform(0, 2), 1),
            'exp': round(3.5 + random.uniform(0, 1.5), 1),
            'content': f'做工精致，便携性好。{"屏幕色彩准确" if price > 6000 else "屏幕还算清晰"}。性能释放稳定，{'散热不错' if price > 6000 else '轻度使用不发烫'}。推荐入手。' if random.random() > 0.3 else '性价比还可以，适合预算有限的用户。',
            'duration': '1-3个月',
            'user': random.choice(['testuser', 'user01', 'user02', 'user03', 'user04', 'user05'])
        },
    ]

    # 高端机型多加好评，低端偏向中评
    if price > 10000:
        templates.append({
            'overall': round(base_score + random.uniform(0, 0.3), 1),
            'perf': round(4.0 + random.uniform(0, 1), 1),
            'battery': round(3.5 + random.uniform(0, 1.5), 1),
            'exp': round(4.0 + random.uniform(0, 1), 1),
            'content': '旗舰级体验！做工用料顶级，屏幕素质惊艳，性能完全够用。虽然价格偏高但物有所值。',
            'duration': '1年以上',
            'user': random.choice(['user02', 'user03', 'user05'])
        })

    return templates


# 执行生成
total_added = 0
for laptop in laptops:
    lid = laptop['laptop_id']
    model = laptop['model']
    brand = laptop.get('brand_name', '')

    # 获取已有评价数
    existing = ReviewModel.get_reviews_by_laptop(lid, page_size=50)
    existing_count = len(existing)

    # 每个笔记本总共建立 3-6 条评价
    target = random.randint(3, 6)
    needed = target - existing_count
    if needed <= 0:
        print(f'[{lid}] {model} 已有 {existing_count} 条评价，跳过')
        continue

    reviews_data = generate_reviews(laptop)
    added = 0
    for rd in reviews_data[:needed]:
        score = max(1, min(5, round(rd['overall'])))
        ReviewModel.create_review(
            user_id=rd['user'],
            laptop_id=lid,
            overall_score=score,
            performance_score=max(1, min(5, round(rd['perf']))),
            battery_score=max(1, min(5, round(rd['battery']))),
            experience_score=max(1, min(5, round(rd['exp']))),
            content=rd['content'],
            usage_duration=rd['duration']
        )
        added += 1

    total_added += added
    print(f'[{lid}] {model}: 新增 {added} 条评价 (目标{target})')

print(f'\n完成！共新增 {total_added} 条评价')

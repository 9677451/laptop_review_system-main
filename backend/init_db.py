"""自动建表 + 种子数据，确保部署后即有数据可展示"""
import random
from db import db
from models.user import UserModel
from models.brand import BrandModel
from models.laptop import LaptopModel
from models.review import ReviewModel

_initialized = False


def init_db():
    global _initialized
    if _initialized:
        return
    _initialized = True

    _create_tables()

    # 检查是否已有数据
    existing = db.execute_query("SELECT COUNT(*) as cnt FROM brands")
    if existing and existing[0]['cnt'] > 0:
        print('[init_db] 数据库已有数据，跳过种子数据')
        return

    print('[init_db] 开始灌入种子数据...')
    _seed_brands()
    _seed_laptops()
    _seed_users()
    _seed_reviews()
    print('[init_db] 种子数据完成！')


def _create_tables():
    db.execute_update("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            occupation TEXT DEFAULT '',
            email TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            role TEXT DEFAULT 'user',
            points INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            register_time TEXT DEFAULT (datetime('now','localtime'))
        )
    """)
    db.execute_update("""
        CREATE TABLE IF NOT EXISTS brands (
            brand_id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand_name TEXT NOT NULL,
            official_website TEXT DEFAULT '',
            headquarters TEXT DEFAULT '',
            description TEXT DEFAULT '',
            founded_date TEXT DEFAULT ''
        )
    """)
    db.execute_update("""
        CREATE TABLE IF NOT EXISTS laptops (
            laptop_id INTEGER PRIMARY KEY AUTOINCREMENT,
            model TEXT NOT NULL,
            brand_id INTEGER NOT NULL,
            specifications TEXT DEFAULT '',
            price REAL DEFAULT 0,
            release_date TEXT DEFAULT '',
            cpu_type TEXT DEFAULT '',
            ram_size TEXT DEFAULT '',
            gpu_type TEXT DEFAULT '',
            screen_size TEXT DEFAULT '',
            image_url TEXT DEFAULT ''
        )
    """)
    db.execute_update("""
        CREATE TABLE IF NOT EXISTS reviews (
            review_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            laptop_id INTEGER NOT NULL,
            overall_score REAL DEFAULT 0,
            performance_score REAL DEFAULT 0,
            battery_score REAL DEFAULT 0,
            experience_score REAL DEFAULT 0,
            content TEXT DEFAULT '',
            usage_duration TEXT DEFAULT '',
            review_time TEXT DEFAULT (datetime('now','localtime')),
            helpful_count INTEGER DEFAULT 0,
            unhelpful_count INTEGER DEFAULT 0
        )
    """)
    db.execute_update("""
        CREATE TABLE IF NOT EXISTS questions (
            question_id INTEGER PRIMARY KEY AUTOINCREMENT,
            laptop_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            answer TEXT DEFAULT '',
            create_time TEXT DEFAULT (datetime('now','localtime'))
        )
    """)
    db.execute_update("""
        CREATE TABLE IF NOT EXISTS price_history (
            price_id INTEGER PRIMARY KEY AUTOINCREMENT,
            laptop_id INTEGER NOT NULL,
            price REAL DEFAULT 0,
            change_date TEXT DEFAULT (datetime('now','localtime'))
        )
    """)
    db.execute_update("""
        CREATE TABLE IF NOT EXISTS ai_summaries (
            laptop_id INTEGER PRIMARY KEY,
            summary TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )
    """)


def _seed_brands():
    brands = [
        ('联想', 'https://www.lenovo.com.cn', '中国北京', '全球领先的PC制造商，ThinkPad系列商务本深受好评', '1984'),
        ('戴尔', 'https://www.dell.com.cn', '美国德克萨斯', '以XPS和Alienware闻名，品质可靠', '1984'),
        ('华为', 'https://consumer.huawei.com/cn', '中国深圳', 'MateBook系列做工精致，多屏协同体验出色', '1987'),
        ('苹果', 'https://www.apple.com.cn', '美国加利福尼亚', 'MacBook系列设计一流，M系列芯片性能卓越', '1976'),
        ('华硕', 'https://www.asus.com.cn', '中国台湾', 'ROG游戏本霸主，轻薄本也颇有竞争力', '1989'),
        ('惠普', 'https://www.hp.com/cn', '美国加利福尼亚', '战66和Spectre系列口碑优秀', '1939'),
        ('小米', 'https://www.mi.com', '中国北京', 'RedmiBook性价比突出，生态互联便捷', '2010'),
        ('宏碁', 'https://www.acer.com.cn', '中国台湾', '掠夺者游戏本系列性能强劲，非凡系列轻薄便携', '1976'),
        ('微软', 'https://www.microsoft.com', '美国华盛顿', 'Surface系列二合一设计开创先河', '1975'),
        ('神舟', 'https://www.hasee.com', '中国深圳', '战神系列游戏本配置高价格低，性价比之王', '2001'),
    ]
    for b in brands:
        BrandModel.create_brand(
            brand_name=b[0], official_website=b[1],
            headquarters=b[2], description=b[3], founded_date=b[4]
        )
    print(f'  [brands] 已创建 {len(brands)} 个品牌')


def _seed_laptops():
    laptops = [
        # 联想
        (1, 'ThinkPad X1 Carbon Gen 11', 'i7-1365U/16GB/512GB SSD/14"2.8K OLED', 10999, '2023', 'i7-1365U', '16GB', '集成显卡', '14英寸'),
        (1, '联想 拯救者 Y9000P 2024', 'i9-14900HX/32GB/1TB SSD/RTX4070/16"', 9999, '2024', 'i9-14900HX', '32GB', 'RTX4070', '16英寸'),
        (1, 'ThinkBook 14+ 2024', 'Ultra7-155H/32GB/1TB SSD/14.5"3K', 6499, '2024', 'Ultra7-155H', '32GB', '集成显卡', '14.5英寸'),
        (1, '联想 小新 Pro 16 2024', 'Ultra9-185H/32GB/1TB SSD/16"2.5K', 6999, '2024', 'Ultra9-185H', '32GB', '集成显卡', '16英寸'),
        (1, '联想 YOGA Air 14s', 'R7-7840S/16GB/1TB SSD/14.5"2.9K OLED', 7299, '2024', 'R7-7840S', '16GB', '集成显卡', '14.5英寸'),
        # 戴尔
        (2, 'Dell XPS 15 9530', 'i7-13700H/16GB/512GB SSD/RTX4050/15.6"3.5K OLED', 12999, '2023', 'i7-13700H', '16GB', 'RTX4050', '15.6英寸'),
        (2, 'Dell Inspiron 灵越 16 Plus', 'i7-13700H/16GB/1TB SSD/RTX4060/16"', 8499, '2023', 'i7-13700H', '16GB', 'RTX4060', '16英寸'),
        (2, 'Alienware m18 R2', 'i9-14900HX/32GB/1TB SSD/RTX4080/18"QHD 165Hz', 26999, '2024', 'i9-14900HX', '32GB', 'RTX4080', '18英寸'),
        (2, 'Dell Latitude 5440', 'i5-1345U/16GB/512GB SSD/14"FHD', 7999, '2023', 'i5-1345U', '16GB', '集成显卡', '14英寸'),
        # 华为
        (3, 'HUAWEI MateBook X Pro 2024', 'Ultra9-185H/32GB/2TB SSD/14.2"3.1K OLED', 12999, '2024', 'Ultra9-185H', '32GB', '集成显卡', '14.2英寸'),
        (3, 'HUAWEI MateBook 14 2024', 'Ultra5-125H/16GB/1TB SSD/14"2.8K OLED', 6499, '2024', 'Ultra5-125H', '16GB', '集成显卡', '14英寸'),
        (3, 'HUAWEI MateBook D 16 2024', 'i5-13500H/16GB/1TB SSD/16"FHD', 4999, '2024', 'i5-13500H', '16GB', '集成显卡', '16英寸'),
        (3, 'HUAWEI MateBook 16s 2023', 'i9-13900H/32GB/1TB SSD/16"2.5K', 9299, '2023', 'i9-13900H', '32GB', '集成显卡', '16英寸'),
        # 苹果
        (4, 'MacBook Pro 16" M3 Max', 'M3 Max/36GB/1TB SSD/16"Liquid Retina XDR', 24999, '2023', 'M3 Max', '36GB', '集成GPU', '16英寸'),
        (4, 'MacBook Pro 14" M3 Pro', 'M3 Pro/18GB/512GB SSD/14"Liquid Retina XDR', 16999, '2023', 'M3 Pro', '18GB', '集成GPU', '14英寸'),
        (4, 'MacBook Air 15" M3', 'M3/16GB/512GB SSD/15.3"Liquid Retina', 11999, '2024', 'M3', '16GB', '集成GPU', '15.3英寸'),
        (4, 'MacBook Air 13" M2', 'M2/8GB/256GB SSD/13.6"Liquid Retina', 7999, '2022', 'M2', '8GB', '集成GPU', '13.6英寸'),
        # 华硕
        (5, 'ROG 枪神8 Plus 超竞版', 'i9-14900HX/32GB/2TB SSD/RTX4090/18"2.5K 240Hz', 29999, '2024', 'i9-14900HX', '32GB', 'RTX4090', '18英寸'),
        (5, '华硕 天选5 Pro', 'R9-7940HX/16GB/1TB SSD/RTX4060/16"2.5K 165Hz', 7999, '2024', 'R9-7940HX', '16GB', 'RTX4060', '16英寸'),
        (5, '华硕 灵耀14 2024', 'Ultra7-155H/32GB/1TB SSD/14"2.8K OLED', 7499, '2024', 'Ultra7-155H', '32GB', '集成显卡', '14英寸'),
        (5, 'ROG 幻16 Air', 'Ultra9-185H/32GB/1TB SSD/RTX4070/16"2.5K OLED', 15999, '2024', 'Ultra9-185H', '32GB', 'RTX4070', '16英寸'),
        # 惠普
        (6, '惠普 战99 2024', 'i7-13700H/32GB/1TB SSD/RTX2000 Ada/16"FHD', 10999, '2024', 'i7-13700H', '32GB', 'RTX2000 Ada', '16英寸'),
        (6, '惠普 Spectre x360 14', 'Ultra7-155H/16GB/1TB SSD/14"2.8K OLED', 11999, '2024', 'Ultra7-155H', '16GB', '集成显卡', '14英寸'),
        (6, '惠普 战66 六代 锐龙版', 'R5-7530U/16GB/512GB SSD/14"FHD', 3799, '2023', 'R5-7530U', '16GB', '集成显卡', '14英寸'),
        (6, '惠普 暗影精灵10', 'i7-13650HX/16GB/512GB SSD/RTX4060/16.1"QHD 240Hz', 8499, '2024', 'i7-13650HX', '16GB', 'RTX4060', '16.1英寸'),
        # 小米
        (7, 'RedmiBook Pro 16 2024', 'Ultra7-155H/32GB/1TB SSD/16"3.1K 165Hz', 6499, '2024', 'Ultra7-155H', '32GB', '集成显卡', '16英寸'),
        (7, 'Xiaomi Book Pro 14 2024', 'Ultra5-125H/16GB/512GB SSD/14"2.8K OLED', 5499, '2024', 'Ultra5-125H', '16GB', '集成显卡', '14英寸'),
        (7, 'RedmiBook 14 2024', 'i5-13500H/16GB/512GB SSD/14"2.8K 120Hz', 4199, '2024', 'i5-13500H', '16GB', '集成显卡', '14英寸'),
        # 宏碁
        (8, '宏碁 掠夺者 刀锋 Neo', 'Ultra9-185H/32GB/1TB SSD/RTX4070/16"3.2K 165Hz', 13999, '2024', 'Ultra9-185H', '32GB', 'RTX4070', '16英寸'),
        (8, '宏碁 非凡 Go Pro', 'i5-13500H/16GB/1TB SSD/14"2.8K', 4799, '2024', 'i5-13500H', '16GB', '集成显卡', '14英寸'),
        (8, '宏碁 暗影骑士·擎6', 'i7-13650HX/16GB/512GB SSD/RTX4060/16"QHD 165Hz', 7499, '2024', 'i7-13650HX', '16GB', 'RTX4060', '16英寸'),
        # 微软
        (9, 'Surface Laptop Studio 2', 'i7-13700H/32GB/1TB SSD/RTX4060/14.4"', 19999, '2023', 'i7-13700H', '32GB', 'RTX4060', '14.4英寸'),
        (9, 'Surface Pro 10', 'Ultra7-165U/16GB/512GB SSD/13"PixelSense', 11999, '2024', 'Ultra7-165U', '16GB', '集成显卡', '13英寸'),
        (9, 'Surface Laptop 6', 'Ultra5-135U/16GB/512GB SSD/15"PixelSense', 8999, '2024', 'Ultra5-135U', '16GB', '集成显卡', '15英寸'),
        # 神舟
        (10, '神舟 战神 S8D6', 'i7-12650H/16GB/512GB SSD/RTX4060/15.6"FHD 144Hz', 5499, '2023', 'i7-12650H', '16GB', 'RTX4060', '15.6英寸'),
        (10, '神舟 战神 Z8D6', 'i7-12650H/16GB/1TB SSD/RTX4060/15.6"QHD 165Hz', 6199, '2023', 'i7-12650H', '16GB', 'RTX4060', '15.6英寸'),
        (10, '神舟 战神 TX8R9', 'i9-13900HX/16GB/1TB SSD/RTX4070/16"QHD 165Hz', 7999, '2023', 'i9-13900HX', '16GB', 'RTX4070', '16英寸'),
    ]
    for l in laptops:
        LaptopModel.create_laptop(
            brand_id=l[0], model=l[1], specifications=l[2],
            price=l[3], release_date=l[4], cpu_type=l[5],
            ram_size=l[6], gpu_type=l[7], screen_size=l[8],
        )
    print(f'  [laptops] 已创建 {len(laptops)} 款笔记本')


def _seed_users():
    users = [
        ('admin', '系统管理员', 'admin123', '系统管理', 'admin@test.com', '13800000000', 'admin'),
        ('testuser', '笔记本爱好者', '123456', 'IT工程师', 'test@test.com', '13800138000', 'user'),
        ('user01', '数码控小明', '123456', '大学生', 'user01@test.com', '13900000001', 'user'),
        ('user02', '程序员老王', '123456', '后端开发', 'user02@test.com', '13900000002', 'user'),
        ('user03', '设计师范范', '123456', 'UI设计师', 'user03@test.com', '13900000003', 'user'),
        ('user04', '学生小李', '123456', '研究生', 'user04@test.com', '13900000004', 'user'),
        ('user05', '商务张总', '123456', '企业高管', 'user05@test.com', '13900000005', 'user'),
    ]
    for u in users:
        if not UserModel.get_user_by_id(u[0]):
            UserModel.create_user(
                user_id=u[0], username=u[1], password=u[2],
                occupation=u[3], email=u[4], phone=u[5], role=u[6]
            )
    print(f'  [users] 已创建 {len(users)} 个用户')


def _seed_reviews():
    positive_templates = [
        '整体表现不错，日常办公绰绰有余。屏幕效果满意，键盘手感舒适。',
        '性能很强，运行多个软件也很流畅。散热表现尚可，风扇声音控制得当。',
        '做工精致，便携性好。屏幕色彩准确，看视频体验很棒。推荐入手。',
        '性价比很高的一款笔记本，配置够用，外观时尚，非常满意！',
        '使用一周很满意，开机速度快，续航表现超出预期，值得购买。',
        '外观漂亮轻薄，拿出去很有面子。办公效率提升明显，强烈推荐。',
        '性能释放稳定，散热不错。接口齐全够用，键盘手感优秀。',
        '屏幕素质惊艳，色准色域都很到位，适合设计工作。',
        '游戏体验流畅，高画质无压力，散热系统给力。',
        '续航很给力，一天办公不用充电，非常适合出差使用。',
    ]
    neutral_templates = [
        '中规中矩的表现，对得起这个价位。有些小遗憾但总体可以接受。',
        '性价比还可以，适合预算有限的用户。日常使用足够，别期望太高。',
        '还行吧，基本满足需求。键盘有点偏软，习惯了还好。',
        '整体来说及格线以上，优点是便宜，缺点是做工一般。',
    ]

    laptops, _ = LaptopModel.get_all_laptops(page_size=200)
    user_ids = ['testuser', 'user01', 'user02', 'user03', 'user04', 'user05']
    total = 0

    for laptop in laptops:
        lid = laptop['laptop_id']
        price = float(laptop.get('price', 5000))
        cpu = laptop.get('cpu_type', '') or ''
        gpu = laptop.get('gpu_type', '') or ''

        # 价位决定基础分
        if price > 15000:
            base = 4.4
        elif price > 8000:
            base = 4.1
        elif price > 5000:
            base = 3.8
        else:
            base = 3.5

        # 配置微调
        if 'RTX' in gpu or 'i9' in cpu or 'R9' in cpu:
            base += 0.3
        if 'MacBook' in laptop['model'] or 'ThinkPad' in laptop['model']:
            base += 0.3

        count = random.randint(2, 5)
        for _ in range(count):
            score = round(max(2.0, min(5.0, base + random.uniform(-0.8, 0.8))), 1)
            perf = round(max(1.0, min(5.0, score + random.uniform(-0.5, 0.5))), 1)
            batt = round(max(1.0, min(5.0, score + random.uniform(-1, 0.5))), 1)
            exp = round(max(1.0, min(5.0, score + random.uniform(-0.3, 0.7))), 1)

            if score >= 4.0:
                content = random.choice(positive_templates)
            else:
                content = random.choice(neutral_templates)

            try:
                ReviewModel.create_review(
                    user_id=random.choice(user_ids),
                    laptop_id=lid,
                    overall_score=score,
                    performance_score=perf,
                    battery_score=batt,
                    experience_score=exp,
                    content=content,
                    usage_duration=random.choice(['1-3个月', '3-6个月', '6个月-1年', '1年以上'])
                )
                total += 1
            except Exception:
                pass  # 跳过重复评价

    print(f'  [reviews] 已创建 {total} 条评价')

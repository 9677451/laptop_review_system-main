"""
DeepSeek AI 服务模块
提供聊天推荐、评价摘要、智能选机等功能
"""
import os
import json
import requests
from config import Config


class AIService:
    BASE_URL = None
    API_KEY = None
    _initialized = False

    @classmethod
    def init(cls):
        if cls._initialized:
            return
        cls.BASE_URL = os.getenv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
        cls.API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
        cls._initialized = True

    @classmethod
    def _call(cls, system_prompt, user_message, temperature=0.7, max_tokens=1500):
        cls.init()
        if not cls.API_KEY or cls.API_KEY == 'your_deepseek_api_key_here':
            return {'error': '请先配置 DEEPSEEK_API_KEY'}

        try:
            resp = requests.post(
                f'{cls.BASE_URL}/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {cls.API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'deepseek-chat',
                    'messages': [
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': user_message}
                    ],
                    'temperature': temperature,
                    'max_tokens': max_tokens
                },
                timeout=25
            )
            if resp.status_code == 200:
                data = resp.json()
                return {'reply': data['choices'][0]['message']['content']}
            return {'error': f'API 返回错误: {resp.status_code} - {resp.text[:200]}'}
        except requests.exceptions.Timeout:
            return {'error': 'AI 响应超时，请稍后重试'}
        except Exception as e:
            return {'error': f'AI 服务异常: {str(e)[:100]}'}

    # ==================== 聊天推荐 ====================
    @classmethod
    def chat(cls, user_message, laptop_context=''):
        system = (
            '你是一个专业笔记本电脑推荐助手，名为"笔记本AI顾问"。\n'
            '规则：\n'
            '1. 基于现有的笔记本数据库为用户推荐合适的机型\n'
            '2. 回复风格热情、专业，控制在200字以内\n'
            '3. 推荐时说明理由（性能、价格、适用场景）\n'
            '4. 如果用户没有明确预算和用途，主动询问\n'
            '5. 价格单位是人民币(¥)\n'
        )
        if laptop_context:
            system += f'\n当前数据库中的笔记本信息供参考：\n{laptop_context}'
        return cls._call(system, user_message, temperature=0.8, max_tokens=800)

    # ==================== 评价摘要 ====================
    @classmethod
    def summarize_reviews(cls, laptop_model, reviews_text):
        system = (
            '你是一个专业笔记本评价分析师。\n'
            '请根据用户评价数据生成一段结构化摘要，格式如下：\n\n'
            '【综合判断】一句话总结\n'
            '【优点】\n- 优点1\n- 优点2\n- 优点3\n'
            '【缺点】\n- 缺点1\n- 缺点2\n'
            '【适合人群】一句话\n'
            '【购买建议】一句话\n\n'
            '规则：\n'
            '- 客观公正，不说废话\n'
            '- 如果评价少，不要编造\n'
            '- 控制在200字以内'
        )
        user = f'笔记本型号：{laptop_model}\n\n用户评价内容：\n{reviews_text}'
        return cls._call(system, user, temperature=0.5, max_tokens=600)

    # ==================== 智能推荐 ====================
    @classmethod
    def recommend(cls, preferences, candidates_json):
        """
        preferences: {budget, usage, portability, ...}
        candidates_json: JSON string of candidate laptops from database
        """
        system = (
            '你是一个专业笔记本电脑推荐专家。\n'
            '根据用户的需求和候选机型列表，选出最合适的3款并排序。\n'
            '返回 JSON 格式（不要多余文字）：\n'
            '{"recommendations":[{"laptop_id":1,"reason":"推荐理由","score":95},...],"tips":"选购小贴士"}\n'
            '评分标准：完美匹配=95+，较好匹配=80-94，一般匹配=65-79'
        )
        user = (
            f'用户需求：\n'
            f'- 预算：¥{preferences.get("budget", "不限")}\n'
            f'- 用途：{preferences.get("usage", "日常办公")}\n'
            f'- 便携性要求：{preferences.get("portability", "一般")}\n\n'
            f'候选机型列表：\n{candidates_json}'
        )
        return cls._call(system, user, temperature=0.3, max_tokens=1000)

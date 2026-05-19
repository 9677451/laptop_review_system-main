"""轻量级 IP 限流模块，无需外部依赖"""
import time
import threading
from collections import defaultdict


class RateLimiter:
    """基于 IP 的滑动窗口限流"""

    def __init__(self):
        self._lock = threading.Lock()
        self._windows = defaultdict(list)  # key -> [timestamps]

    def _clean(self, key, window_sec):
        now = time.time()
        cutoff = now - window_sec
        self._windows[key] = [t for t in self._windows[key] if t > cutoff]

    def is_allowed(self, key, max_requests, window_sec):
        with self._lock:
            self._clean(key, window_sec)
            if len(self._windows[key]) >= max_requests:
                return False
            self._windows[key].append(time.time())
            return True

    def remaining(self, key, max_requests, window_sec):
        with self._lock:
            self._clean(key, window_sec)
            return max_requests - len(self._windows[key])


# 全局实例
limiter = RateLimiter()

# 各端点限制配置
ENDPOINT_LIMITS = {
    'ai_chat':      (10, 60),    # 每分钟 10 次
    'ai_summary':   (5,  60),    # 每分钟 5 次（已有缓存）
    'ai_recommend': (5,  60),    # 每分钟 5 次
}


def get_client_ip(request):
    """获取真实客户端 IP，兼容代理（Render/nginx 等）"""
    forwarded = request.headers.get('X-Forwarded-For')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.remote_addr

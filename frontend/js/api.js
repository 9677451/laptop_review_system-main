// 自动根据环境判断 API 基础路径
// 优先使用相对路径 /api，如果是本地开发且不在 5000 端口，则指定端口
const API_BASE_URL = (window.location.port === '5000' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' 
    : '/api'; // 统一使用相对路径，因为后端已经整合了静态文件服务

const api = {
    async request(url, method = 'GET', data = null) {
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        console.log(`📤 请求: ${method} ${url}`);
        console.log(`🔑 Token: ${token ? token.substring(0, 20) + '...' : '无'}`);

        const options = {
            method,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
            console.log('📦 请求数据:', data);
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, options);
            clearTimeout(timeoutId);
            
            console.log(`📥 响应状态: ${response.status}`);
            
            const result = await response.json();
            console.log(`✅ 响应数据:`, result);
            
            if (!response.ok) {
                // 401 特殊处理
                if (response.status === 401) {
                    console.error('❌ 认证失败，token无效');
                    // 清除无效的 token
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    throw new Error('登录已过期，请重新登录');
                }
                throw new Error(result.message || '请求失败');
            }
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('❌ 请求错误:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络或后端状态');
            }
            if (error.message === 'Failed to fetch' || error instanceof TypeError) {
                throw new Error('无法连接到服务器，请确保后端服务已启动且 CORS 配置正确。');
            }
            throw error;
        }
    },

    // Auth - 修改登录方法，增加调试
    async login(credentials) {
        console.log('🔐 尝试登录:', credentials);
        try {
            const result = await this.request('/login', 'POST', credentials);
            
            // 检查并保存 token
            let token = null;
            let userData = null;
            
            // 尝试多种可能的响应格式
            if (result.token) {
                token = result.token;
                userData = result.user;
            } else if (result.data && result.data.token) {
                token = result.data.token;
                userData = result.data.user;
            } else if (result.access_token) {
                token = result.access_token;
                userData = result.user;
            } else {
                console.warn('⚠️ 未找到token字段，完整响应:', result);
                // 如果没有token，尝试从其他字段获取
                token = result.auth_token || result.jwt || result.session_id;
                userData = result.user || result.user_info || result;
            }
            
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData || credentials));
                console.log('✅ Token已保存:', token.substring(0, 20) + '...');
            } else {
                console.error('❌ 登录响应中没有token');
            }
            
            return result;
        } catch (error) {
            console.error('❌ 登录失败:', error);
            throw error;
        }
    },
    
    register(userData) {
        return this.request('/register', 'POST', userData);
    },
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('🚪 已登出，清除token');
        return this.request('/logout', 'POST');
    },

    // User
    getUserInfo() {
        return this.request('/user/info');
    },
    updateUserInfo(data) {
        return this.request('/user/info', 'PUT', data);
    },
    updatePassword(data) {
        return this.request('/user/password', 'PUT', data);
    },
    deleteUser(userId) {
        return this.request(`/user/${userId}`, 'DELETE');
    },

    // Brands
    getBrands(keyword) {
        const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
        return this.request(`/brands${query}`);
    },
    getBrandRankings() {
        return this.request('/brands/rankings');
    },
    createBrand(data) {
        return this.request('/brands', 'POST', data);
    },
    updateBrand(id, data) {
        return this.request(`/brands/${id}`, 'PUT', data);
    },
    deleteBrand(id) {
        return this.request(`/brands/${id}`, 'DELETE');
    },

    // Laptops
    getLaptops(params = {}) {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key]) searchParams.append(key, params[key]);
        });
        return this.request(`/laptops?${searchParams.toString()}`);
    },
    getLaptop(id) {
        return this.request(`/laptops/${id}`);
    },

    getRecommendations(id) {
        return this.request(`/laptops/${id}/recommendations`);
    },

    getPriceHistory(id) {
        return this.request(`/laptops/${id}/price-history`);
    },

    createLaptop(data) {
        return this.request('/laptops', 'POST', data);
    },
    updateLaptop(id, data) {
        return this.request(`/laptops/${id}`, 'PUT', data);
    },
    deleteLaptop(id) {
        return this.request(`/laptops/${id}`, 'DELETE');
    },

    // Reviews
    getReviews(laptopId, page = 1) {
        return this.request(`/reviews/laptop/${laptopId}?page=${page}`);
    },
    getAllReviews(page = 1) {
        return this.request(`/reviews?page=${page}`);
    },
    createReview(data) {
        return this.request('/reviews', 'POST', data);
    },
    updateReview(id, data) {
        return this.request(`/reviews/${id}`, 'PUT', data);
    },
    deleteReview(id) {
        return this.request(`/reviews/${id}`, 'DELETE');
    },
    voteReview(id, type) {
        return this.request(`/reviews/${id}/vote`, 'POST', { type });
    },

    // Q&A
    getQuestions(laptopId) {
        return this.request(`/questions/laptop/${laptopId}`);
    },
    createQuestion(data) {
        return this.request('/questions', 'POST', data);
    },
    answerQuestion(id, answer) {
        return this.request(`/questions/${id}/answer`, 'POST', { answer });
    },
    deleteQuestion(id) {
        return this.request(`/questions/${id}`, 'DELETE');
    },

    // Reports & System
    getLaptopReport() {
        return this.request('/report/laptops');
    },
    getReviewReport() {
        return this.request('/report/reviews');
    },
    getAdminStats() {
        return this.request('/admin/stats');
    },
    getHelp() {
        return this.request('/help');
    },
    backupSystem() {
        return this.request('/system/backup', 'POST');
    },
    restoreSystem(filename) {
        return this.request('/system/restore', 'POST', { filename });
    },
    getBackups() {
        return this.request('/system/backups');
    }
};
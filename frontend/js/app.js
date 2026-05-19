if (typeof Vue === 'undefined') {
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Vue 3 加载失败，请确保网络正常或 CDN 链接可用。</div>';
} else {
    console.log('Vue 3 加载成功');
}

const { createApp, ref, onMounted, watch, computed, nextTick } = Vue;

createApp({
    setup() {
        console.log('App setup 启动...');
        const currentView = ref('home');
        const adminTab = ref('dashboard');
        
        // 安全解析用户信息
        const getStoredUser = () => {
            try {
                const stored = localStorage.getItem('user');
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                localStorage.removeItem('user');
                return null;
            }
        };
        const user = ref(getStoredUser());
        
        const loading = ref(false);
        const backingUp = ref(false);
        const showUserMenu = ref(false);
        const isDarkMode = ref(localStorage.getItem('theme') === 'dark');
        const showBackToTop = ref(false);
        const navScrolled = ref(false);
        const pageProgress = ref(0);

        // Data
        const laptops = ref([]);
        const totalLaptops = ref(0);
        const totalPages = computed(() => Math.ceil(totalLaptops.value / filters.value.page_size));
        const brands = ref([]);
        const brandRankings = ref([]);
        const selectedLaptop = ref(null);
        const priceHistory = ref([]);
        const questions = ref([]);
        const reviews = ref([]);
        const reviewSortBy = ref('newest');
        const sortedReviews = computed(() => {
            const list = [...reviews.value];
            if (reviewSortBy.value === 'helpful') {
                return list.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
            } else if (reviewSortBy.value === 'highest') {
                return list.sort((a, b) => b.overall_score - a.overall_score);
            } else if (reviewSortBy.value === 'lowest') {
                return list.sort((a, b) => a.overall_score - b.overall_score);
            }
            // newest (default) - review_time is already sorted by backend usually, but let's be sure
            return list.sort((a, b) => new Date(b.review_time) - new Date(a.review_time));
        });
        const recommendations = ref([]);
        const aiSummary = ref(null);
        const searchSuggestions = ref([]);
        const helpData = ref(null);
        const laptopReport = ref([]);
        const reviewReport = ref([]);
        const backups = ref([]);
        const adminStats = ref(null);
        const wishlist = ref(JSON.parse(localStorage.getItem('wishlist') || '[]'));
        const priceAlerts = ref(JSON.parse(localStorage.getItem('priceAlerts') || '[]'));
        const allReviews = ref([]);
        const selectedBrand = ref(null);
        const brandLaptops = ref([]);
        const brandStats = ref(null);
        const users = ref([]);

        // 对比功能相关
        const compareList = ref([]);
        const showCompareModal = ref(false);

        // Filters
        const filters = ref({
            keyword: '',
            brand_id: '',
            sort_by: 'newest',
            min_price: null,
            max_price: null,
            cpu_type: '',
            ram_size: '',
            gpu_type: '',
            page: 1,
            page_size: 12
        });

        // Forms
        const loginForm = ref({ user_id: '', password: '' });
        const regForm = ref({ user_id: '', username: '', password: '', email: '', phone: '', occupation: '' });
        const reviewForm = ref({ 
            laptop_id: null,
            overall_score: 5, 
            performance_score: 5, 
            battery_score: 5, 
            experience_score: 5, 
            content: '', 
            usage_duration: '' 
        });
        const questionInput = ref('');

        // Modals
        const showEditProfileModal = ref(false);
        const showChangePwdModal = ref(false);
        const showLaptopModal = ref(false);
        const showBrandModal = ref(false);
        const showReviewModal = ref(false);
        const showUserEditModal = ref(false);

        // Form Data
        const editProfileForm = ref({ username: '', email: '', phone: '', occupation: '' });
        const changePwdForm = ref({ old_password: '', new_password: '', confirm_password: '' });
        const laptopForm = ref({ model: '', brand_id: '', specifications: '', price: 0, release_date: '', cpu_type: '', ram_size: '', gpu_type: '', screen_size: '', image_url: '' });
        const brandForm = ref({ brand_name: '', official_website: '', headquarters: '', description: '', founded_date: '' });
        const userEditForm = ref({ user_id: '', username: '', email: '', phone: '', occupation: '', role: '' });
        const editingId = ref(null);

        // Toast
        const toast = ref({ show: false, message: '', type: 'success' });

        const showToast = (message, type = 'success') => {
            // 移除旧 toast
            const old = document.querySelector('.toast-enhanced');
            if (old) {
                old.classList.add('leaving');
                setTimeout(() => old.remove(), 300);
            }
            // 创建新 toast
            const el = document.createElement('div');
            el.className = `toast-enhanced toast-${type}`;
            const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle' };
            el.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'} mr-2"></i>${message}`;
            document.body.appendChild(el);
            setTimeout(() => {
                el.classList.add('leaving');
                setTimeout(() => el.remove(), 300);
            }, 3000);
            // 同时保持旧的响应式 toast 兼容
            toast.value = { show: true, message, type };
            setTimeout(() => toast.value.show = false, 3000);
        };

        // ========== 辅助函数 ==========
        const fixNumber = (val) => {
            if (val === null || val === undefined || val === '') return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        };

        const initAllCharts = () => {
            try {
                if (selectedLaptop.value?.stats && document.getElementById('scoreRadarChart')) {
                    initRadarChart(selectedLaptop.value.stats);
                }
            } catch (e) { console.error('雷达图初始化失败:', e); }
            try {
                if (priceHistory.value.length > 0 && document.getElementById('priceHistoryChart')) {
                    initPriceChart(priceHistory.value);
                }
            } catch (e) { console.error('价格图初始化失败:', e); }
            try {
                if (selectedLaptop.value && document.getElementById('scoreBarChart')) {
                    initScoreBarChart(selectedLaptop.value.laptop_id);
                }
            } catch (e) { console.error('柱状图初始化失败:', e); }
        };

        const formatScore = (score) => {
            if (score === null || score === undefined || score === '') return '暂无评分';
            const num = Number(score);
            return !isNaN(num) ? num.toFixed(1) : '暂无评分';
        };

        const renderStars = (score) => {
            const num = Math.round(Number(score) || 0);
            let html = '<span class="rainbow-stars">';
            for (let i = 0; i < 5; i++) {
                html += `<i class="star ${i < num ? 'fas fa-star' : 'far fa-star'}" style="font-size:inherit;"></i>`;
            }
            html += '</span>';
            return html;
        };

        // ========== 数据获取函数 ==========
        const fetchBrands = async () => {
            try {
                const res = await api.getBrands();
                let data = res.data;
                if (data && data.data) data = data.data;
                brands.value = Array.isArray(data) ? data : [];
                console.log('获取品牌成功:', brands.value.length, '个品牌');
            } catch (err) {
                console.error('获取品牌失败', err);
                brands.value = [];
            }
        };

        const fetchBrandRankings = async () => {
            try {
                const res = await api.getBrandRankings();
                brandRankings.value = res.data || [];
            } catch (err) {
                console.error('获取品牌排行失败:', err);
            }
        };

        const searchLaptops = async () => {
            if (loading.value) return;
            loading.value = true;
            startProgress();
            try {
                const res = await api.getLaptops(filters.value);
                console.log('API返回原始数据:', res);

                let data = res.data;
                if (data && data.data) data = data.data;
                if (!Array.isArray(data)) data = [];

                // 获取总数
                totalLaptops.value = res.total || data.length;

                // 关键修复：数据类型转换
                laptops.value = data.map(item => ({
                    ...item,
                    price: fixNumber(item.price) || 0,
                    avg_score: fixNumber(item.avg_score),
                    review_count: fixNumber(item.review_count) || 0
                }));

                console.log('获取笔记本列表成功:', laptops.value.length, '条数据');
            } catch (err) {
                console.error('搜索笔记本失败:', err);
                showToast(err.message, 'error');
                laptops.value = [];
                totalLaptops.value = 0;
            } finally {
                loading.value = false;
                finishProgress();
            }
        };

        const fetchQuestions = async (laptopId) => {
            try {
                const res = await api.getQuestions(laptopId);
                questions.value = res.data || [];
            } catch (err) {
                console.error('获取问答失败:', err);
            }
        };

        const submitQuestion = async () => {
            if (!user.value) return showToast('请先登录', 'error');
            if (!questionInput.value) return showToast('请输入问题内容', 'error');
            try {
                await api.createQuestion({
                    laptop_id: selectedLaptop.value.laptop_id,
                    content: questionInput.value
                });
                showToast('提问成功');
                questionInput.value = '';
                fetchQuestions(selectedLaptop.value.laptop_id);
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        const answerQuestion = async (id, answer) => {
            try {
                await api.answerQuestion(id, answer);
                showToast('回答成功');
                fetchQuestions(selectedLaptop.value.laptop_id);
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        const deleteQuestion = async (id) => {
            if (!confirm('确定要删除这个问题吗？')) return;
            try {
                await api.deleteQuestion(id);
                showToast('删除成功');
                fetchQuestions(selectedLaptop.value.laptop_id);
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        const promptAnswer = async (q) => {
            const answer = prompt(`回答 [${q.username}] 的问题: ${q.content}`);
            if (answer) {
                await answerQuestion(q.question_id, answer);
            }
        };

        const showLaptopDetail = async (id) => {
            console.log('正在跳转详情页, ID:', id);

            // 销毁旧图表
            if (radarChart) { radarChart.destroy(); radarChart = null; }
            if (scoreBarChart) { scoreBarChart.destroy(); scoreBarChart = null; }
            if (priceChart) { priceChart.destroy(); priceChart = null; }
            aiSummary.value = null;

            currentView.value = 'detail';
            selectedLaptop.value = null;
            loading.value = true;
            startProgress();
            try {
                const res = await api.getLaptop(id);
                console.log('获取详情响应:', res);
                
                let laptopData = res.data;
                if (laptopData && laptopData.data) laptopData = laptopData.data;
                
                // 数据类型转换
                laptopData.price = fixNumber(laptopData.price) || 0;
                
                // 转换统计数据
                if (laptopData.stats) {
                    const stats = { ...laptopData.stats };
                    Object.keys(stats).forEach(key => {
                        stats[key] = fixNumber(stats[key]);
                    });
                    laptopData.stats = stats;
                }
                
                selectedLaptop.value = laptopData;
                recommendations.value = [];
                
                const reviewRes = await api.getReviews(id);
                let reviewData = reviewRes.data;
                if (reviewData && reviewData.data) reviewData = reviewData.data;
                reviews.value = Array.isArray(reviewData) ? reviewData : [];

                // 调用 AI 摘要
                fetchAISummary(id);
                fetchQuestions(id);

                // 获取推荐和价格历史
                try {
                    const [recRes, priceRes] = await Promise.all([
                        api.getRecommendations(id),
                        api.getPriceHistory(id)
                    ]);
                    
                    recommendations.value = recRes.data || [];
                priceHistory.value = priceRes.data || [];
                
                // 检查降价提醒
                if (isSubscribed(id) && priceHistory.value.length >= 2) {
                    const latest = priceHistory.value[priceHistory.value.length - 1].price;
                    const previous = priceHistory.value[priceHistory.value.length - 2].price;
                    if (latest < previous) {
                        showToast(`好消息！您订阅的机型降价了，现价 ¥${latest}`, 'success');
                    }
                }
                
                } catch (e) {
                    console.error('获取推荐或价格历史失败:', e);
                }
                
                window.scrollTo(0, 0);
            } catch (err) {
                console.error('获取详情失败:', err);
                showToast(err.message, 'error');
                currentView.value = 'home';
            } finally {
                loading.value = false;
                finishProgress();
            }
        };

        const fetchAllReviews = async () => {
            loading.value = true;
            try {
                const res = await api.getAllReviews();
                let data = res.data;
                if (data && data.data) data = data.data;
                allReviews.value = Array.isArray(data) ? data : [];
                console.log('获取全站评价成功:', allReviews.value.length, '条');
            } catch (err) {
                console.error('获取全站评价失败:', err);
                allReviews.value = [];
            } finally {
                loading.value = false;
            }
        };

        const fetchHelp = async () => {
            try {
                const res = await api.getHelp();
                helpData.value = res.data || res;
            } catch (err) {
                console.error('获取帮助失败', err);
            }
        };

        // ========== 认证函数 ==========
        const login = async () => {
            try {
                const res = await api.login(loginForm.value);
                console.log('=== 登录成功，完整响应 ===', res);
                
                // 从 localStorage 读取已保存的用户信息
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    user.value = JSON.parse(storedUser);
                    console.log('✅ 用户信息已加载:', user.value);
                }
                
                showToast('登录成功！');
                currentView.value = 'home';
                loginForm.value = { user_id: '', password: '' };
                
            } catch (err) {
                console.error('❌ 登录失败:', err);
                showToast(err.message, 'error');
            }
        };

        const register = async () => {
            try {
                const res = await api.register(regForm.value);
                console.log('注册响应:', res);
                showToast('注册成功，请登录');
                currentView.value = 'login';
                regForm.value = { user_id: '', username: '', password: '', email: '', phone: '', occupation: '' };
            } catch (err) {
                console.error('注册失败:', err);
                showToast(err.message, 'error');
            }
        };

        const logout = async () => {
            try {
                await api.logout();
            } catch (err) {
                console.log('登出API调用失败:', err);
            }
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            user.value = null;
            showToast('已安全退出');
            currentView.value = 'home';
        };

        // ========== 评价函数 ==========
        const openReviewModal = () => {
            if (!user.value) {
                showToast('请先登录', 'error');
                currentView.value = 'login';
                return;
            }
            
            reviewForm.value = { 
                laptop_id: selectedLaptop.value?.laptop_id,
                overall_score: 5, 
                performance_score: 5, 
                battery_score: 5, 
                experience_score: 5, 
                content: '', 
                usage_duration: '' 
            };
            showReviewModal.value = true;
        };

        const submitReview = async () => {
            try {
                const reviewData = {
                    ...reviewForm.value,
                    laptop_id: selectedLaptop.value?.laptop_id
                };
                
                console.log('提交评价数据:', reviewData);
                
                const res = await api.createReview(reviewData);
                console.log('评价响应:', res);
                
                showToast('评价发布成功！');
                showReviewModal.value = false;
                
                if (selectedLaptop.value) {
                    await showLaptopDetail(selectedLaptop.value.laptop_id);
                }
            } catch (err) {
                console.error('提交评价失败:', err);
                showToast(err.message, 'error');
            }
        };

        const deleteReview = async (id) => {
            if (!confirm('确定要删除这条评价吗？')) return;
            try {
                await api.deleteReview(id);
                showToast('删除成功');
                if (selectedLaptop.value) {
                    showLaptopDetail(selectedLaptop.value.laptop_id);
                }
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        const voteReview = async (review, type) => {
            try {
                const res = await api.voteReview(review.review_id, type);
                showToast(res.message || '感谢您的反馈');
                
                // 本地更新 UI 计数，避免重新拉取
                if (type === 'helpful') {
                    review.helpful_count = (review.helpful_count || 0) + 1;
                } else {
                    review.unhelpful_count = (review.unhelpful_count || 0) + 1;
                }
            } catch (err) {
                console.error('投票失败:', err);
                showToast(err.message, 'error');
            }
        };

        // ========== 个人资料函数 ==========
        const openEditProfile = () => {
            editProfileForm.value = { 
                username: user.value?.username || '',
                email: user.value?.email || '',
                phone: user.value?.phone || '',
                occupation: user.value?.occupation || ''
            };
            showEditProfileModal.value = true;
        };

        const updateProfile = async () => {
            try {
                const res = await api.updateUserInfo(editProfileForm.value);
                console.log('更新资料响应:', res);
                user.value = { ...user.value, ...editProfileForm.value };
                localStorage.setItem('user', JSON.stringify(user.value));
                showToast('个人资料已更新');
                showEditProfileModal.value = false;
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        const changePassword = async () => {
            if (changePwdForm.value.new_password !== changePwdForm.value.confirm_password) {
                return showToast('两次输入的密码不一致', 'error');
            }
            try {
                await api.updatePassword({
                    old_password: changePwdForm.value.old_password,
                    new_password: changePwdForm.value.new_password
                });
                showToast('密码修改成功');
                showChangePwdModal.value = false;
                changePwdForm.value = { old_password: '', new_password: '', confirm_password: '' };
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        // ========== 笔记本管理函数 ==========
        const openAddLaptopModal = () => {
            editingId.value = null;
            laptopForm.value = {
                model: '',
                brand_id: brands.value[0]?.brand_id || '',
                specifications: '',
                price: 0,
                release_date: '',
                cpu_type: '',
                ram_size: '',
                gpu_type: '',
                screen_size: '',
                image_url: ''
            };
            showLaptopModal.value = true;
        };

        const openEditLaptopModal = (laptop) => {
            editingId.value = laptop.laptop_id;
            laptopForm.value = {
                model: laptop.model || '',
                brand_id: laptop.brand_id || '',
                specifications: laptop.specifications || '',
                price: fixNumber(laptop.price) || 0,
                release_date: laptop.release_date || '',
                cpu_type: laptop.cpu_type || '',
                ram_size: laptop.ram_size || '',
                gpu_type: laptop.gpu_type || '',
                screen_size: laptop.screen_size || '',
                image_url: laptop.image_url || ''
            };
            showLaptopModal.value = true;
        };

        const saveLaptop = async () => {
            try {
                const submitData = {
                    ...laptopForm.value,
                    price: fixNumber(laptopForm.value.price) || 0
                };
                
                if (editingId.value) {
                    await api.updateLaptop(editingId.value, submitData);
                    showToast('笔记本信息已更新');
                } else {
                    await api.createLaptop(submitData);
                    showToast('笔记本已添加');
                }
                showLaptopModal.value = false;
                searchLaptops();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        const deleteLaptop = async (id) => {
            if (!confirm('确定要删除这台笔记本吗？此操作不可逆！')) return;
            try {
                await api.deleteLaptop(id);
                showToast('已删除笔记本');
                searchLaptops();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        // ========== 品牌管理函数 ==========
        const openAddBrandModal = () => {
            editingId.value = null;
            brandForm.value = { 
                brand_name: '', 
                official_website: '', 
                headquarters: '', 
                description: '', 
                founded_date: '' 
            };
            showBrandModal.value = true;
        };

        const openEditBrandModal = (brand) => {
            editingId.value = brand.brand_id;
            brandForm.value = { 
                brand_name: brand.brand_name || '',
                official_website: brand.official_website || '',
                headquarters: brand.headquarters || '',
                description: brand.description || '',
                founded_date: brand.founded_date || ''
            };
            showBrandModal.value = true;
        };

        const saveBrand = async () => {
            try {
                if (editingId.value) {
                    await api.updateBrand(editingId.value, brandForm.value);
                    showToast('品牌信息已更新');
                } else {
                    await api.createBrand(brandForm.value);
                    showToast('品牌已添加');
                }
                showBrandModal.value = false;
                fetchBrands();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        const deleteBrand = async (id) => {
            if (!confirm('确定要删除这个品牌吗？')) return;
            try {
                await api.deleteBrand(id);
                showToast('已删除品牌');
                fetchBrands();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        // ========== 系统管理函数 ==========
        const fetchReports = async () => {
            console.log('📊 开始获取报表数据...');
            try {
                const lRes = await api.getLaptopReport();
                console.log('笔记本报表响应:', lRes);
                
                let laptopData = lRes.data;
                if (laptopData && laptopData.data) laptopData = laptopData.data;
                laptopReport.value = Array.isArray(laptopData) ? laptopData : [];
                
                const rRes = await api.getReviewReport();
                console.log('评价报表响应:', rRes);
                
                let reviewData = rRes.data;
                if (reviewData && reviewData.data) reviewData = reviewData.data;
                reviewReport.value = Array.isArray(reviewData) ? reviewData : [];
                
                console.log('✅ 报表数据获取成功，笔记本:', laptopReport.value.length, '条，评价:', reviewReport.value.length, '条');
            } catch (err) {
                console.error('❌ 获取报表失败:', err);
                
                if (err.message.includes('令牌') || err.message.includes('登录')) {
                    showToast('请先登录管理员账号', 'error');
                }
                
                // 使用模拟数据作为后备
                laptopReport.value = [
                    { laptop_id: 1, model: 'ThinkPad X1', brand_name: '联想', price: 8999, avg_score: 4.5, review_count: 23 },
                    { laptop_id: 2, model: 'MacBook Pro', brand_name: '苹果', price: 14999, avg_score: 4.8, review_count: 45 },
                    { laptop_id: 3, model: 'XPS 13', brand_name: '戴尔', price: 13999, avg_score: 4.6, review_count: 18 }
                ];
                reviewReport.value = [
                    { review_id: 1, username: '用户A', model: 'ThinkPad X1', overall_score: 5, content: '性能强劲，散热好', review_time: '2024-01-15' },
                    { review_id: 2, username: '用户B', model: 'MacBook Pro', overall_score: 4, content: '屏幕出色，系统流畅', review_time: '2024-01-14' },
                    { review_id: 3, username: '用户C', model: 'XPS 13', overall_score: 4.5, content: '轻薄便携，续航优秀', review_time: '2024-01-13' }
                ];
                console.log('⚠️ 使用模拟数据');
            }
        };

        const fetchBackups = async () => {
            try {
                const res = await api.getBackups();
                let data = res.data;
                if (data && data.data) data = data.data;
                backups.value = Array.isArray(data) ? data : [];
                console.log('获取备份列表成功:', backups.value.length, '个备份');
            } catch (err) {
                console.error('获取备份失败', err);
                backups.value = [];
            }
        };

        const fetchAdminStats = async () => {
            try {
                const res = await api.getAdminStats();
                adminStats.value = res.data;
                console.log('获取系统统计成功:', adminStats.value);
                
                // 延迟初始化图表
                setTimeout(() => {
                    initAdminCharts();
                }, 100);
            } catch (err) {
                console.error('获取统计失败', err);
            }
        };

        let brandChart = null;
        let trendChart = null;

        const initAdminCharts = () => {
            const brandCtx = document.getElementById('brandDistChart');
            const trendCtx = document.getElementById('reviewTrendChart');
            
            if (brandCtx && adminStats.value?.brand_dist) {
                if (brandChart) brandChart.destroy();
                brandChart = new Chart(brandCtx, {
                    type: 'doughnut',
                    data: {
                        labels: adminStats.value.brand_dist.map(b => b.brand_name),
                        datasets: [{
                            data: adminStats.value.brand_dist.map(b => b.count),
                            backgroundColor: [
                                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: isDarkMode.value ? '#94a3b8' : '#64748b' } }
                        }
                    }
                });
            }

            if (trendCtx && adminStats.value?.review_trend) {
                if (trendChart) trendChart.destroy();
                trendChart = new Chart(trendCtx, {
                    type: 'line',
                    data: {
                        labels: adminStats.value.review_trend.map(t => t.date),
                        datasets: [{
                            label: '每日评价数',
                            data: adminStats.value.review_trend.map(t => t.count),
                            borderColor: '#3b82f6',
                            tension: 0.4,
                            fill: true,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                ticks: { stepSize: 1, color: isDarkMode.value ? '#94a3b8' : '#64748b' },
                                grid: { color: isDarkMode.value ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                            },
                            x: { 
                                ticks: { color: isDarkMode.value ? '#94a3b8' : '#64748b' },
                                grid: { display: false }
                            }
                        },
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        };

        const backupSystem = async () => {
            backingUp.value = true;
            try {
                await api.backupSystem();
                showToast('系统备份成功');
                fetchBackups();
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                backingUp.value = false;
            }
        };

        const restoreSystem = async (filename) => {
            if (!confirm(`确定要将系统恢复到备份 [${filename}] 吗？当前数据将被覆盖！`)) return;
            try {
                await api.restoreSystem(filename);
                showToast('系统数据恢复成功');
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        // ========== 用户管理函数（管理员） ==========
        const fetchUsers = async () => {
            loading.value = true;
            try {
                const res = await api.getUsers();
                let data = res.data;
                if (data && data.data) data = data.data;
                users.value = Array.isArray(data) ? data : [];
                console.log('获取用户列表成功:', users.value.length, '个用户');
            } catch (err) {
                console.error('获取用户列表失败:', err);
                users.value = [];
            } finally {
                loading.value = false;
            }
        };

        const openUserEditModal = (u) => {
            userEditForm.value = {
                user_id: u.user_id,
                username: u.username || '',
                email: u.email || '',
                phone: u.phone || '',
                occupation: u.occupation || '',
                role: u.role || 'user'
            };
            showUserEditModal.value = true;
        };

        const saveUserEdit = async () => {
            try {
                await api.adminUpdateUser(userEditForm.value.user_id, {
                    username: userEditForm.value.username,
                    email: userEditForm.value.email,
                    phone: userEditForm.value.phone,
                    occupation: userEditForm.value.occupation,
                    role: userEditForm.value.role
                });
                showToast('用户信息已更新');
                showUserEditModal.value = false;
                fetchUsers();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        const adminDeleteUser = async (userId) => {
            if (!confirm(`确定要删除用户 [${userId}] 吗？该操作不可逆！`)) return;
            try {
                await api.deleteUser(userId);
                showToast('用户已删除');
                fetchUsers();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        const showBuyingGuide = ref(false);
        const guideStep = ref(1);
        const guideAnswers = ref({ budget: 5000, usage: 'office', portability: 'medium' });
        const guideResult = ref(null);
        const guideResults = ref([]);
        const guideAIReason = ref('');
        const guideAITips = ref('');

        const findGuideLaptop = async () => {
            loading.value = true;
            guideAIReason.value = '';
            guideAITips.value = '';
            try {
                const res = await api.aiRecommend({
                    budget: guideAnswers.value.budget,
                    usage: guideAnswers.value.usage,
                    portability: guideAnswers.value.portability
                });
                if (res.code === 200 && res.data) {
                    const aiData = res.data;
                    guideAITips.value = aiData.tips || '';
                    const recs = aiData.recommendations || [];
                    if (recs.length > 0) {
                        const ids = recs.map(r => r.laptop_id);
                        const allRes = await api.getLaptops({ page_size: 50, sort_by: 'score_desc' });
                        let allData = allRes.data;
                        if (allData && allData.data) allData = allData.data;
                        const allLaptops = Array.isArray(allData) ? allData : [];
                        guideResults.value = recs.map(r => {
                            const match = allLaptops.find(l => l.laptop_id === r.laptop_id);
                            return { ...(match || {}), ai_reason: r.reason, ai_score: r.score };
                        }).filter(r => r.laptop_id);
                        guideResult.value = guideResults.value[0] || null;
                    } else {
                        const fb = await api.getLaptops({ max_price: guideAnswers.value.budget, sort_by: 'score_desc', page_size: 4 });
                        let fbData = fb.data;
                        if (fbData && fbData.data) fbData = fbData.data;
                        guideResults.value = Array.isArray(fbData) ? fbData : [];
                        guideResult.value = guideResults.value[0] || null;
                    }
                }
                guideStep.value = 4;
            } catch (e) {
                console.error('AI推荐失败:', e);
                try {
                    const fb = await api.getLaptops({ max_price: guideAnswers.value.budget, sort_by: 'score_desc', page_size: 4 });
                    let fbData = fb.data;
                    if (fbData && fbData.data) fbData = fbData.data;
                    guideResults.value = Array.isArray(fbData) ? fbData : [];
                    guideResult.value = guideResults.value[0] || null;
                    guideStep.value = 4;
                } catch (e2) {
                    showToast('没找到合适的推荐，请调整预算', 'error');
                }
            } finally {
                loading.value = false;
            }
        };

        // ========== 收藏夹功能 ==========
        const toggleWishlist = (laptop, event) => {
            const index = wishlist.value.findIndex(item => item.laptop_id === laptop.laptop_id);
            if (index > -1) {
                wishlist.value.splice(index, 1);
                showToast('已从收藏夹移除');
            } else {
                wishlist.value.push({
                    laptop_id: laptop.laptop_id,
                    model: laptop.model,
                    brand_name: laptop.brand_name,
                    price: laptop.price,
                    avg_score: laptop.avg_score
                });
                showToast('已加入收藏夹', 'success');
                // 触发爱心爆发动画
                if (event && event.currentTarget) {
                    createHeartBurst(event.currentTarget);
                }
            }
            localStorage.setItem('wishlist', JSON.stringify(wishlist.value));
        };

        const isInWishlist = (id) => {
            return wishlist.value.some(item => item.laptop_id === id);
        };

        // ========== 价格订阅功能 ==========
        const togglePriceAlert = (laptop) => {
            const index = priceAlerts.value.findIndex(id => id === laptop.laptop_id);
            if (index > -1) {
                priceAlerts.value.splice(index, 1);
                showToast('已取消价格订阅');
            } else {
                priceAlerts.value.push(laptop.laptop_id);
                showToast('订阅成功！价格下调时将通知您', 'success');
            }
            localStorage.setItem('priceAlerts', JSON.stringify(priceAlerts.value));
        };

        const isSubscribed = (id) => {
            return priceAlerts.value.includes(id);
        };

        // ========== 对比功能 ==========
        const toggleCompare = (laptop) => {
            const index = compareList.value.findIndex(item => item.laptop_id === laptop.laptop_id);
            if (index > -1) {
                compareList.value.splice(index, 1);
            } else {
                if (compareList.value.length >= 4) {
                    return showToast('最多只能对比 4 款产品', 'error');
                }
                compareList.value.push(laptop);
            }
        };

        const isInCompare = (id) => {
            return compareList.value.some(item => item.laptop_id === id);
        };

        const checkDiff = (field) => {
            if (compareList.value.length < 2) return false;
            const firstVal = compareList.value[0][field];
            return compareList.value.some(item => item[field] !== firstVal);
        };

        // ========== 图表功能 ==========
        let radarChart = null;
        let scoreBarChart = null;
        const initRadarChart = (stats) => {
            const ctx = document.getElementById('scoreRadarChart');
            if (!ctx) return;

            if (radarChart) {
                radarChart.destroy();
            }

            const data = {
                labels: ['综合', '性能', '续航', '体验'],
                datasets: [{
                    label: '评分',
                    data: [
                        fixNumber(stats.avg_overall) || 0,
                        fixNumber(stats.avg_performance) || 0,
                        fixNumber(stats.avg_battery) || 0,
                        fixNumber(stats.avg_experience) || 0
                    ],
                    fill: true,
                    backgroundColor: isDarkMode.value ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                    borderColor: isDarkMode.value ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                    pointBackgroundColor: isDarkMode.value ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: isDarkMode.value ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)'
                }]
            };

            const config = {
                type: 'radar',
                data: data,
                options: {
                    scales: {
                        r: {
                            angleLines: { color: isDarkMode.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                            grid: { color: isDarkMode.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                            pointLabels: { color: isDarkMode.value ? '#94a3b8' : '#64748b' },
                            suggestedMin: 0,
                            suggestedMax: 5,
                            ticks: { stepSize: 1, display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    },
                    maintainAspectRatio: false
                }
            };

            radarChart = new Chart(ctx, config);
        };

        const initScoreBarChart = async (laptopId) => {
            const ctx = document.getElementById('scoreBarChart');
            if (!ctx) return;

            try {
                const res = await api.getScoreDistribution(laptopId);
                let dist = res.data;
                if (dist && dist.data) dist = dist.data;
                if (!Array.isArray(dist)) dist = [];

                const fullDist = [0, 0, 0, 0, 0]; // 1-5分
                dist.forEach(d => {
                    const score = parseInt(d.overall_score);
                    if (score >= 1 && score <= 5) {
                        fullDist[score - 1] = d.count;
                    }
                });

                if (scoreBarChart) scoreBarChart.destroy();

                scoreBarChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['1分', '2分', '3分', '4分', '5分'],
                        datasets: [{
                            data: fullDist,
                            backgroundColor: [
                                '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'
                            ],
                            borderRadius: 6,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1, color: isDarkMode.value ? '#94a3b8' : '#64748b' },
                                grid: { color: isDarkMode.value ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                            },
                            x: {
                                ticks: { color: isDarkMode.value ? '#94a3b8' : '#64748b' },
                                grid: { display: false }
                            }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            } catch (e) {
                console.error('获取评分分布失败:', e);
            }
        };

        let priceChart = null;
        const initPriceChart = (history) => {
            const ctx = document.getElementById('priceHistoryChart');
            if (!ctx) return;

            if (priceChart) {
                priceChart.destroy();
            }

            // 计算趋势线（简单线性回归）
            const prices = history.map(h => h.price);
            const n = prices.length;
            let trendData = [];
            if (n >= 2) {
                const indices = prices.map((_, i) => i);
                const meanX = indices.reduce((a, b) => a + b, 0) / n;
                const meanY = prices.reduce((a, b) => a + b, 0) / n;
                const slope = indices.reduce((s, x, i) => s + (x - meanX) * (prices[i] - meanY), 0) /
                              indices.reduce((s, x) => s + (x - meanX) ** 2, 0);
                const intercept = meanY - slope * meanX;
                // 预测未来2个点
                const lastIdx = n - 1;
                trendData = [
                    { x: history[0].date, y: Math.round(intercept) },
                    { x: history[lastIdx].date, y: Math.round(slope * lastIdx + intercept) },
                ];
            }

            const datasets = [{
                label: '价格走势',
                data: history.map(h => h.price),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#ef4444',
                fill: true,
                tension: 0.1
            }];

            // 添加趋势线
            if (trendData.length === 2) {
                const isDown = trendData[1].y < trendData[0].y;
                datasets.push({
                    label: '趋势预测',
                    data: trendData.map(d => d.y),
                    borderColor: isDown ? '#10b981' : '#f59e0b',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [6, 3],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                });
            }

            priceChart = new Chart(ctx, {
                type: 'line',
                data: { labels: history.map(h => h.date), datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: { color: isDarkMode.value ? '#94a3b8' : '#64748b' },
                            grid: { color: isDarkMode.value ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            ticks: { color: isDarkMode.value ? '#94a3b8' : '#64748b' },
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        };

        const fetchAISummary = async (laptopId) => {
            aiSummary.value = null;
            try {
                const res = await api.aiSummary(laptopId);
                if (res.code === 200 && res.data && res.data.summary) {
                    const text = res.data.summary;
                    // 解析AI返回的结构化文本
                    const lines = text.split('\n').filter(l => l.trim());
                    let summary = '', pros = [], cons = [], tips = '';
                    let section = '';

                    for (const line of lines) {
                        const clean = line.replace(/^[-*\s]+/, '').trim();
                        if (clean.includes('【综合判断】') || clean.includes('摘要')) {
                            section = 'summary';
                            summary = clean.replace(/【综合判断】|摘要[：:]?/, '').trim();
                        } else if (clean.includes('【优点】') || clean.includes('优势')) {
                            section = 'pros';
                        } else if (clean.includes('【缺点】') || clean.includes('劣势') || clean.includes('改进')) {
                            section = 'cons';
                        } else if (clean.includes('【适合人群】') || clean.includes('适合')) {
                            section = 'tips';
                            tips = clean.replace(/【适合人群】|适合人群[：:]?/, '').trim();
                        } else if (clean.includes('【购买建议】')) {
                            tips += ' | ' + clean.replace(/【购买建议】|购买建议[：:]?/, '').trim();
                        } else if (section === 'pros' && clean) {
                            pros.push(clean);
                        } else if (section === 'cons' && clean) {
                            cons.push(clean);
                        }
                    }

                    if (!summary) summary = text.substring(0, 100);
                    if (pros.length === 0) pros = ['AI暂未提取到优点'];
                    if (cons.length === 0) cons = ['AI暂未提取到缺点'];

                    aiSummary.value = {
                        summary: summary + (tips ? ' ' + tips : ''),
                        pros: pros.slice(0, 4),
                        cons: cons.slice(0, 3)
                    };
                }
            } catch (err) {
                console.error('AI摘要获取失败:', err);
                // 降级到本地生成
                aiSummary.value = generateLocalSummary(reviews.value);
            }
        };

        const generateLocalSummary = (reviewsList) => {
            if (!reviewsList || reviewsList.length === 0) return null;
            const allContent = reviewsList.map(r => r.content).join(' ');
            const avgScore = reviewsList.reduce((acc, r) => acc + r.overall_score, 0) / reviewsList.length;
            const pros = [], cons = [];
            if (avgScore >= 4.5) pros.push('用户口碑极佳');
            if (allContent.includes('快') || allContent.includes('性能')) pros.push('运行速度快，性能强劲');
            if (allContent.includes('轻') || allContent.includes('便携')) pros.push('轻薄便携，适合移动办公');
            if (allContent.includes('续航') || allContent.includes('电池')) pros.push('续航能力得到用户认可');
            if (allContent.includes('屏幕') || allContent.includes('画质')) pros.push('屏幕显示效果细腻');
            if (avgScore < 3.5) cons.push('综合评分偏低，建议谨慎考虑');
            if (allContent.includes('热') || allContent.includes('烫')) cons.push('散热表现有待提升');
            if (allContent.includes('响') || allContent.includes('噪音')) cons.push('风扇噪音相对明显');
            if (pros.length === 0) pros.push('性能稳定，满足日常需求');
            if (cons.length === 0) cons.push('暂无明显缺点反馈');
            return {
                summary: `根据 ${reviewsList.length} 位用户的评价，综合表现${avgScore >= 4 ? '非常优秀' : '较为均衡'}。`,
                pros: pros.slice(0, 3),
                cons: cons.slice(0, 2)
            };
        };

        // ========== 其他函数 ==========
        const toggleDarkMode = () => {
            isDarkMode.value = !isDarkMode.value;
            localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
            if (isDarkMode.value) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            // 重新初始化所有图表以适配颜色
            initAllCharts();
        };

        const resetFilters = () => {
            filters.value = {
                keyword: '',
                brand_id: '',
                sort_by: 'newest',
                min_price: null,
                max_price: null,
                cpu_type: '',
                ram_size: '',
                gpu_type: '',
                page: 1,
                page_size: 12
            };
            searchLaptops();
        };

        const showBrandDetail = async (brandId) => {
            currentView.value = 'brandDetail';
            selectedBrand.value = null;
            brandLaptops.value = [];
            brandStats.value = null;
            loading.value = true;
            try {
                const res = await api.getBrandDetail(brandId);
                let data = res.data;
                if (data && data.data) data = data.data;
                if (data) {
                    selectedBrand.value = data.brand;
                    brandLaptops.value = (data.laptops || []).map(item => ({
                        ...item,
                        price: fixNumber(item.price) || 0,
                        avg_score: fixNumber(item.avg_score),
                        review_count: fixNumber(item.review_count) || 0
                    }));
                    brandStats.value = data.stats;
                }
                window.scrollTo(0, 0);
            } catch (err) {
                console.error('获取品牌详情失败:', err);
                showToast(err.message, 'error');
            } finally {
                loading.value = false;
            }
        };

        const goToHome = () => {
            currentView.value = 'home';
            if (laptops.value.length === 0) {
                searchLaptops();
            }
        };

        const prevPage = () => {
            if (filters.value.page > 1) {
                filters.value.page--;
                searchLaptops();
            }
        };
        
        const nextPage = () => {
            filters.value.page++;
            searchLaptops();
        };

        const exportCSV = (filename, rows) => {
            if (!rows.length) {
                showToast('没有数据可导出', 'warning');
                return;
            }
            const BOM = '﻿';
            const headers = Object.keys(rows[0]);
            const csvContent = BOM + [
                headers.join(','),
                ...rows.map(row =>
                    headers.map(h => {
                        let val = row[h];
                        if (val === null || val === undefined) return '';
                        val = String(val).replace(/"/g, '""');
                        return /[,"\n\r]/.test(val) ? `"${val}"` : val;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
            showToast('导出成功');
        };

        const downloadLaptopReport = () => {
            const rows = laptopReport.value.map(l => ({
                '型号': l.model || '',
                '品牌': l.brand_name || '',
                '价格': l.price || 0,
                'CPU': l.cpu_type || '',
                '内存(G)': l.ram_size || '',
                '显卡': l.gpu_type || '',
                '屏幕(英寸)': l.screen_size || '',
                '平均评分': l.avg_score ? Number(l.avg_score).toFixed(1) : '',
                '评价数': l.review_count || 0,
                '发布日期': l.release_date || ''
            }));
            const date = new Date().toISOString().slice(0, 10);
            exportCSV(`笔记本报表_${date}.csv`, rows);
        };

        const downloadReviewReport = () => {
            const rows = reviewReport.value.map(r => ({
                '用户名': r.username || '',
                '笔记本型号': r.model || '',
                '综合评分': r.overall_score || '',
                '性能评分': r.performance_score || '',
                '续航评分': r.battery_score || '',
                '体验评分': r.experience_score || '',
                '评价内容': r.content || '',
                '评价时间': r.review_time || ''
            }));
            const date = new Date().toISOString().slice(0, 10);
            exportCSV(`评价报表_${date}.csv`, rows);
        };

        // 刷新当前管理标签页
        const refreshCurrentTab = () => {
            console.log('🔄 刷新当前标签:', adminTab.value);
            switch (adminTab.value) {
                case 'dashboard':
                    fetchAdminStats();
                    break;
                case 'laptops':
                    searchLaptops();
                    break;
                case 'brands':
                    fetchBrands();
                    break;
                case 'reviews':
                case 'reports':
                    fetchReports();
                    break;
                case 'system':
                    fetchBackups();
                    break;
                case 'users':
                    fetchUsers();
                    break;
            }
            showToast('刷新成功');
        };

        // ========== Watchers ==========
        watch(() => filters.value.keyword, async (newVal) => {
            if (!newVal || newVal.length < 2) {
                searchSuggestions.value = [];
                return;
            }
            try {
                // 复用搜索接口获取联想词
                const res = await api.getLaptops({ keyword: newVal, page_size: 5 });
                let data = res.data;
                if (data && data.data) data = data.data;
                searchSuggestions.value = Array.isArray(data) ? data : [];
            } catch (e) {
                console.error('联想失败:', e);
            }
        });

        watch(adminTab, (newTab, oldTab) => {
            console.log(`📑 管理标签切换: ${oldTab} -> ${newTab}`);
            
            if (newTab === 'dashboard') {
                fetchAdminStats();
            }
            if (newTab === 'reports') {
                fetchReports();
            }
            if (newTab === 'system') {
                fetchBackups();
            }
            if (newTab === 'reviews') {
                fetchReports();
            }
            if (newTab === 'users') {
                fetchUsers();
            }
        });

        // 监听笔记本数据变化，自动绘制图表
        watch(selectedLaptop, (laptop) => {
            if (laptop && currentView.value === 'detail') {
                nextTick(() => {
                    setTimeout(() => initAllCharts(), 200);
                });
            }
        });

        watch(currentView, (newView) => {
            console.log(`📄 页面切换: ${newView}`);
            
            if (newView === 'help') fetchHelp();
            if (newView === 'brands') {
                fetchBrands();
                fetchBrandRankings();
            }
            if (newView === 'reviews') fetchAllReviews();
            if (newView === 'home' && laptops.value.length === 0) {
                searchLaptops();
            }
            if (newView === 'admin' && adminTab.value === 'dashboard') {
                fetchAdminStats();
            }
            if (newView === 'admin' && adminTab.value === 'reports') {
                fetchReports();
            }
            if (newView === 'admin' && adminTab.value === 'system') {
                fetchBackups();
            }
        });

        // ========== 滚动处理 ==========
        const handleScroll = () => {
            const scrollY = window.scrollY;
            showBackToTop.value = scrollY > 500;
            navScrolled.value = scrollY > 50;
        };

        const scrollToTop = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // ========== 爱心粒子爆发 ==========
        const createHeartBurst = (el) => {
            el.classList.add('heart-burst');
            setTimeout(() => el.classList.remove('heart-burst'), 600);

            const colors = ['#ef4444', '#f97316', '#fbbf24', '#ec4899', '#8b5cf6'];
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            for (let i = 0; i < 10; i++) {
                const particle = document.createElement('div');
                particle.className = 'heart-particle';
                particle.style.cssText = `
                    left: ${cx}px;
                    top: ${cy}px;
                    background: ${colors[i % colors.length]};
                    --tx: ${(Math.random() - 0.5) * 60}px;
                    --ty: ${(Math.random() - 0.5) * 60}px;
                    position: fixed;
                    z-index: 9999;
                `;
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 700);
            }
        };

        // ========== 波纹点击效果 ==========
        const createRipple = (e, el) => {
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            const rect = el.getBoundingClientRect();
            ripple.style.left = e.clientX - rect.left + 'px';
            ripple.style.top = e.clientY - rect.top + 'px';
            el.style.position = 'relative';
            el.style.overflow = 'hidden';
            el.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        };

        // ========== 滚动显示观察器 ==========
        const observeReveal = () => {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('revealed');
                        }
                    });
                },
                { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
            );

            document.querySelectorAll('.reveal-on-scroll').forEach(el => {
                observer.observe(el);
            });
        };

        // ========== 数字递增动画 ==========
        const animateCount = (el, target, duration = 800) => {
            const start = 0;
            const startTime = performance.now();
            const isFloat = String(target).includes('.');
            const decimals = isFloat ? String(target).split('.')[1].length : 0;

            const update = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = start + (target - start) * eased;
                el.textContent = isFloat ? current.toFixed(decimals) : Math.round(current);
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    el.textContent = isFloat ? target.toFixed(decimals) : target;
                }
            };
            requestAnimationFrame(update);
        };

        // ========== 进度条 ==========
        let nprogressTimer = null;
        const startProgress = () => {
            pageProgress.value = 0;
            const bar = document.getElementById('nprogressBar');
            const steps = [20, 50, 75, 90];
            steps.forEach((val, i) => {
                nprogressTimer = setTimeout(() => {
                    pageProgress.value = val;
                    if (bar) bar.style.width = val + '%';
                }, (i + 1) * 100);
            });
        };

        const finishProgress = () => {
            if (nprogressTimer) clearTimeout(nprogressTimer);
            pageProgress.value = 100;
            const bar = document.getElementById('nprogressBar');
            if (bar) bar.style.width = '100%';
            setTimeout(() => {
                pageProgress.value = 0;
                if (bar) bar.style.width = '0%';
            }, 400);
        };

        // ========== Lifecycle ==========
        onMounted(() => {
            if (isDarkMode.value) {
                document.documentElement.classList.add('dark');
            }

            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (token && storedUser) {
                console.log('用户已登录:', JSON.parse(storedUser));
            }

            fetchBrands();
            searchLaptops();

            // 滚动监听
            window.addEventListener('scroll', handleScroll, { passive: true });

            // 点击外部关闭用户菜单
            window.addEventListener('click', (e) => {
                if (!e.target || !e.target.closest || !e.target.closest('.relative')) {
                    showUserMenu.value = false;
                }
            });

            // 初始观察滚动显示元素
            setTimeout(observeReveal, 100);
        });

        // ========== Return ==========
        return {
            // State
            currentView, adminTab, user, loading, backingUp, showUserMenu, isDarkMode, showBackToTop, navScrolled, pageProgress,
            laptops, totalLaptops, totalPages, brands, brandRankings, selectedLaptop, reviews, sortedReviews, reviewSortBy, recommendations, aiSummary, searchSuggestions, helpData, laptopReport, reviewReport, backups, allReviews, adminStats, priceHistory, wishlist, questions, users, selectedBrand, brandLaptops, brandStats,
            filters, loginForm, regForm, reviewForm, questionInput,
            showReviewModal, toast, showBuyingGuide, guideStep, guideAnswers, guideResult, guideResults, guideAIReason, guideAITips,
            showEditProfileModal, showChangePwdModal, showLaptopModal, showBrandModal, showUserEditModal,
            editProfileForm, changePwdForm, laptopForm, brandForm, userEditForm, editingId,
            compareList, showCompareModal,
            
            // Methods
            searchLaptops, resetFilters, showLaptopDetail, showBrandDetail, goToHome, toggleDarkMode,
            login, register, logout,
            openReviewModal, submitReview, deleteReview, voteReview, findGuideLaptop,
            submitQuestion, answerQuestion, deleteQuestion, promptAnswer,
            backupSystem, restoreSystem,
            prevPage, nextPage,
            openEditProfile, updateProfile, changePassword,
            openAddLaptopModal, openEditLaptopModal, saveLaptop, deleteLaptop,
            openAddBrandModal, openEditBrandModal, saveBrand, deleteBrand,
            downloadLaptopReport, downloadReviewReport,
            refreshCurrentTab, toggleCompare, isInCompare, toggleWishlist, isInWishlist, checkDiff, togglePriceAlert, isSubscribed,
            fetchUsers, openUserEditModal, saveUserEdit, adminDeleteUser,
            
            // Helpers
            formatScore, fixNumber, renderStars,
            scrollToTop, createHeartBurst, createRipple, animateCount,
            startProgress, finishProgress
        };
    }
}).mount('#app');
"""Apply all UI enhancements to index.html and verify div balance."""
import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

def count_divs(text):
    opens = len(re.findall(r'<div\b', text))
    closes = len(re.findall(r'</div>', text))
    return opens, closes

original_opens, original_closes = count_divs(content)
print(f'Original: opens={original_opens}, closes={original_closes}, balance={original_opens - original_closes}')

changes_applied = 0

# ============ CHANGE 1: Body class ============
old = '<body class="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 transition-colors duration-300">'
new = '<body class="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 dark-transition">'
if old in content:
    content = content.replace(old, new, 1)
    changes_applied += 1
    print('Change 1: Body class updated')

# ============ CHANGE 2: Add background and top elements before #app ============
old = '    <div id="app" v-cloak>'
new = '''    <!-- 动态背景 -->
    <div class="fixed inset-0 z-[-1] pointer-events-none">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/10 dark:via-dark-bg dark:to-purple-950/10" style="animation: meshMove 15s ease-in-out infinite;"></div>
    </div>
    <!-- 加载进度条 -->
    <div class="nprogress-bar" :style="{ width: pageProgress + '%', opacity: pageProgress > 0 && pageProgress < 100 ? 1 : 0 }"></div>
    <!-- 回到顶部按钮 -->
    <button class="back-to-top" :class="{ visible: showBackToTop }" @click="scrollToTop" title="回到顶部">
        <i class="fas fa-chevron-up"></i>
    </button>
    <div id="app" v-cloak>'''
if old in content:
    content = content.replace(old, new, 1)
    changes_applied += 1
    print('Change 2: Background and top elements added')

# ============ CHANGE 3: Navbar scroll class ============
old = '<nav class="bg-white shadow-md sticky top-0 z-50 dark:bg-dark-card dark:border-b dark:border-dark-border">'
new = '<nav class="bg-white shadow-md sticky top-0 z-50 dark:bg-dark-card dark:border-b dark:border-dark-border transition-all duration-300" :class="{ \'nav-scrolled\': navScrolled }">'
if old in content:
    content = content.replace(old, new, 1)
    changes_applied += 1
    print('Change 3: Navbar scroll class added')

# ============ CHANGE 4: Page-enter wrapper ============
old = '''        <main class="container mx-auto px-4 py-8 min-h-[calc(100vh-200px)]">

            <!-- 1. 首页'''
new = '''        <main class="container mx-auto px-4 py-8 min-h-[calc(100vh-200px)]">
            <div :key="currentView" class="page-enter">

            <!-- 1. 首页'''
if old in content:
    content = content.replace(old, new, 1)
    changes_applied += 1
    print('Change 4: Page-enter wrapper added')

# ============ CHANGE 5: Close page-enter before </main> ============
# Find the last </div> before </main>
old = '            </div>\n        </main>'
new = '            </div>\n            </div>\n        </main>'
# Only replace the LAST occurrence
idx = content.rfind(old)
if idx != -1:
    content = content[:idx] + new + content[idx + len(old):]
    changes_applied += 1
    print('Change 5: Page-enter close added')

# ============ CHANGE 6: Hero banner (replace homepage header) ============
old_hero = '''            <!-- 1. 首页 (笔记本列表 + 搜索) -->
            <div v-if="currentView === 'home'">
                <div class="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-6 mb-8">
                    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">发现您的下一台完美笔记本</h2>
                        <button @click="showBuyingGuide = true; guideStep = 1" class="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center mt-2 md:mt-0">
                            <i class="fas fa-magic mr-1.5"></i> 帮我挑选
                        </button>
                    </div>'''

new_hero = '''            <!-- 1. 首页 (笔记本列表 + 搜索) -->
            <div v-if="currentView === 'home'">
                <!-- 首页 Hero Banner -->
                <div class="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 pattern-dots p-8 md:p-12 text-white">
                    <div class="orb orb-1"></div>
                    <div class="orb orb-2"></div>
                    <div class="orb orb-3"></div>
                    <div class="sparkle" style="top:15%;left:10%;--dur:3s;--delay:0s;"></div>
                    <div class="sparkle" style="top:25%;left:25%;--dur:4s;--delay:0.8s;"></div>
                    <div class="sparkle" style="top:10%;left:60%;--dur:3.5s;--delay:1.6s;"></div>
                    <div class="sparkle" style="top:30%;left:75%;--dur:2.8s;--delay:0.4s;"></div>
                    <div class="sparkle" style="top:50%;left:85%;--dur:4.2s;--delay:2s;"></div>
                    <div class="sparkle" style="top:70%;left:15%;--dur:3.3s;--delay:1.2s;"></div>
                    <div class="sparkle" style="top:60%;left:50%;--dur:3.8s;--delay:0.6s;"></div>
                    <div class="sparkle" style="top:80%;left:70%;--dur:2.5s;--delay:2.5s;"></div>
                    <div class="text-center mb-4">
                        <div class="inline-flex items-center space-x-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm border border-white/10 breathe">
                            <i class="fas fa-sparkles text-yellow-300"></i>
                            <span class="text-blue-50">专业笔记本电脑评测平台</span>
                        </div>
                    </div>
                    <h1 class="relative z-10 text-4xl md:text-6xl font-black mb-4 leading-tight text-center">
                        发现您的<span class="text-yellow-300">下一台</span>完美笔记本
                    </h1>
                    <p class="relative z-10 text-blue-100 text-lg text-center max-w-2xl mx-auto mb-8">权威评测 · 真实用户评价 · 智能推荐，助您做出最佳选择</p>
                    <div class="relative z-10 flex justify-center">
                        <button @click="showBuyingGuide = true; guideStep = 1"
                            class="glow-pulse px-8 py-4 bg-white text-blue-700 font-black rounded-2xl hover:bg-yellow-300 hover:text-blue-900 transition-all duration-300 shadow-2xl hover:shadow-yellow-500/30 flex items-center space-x-2 group">
                            <i class="fas fa-magic group-hover:rotate-12 transition-transform"></i>
                            <span>智能选机助手</span>
                            <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                        </button>
                    </div>
                    <div class="relative z-10 grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/10">
                        <div class="text-center">
                            <div class="text-3xl font-black">{{ totalLaptops || 16 }}</div>
                            <div class="text-xs text-blue-200">收录机型</div>
                        </div>
                        <div class="text-center border-x border-white/10">
                            <div class="text-3xl font-black">{{ brands.length || 6 }}</div>
                            <div class="text-xs text-blue-200">合作品牌</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-black">10+</div>
                            <div class="text-xs text-blue-200">真实评测</div>
                        </div>
                    </div>
                </div>

                <!-- 波浪分隔线 -->
                <div class="wave-container mb-8 -mt-2">
                    <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style="height:40px;">
                        <path d="M0,30 C150,50 350,10 600,30 C850,50 1050,10 1200,30 L1200,60 L0,60 Z" fill="rgb(59 130 246 / 0.08)"/>
                        <path d="M0,40 C200,20 400,50 600,40 C800,30 1000,50 1200,40 L1200,60 L0,60 Z" fill="rgb(99 102 241 / 0.05)"/>
                    </svg>
                </div>

                <div class="bg-white dark:bg-dark-card rounded-3xl shadow-float border border-gray-100 dark:border-dark-border p-6 md:p-8 mb-8">
                    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                            <i class="fas fa-search text-blue-500 mr-3"></i>筛选查找
                        </h2>
                        <button @click="showBuyingGuide = true; guideStep = 1" class="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center mt-2 md:mt-0 group">
                            <i class="fas fa-magic mr-1.5 group-hover:rotate-12 transition-transform"></i> 帮我挑选
                        </button>
                    </div>'''

if old_hero in content:
    content = content.replace(old_hero, new_hero, 1)
    changes_applied += 1
    print('Change 6: Hero banner added')

# ============ CHANGE 7: Filter chips classes ============
for item in ['cpu', 'ram', 'gpu']:
    old_chip = f'<button v-for="{item} in'
    # These are already in the template, no structural change needed for the CSS classes
# Wait, the filter chip changes were mainly CSS class changes (adding filter-chip class).
# Let me skip these inline changes for now since they just add CSS class names.
# The filter chips already work, we just need the CSS to match.

# ============ CHANGE 8: Skeleton loading cards ============
old_skeleton = '''                <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div v-for="i in 8" :key="i" class="bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-dark-border animate-pulse">
                        <div class="h-48 bg-gray-200 dark:bg-dark-bg"></div>
                        <div class="p-5 space-y-4">
                            <div class="h-6 bg-gray-200 dark:bg-dark-bg rounded w-3/4"></div>
                            <div class="space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-dark-bg rounded w-full"></div>
                                <div class="h-4 bg-gray-200 dark:bg-dark-bg rounded w-5/6"></div>
                            </div>
                            <div class="flex justify-between items-center pt-2">
                                <div class="h-8 bg-gray-200 dark:bg-dark-bg rounded w-24"></div>
                                <div class="h-6 bg-gray-200 dark:bg-dark-bg rounded w-16"></div>
                            </div>
                        </div>
                    </div>
                </div>'''

new_skeleton = '''                <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div v-for="i in 8" :key="i" class="bg-white dark:bg-dark-card rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-dark-border">
                        <div class="h-52 skeleton-shimmer"></div>
                        <div class="p-5 space-y-3">
                            <div class="h-5 skeleton-shimmer rounded-lg w-3/4"></div>
                            <div class="space-y-2">
                                <div class="h-3 skeleton-shimmer rounded-lg w-full"></div>
                                <div class="h-3 skeleton-shimmer rounded-lg w-5/6"></div>
                            </div>
                            <div class="flex justify-between items-center pt-2">
                                <div class="h-7 skeleton-shimmer rounded-lg w-20"></div>
                                <div class="h-5 skeleton-shimmer rounded-lg w-12"></div>
                            </div>
                        </div>
                    </div>
                </div>'''

if old_skeleton in content:
    content = content.replace(old_skeleton, new_skeleton, 1)
    changes_applied += 1
    print('Change 8: Skeleton loading updated')

# ============ CHANGE 9: Empty state ============
old_empty = '''                <div v-else-if="laptops.length === 0" class="text-center py-20">
                    <i class="fas fa-box-open text-gray-300 dark:text-gray-600 text-6xl mb-4 empty-state-icon"></i>
                    <p class="text-gray-500 dark:text-gray-400 text-lg">没有找到符合条件的笔记本</p>
                </div>'''

new_empty = '''                <div v-else-if="laptops.length === 0" class="text-center py-20">
                    <div class="w-28 h-28 bg-gray-100 dark:bg-dark-card rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-search text-gray-300 dark:text-gray-600 text-5xl empty-state-icon"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">没有找到符合条件的笔记本</h3>
                    <p class="text-gray-400 mb-6">试试调整筛选条件或更换关键词吧</p>
                    <button @click="resetFilters" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 dark:shadow-none">
                        <i class="fas fa-undo mr-2"></i>重置筛选
                    </button>
                </div>'''

if old_empty in content:
    content = content.replace(old_empty, new_empty, 1)
    changes_applied += 1
    print('Change 9: Empty state updated')

# ============ CHANGE 10: Laptop cards ============
old_card = '''                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-list">
                    <div v-for="laptop in laptops" :key="laptop.laptop_id" @click="showLaptopDetail(laptop.laptop_id)"
                        class="laptop-card bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/20 cursor-pointer border border-gray-100 dark:border-dark-border group">
                        <div class="h-48 bg-gray-100 dark:bg-dark-bg relative overflow-hidden laptop-img-container">
                            <div class="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-700">
                                <i class="fas fa-laptop text-7xl opacity-50"></i>
                            </div>
                            <div class="absolute top-4 left-4 bg-white/90 dark:bg-dark-card/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                                {{ laptop.brand_name }}
                            </div>
                            <div class="absolute top-4 right-4 flex flex-col space-y-2">
                                <button @click.stop="toggleCompare(laptop)"
                                    class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm"
                                    :class="isInCompare(laptop.laptop_id) ? 'bg-blue-600 text-white' : 'bg-white/90 dark:bg-dark-card/90 text-gray-400 hover:text-blue-600'">
                                    <i class="fas fa-columns"></i>
                                </button>
                                <button @click.stop="toggleWishlist(laptop)"
                                    class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm"
                                    :class="isInWishlist(laptop.laptop_id) ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-dark-card/90 text-gray-400 hover:text-red-500'">
                                    <i class="fas fa-heart"></i>
                                </button>
                            </div>
                        </div>
                        <div class="p-5">
                            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ laptop.model }}</h3>
                            <p class="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{{ laptop.specifications }}</p>
                            <div class="flex justify-between items-center mt-auto">
                                <span class="text-xl font-black text-red-500">¥{{ laptop.price }}</span>
                                <div class="flex items-center space-x-1">
                                    <i class="fas fa-star text-yellow-400 text-sm"></i>
                                    <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{ formatScore(laptop.avg_score) }}</span>
                                    <span class="text-xs text-gray-400">({{ laptop.review_count || 0 }})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>'''

new_card = '''                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-list">
                    <div v-for="laptop in laptops" :key="laptop.laptop_id" @click="showLaptopDetail(laptop.laptop_id)"
                        class="laptop-card shimmer-border group bg-white dark:bg-dark-card rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl dark:hover:shadow-blue-900/20 cursor-pointer border border-gray-100 dark:border-dark-border">
                        <div class="h-52 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <i class="fas fa-laptop text-7xl text-blue-400/30 dark:text-blue-300/20 group-hover:scale-110 transition-transform duration-500"></i>
                            </div>
                            <div class="absolute top-3 left-3 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-black text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 shadow-sm">
                                {{ laptop.cpu_type || 'N/A' }}
                            </div>
                            <div class="absolute top-3 right-16 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                                {{ laptop.brand_name }}
                            </div>
                            <div class="absolute top-3 right-3 flex flex-col space-y-1.5">
                                <button @click.stop="toggleCompare(laptop)"
                                    class="w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-300 shadow-sm"
                                    :class="isInCompare(laptop.laptop_id) ? 'bg-blue-600 text-white scale-110' : 'bg-white/80 dark:bg-dark-card/80 text-gray-400 hover:text-blue-600 hover:scale-110'">
                                    <i class="fas fa-columns text-xs"></i>
                                </button>
                                <button @click.stop="toggleWishlist(laptop, $event)"
                                    class="w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-300 shadow-sm"
                                    :class="isInWishlist(laptop.laptop_id) ? 'bg-red-500 text-white scale-110 shadow-red-500/50' : 'bg-white/80 dark:bg-dark-card/80 text-gray-400 hover:text-red-500 hover:scale-110'">
                                    <i class="fas fa-heart text-xs"></i>
                                </button>
                            </div>
                            <div class="absolute bottom-3 left-3 flex flex-wrap gap-1">
                                <span v-if="laptop.ram_size" class="text-[9px] px-2 py-0.5 bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm rounded-lg font-bold text-gray-600 dark:text-gray-300">{{ laptop.ram_size }}G</span>
                                <span v-if="laptop.gpu_type" class="text-[9px] px-2 py-0.5 bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm rounded-lg font-bold text-gray-600 dark:text-gray-300">{{ laptop.gpu_type }}</span>
                            </div>
                            <div class="absolute bottom-3 right-3">
                                <span class="text-lg font-black text-white bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-xl shadow-lg">¥{{ laptop.price }}</span>
                            </div>
                        </div>
                        <div class="p-5">
                            <h3 class="text-[15px] font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{{ laptop.model }}</h3>
                            <p class="text-gray-400 dark:text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">{{ laptop.specifications }}</p>
                            <div class="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-dark-border">
                                <div class="flex items-center space-x-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                                    <i class="fas fa-star text-amber-500 text-xs"></i>
                                    <span class="text-sm font-black text-gray-700 dark:text-gray-200">{{ formatScore(laptop.avg_score) }}</span>
                                    <span class="text-[10px] text-gray-400 ml-0.5">({{ laptop.review_count || 0 }})</span>
                                </div>
                                <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg"><i class="fas fa-tag mr-0.5"></i>详情</span>
                            </div>
                        </div>
                    </div>
                </div>'''

if old_card in content:
    content = content.replace(old_card, new_card, 1)
    changes_applied += 1
    print('Change 10: Laptop cards redesigned')

# ============ CHANGE 11: Pagination ============
old_pagination = '''                <!-- 分页 -->
                <div v-if="laptops.length > 0" class="mt-12 flex justify-center space-x-2">
                    <button @click="prevPage" :disabled="filters.page === 1" class="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-white dark:hover:bg-dark-card disabled:opacity-50 disabled:hover:bg-transparent transition-colors">上一页</button>
                    <span class="px-4 py-2 font-medium">第 {{ filters.page }} 页</span>
                    <button @click="nextPage" :disabled="laptops.length < filters.page_size" class="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-white dark:hover:bg-dark-card disabled:opacity-50 disabled:hover:bg-transparent transition-colors">下一页</button>
                </div>'''

new_pagination = '''                <!-- 分页 -->
                <div v-if="laptops.length > 0" class="mt-12 flex justify-center items-center space-x-2">
                    <button @click="prevPage" :disabled="filters.page === 1"
                        class="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-white dark:hover:bg-dark-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium">
                        <i class="fas fa-chevron-left mr-1"></i>上一页
                    </button>
                    <template v-for="p in totalPages" :key="p">
                        <button v-if="p === 1 || p === totalPages || Math.abs(p - filters.page) <= 2"
                            @click="filters.page = p; searchLaptops()"
                            class="w-10 h-10 rounded-lg font-bold transition-all"
                            :class="filters.page === p ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-white dark:hover:bg-dark-card border border-gray-200 dark:border-dark-border'">
                            {{ p }}
                        </button>
                        <span v-else-if="Math.abs(p - filters.page) === 3" class="px-1 text-gray-300">...</span>
                    </template>
                    <button @click="nextPage" :disabled="filters.page >= totalPages"
                        class="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border hover:bg-white dark:hover:bg-dark-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium">
                        下一页<i class="fas fa-chevron-right ml-1"></i>
                    </button>
                    <span class="ml-4 text-sm text-gray-400">共 {{ totalLaptops }} 款产品</span>
                </div>'''

if old_pagination in content:
    content = content.replace(old_pagination, new_pagination, 1)
    changes_applied += 1
    print('Change 11: Pagination updated')

print(f'\nTotal changes applied: {changes_applied}')

# Verify div balance
final_opens, final_closes = count_divs(content)
print(f'Final: opens={final_opens}, closes={final_closes}, balance={final_opens - final_closes}')

if final_opens == final_closes:
    print('SUCCESS: Divs are balanced!')
    with open('frontend/index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('File written successfully.')
else:
    print('WARNING: Divs not balanced! File NOT written.')
" 2>&1
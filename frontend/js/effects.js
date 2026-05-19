/**
 * 笔记本电脑评价系统 - 动画美术效果引擎
 * 包含: 粒子网络、光标聚光灯、磁吸按钮、3D倾斜卡片、打字动画、
 *       渐变拖尾、浮动光球、滚动揭示、页面过渡
 */
(function () {
    'use strict';

    // ==================== 粒子网络画布 ====================
    const ParticleNetwork = {
        canvas: null,
        ctx: null,
        particles: [],
        mouse: { x: -1000, y: -1000 },
        width: 0,
        height: 0,

        init() {
            this.canvas = document.getElementById('particleCanvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.createParticles();
            this.bindEvents();
            this.animate();
        },

        resize() {
            this.width = window.innerWidth;
            this.height = document.documentElement.scrollHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        },

        createParticles() {
            const count = Math.min(Math.floor((this.width * this.height) / 18000), 120);
            this.particles = [];
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    r: Math.random() * 1.8 + 0.6,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        },

        bindEvents() {
            window.addEventListener('resize', () => {
                this.resize();
                this.createParticles();
            });
            document.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY + window.scrollY;
            });
            document.addEventListener('mouseleave', () => {
                this.mouse.x = -1000;
                this.mouse.y = -1000;
            });
        },

        animate() {
            if (!this.ctx) return;
            const ctx = this.ctx;
            const isDark = document.documentElement.classList.contains('dark');

            ctx.clearRect(0, 0, this.width, this.height);

            const lineColor = isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(59, 130, 246, 0.06)';
            const dotColor = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(59, 130, 246, 0.2)';
            const maxDist = 130;

            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];

                // 更新位置
                p.x += p.vx;
                p.y += p.vy;

                // 边界回弹
                if (p.x < 0 || p.x > this.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.height) p.vy *= -1;

                // 鼠标交互
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150;
                    p.vx -= (dx / dist) * force * 0.02;
                    p.vy -= (dy / dist) * force * 0.02;
                }

                // 绘制粒子
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = dotColor;
                ctx.fill();

                // 连线
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dx2 = p.x - p2.x;
                    const dy2 = p.y - p2.y;
                    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    if (dist2 < maxDist) {
                        const alpha = (1 - dist2 / maxDist) * 0.25;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = isDark
                            ? `rgba(148, 163, 184, ${alpha})`
                            : `rgba(59, 130, 246, ${alpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(() => this.animate());
        }
    };

    // ==================== 光标聚光灯 ====================
    const CursorSpotlight = {
        el: null,
        ticking: false,
        x: 0,
        y: 0,

        init() {
            this.el = document.getElementById('cursorSpotlight');
            if (!this.el) return;
            document.addEventListener('mousemove', (e) => {
                this.x = e.clientX;
                this.y = e.clientY;
                if (!this.ticking) {
                    requestAnimationFrame(() => {
                        this.el.style.left = this.x + 'px';
                        this.el.style.top = this.y + 'px';
                        this.ticking = false;
                    });
                    this.ticking = true;
                }
            });
        }
    };

    // ==================== 磁吸按钮 ====================
    const MagneticButtons = {
        init() {
            document.addEventListener('mousemove', (e) => {
                const btns = document.querySelectorAll('.magnetic-btn');
                btns.forEach(btn => {
                    const rect = btn.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const dx = e.clientX - cx;
                    const dy = e.clientY - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 150;
                    if (dist < maxDist) {
                        const strength = (1 - dist / maxDist) * 16;
                        btn.style.transform = `translate(${(dx / dist) * strength}px, ${(dy / dist) * strength}px)`;
                    } else {
                        btn.style.transform = 'translate(0, 0)';
                    }
                });
            });
        }
    };

    // ==================== 3D 倾斜卡片 ====================
    const TiltCards = {
        init() {
            document.addEventListener('mousemove', (e) => {
                const cards = document.querySelectorAll('.tilt-card, .laptop-card');
                cards.forEach(card => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateY = ((x - centerX) / centerX) * 5;
                    const rotateX = ((centerY - y) / centerY) * 5;

                    // 更新卡片光泽位置
                    const glow = card.querySelector('.card-glow');
                    if (glow) {
                        glow.style.setProperty('--mx', x + 'px');
                        glow.style.setProperty('--my', y + 'px');
                    }

                    // 仅当鼠标在卡片附近时应用倾斜
                    const mx = e.clientX;
                    const my = e.clientY;
                    const cx = rect.left + centerX;
                    const cy = rect.top + centerY;
                    const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
                    const maxDist = 400;
                    if (dist < maxDist) {
                        const intensity = 1 - dist / maxDist;
                        card.style.transform = `perspective(1200px) rotateX(${rotateX * intensity}deg) rotateY(${rotateY * intensity}deg) translateZ(4px)`;
                    } else {
                        card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) translateZ(0)';
                    }
                });
            });
        }
    };

    // ==================== 打字动画（已移除） ====================

    // ==================== 浮动光球 ====================
    const FloatingOrbs = {
        init() {
            const container = document.createElement('div');
            container.className = 'floating-orbs-container';
            container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1;';
            document.body.prepend(container);

            const orbConfigs = [
                { size: 350, color: 'rgba(59,130,246,0.06)', x: '10%', y: '20%', dur: 18 },
                { size: 280, color: 'rgba(139,92,246,0.05)', x: '70%', y: '50%', dur: 22 },
                { size: 320, color: 'rgba(236,72,153,0.04)', x: '40%', y: '70%', dur: 20 },
                { size: 250, color: 'rgba(16,185,129,0.04)', x: '80%', y: '10%', dur: 24 },
            ];

            orbConfigs.forEach((cfg, i) => {
                const orb = document.createElement('div');
                orb.className = 'floating-blob';
                const sizeVar = cfg.size * (0.8 + Math.random() * 0.4);
                orb.style.cssText = `
                    position: absolute;
                    width: ${sizeVar}px;
                    height: ${sizeVar}px;
                    border-radius: 50%;
                    background: radial-gradient(circle, ${cfg.color}, transparent 70%);
                    left: ${cfg.x};
                    top: ${cfg.y};
                    animation: blobFloat${i + 1} ${cfg.dur}s ease-in-out infinite;
                    filter: blur(40px);
                `;
                container.appendChild(orb);
            });

            // 动态添加 keyframes
            const style = document.createElement('style');
            style.textContent = `
                @keyframes blobFloat1 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33% { transform: translate(60px,-40px) scale(1.2); }
                    66% { transform: translate(-30px,30px) scale(0.9); }
                }
                @keyframes blobFloat2 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33% { transform: translate(-50px,30px) scale(1.15); }
                    66% { transform: translate(40px,-20px) scale(0.85); }
                }
                @keyframes blobFloat3 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33% { transform: translate(30px,50px) scale(1.1); }
                    66% { transform: translate(-40px,-30px) scale(1.2); }
                }
                @keyframes blobFloat4 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33% { transform: translate(-40px,-30px) scale(0.9); }
                    66% { transform: translate(50px,20px) scale(1.15); }
                }
            `;
            document.head.appendChild(style);
        }
    };

    // ==================== 滚动揭示增强 ====================
    const ScrollReveal = {
        init() {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('revealed');
                            // 数字滚动动画
                            const countEls = entry.target.querySelectorAll('[data-count]');
                            countEls.forEach(el => {
                                const target = parseFloat(el.getAttribute('data-count'));
                                if (!isNaN(target)) {
                                    animateNumber(el, target);
                                }
                            });
                        }
                    });
                },
                { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
            );

            document.querySelectorAll('.reveal-on-scroll, .stagger-list > *, .timeline-item').forEach(el => {
                observer.observe(el);
            });

            function animateNumber(el, target) {
                const duration = 800;
                const start = performance.now();
                const isFloat = !Number.isInteger(target);
                const decimals = isFloat ? String(target).split('.')[1].length : 0;

                const update = (now) => {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = target * eased;
                    el.textContent = isFloat ? current.toFixed(decimals) : Math.round(current);
                    if (progress < 1) requestAnimationFrame(update);
                    else el.textContent = isFloat ? target.toFixed(decimals) : target;
                };
                requestAnimationFrame(update);
            }
        }
    };

    // ==================== 全局波纹涟漪 ====================
    const GlobalRipple = {
        init() {
            document.addEventListener('click', (e) => {
                if (!e.target || !e.target.closest) return;
                const target = e.target.closest('.btn-ripple, button:not(.no-ripple), .ripple-target');
                if (!target) return;

                const ripple = document.createElement('span');
                ripple.className = 'ripple-effect';
                const rect = target.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.cssText = `
                    left: ${e.clientX - rect.left}px;
                    top: ${e.clientY - rect.top}px;
                    width: ${size}px;
                    height: ${size}px;
                `;
                const style = getComputedStyle(target);
                if (style.position === 'static') target.style.position = 'relative';
                target.style.overflow = 'hidden';
                target.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        }
    };

    // ==================== 导航栏磨砂玻璃 + 滚动效果 ====================
    const NavEffects = {
        init() {
            const nav = document.getElementById('mainNav');
            if (!nav) return;

            const updateNav = () => {
                const scrollY = window.scrollY;
                if (scrollY > 50) {
                    nav.classList.add('nav-scrolled', 'nav-glass');
                } else {
                    nav.classList.remove('nav-scrolled', 'nav-glass');
                }
            };

            window.addEventListener('scroll', updateNav, { passive: true });
            updateNav();
        }
    };

    // ==================== 品牌卡片倾斜增强 ====================
    const BrandTilt = {
        init() {
            document.addEventListener('mousemove', (e) => {
                const cards = document.querySelectorAll('.brand-card');
                cards.forEach(card => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateY = ((x - centerX) / centerX) * 8;
                    const rotateX = ((centerY - y) / centerY) * 8;

                    const mx = e.clientX;
                    const my = e.clientY;
                    const cx = rect.left + centerX;
                    const cy = rect.top + centerY;
                    const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
                    const maxDist = 350;

                    if (dist < maxDist) {
                        const intensity = 1 - dist / maxDist;
                        card.style.transform = `perspective(800px) rotateX(${rotateX * intensity}deg) rotateY(${rotateY * intensity}deg) translateY(-4px)`;
                        card.style.boxShadow = `0 20px 40px -12px rgba(0,0,0,${0.12 * intensity})`;
                    } else {
                        card.style.transform = '';
                        card.style.boxShadow = '';
                    }
                });
            });
        }
    };

    // ==================== 统计卡片入场动画 ====================
    const StatCardsAnimation = {
        init() {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const cards = entry.target.querySelectorAll('.stat-card');
                            cards.forEach((card, i) => {
                                card.style.animationDelay = `${i * 0.08}s`;
                                card.classList.add('stat-count-in');
                            });
                        }
                    });
                },
                { threshold: 0.2 }
            );

            const container = document.querySelector('.stats-grid, [class*="grid"]');
            if (container) observer.observe(container);
        }
    };

    // ==================== 筛选标签点击闪光 ====================
    const FilterChipEffect = {
        init() {
            document.addEventListener('click', (e) => {
                if (!e.target || !e.target.closest) return;
                const chip = e.target.closest('.filter-chip');
                if (!chip) return;
                chip.classList.add('pop');
                setTimeout(() => chip.classList.remove('pop'), 300);
            });
        }
    };

    // ==================== 回到顶部按钮进度环 ====================
    const BackToTop = {
        init() {
            const btn = document.querySelector('.back-to-top');
            const ringContainer = document.querySelector('.progress-ring-container');
            const ringFill = document.querySelector('.progress-ring-fill');
            if (!btn || !ringFill) return;

            const circumference = 2 * Math.PI * 22;

            const update = () => {
                const scrollY = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = docHeight > 0 ? scrollY / docHeight : 0;

                if (scrollY > 500) {
                    btn.classList.add('visible');
                    if (ringContainer) ringContainer.classList.add('visible');
                } else {
                    btn.classList.remove('visible');
                    if (ringContainer) ringContainer.classList.remove('visible');
                }

                const offset = circumference * (1 - progress);
                ringFill.style.strokeDasharray = circumference;
                ringFill.style.strokeDashoffset = offset;
            };

            window.addEventListener('scroll', update, { passive: true });
            update();

            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    };

    // ==================== 页面切换过渡增强 ====================
    const PageTransitions = {
        init() {
            // 监听 Vue 的 currentView 变化（通过 MutationObserver 监听 main 内容变化）
            const app = document.getElementById('app');
            if (!app) return;

            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.type === 'childList' && m.addedNodes.length > 0) {
                        for (const node of m.addedNodes) {
                            if (node.nodeType === 1 && node.tagName === 'DIV') {
                                node.classList.add('page-enter');
                                // 为新页面的滚动元素重新绑定
                                setTimeout(() => {
                                    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
                                        if (!el.classList.contains('revealed')) {
                                            const io = new IntersectionObserver(
                                                ([entry]) => {
                                                    if (entry.isIntersecting) {
                                                        entry.target.classList.add('revealed');
                                                        io.unobserve(entry.target);
                                                    }
                                                },
                                                { threshold: 0.1 }
                                            );
                                            io.observe(el);
                                        }
                                    });
                                }, 200);
                            }
                        }
                    }
                }
            });

            const main = app.querySelector('main');
            if (main) {
                observer.observe(main, { childList: true, subtree: false });
            }
        }
    };

    // ==================== 彩纸特效（成功时触发） ====================
    const Confetti = {
        fire(count = 60) {
            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
            for (let i = 0; i < count; i++) {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';
                const x = Math.random() * window.innerWidth;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = Math.random() * 8 + 4;
                const shape = Math.random() > 0.5 ? '50%' : '2px';
                piece.style.cssText = `
                    left: ${x}px;
                    top: -20px;
                    width: ${size}px;
                    height: ${size * (Math.random() * 1.5 + 0.5)}px;
                    background: ${color};
                    border-radius: ${shape};
                    --fall-dur: ${Math.random() * 2 + 2.5}s;
                    --sway-dur: ${Math.random() * 1.5 + 0.8}s;
                    --spin: ${Math.random() * 720 - 360}deg;
                    --sway: ${Math.random() * 80 - 40}px;
                    --start-delay: ${Math.random() * 0.6}s;
                `;
                document.body.appendChild(piece);
                setTimeout(() => piece.remove(), 4000);
            }
        }
    };

    // ==================== 萤火虫 / 暗夜星星 ====================
    const Fireflies = {
        container: null,
        dots: [],
        count: 25,

        init() {
            this.container = document.createElement('div');
            this.container.className = 'fireflies-container';
            this.container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;';
            document.body.appendChild(this.container);
            this.createDots();
            this.observeTheme();
        },

        createDots() {
            this.dots.forEach(d => d.remove());
            this.dots = [];
            const isDark = document.documentElement.classList.contains('dark');

            for (let i = 0; i < this.count; i++) {
                const el = document.createElement('div');
                const x = Math.random() * 100;
                const y = Math.random() * 100;

                if (isDark) {
                    // 暗夜：白色/蓝色星星，位置固定，间歇性闪耀
                    const size = 1.5 + Math.random() * 2.5;
                    el.className = 'star-dot';
                    el.style.cssText = `
                        left: ${x}%;
                        top: ${y}%;
                        width: ${size}px;
                        height: ${size}px;
                        background: rgba(255, 255, 255, 0.9);
                        box-shadow: 0 0 ${size * 3}px ${size}px rgba(180, 210, 255, 0.6);
                        border-radius: 50%;
                        animation: starTwinkle ${1.5 + Math.random() * 4}s ease-in-out ${Math.random() * 5}s infinite;
                    `;
                } else {
                    // 白天：暖黄萤火虫，漂浮 + 呼吸
                    const size = 3 + Math.random() * 6;
                    el.className = 'firefly';
                    el.style.cssText = `
                        left: ${x}%;
                        top: ${y}%;
                        width: ${size}px;
                        height: ${size}px;
                        animation: fireflyFloat ${8 + Math.random() * 12}s ease-in-out ${Math.random() * 8}s infinite,
                                   fireflyGlow ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite;
                        --fx: ${(Math.random() - 0.5) * 200}px;
                        --fy: ${(Math.random() - 0.5) * 200}px;
                    `;
                }

                this.container.appendChild(el);
                this.dots.push(el);
            }
        },

        destroy() {
            if (this.container) {
                this.container.remove();
                this.container = null;
                this.dots = [];
            }
        },

        observeTheme() {
            const observer = new MutationObserver(() => {
                if (this.container) this.createDots();
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }
    };

    // ==================== 点击水波纹 ====================
    const WaterRipple = {
        init() {
            document.addEventListener('click', (e) => {
                // 跳过按钮等交互元素（它们有自己的波纹）
                if (!e.target || !e.target.closest) return;
                if (e.target.closest('button, a, input, select, textarea, .laptop-card, .brand-card')) return;

                const colors = ['rgba(59,130,246,0.25)', 'rgba(139,92,246,0.2)', 'rgba(236,72,153,0.18)'];
                for (let i = 0; i < 3; i++) {
                    const ripple = document.createElement('div');
                    ripple.className = 'water-ripple';
                    ripple.style.cssText = `
                        left: ${e.clientX}px;
                        top: ${e.clientY}px;
                        border-color: ${colors[i]};
                        animation: waterRippleOut ${0.8 + i * 0.3}s ease-out forwards;
                        animation-delay: ${i * 0.12}s;
                    `;
                    document.body.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 2000);
                }
            });
        }
    };

    // ==================== 白天模式专属：飘雪 ====================
    const Snowfall = {
        container: null,
        maxFlakes: 35,
        active: false,

        init() {
            if (document.documentElement.classList.contains('dark')) return;
            this.container = document.createElement('div');
            this.container.className = 'snowfall-container';
            document.body.appendChild(this.container);
            this.active = true;
            this.spawnLoop();
            this.observeTheme();
        },

        createFlake() {
            const flake = document.createElement('div');
            flake.className = 'snowflake';
            const size = 3 + Math.random() * 10;
            flake.style.cssText = `
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                opacity: ${0.3 + Math.random() * 0.5};
                animation: snowFall ${6 + Math.random() * 12}s linear ${Math.random() * 6}s infinite;
                --sway: ${(Math.random() - 0.5) * 120}px;
            `;
            flake.textContent = Math.random() > 0.5 ? '❄' : '';
            return flake;
        },

        spawnLoop() {
            if (!this.active || !this.container) return;
            if (this.container.children.length < this.maxFlakes) {
                const batch = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < batch; i++) {
                    if (this.container.children.length >= this.maxFlakes) break;
                    const flake = this.createFlake();
                    flake.dataset.created = Date.now();
                    this.container.appendChild(flake);
                }
            }
            // 清理旧雪花
            const now = Date.now();
            const flakes = this.container.children;
            for (let i = flakes.length - 1; i >= 0; i--) {
                if (now - parseInt(flakes[i].dataset.created || '0') > 20000) {
                    flakes[i].remove();
                }
            }
            setTimeout(() => this.spawnLoop(), 400 + Math.random() * 800);
        },

        destroy() {
            this.active = false;
            if (this.container) { this.container.remove(); this.container = null; }
        },

        observeTheme() {
            const observer = new MutationObserver(() => {
                if (document.documentElement.classList.contains('dark')) {
                    this.destroy();
                } else if (!this.container) {
                    this.container = document.createElement('div');
                    this.container.className = 'snowfall-container';
                    document.body.appendChild(this.container);
                    this.active = true;
                    this.spawnLoop();
                }
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }
    };

    // ==================== 自动暗色模式 ====================
    const AutoDarkMode = {
        init() {
            // 仅在没有手动设置过主题时跟随系统
            if (localStorage.getItem('theme')) return;

            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const apply = (e) => {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            };
            apply(mq);
            mq.addEventListener('change', apply);
        }
    };

    // ==================== Hero 3D 视差增强 ====================
    const HeroParallax = {
        init() {
            const hero = document.querySelector('.hero-section');
            if (!hero) return;
            hero.style.setProperty('--px', '0');
            hero.style.setProperty('--py', '0');

            hero.addEventListener('mousemove', (e) => {
                const rect = hero.getBoundingClientRect();
                const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
                hero.style.setProperty('--px', dx.toFixed(3));
                hero.style.setProperty('--py', dy.toFixed(3));
            });

            hero.addEventListener('mouseleave', () => {
                hero.style.setProperty('--px', '0');
                hero.style.setProperty('--py', '0');
                hero.style.transition = '--px 0.6s ease, --py 0.6s ease';
                setTimeout(() => hero.style.transition = '', 600);
            });
        }
    };

    // ==================== 棱镜光斑随鼠标 ====================
    const PrismSpots = {
        spots: [],
        mouseX: -500,
        mouseY: -500,
        targetX: -500,
        targetY: -500,

        init() {
            const container = document.createElement('div');
            container.className = 'prism-container';
            container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1;';
            document.body.appendChild(container);

            const colors = [
                'rgba(255,100,100,0.08)',
                'rgba(255,180,50,0.07)',
                'rgba(100,255,150,0.06)',
                'rgba(80,180,255,0.08)',
                'rgba(180,100,255,0.07)',
            ];

            for (let i = 0; i < 5; i++) {
                const spot = document.createElement('div');
                spot.className = 'prism-spot';
                spot.style.cssText = `
                    width: ${150 + Math.random() * 200}px;
                    height: ${150 + Math.random() * 200}px;
                    background: ${colors[i]};
                    filter: blur(${40 + Math.random() * 40}px);
                `;
                container.appendChild(spot);
                this.spots.push({
                    el: spot,
                    x: 0, y: 0,
                    offsetX: (Math.random() - 0.5) * 300,
                    offsetY: (Math.random() - 0.5) * 300,
                    speed: 0.03 + Math.random() * 0.05
                });
            }

            document.addEventListener('mousemove', (e) => {
                this.targetX = e.clientX;
                this.targetY = e.clientY;
            });

            const animate = () => {
                this.mouseX += (this.targetX - this.mouseX) * 0.06;
                this.mouseY += (this.targetY - this.mouseY) * 0.06;

                this.spots.forEach(s => {
                    s.x += (this.mouseX + s.offsetX - s.x) * s.speed;
                    s.y += (this.mouseY + s.offsetY - s.y) * s.speed;
                    s.el.style.left = s.x + 'px';
                    s.el.style.top = s.y + 'px';
                });

                requestAnimationFrame(animate);
            };
            animate();
        }
    };

    // ==================== 按钮点击火花爆发 ====================
    const SparkleBurst = {
        init() {
            document.addEventListener('click', (e) => {
                if (!e.target || !e.target.closest) return;
                const btn = e.target.closest('button, .btn-primary, .btn-gradient, .magnetic-btn');
                if (!btn) return;
                const rect = btn.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const count = 12 + Math.floor(Math.random() * 8);

                for (let i = 0; i < count; i++) {
                    const spark = document.createElement('div');
                    spark.className = 'spark-particle';
                    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
                    const dist = 30 + Math.random() * 50;
                    const size = 3 + Math.random() * 5;
                    const hue = Math.random() * 360;
                    const dx = Math.cos(angle) * dist;
                    const dy = Math.sin(angle) * dist;
                    spark.style.cssText = `
                        left: ${cx}px;
                        top: ${cy}px;
                        width: ${size}px;
                        height: ${size}px;
                        background: hsl(${hue}, 90%, 60%);
                        --dx: ${dx}px;
                        --dy: ${dy}px;
                        --dur: ${0.4 + Math.random() * 0.5}s;
                        position: fixed;
                        z-index: 9999;
                        border-radius: 50%;
                        pointer-events: none;
                        animation: sparkBurst var(--dur) ease-out forwards;
                    `;
                    document.body.appendChild(spark);
                    setTimeout(() => spark.remove(), 1000);
                }
            });
        }
    };

    // ==================== 白天模式专属：阳光射线 ====================
    const SunRays = {
        container: null,

        init() {
            if (document.documentElement.classList.contains('dark')) return;
            this.create();
            this.observeTheme();
        },

        create() {
            if (this.container) this.container.remove();
            this.container = document.createElement('div');
            this.container.className = 'sun-rays-container';
            this.container.innerHTML = `
                <div class="sun-ray sun-ray-1"></div>
                <div class="sun-ray sun-ray-2"></div>
                <div class="sun-ray sun-ray-3"></div>
                <div class="sun-ray sun-ray-4"></div>
            `;
            document.body.prepend(this.container);
        },

        destroy() {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
        },

        observeTheme() {
            const observer = new MutationObserver(() => {
                if (document.documentElement.classList.contains('dark')) {
                    this.destroy();
                } else {
                    this.create();
                }
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }
    };

    // ==================== 白天模式专属：飘浮花瓣粒子 ====================
    const LightPetals = {
        petals: [],
        maxPetals: 15,
        container: null,
        animating: false,

        init() {
            if (document.documentElement.classList.contains('dark')) return;
            this.container = document.createElement('div');
            this.container.className = 'petals-container';
            document.body.appendChild(this.container);
            this.spawnPetal();
            this.observeTheme();
        },

        spawnPetal() {
            if (document.documentElement.classList.contains('dark')) {
                this.animating = false;
                return;
            }
            this.animating = true;

            if (this.container.children.length < this.maxPetals) {
                const petal = document.createElement('div');
                petal.className = 'light-petal';
                const shapes = ['petal-diamond', 'petal-circle', 'petal-star'];
                const colors = ['petal-blue', 'petal-purple', 'petal-gold', 'petal-pink'];
                petal.classList.add(shapes[Math.floor(Math.random() * shapes.length)]);
                petal.classList.add(colors[Math.floor(Math.random() * colors.length)]);
                petal.style.left = Math.random() * 100 + '%';
                petal.style.setProperty('--drift', (Math.random() - 0.5) * 200 + 'px');
                petal.style.setProperty('--dur', (Math.random() * 8 + 10) + 's');
                petal.style.setProperty('--delay', Math.random() * 5 + 's');
                petal.style.setProperty('--size', (Math.random() * 10 + 8) + 'px');
                this.container.appendChild(petal);

                setTimeout(() => {
                    if (petal.parentNode) petal.remove();
                }, 18000);
            }

            setTimeout(() => this.spawnPetal(), Math.random() * 3000 + 2000);
        },

        destroy() {
            this.animating = false;
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
        },

        observeTheme() {
            const observer = new MutationObserver(() => {
                if (document.documentElement.classList.contains('dark')) {
                    this.destroy();
                } else {
                    if (!this.container) {
                        this.container = document.createElement('div');
                        this.container.className = 'petals-container';
                        document.body.appendChild(this.container);
                        this.spawnPetal();
                    }
                }
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }
    };

    // ==================== 白天模式专属：樱花飘落 ====================
    const Sakura = {
        container: null,
        maxPetals: 50,
        active: false,
        _idCounter: 0,

        init() {
            if (document.documentElement.classList.contains('dark')) return;
            this.container = document.createElement('div');
            this.container.className = 'sakura-container';
            document.body.appendChild(this.container);
            this.active = true;
            this.spawnLoop();
            this.observeTheme();
        },

        createPetal() {
            // 外层：水平飘摆
            const wrapper = document.createElement('div');
            wrapper.className = 'sakura-wrapper';
            const hue = 340 + Math.random() * 25;
            const sat = 60 + Math.random() * 35;
            const light = 72 + Math.random() * 18;
            const size = 22 + Math.random() * 30;
            const left = Math.random() * 100;
            const duration = 8 + Math.random() * 14;
            const delay = Math.random() * 8;
            const sway = (Math.random() - 0.5) * 250;
            const spin = Math.random() * 720 - 360;
            const opacity = 0.55 + Math.random() * 0.4;
            const color = `hsla(${hue}, ${sat}%, ${light}%, ${opacity})`;
            const innerColor = `hsla(${hue + 10}, ${sat}%, ${light + 5}%, ${opacity + 0.15})`;

            wrapper.style.cssText = `
                position: absolute;
                top: -40px;
                left: ${left}%;
                z-index: 1;
                animation: sakuraSway ${3 + Math.random() * 3}s ease-in-out ${delay}s infinite;
                --sway: ${sway}px;
            `;

            // 内层：下落 + 旋转 + 标准樱花SVG
            const petal = document.createElement('div');
            petal.className = 'sakura-petal';
            petal.style.cssText = `
                --petal-size: ${size}px;
                --spin: ${spin}deg;
                animation: sakuraFall ${duration}s linear ${delay}s 1;
            `;

            // 5瓣樱花 SVG
            petal.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10
                    C56 10, 63 19, 65 26
                    C68 19, 76 10, 82 10
                    C89 10, 96 19, 93 29
                    C91 39, 82 46, 75 53
                    C82 62, 91 72, 85 81
                    C80 91, 70 89, 62 80
                    C58 88, 50 95, 42 88
                    C38 95, 30 98, 24 90
                    C17 85, 17 71, 25 61
                    C15 54, 7 44, 6 34
                    C5 21, 14 10, 22 10
                    C28 10, 35 16, 38 22
                    C42 16, 48 10, 50 10Z"
                    fill="${color}" stroke="${innerColor}" stroke-width="0.5" opacity="0.95"/>
                <circle cx="50" cy="50" r="5" fill="${innerColor}" opacity="0.6"/>
                <circle cx="50" cy="50" r="2.5" fill="${innerColor}" opacity="0.8"/>
            </svg>`;

            wrapper.appendChild(petal);
            return wrapper;
        },

        spawn() {
            if (!this.active || !this.container) return;

            const count = this.container.children.length;
            if (count < this.maxPetals) {
                // 每次随机生成 2-5 朵
                const batch = 2 + Math.floor(Math.random() * 4);
                for (let i = 0; i < batch; i++) {
                    if (this.container.children.length >= this.maxPetals) break;
                    const wrapper = this.createPetal();
                    wrapper.dataset.created = Date.now();
                    this.container.appendChild(wrapper);
                }
            }

            // 清理已完成动画的旧花瓣
            const now = Date.now();
            const wrappers = this.container.children;
            for (let i = wrappers.length - 1; i >= 0; i--) {
                const w = wrappers[i];
                const petal = w.querySelector('.sakura-petal');
                if (!petal) { w.remove(); continue; }
                const dur = parseFloat(petal.style.animationDuration) * 1000 || 22000;
                const delay = parseFloat(petal.style.animationDelay) * 1000 || 0;
                if (now - (parseInt(w.dataset.created || '0')) > dur + delay + 1000) {
                    w.remove();
                }
            }

            setTimeout(() => this.spawn(), 300 + Math.random() * 600);
        },

        spawnLoop() {
            if (!this.container) return;
            // 初始散布一些花瓣在屏幕不同位置
            for (let i = 0; i < 15; i++) {
                const wrapper = this.createPetal();
                wrapper.dataset.created = Date.now();
                // 错开初始位置
                const petal = wrapper.querySelector('.sakura-petal');
                if (petal) petal.style.animationDelay = Math.random() * 3 + 's';
                this.container.appendChild(wrapper);
            }
            this.spawn();
        },

        destroy() {
            this.active = false;
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
        },

        observeTheme() {
            const observer = new MutationObserver(() => {
                if (document.documentElement.classList.contains('dark')) {
                    this.destroy();
                } else {
                    if (!this.container) {
                        this.container = document.createElement('div');
                        this.container.className = 'sakura-container';
                        document.body.appendChild(this.container);
                        this.active = true;
                        this.spawnLoop();
                    }
                }
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }
    };

    // ==================== 白天模式专属：卡片彩虹光晕扫过 ====================
    const CardRainbowGlow = {
        init() {
            if (document.documentElement.classList.contains('dark')) return;
            document.addEventListener('mousemove', (e) => {
                const cards = document.querySelectorAll('.laptop-card');
                cards.forEach(card => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const cx = rect.width / 2;
                    const cy = rect.height / 2;
                    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    const maxDist = Math.max(rect.width, rect.height);

                    const rainbow = card.querySelector('.rainbow-overlay');
                    if (!rainbow) return;

                    if (dist < maxDist * 0.8) {
                        const hue = (Date.now() / 30 + (x / rect.width) * 180) % 360;
                        rainbow.style.opacity = '0.15';
                        rainbow.style.background = `
                            radial-gradient(circle at ${x}px ${y}px,
                                hsla(${hue}, 80%, 60%, 0.25),
                                hsla(${(hue + 60) % 360}, 70%, 55%, 0.1) 40%,
                                transparent 70%
                            )
                        `;
                    } else {
                        rainbow.style.opacity = '0';
                    }
                });
            });
        }
    };

    // ==================== 初始化所有效果 ====================
    function initAll() {
        ParticleNetwork.init();
        CursorSpotlight.init();
        MagneticButtons.init();
        TiltCards.init();
        FloatingOrbs.init();
        NavEffects.init();
        BrandTilt.init();
        StatCardsAnimation.init();
        FilterChipEffect.init();
        BackToTop.init();
        PageTransitions.init();
        GlobalRipple.init();
        SparkleBurst.init();
        AutoDarkMode.init();
        Fireflies.init();
        WaterRipple.init();
        Snowfall.init();
        PrismSpots.init();
        HeroParallax.init();
        hideLoader();

        // 白天模式专属效果
        SunRays.init();
        LightPetals.init();
        Sakura.init();
        CardRainbowGlow.init();

        // 暴露 Confetti 到全局
        window.Confetti = Confetti;

        // 页面滚动时更新粒子画布高度
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                ParticleNetwork.resize();
                ParticleNetwork.createParticles();
            }, 200);
        });

        console.log('动画美术效果引擎已启动');
    }

    // 页面加载动画
    function hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (!loader) return;
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 600);
        }, 800);
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();

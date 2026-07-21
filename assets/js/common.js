(() => {
    'use strict';

    const modal = document.getElementById('contactModal');
    const modalPanel = modal?.querySelector('.modal-panel');
    const nav = document.getElementById('primary-navigation');
    const navToggle = document.querySelector('[data-nav-toggle]');
    const toast = document.getElementById('toast');
    let lastFocusedElement = null;
    let toastTimer = null;

    const focusableSelector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function visibleFocusableElements() {
        if (!modalPanel) return [];
        return [...modalPanel.querySelectorAll(focusableSelector)]
            .filter(element => !element.hidden && element.getClientRects().length > 0);
    }

    function openContactModal(trigger) {
        if (!modal || !modalPanel) return;
        lastFocusedElement = trigger || document.activeElement;
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            const firstFocusable = visibleFocusableElements()[0];
            (firstFocusable || modalPanel).focus();
        });
    }

    function closeContactModal() {
        if (!modal?.classList.contains('show')) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedElement instanceof HTMLElement && document.contains(lastFocusedElement)) {
            lastFocusedElement.focus();
        }
        lastFocusedElement = null;
    }

    function trapModalFocus(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeContactModal();
            return;
        }
        if (event.key !== 'Tab') return;
        const elements = visibleFocusableElements();
        if (!elements.length) {
            event.preventDefault();
            modalPanel?.focus();
            return;
        }
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function showToast(message) {
        if (!toast) return;
        window.clearTimeout(toastTimer);
        toast.textContent = message;
        toast.classList.add('show');
        toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
    }

    async function copyText(text, button) {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const input = document.createElement('textarea');
                input.value = text;
                input.setAttribute('readonly', '');
                input.style.position = 'fixed';
                input.style.opacity = '0';
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                input.remove();
            }
            showToast(`✅ 已复制：${text}`);
            if (button) {
                const originalLabel = button.textContent;
                button.textContent = '已复制';
                window.setTimeout(() => { button.textContent = originalLabel; }, 1500);
            }
        } catch {
            showToast('复制失败，请长按内容手动复制');
        }
    }

    function setNavigationOpen(open) {
        nav?.classList.toggle('open', open);
        navToggle?.setAttribute('aria-expanded', String(open));
    }

    function toggleFaq(question) {
        const item = question.closest('.faq-item');
        if (!item) return;
        const open = item.classList.toggle('open');
        question.setAttribute('aria-expanded', String(open));
    }

    function filterFaq(category, button) {
        document.querySelectorAll('[data-faq-filter]').forEach(item => {
            const active = item === button;
            item.classList.toggle('active', active);
            item.setAttribute('aria-pressed', String(active));
        });
        document.querySelectorAll('.faq-item').forEach(item => {
            item.style.display = category === 'all' || item.dataset.cat === category ? 'block' : 'none';
        });
    }

    document.querySelectorAll('[data-faq-toggle]').forEach((question, index) => {
        const answer = question.parentElement?.querySelector('.faq-a');
        const answerId = answer?.id || `faq-answer-${index + 1}`;
        if (answer) answer.id = answerId;
        question.setAttribute('aria-controls', answerId);
        question.setAttribute('aria-expanded', String(question.parentElement?.classList.contains('open')));
    });

    document.querySelectorAll('[data-faq-filter]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    });

    document.addEventListener('click', event => {
        const openButton = event.target.closest('[data-contact-open]');
        if (openButton) {
            openContactModal(openButton);
            return;
        }

        if (event.target.closest('[data-contact-close]')) {
            closeContactModal();
            return;
        }

        const copyButton = event.target.closest('[data-copy]');
        if (copyButton) {
            copyText(copyButton.dataset.copy, copyButton);
            return;
        }

        const faqQuestion = event.target.closest('[data-faq-toggle]');
        if (faqQuestion) {
            toggleFaq(faqQuestion);
            return;
        }

        const filterButton = event.target.closest('[data-faq-filter]');
        if (filterButton) {
            filterFaq(filterButton.dataset.faqFilter, filterButton);
            return;
        }

        if (event.target.closest('[data-back-top]')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.addEventListener('keydown', event => {
        if (modal?.classList.contains('show')) {
            trapModalFocus(event);
            return;
        }
        const question = event.target.closest?.('[data-faq-toggle]');
        if (question && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            toggleFaq(question);
        }
    });

    modal?.addEventListener('click', event => {
        if (event.target === modal) closeContactModal();
    });

    navToggle?.addEventListener('click', () => {
        setNavigationOpen(!nav?.classList.contains('open'));
    });

    nav?.addEventListener('click', event => {
        if (event.target.closest('a')) setNavigationOpen(false);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', event => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (!target) return;
            event.preventDefault();
            setNavigationOpen(false);
            window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
        });
    });

    // Stagger reveal animations within each grid/list parent
    document.querySelectorAll(
        '.services-grid, .features-grid, .steps, .faq-list, .testimonials-grid, .service-detail-grid, .related-grid'
    ).forEach(group => {
        [...group.children].forEach((child, index) => {
            if (child.matches('.reveal, .reveal-left, .reveal-right, .service-card, .feature-card, .step, .faq-item, .testimonial-card, .service-detail-card, .related-card')) {
                child.style.setProperty('--reveal-delay', `${Math.min(index * 0.07, 0.42)}s`);
            }
        });
    });

    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: .1, rootMargin: '0px 0px -50px 0px' });
        revealElements.forEach(element => observer.observe(element));
    } else {
        revealElements.forEach(element => element.classList.add('visible'));
    }

    // Animated counters for hero stats
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const countElements = document.querySelectorAll('[data-count]');

    function animateCounter(element) {
        const target = Number(element.dataset.count);
        if (!Number.isFinite(target)) return;
        const suffix = element.dataset.suffix || '';
        if (prefersReducedMotion) {
            element.textContent = `${target}${suffix}`;
            return;
        }
        const duration = 1400;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = `${Math.round(target * eased)}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    if (countElements.length) {
        if ('IntersectionObserver' in window) {
            const countObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    animateCounter(entry.target);
                    countObserver.unobserve(entry.target);
                });
            }, { threshold: .4 });
            countElements.forEach(el => countObserver.observe(el));
        } else {
            countElements.forEach(animateCounter);
        }
    }

    // Hero cursor spotlight + soft blob drift
    const hero = document.querySelector('.hero');
    const spotlight = document.getElementById('heroSpotlight');
    const flowBlobs = hero ? [...hero.querySelectorAll('.flow-blob')] : [];
    const heroContent = document.getElementById('heroContent');
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;

    if (hero && !prefersReducedMotion) {
        let spotlightRaf = 0;
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        if (spotlight && isFinePointer) {
            hero.addEventListener('pointermove', event => {
                const rect = hero.getBoundingClientRect();
                targetX = event.clientX - rect.left;
                targetY = event.clientY - rect.top;
                if (!spotlightRaf) {
                    spotlightRaf = requestAnimationFrame(function follow() {
                        currentX += (targetX - currentX) * 0.12;
                        currentY += (targetY - currentY) * 0.12;
                        spotlight.style.left = `${currentX}px`;
                        spotlight.style.top = `${currentY}px`;
                        if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
                            spotlightRaf = requestAnimationFrame(follow);
                        } else {
                            spotlightRaf = 0;
                        }
                    });
                }

                // Subtle 3D tilt of hero content
                if (heroContent) {
                    const px = (targetX / rect.width - 0.5) * 2;
                    const py = (targetY / rect.height - 0.5) * 2;
                    heroContent.style.transform =
                        `perspective(1200px) rotateY(${px * 4}deg) rotateX(${-py * 3}deg) translateZ(0)`;
                }
            }, { passive: true });

            hero.addEventListener('pointerleave', () => {
                if (heroContent) heroContent.style.transform = '';
            });
        }

        let scrollTicking = false;
        window.addEventListener('scroll', () => {
            if (scrollTicking || !flowBlobs.length) return;
            scrollTicking = true;
            requestAnimationFrame(() => {
                const rect = hero.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    const offset = Math.min(Math.max(-rect.top * 0.08, -50), 50);
                    flowBlobs.forEach((blob, i) => {
                        blob.style.setProperty('--scroll-y', `${offset * (0.3 + i * 0.15)}px`);
                    });
                    // Hide scroll hint after moving
                    if (window.scrollY > 40) {
                        document.querySelector('.scroll-hint')?.classList.add('hide');
                    }
                }
                scrollTicking = false;
            });
        }, { passive: true });
    }

    // Particle field
    const particleCanvas = document.getElementById('heroParticles');
    if (particleCanvas && hero && !prefersReducedMotion) {
        const ctx = particleCanvas.getContext('2d');
        let particles = [];
        let animId = 0;
        let w = 0;
        let h = 0;
        const isMobile = window.matchMedia('(max-width:768px)').matches;
        const COUNT = isMobile ? 28 : 70;

        function resize() {
            const rect = hero.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = rect.width;
            h = rect.height;
            particleCanvas.width = w * dpr;
            particleCanvas.height = h * dpr;
            particleCanvas.style.width = `${w}px`;
            particleCanvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function spawn() {
            particles = Array.from({ length: COUNT }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.8 + 0.4,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35 - 0.15,
                a: Math.random() * 0.55 + 0.15,
                hue: Math.random() > 0.55 ? 28 : (Math.random() > 0.5 ? 280 : 200)
            }));
        }

        function tick() {
            animId = 0;
            ctx.clearRect(0, 0, w, h);
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                if (p.y > h + 10) p.y = -10;
                ctx.beginPath();
                ctx.fillStyle = `hsla(${p.hue},95%,70%,${p.a})`;
                ctx.shadowColor = `hsla(${p.hue},95%,65%,.6)`;
                ctx.shadowBlur = 8;
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            // soft connections
            ctx.shadowBlur = 0;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d = dx * dx + dy * dy;
                    if (d < 110 * 110) {
                        const alpha = (1 - Math.sqrt(d) / 110) * 0.18;
                        ctx.strokeStyle = `rgba(251,146,60,${alpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(tick);
        }

        resize();
        spawn();
        animId = requestAnimationFrame(tick);
        window.addEventListener('resize', () => {
            resize();
            spawn();
        }, { passive: true });
        // pause when offscreen
        if ('IntersectionObserver' in window) {
            const po = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (!animId) animId = requestAnimationFrame(tick);
                    } else {
                        if (animId) cancelAnimationFrame(animId);
                        animId = 0;
                    }
                });
            }, { threshold: 0 });
            po.observe(hero);
        }
    }

    // Custom cursor glow + magnetic buttons + 3D tilt cards
    const cursorGlow = document.getElementById('cursorGlow');
    if (cursorGlow && isFinePointer && !prefersReducedMotion) {
        document.body.classList.add('has-cursor-glow');
        let cx = 0, cy = 0, gx = 0, gy = 0, cr = 0;
        window.addEventListener('pointermove', e => {
            cx = e.clientX; cy = e.clientY;
            cursorGlow.classList.add('on');
            if (!cr) {
                cr = requestAnimationFrame(function loop() {
                    gx += (cx - gx) * 0.2;
                    gy += (cy - gy) * 0.2;
                    cursorGlow.style.left = `${gx}px`;
                    cursorGlow.style.top = `${gy}px`;
                    if (Math.abs(cx - gx) > 0.4 || Math.abs(cy - gy) > 0.4) {
                        cr = requestAnimationFrame(loop);
                    } else cr = 0;
                });
            }
        }, { passive: true });
        document.addEventListener('pointerover', e => {
            if (e.target.closest('a,button,.service-card,.feature-card,.contact-btn')) {
                cursorGlow.classList.add('hot');
            }
        });
        document.addEventListener('pointerout', e => {
            if (e.target.closest('a,button,.service-card,.feature-card,.contact-btn')) {
                cursorGlow.classList.remove('hot');
            }
        });
    }

    // Magnetic buttons
    if (isFinePointer && !prefersReducedMotion) {
        document.querySelectorAll('.magnetic').forEach(btn => {
            btn.addEventListener('pointermove', e => {
                const r = btn.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                btn.style.transform = `translate(${x * 0.22}px,${y * 0.28}px)`;
            });
            btn.addEventListener('pointerleave', () => {
                btn.style.transform = '';
            });
        });
    }

    // 3D tilt on cards
    if (isFinePointer && !prefersReducedMotion) {
        document.querySelectorAll('.service-card, .feature-card, .tilt-card, .hero-stat').forEach(card => {
            card.classList.add('tilt-ready');
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                card.style.setProperty('--ry', `${px * 14}deg`);
                card.style.setProperty('--rx', `${-py * 12}deg`);
            });
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--ry', '0deg');
                card.style.setProperty('--rx', '0deg');
            });
        });
    }

    // Pause marquee on hover (desktop)
    document.querySelectorAll('.flow-marquee-track').forEach(marquee => {
        const wrap = marquee.parentElement;
        wrap?.addEventListener('mouseenter', () => { marquee.style.animationPlayState = 'paused'; });
        wrap?.addEventListener('mouseleave', () => { marquee.style.animationPlayState = 'running'; });
    });

    // Hide scroll hint style
    const styleHint = document.createElement('style');
    styleHint.textContent = '.scroll-hint.hide{opacity:0 !important;pointer-events:none;transition:opacity .4s}';
    document.head.appendChild(styleHint);

    function updateScrollUi() {
        document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 50);
        document.querySelector('.back-top')?.classList.toggle('show', window.scrollY > 500);
    }
    window.addEventListener('scroll', updateScrollUi, { passive: true });
    updateScrollUi();

    window._hmt = window._hmt || [];
    const analytics = document.createElement('script');
    analytics.src = 'https://hm.baidu.com/hm.js?52db730f9e5dfe05d2a1e4ff3575753a';
    analytics.async = true;
    document.head.appendChild(analytics);
})();

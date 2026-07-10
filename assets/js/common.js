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

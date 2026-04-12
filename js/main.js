document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const hero = document.querySelector('.hero-showcase');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-nav-menu');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileClearSearchBtn = document.getElementById('mobile-clear-search-btn');
    const mobileAuthBtn = document.getElementById('mobile-auth-btn');
    const mobileAdminBtn = document.getElementById('mobile-admin-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    function syncHeaderMetrics() {
        if (!header) return;

        if (window.innerWidth <= 640) {
            const headerHeight = Math.ceil(header.offsetHeight || 0);
            if (headerHeight > 0) {
                document.documentElement.style.setProperty('--mobile-header-overlap', `${headerHeight}px`);
            }
            return;
        }

        document.documentElement.style.removeProperty('--mobile-header-overlap');
    }

    function updateHeaderTheme() {
        if (!header || !hero) return;

        syncHeaderMetrics();

        const heroBottom = hero.offsetTop + hero.offsetHeight;
        const headerHeight = header.offsetHeight || 0;
        const triggerPoint = heroBottom - headerHeight - 32;
        const shouldUseSolid = window.scrollY >= triggerPoint;

        header.classList.toggle('header-solid', shouldUseSolid);
    }

    function refreshHeaderState() {
        window.requestAnimationFrame(updateHeaderTheme);
    }

    let headerTicking = false;
    function onHeaderScroll() {
        if (headerTicking) return;
        headerTicking = true;

        window.requestAnimationFrame(() => {
            updateHeaderTheme();
            headerTicking = false;
        });
    }

    function setMobileMenuOpen(isOpen) {
        if (!mobileMenu || !mobileMenuToggle) return;

        mobileMenu.classList.toggle('hidden', !isOpen);
        mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        mobileMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        document.body.classList.toggle('mobile-menu-open', isOpen && window.innerWidth <= 640);
        if (window.bodyScrollLock && typeof window.bodyScrollLock[isOpen ? 'lock' : 'unlock'] === 'function') {
            window.bodyScrollLock[isOpen ? 'lock' : 'unlock']('mobile-menu');
        }
        refreshHeaderState();
    }

    function syncMobileSearchState() {
        if (!mobileSearchInput || !mobileClearSearchBtn) return;
        mobileClearSearchBtn.classList.toggle('hidden', mobileSearchInput.value.trim() === '');
    }

    function syncSearchValue(value) {
        const searchInput = document.getElementById('search-input');

        if (searchInput && searchInput.value !== value) {
            searchInput.value = value;
        }

        if (mobileSearchInput && mobileSearchInput.value !== value) {
            mobileSearchInput.value = value;
        }

        syncMobileSearchState();
    }

    function clearAllSearch() {
        syncSearchValue('');

        if (typeof clearSearch === 'function') {
            clearSearch();
        } else if (typeof searchProducts === 'function') {
            searchProducts('');
        }

        syncMobileSearchState();
    }

    updateHeaderTheme();
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    window.addEventListener('resize', refreshHeaderState);
    window.addEventListener('load', refreshHeaderState);
    window.addEventListener('pageshow', refreshHeaderState);

    if (document.fonts && typeof document.fonts.ready === 'object') {
        document.fonts.ready.then(refreshHeaderState).catch(() => {});
    }

    // ================= INIT CART =================
    loadCart();
    updateCartUI();

    // ================= LOAD PRODUCTS =================
    loadProducts();

    // ================= SEARCH =================
    const searchBtn = document.getElementById('search-btn');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const searchInput = document.getElementById('search-input');

    searchBtn?.addEventListener('click', toggleSearchInput);
    clearSearchBtn?.addEventListener('click', clearAllSearch);

    searchInput?.addEventListener('input', e => {
        syncSearchValue(e.target.value);
        searchProducts(e.target.value);
    });

    searchInput?.addEventListener('keydown', e => {
        if (e.key === 'Escape') clearAllSearch();
    });

    mobileSearchInput?.addEventListener('input', e => {
        syncSearchValue(e.target.value);
        searchProducts(e.target.value);
    });

    mobileClearSearchBtn?.addEventListener('click', clearAllSearch);

    mobileMenuToggle?.addEventListener('click', e => {
        e.stopPropagation();
        setMobileMenuOpen(mobileMenu?.classList.contains('hidden'));
    });

    mobileAuthBtn?.addEventListener('click', () => {
        document.getElementById('auth-btn')?.click();
        setMobileMenuOpen(false);
    });

    mobileAdminBtn?.addEventListener('click', () => {
        document.getElementById('admin-btn')?.click();
        setMobileMenuOpen(false);
    });

    mobileLogoutBtn?.addEventListener('click', () => {
        document.getElementById('logout-btn')?.click();
        setMobileMenuOpen(false);
    });

    document.addEventListener('click', event => {
        if (!mobileMenu || !mobileMenuToggle) return;
        if (mobileMenu.classList.contains('hidden')) return;
        if (mobileMenu.contains(event.target) || mobileMenuToggle.contains(event.target)) return;
        setMobileMenuOpen(false);
    });

    mobileMenu?.addEventListener('click', event => {
        if (event.target.closest('a[href^="#"]')) {
            setMobileMenuOpen(false);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            setMobileMenuOpen(false);
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 640) {
            setMobileMenuOpen(false);
            return;
        }

        refreshHeaderState();
    });

    document.addEventListener('auth:changed', () => {
        setMobileMenuOpen(false);
        refreshHeaderState();
    });

    syncSearchValue(searchInput?.value || '');

    // Cart open/close is handled by ui.js - no duplicate binding here.

    // ================= CAROUSEL =================
    // Carousel elements no longer exist; skip binding.

    // ================= PRODUCT: Add to Cart (event delegation) =================
    const productsContainer = document.getElementById('products-container');
    productsContainer?.addEventListener('click', e => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.productId;
        const name = btn.dataset.productName;
        const salePrice = btn.dataset.productSaleprice || 'Rp0';
        const image1 = btn.dataset.productImage || '';

        const product = {
            id,
            name,
            salePrice,
            image1,
            price: parseInt((salePrice || '').toString().replace(/[^\d]/g, ''), 10) || 0,
            quantity: 1
        };

        if (typeof addToCart === 'function') addToCart(product);
    });

    // ================= CART: handle increase/decrease/remove via delegation =================
    const cartItems = document.getElementById('cart-items');
    cartItems?.addEventListener('click', e => {
        const dec = e.target.closest('.cart-decrease');
        const inc = e.target.closest('.cart-increase');
        const rem = e.target.closest('.cart-remove');

        if (dec) {
            const id = dec.dataset.id;
            const span = document.querySelector(`[data-quantity-id="${id}"]`);
            const current = Number(span?.textContent) || 0;
            updateQuantity(id, current - 1);
            return;
        }

        if (inc) {
            const id = inc.dataset.id;
            const span = document.querySelector(`[data-quantity-id="${id}"]`);
            const current = Number(span?.textContent) || 0;
            updateQuantity(id, current + 1);
            return;
        }

        if (rem) {
            const id = rem.dataset.id;
            removeFromCart(id);
        }
    });
});

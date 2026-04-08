document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const hero = document.querySelector('.hero-showcase');

    function updateHeaderTheme() {
        if (!header || !hero) return;

        const heroBottom = hero.offsetTop + hero.offsetHeight;
        const headerHeight = header.offsetHeight || 0;
        const triggerPoint = heroBottom - headerHeight - 32;
        const shouldUseSolid = window.scrollY >= triggerPoint;

        header.classList.toggle('header-solid', shouldUseSolid);
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

    updateHeaderTheme();
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    window.addEventListener('resize', updateHeaderTheme);

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
    clearSearchBtn?.addEventListener('click', clearSearch);

    searchInput?.addEventListener('input', e => {
        searchProducts(e.target.value);
    });

    searchInput?.addEventListener('keydown', e => {
        if (e.key === 'Escape') clearSearch();
    });

    // Cart open/close is handled by ui.js — no duplicate binding here.

    // ================= CAROUSEL =================
    // Carousel elements no longer exist; skip binding.

    // ================= PRODUCT: Add to Cart (event delegation) =================
    const productsContainer = document.getElementById('products-container');
    productsContainer?.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.productId;
        const name = btn.dataset.productName;
        const salePrice = btn.dataset.productSaleprice || 'Rp0';
        const image1 = btn.dataset.productImage || '';

        // build product object and call addToCart
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
    cartItems?.addEventListener('click', (e) => {
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
            return;
        }
    });

});

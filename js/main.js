document.addEventListener('DOMContentLoaded', () => {

    // ================= INIT CART =================
    loadCart();
    updateCartUI();

    // ================= LOAD PRODUCTS =================
    const savedPage = typeof restoreCurrentPage === 'function' ? restoreCurrentPage() : 0;
    if (savedPage > 0) {
        for (let i = 0; i < savedPage; i++) {
            loadProducts();
        }
    } else {
        loadProducts();
    }

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

    // ================= LOAD MORE (skipped in load-all mode) =================
    if (!window.LOAD_ALL) {
        const loadMoreBtn = document.getElementById('load-more-btn');
        loadMoreBtn?.addEventListener('click', () => {
            showLoading(true);
            setTimeout(() => {
                loadProducts();
                showLoading(false);
            }, 800);
        });
    }

    // ================= OPEN CART =================
    document.getElementById('cart-btn')
        ?.addEventListener('click', openCart);


    // ================= CAROUSEL =================
    startAutoScroll();

    const carousel = document.querySelector('.carousel');
    carousel?.addEventListener('mouseenter', stopAutoScroll);
    carousel?.addEventListener('mouseleave', startAutoScroll);

    document.querySelectorAll('input[name="carousel"]').forEach(input => {
        input.addEventListener('change', () => {
            currentSlide = parseInt(input.id.split('-')[1]);
            stopAutoScroll();
            setTimeout(startAutoScroll, 8000);
        });
    });

    // ================= CLOSE CART OVERLAY =================
    document.getElementById('cart-overlay')
        ?.addEventListener('click', closeCart);

    // ================= PRODUCT: Add to Cart (event delegation) =================
    const productsContainer = document.getElementById('products-container');
    productsContainer?.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;
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

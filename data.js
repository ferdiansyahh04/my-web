// Product data and Supabase-backed product store.
// Cart logic lives in js/cart.js; carousel in js/carousel.js.

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function parsePrice(priceString) {
    if (!priceString) return 0;
    return parseInt(priceString.replace(/[^\d]/g, ''), 10) || 0;
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

let allProducts = [];

// ---------- Product helper functions ----------

function normalizeProduct(product) {
    if (!product) return product;
    if (!product.id) product.id = slugify((product.name || '') + '-' + Date.now());
    product.price = parsePrice(product.salePrice || product.originalPrice || '') || (product.price || 0);
    if (!product.salePrice) product.salePrice = product.price ? `Rp${product.price.toLocaleString('id-ID')}` : 'Rp0';
    product.image1 = product.image1 || product.image || '';
    product.image2 = product.image2 || '';
    product.quantity = product.quantity || 0;
    if (product.hasDiscount && product.originalPrice) {
        const original = parseInt((product.originalPrice || '').toString().replace(/[^\d]/g, '')) || 0;
        const sale = parseInt((product.salePrice || '').toString().replace(/[^\d]/g, '')) || 0;
        if (original > 0 && sale > 0) {
            product.discountPercentage = Math.round(((original - sale) / original) * 100) + '%';
        }
    }
    return product;
}

// ---------- Store UI state helpers ----------

function showStoreMessage(icon, title, subtitle) {
    var container = document.getElementById('products-container');
    var noResults = document.getElementById('no-results');
    if (container) container.innerHTML = '';
    if (noResults) noResults.classList.add('hidden');

    var msg = document.createElement('div');
    msg.className = 'w-full text-center py-20';
    msg.innerHTML =
        '<div class="text-4xl mb-4">' + icon + '</div>' +
        '<h3 class="text-lg font-medium text-gray-900 mb-1">' + escapeHTML(title) + '</h3>' +
        '<p class="text-sm text-gray-400">' + escapeHTML(subtitle) + '</p>';
    if (container) container.appendChild(msg);
}

function showErrorState(subtitle) {
    showStoreMessage('⚠️', 'Gagal memuat produk', subtitle);
}

function showEmptyState(subtitle) {
    showStoreMessage('🔧', 'Belum ada produk', subtitle);
}

// ---------- Supabase product fetch with retry ----------

var _supabaseRetryCount = 0;
var MAX_RETRIES = 1;
var RETRY_DELAY_MS = 2000;

async function loadProductsFromSupabase() {
    if (!window.supabaseAPI || typeof window.supabaseAPI.fetchProducts !== 'function') return;
    try {
        var remote = await window.supabaseAPI.fetchProducts();

        if (remote === null) {
            // fetchProducts returned null — Supabase client may not be ready
            throw new Error('Supabase returned null (client may not be initialized)');
        }

        if (remote.length === 0) {
            showEmptyState('Produk sedang dipersiapkan, stay tuned!');
            return;
        }

        _supabaseRetryCount = 0; // reset on success
        allProducts = remote.map(function (p) { return normalizeProduct(p); });
        filteredProducts = allProducts.slice();
        if (typeof loadProducts === 'function') loadProducts();
    } catch (e) {
        console.error('[VoltX] Supabase fetch failed:', e);

        if (_supabaseRetryCount < MAX_RETRIES) {
            _supabaseRetryCount++;
            console.log('[VoltX] Retrying product fetch in ' + (RETRY_DELAY_MS / 1000) + 's... (attempt ' + (_supabaseRetryCount + 1) + ')');
            showStoreMessage('⏳', 'Memuat ulang...', 'Mencoba menghubungi server...');
            setTimeout(loadProductsFromSupabase, RETRY_DELAY_MS);
        } else {
            showErrorState('Gagal memuat produk. Coba refresh halaman.');
        }
    }
}

function emitProductsChanged() {
    try {
        document.dispatchEvent(new CustomEvent('products:changed', { detail: { } }));
    } catch (e) { /* ignore */ }
}

// Public API for other modules (admin UI) — backed by Supabase
window.productStore = {
    getAll: () => allProducts,
    addProduct: async function (prod) {
        var p = normalizeProduct(Object.assign({}, prod));
        var saved = await window.supabaseAPI.addProduct(p);
        if (!saved) throw new Error('Product was not saved.');
        p = normalizeProduct(saved);
        allProducts.unshift(p);
        emitProductsChanged();
        return p;
    },
    updateProduct: async function (id, updates) {
        var idx = allProducts.findIndex(x => x.id === id);
        if (idx === -1) return null;
        var saved = await window.supabaseAPI.updateProduct(id, updates);
        if (!saved) throw new Error('Product update was not saved.');
        allProducts[idx] = normalizeProduct(saved);
        emitProductsChanged();
        return allProducts[idx];
    },
    deleteProduct: async function (id) {
        var before = allProducts.length;
        await window.supabaseAPI.deleteProduct(id);
        allProducts = allProducts.filter(x => x.id !== id);
        if (allProducts.length === before) return false;
        emitProductsChanged();
        return true;
    }
};

// Load from Supabase on DOM ready
document.addEventListener('DOMContentLoaded', loadProductsFromSupabase);

let filteredProducts = [...allProducts];

function buildProductFallbackImage() {
    return "data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22500%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f3f4f6%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2216%22 fill=%22%23999%22>Product</text></svg>";
}

function createBadge(label, className, svgMarkup) {
    var badge = document.createElement('span');
    badge.className = className;

    if (svgMarkup) {
        badge.insertAdjacentHTML('beforeend', svgMarkup);
        badge.appendChild(document.createTextNode(' ' + label));
        return badge;
    }

    badge.textContent = label;
    return badge;
}

function buildProductBadgeGroups(product, available) {
    if (!available) {
        var soldOutWrap = document.createElement('div');
        soldOutWrap.className = 'absolute top-3 left-3 z-10';
        soldOutWrap.appendChild(createBadge('Sold out', 'badge-soldout'));
        return [soldOutWrap];
    }

    var groups = [];
    var leftWrap = document.createElement('div');
    leftWrap.className = 'absolute top-3 left-3 z-10 flex flex-col gap-2';
    var rightWrap = document.createElement('div');
    rightWrap.className = 'absolute top-3 right-3 z-10 flex flex-col gap-2 items-end';

    if (product.isNew) {
        leftWrap.appendChild(createBadge(
            'New',
            'badge-new',
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.09 6.26L20.18 9l-5.09 3.74L16.18 19 12 15.27 7.82 19l1.09-6.26L3.82 9l6.09-.74z"/></svg>'
        ));
    }

    if (product.isBestSeller) {
        rightWrap.appendChild(createBadge(
            'Best seller',
            'badge-bestseller',
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
        ));
    }

    if (product.hasDiscount && product.discountPercentage) {
        if (leftWrap.childNodes.length === 0) leftWrap.appendChild(createBadge(product.discountPercentage, 'badge-discount'));
        else rightWrap.appendChild(createBadge(product.discountPercentage, 'badge-discount'));
    }

    if (leftWrap.childNodes.length > 0) groups.push(leftWrap);
    if (rightWrap.childNodes.length > 0) groups.push(rightWrap);
    return groups;
}

function createProductCard(product) {
    var available = product.hasOwnProperty('available') ? !!product.available : true;
    var productHref = available ? (product.url || '#') : 'javascript:void(0)';
    var fallbackImage = buildProductFallbackImage();

    var card = document.createElement('div');
    card.className = 'product-item group opacity-0 translate-y-6';

    var media = document.createElement('div');
    media.className = 'relative overflow-hidden rounded-xl bg-neutral-100 aspect-[3/4]';

    var imageLink = document.createElement('a');
    imageLink.href = productHref;
    imageLink.className = 'block w-full h-full' + (available ? '' : ' cursor-not-allowed opacity-70');
    if (available) {
        imageLink.target = '_blank';
        imageLink.rel = 'noopener noreferrer';
    } else {
        imageLink.addEventListener('click', function (event) {
            event.preventDefault();
        });
    }

    buildProductBadgeGroups(product, available).forEach(function (group) {
        imageLink.appendChild(group);
    });

    var primaryImage = document.createElement('img');
    primaryImage.src = product.image1 || fallbackImage;
    primaryImage.alt = product.name || 'Product';
    primaryImage.className = 'product-img w-full h-full object-cover block group-hover:opacity-0 transition-opacity duration-500';
    primaryImage.onerror = function () {
        primaryImage.src = fallbackImage;
    };

    var hoverImage = document.createElement('img');
    hoverImage.src = product.image2 || product.image1 || fallbackImage;
    hoverImage.alt = product.name || 'Product';
    hoverImage.className = 'product-img absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500';
    hoverImage.style.pointerEvents = 'none';
    hoverImage.onerror = function () {
        hoverImage.src = primaryImage.src;
    };

    imageLink.appendChild(primaryImage);
    imageLink.appendChild(hoverImage);
    media.appendChild(imageLink);

    var quickAddWrap = document.createElement('div');
    quickAddWrap.className = 'product-quick-add absolute inset-x-0 bottom-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-20';

    var quickAddButton = document.createElement('button');
    quickAddButton.type = 'button';

    if (available) {
        quickAddButton.dataset.productId = product.id;
        quickAddButton.dataset.productName = product.name || '';
        quickAddButton.dataset.productSaleprice = product.salePrice || 'Rp0';
        quickAddButton.dataset.productImage = product.image1 || '';
        quickAddButton.className = 'add-to-cart-btn w-full text-center text-gray-900 text-xs font-semibold uppercase tracking-wider py-3 rounded-xl transition-colors duration-200';
        quickAddButton.textContent = 'Add to cart';
    } else {
        quickAddButton.disabled = true;
        quickAddButton.className = 'w-full text-center bg-gray-200 text-gray-400 text-xs font-semibold uppercase tracking-wider py-3 rounded-xl cursor-not-allowed';
        quickAddButton.textContent = 'Unavailable';
    }

    quickAddWrap.appendChild(quickAddButton);
    media.appendChild(quickAddWrap);

    var contentLink = document.createElement('a');
    contentLink.href = productHref;
    contentLink.className = 'block mt-3 space-y-0.5' + (available ? '' : ' cursor-not-allowed opacity-70');
    if (available) {
        contentLink.target = '_blank';
        contentLink.rel = 'noopener noreferrer';
    } else {
        contentLink.addEventListener('click', function (event) {
            event.preventDefault();
        });
    }

    if (product.category) {
        var category = document.createElement('span');
        category.className = 'text-[11px] uppercase tracking-wider text-gray-400 font-medium';
        category.textContent = product.category;
        contentLink.appendChild(category);
    }

    var title = document.createElement('h3');
    title.className = 'text-sm font-medium text-gray-900 leading-snug truncate';
    title.textContent = product.name || 'Product';
    contentLink.appendChild(title);

    var priceWrap = document.createElement('div');
    priceWrap.className = 'pt-0.5';

    if (product.hasDiscount) {
        var priceRow = document.createElement('div');
        priceRow.className = 'flex items-baseline gap-2';

        var salePrice = document.createElement('span');
        salePrice.className = 'text-sm font-semibold text-gray-900';
        salePrice.textContent = product.salePrice || 'Rp0';

        var originalPrice = document.createElement('span');
        originalPrice.className = 'text-xs line-through text-gray-400';
        originalPrice.textContent = product.originalPrice || '';

        priceRow.appendChild(salePrice);
        priceRow.appendChild(originalPrice);
        priceWrap.appendChild(priceRow);
    } else {
        var priceOnly = document.createElement('div');
        priceOnly.className = 'text-sm font-semibold text-gray-900';
        priceOnly.textContent = product.salePrice || 'Rp0';
        priceWrap.appendChild(priceOnly);
    }

    contentLink.appendChild(priceWrap);

    card.appendChild(media);
    card.appendChild(contentLink);
    return card;
}

function clearProducts() {
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = '';
    }
}

function loadProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = '';
    filteredProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });

    const noResults = document.getElementById('no-results');
    if (noResults) noResults.classList.toggle('hidden', filteredProducts.length > 0);

    // Animate new products with stagger
    setTimeout(() => {
        const newProducts = container.querySelectorAll('.product-item.opacity-0');
        newProducts.forEach((product, index) => {
            setTimeout(() => {
                product.classList.remove('opacity-0', 'translate-y-6');
                product.classList.add('opacity-100', 'translate-y-0');
            }, index * 80);
        });
    }, 50);

}

function searchProducts(query) {
    const searchTerm = query.toLowerCase().trim();

    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm)
        );
    }

    clearProducts();

    const noResults = document.getElementById('no-results');
    if (filteredProducts.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
    } else {
        if (noResults) noResults.classList.add('hidden');
        loadProducts();
    }
}

function setSearchExpanded(isOpen) {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');

    if (!searchInput) return;

    searchInput.dataset.open = isOpen ? 'true' : 'false';

    if (isOpen) {
        searchInput.classList.remove('w-0', 'opacity-0', 'px-0', 'py-0');
        searchInput.classList.add('w-64', 'opacity-100');
        if (clearBtn) clearBtn.classList.toggle('opacity-0', searchInput.value.trim() === '');
        return;
    }

    searchInput.classList.add('w-0', 'opacity-0', 'px-0', 'py-0');
    searchInput.classList.remove('w-64', 'opacity-100');
    if (clearBtn) clearBtn.classList.add('opacity-0');
}

function toggleSearchInput() {
    const searchInput = document.getElementById('search-input');

    if (!searchInput) return;

    const isCollapsed = searchInput.dataset.open !== 'true';

    if (isCollapsed) {
        setSearchExpanded(true);
        setTimeout(() => searchInput.focus(), 250);
    } else if (searchInput.value.trim() === '') {
        setSearchExpanded(false);
    }
}

function clearSearch() {
    const searchInput = document.getElementById('search-input');

    if (!searchInput) return;

    searchInput.value = '';
    searchProducts('');
    setSearchExpanded(false);
}

function syncSearchClearButton() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');

    if (!searchInput || !clearBtn) return;

    if (searchInput.dataset.open !== 'true') {
        clearBtn.classList.add('opacity-0');
        return;
    }

    clearBtn.classList.toggle('opacity-0', searchInput.value.trim() === '');
}

document.addEventListener('click', function (event) {
    const searchWrap = document.querySelector('.navbar-search-wrap');
    const searchInput = document.getElementById('search-input');

    if (!searchWrap || !searchInput) return;
    if (searchWrap.contains(event.target)) return;
    if (searchInput.dataset.open !== 'true') return;
    if (searchInput.value.trim() !== '') return;

    setSearchExpanded(false);
});

document.addEventListener('input', function (event) {
    if (event.target && event.target.id === 'search-input') {
        syncSearchClearButton();
    }
});

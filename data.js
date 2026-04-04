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

// Load products from Supabase. Falls back to hardcoded allProducts on failure.
async function loadProductsFromSupabase() {
    if (!window.supabaseAPI || typeof window.supabaseAPI.fetchProducts !== 'function') return;
    try {
        var remote = await window.supabaseAPI.fetchProducts();
        if (remote && remote.length > 0) {
            allProducts = remote.map(function (p) { return normalizeProduct(p); });
            filteredProducts = allProducts.slice();
            if (typeof loadProducts === 'function') loadProducts();
        }
    } catch (e) {
        console.warn('Failed to load products from Supabase, using defaults', e);
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
        try {
            var saved = await window.supabaseAPI.addProduct(p);
            if (saved) p = normalizeProduct(saved);
        } catch (e) {
            console.warn('Supabase addProduct failed', e);
        }
        allProducts.unshift(p);
        emitProductsChanged();
        return p;
    },
    updateProduct: async function (id, updates) {
        var idx = allProducts.findIndex(x => x.id === id);
        if (idx === -1) return null;
        try {
            await window.supabaseAPI.updateProduct(id, updates);
        } catch (e) {
            console.warn('Supabase updateProduct failed', e);
        }
        allProducts[idx] = normalizeProduct(Object.assign({}, allProducts[idx], updates));
        emitProductsChanged();
        return allProducts[idx];
    },
    deleteProduct: async function (id) {
        var before = allProducts.length;
        try {
            await window.supabaseAPI.deleteProduct(id);
        } catch (e) {
            console.warn('Supabase deleteProduct failed', e);
        }
        allProducts = allProducts.filter(x => x.id !== id);
        if (allProducts.length === before) return false;
        emitProductsChanged();
        return true;
    }
};

// Load from Supabase on DOM ready
document.addEventListener('DOMContentLoaded', loadProductsFromSupabase);

let filteredProducts = [...allProducts];

function createProductHTML(product) {
    const escapedName = escapeHTML(product.name);

    // availability: default true unless explicitly false
    const available = product.hasOwnProperty('available') ? !!product.available : true;

    const priceBlock = product.hasDiscount
        ? `<div class="flex items-baseline gap-2">
                <span class="text-base font-bold text-gray-900">${product.salePrice}</span>
                <span class="text-xs line-through text-gray-400">${product.originalPrice || ''}</span>
            </div>`
        : `<div class="text-base font-bold text-gray-900">${product.salePrice}</div>`;

    // Build badges array (supports multiple badges)
    let badges = '';
    if (!available) {
        badges = `<span class="badge-soldout absolute top-3 left-3 z-10">Sold out</span>`;
    } else {
        const leftBadges = [];
        const rightBadges = [];

        if (product.isNew) {
            leftBadges.push(`<span class="badge-new"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.09 6.26L20.18 9l-5.09 3.74L16.18 19 12 15.27 7.82 19l1.09-6.26L3.82 9l6.09-.74z"/></svg> New</span>`);
        }
        if (product.isBestSeller) {
            rightBadges.push(`<span class="badge-bestseller"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Best seller</span>`);
        }
        if (product.hasDiscount && product.discountPercentage) {
            const side = leftBadges.length === 0 ? leftBadges : rightBadges;
            side.push(`<span class="badge-discount">${product.discountPercentage}</span>`);
        }

        const left = leftBadges.length ? `<div class="absolute top-3 left-3 z-10 flex flex-col gap-2">${leftBadges.join('')}</div>` : '';
        const right = rightBadges.length ? `<div class="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">${rightBadges.join('')}</div>` : '';
        badges = left + right;
    }

    const categoryTag = product.category
        ? `<span class="text-[11px] uppercase tracking-wider text-gray-400 font-medium">${product.category}</span>`
        : '';

    const productHref = available ? product.url : 'javascript:void(0)';
    const productTarget = available ? ' target="_blank" rel="noopener noreferrer"' : '';
    const productAnchorAttrs = available ? '' : 'onclick="return false;"';

    return `
        <div class="product-item group opacity-0 translate-y-6">
            <div class="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[3/4]">
                <a href="${productHref}"${productTarget} ${productAnchorAttrs} class="block w-full h-full ${available ? '' : 'cursor-not-allowed opacity-70'}">
                    ${badges}
                    <img src="${product.image1}" alt="${escapedName}" class="product-img w-full h-full object-cover block group-hover:opacity-0 transition-opacity duration-500" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22500%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f3f4f6%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2216%22 fill=%22%23999%22>Product</text></svg>'">
                    <img src="${product.image2}" alt="${escapedName}" class="product-img absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500" style="pointer-events:none;">
                </a>
                <!-- Quick add overlay -->
                <div class="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                    ${available
                        ? `<button type="button" data-product-id="${product.id}" data-product-name="${escapedName}" data-product-saleprice="${product.salePrice}" data-product-image="${product.image1}" class="add-to-cart-btn w-full text-center bg-white text-gray-900 text-xs font-semibold uppercase tracking-wider py-3 rounded-xl shadow-lg hover:bg-gray-900 hover:text-white transition-colors duration-200">Add to cart</button>`
                        : `<button type="button" disabled class="w-full text-center bg-gray-200 text-gray-400 text-xs font-semibold uppercase tracking-wider py-3 rounded-xl cursor-not-allowed">Unavailable</button>`
                    }
                </div>
            </div>
            <a href="${productHref}"${productTarget} ${productAnchorAttrs} class="block mt-4 space-y-1 ${available ? '' : 'cursor-not-allowed opacity-70'}">
                ${categoryTag}
                <h3 class="text-sm font-medium text-gray-900 leading-snug line-clamp-2">${escapeHTML(product.name)}</h3>
                <div class="pt-0.5">
                    ${priceBlock}
                </div>
            </a>
        </div>
    `;
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
        const productElement = document.createElement('div');
        productElement.innerHTML = createProductHTML(product);
        container.appendChild(productElement.firstElementChild);
    });

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

function toggleSearchInput() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');

    if (!searchInput) return;

    if (searchInput.classList.contains('w-0')) {
        searchInput.classList.remove('w-0', 'opacity-0');
        searchInput.classList.add('w-64', 'opacity-100');
        if (clearBtn) clearBtn.classList.remove('opacity-0');
        setTimeout(() => searchInput.focus(), 300);
    } else if (searchInput.value.trim() === '') {
        searchInput.classList.add('w-0', 'opacity-0');
        searchInput.classList.remove('w-64', 'opacity-100');
        if (clearBtn) clearBtn.classList.add('opacity-0');
    }
}

function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');

    if (!searchInput) return;

    searchInput.value = '';
    searchInput.classList.add('w-0', 'opacity-0');
    searchInput.classList.remove('w-64', 'opacity-100');
    if (clearBtn) clearBtn.classList.add('opacity-0');

    searchProducts('');
}


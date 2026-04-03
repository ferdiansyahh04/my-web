// Product data and Supabase-backed product store.
// Cart logic lives in js/cart.js; carousel in js/carousel.js.
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

let allProducts = [
    {
        name: "VOYAGER68 65%",
        originalPrice: "Rp1.249.000",
        salePrice: "Rp789.000",
        url: "https://tk.tokopedia.com/ZShWGTTsD/",
        image1: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/aed31d6e7bd54b449fb735aaca5c4c97~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/4b105c9e7bc844568c723fc0cebb652f~.jpeg",
        hasDiscount: true,
        isBestSeller: true
    },
    {
        name: "VOYAGER68 v2 Lite 65%",
        originalPrice: "",
        salePrice: "Rp739.000",
        url: "https://tk.tokopedia.com/ZShWbMHRc/",
        image1: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/55ce93aeb01c4cad8e1ff6cb9904ef03~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/37a80017717f4ddc8f0ebdf867b1f026~.jpeg",
        hasDiscount: false
    },
    {
        name: "APOLLO61 Lite 60%",
        originalPrice: "Rp549.000",
        salePrice: "Rp529.000",
        url: "https://tk.tokopedia.com/ZShWpWqeS/",
        image1: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/ccee4b8d89b74fc8999d4742baf5139d~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/d5652de9fb844df5ae9ea641413251d2~.jpeg",
        hasDiscount: true
    },
    {
        name: "ROVER84 75% Wireless",
        originalPrice: "Rp1.249.000",
        salePrice: "Rp889.000",
        url: "https://tk.tokopedia.com/ZShWsxUav/",
        image1: "https://pressplayid.com/cdn/shop/products/d3b1898b-8c95-4953-9beb-4498b39edf24-copy-of-photo-31-10-23-141634.jpg?v=1705915017",
        image2: "https://pressplayid.com/cdn/shop/products/a767ea16-9b8d-4960-a5d1-b17970dc30ba-copy-of-photo-31-10-23-141826.jpg?v=1705915017",
        hasDiscount: true,
        isBestSeller: true
    },
    {
        name: "Noir Timeless1800 96% Wireless",
        originalPrice: "Rp1.799.000",
        salePrice: "Rp1.299.000",
        url: "https://tokopedia.link/xB3JWXc1MTb",
        image1: "https://images.tokopedia.net/img/cache/900/VqbcmM/2025/2/20/1fe34343-5928-4c5c-b3cd-b0ac88669b5c.jpg",
        image2: "https://images.tokopedia.net/img/cache/900/VqbcmM/2025/2/20/bde9baa6-4b00-418f-9c85-067cf2b6cd96.jpg",
        hasDiscount: true,
        isBestSeller: true
    },
    {
        name: "Noir Timeless82 v2 Classic Edition",
        originalPrice: "Rp1.099.000",
        salePrice: "Rp849.000",
        url: "https://tokopedia.link/ij1iYOm1MTb",
        image1: "https://images.tokopedia.net/img/cache/900/VqbcmM/2025/2/20/85587a61-1be6-4675-afed-c54ba1699ddf.jpg",
        image2: "https://images.tokopedia.net/img/cache/900/VqbcmM/2025/2/20/9a11ba0a-11b6-4779-91cb-17a6be775371.jpg",
        hasDiscount: true
    },
    {
        name: "Noir Timeless HE 75% Hall Effect",
        originalPrice: "Rp1.700.000",
        salePrice: "Rp1.469.000",
        url: "https://tokopedia.link/3LN4KbI1MTb",
        image1: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/8/22/ecfcbb01-c1c1-4295-a523-efcbfd1325b0.jpg",
        image2: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/8/23/3b201e07-2028-4b12-8ae8-925ea3716924.jpg",
        hasDiscount: true,
        isNew: true
    },
    {
        name: "Noir Timeless82 v2 Special Edition",
        originalPrice: "Rp1.499.000",
        salePrice: "Rp1.099.000",
        url: "https://tokopedia.link/l4K0KRX1MTb",
        image1: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/10/17/d2c92cf0-9b6b-4377-8efa-d96347709fa5.jpg",
        image2: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/10/17/3b2a4d25-8178-4b4e-817d-4e5d929fa1b1.jpg",
        hasDiscount: true,
        isNew: true
    },
    {
        name: "IRIS Ultralight Ergonomic",
        originalPrice: "Rp559.000",
        salePrice: "Rp499.000",
        url: "https://tk.tokopedia.com/ZShWGAfTE/",
        image1: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/6f16e73fe35c4fa7ae0a57f87f15e16e~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/ea67ef43463a4076b524d1b50303b615~.jpeg",
        hasDiscount: true
    },
    {
        name: "ICARUS V2 Mini Ultralight",
        originalPrice: "",
        salePrice: "Rp579.000",
        url: "https://tk.tokopedia.com/ZSh7eS8CY/",
        image1: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/11/14/5516e144-b832-42cf-b339-f829e9da89ad.jpg",
        image2: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/11/14/8dd57a06-3791-46d1-bbed-34819832ccc7.jpg",
        hasDiscount: false,
        isNew: true
    },
    {
        name: "Rexus RIVA RX-120",
        originalPrice: "Rp503.000",
        salePrice: "Rp359.000",
        url: "https://tk.tokopedia.com/ZSh7dLxFu/",
        image1: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/517479cf04564e408fe2f7f584d35218~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/7513a28331e143e59a0aceb9ce110f36~.jpeg",
        hasDiscount: true
    },
    {
        name: "Noir M1-NEX Wireless",
        originalPrice: "Rp500.000",
        salePrice: "Rp299.000",
        url: "https://tokopedia.link/5hWiF7n0MTb",
        image1: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/7/30/81ba1aa7-d9be-4d05-a071-9825cb983b75.jpg",
        image2: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/7/30/67e7ea80-31cb-4b72-9d6e-d234a478946f.jpg",
        hasDiscount: true
    },
    {
        name: "LIQUID Mousepad Deskmat",
        originalPrice: "",
        salePrice: "Rp199.000",
        url: "https://tk.tokopedia.com/ZShvPweL6/",
        image1: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/9d439750f87245a5986e354cdd730f4c~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/d311321d777a4f76bcdd827983c29f8e~.jpeg",
        hasDiscount: false
    },
    {
        name: "MATCHA Mousepad Deskmat",
        originalPrice: "",
        salePrice: "Rp249.000",
        url: "https://tk.tokopedia.com/ZShvaucQS/",
        image1: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/7e3cf23aed8f4588bbbcae9391f5284f~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/84b31495b5384cd085e3dd3afabadb63~.jpeg",
        hasDiscount: false
    },
    {
        name: "PALETTE Mousepad Deskmat",
        originalPrice: "",
        salePrice: "Rp89.000",
        url: "https://tk.tokopedia.com/ZShvasVon/",
        image1: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/2d85a8b17f3744a1ae7bef28ac881eb2~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/fa22772613e348d38191a3d45372402d~.jpeg",
        hasDiscount: false
    },
    {
        name: "Noir Inochi Deskmat",
        originalPrice: "Rp300.000",
        salePrice: "Rp199.000",
        url: "https://tokopedia.link/kRSFUNu2MTb",
        image1: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/7/19/d82ca090-f346-4d22-a9c5-1ba923157afe.jpg",
        image2: "https://images.tokopedia.net/img/cache/900/VqbcmM/2024/7/19/dd2561d7-bf7c-4df6-a1d3-4fcebd612ded.jpg",
        hasDiscount: true
    },
    {
        name: "Rexus Daxa Sedna",
        originalPrice: "Rp999.000",
        salePrice: "Rp599.000",
        url: "https://tk.tokopedia.com/ZShvudVNM/",
        image1: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/1190a290ab3148dea4935f3072521dd8~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/o3syd0/1997/1/1/4a08d7afae1349779c48580ecf2907b4~.jpeg",
        hasDiscount: true
    },
    {
        name: "POLARIS Headphones",
        originalPrice: "",
        salePrice: "Rp389.000",
        url: "https://tk.tokopedia.com/ZShcdhPmS/",
        image1: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/275cbae69c7445d6a528e7827409c6ea~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/5581f9b81e9c40eaae0c0ed9d257153b~.jpeg",
        hasDiscount: false
    },
    {
        name: "Rexus Vonix",
        originalPrice: "Rp199.000",
        salePrice: "Rp115.000",
        url: "https://tk.tokopedia.com/ZSkJ3hKCj/",
        image1: "https://images.tokopedia.net/img/cache/900/VqbcmM/2021/11/1/8c433ed4-1e0a-49f9-9475-053ba9b7e2d0.jpg",
        image2: "https://images.tokopedia.net/img/cache/900/VqbcmM/2021/11/1/dee63953-617d-49e0-8998-98314921f1b2.jpg",
        hasDiscount: true
    },
    {
        name: "Rexus Thundervox HX25",
        originalPrice: "Rp379.000",
        salePrice: "Rp299.000",
        url: "https://tk.tokopedia.com/ZSkJTxt2L/",
        image1: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/4bed22a67f5c4fe8b0af6eba845008af~.jpeg",
        image2: "https://images.tokopedia.net/img/cache/900/aphluv/1997/1/1/cb3bfcb4faa74bbfa196a7a6448be020~.jpeg",
        hasDiscount: true
    }
];

// DiscountPercentage
allProducts.forEach(product => {
    if (product.hasDiscount && product.originalPrice) {
        const original = parseInt(product.originalPrice.replace(/[^\d]/g, '')) || 0;
        const sale = parseInt(product.salePrice.replace(/[^\d]/g, '')) || 0;
        if (original > 0 && sale > 0) {
            const discount = Math.round(((original - sale) / original) * 100);
            product.discountPercentage = discount + '%';
        }
    }
});

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

// Normalize all hardcoded products on initial load
allProducts.forEach(product => {
    if (!product.id) product.id = slugify(product.name || (product.url || ''));
    product.price = parsePrice(product.salePrice || product.originalPrice || '') || 0;
    if (!product.salePrice) product.salePrice = product.price ? `Rp${product.price.toLocaleString('id-ID')}` : 'Rp0';
    product.image1 = product.image1 || product.image || '';
    product.image2 = product.image2 || '';
    product.quantity = product.quantity || 0;
});

// Load from Supabase on DOM ready — replaces hardcoded data if available
document.addEventListener('DOMContentLoaded', loadProductsFromSupabase);

let filteredProducts = [...allProducts];

function createProductHTML(product) {
    const escapedName = product.name.replace(/'/g, "\\'");

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
                <h3 class="text-sm font-medium text-gray-900 leading-snug line-clamp-2">${product.name}</h3>
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


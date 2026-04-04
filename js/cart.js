// ================= CART STATE (in-memory only) =================
let cart = [];

// ================= STORAGE =================
function loadCart() {
    // No-op: cart starts empty on each page load (no persistence)
}

function saveCart() {
    // No-op: cart lives in memory only
}

// ================= CART ACTIONS =================
function addToCart(product) {
    // Ensure product object is present
    if (!product || typeof product !== 'object') return;

    // Friendly slug generator for id when missing
    function slugify(text) {
        if (!text) return (Math.random() + 1).toString(36).substring(7);
        return text.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // Determine id
    const pid = product.id || slugify(product.name || product.salePrice || Date.now());

    // Determine numeric price
    let numericPrice = typeof product.price === 'number' ? product.price : null;
    if (numericPrice === null) {
        if (product.salePrice && typeof product.salePrice === 'string') {
            const parsed = parseInt(product.salePrice.replace(/[^\d]/g, ''), 10);
            numericPrice = Number.isFinite(parsed) ? parsed : 0;
        } else if (product.price && typeof product.price === 'string') {
            const parsed = parseInt(product.price.replace(/[^\d]/g, ''), 10);
            numericPrice = Number.isFinite(parsed) ? parsed : 0;
        } else {
            numericPrice = 0;
        }
    }

    // Friendly salePrice string
    const salePriceStr = product.salePrice || (numericPrice ? `Rp${numericPrice.toLocaleString('id-ID')}` : 'Rp0');

    // Image fallback
    const imageSrc = product.image1 || product.image || product.image2 || '';

    const existingItem = cart.find(item => item.id === pid);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 0) + 1;
    } else {
        cart.push({
            id: pid,
            name: product.name || 'Product',
            price: numericPrice,
            salePrice: salePriceStr,
            image1: imageSrc,
            quantity: 1
        });
    }

    saveCart();
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof showAddToCartNotification === 'function') showAddToCartNotification(product.name || 'Product');
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function updateQuantity(id, qty) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (qty <= 0) {
        removeFromCart(id);
    } else {
        item.quantity = qty;
        saveCart();
        updateCartUI();
    }
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
}

// ================= GETTERS =================
function getCartItems() {
    return cart;
}

function getCartTotalCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotalPrice() {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
}

// ===== EXPOSE CART FUNCTIONS TO GLOBAL =====
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;

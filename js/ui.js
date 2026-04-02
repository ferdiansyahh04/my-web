// ================= CART UI =================
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');
    const emptyCart = document.getElementById('empty-cart');
    const cartTotal = document.getElementById('cart-total');

    const items = getCartItems();
    const totalItems = getCartTotalCount();

    // Toggle header & footer
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.remove('hidden');
        emptyCart?.classList.add('hidden');
        cartFooter?.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
        emptyCart?.classList.remove('hidden');
        cartFooter?.classList.add('hidden');
    }

    // Render items
    if (cartItems) {
        cartItems.innerHTML = items.map(item => `
            <div class="flex items-center space-x-4 py-4 border-b" data-item-id="${item.id}">
                 <img src="${(item.image1 && item.image1 !== 'undefined') ? item.image1 : ''}" 
                     class="w-16 h-16 object-cover rounded"
                     onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f3f4f6%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2210%22 fill=%22%23999%22>Product</text></svg>'">

                <div class="flex-1">
                    <h3 class="font-medium text-sm">${item.name}</h3>
                    <p class="text-gray-600 text-sm">${item.salePrice}</p>

                    <div class="flex items-center space-x-2 mt-2">
                        <button data-action="decrease" data-id="${item.id}" class="cart-decrease w-6 h-6 bg-gray-200 rounded hover:bg-gray-300">−</button>

                        <span class="text-sm min-w-[20px] text-center" data-quantity-id="${item.id}">${item.quantity}</span>

                        <button data-action="increase" data-id="${item.id}" class="cart-increase w-6 h-6 bg-gray-200 rounded hover:bg-gray-300">+</button>
                    </div>
                </div>

                <button data-action="remove" data-id="${item.id}" class="cart-remove text-red-500 hover:text-red-700 p-1">✕</button>
            </div>
        `).join('');
    }

    // Total price
    const total = getCartTotalPrice();
    if (cartTotal) {
        cartTotal.textContent = `Rp${total.toLocaleString('id-ID')}`;
    }
}

// ================= CART SIDEBAR =================
function openCart() {
    document.getElementById('cart-sidebar')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cart-sidebar')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = 'auto';
}

// ================= NOTIFICATION =================
function showAddToCartNotification(productName) {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = `${productName} berhasil ditambahkan ke keranjang!`;

    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add('show'), 50);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ===== EXPOSE UI FUNCTIONS TO GLOBAL =====
window.updateCartUI = updateCartUI;
window.openCart = openCart;
window.closeCart = closeCart;
window.showAddToCartNotification = showAddToCartNotification;

document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', openCart);
    }

    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    // Close button inside cart sidebar
    const closeCartBtn = document.querySelector('.close-cart-btn');
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

    // Checkout button — save pending cart to session and go to checkout page (order created after validation on checkout page)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', (e) => {
        try {
            const items = getCartItems();
            if (!items || items.length === 0) {
                alert('Your cart is empty');
                return;
            }
            try { sessionStorage.setItem('pendingCart', JSON.stringify(items)); } catch (e) { console.warn('Failed to save pending cart', e); }
            // navigate to checkout page where user will fill shipping and finalize
            setTimeout(() => { window.location.href = 'checkout_system.html'; }, 40);
        } catch (err) {
            console.error('Checkout redirect failed', err);
            goToCheckout();
        }
    });
});

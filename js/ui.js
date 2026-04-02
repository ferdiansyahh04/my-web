(function () {
    function qs(id) {
        return document.getElementById(id);
    }

    function buildFallbackImage() {
        return "data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f3f4f6%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2210%22 fill=%22%23999%22>Product</text></svg>";
    }

    function updateCartUI() {
        const cartCount = qs('cart-count');
        const cartItems = qs('cart-items');
        const cartFooter = qs('cart-footer');
        const emptyCart = qs('empty-cart');
        const cartTotal = qs('cart-total');
        const items = getCartItems();
        const totalItems = getCartTotalCount();

        if (totalItems > 0) {
            cartCount.textContent = totalItems;
            cartCount.classList.remove('hidden');
            if (emptyCart) emptyCart.classList.add('hidden');
            if (cartFooter) cartFooter.classList.remove('hidden');
        } else {
            cartCount.classList.add('hidden');
            if (emptyCart) emptyCart.classList.remove('hidden');
            if (cartFooter) cartFooter.classList.add('hidden');
        }

        if (cartItems) {
            const fallbackImage = buildFallbackImage();
            cartItems.innerHTML = items.map(function (item) {
                const imageSrc = (item.image1 && item.image1 !== 'undefined') ? item.image1 : '';
                return `
                <div class="flex items-center space-x-4 py-4 border-b" data-item-id="${item.id}">
                    <img src="${imageSrc}" class="w-16 h-16 object-cover rounded" onerror="this.src='${fallbackImage}'">
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
                </div>`;
            }).join('');
        }

        const total = getCartTotalPrice();
        if (cartTotal) {
            cartTotal.textContent = `Rp${total.toLocaleString('id-ID')}`;
        }
    }

    function openCart() {
        const sidebar = qs('cart-sidebar');
        const overlay = qs('cart-overlay');
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        const sidebar = qs('cart-sidebar');
        const overlay = qs('cart-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = 'auto';
    }

    function showAddToCartNotification(productName) {
        document.querySelectorAll('.notification').forEach(function (notification) {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `${productName} berhasil ditambahkan ke keranjang!`;
        document.body.appendChild(notification);

        setTimeout(function () {
            notification.classList.add('show');
        }, 50);

        setTimeout(function () {
            notification.classList.remove('show');
            setTimeout(function () {
                notification.remove();
            }, 300);
        }, 3000);
    }

    function goToCheckout() {
        window.location.href = 'checkout_system.html';
    }

    function handleCheckoutClick() {
        try {
            const items = getCartItems();
            if (!items || items.length === 0) {
                alert('Your cart is empty');
                return;
            }

            try {
                sessionStorage.setItem('pendingCart', JSON.stringify(items));
            } catch (error) {
                console.warn('Failed to save pending cart', error);
            }

            setTimeout(function () {
                goToCheckout();
            }, 40);
        } catch (error) {
            console.error('Checkout redirect failed', error);
            goToCheckout();
        }
    }

    window.updateCartUI = updateCartUI;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.showAddToCartNotification = showAddToCartNotification;

    document.addEventListener('DOMContentLoaded', function () {
        const cartButton = qs('cart-btn');
        if (cartButton) {
            cartButton.addEventListener('click', openCart);
        }

        const cartOverlay = qs('cart-overlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', closeCart);
        }

        const closeCartButton = document.querySelector('.close-cart-btn');
        if (closeCartButton) {
            closeCartButton.addEventListener('click', closeCart);
        }

        const checkoutButton = qs('checkout-btn');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', handleCheckoutClick);
        }
    });
})();

(function () {
    function qs(id) {
        return document.getElementById(id);
    }

    var activeBodyLocks = new Set();

    function applyBodyLockState() {
        document.body.classList.toggle('scroll-locked', activeBodyLocks.size > 0);
    }

    function lockBodyScroll(lockId) {
        activeBodyLocks.add(lockId || 'default');
        applyBodyLockState();
    }

    function unlockBodyScroll(lockId) {
        if (lockId) {
            activeBodyLocks.delete(lockId);
        } else {
            activeBodyLocks.clear();
        }
        applyBodyLockState();
    }

    window.bodyScrollLock = {
        lock: lockBodyScroll,
        unlock: unlockBodyScroll
    };

    function buildFallbackImage() {
        return "data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f3f4f6%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2210%22 fill=%22%23999%22>Product</text></svg>";
    }

    function showToast(message, type) {
        if (window.auth && typeof window.auth.showToast === 'function') {
            window.auth.showToast(message, type);
        }
    }

    function createQuantityButton(action, id, label) {
        var button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = action;
        button.dataset.id = id;
        button.className = 'w-6 h-6 bg-gray-200 rounded hover:bg-gray-300';
        button.textContent = label;

        if (action === 'decrease') button.classList.add('cart-decrease');
        if (action === 'increase') button.classList.add('cart-increase');
        if (action === 'remove') button.classList.add('cart-remove');

        return button;
    }

    function createCartItemNode(item, fallbackImage) {
        var row = document.createElement('div');
        row.className = 'flex items-center space-x-4 py-4 border-b';
        row.dataset.itemId = item.id;

        var image = document.createElement('img');
        image.className = 'w-16 h-16 object-cover rounded';
        image.src = (item.image1 && item.image1 !== 'undefined') ? item.image1 : fallbackImage;
        image.alt = item.name || 'Product';
        image.onerror = function () {
            image.src = fallbackImage;
        };

        var details = document.createElement('div');
        details.className = 'flex-1';

        var title = document.createElement('h3');
        title.className = 'font-medium text-sm';
        title.textContent = item.name || 'Product';

        var price = document.createElement('p');
        price.className = 'text-gray-600 text-sm';
        price.textContent = item.salePrice || 'Rp0';

        var controls = document.createElement('div');
        controls.className = 'flex items-center space-x-2 mt-2';

        var decreaseButton = createQuantityButton('decrease', item.id, '-');

        var quantity = document.createElement('span');
        quantity.className = 'text-sm min-w-[20px] text-center';
        quantity.dataset.quantityId = item.id;
        quantity.textContent = String(item.quantity || 0);

        var increaseButton = createQuantityButton('increase', item.id, '+');

        controls.appendChild(decreaseButton);
        controls.appendChild(quantity);
        controls.appendChild(increaseButton);

        details.appendChild(title);
        details.appendChild(price);
        details.appendChild(controls);

        var removeButton = createQuantityButton('remove', item.id, '×');
        removeButton.className = 'cart-remove text-red-500 hover:text-red-700 p-1';

        row.appendChild(image);
        row.appendChild(details);
        row.appendChild(removeButton);

        return row;
    }

    function updateCartUI() {
        var cartCount = qs('cart-count');
        var cartItems = qs('cart-items');
        var cartFooter = qs('cart-footer');
        var emptyCart = qs('empty-cart');
        var cartTotal = qs('cart-total');
        var items = getCartItems();
        var totalItems = getCartTotalCount();

        if (totalItems > 0) {
            if (cartCount) {
                cartCount.textContent = totalItems;
                cartCount.classList.remove('hidden');
            }
            if (emptyCart) emptyCart.classList.add('hidden');
            if (cartFooter) cartFooter.classList.remove('hidden');
        } else {
            if (cartCount) cartCount.classList.add('hidden');
            if (emptyCart) emptyCart.classList.remove('hidden');
            if (cartFooter) cartFooter.classList.add('hidden');
        }

        if (cartItems) {
            var fallbackImage = buildFallbackImage();
            cartItems.innerHTML = '';

            items.forEach(function (item) {
                cartItems.appendChild(createCartItemNode(item, fallbackImage));
            });
        }

        var total = getCartTotalPrice();
        if (cartTotal) {
            cartTotal.textContent = 'Rp' + total.toLocaleString('id-ID');
        }
    }

    function openCart() {
        var sidebar = qs('cart-sidebar');
        var overlay = qs('cart-overlay');
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('open');
        lockBodyScroll('cart');
    }

    function closeCart() {
        var sidebar = qs('cart-sidebar');
        var overlay = qs('cart-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        unlockBodyScroll('cart');
    }

    function showAddToCartNotification(productName) {
        document.querySelectorAll('.notification').forEach(function (notification) {
            notification.remove();
        });

        var notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = String(productName || 'Produk') + ' berhasil ditambahkan ke keranjang!';
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
            var items = getCartItems();
            if (!items || items.length === 0) {
                showToast('Keranjang Anda masih kosong.', 'error');
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
        var cartButton = qs('cart-btn');
        if (cartButton) {
            cartButton.addEventListener('click', openCart);
        }

        var cartOverlay = qs('cart-overlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', closeCart);
        }

        var closeCartButton = document.querySelector('.close-cart-btn');
        if (closeCartButton) {
            closeCartButton.addEventListener('click', closeCart);
        }

        var checkoutButton = qs('checkout-btn');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', handleCheckoutClick);
        }
    });
})();

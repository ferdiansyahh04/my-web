(function () {
    function qs(id) {
        return document.getElementById(id);
    }

    function getCurrentUser() {
        try {
            return window.auth && typeof window.auth.getCurrentUser === 'function'
                ? window.auth.getCurrentUser()
                : null;
        } catch (error) {
            return null;
        }
    }

    function getSessionEmail() {
        const session = getCurrentUser();
        return session ? session.email : null;
    }

    function currentUserIsAdmin() {
        try {
            const email = getSessionEmail();
            if (!email) {
                return false;
            }
            const raw = localStorage.getItem('voltx_users') || '[]';
            const users = JSON.parse(raw);
            const user = users.find(function (item) {
                return item.email === email;
            });
            return !!(user && user.role === 'admin');
        } catch (error) {
            return false;
        }
    }

    function createAdminButton() {
        if (qs('admin-btn')) {
            return;
        }
        const authButton = qs('auth-btn');
        if (!authButton) {
            return;
        }
        const button = document.createElement('button');
        button.id = 'admin-btn';
        button.textContent = 'Admin';
        button.className = 'ml-2 bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-50 hidden';
        authButton.insertAdjacentElement('afterend', button);
        button.addEventListener('click', toggleAdminPanel);
    }

    function createAdminPanel() {
        if (qs('admin-panel')) {
            return;
        }

        const html = `
        <div id="admin-panel" class="fixed right-4 top-28 w-96 bg-white shadow-lg rounded-lg p-4 z-60 hidden">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                    <h3 id="admin-title" class="font-bold">Admin</h3>
                    <div class="text-sm text-gray-500">(Manage)</div>
                </div>
                <div class="flex items-center gap-2">
                    <button id="admin-tab-products" class="text-sm px-2 py-1 rounded bg-gray-100">Products</button>
                    <button id="admin-tab-orders" class="text-sm px-2 py-1 rounded">Orders</button>
                    <button id="admin-close" class="text-gray-500">✕</button>
                </div>
            </div>
            <div id="admin-msg" class="text-sm text-red-600 mb-2"></div>

            <div id="admin-products-section">
              <form id="admin-form" class="space-y-2 mb-4">
                <input id="p-name" placeholder="Name" class="w-full border px-2 py-1 rounded" />
                <input id="p-original" placeholder="Original price (e.g. Rp1.000.000)" class="w-full border px-2 py-1 rounded" />
                <input id="p-sale" placeholder="Sale price (e.g. Rp799.000)" class="w-full border px-2 py-1 rounded" />
                <input id="p-url" placeholder="Product url" class="w-full border px-2 py-1 rounded" />
                <input id="p-image1" placeholder="Image 1 url" class="w-full border px-2 py-1 rounded" />
                <input id="p-image2" placeholder="Image 2 url (optional)" class="w-full border px-2 py-1 rounded" />
                <div class="flex items-center gap-2">
                    <label class="text-sm"><input id="p-hasDiscount" type="checkbox" /> Has discount</label>
                    <label class="text-sm"><input id="p-available" type="checkbox" checked /> Available</label>
                </div>
                <div class="flex gap-2">
                    <button type="submit" class="bg-black text-white px-3 py-1 rounded">Save</button>
                    <button type="button" id="admin-clear" class="px-3 py-1 rounded border">Clear</button>
                </div>
              </form>
              <div class="overflow-y-auto max-h-64">
                  <div id="admin-products-list" class="space-y-2"></div>
              </div>
            </div>

            <div id="admin-orders-section" class="hidden">
              <div class="overflow-y-auto max-h-80">
                <div id="admin-orders-list" class="space-y-2"></div>
              </div>
              <div id="admin-order-details" class="hidden mt-3 p-2 border rounded bg-gray-50 text-sm"></div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);

        const closeButton = qs('admin-close');
        if (closeButton) closeButton.addEventListener('click', closeAdminPanel);
        const clearButton = qs('admin-clear');
        if (clearButton) clearButton.addEventListener('click', clearAdminForm);
        const form = qs('admin-form');
        if (form) form.addEventListener('submit', onAdminFormSubmit);
    }

    function toggleAdminPanel() {
        const panel = qs('admin-panel');
        if (!panel) {
            return;
        }
        if (panel.classList.contains('hidden')) {
            openAdminPanel();
        } else {
            closeAdminPanel();
        }
    }

    function openAdminPanel() {
        const panel = qs('admin-panel');
        if (!panel) {
            return;
        }
        panel.classList.remove('hidden');
        renderAdminList();
        renderOrdersList();
        activateAdminTab('products');
    }

    function closeAdminPanel() {
        const panel = qs('admin-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    function clearAdminForm() {
        const message = qs('admin-msg');
        if (message) {
            message.textContent = '';
        }

        ['p-name', 'p-original', 'p-sale', 'p-url', 'p-image1', 'p-image2'].forEach(function (id) {
            const field = qs(id);
            if (field) {
                field.value = '';
            }
        });

        const hasDiscount = qs('p-hasDiscount');
        const available = qs('p-available');
        if (hasDiscount) hasDiscount.checked = false;
        if (available) available.checked = true;

        const form = qs('admin-form');
        if (form) {
            form.removeAttribute('data-edit-id');
        }
    }

    function onAdminFormSubmit(event) {
        event.preventDefault();
        const nameField = qs('p-name');
        const name = nameField ? nameField.value.trim() : '';
        const message = qs('admin-msg');

        if (!name) {
            if (message) {
                message.textContent = 'Name is required';
            }
            return;
        }

        const originalField = qs('p-original');
        const saleField = qs('p-sale');
        const urlField = qs('p-url');
        const image1Field = qs('p-image1');
        const image2Field = qs('p-image2');
        const hasDiscountField = qs('p-hasDiscount');
        const availableField = qs('p-available');
        const form = qs('admin-form');

        const product = {
            name: name,
            originalPrice: originalField ? originalField.value.trim() : '',
            salePrice: saleField ? saleField.value.trim() : '',
            url: urlField ? urlField.value.trim() : '',
            image1: image1Field ? image1Field.value.trim() : '',
            image2: image2Field ? image2Field.value.trim() : '',
            hasDiscount: hasDiscountField ? !!hasDiscountField.checked : false,
            available: availableField ? !!availableField.checked : true
        };

        const editId = form ? form.getAttribute('data-edit-id') : null;
        if (editId) {
            window.productStore.updateProduct(editId, product);
        } else {
            window.productStore.addProduct(product);
        }

        clearAdminForm();
        renderAdminList();
    }

    function getAdminThumbnail(product) {
        return product.image1 || product.image2 || '';
    }

    function getImageMarkup(src) {
        return `<img src="${src}" alt="" class="w-12 h-12 object-cover rounded" onerror="this.style.display='none'">`;
    }

    function fillAdminForm(product, productId) {
        qs('p-name').value = product.name || '';
        qs('p-original').value = product.originalPrice || '';
        qs('p-sale').value = product.salePrice || '';
        qs('p-url').value = product.url || '';
        qs('p-image1').value = product.image1 || '';
        qs('p-image2').value = product.image2 || '';
        qs('p-hasDiscount').checked = !!product.hasDiscount;
        qs('p-available').checked = product.available !== false;
        qs('admin-form').setAttribute('data-edit-id', productId);
        openAdminPanel();
    }

    function renderAdminList() {
        const list = qs('admin-products-list');
        if (!list) {
            return;
        }

        const products = window.productStore.getAll() || [];
        list.innerHTML = '';

        products.forEach(function (product) {
            const item = document.createElement('div');
            item.className = 'p-2 border rounded flex items-center justify-between gap-2';
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    ${getImageMarkup(getAdminThumbnail(product))}
                    <div class="text-sm">
                        <div class="font-semibold">${product.name}</div>
                        <div class="text-xs text-gray-500">${product.salePrice || ''}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button data-id="${product.id}" class="admin-edit text-sm px-2 py-1 border rounded">Edit</button>
                    <button data-id="${product.id}" class="admin-delete text-sm px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>`;
            list.appendChild(item);
        });

        list.querySelectorAll('.admin-edit').forEach(function (button) {
            button.addEventListener('click', function () {
                const productId = button.getAttribute('data-id');
                const product = (window.productStore.getAll() || []).find(function (item) {
                    return item.id === productId;
                });
                if (!product) {
                    return;
                }
                fillAdminForm(product, productId);
            });
        });

        list.querySelectorAll('.admin-delete').forEach(function (button) {
            button.addEventListener('click', function () {
                const productId = button.getAttribute('data-id');
                if (!confirm('Delete this product?')) {
                    return;
                }
                window.productStore.deleteProduct(productId);
                renderAdminList();
            });
        });
    }

    function loadOrders() {
        try {
            if (window.ordersAPI && typeof window.ordersAPI.loadOrders === 'function') {
                return window.ordersAPI.loadOrders();
            }
            const raw = localStorage.getItem('voltx_orders') || '[]';
            return JSON.parse(raw);
        } catch (error) {
            return [];
        }
    }

    function renderOrdersList() {
        const list = qs('admin-orders-list');
        if (!list) {
            return;
        }

        const orders = loadOrders() || [];
        list.innerHTML = '';

        if (orders.length === 0) {
            list.innerHTML = '<div class="text-sm text-gray-500">No orders yet</div>';
            return;
        }

        orders.slice().reverse().forEach(function (order) {
            const item = document.createElement('div');
            item.className = 'p-2 border rounded flex items-center justify-between gap-2';
            const date = order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '';
            item.innerHTML = `
                <div class="text-sm">
                    <div class="font-semibold">${order.id}</div>
                    <div class="text-xs text-gray-500">${(order.user && (order.user.name || order.user.email)) || 'Guest'} — ${date}</div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="text-sm font-medium">Rp${(order.total || 0).toLocaleString('id-ID')}</div>
                    <button data-id="${order.id}" class="admin-view-order text-sm px-2 py-1 border rounded">View Details</button>
                </div>`;
            list.appendChild(item);
        });

        list.querySelectorAll('.admin-view-order').forEach(function (button) {
            button.addEventListener('click', function () {
                showOrderDetails(button.getAttribute('data-id'));
            });
        });
    }

    function showOrderDetails(orderId) {
        const details = qs('admin-order-details');
        if (!details) {
            return;
        }

        const orders = loadOrders();
        const order = orders.find(function (item) {
            return item.id === orderId;
        });

        if (!order) {
            details.classList.remove('hidden');
            details.innerHTML = '<div class="text-sm text-red-600">Order not found</div>';
            return;
        }

        const lines = [];
        lines.push(`<div class="font-semibold mb-2">Order ${order.id}</div>`);
        lines.push(`<div class="text-xs text-gray-600 mb-2">${order.user ? (order.user.name || order.user.email) : 'Guest'} — ${order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : ''}</div>`);
        lines.push('<div class="space-y-1">');
        (order.items || []).forEach(function (item) {
            lines.push(`<div class="flex justify-between"><div>${item.name} × ${item.quantity}</div><div>${item.salePrice || ('Rp' + (Number(item.price) || 0).toLocaleString('id-ID'))}</div></div>`);
        });
        lines.push('</div>');
        lines.push(`<div class="mt-2 font-medium">Total: Rp${(order.total || 0).toLocaleString('id-ID')}</div>`);
        details.innerHTML = lines.join('');
        details.classList.remove('hidden');
    }

    function activateAdminTab(tab) {
        const productsSection = qs('admin-products-section');
        const ordersSection = qs('admin-orders-section');
        const productsTab = qs('admin-tab-products');
        const ordersTab = qs('admin-tab-orders');

        if (tab === 'orders') {
            productsSection.classList.add('hidden');
            ordersSection.classList.remove('hidden');
            productsTab.classList.remove('bg-gray-100');
            ordersTab.classList.add('bg-gray-100');
            renderOrdersList();
            return;
        }

        productsSection.classList.remove('hidden');
        ordersSection.classList.add('hidden');
        productsTab.classList.add('bg-gray-100');
        ordersTab.classList.remove('bg-gray-100');
    }

    function refreshAdminVisibility() {
        const adminButton = qs('admin-btn');
        if (!adminButton) {
            return;
        }

        if (currentUserIsAdmin()) {
            adminButton.classList.remove('hidden');
        } else {
            adminButton.classList.add('hidden');
        }
    }

    function refreshProductViews() {
        renderAdminList();
        try {
            filteredProducts = [].concat(allProducts);
            clearProducts();
            loadProducts();
        } catch (error) {
            // ignore dependent reload issues
        }
    }

    function initAdmin() {
        createAdminButton();
        createAdminPanel();
        refreshAdminVisibility();

        const authButton = qs('auth-btn');
        if (authButton) {
            authButton.addEventListener('click', function () {
                setTimeout(refreshAdminVisibility, 200);
            });
        }

        const productsTab = qs('admin-tab-products');
        if (productsTab) {
            productsTab.addEventListener('click', function () {
                activateAdminTab('products');
            });
        }

        const ordersTab = qs('admin-tab-orders');
        if (ordersTab) {
            ordersTab.addEventListener('click', function () {
                activateAdminTab('orders');
            });
        }

        const closeButton = qs('admin-close');
        if (closeButton) {
            closeButton.addEventListener('click', closeAdminPanel);
        }

        document.addEventListener('products:changed', refreshProductViews);
    }

    document.addEventListener('DOMContentLoaded', initAdmin);
})();

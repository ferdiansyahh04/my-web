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

    // Check admin role via Supabase profiles table (async)
    async function currentUserIsAdmin() {

    // ---------- Image upload helpers ----------

    function setupImageInput(inputId) {
        var fileInput = qs(inputId + '-file');
        var urlInput = qs(inputId);
        var preview = qs(inputId + '-preview');
        if (!fileInput || !urlInput || !preview) return;

        fileInput.addEventListener('change', function () {
            var file = fileInput.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (e) {
                showImagePreview(inputId, e.target.result);
            };
            reader.readAsDataURL(file);
        });

        urlInput.addEventListener('change', function () {
            var url = urlInput.value.trim();
            if (url) {
                showImagePreview(inputId, url);
            } else {
                hideImagePreview(inputId);
            }
        });

        var clearBtn = preview.querySelector('.preview-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                urlInput.value = '';
                fileInput.value = '';
                hideImagePreview(inputId);
            });
        }
    }

    function showImagePreview(inputId, src) {
        var preview = qs(inputId + '-preview');
        if (!preview) return;
        var img = preview.querySelector('img');
        if (img) img.src = src;
        preview.classList.remove('hidden');
    }

    function hideImagePreview(inputId) {
        var preview = qs(inputId + '-preview');
        if (!preview) return;
        var img = preview.querySelector('img');
        if (img) img.src = '';
        preview.classList.add('hidden');
    }

    async function resolveImageUrl(inputId) {
        var fileInput = qs(inputId + '-file');
        var urlInput = qs(inputId);
        // If a file was selected, upload it
        if (fileInput && fileInput.files && fileInput.files[0]) {
            return await window.supabaseAPI.uploadImage(fileInput.files[0]);
        }
        // Otherwise use the URL text input
        return urlInput ? urlInput.value.trim() : '';
    }

    // Check admin role via Supabase profiles table (async)
    async function currentUserIsAdmin() {
        try {
            if (!window.supabaseAPI || typeof window.supabaseAPI.isAdmin !== 'function') return false;
            return await window.supabaseAPI.isAdmin();
        } catch (e) {
            return false;
        }
    }

    function createAdminButton() {
        if (qs('admin-btn')) {
            return;
        }
        var authButton = qs('auth-btn');
        if (!authButton) {
            return;
        }
        var button = document.createElement('button');
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

        var html = '\
        <div id="admin-panel" class="fixed right-4 top-28 w-96 bg-white shadow-lg rounded-lg p-4 z-60 hidden">\
            <div class="flex items-center justify-between mb-3">\
                <div class="flex items-center gap-3">\
                    <h3 id="admin-title" class="font-bold">Admin</h3>\
                    <div class="text-sm text-gray-500">(Manage)</div>\
                </div>\
                <div class="flex items-center gap-2">\
                    <button id="admin-tab-products" class="text-sm px-2 py-1 rounded bg-gray-100">Products</button>\
                    <button id="admin-tab-orders" class="text-sm px-2 py-1 rounded">Orders</button>\
                    <button id="admin-close" class="text-gray-500">\u2715</button>\
                </div>\
            </div>\
            <div id="admin-msg" class="text-sm text-red-600 mb-2"></div>\
            <div id="admin-products-section">\
              <form id="admin-form" class="space-y-2 mb-4">\
                <input id="p-name" placeholder="Name" class="w-full border px-2 py-1 rounded" />\
                <input id="p-original" placeholder="Original price (e.g. Rp1.000.000)" class="w-full border px-2 py-1 rounded" />\
                <input id="p-sale" placeholder="Sale price (e.g. Rp799.000)" class="w-full border px-2 py-1 rounded" />\
                <input id="p-url" placeholder="Product url" class="w-full border px-2 py-1 rounded" />\
                <div class="space-y-1">\
                    <label class="text-xs font-medium text-gray-600">Image 1</label>\
                    <div class="flex gap-1">\
                        <input id="p-image1" placeholder="Paste URL or upload" class="flex-1 border px-2 py-1 rounded text-sm" />\
                        <label class="cursor-pointer bg-gray-100 border px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-gray-200">\
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>\
                            Upload\
                            <input id="p-image1-file" type="file" accept="image/*" class="hidden" />\
                        </label>\
                    </div>\
                    <div id="p-image1-preview" class="hidden"><img class="w-16 h-16 object-cover rounded border" /><button type="button" class="text-xs text-red-500 ml-2 preview-clear">Remove</button></div>\
                </div>\
                <div class="space-y-1">\
                    <label class="text-xs font-medium text-gray-600">Image 2 (hover, optional)</label>\
                    <div class="flex gap-1">\
                        <input id="p-image2" placeholder="Paste URL or upload" class="flex-1 border px-2 py-1 rounded text-sm" />\
                        <label class="cursor-pointer bg-gray-100 border px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-gray-200">\
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>\
                            Upload\
                            <input id="p-image2-file" type="file" accept="image/*" class="hidden" />\
                        </label>\
                    </div>\
                    <div id="p-image2-preview" class="hidden"><img class="w-16 h-16 object-cover rounded border" /><button type="button" class="text-xs text-red-500 ml-2 preview-clear">Remove</button></div>\
                </div>\
                <div class="flex items-center gap-2">\
                    <label class="text-sm"><input id="p-hasDiscount" type="checkbox" /> Has discount</label>\
                    <label class="text-sm"><input id="p-available" type="checkbox" checked /> Available</label>\
                    <label class="text-sm"><input id="p-isNew" type="checkbox" /> New</label>\
                    <label class="text-sm"><input id="p-isBestSeller" type="checkbox" /> Best seller</label>\
                </div>\
                <div class="flex gap-2">\
                    <button type="submit" class="bg-black text-white px-3 py-1 rounded">Save</button>\
                    <button type="button" id="admin-clear" class="px-3 py-1 rounded border">Clear</button>\
                </div>\
              </form>\
              <div class="overflow-y-auto max-h-64">\
                  <div id="admin-products-list" class="space-y-2"></div>\
              </div>\
            </div>\
            <div id="admin-orders-section" class="hidden">\
              <div class="overflow-y-auto max-h-80">\
                <div id="admin-orders-list" class="space-y-2"></div>\
              </div>\
              <div id="admin-order-details" class="hidden mt-3 p-2 border rounded bg-gray-50 text-sm"></div>\
            </div>\
        </div>';

        document.body.insertAdjacentHTML('beforeend', html);

        // Image upload and preview handlers
        setupImageInput('p-image1');
        setupImageInput('p-image2');

        var closeButton = qs('admin-close');
        if (closeButton) closeButton.addEventListener('click', closeAdminPanel);
        var clearButton = qs('admin-clear');
        if (clearButton) clearButton.addEventListener('click', clearAdminForm);
        var form = qs('admin-form');
        if (form) form.addEventListener('submit', onAdminFormSubmit);
    }

    function toggleAdminPanel() {
        var panel = qs('admin-panel');
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
        var panel = qs('admin-panel');
        if (!panel) {
            return;
        }
        panel.classList.remove('hidden');
        renderAdminList();
        renderOrdersList();
        activateAdminTab('products');
    }

    function closeAdminPanel() {
        var panel = qs('admin-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    function clearAdminForm() {
        var message = qs('admin-msg');
        if (message) {
            message.textContent = '';
        }

        ['p-name', 'p-original', 'p-sale', 'p-url', 'p-image1', 'p-image2'].forEach(function (id) {
            var field = qs(id);
            if (field) {
                field.value = '';
            }
        });

        // Clear file inputs and previews
        ['p-image1-file', 'p-image2-file'].forEach(function (id) {
            var field = qs(id);
            if (field) field.value = '';
        });
        hideImagePreview('p-image1');
        hideImagePreview('p-image2');

        var hasDiscount = qs('p-hasDiscount');
        var available = qs('p-available');
        var isNewField = qs('p-isNew');
        var isBestSellerField = qs('p-isBestSeller');
        if (hasDiscount) hasDiscount.checked = false;
        if (available) available.checked = true;
        if (isNewField) isNewField.checked = false;
        if (isBestSellerField) isBestSellerField.checked = false;

        var form = qs('admin-form');
        if (form) {
            form.removeAttribute('data-edit-id');
        }
    }

    function onAdminFormSubmit(event) {
        event.preventDefault();
        var nameField = qs('p-name');
        var name = nameField ? nameField.value.trim() : '';
        var message = qs('admin-msg');

        if (!name) {
            if (message) {
                message.textContent = 'Name is required';
            }
            return;
        }

        var originalField = qs('p-original');
        var saleField = qs('p-sale');
        var urlField = qs('p-url');
        var hasDiscountField = qs('p-hasDiscount');
        var availableField = qs('p-available');
        var isNewField = qs('p-isNew');
        var isBestSellerField = qs('p-isBestSeller');
        var form = qs('admin-form');

        if (message) message.textContent = 'Uploading images...';

        // Resolve images (upload files if selected, otherwise use URLs)
        Promise.all([resolveImageUrl('p-image1'), resolveImageUrl('p-image2')]).then(function (urls) {
            if (message) message.textContent = '';

            var product = {
                name: name,
                originalPrice: originalField ? originalField.value.trim() : '',
                salePrice: saleField ? saleField.value.trim() : '',
                url: urlField ? urlField.value.trim() : '',
                image1: urls[0] || '',
                image2: urls[1] || '',
                hasDiscount: hasDiscountField ? !!hasDiscountField.checked : false,
                available: availableField ? !!availableField.checked : true,
                isNew: isNewField ? !!isNewField.checked : false,
                isBestSeller: isBestSellerField ? !!isBestSellerField.checked : false
            };

            var editId = form ? form.getAttribute('data-edit-id') : null;

            var promise;
            if (editId) {
                promise = window.productStore.updateProduct(editId, product);
            } else {
                promise = window.productStore.addProduct(product);
            }

            return Promise.resolve(promise);
        }).then(function () {
            clearAdminForm();
            renderAdminList();
        }).catch(function (e) {
            if (message) message.textContent = 'Save failed: ' + (e.message || e);
        });
    }

    function getAdminThumbnail(product) {
        return product.image1 || product.image2 || '';
    }

    function getImageMarkup(src) {
        return '<img src="' + src + '" alt="" class="w-12 h-12 object-cover rounded" onerror="this.style.display=\'none\'">';
    }

    function fillAdminForm(product, productId) {
        qs('p-name').value = product.name || '';
        qs('p-original').value = product.originalPrice || '';
        qs('p-sale').value = product.salePrice || '';
        qs('p-url').value = product.url || '';
        qs('p-image1').value = product.image1 || '';
        qs('p-image2').value = product.image2 || '';
        // Clear any previously selected files
        var f1 = qs('p-image1-file'); if (f1) f1.value = '';
        var f2 = qs('p-image2-file'); if (f2) f2.value = '';
        // Show previews for existing images
        if (product.image1) showImagePreview('p-image1', product.image1);
        else hideImagePreview('p-image1');
        if (product.image2) showImagePreview('p-image2', product.image2);
        else hideImagePreview('p-image2');
        qs('p-hasDiscount').checked = !!product.hasDiscount;
        qs('p-available').checked = product.available !== false;
        qs('p-isNew').checked = !!product.isNew;
        qs('p-isBestSeller').checked = !!product.isBestSeller;
        qs('admin-form').setAttribute('data-edit-id', productId);
        openAdminPanel();
    }

    function renderAdminList() {
        var list = qs('admin-products-list');
        if (!list) {
            return;
        }

        var products = window.productStore.getAll() || [];
        list.innerHTML = '';

        products.forEach(function (product) {
            var item = document.createElement('div');
            item.className = 'p-2 border rounded flex items-center justify-between gap-2';
            item.innerHTML = '\
                <div class="flex items-center gap-3">\
                    ' + getImageMarkup(getAdminThumbnail(product)) + '\
                    <div class="text-sm">\
                        <div class="font-semibold">' + product.name + '</div>\
                        <div class="text-xs text-gray-500">' + (product.salePrice || '') + '</div>\
                    </div>\
                </div>\
                <div class="flex items-center gap-2">\
                    <button data-id="' + product.id + '" class="admin-edit text-sm px-2 py-1 border rounded">Edit</button>\
                    <button data-id="' + product.id + '" class="admin-delete text-sm px-2 py-1 bg-red-500 text-white rounded">Delete</button>\
                </div>';
            list.appendChild(item);
        });

        list.querySelectorAll('.admin-edit').forEach(function (button) {
            button.addEventListener('click', function () {
                var productId = button.getAttribute('data-id');
                var product = (window.productStore.getAll() || []).find(function (item) {
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
                var productId = button.getAttribute('data-id');
                if (!confirm('Delete this product?')) {
                    return;
                }
                Promise.resolve(window.productStore.deleteProduct(productId)).then(function () {
                    renderAdminList();
                });
            });
        });
    }

    // Load orders from Supabase (async)
    async function loadOrders() {
        try {
            if (window.ordersAPI && typeof window.ordersAPI.loadOrders === 'function') {
                return await window.ordersAPI.loadOrders();
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    function renderOrdersList() {
        var list = qs('admin-orders-list');
        if (!list) {
            return;
        }

        list.innerHTML = '<div class="text-sm text-gray-500">Loading orders...</div>';

        loadOrders().then(function (orders) {
            orders = orders || [];
            list.innerHTML = '';

            if (orders.length === 0) {
                list.innerHTML = '<div class="text-sm text-gray-500">No orders yet</div>';
                return;
            }

            orders.forEach(function (order) {
                var item = document.createElement('div');
                item.className = 'p-2 border rounded flex items-center justify-between gap-2';
                var date = order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '';
                item.innerHTML = '\
                    <div class="text-sm">\
                        <div class="font-semibold">' + order.id + '</div>\
                        <div class="text-xs text-gray-500">' + ((order.user && (order.user.name || order.user.email)) || 'Guest') + ' \u2014 ' + date + '</div>\
                    </div>\
                    <div class="flex items-center gap-2">\
                        <div class="text-sm font-medium">Rp' + (order.total || 0).toLocaleString('id-ID') + '</div>\
                        <button data-id="' + order.id + '" class="admin-view-order text-sm px-2 py-1 border rounded">View Details</button>\
                    </div>';
                list.appendChild(item);
            });

            list.querySelectorAll('.admin-view-order').forEach(function (button) {
                button.addEventListener('click', function () {
                    showOrderDetails(button.getAttribute('data-id'));
                });
            });
        });
    }

    function showOrderDetails(orderId) {
        var details = qs('admin-order-details');
        if (!details) {
            return;
        }

        loadOrders().then(function (orders) {
            var order = orders.find(function (item) {
                return item.id === orderId;
            });

            if (!order) {
                details.classList.remove('hidden');
                details.innerHTML = '<div class="text-sm text-red-600">Order not found</div>';
                return;
            }

            var lines = [];
            lines.push('<div class="font-semibold mb-2">Order ' + order.id + '</div>');
            lines.push('<div class="text-xs text-gray-600 mb-2">' + (order.user ? (order.user.name || order.user.email) : 'Guest') + ' \u2014 ' + (order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '') + '</div>');
            lines.push('<div class="space-y-1">');
            (order.items || []).forEach(function (item) {
                lines.push('<div class="flex justify-between"><div>' + item.name + ' \u00d7 ' + item.quantity + '</div><div>' + (item.salePrice || ('Rp' + (Number(item.price) || 0).toLocaleString('id-ID'))) + '</div></div>');
            });
            lines.push('</div>');
            lines.push('<div class="mt-2 font-medium">Total: Rp' + (order.total || 0).toLocaleString('id-ID') + '</div>');
            details.innerHTML = lines.join('');
            details.classList.remove('hidden');
        });
    }

    function activateAdminTab(tab) {
        var productsSection = qs('admin-products-section');
        var ordersSection = qs('admin-orders-section');
        var productsTab = qs('admin-tab-products');
        var ordersTab = qs('admin-tab-orders');

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

    async function refreshAdminVisibility() {
        var adminButton = qs('admin-btn');
        if (!adminButton) {
            return;
        }

        var isAdmin = await currentUserIsAdmin();
        if (isAdmin) {
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

        // React to auth changes (login/logout)
        document.addEventListener('auth:changed', function () {
            refreshAdminVisibility();
        });

        var productsTab = qs('admin-tab-products');
        if (productsTab) {
            productsTab.addEventListener('click', function () {
                activateAdminTab('products');
            });
        }

        var ordersTab = qs('admin-tab-orders');
        if (ordersTab) {
            ordersTab.addEventListener('click', function () {
                activateAdminTab('orders');
            });
        }

        var closeButton = qs('admin-close');
        if (closeButton) {
            closeButton.addEventListener('click', closeAdminPanel);
        }

        document.addEventListener('products:changed', refreshProductViews);
    }

    document.addEventListener('DOMContentLoaded', initAdmin);
})();

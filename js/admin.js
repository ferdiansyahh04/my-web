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
        <div id="admin-panel" class="fixed inset-0 z-[1185] hidden">\
            <div id="admin-backdrop" class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"></div>\
            <div class="relative flex min-h-screen items-start justify-center p-4 md:p-8">\
                <div class="admin-shell mt-16 flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">\
                    <div class="flex flex-shrink-0 flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-start md:justify-between md:px-8">\
                        <div>\
                            <div class="flex items-center gap-3">\
                                <h3 id="admin-title" class="text-2xl font-black tracking-tight text-slate-900">Admin</h3>\
                                <div class="text-sm text-slate-500">(Manage)</div>\
                            </div>\
                            <p class="mt-2 text-sm text-slate-500">Kelola produk dan pantau pesanan dari satu tempat.</p>\
                        </div>\
                        <div class="flex items-center gap-2">\
                            <button id="admin-tab-products" class="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm">Products</button>\
                            <button id="admin-tab-orders" class="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Orders</button>\
                            <button id="admin-close" class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950">\u2715</button>\
                        </div>\
                    </div>\
                    <div class="admin-body min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-8 md:py-6">\
                        <div id="admin-msg" class="mb-4 text-sm font-medium text-rose-600"></div>\
                        <div id="admin-products-section">\
                          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">\
                            <form id="admin-form" class="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:p-5">\
                              <input id="p-name" placeholder="Name" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100" />\
                              <input id="p-original" placeholder="Original price (e.g. Rp1.000.000)" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100" />\
                              <input id="p-sale" placeholder="Sale price (e.g. Rp799.000)" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100" />\
                              <input id="p-url" placeholder="Product url" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100" />\
                              <div class="space-y-2">\
                                  <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Image 1</label>\
                                  <div class="flex gap-2">\
                                      <input id="p-image1" placeholder="Paste URL or upload" class="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100" />\
                                      <label class="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 flex items-center gap-1 hover:border-slate-300 hover:bg-slate-50">\
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>\
                            Upload\
                            <input id="p-image1-file" type="file" accept="image/*" class="hidden" />\
                        </label>\
                                  </div>\
                                  <div id="p-image1-preview" class="hidden"><img class="w-16 h-16 object-cover rounded border" /><button type="button" class="ml-2 text-xs text-red-500 preview-clear">Remove</button></div>\
                              </div>\
                              <div class="space-y-2">\
                                  <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Image 2 (hover, optional)</label>\
                                  <div class="flex gap-2">\
                                      <input id="p-image2" placeholder="Paste URL or upload" class="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100" />\
                                      <label class="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 flex items-center gap-1 hover:border-slate-300 hover:bg-slate-50">\
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>\
                            Upload\
                            <input id="p-image2-file" type="file" accept="image/*" class="hidden" />\
                        </label>\
                                  </div>\
                                  <div id="p-image2-preview" class="hidden"><img class="w-16 h-16 object-cover rounded border" /><button type="button" class="ml-2 text-xs text-red-500 preview-clear">Remove</button></div>\
                              </div>\
                              <div class="flex flex-wrap items-center gap-3">\
                                  <label class="text-sm text-slate-600"><input id="p-hasDiscount" type="checkbox" /> Has discount</label>\
                                  <label class="text-sm text-slate-600"><input id="p-available" type="checkbox" checked /> Available</label>\
                                  <label class="text-sm text-slate-600"><input id="p-isNew" type="checkbox" /> New</label>\
                                  <label class="text-sm text-slate-600"><input id="p-isBestSeller" type="checkbox" /> Best seller</label>\
                              </div>\
                              <div class="flex gap-2">\
                                  <button type="submit" class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Save</button>\
                                  <button type="button" id="admin-clear" class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900">Clear</button>\
                              </div>\
                            </form>\
                            <div class="rounded-[1.5rem] border border-slate-200 bg-white p-4 md:p-5">\
                                <div class="mb-4 flex items-center justify-between gap-3">\
                                    <div>\
                                        <div class="text-sm font-semibold text-slate-900">Product List</div>\
                                        <div class="text-sm text-slate-500">Edit atau hapus produk yang sudah tersimpan.</div>\
                                    </div>\
                                </div>\
                                <div class="max-h-[30rem] overflow-y-auto pr-1">\
                                    <div id="admin-products-list" class="space-y-3"></div>\
                                </div>\
                            </div>\
                          </div>\
                        </div>\
                        <div id="admin-orders-section" class="hidden">\
                          <div class="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.85fr)]">\
                            <div class="rounded-[1.5rem] border border-slate-200 bg-white p-4 md:p-5">\
                                <div class="mb-4">\
                                    <div class="text-sm font-semibold text-slate-900">Order List</div>\
                                    <div class="text-sm text-slate-500">Pantau pesanan terbaru dari pelanggan.</div>\
                                </div>\
                                <div class="max-h-[34rem] overflow-y-auto pr-1">\
                                    <div id="admin-orders-list" class="space-y-3"></div>\
                                </div>\
                            </div>\
                            <div id="admin-order-details" class="hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm md:p-5"></div>\
                          </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>';

        document.body.insertAdjacentHTML('beforeend', html);

        // Image upload and preview handlers
        setupImageInput('p-image1');
        setupImageInput('p-image2');

        var closeButton = qs('admin-close');
        if (closeButton) closeButton.addEventListener('click', closeAdminPanel);
        var backdrop = qs('admin-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeAdminPanel);
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
        document.body.style.overflow = 'hidden';
        renderAdminList();
        renderOrdersList();
        activateAdminTab('products');
    }

    function closeAdminPanel() {
        var panel = qs('admin-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
        document.body.style.overflow = 'auto';
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

    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
                        <div class="font-semibold">' + escapeHTML(product.name) + '</div>\
                        <div class="text-xs text-gray-500">' + escapeHTML(product.salePrice || '') + '</div>\
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
                        <div class="font-semibold">' + escapeHTML(order.id) + '</div>\
                        <div class="text-xs text-gray-500">' + escapeHTML((order.user && (order.user.name || order.user.email)) || 'Guest') + ' \u2014 ' + escapeHTML(date) + '</div>\
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
            productsTab.className = 'rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100';
            ordersTab.className = 'rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm';
            renderOrdersList();
            return;
        }

        productsSection.classList.remove('hidden');
        ordersSection.classList.add('hidden');
        productsTab.className = 'rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm';
        ordersTab.className = 'rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100';
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

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeAdminPanel();
            }
        });

        document.addEventListener('products:changed', refreshProductViews);
    }

    document.addEventListener('DOMContentLoaded', initAdmin);
})();

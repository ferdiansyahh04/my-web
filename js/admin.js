// Minimal Admin UI for product CRUD (localStorage-backed)
(function(){
    function getSessionEmail(){
        try{ const s = window.auth?.getCurrentUser?.(); return s?.email; }catch(e){return null}
    }

    function currentUserIsAdmin(){
        try{
            const email = getSessionEmail();
            if(!email) return false;
            const raw = localStorage.getItem('voltx_users') || '[]';
            const users = JSON.parse(raw);
            const u = users.find(x => x.email === email);
            return !!(u && u.role === 'admin');
        }catch(e){return false}
    }

    function createAdminButton(){
        if(document.getElementById('admin-btn')) return;
        const authBtn = document.getElementById('auth-btn');
        if(!authBtn) return;
        const btn = document.createElement('button');
        btn.id = 'admin-btn';
        btn.textContent = 'Admin';
        btn.className = 'ml-2 bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-50 hidden';
        authBtn.insertAdjacentElement('afterend', btn);
        btn.addEventListener('click', toggleAdminPanel);
    }

    function createAdminPanel(){
        if(document.getElementById('admin-panel')) return;
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

        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('admin-close')?.addEventListener('click', closeAdminPanel);
        document.getElementById('admin-clear')?.addEventListener('click', clearAdminForm);
        document.getElementById('admin-form')?.addEventListener('submit', onAdminFormSubmit);
    }

    function toggleAdminPanel(){
        const p = document.getElementById('admin-panel');
        if(!p) return;
        if(p.classList.contains('hidden')) openAdminPanel(); else closeAdminPanel();
    }

    function openAdminPanel(){
        const p = document.getElementById('admin-panel');
        if(!p) return; p.classList.remove('hidden'); renderAdminList(); renderOrdersList(); activateAdminTab('products');
    }
    function closeAdminPanel(){ const p = document.getElementById('admin-panel'); if(p) p.classList.add('hidden'); }

    function clearAdminForm(){
        document.getElementById('admin-msg').textContent='';
        ['p-name','p-original','p-sale','p-url','p-image1','p-image2'].forEach(id=>document.getElementById(id).value='');
        document.getElementById('p-hasDiscount').checked = false;
        document.getElementById('p-available').checked = true;
        const form = document.getElementById('admin-form'); form.removeAttribute('data-edit-id');
    }

    function onAdminFormSubmit(e){
        e.preventDefault();
        const name = document.getElementById('p-name').value.trim();
        if(!name){ document.getElementById('admin-msg').textContent='Name is required'; return; }
        const obj = {
            name,
            originalPrice: document.getElementById('p-original').value.trim(),
            salePrice: document.getElementById('p-sale').value.trim(),
            url: document.getElementById('p-url').value.trim(),
            image1: document.getElementById('p-image1').value.trim(),
            image2: document.getElementById('p-image2').value.trim(),
            hasDiscount: !!document.getElementById('p-hasDiscount').checked,
            available: !!document.getElementById('p-available').checked
        };
        const editId = document.getElementById('admin-form').getAttribute('data-edit-id');
        if(editId){
            window.productStore.updateProduct(editId, obj);
        } else {
            window.productStore.addProduct(obj);
        }
        clearAdminForm();
        renderAdminList();
    }

    function renderAdminList(){
        const list = document.getElementById('admin-products-list');
        if(!list) return;
        const products = window.productStore.getAll() || [];
        list.innerHTML = '';
        products.forEach(p => {
            const el = document.createElement('div');
            el.className = 'p-2 border rounded flex items-center justify-between gap-2';
            el.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${p.image1 || p.image2 || ''}" alt="" class="w-12 h-12 object-cover rounded" onerror="this.style.display='none'">
                    <div class="text-sm">
                        <div class="font-semibold">${p.name}</div>
                        <div class="text-xs text-gray-500">${p.salePrice || ''}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button data-id="${p.id}" class="admin-edit text-sm px-2 py-1 border rounded">Edit</button>
                    <button data-id="${p.id}" class="admin-delete text-sm px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
            `;
            list.appendChild(el);
        });

        // bind edit/delete
        list.querySelectorAll('.admin-edit').forEach(btn=>btn.addEventListener('click', ()=>{
            const id = btn.getAttribute('data-id');
            const prod = (window.productStore.getAll()||[]).find(x=>x.id===id);
            if(!prod) return;
            document.getElementById('p-name').value = prod.name || '';
            document.getElementById('p-original').value = prod.originalPrice || '';
            document.getElementById('p-sale').value = prod.salePrice || '';
            document.getElementById('p-url').value = prod.url || '';
            document.getElementById('p-image1').value = prod.image1 || '';
            document.getElementById('p-image2').value = prod.image2 || '';
            document.getElementById('p-hasDiscount').checked = !!prod.hasDiscount;
            document.getElementById('p-available').checked = prod.available !== false;
            document.getElementById('admin-form').setAttribute('data-edit-id', id);
            openAdminPanel();
        }));

        list.querySelectorAll('.admin-delete').forEach(btn=>btn.addEventListener('click', ()=>{
            const id = btn.getAttribute('data-id');
            if(!confirm('Delete this product?')) return;
            window.productStore.deleteProduct(id);
            renderAdminList();
        }));
    }

    // ---------- Orders UI ----------
    function loadOrders(){
        try{
            if(window.ordersAPI && typeof window.ordersAPI.loadOrders === 'function') return window.ordersAPI.loadOrders();
            const raw = localStorage.getItem('voltx_orders') || '[]';
            return JSON.parse(raw);
        }catch(e){ return []; }
    }

    function renderOrdersList(){
        const list = document.getElementById('admin-orders-list');
        if(!list) return;
        const orders = loadOrders() || [];
        list.innerHTML = '';
        if(orders.length === 0){
            list.innerHTML = '<div class="text-sm text-gray-500">No orders yet</div>';
            return;
        }

        orders.slice().reverse().forEach(o => {
            const el = document.createElement('div');
            el.className = 'p-2 border rounded flex items-center justify-between gap-2';
            const date = o.createdAt ? new Date(o.createdAt).toLocaleString('id-ID') : '';
            el.innerHTML = `
                <div class="text-sm">
                    <div class="font-semibold">${o.id}</div>
                    <div class="text-xs text-gray-500">${(o.user && (o.user.name || o.user.email)) || 'Guest'} — ${date}</div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="text-sm font-medium">Rp${(o.total||0).toLocaleString('id-ID')}</div>
                    <button data-id="${o.id}" class="admin-view-order text-sm px-2 py-1 border rounded">View Details</button>
                </div>
            `;
            list.appendChild(el);
        });

        list.querySelectorAll('.admin-view-order').forEach(btn=>btn.addEventListener('click', ()=>{
            const id = btn.getAttribute('data-id');
            showOrderDetails(id);
        }));
    }

    function showOrderDetails(id){
        const details = document.getElementById('admin-order-details');
        if(!details) return;
        const orders = loadOrders();
        const o = (orders||[]).find(x=>x.id===id);
        if(!o){ details.classList.remove('hidden'); details.innerHTML = '<div class="text-sm text-red-600">Order not found</div>'; return; }
        const d = [];
        d.push(`<div class="font-semibold mb-2">Order ${o.id}</div>`);
        d.push(`<div class="text-xs text-gray-600 mb-2">${o.user ? (o.user.name||o.user.email) : 'Guest'} — ${o.createdAt ? new Date(o.createdAt).toLocaleString('id-ID') : ''}</div>`);
        d.push('<div class="space-y-1">');
        (o.items||[]).forEach(it=>{
            d.push(`<div class="flex justify-between"><div>${it.name} × ${it.quantity}</div><div>${it.salePrice || ('Rp'+(Number(it.price)||0).toLocaleString('id-ID'))}</div></div>`);
        });
        d.push('</div>');
        d.push(`<div class="mt-2 font-medium">Total: Rp${(o.total||0).toLocaleString('id-ID')}</div>`);
        details.innerHTML = d.join('');
        details.classList.remove('hidden');
    }

    function activateAdminTab(tab){
        const prodSec = document.getElementById('admin-products-section');
        const ordSec = document.getElementById('admin-orders-section');
        const tabProd = document.getElementById('admin-tab-products');
        const tabOrd = document.getElementById('admin-tab-orders');
        if(tab==='orders'){
            prodSec.classList.add('hidden'); ordSec.classList.remove('hidden'); tabProd.classList.remove('bg-gray-100'); tabOrd.classList.add('bg-gray-100'); renderOrdersList();
        } else {
            prodSec.classList.remove('hidden'); ordSec.classList.add('hidden'); tabProd.classList.add('bg-gray-100'); tabOrd.classList.remove('bg-gray-100');
        }
    }

    function refreshAdminVisibility(){
        const adminBtn = document.getElementById('admin-btn');
        if(!adminBtn) return;
        if(currentUserIsAdmin()) adminBtn.classList.remove('hidden'); else adminBtn.classList.add('hidden');
    }

    function initAdmin(){
        createAdminButton();
        createAdminPanel();
        refreshAdminVisibility();

        // re-check visibility when auth button is clicked (login/logout)
        document.getElementById('auth-btn')?.addEventListener('click', ()=> setTimeout(refreshAdminVisibility, 200));

        // tab buttons
        document.getElementById('admin-tab-products')?.addEventListener('click', ()=> activateAdminTab('products'));
        document.getElementById('admin-tab-orders')?.addEventListener('click', ()=> activateAdminTab('orders'));

        // close button
        document.getElementById('admin-close')?.addEventListener('click', closeAdminPanel);

        // refresh when products changed
        document.addEventListener('products:changed', ()=>{
            // ensure product listing visible reflects changes
            renderAdminList();
            try{
                filteredProducts = [...allProducts];
                clearProducts();
                loadProducts();
            }catch(e){/* ignore */}
        });
    }

    document.addEventListener('DOMContentLoaded', initAdmin);

})();

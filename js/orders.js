// Orders API — backed by Supabase only, no localStorage.
(function(){

    async function loadOrders(){
        try {
            return await window.supabaseAPI.fetchOrders();
        } catch(e) {
            console.warn('Failed to load orders from Supabase', e);
            return [];
        }
    }

    async function createOrder({items, user, shipping} = {}){
        var id = 'order-' + Date.now();
        var sanitizedItems = Array.isArray(items) ? items.map(function(i){
            return {
                id: i.id,
                name: i.name,
                price: Number(i.price) || 0,
                salePrice: i.salePrice || ('Rp' + (Number(i.price)||0).toLocaleString('id-ID')),
                quantity: Number(i.quantity) || 0,
                image1: i.image1 || ''
            };
        }) : [];

        var total = sanitizedItems.reduce(function(s,it){ return s + (Number(it.price)||0) * (Number(it.quantity)||0); }, 0);

        var order = {
            id: id,
            items: sanitizedItems,
            total: total,
            totalDisplay: 'Rp' + total.toLocaleString('id-ID'),
            user: user ? { id: user.id, email: user.email, name: user.name } : null,
            shipping: shipping ? {
                fullName: shipping.fullName || '',
                email: shipping.email || '',
                phone: shipping.phone || '',
                address: shipping.address || '',
                city: shipping.city || '',
                postalCode: shipping.postalCode || ''
            } : null,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        try {
            await window.supabaseAPI.saveOrder(order);
        } catch(e) {
            console.warn('Supabase saveOrder failed', e);
        }

        try{ sessionStorage.setItem('lastOrderId', id); } catch(e){}
        try{ document.dispatchEvent(new CustomEvent('orders:created', { detail: { order: order } })); } catch(e){}

        return order;
    }

    window.ordersAPI = {
        loadOrders: loadOrders,
        createOrder: createOrder
    };

})();

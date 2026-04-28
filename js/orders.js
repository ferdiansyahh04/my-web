// Orders API — backed by Supabase only, no localStorage.
(function(){

    async function loadOrders(options){
        try {
            return await window.supabaseAPI.fetchOrders(options);
        } catch(e) {
            console.warn('Failed to load orders from Supabase', e);
            return [];
        }
    }

    async function createOrder({items, user, shipping, pricing} = {}){
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Pesanan tidak valid: Keranjang kosong.');
        }
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

        var subtotal = sanitizedItems.reduce(function(s,it){ return s + (Number(it.price)||0) * (Number(it.quantity)||0); }, 0);
        var pricingInfo = pricing && typeof pricing === 'object' ? pricing : {};
        var shippingCost = Number(pricingInfo.shippingCost) || 0;
        var paymentFee = Number(pricingInfo.paymentFee) || 0;
        var discount = Number(pricingInfo.discount) || 0;
        var total = Number(pricingInfo.total);
        if (!Number.isFinite(total)) {
            total = Math.max(0, subtotal + shippingCost + paymentFee - discount);
        }

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
                postalCode: shipping.postalCode || '',
                shippingMethod: pricingInfo.shippingMethod || '',
                paymentMethod: pricingInfo.paymentMethod || '',
                subtotal: subtotal,
                shippingCost: shippingCost,
                paymentFee: paymentFee,
                discount: discount,
                promoCode: pricingInfo.promoCode || ''
            } : null,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        try {
            await window.supabaseAPI.saveOrder(order);
        } catch(error) {
            console.error('Failed to save order to Supabase:', error);
            throw new Error('Gagal menyimpan pesanan. Silakan coba lagi.');
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

// Orders persistence API
(function(){
    const ORDERS_KEY = 'voltx_orders';

    function loadOrders(){
        try{
            const raw = localStorage.getItem(ORDERS_KEY);
            return raw ? JSON.parse(raw) : [];
        }catch(e){ return []; }
    }

    function saveOrders(list){
        try{
            localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
        }catch(e){ console.warn('Failed to save orders', e); }
    }

    function getOrderById(id){
        const orders = loadOrders();
        return orders.find(o=>o.id===id) || null;
    }

    function createOrder({items, user, shipping} = {}){
        const id = 'order-' + Date.now();
        const sanitizedItems = Array.isArray(items) ? items.map(i=>({
            id: i.id,
            name: i.name,
            price: Number(i.price) || 0,
            salePrice: i.salePrice || `Rp${(Number(i.price)||0).toLocaleString('id-ID')}`,
            quantity: Number(i.quantity) || 0,
            image1: i.image1 || ''
        })) : [];

        const total = sanitizedItems.reduce((s,it)=>s + (Number(it.price)||0) * (Number(it.quantity)||0), 0);

        const order = {
            id,
            items: sanitizedItems,
            total,
            totalDisplay: `Rp${total.toLocaleString('id-ID')}`,
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

        const orders = loadOrders();
        orders.push(order);
        saveOrders(orders);

        try{ sessionStorage.setItem('lastOrderId', id); } catch(e){}

        // emit event
        try{ document.dispatchEvent(new CustomEvent('orders:created', { detail: { order } })); } catch(e){}

        return order;
    }

    window.ordersAPI = {
        loadOrders,
        saveOrders,
        createOrder,
        getOrderById
    };

})();

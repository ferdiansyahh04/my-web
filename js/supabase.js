// Supabase integration — full database backend for VOLTX store.
// All data (products, orders, auth) goes through Supabase.
(function () {
    const SUPABASE_URL = 'https://tayigsgwasmovkjngshh.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheWlnc2d3YXNtb3Zram5nc2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNTAyOTUsImV4cCI6MjA5MDcyNjI5NX0.75ejfnDjUkj_A_kUxvkQ1MALxU6foQiRgP8XaRi_ccs';

    let sb = null;

    function init() {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    }

    // ---------- Auth ----------

    async function signUp(email, password, name) {
        if (!sb) throw new Error('Supabase not initialized');
        const { data, error } = await sb.auth.signUp({
            email: email,
            password: password,
            options: { data: { name: name, role: 'user' } }
        });
        if (error) throw error;
        // Insert profile row
        if (data.user) {
            await sb.from('profiles').upsert({
                id: data.user.id,
                name: name,
                role: 'user'
            });
        }
        return data;
    }

    async function signIn(email, password) {
        if (!sb) throw new Error('Supabase not initialized');
        const { data, error } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        if (!sb) return;
        await sb.auth.signOut();
    }

    async function getSession() {
        if (!sb) return null;
        const { data } = await sb.auth.getSession();
        return data.session;
    }

    async function getUser() {
        if (!sb) return null;
        const { data } = await sb.auth.getUser();
        return data.user;
    }

    async function isAdmin() {
        if (!sb) return false;
        try {
            const session = await getSession();
            if (!session) return false;
            const { data, error } = await sb.from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();
            if (error || !data) return false;
            return data.role === 'admin';
        } catch (e) {
            return false;
        }
    }

    function onAuthStateChange(callback) {
        if (!sb) return { data: { subscription: { unsubscribe: function () {} } } };
        return sb.auth.onAuthStateChange(callback);
    }

    // ---------- Products ----------

    // Map JS camelCase to DB snake_case
    function toDbProduct(p) {
        var row = {};
        if (p.name !== undefined) row.name = p.name;
        if (p.originalPrice !== undefined) row.original_price = p.originalPrice;
        if (p.salePrice !== undefined) row.sale_price = p.salePrice;
        if (p.url !== undefined) row.url = p.url;
        if (p.image1 !== undefined) row.image1 = p.image1;
        if (p.image2 !== undefined) row.image2 = p.image2;
        if (p.hasDiscount !== undefined) row.has_discount = p.hasDiscount;
        if (p.isNew !== undefined) row.is_new = p.isNew;
        if (p.isBestSeller !== undefined) row.is_best_seller = p.isBestSeller;
        if (p.available !== undefined) row.available = p.available;
        if (p.category !== undefined) row.category = p.category;
        return row;
    }

    // Map DB snake_case to JS camelCase
    function fromDbProduct(row) {
        return {
            id: row.id,
            name: row.name || '',
            originalPrice: row.original_price || '',
            salePrice: row.sale_price || '',
            url: row.url || '',
            image1: row.image1 || '',
            image2: row.image2 || '',
            hasDiscount: !!row.has_discount,
            isNew: !!row.is_new,
            isBestSeller: !!row.is_best_seller,
            available: row.available !== false,
            category: row.category || '',
            created_at: row.created_at
        };
    }

    async function fetchProducts() {
        if (!sb) return null;
        try {
            const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data ? data.map(fromDbProduct) : null;
        } catch (e) {
            console.warn('Supabase fetchProducts failed', e);
            return null;
        }
    }

    async function addProduct(product) {
        if (!sb) throw new Error('Supabase not initialized');
        var row = toDbProduct(product);
        const { data, error } = await sb.from('products').insert([row]).select();
        if (error) throw error;
        return data[0] ? fromDbProduct(data[0]) : null;
    }

    async function updateProduct(id, updates) {
        if (!sb) throw new Error('Supabase not initialized');
        var row = toDbProduct(updates);
        const { data, error } = await sb.from('products').update(row).eq('id', id).select();
        if (error) throw error;
        return data[0] ? fromDbProduct(data[0]) : null;
    }

    async function deleteProduct(id) {
        if (!sb) throw new Error('Supabase not initialized');
        const { error } = await sb.from('products').delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    // ---------- Orders ----------

    async function saveOrder(order) {
        if (!sb) throw new Error('Supabase not initialized');
        var row = {
            order_id: order.id,
            items: order.items,
            total: order.total,
            total_display: order.totalDisplay,
            user_email: order.user ? order.user.email : null,
            user_name: order.user ? order.user.name : null,
            shipping: order.shipping,
            status: order.status || 'pending',
            created_at: order.createdAt || new Date().toISOString()
        };
        var { data, error } = await sb.from('orders').insert([row]).select();
        if (error) throw error;
        return data[0];
    }

    async function fetchOrders() {
        if (!sb) return [];
        try {
            var { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map(function (row) {
                return {
                    id: row.order_id || row.id,
                    items: row.items || [],
                    total: row.total || 0,
                    totalDisplay: row.total_display || '',
                    user: { email: row.user_email, name: row.user_name },
                    shipping: row.shipping,
                    status: row.status,
                    createdAt: row.created_at
                };
            });
        } catch (e) {
            console.warn('Supabase fetchOrders failed', e);
            return [];
        }
    }

    // Initialize on load
    init();

    // Public API
    window.supabaseAPI = {
        // Auth
        signUp: signUp,
        signIn: signIn,
        signOut: signOut,
        getSession: getSession,
        getUser: getUser,
        isAdmin: isAdmin,
        onAuthStateChange: onAuthStateChange,
        // Products
        fetchProducts: fetchProducts,
        addProduct: addProduct,
        updateProduct: updateProduct,
        deleteProduct: deleteProduct,
        // Orders
        saveOrder: saveOrder,
        fetchOrders: fetchOrders,
        // Client
        getClient: function () { return sb; }
    };
})();

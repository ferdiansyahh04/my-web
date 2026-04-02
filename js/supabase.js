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

    async function fetchProducts() {
        if (!sb) return null;
        try {
            const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (e) {
            console.warn('Supabase fetchProducts failed', e);
            return null;
        }
    }

    async function addProduct(product) {
        if (!sb) throw new Error('Supabase not initialized');
        const { data, error } = await sb.from('products').insert([product]).select();
        if (error) throw error;
        return data[0];
    }

    async function updateProduct(id, updates) {
        if (!sb) throw new Error('Supabase not initialized');
        const { data, error } = await sb.from('products').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
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

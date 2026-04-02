// Supabase integration — product fetching & order saving.
// Falls back to localStorage gracefully if Supabase is unreachable.
(function () {
    const SUPABASE_URL = 'https://tayigsgwasmovkjngshh.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_U7-OLpfeZW2nNza4g_plSg_e6IEwFa_';

    let sb = null;

    function init() {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    }

    // ---------- Products ----------

    /**
     * Fetch products from Supabase `products` table.
     * Returns array of product objects or null on failure.
     */
    async function fetchProducts() {
        if (!sb) return null;
        try {
            const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (e) {
            console.warn('Supabase fetchProducts failed, using local data', e);
            return null;
        }
    }

    // ---------- Orders ----------

    /**
     * Save an order to Supabase `orders` table.
     * Does not throw — silently logs on failure so checkout flow is never blocked.
     */
    async function saveOrder(order) {
        if (!sb) return null;
        try {
            const row = {
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
            const { data, error } = await sb.from('orders').insert([row]);
            if (error) throw error;
            return data;
        } catch (e) {
            console.warn('Supabase saveOrder failed, order saved locally only', e);
            return null;
        }
    }

    // Initialize on load
    init();

    // Public API
    window.supabaseAPI = {
        fetchProducts: fetchProducts,
        saveOrder: saveOrder,
        getClient: function () { return sb; }
    };
})();

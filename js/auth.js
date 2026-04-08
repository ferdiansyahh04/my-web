(function () {
    var cachedUser = null;
    var authReadyResolve = function () {};
    var authReady = new Promise(function (resolve) {
        authReadyResolve = resolve;
    });

    function qs(id) {
        return document.getElementById(id);
    }

    function normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    }

    function getUserName(user) {
        var meta = (user && user.user_metadata) || {};
        if (meta.name) return meta.name;
        var email = user && user.email ? String(user.email) : '';
        return email ? email.split('@')[0] : 'Account';
    }

    function setCachedUserFromSession(session) {
        if (session && session.user) {
            cachedUser = {
                id: session.user.id,
                email: session.user.email,
                name: getUserName(session.user)
            };
            return cachedUser;
        }
        cachedUser = null;
        return null;
    }

    function getAuthErrorMessage(error, isRegister) {
        var fallback = isRegister ? 'Registration failed.' : 'Invalid email or password.';
        if (!error) return fallback;

        var raw = String(error.message || '').trim();
        var message = raw.toLowerCase();

        if (message.indexOf('invalid login credentials') !== -1) return 'Invalid email or password.';
        if (message.indexOf('email not confirmed') !== -1) return 'Please confirm your email before signing in.';
        if (message.indexOf('user already registered') !== -1) return 'This email is already registered. Please sign in instead.';
        if (message.indexOf('password should be at least 6 characters') !== -1) return 'Password must be at least 6 characters.';

        return raw || fallback;
    }

    function showToast(message, type) {
        if (!message) return;

        var root = document.getElementById('app-toast-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'app-toast-root';
            root.className = 'fixed right-4 top-20 z-[1300] flex w-[min(92vw,22rem)] flex-col gap-3';
            document.body.appendChild(root);
        }

        var toast = document.createElement('div');
        var palette = type === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700';
        toast.className = 'rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ' + palette;
        toast.textContent = message;
        root.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-4px)';
            toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 180);
        }, 2800);
    }

    async function restoreSession() {
        try {
            var session = await window.supabaseAPI.getSession();
            return setCachedUserFromSession(session);
        } catch (error) {
            cachedUser = null;
            return null;
        }
    }

    function getCurrentUser() {
        return cachedUser;
    }

    function isLoggedIn() {
        return !!cachedUser;
    }

    function formatOrderCurrency(value) {
        return 'Rp' + (Number(value) || 0).toLocaleString('id-ID');
    }

    function formatOrderDate(value) {
        if (!value) return '-';
        try {
            return new Date(value).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        } catch (error) {
            return value;
        }
    }

    function formatOrderStatus(value) {
        var status = String(value || 'pending').toLowerCase();
        if (status === 'pending') return 'Menunggu';
        if (status === 'paid') return 'Dibayar';
        if (status === 'processing') return 'Diproses';
        if (status === 'shipped') return 'Dikirim';
        if (status === 'completed') return 'Selesai';
        if (status === 'cancelled') return 'Dibatalkan';
        return value || 'Menunggu';
    }

    function getRedirectAfterLogin() {
        try {
            return sessionStorage.getItem('authRedirect') || '';
        } catch (error) {
            return '';
        }
    }

    function clearRedirectAfterLogin() {
        try {
            sessionStorage.removeItem('authRedirect');
        } catch (error) {
            // ignore
        }
    }

    function updateAuthButton() {
        var button = qs('auth-btn');
        if (!button) return;

        if (cachedUser) {
            button.textContent = cachedUser.name || cachedUser.email || 'Account';
            button.classList.remove('bg-white');
            button.classList.add('bg-gray-100');
        } else {
            button.textContent = 'Login';
            button.classList.remove('bg-gray-100');
            button.classList.add('bg-white');
        }
    }

    function updateLogoutButton() {
        var button = qs('logout-btn');
        if (!button) return;
        button.classList.toggle('hidden', !cachedUser);
    }

    function createAuthModal() {
        if (qs('auth-modal')) return;

        var html = '\
        <div id="auth-modal" class="fixed inset-0 z-[1200] hidden">\
          <div id="auth-backdrop" class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>\
          <div class="relative min-h-screen flex items-center justify-center p-4 md:p-8">\
            <div class="auth-shell relative w-full max-w-5xl overflow-hidden rounded-[2rem] shadow-2xl">\
              <button id="auth-close" class="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950" aria-label="Close auth modal">&times;</button>\
              <div class="grid md:grid-cols-[1.05fr_0.95fr]">\
                <div class="auth-panel-brand relative px-8 py-10 md:px-12 md:py-14">\
                  <div class="auth-brand-badge">VOLTX STORE</div>\
                  <div class="mt-10 max-w-md">\
                    <p class="auth-kicker">Member access</p>\
                    <h2 class="mt-3 text-4xl font-black leading-tight text-white md:text-5xl">Upgrade your setup,<br>then keep it saved.</h2>\
                    <p class="mt-5 text-sm leading-6 text-slate-200 md:text-base">Sign in to track orders, save your cart, and access premium drops built for your desk and gaming setup.</p>\
                  </div>\
                  <div class="auth-feature-list mt-10 space-y-4 text-sm text-slate-100">\
                    <div class="auth-feature-item">Fast checkout with your saved session</div>\
                    <div class="auth-feature-item">Access order history and account details</div>\
                    <div class="auth-feature-item">Member-only promos and early product drops</div>\
                  </div>\
                </div>\
                <div class="auth-panel-form bg-white px-6 py-8 md:px-10 md:py-12">\
                  <div class="mx-auto w-full max-w-md">\
                    <p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Authentication</p>\
                    <h3 id="auth-title" class="mt-2 text-3xl font-black tracking-tight text-slate-900">Welcome back</h3>\
                    <p id="auth-subtitle" class="mt-2 text-sm text-slate-500">Use your account to continue shopping.</p>\
                    <div class="auth-tab-row mt-8 grid grid-cols-2 rounded-full bg-slate-100 p-1">\
                      <button type="button" id="show-login" class="auth-tab active rounded-full px-4 py-3 text-sm font-semibold">Sign in</button>\
                      <button type="button" id="show-register" class="auth-tab rounded-full px-4 py-3 text-sm font-semibold">Create account</button>\
                    </div>\
                    <div id="auth-success" class="mt-5 hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"></div>\
                    <div class="mt-8">\
                      <form id="login-form" class="space-y-4" novalidate>\
                        <label class="block text-sm font-medium text-slate-700">Email\
                          <input id="login-email" placeholder="you@example.com" type="email" class="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition" />\
                        </label>\
                        <p id="login-email-error" class="auth-inline-error"></p>\
                        <label class="block text-sm font-medium text-slate-700">Password\
                          <div class="auth-password-wrap mt-2">\
                            <input id="login-password" placeholder="Enter your password" type="password" class="auth-input w-full rounded-2xl border border-slate-200 px-4 py-3 pr-16 text-slate-900 outline-none transition" />\
                            <button type="button" class="auth-password-toggle" data-password-toggle="login-password">Show</button>\
                          </div>\
                        </label>\
                        <p id="login-password-error" class="auth-inline-error"></p>\
                        <p id="login-form-message" class="auth-form-message"></p>\
                        <button id="login-submit" data-auth-submit type="submit" class="auth-submit-button">Sign in</button>\
                        <p class="text-center text-sm text-slate-500">New here? <button type="button" id="show-register-link" class="font-semibold text-slate-900 hover:text-slate-700">Create an account</button></p>\
                      </form>\
                      <form id="register-form" class="hidden space-y-4" novalidate>\
                        <label class="block text-sm font-medium text-slate-700">Full name\
                          <input id="reg-name" placeholder="Your full name" type="text" class="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition" />\
                        </label>\
                        <p id="reg-name-error" class="auth-inline-error"></p>\
                        <label class="block text-sm font-medium text-slate-700">Email\
                          <input id="reg-email" placeholder="you@example.com" type="email" class="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition" />\
                        </label>\
                        <p id="reg-email-error" class="auth-inline-error"></p>\
                        <label class="block text-sm font-medium text-slate-700">Password\
                          <div class="auth-password-wrap mt-2">\
                            <input id="reg-password" placeholder="Minimum 6 characters" type="password" class="auth-input w-full rounded-2xl border border-slate-200 px-4 py-3 pr-16 text-slate-900 outline-none transition" />\
                            <button type="button" class="auth-password-toggle" data-password-toggle="reg-password">Show</button>\
                          </div>\
                        </label>\
                        <p id="reg-password-error" class="auth-inline-error"></p>\
                        <p id="register-form-message" class="auth-form-message"></p>\
                        <button id="register-submit" data-auth-submit type="submit" class="auth-submit-button">Create account</button>\
                        <p class="text-center text-sm text-slate-500">Already have an account? <button type="button" id="show-login-link" class="font-semibold text-slate-900 hover:text-slate-700">Sign in</button></p>\
                      </form>\
                    </div>\
                  </div>\
                </div>\
              </div>\
            </div>\
          </div>\
        </div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    function createAccountModal() {
        if (qs('account-modal')) return;

        var html = '\
        <div id="account-modal" class="fixed inset-0 z-[1190] hidden">\
          <div id="account-backdrop" class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"></div>\
          <div class="relative flex min-h-screen items-start justify-center p-4 md:p-8">\
            <div class="account-shell mt-16 flex w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">\
              <div class="flex flex-shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 md:px-8">\
                <div>\
                  <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Akun Saya</p>\
                  <h3 id="account-title" class="mt-2 text-2xl font-black tracking-tight text-slate-900">Riwayat Pesanan</h3>\
                  <p id="account-subtitle" class="mt-1 text-sm text-slate-500">Lihat semua pesanan yang sudah Anda buat.</p>\
                </div>\
                <button id="account-close" class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950" aria-label="Close account modal">&times;</button>\
              </div>\
              <div class="account-body min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-8 md:py-6">\
                <div id="account-status" class="mb-5 hidden rounded-2xl border px-4 py-3 text-sm font-medium"></div>\
                <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4">\
                  <div>\
                    <div id="account-user-name" class="text-sm font-semibold text-slate-900"></div>\
                    <div id="account-user-email" class="text-sm text-slate-500"></div>\
                  </div>\
                  <button id="account-refresh" type="button" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950">Muat Ulang</button>\
                </div>\
                <div id="account-orders" class="mt-6 space-y-4"></div>\
              </div>\
            </div>\
          </div>\
        </div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    function showSuccessMessage(message) {
        var node = qs('auth-success');
        if (!node) return;
        node.textContent = message || '';
        node.classList.toggle('hidden', !message);
    }

    function setAccountStatus(message, type) {
        var node = qs('account-status');
        if (!node) return;

        if (!message) {
            node.textContent = '';
            node.className = 'mb-5 hidden rounded-2xl border px-4 py-3 text-sm font-medium';
            return;
        }

        node.textContent = message;
        node.className = 'mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ' +
            (type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700');
    }

    function setFormMessage(formName, message) {
        var node = qs(formName + '-form-message');
        if (!node) return;
        node.textContent = message || '';
        node.classList.toggle('has-message', !!message);
    }

    function setFieldError(fieldId, message) {
        var input = qs(fieldId);
        var error = qs(fieldId + '-error');
        if (input) input.classList.toggle('auth-input-error', !!message);
        if (error) error.textContent = message || '';
    }

    function clearLoginErrors() {
        setFieldError('login-email', '');
        setFieldError('login-password', '');
        setFormMessage('login', '');
    }

    function clearRegisterErrors() {
        setFieldError('reg-name', '');
        setFieldError('reg-email', '');
        setFieldError('reg-password', '');
        setFormMessage('register', '');
    }

    function validateLoginFields() {
        var email = normalizeEmail(qs('login-email') ? qs('login-email').value : '');
        var password = qs('login-password') ? qs('login-password').value : '';
        var valid = true;

        clearLoginErrors();

        if (!email) {
            setFieldError('login-email', 'Email is required.');
            valid = false;
        } else if (!isValidEmail(email)) {
            setFieldError('login-email', 'Enter a valid email address.');
            valid = false;
        }

        if (!password) {
            setFieldError('login-password', 'Password is required.');
            valid = false;
        }

        return valid;
    }

    function validateRegisterFields() {
        var name = qs('reg-name') ? qs('reg-name').value.trim() : '';
        var email = normalizeEmail(qs('reg-email') ? qs('reg-email').value : '');
        var password = qs('reg-password') ? qs('reg-password').value : '';
        var valid = true;

        clearRegisterErrors();

        if (!name) {
            setFieldError('reg-name', 'Full name is required.');
            valid = false;
        }
        if (!email) {
            setFieldError('reg-email', 'Email is required.');
            valid = false;
        } else if (!isValidEmail(email)) {
            setFieldError('reg-email', 'Enter a valid email address.');
            valid = false;
        }
        if (!password) {
            setFieldError('reg-password', 'Password is required.');
            valid = false;
        } else if (password.length < 6) {
            setFieldError('reg-password', 'Password must be at least 6 characters.');
            valid = false;
        }

        return valid;
    }

    function setLoadingState(formName, isLoading) {
        var submit = qs(formName + '-submit');
        if (!submit) return;

        submit.disabled = !!isLoading;
        submit.classList.toggle('opacity-60', !!isLoading);
        submit.classList.toggle('cursor-not-allowed', !!isLoading);
        submit.textContent = isLoading
            ? (formName === 'login' ? 'Signing in...' : 'Creating account...')
            : (formName === 'login' ? 'Sign in' : 'Create account');
    }

    function showLoginForm() {
        var loginForm = qs('login-form');
        var registerForm = qs('register-form');
        var title = qs('auth-title');
        var subtitle = qs('auth-subtitle');
        var loginTab = qs('show-login');
        var registerTab = qs('show-register');

        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
        if (title) title.textContent = 'Welcome back';
        if (subtitle) subtitle.textContent = 'Use your account to continue shopping.';
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
    }

    function showRegisterForm() {
        var loginForm = qs('login-form');
        var registerForm = qs('register-form');
        var title = qs('auth-title');
        var subtitle = qs('auth-subtitle');
        var loginTab = qs('show-login');
        var registerTab = qs('show-register');

        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
        if (title) title.textContent = 'Create account';
        if (subtitle) subtitle.textContent = 'Set up your member profile for faster checkout.';
        if (loginTab) loginTab.classList.remove('active');
        if (registerTab) registerTab.classList.add('active');
    }

    function openAccountModal() {
        createAccountModal();

        var modal = qs('account-modal');
        var userName = qs('account-user-name');
        var userEmail = qs('account-user-email');

        if (userName) userName.textContent = (cachedUser && cachedUser.name) || 'Akun';
        if (userEmail) userEmail.textContent = (cachedUser && cachedUser.email) || '';

        setAccountStatus('', '');
        if (modal) modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        loadAccountOrders();
    }

    function closeAccountModal() {
        var modal = qs('account-modal');
        if (modal) modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    function createAccountMetaBadge(label) {
        var badge = document.createElement('span');
        badge.className = 'inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600';
        badge.textContent = label;
        return badge;
    }

    function createAccountOrderCard(order) {
        var card = document.createElement('article');
        card.className = 'rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5';

        var topRow = document.createElement('div');
        topRow.className = 'flex flex-col gap-3 md:flex-row md:items-start md:justify-between';

        var left = document.createElement('div');

        var orderId = document.createElement('div');
        orderId.className = 'text-base font-semibold text-slate-900';
        orderId.textContent = order.id || '-';

        var orderDate = document.createElement('div');
        orderDate.className = 'mt-1 text-sm text-slate-500';
        orderDate.textContent = formatOrderDate(order.createdAt);

        left.appendChild(orderId);
        left.appendChild(orderDate);

        var right = document.createElement('div');
        right.className = 'flex flex-wrap items-center gap-2';
        right.appendChild(createAccountMetaBadge('Total ' + formatOrderCurrency(order.total)));
        right.appendChild(createAccountMetaBadge('Status ' + formatOrderStatus(order.status)));

        topRow.appendChild(left);
        topRow.appendChild(right);
        card.appendChild(topRow);

        var itemsWrap = document.createElement('div');
        itemsWrap.className = 'mt-4 space-y-2';

        (order.items || []).forEach(function (item) {
            var row = document.createElement('div');
            row.className = 'flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3';

            var details = document.createElement('div');

            var name = document.createElement('div');
            name.className = 'text-sm font-medium text-slate-800';
            name.textContent = item.name || 'Produk';

            var qty = document.createElement('div');
            qty.className = 'mt-1 text-xs text-slate-500';
            qty.textContent = 'Jumlah: ' + (Number(item.quantity) || 0);

            details.appendChild(name);
            details.appendChild(qty);

            var amount = document.createElement('div');
            amount.className = 'text-sm font-semibold text-slate-700';
            amount.textContent = item.salePrice || formatOrderCurrency(item.price);

            row.appendChild(details);
            row.appendChild(amount);
            itemsWrap.appendChild(row);
        });

        card.appendChild(itemsWrap);

        if (order.shipping && (order.shipping.address || order.shipping.city)) {
            var shipping = document.createElement('div');
            shipping.className = 'mt-4 text-sm text-slate-500';

            var shippingParts = [];
            if (order.shipping.address) shippingParts.push(order.shipping.address);
            if (order.shipping.city) shippingParts.push(order.shipping.city);
            if (order.shipping.postalCode) shippingParts.push(order.shipping.postalCode);

            shipping.textContent = 'Dikirim ke: ' + shippingParts.join(', ');
            card.appendChild(shipping);
        }

        return card;
    }

    async function loadAccountOrders() {
        var list = qs('account-orders');
        if (!list) return;

        list.innerHTML = '<div class="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Memuat riwayat pesanan...</div>';

        try {
            if (!window.ordersAPI || typeof window.ordersAPI.loadOrders !== 'function') {
                throw new Error('Orders API belum siap.');
            }

            var orders = await window.ordersAPI.loadOrders();
            list.innerHTML = '';

            if (!orders || orders.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center';

                var emptyTitle = document.createElement('div');
                emptyTitle.className = 'text-base font-semibold text-slate-800';
                emptyTitle.textContent = 'Belum ada pesanan';

                var emptyText = document.createElement('div');
                emptyText.className = 'mt-2 text-sm text-slate-500';
                emptyText.textContent = 'Pesanan Anda akan muncul di sini setelah checkout berhasil.';

                empty.appendChild(emptyTitle);
                empty.appendChild(emptyText);
                list.appendChild(empty);
                return;
            }

            orders.forEach(function (order) {
                list.appendChild(createAccountOrderCard(order));
            });
        } catch (error) {
            console.error('Failed to load account orders', error);
            list.innerHTML = '';
            setAccountStatus('Riwayat pesanan belum bisa dimuat. Silakan coba lagi.', 'error');
        }
    }

    function openAuthModal(mode) {
        createAuthModal();
        if (mode === 'register') showRegisterForm();
        else showLoginForm();

        showSuccessMessage('');
        clearLoginErrors();
        clearRegisterErrors();

        var modal = qs('auth-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeAuthModal() {
        var modal = qs('auth-modal');
        if (modal) modal.classList.add('hidden');
    }

    async function registerUser(payload) {
        var email = normalizeEmail(payload.email);
        var password = payload.password || '';
        var name = (payload.name || '').trim();

        if (!name) return { ok: false, message: 'Full name is required.' };
        if (!email) return { ok: false, message: 'Email is required.' };
        if (!isValidEmail(email)) return { ok: false, message: 'Enter a valid email address.' };
        if (!password) return { ok: false, message: 'Password is required.' };
        if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters.' };

        try {
            var data = await window.supabaseAPI.signUp(email, password, name);
            return {
                ok: true,
                message: data.session
                    ? 'Account created successfully. Please sign in to continue.'
                    : 'Account created. Check your email to confirm your account, then sign in.'
            };
        } catch (error) {
            return { ok: false, message: getAuthErrorMessage(error, true) };
        }
    }

    async function loginUser(email, password) {
        var normalizedEmail = normalizeEmail(email);
        var safePassword = String(password || '');

        if (!normalizedEmail) return { ok: false, message: 'Email is required.' };
        if (!isValidEmail(normalizedEmail)) return { ok: false, message: 'Enter a valid email address.' };
        if (!safePassword) return { ok: false, message: 'Password is required.' };

        try {
            var data = await window.supabaseAPI.signIn(normalizedEmail, safePassword);
            if (data && data.user) {
                cachedUser = {
                    id: data.user.id,
                    email: data.user.email,
                    name: getUserName(data.user)
                };
                return { ok: true, user: cachedUser };
            }
            return { ok: false, message: 'Login failed.' };
        } catch (error) {
            return { ok: false, message: getAuthErrorMessage(error, false) };
        }
    }

    async function logoutUser() {
        try {
            await window.supabaseAPI.signOut();
            cachedUser = null;
        } catch (error) {
            return { ok: false, message: getAuthErrorMessage(error, false) };
        }

        try {
            sessionStorage.removeItem('openAuth');
            sessionStorage.removeItem('authRedirect');
        } catch (error) {
            // ignore
        }

        return { ok: true };
    }

    function bindPasswordToggles() {
        var toggles = document.querySelectorAll('[data-password-toggle]');
        Array.prototype.forEach.call(toggles, function (toggle) {
            toggle.addEventListener('click', function () {
                var input = qs(toggle.getAttribute('data-password-toggle'));
                if (!input) return;
                var nextType = input.type === 'password' ? 'text' : 'password';
                input.type = nextType;
                toggle.textContent = nextType === 'password' ? 'Show' : 'Hide';
            });
        });
    }

    function bindFieldValidation() {
        [
            { id: 'login-email', validate: validateLoginFields, clear: clearLoginErrors },
            { id: 'login-password', validate: validateLoginFields, clear: clearLoginErrors },
            { id: 'reg-name', validate: validateRegisterFields, clear: clearRegisterErrors },
            { id: 'reg-email', validate: validateRegisterFields, clear: clearRegisterErrors },
            { id: 'reg-password', validate: validateRegisterFields, clear: clearRegisterErrors }
        ].forEach(function (config) {
            var input = qs(config.id);
            if (!input) return;

            input.addEventListener('input', function () {
                config.clear();
                if (config.id.indexOf('reg-') === 0) showSuccessMessage('');
            });

            input.addEventListener('blur', config.validate);
        });
    }

    function bindAuthUI() {
        createAuthModal();
        createAccountModal();
        bindPasswordToggles();
        bindFieldValidation();

        var authButton = qs('auth-btn');
        if (authButton) {
            authButton.addEventListener('click', function () {
                authReady.then(function () {
                    if (!isLoggedIn()) {
                        openAuthModal('login');
                        return;
                    }
                    openAccountModal();
                });
            });
        }

        var logoutButton = qs('logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', function () {
                logoutUser().then(function (result) {
                    if (!result.ok) {
                        setFormMessage('login', result.message || 'Logout failed.');
                        openAuthModal('login');
                        showToast(result.message || 'Logout failed.', 'error');
                        return;
                    }
                    updateAuthButton();
                    updateLogoutButton();
                    closeAuthModal();
                    closeAccountModal();
                    showToast('Signed out successfully.', 'success');
                    document.dispatchEvent(new CustomEvent('auth:changed'));
                });
            });
        }

        var closeButton = qs('auth-close');
        if (closeButton) closeButton.addEventListener('click', closeAuthModal);
        var backdrop = qs('auth-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeAuthModal);
        var accountCloseButton = qs('account-close');
        if (accountCloseButton) accountCloseButton.addEventListener('click', closeAccountModal);
        var accountBackdrop = qs('account-backdrop');
        if (accountBackdrop) accountBackdrop.addEventListener('click', closeAccountModal);
        var accountRefreshButton = qs('account-refresh');
        if (accountRefreshButton) {
            accountRefreshButton.addEventListener('click', function () {
                setAccountStatus('', '');
                loadAccountOrders();
            });
        }
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeAuthModal();
                closeAccountModal();
            }
        });

        var showRegisterButton = qs('show-register');
        if (showRegisterButton) showRegisterButton.addEventListener('click', showRegisterForm);
        var showRegisterLink = qs('show-register-link');
        if (showRegisterLink) showRegisterLink.addEventListener('click', showRegisterForm);

        var showLoginButton = qs('show-login');
        if (showLoginButton) showLoginButton.addEventListener('click', showLoginForm);
        var showLoginLink = qs('show-login-link');
        if (showLoginLink) showLoginLink.addEventListener('click', showLoginForm);

        var loginForm = qs('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async function (event) {
                event.preventDefault();
                showSuccessMessage('');
                if (!validateLoginFields()) return;

                setLoadingState('login', true);
                setFormMessage('login', '');

                var email = qs('login-email').value;
                var password = qs('login-password').value;
                var result = await loginUser(email, password);

                setLoadingState('login', false);

                if (!result.ok) {
                    setFormMessage('login', result.message || 'Login failed.');
                    showToast(result.message || 'Login failed.', 'error');
                    return;
                }

                qs('login-password').value = '';
                updateAuthButton();
                updateLogoutButton();
                closeAuthModal();
                showToast('Signed in successfully.', 'success');
                document.dispatchEvent(new CustomEvent('auth:changed'));

                var nextUrl = getRedirectAfterLogin();
                clearRedirectAfterLogin();
                if (nextUrl) {
                    window.location.href = nextUrl;
                    return;
                }

                window.location.reload();
            });
        }

        var registerForm = qs('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async function (event) {
                event.preventDefault();
                showSuccessMessage('');
                if (!validateRegisterFields()) return;

                setLoadingState('register', true);
                setFormMessage('register', '');

                var emailValue = qs('reg-email').value;
                var result = await registerUser({
                    name: qs('reg-name').value,
                    email: emailValue,
                    password: qs('reg-password').value
                });

                setLoadingState('register', false);

                if (!result.ok) {
                    setFormMessage('register', result.message || 'Registration failed.');
                    showToast(result.message || 'Registration failed.', 'error');
                    return;
                }

                qs('reg-name').value = '';
                qs('reg-email').value = '';
                qs('reg-password').value = '';
                clearRegisterErrors();
                showLoginForm();
                qs('login-email').value = normalizeEmail(emailValue);
                showSuccessMessage(result.message || 'Account created successfully. Please sign in.');
                showToast(result.message || 'Account created successfully.', 'success');
            });
        }

        updateAuthButton();
        updateLogoutButton();

        if (window.supabaseAPI && typeof window.supabaseAPI.onAuthStateChange === 'function') {
            window.supabaseAPI.onAuthStateChange(function (_event, session) {
                setCachedUserFromSession(session);
                updateAuthButton();
                updateLogoutButton();
                if (!cachedUser) closeAccountModal();
                document.dispatchEvent(new CustomEvent('auth:changed'));
            });
        }

        document.addEventListener('orders:created', function () {
            var modal = qs('account-modal');
            if (modal && !modal.classList.contains('hidden') && cachedUser) {
                setAccountStatus('Riwayat pesanan berhasil diperbarui.', 'success');
                loadAccountOrders();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        restoreSession().then(function () {
            bindAuthUI();
            authReadyResolve(true);
            document.dispatchEvent(new CustomEvent('auth:ready'));
            document.dispatchEvent(new CustomEvent('auth:changed'));

            try {
                if (sessionStorage.getItem('openAuth')) {
                    sessionStorage.removeItem('openAuth');
                    openAuthModal('login');
                }
            } catch (error) {
                // ignore
            }
        });
    });

    window.auth = {
        registerUser: registerUser,
        loginUser: loginUser,
        logoutUser: logoutUser,
        getCurrentUser: getCurrentUser,
        isLoggedIn: isLoggedIn,
        openAuthModal: openAuthModal,
        updateAuthButton: updateAuthButton,
        restoreSession: restoreSession,
        whenReady: function () {
            return authReady;
        },
        showToast: showToast
    };
})();

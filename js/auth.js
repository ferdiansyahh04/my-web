(function () {
    // Supabase Auth — no localStorage user management.
    // Session is managed entirely by the Supabase client.

    var cachedUser = null;

    function qs(id) {
        return document.getElementById(id);
    }

    function setCachedUserFromSession(session) {
        if (session && session.user) {
            var meta = session.user.user_metadata || {};
            cachedUser = {
                id: session.user.id,
                email: session.user.email,
                name: meta.name || session.user.email.split('@')[0]
            };
            return cachedUser;
        }
        cachedUser = null;
        return null;
    }

    async function registerUser(payload) {
        var email = (payload.email || '').toLowerCase().trim();
        var password = payload.password || '';
        var name = payload.name || email.split('@')[0];

        if (!email || !password) {
            return { ok: false, message: 'Email and password required' };
        }
        if (password.length < 6) {
            return { ok: false, message: 'Password must be at least 6 characters' };
        }

        try {
            var data = await window.supabaseAPI.signUp(email, password, name);
            if (data.user) {
                cachedUser = { id: data.user.id, email: email, name: name };
                return { ok: true, user: cachedUser };
            }
            return { ok: false, message: 'Registration failed' };
        } catch (e) {
            return { ok: false, message: e.message || 'Registration failed' };
        }
    }

    async function loginUser(email, password) {
        var normalizedEmail = (email || '').toLowerCase().trim();
        try {
            var data = await window.supabaseAPI.signIn(normalizedEmail, password);
            if (data.user) {
                var meta = data.user.user_metadata || {};
                cachedUser = { id: data.user.id, email: data.user.email, name: meta.name || normalizedEmail.split('@')[0] };
                return { ok: true, user: cachedUser };
            }
            return { ok: false, message: 'Login failed' };
        } catch (e) {
            return { ok: false, message: e.message || 'Invalid email or password' };
        }
    }

    async function logoutUser() {
        try {
            await window.supabaseAPI.signOut();
            await restoreSession();
        } catch (e) {
            return { ok: false, message: e.message || 'Logout failed' };
        }
        try {
            sessionStorage.removeItem('pendingCart');
            sessionStorage.removeItem('checkoutData');
            sessionStorage.removeItem('checkoutShipping');
            sessionStorage.removeItem('openAuth');
        } catch (e) {
            // ignore
        }
        return { ok: true };
    }

    function getCurrentUser() {
        return cachedUser;
    }

    function isLoggedIn() {
        return !!cachedUser;
    }

    // Restore session from Supabase on load
    async function restoreSession() {
        try {
            var session = await window.supabaseAPI.getSession();
            setCachedUserFromSession(session);
        } catch (e) {
            cachedUser = null;
        }
    }

    function createAuthModal() {
        if (qs('auth-modal')) {
            return;
        }

        var html = '\
        <div id="auth-modal" class="fixed inset-0 z-80 hidden">\
          <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>\
          <div class="relative min-h-screen flex items-center justify-center p-4 md:p-8">\
            <div class="auth-shell relative w-full max-w-5xl overflow-hidden rounded-[2rem] shadow-2xl">\
              <button id="auth-close" class="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20" aria-label="Close auth modal">\u2715</button>\
              <div class="grid md:grid-cols-[1.05fr_0.95fr]">\
                <div class="auth-panel-brand relative px-8 py-10 md:px-12 md:py-14">\
                  <div class="auth-brand-badge">VOLTX STORE</div>\
                  <div class="mt-10 max-w-md">\
                    <p class="auth-kicker">Member access</p>\
                    <h2 class="mt-3 text-4xl font-black leading-tight text-white md:text-5xl">Upgrade your setup,<br>then keep it saved.</h2>\
                    <p class="mt-5 text-sm leading-6 text-slate-200 md:text-base">Sign in to track orders, save your cart, and access the premium drops built for your desk and gaming setup.</p>\
                  </div>\
                  <div class="auth-feature-list mt-10 space-y-4 text-sm text-slate-100">\
                    <div class="auth-feature-item">Fast checkout with your saved session</div>\
                    <div class="auth-feature-item">Access order history and account details</div>\
                    <div class="auth-feature-item">Member-only promos and early product drops</div>\
                  </div>\
                </div>\
                <div class="auth-panel-form bg-white px-6 py-8 md:px-10 md:py-12">\
                  <div class="mx-auto w-full max-w-md">\
                    <div class="flex items-center justify-between gap-4">\
                      <div>\
                        <p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Authentication</p>\
                        <h3 id="auth-title" class="mt-2 text-3xl font-black tracking-tight text-slate-900">Welcome back</h3>\
                        <p id="auth-subtitle" class="mt-2 text-sm text-slate-500">Use your account to continue shopping.</p>\
                      </div>\
                    </div>\
                    <div class="auth-tab-row mt-8 grid grid-cols-2 rounded-full bg-slate-100 p-1">\
                      <button type="button" id="show-login" class="auth-tab active rounded-full px-4 py-3 text-sm font-semibold">Sign in</button>\
                      <button type="button" id="show-register" class="auth-tab rounded-full px-4 py-3 text-sm font-semibold">Create account</button>\
                    </div>\
                    <div id="auth-forms" class="mt-8">\
                      <form id="login-form" class="space-y-4">\
                        <label class="block text-sm font-medium text-slate-700">Email\
                          <input id="login-email" placeholder="you@example.com" type="email" class="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900" />\
                        </label>\
                        <label class="block text-sm font-medium text-slate-700">Password\
                          <input id="login-password" placeholder="Enter your password" type="password" class="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900" />\
                        </label>\
                        <button type="submit" class="mt-2 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Sign in</button>\
                        <p class="text-center text-sm text-slate-500">New here? <button type="button" id="show-register-link" class="font-semibold text-slate-900 hover:text-slate-700">Create an account</button></p>\
                      </form>\
                      <form id="register-form" class="hidden space-y-4">\
                        <label class="block text-sm font-medium text-slate-700">Full name\
                          <input id="reg-name" placeholder="Your full name" type="text" class="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900" />\
                        </label>\
                        <label class="block text-sm font-medium text-slate-700">Email\
                          <input id="reg-email" placeholder="you@example.com" type="email" class="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900" />\
                        </label>\
                        <label class="block text-sm font-medium text-slate-700">Password\
                          <input id="reg-password" placeholder="Minimum 6 characters" type="password" class="auth-input mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900" />\
                        </label>\
                        <button type="submit" class="mt-2 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create account</button>\
                        <p class="text-center text-sm text-slate-500">Already have an account? <button type="button" id="show-login-link" class="font-semibold text-slate-900 hover:text-slate-700">Sign in</button></p>\
                      </form>\
                    </div>\
                    <div id="auth-msg" class="mt-5 min-h-[1.25rem] text-sm font-medium text-rose-600"></div>\
                  </div>\
                </div>\
              </div>\
            </div>\
          </div>\
        </div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    function setAuthMessage(message) {
        var node = qs('auth-msg');
        if (node) {
            node.textContent = message || '';
        }
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

    function openAuthModal() {
        createAuthModal();
        var modal = qs('auth-modal');
        if (!modal) {
            return;
        }
        modal.classList.remove('hidden');
        showLoginForm();
        setAuthMessage('');
    }

    function closeAuthModal() {
        var modal = qs('auth-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function updateAuthButton() {
        var button = qs('auth-btn');
        var user = getCurrentUser();
        if (!button) {
            return;
        }

        if (user) {
            button.textContent = user.name || user.email;
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
        if (!button) {
            return;
        }

        if (isLoggedIn()) {
            button.classList.remove('hidden');
        } else {
            button.classList.add('hidden');
        }
    }

    function bindAuthUI() {
        createAuthModal();

        var authButton = qs('auth-btn');
        if (authButton) {
            authButton.addEventListener('click', function () {
                Promise.resolve(restoreSession()).then(function () {
                    if (!isLoggedIn()) {
                        openAuthModal();
                    }
                });
            });
        }

        var logoutButton = qs('logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', function () {
                var user = getCurrentUser();
                if (!user) {
                    updateLogoutButton();
                    return;
                }

                if (confirm('Logout ' + (user.name || user.email) + '?')) {
                    logoutUser().then(function (result) {
                        if (result && result.ok === false) {
                            alert(result.message || 'Logout failed');
                            return;
                        }
                        updateAuthButton();
                        updateLogoutButton();
                        closeAuthModal();
                        document.dispatchEvent(new CustomEvent('auth:changed'));
                    });
                }
            });
        }

        document.addEventListener('click', function (event) {
            var closeButton = event.target.closest('#auth-close');
            if (closeButton) {
                closeAuthModal();
            }
        });

        var showRegisterButton = qs('show-register');
        if (showRegisterButton) {
            showRegisterButton.addEventListener('click', showRegisterForm);
        }
        var showRegisterLink = qs('show-register-link');
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', showRegisterForm);
        }

        var showLoginButton = qs('show-login');
        if (showLoginButton) {
            showLoginButton.addEventListener('click', showLoginForm);
        }
        var showLoginLink = qs('show-login-link');
        if (showLoginLink) {
            showLoginLink.addEventListener('click', showLoginForm);
        }

        var loginForm = qs('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var emailField = qs('login-email');
                var passwordField = qs('login-password');
                setAuthMessage('Signing in...');
                loginUser(emailField ? emailField.value : '', passwordField ? passwordField.value : '').then(function (result) {
                    if (!result.ok) {
                        setAuthMessage(result.message);
                        return;
                    }
                    setAuthMessage('');
                    updateAuthButton();
                    updateLogoutButton();
                    closeAuthModal();
                    document.dispatchEvent(new CustomEvent('auth:changed'));
                });
            });
        }

        var registerForm = qs('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var nameField = qs('reg-name');
                var emailField = qs('reg-email');
                var passwordField = qs('reg-password');
                setAuthMessage('Creating account...');
                registerUser({
                    name: nameField ? nameField.value : '',
                    email: emailField ? emailField.value : '',
                    password: passwordField ? passwordField.value : ''
                }).then(function (result) {
                    if (!result.ok) {
                        setAuthMessage(result.message);
                        return;
                    }
                    setAuthMessage('');
                    updateAuthButton();
                    updateLogoutButton();
                    closeAuthModal();
                    document.dispatchEvent(new CustomEvent('auth:changed'));
                });
            });
        }

        updateAuthButton();
        updateLogoutButton();

        if (window.supabaseAPI && typeof window.supabaseAPI.onAuthStateChange === 'function') {
            window.supabaseAPI.onAuthStateChange(function (_event, session) {
                setCachedUserFromSession(session);
                updateAuthButton();
                updateLogoutButton();
                if (!session) {
                    closeAuthModal();
                }
                document.dispatchEvent(new CustomEvent('auth:changed'));
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Restore session from Supabase, then bind UI
        restoreSession().then(function () {
            bindAuthUI();
            // Notify other modules (admin) that auth is ready
            document.dispatchEvent(new CustomEvent('auth:changed'));

            try {
                if (sessionStorage.getItem('openAuth')) {
                    sessionStorage.removeItem('openAuth');
                    openAuthModal();
                }
            } catch (e) {
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
        restoreSession: restoreSession
    };
})();

(function () {
    // Supabase Auth — no localStorage user management.
    // Session is managed entirely by the Supabase client.

    var cachedUser = null;

    function qs(id) {
        return document.getElementById(id);
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
        cachedUser = null;
        try {
            await window.supabaseAPI.signOut();
        } catch (e) {
            // ignore
        }
        try {
            sessionStorage.removeItem('pendingCart');
            sessionStorage.removeItem('checkoutData');
            sessionStorage.removeItem('checkoutShipping');
            sessionStorage.removeItem('openAuth');
        } catch (e) {
            // ignore
        }
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
            if (session && session.user) {
                var meta = session.user.user_metadata || {};
                cachedUser = { id: session.user.id, email: session.user.email, name: meta.name || session.user.email.split('@')[0] };
            }
        } catch (e) {
            cachedUser = null;
        }
    }

    function createAuthModal() {
        if (qs('auth-modal')) {
            return;
        }

        var html = '\
        <div id="auth-modal" class="fixed inset-0 z-80 flex items-center justify-center hidden">\
          <div class="absolute inset-0 bg-black opacity-50"></div>\
          <div class="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-90">\
            <div class="flex justify-between items-center mb-4">\
              <h3 id="auth-title" class="text-lg font-semibold">Login</h3>\
              <button id="auth-close" class="text-gray-500">\u2715</button>\
            </div>\
            <div id="auth-forms">\
              <form id="login-form" class="space-y-4">\
                <input id="login-email" placeholder="Email" type="email" class="w-full border px-3 py-2 rounded" />\
                <input id="login-password" placeholder="Password" type="password" class="w-full border px-3 py-2 rounded" />\
                <div class="flex items-center justify-between">\
                  <button type="submit" class="bg-black text-white px-4 py-2 rounded">Sign in</button>\
                  <button type="button" id="show-register" class="text-sm text-gray-600">Create account</button>\
                </div>\
              </form>\
              <form id="register-form" class="space-y-4 hidden">\
                <input id="reg-name" placeholder="Full name" type="text" class="w-full border px-3 py-2 rounded" />\
                <input id="reg-email" placeholder="Email" type="email" class="w-full border px-3 py-2 rounded" />\
                <input id="reg-password" placeholder="Password (min 6 chars)" type="password" class="w-full border px-3 py-2 rounded" />\
                <div class="flex items-center justify-between">\
                  <button type="submit" class="bg-black text-white px-4 py-2 rounded">Register</button>\
                  <button type="button" id="show-login" class="text-sm text-gray-600">Back to login</button>\
                </div>\
              </form>\
            </div>\
            <div id="auth-msg" class="text-sm mt-3 text-red-600"></div>\
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
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
        if (title) title.textContent = 'Login';
    }

    function showRegisterForm() {
        var loginForm = qs('login-form');
        var registerForm = qs('register-form');
        var title = qs('auth-title');
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
        if (title) title.textContent = 'Create account';
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

    function bindAuthUI() {
        createAuthModal();

        var authButton = qs('auth-btn');
        if (authButton) {
            authButton.addEventListener('click', function () {
                if (isLoggedIn()) {
                    var user = getCurrentUser();
                    if (confirm('Logout ' + (user.name || user.email) + '?')) {
                        logoutUser().then(function () {
                            updateAuthButton();
                            // Dispatch auth event so admin panel can react
                            document.dispatchEvent(new CustomEvent('auth:changed'));
                        });
                    }
                    return;
                }
                openAuthModal();
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

        var showLoginButton = qs('show-login');
        if (showLoginButton) {
            showLoginButton.addEventListener('click', showLoginForm);
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
                    closeAuthModal();
                    document.dispatchEvent(new CustomEvent('auth:changed'));
                });
            });
        }

        updateAuthButton();
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Restore session from Supabase, then bind UI
        restoreSession().then(function () {
            bindAuthUI();

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

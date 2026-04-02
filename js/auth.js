(function () {
    const USERS_KEY = 'voltx_users';
    const SESSION_KEY = 'voltx_session';

    function qs(id) {
        return document.getElementById(id);
    }

    function loadUsers() {
        try {
            const raw = localStorage.getItem(USERS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function hash(password) {
        try {
            return btoa(password);
        } catch (error) {
            return password;
        }
    }

    function registerUser(payload) {
        const users = loadUsers();
        const email = (payload.email || '').toLowerCase().trim();
        const password = payload.password || '';

        if (!email || !password) {
            return { ok: false, message: 'Email and password required' };
        }

        if (users.find(function (user) { return user.email === email; })) {
            return { ok: false, message: 'Email already registered' };
        }

        const user = {
            id: 'u-' + Date.now(),
            name: payload.name || email.split('@')[0],
            email: email,
            password: hash(password),
            created: new Date().toISOString(),
            role: 'user'
        };

        users.push(user);
        saveUsers(users);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, email: user.email, name: user.name }));
        return { ok: true, user: user };
    }

    function loginUser(email, password) {
        const users = loadUsers();
        const normalizedEmail = (email || '').toLowerCase().trim();
        const user = users.find(function (item) {
            return item.email === normalizedEmail;
        });

        if (!user) {
            return { ok: false, message: 'No user with that email' };
        }

        if (user.password !== hash(password)) {
            return { ok: false, message: 'Invalid password' };
        }

        localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, email: user.email, name: user.name }));
        return { ok: true, user: user };
    }

    function logoutUser() {
        localStorage.removeItem(SESSION_KEY);
        try {
            sessionStorage.removeItem('pendingCart');
            sessionStorage.removeItem('checkoutData');
            sessionStorage.removeItem('checkoutShipping');
            sessionStorage.removeItem('openAuth');
        } catch (error) {
            // ignore storage cleanup failures
        }
    }

    function getCurrentUser() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function isLoggedIn() {
        return !!getCurrentUser();
    }

    function seedAdminIfNeeded() {
        const users = loadUsers();
        const hasAdmin = users.some(function (user) {
            return user.role === 'admin';
        });

        if (hasAdmin) {
            return;
        }

        const admin = {
            id: 'admin-' + Date.now(),
            name: 'Admin',
            email: 'admin@voltx.local',
            password: hash('admin123'),
            created: new Date().toISOString(),
            role: 'admin'
        };

        users.push(admin);
        saveUsers(users);
        console.info('Default admin created:', admin.email, 'password:', 'admin123');
    }

    function createAuthModal() {
        if (qs('auth-modal')) {
            return;
        }

        const html = `
        <div id="auth-modal" class="fixed inset-0 z-80 flex items-center justify-center hidden">
          <div class="absolute inset-0 bg-black opacity-50"></div>
          <div class="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-90">
            <div class="flex justify-between items-center mb-4">
              <h3 id="auth-title" class="text-lg font-semibold">Login</h3>
              <button id="auth-close" class="text-gray-500">✕</button>
            </div>
            <div id="auth-forms">
              <form id="login-form" class="space-y-4">
                <input id="login-email" placeholder="Email" type="email" class="w-full border px-3 py-2 rounded" />
                <input id="login-password" placeholder="Password" type="password" class="w-full border px-3 py-2 rounded" />
                <div class="flex items-center justify-between">
                  <button type="submit" class="bg-black text-white px-4 py-2 rounded">Sign in</button>
                  <button type="button" id="show-register" class="text-sm text-gray-600">Create account</button>
                </div>
              </form>

              <form id="register-form" class="space-y-4 hidden">
                <input id="reg-name" placeholder="Full name" type="text" class="w-full border px-3 py-2 rounded" />
                <input id="reg-email" placeholder="Email" type="email" class="w-full border px-3 py-2 rounded" />
                <input id="reg-password" placeholder="Password" type="password" class="w-full border px-3 py-2 rounded" />
                <div class="flex items-center justify-between">
                  <button type="submit" class="bg-black text-white px-4 py-2 rounded">Register</button>
                  <button type="button" id="show-login" class="text-sm text-gray-600">Back to login</button>
                </div>
              </form>
            </div>
            <div id="auth-msg" class="text-sm mt-3 text-red-600"></div>
          </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    function setAuthMessage(message) {
        const node = qs('auth-msg');
        if (node) {
            node.textContent = message || '';
        }
    }

    function showLoginForm() {
        const loginForm = qs('login-form');
        const registerForm = qs('register-form');
        const title = qs('auth-title');
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
        if (title) title.textContent = 'Login';
    }

    function showRegisterForm() {
        const loginForm = qs('login-form');
        const registerForm = qs('register-form');
        const title = qs('auth-title');
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
        if (title) title.textContent = 'Create account';
    }

    function openAuthModal() {
        createAuthModal();
        const modal = qs('auth-modal');
        if (!modal) {
            return;
        }
        modal.classList.remove('hidden');
        showLoginForm();
        setAuthMessage('');
    }

    function closeAuthModal() {
        const modal = qs('auth-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function updateAuthButton() {
        const button = qs('auth-btn');
        const user = getCurrentUser();
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

        const authButton = qs('auth-btn');
        if (authButton) {
            authButton.addEventListener('click', function () {
                if (isLoggedIn()) {
                    const user = getCurrentUser();
                    if (confirm(`Logout ${user.name || user.email}?`)) {
                        logoutUser();
                        updateAuthButton();
                    }
                    return;
                }
                openAuthModal();
            });
        }

        document.addEventListener('click', function (event) {
            const closeButton = event.target.closest('#auth-close');
            if (closeButton) {
                closeAuthModal();
            }
        });

        const showRegisterButton = qs('show-register');
        if (showRegisterButton) {
            showRegisterButton.addEventListener('click', showRegisterForm);
        }

        const showLoginButton = qs('show-login');
        if (showLoginButton) {
            showLoginButton.addEventListener('click', showLoginForm);
        }

        const loginForm = qs('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function (event) {
                event.preventDefault();
                const emailField = qs('login-email');
                const passwordField = qs('login-password');
                const result = loginUser(emailField ? emailField.value : '', passwordField ? passwordField.value : '');
                if (!result.ok) {
                    setAuthMessage(result.message);
                    return;
                }
                updateAuthButton();
                closeAuthModal();
            });
        }

        const registerForm = qs('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', function (event) {
                event.preventDefault();
                const nameField = qs('reg-name');
                const emailField = qs('reg-email');
                const passwordField = qs('reg-password');
                const result = registerUser({
                    name: nameField ? nameField.value : '',
                    email: emailField ? emailField.value : '',
                    password: passwordField ? passwordField.value : ''
                });
                if (!result.ok) {
                    setAuthMessage(result.message);
                    return;
                }
                updateAuthButton();
                closeAuthModal();
            });
        }

        updateAuthButton();
    }

    document.addEventListener('DOMContentLoaded', function () {
        seedAdminIfNeeded();
        bindAuthUI();

        try {
            if (sessionStorage.getItem('openAuth')) {
                sessionStorage.removeItem('openAuth');
                openAuthModal();
            }
        } catch (error) {
            // ignore storage issues
        }
    });

    window.auth = {
        registerUser: registerUser,
        loginUser: loginUser,
        logoutUser: logoutUser,
        getCurrentUser: getCurrentUser,
        isLoggedIn: isLoggedIn,
        openAuthModal: openAuthModal
    };
})();

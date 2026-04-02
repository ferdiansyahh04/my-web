// Simple auth system using localStorage
const USERS_KEY = 'voltx_users';
const SESSION_KEY = 'voltx_session';

function loadUsers(){
    try{
        const raw = localStorage.getItem(USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch(e){
        return [];
    }
}

function saveUsers(users){
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hash(pwd){
    try{ return btoa(pwd); } catch(e){ return pwd; }
}

function registerUser({name, email, password}){
    const users = loadUsers();
    email = (email||'').toLowerCase().trim();
    if(!email || !password) return {ok:false, message:'Email and password required'};
    if(users.find(u=>u.email===email)) return {ok:false, message:'Email already registered'};
    const user = {id: 'u-'+Date.now(), name: name||email.split('@')[0], email, password: hash(password), created: new Date().toISOString(), role: 'user'};
    users.push(user);
    saveUsers(users);
    // create session
    localStorage.setItem(SESSION_KEY, JSON.stringify({id:user.id,email:user.email,name:user.name}));
    return {ok:true, user};
}

function loginUser(email, password){
    const users = loadUsers();
    email = (email||'').toLowerCase().trim();
    const u = users.find(x=>x.email===email);
    if(!u) return {ok:false, message:'No user with that email'};
    if(u.password !== hash(password)) return {ok:false, message:'Invalid password'};
    localStorage.setItem(SESSION_KEY, JSON.stringify({id:u.id,email:u.email,name:u.name}));
    return {ok:true, user:u};
}

function logoutUser(){
    localStorage.removeItem(SESSION_KEY);
    try{
        sessionStorage.removeItem('pendingCart');
        sessionStorage.removeItem('checkoutData');
        sessionStorage.removeItem('checkoutShipping');
        sessionStorage.removeItem('openAuth');
    }catch(e){
        // ignore storage cleanup failures
    }
}

function getCurrentUser(){
    try{
        const s = localStorage.getItem(SESSION_KEY);
        return s ? JSON.parse(s) : null;
    }catch(e){return null}
}

function isLoggedIn(){
    return !!getCurrentUser();
}

// ---------- Admin seeding ----------
function seedAdminIfNeeded(){
    const users = loadUsers();
    const hasAdmin = users.some(u => u.role === 'admin');
    if(hasAdmin) return;

    // default admin credentials (change after first login)
    const adminEmail = 'admin@voltx.local';
    const adminPassword = 'admin123';
    const adminName = 'Admin';

    const admin = { id: 'admin-'+Date.now(), name: adminName, email: adminEmail, password: hash(adminPassword), created: new Date().toISOString(), role: 'admin' };
    users.push(admin);
    saveUsers(users);
    console.info('Default admin created:', adminEmail, 'password:', adminPassword);
}

// UI bindings and modal
function createAuthModal(){
    if(document.getElementById('auth-modal')) return;
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

function openAuthModal(){
    createAuthModal();
    const modal = document.getElementById('auth-modal');
    if(!modal) return;
    modal.classList.remove('hidden');
    // show login by default
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('auth-msg').textContent='';
}

function closeAuthModal(){
    const modal = document.getElementById('auth-modal');
    if(modal) modal.classList.add('hidden');
}

function bindAuthUI(){
    createAuthModal();
    const authBtn = document.getElementById('auth-btn');
    if(authBtn) authBtn.addEventListener('click', () => {
        if(isLoggedIn()){
            // show simple menu: logout
            const u = getCurrentUser();
            if(confirm(`Logout ${u.name || u.email}?`)){
                logoutUser();
                updateAuthButton();
            }
            return;
        }
        openAuthModal();
    });

    document.addEventListener('click', (e)=>{
        const close = e.target.closest('#auth-close');
        if(close) closeAuthModal();
    });

    // switch forms
    document.getElementById('show-register')?.addEventListener('click', ()=>{
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('auth-title').textContent = 'Create account';
    });
    document.getElementById('show-login')?.addEventListener('click', ()=>{
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('auth-title').textContent = 'Login';
    });

    // login submit
    document.getElementById('login-form')?.addEventListener('submit', (e)=>{
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pwd = document.getElementById('login-password').value;
        const res = loginUser(email, pwd);
        if(!res.ok){
            document.getElementById('auth-msg').textContent = res.message;
            return;
        }
        updateAuthButton();
        closeAuthModal();
    });

    // register submit
    document.getElementById('register-form')?.addEventListener('submit', (e)=>{
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pwd = document.getElementById('reg-password').value;
        const res = registerUser({name,email,password:pwd});
        if(!res.ok){
            document.getElementById('auth-msg').textContent = res.message;
            return;
        }
        updateAuthButton();
        closeAuthModal();
    });

    updateAuthButton();
}

function updateAuthButton(){
    const btn = document.getElementById('auth-btn');
    const user = getCurrentUser();
    if(!btn) return;
    if(user){
        btn.textContent = user.name || user.email;
        btn.classList.remove('bg-white');
        btn.classList.add('bg-gray-100');
    } else {
        btn.textContent = 'Login';
        btn.classList.remove('bg-gray-100');
        btn.classList.add('bg-white');
    }
}

// initialize on DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
    // Seed an admin account if none exists
    seedAdminIfNeeded();
    bindAuthUI();
    // If another page requested the login modal (e.g., checkout redirect), open it
    try{
        if(sessionStorage.getItem('openAuth')){
            sessionStorage.removeItem('openAuth');
            openAuthModal();
        }
    }catch(e){/* ignore */}
});

// Expose functions for other modules
window.auth = {
    registerUser, loginUser, logoutUser, getCurrentUser, isLoggedIn, openAuthModal
};

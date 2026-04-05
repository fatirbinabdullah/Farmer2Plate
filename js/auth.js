// ===== AUTHENTICATION MODULE =====

const Auth = {
    login(token, userData) {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        this.updateUI(); 
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('cart'); 
        this.updateUI();
        window.location.href = 'index.html'; 
    },

    getToken() {
        return localStorage.getItem('access_token');
    },

    getUser() {
        const data = localStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    getUserRole() {
        const token = this.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch {
            return null;
        }
    },

    getUserId() {
        const token = this.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user_id;
        } catch {
            return null;
        }
    },

    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    },

    async authFetch(url, options = {}) {
        const token = this.getToken();
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            };
        }
        if (!options.headers) options.headers = {};
        if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
            options.headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            this.logout();
            throw new Error('সেশন শেষ হয়ে গেছে। আবার লগইন করুন।');
        }
        
        return response;
    },

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        const userInitial = document.getElementById('userInitial');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownRole = document.getElementById('dropdownRole');
        const dashboardLink = document.getElementById('dashboardLink');
        const profileLink = document.getElementById('profileLink');

        if (this.isLoggedIn() && !this.isTokenExpired()) {
            const user = this.getUser();
            const role = this.getUserRole();

            if (loginBtn) loginBtn.classList.add('hidden');
            if (registerBtn) registerBtn.classList.add('hidden');
            if (userMenu) userMenu.classList.remove('hidden');
            if (userInitial && user) userInitial.textContent = user.name ? user.name.charAt(0) : '?';
            if (dropdownName && user) dropdownName.textContent = user.name || 'User';
            if (dropdownRole) {
                const roleMap = { farmer: 'কৃষক', customer: 'ক্রেতা', admin: 'অ্যাডমিন' };
                dropdownRole.textContent = roleMap[role] || role;
            }
            if (dashboardLink) {
                const dashMap = { farmer: 'farmer-dashboard.html', customer: 'customer-dashboard.html', admin: 'admin-dashboard.html' };
                dashboardLink.href = dashMap[role] || '#';
            }
            if (profileLink) {
                const profileMap = { farmer: 'farmer-dashboard.html#profile', customer: 'customer-dashboard.html#profile', admin: '#' };
                profileLink.href = profileMap[role] || '#';
            }
            const userAvatarBtn = document.getElementById('userAvatar');
            if (userAvatarBtn && user && (role === 'farmer' || role === 'customer') && user.id) {
                const picUrl = role === 'farmer'
                    ? `${API_BASE_URL}/farmer/profile-picture/${user.id}`
                    : `${API_BASE_URL}/customer/profile-picture/${user.id}`;

                fetch(picUrl, { method: 'HEAD' }).then(res => {
                    if (res.ok) {
                        userAvatarBtn.innerHTML = `<img src="${picUrl}?t=${Date.now()}" alt="${user.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                    }
                }).catch(() => {}); 
            }
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (registerBtn) registerBtn.classList.remove('hidden');
            if (userMenu) userMenu.classList.add('hidden');
        }
    },
    requireAuth(allowedRoles = []) {
        if (!this.isLoggedIn() || this.isTokenExpired()) {
            window.location.href = 'login.html';
            return false;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(this.getUserRole())) {
            window.location.href = 'index.html'; 
            return false;
        }
        return true;
    }
};

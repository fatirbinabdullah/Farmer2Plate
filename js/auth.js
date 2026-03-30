// ===== AUTHENTICATION MODULE (লগইন ও সেশন কন্ট্রোল) =====

const Auth = {
    // লগইন সফল হওয়ার পর টোকেন এবং ইউজারের ডাটা লোকাল স্টোরেজে সেভ করা
    login(token, userData) {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        this.updateUI(); // UI আপডেট করা
    },

    // লগআউট করার সময় ডাটা মুছে ফেলা
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('cart'); // কার্টের আইটেমও মুছে ফেলা হবে
        this.updateUI();
        window.location.href = 'index.html'; // হোম পেজে ফেরত পাঠানো
    },

    // সংরক্ষিত টোকেন পাওয়া
    getToken() {
        return localStorage.getItem('access_token');
    },

    // সংরক্ষিত ইউজারের ডাটা পাওয়া
    getUser() {
        const data = localStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    },

    // ইউজার কি লগড-ইন অবস্থায় আছে?
    isLoggedIn() {
        return !!this.getToken();
    },

    // JWT টোকেনের ভেতর থেকে ইউজারের রোল (farmer/customer/admin) বের করা
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

    // JWT টোকেনের ভেতর থেকে ইউজারের আইডি বের করা
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

    // টোকেনের মেয়াদ পার হয়ে গেছে কিনা তা চেক করা
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

    // API রিকোয়েস্ট করার সময় হেডারে অটোমেটিক টোকেন যুক্ত করে দেওয়া
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
        
        // টোকেন ভুল বা মেয়াদউত্তীর্ণ হলে অটো-লগআউট করে দেওয়া
        if (response.status === 401) {
            this.logout();
            throw new Error('সেশন শেষ হয়ে গেছে। আবার লগইন করুন।');
        }
        
        return response;
    },

    // লগইন স্ট্যাটাসের উপরে ভিত্তি করে মেনু ও বাটন হাইড/শো করা
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

            // নামের প্রথম অক্ষর দেখানো
            if (userInitial && user) userInitial.textContent = user.name ? user.name.charAt(0) : '?';
            if (dropdownName && user) dropdownName.textContent = user.name || 'User';
            if (dropdownRole) {
                const roleMap = { farmer: 'কৃষক', customer: 'ক্রেতা', admin: 'অ্যাডমিন' };
                dropdownRole.textContent = roleMap[role] || role;
            }

            // ইউজারের ধরন অনুযায়ী ড্যাশবোর্ডের লিংক সেট করা
            if (dashboardLink) {
                const dashMap = { farmer: 'farmer-dashboard.html', customer: 'customer-dashboard.html', admin: 'admin-dashboard.html' };
                dashboardLink.href = dashMap[role] || '#';
            }

            if (profileLink) {
                const profileMap = { farmer: 'farmer-dashboard.html#profile', customer: 'customer-dashboard.html#profile', admin: '#' };
                profileLink.href = profileMap[role] || '#';
            }
        } else {
            // লগইন করা না থাকলে মেনু লুকিয়ে রাখা এবং লগইন বাটন দেখানো
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (registerBtn) registerBtn.classList.remove('hidden');
            if (userMenu) userMenu.classList.add('hidden');
        }
    },

    // রাউট প্রটেক্ট করা - লগইন করা না থাকলে লগইন পেজে পাঠিয়ে দেওয়া
    requireAuth(allowedRoles = []) {
        if (!this.isLoggedIn() || this.isTokenExpired()) {
            window.location.href = 'login.html';
            return false;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(this.getUserRole())) {
            window.location.href = 'index.html'; // ভুল রোলে থাকলে হোম পেজে পাঠানো
            return false;
        }
        return true;
    }
};

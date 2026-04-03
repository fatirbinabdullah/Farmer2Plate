// ===== CORE APP FUNCTIONALITY (কোর অ্যাপ লজিক) =====

// টোস্ট নোটিফিকেশন সিস্টেম (ছোট পপ-আপ মেসেজ দেখানোর জন্য)
const Toast = {
    container: null,

    // টোস্ট কন্টেইনার তৈরি করা (যদি আগে থেকে না থাকে)
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    // স্ক্রিনে মেসেজ দেখানোর ফাংশন (success, error, warning, info)
    show(message, type = 'info', duration = 4000) {
        this.init();

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(()=>this.parentElement.remove(), 300);">✕</button>
        `;

        this.container.appendChild(toast);

        // নির্দিষ্ট সময় পর টোস্ট গায়েব করে দেওয়া
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // সহজে কল করার জন্য ছোট ফাংশনগুলো
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
};

// কাস্টম মডাল বা বড় পপ-আপ সিস্টেম (ইউজারের কনফার্মেশন নেওয়ার জন্য)
const Modal = {
    // যেকোনো কাজের আগে "হ্যাঁ/না" কনফার্মেশন নেওয়ার মডাল
    async confirm(message, title = 'নিশ্চিত করুন', type = 'confirm') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${type === 'danger' ? '⚠️' : '❓'} ${title}</h3>
                        <p class="modal-message">${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-cancel" id="modalCancel">বাতিল</button>
                        <button class="modal-btn ${type === 'danger' ? 'modal-btn-danger' : 'modal-btn-confirm'}" id="modalConfirm">নিশ্চিত</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('active'), 10);

            const close = (result) => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 200);
                resolve(result);
            };

            overlay.querySelector('#modalCancel').onclick = () => close(false);
            overlay.querySelector('#modalConfirm').onclick = () => close(true);
            overlay.onclick = (e) => { if(e.target === overlay) close(false); }; // বাইরে ক্লিক করলে বন্ধ হবে
        });
    },

    // কোনো কাজের জন্য ইউজারের কাছ থেকে সিক্রেট টেক্সট বা ইনপুট নেওয়ার জন্য মডাল
    async prompt(message, requiredText = '', title = 'ভেরিফিকেশন') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">🔐 ${title + " "}</h3>
                        <p class="modal-message">${message}</p>
                        <input type="text" class="modal-input" id="modalInput" placeholder="এখানে টাইপ করুন..." autocomplete="off">
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-cancel" id="modalCancel">বাতিল</button>
                        <button class="modal-btn modal-btn-confirm" id="modalConfirm">সাবমিট</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            setTimeout(() => {
                overlay.classList.add('active');
                overlay.querySelector('#modalInput').focus();
            }, 10);

            const close = (result) => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 200);
                resolve(result);
            };

            const handleConfirm = () => {
                const val = overlay.querySelector('#modalInput').value;
                // যদি ইনপুটকৃত টেক্সট কাঙ্খিত টেক্সটের সাথে না মেলে
                if (requiredText && val !== requiredText) {
                    overlay.querySelector('#modalInput').style.borderColor = '#ef4444';
                    Toast.error('ভুল কোড টাইপ করেছেন!');
                    return;
                }
                close(val || true);
            };

            overlay.querySelector('#modalCancel').onclick = () => close(null);
            overlay.querySelector('#modalConfirm').onclick = handleConfirm;
            overlay.querySelector('#modalInput').onkeyup = (e) => { if(e.key === 'Enter') handleConfirm(); };
            overlay.onclick = (e) => { if(e.target === overlay) close(null); }; // বাইরে ক্লিক করলে বাতিল
        });
    }
};

// শপিং কার্ট ম্যানেজার (কার্টে পণ্য যোগ এবং হিসাব রাখার জন্য)
const Cart = {
    // কার্টে থাকা সব আইটেম লোকাল স্টোরেজ থেকে আনা
    getItems() {
        const items = localStorage.getItem('cart');
        return items ? JSON.parse(items) : [];
    },

    // কার্টে নতুন প্রোডাক্ট যোগ করা
    addItem(product) {
        const items = this.getItems();
        const existing = items.find(item => item.product_id === product.id);
        
        // আগে থেকেই কার্টে থাকলে পরিমাণ ১ বাড়ানো হয়
        if (existing) {
            if (existing.quantity >= product.stock) {
                Toast.warning('স্টকে যথেষ্ট পণ্য নেই!');
                return;
            }
            existing.quantity++;
        } else {
            // নতুন প্রোডাক্ট হলে লিস্টের শেষে যোগ করা হয়
            items.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                stock: product.stock,
            });
        }

        localStorage.setItem('cart', JSON.stringify(items));
        this.updateBadge(); // কার্টের ব্যাজ আপডেট করা
        Toast.success(`"${product.name}" কার্টে যোগ হয়েছে!`);
    },

    // কার্ট থেকে নির্দিষ্ট পণ্য বাদ দেওয়া
    removeItem(productId) {
        let items = this.getItems();
        items = items.filter(item => item.product_id !== productId);
        localStorage.setItem('cart', JSON.stringify(items));
        this.updateBadge();
    },

    // কার্টে থাকা আইটেমের পরিমাণ কমানো বা বাড়ানো
    updateQuantity(productId, delta) {
        const items = this.getItems();
        const item = items.find(i => i.product_id === productId);
        if (!item) return;

        item.quantity += delta;
        // আইটেম ০ বা তার কম হয়ে গেলে কার্ট থেকে মুছে যায়
        if (item.quantity <= 0) {
            this.removeItem(productId);
            return;
        }
        // অতিরিক্ত পরিমাণ দিলে ওয়ার্নিং দেওয়া হয়
        if (item.quantity > item.stock) {
            Toast.warning('স্টকে যথেষ্ট পণ্য নেই!');
            item.quantity = item.stock;
        }

        localStorage.setItem('cart', JSON.stringify(items));
        this.updateBadge();
    },

    // কার্টে থাকা পণ্যের মোট মূল্য হিসাব করা
    getTotal() {
        return this.getItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    // কার্টে মোট কয়টি পণ্য আছে তা গোণা
    getCount() {
        return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
    },

    // অর্ডার কমপ্লিট করার পর কার্ট ক্লিয়ার করা
    clear() {
        localStorage.removeItem('cart');
        this.updateBadge();
    },

    // নেভিগেশন বারে কার্টের আইকনের উপরে নাম্বার আপডেট করা
    updateBadge() {
        const badges = document.querySelectorAll('.cart-count');
        const count = this.getCount();
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }
};

// ===== GLOBAL INITIALIZATION (পুরো ওয়েবসাইট লোড হওয়ার পর লজিক) =====
document.addEventListener('DOMContentLoaded', () => {
    // ইউজারের লগইন স্ট্যাটাস অনুযায়ী ফ্রন্টএন্ড আপডেট
    Auth.updateUI();

    // নিচে স্ক্রোল করলে নেভবারে হালকা ছায়া বা ডিজাইন ইফেক্ট যুক্ত করা
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        });
    }

    // মোবাইলের জন্য হ্যামবার্গার মেনু টগল (দেখানো ও লোকানো)
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        const navActions = document.querySelector('.nav-actions');
        if (window.matchMedia('(max-width: 768px)').matches && navActions) {
            const divider = document.createElement('div');
            divider.className = 'mobile-actions-divider';
            navLinks.appendChild(divider);
            
            while (navActions.firstChild) {
                const child = navActions.firstChild;
                if (child.classList) child.classList.add('mobile-action-item');
                navLinks.appendChild(child);
            }
        }

        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            navToggle.classList.toggle('active');
        });

        navLinks.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                navLinks.classList.remove('open');
                navToggle.classList.remove('active');
            }
        });
    }

    // ড্যাশবোর্ড সাইডবার টগল করার ফাংশন (ওভারলে সহ)
    window.toggleDashSidebar = function() {
        const sidebar = document.getElementById('dashSidebar');
        if (!sidebar) return;
        
        // ডায়নামিক ওভারলে তৈরি করা
        let overlay = document.getElementById('dashSidebarOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'dashSidebarOverlay';
            overlay.className = 'dash-sidebar-overlay';
            overlay.onclick = toggleDashSidebar;
            document.body.appendChild(overlay);
        }
        
        const isOpen = sidebar.classList.toggle('open');
        if (isOpen) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    };

    // সাইডবার জোর করে বন্ধ করার ফাংশন (লিংকে ক্লিক করার পর) 
    window.closeDashSidebar = function() {
        const sidebar = document.getElementById('dashSidebar');
        const overlay = document.getElementById('dashSidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    };

    // ড্যাশবোর্ডের লিংকে ক্লিক করলে সাইডবার বন্ধ করা
    document.addEventListener('click', (e) => {
        if (e.target.closest('.sidebar-link')) {
            window.closeDashSidebar();
        }
    });

    // ইউজারের মেনু বা ড্রপডাউন টগল (অ্যাভাটারের উপরে ক্লিক করলে দেখাবে)
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    if (userAvatar && userDropdown) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
    }

    // লগআউট বাটনে ক্লিক করলে
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (await Modal.confirm('আপনি কি লগআউট করতে চান?', 'লগআউট')) {
                Auth.logout();
            }
        });
    }

    // কার্ট ব্যাজ ইনিশিয়ালাইজ করা
    Cart.updateBadge();
});

// ===== UTILITY FUNCTIONS (অন্যান্য সহযোগী ফাংশন) =====

// টাকার অংক ফরম্যাট করা (যেমন, 100 কে ৳100.00 করে দেখানো)
function formatPrice(price) {
    return `৳${parseFloat(price).toFixed(2)}`;
}

// তারিখ সুন্দর করে বাংলায় দেখানো
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// স্পেসিফিক স্ট্যাটাসগুলোর বাংলা ভার্সন রিটার্ন করা
function getStatusBangla(status) {
    const map = {
        pending: 'অপেক্ষমান',
        accepted: 'গৃহীত',
        shipped: 'প্রেরিত',
        delivered: 'ডেলিভারি সম্পন্ন',
        cancelled: 'বাতিল',
        available: 'পাওয়া যাচ্ছে',
        out_of_stock: 'স্টকে নেই',
    };
    return map[status] || status;
}

// বাটনে লোডিং ইফেক্ট (স্পিনার) দেখানো এবং কাজ শেষ হলে আগের টেক্সট ফেরত আনা
function setLoading(button, isLoading, originalText = '') {
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div>';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || originalText;
        button.disabled = false;
    }
}

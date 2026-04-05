// ===== CORE APP FUNCTIONALITY =====

const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

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

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
};

const Modal = {
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
            overlay.onclick = (e) => { if(e.target === overlay) close(false); }; 
        });
    },

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
            overlay.onclick = (e) => { if(e.target === overlay) close(null); };
        });
    }
};

const Cart = {
    getItems() {
        const items = localStorage.getItem('cart');
        return items ? JSON.parse(items) : [];
    },

    addItem(product) {
        const items = this.getItems();
        const existing = items.find(item => item.product_id === product.id);
        
        if (existing) {
            if (existing.quantity >= product.stock) {
                Toast.warning('স্টকে যথেষ্ট পণ্য নেই!');
                return;
            }
            existing.quantity++;
        } else {
            items.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                stock: product.stock,
            });
        }

        localStorage.setItem('cart', JSON.stringify(items));
        this.updateBadge(); 
        Toast.success(`"${product.name}" কার্টে যোগ হয়েছে!`);
    },

    removeItem(productId) {
        let items = this.getItems();
        items = items.filter(item => item.product_id !== productId);
        localStorage.setItem('cart', JSON.stringify(items));
        this.updateBadge();
    },

    updateQuantity(productId, delta) {
        const items = this.getItems();
        const item = items.find(i => i.product_id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            this.removeItem(productId);
            return;
        }
        if (item.quantity > item.stock) {
            Toast.warning('স্টকে যথেষ্ট পণ্য নেই!');
            item.quantity = item.stock;
        }

        localStorage.setItem('cart', JSON.stringify(items));
        this.updateBadge();
    },

    getTotal() {
        return this.getItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    getCount() {
        return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
    },

    clear() {
        localStorage.removeItem('cart');
        this.updateBadge();
    },

    updateBadge() {
        const badges = document.querySelectorAll('.cart-count');
        const count = this.getCount();
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.updateUI();

    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        });
    }

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

    window.toggleDashSidebar = function() {
        const sidebar = document.getElementById('dashSidebar');
        if (!sidebar) return;
        
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

    window.closeDashSidebar = function() {
        const sidebar = document.getElementById('dashSidebar');
        const overlay = document.getElementById('dashSidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    };

    document.addEventListener('click', (e) => {
        if (e.target.closest('.sidebar-link')) {
            window.closeDashSidebar();
        }
    });

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

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (await Modal.confirm('আপনি কি লগআউট করতে চান?', 'লগআউট')) {
                Auth.logout();
            }
        });
    }

    Cart.updateBadge();
});

function formatPrice(price) {
    return `৳${parseFloat(price).toFixed(2)}`;
}


function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

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

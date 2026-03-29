// ===== API CONFIGURATION (এপিআই লিংক সেটিং) =====
// const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = 'http://192.168.1.4:8000'; // ব্যাকএন্ডের ঠিকানা

// All type of API List for easy to use not to type again and again
const API = {
    // Farmer API 
    FARMER_REGISTER: `${API_BASE_URL}/farmer/register`,
    FARMER_LOGIN: `${API_BASE_URL}/farmer/login`,
    FARMER_PROFILE: (id) => `${API_BASE_URL}/farmer/profile/${id}`,
    FARMER_UPDATE: (id) => `${API_BASE_URL}/farmer/update/${id}`,
    FARMER_DELETE: (id) => `${API_BASE_URL}/farmer/delete/${id}`,

    // Customer API
    CUSTOMER_REGISTER: `${API_BASE_URL}/customer/register`,
    CUSTOMER_LOGIN: `${API_BASE_URL}/customer/login`,
    CUSTOMER_PROFILE: (id) => `${API_BASE_URL}/customer/profile/${id}`,
    CUSTOMER_UPDATE: (id) => `${API_BASE_URL}/customer/update/${id}`,
    CUSTOMER_DELETE: (id) => `${API_BASE_URL}/customer/delete/${id}`,

    // Admin API
    ADMIN_LOGIN: `${API_BASE_URL}/admin/login`,
    ADMIN_USERS: `${API_BASE_URL}/admin/users`,
    ADMIN_DELETE_USER: (id) => `${API_BASE_URL}/admin/user/${id}`,
    ADMIN_TOGGLE_USER_STATUS: (id) => `${API_BASE_URL}/admin/user/${id}/toggle-status`,
    ADMIN_PRODUCTS: `${API_BASE_URL}/admin/products`,
    ADMIN_DELETE_PRODUCT: (id) => `${API_BASE_URL}/admin/product/${id}`,
    ADMIN_ORDERS: `${API_BASE_URL}/admin/orders`,

    // প্রোডাক্টের জন্য API
    PRODUCT_ADD: `${API_BASE_URL}/product/add`,
    PRODUCT_UPDATE: (id) => `${API_BASE_URL}/product/update/${id}`,
    PRODUCT_DELETE: (id) => `${API_BASE_URL}/product/delete/${id}`,
    PRODUCT_LIST: `${API_BASE_URL}/product/list`,
    PRODUCT_UPLOAD_IMAGES: (id) => `${API_BASE_URL}/product/${id}/images`,
    PRODUCT_IMAGE: (imageId) => `${API_BASE_URL}/product/image/${imageId}`,
    PRODUCT_DELETE_IMAGE: (imageId) => `${API_BASE_URL}/product/image/${imageId}`,

    // অর্ডারের জন্য API
    ORDER_PLACE: `${API_BASE_URL}/order/place`,
    ORDER_MY_ORDERS: `${API_BASE_URL}/order/my-orders`,
};

// প্রোডাক্টের ছবি না থাকলে সাময়িকভাবে আইকন দেখানোর জন্য ইমোজি লিস্ট
const PRODUCT_EMOJIS = ['🥬', '🍅', '🥕', '🌽', '🍆', '🥒', '🫑', '🥦', '🧅', '🧄', '🥔', '🍠', '🥭', '🍌', '🍊', '🍋', '🍎', '🍇', '🍉', '🍓', '🫐', '🥥', '🌾', '🌿', '🍂', '🍃'];

// প্রোডাক্টের নামের উপর ভিত্তি করে অটোমেটিক একটা ইমোজি সিলেক্ট করার ফাংশন
function getProductEmoji(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PRODUCT_EMOJIS[Math.abs(hash) % PRODUCT_EMOJIS.length];
}

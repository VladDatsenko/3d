// js/dom-elements.js
console.log('dom-elements.js завантажено');

// Безпечна функція для отримання DOM елементів
const getElement = (selector, isAll = false) => {
    try {
        if (isAll) {
            const elements = document.querySelectorAll(selector);
            return elements.length > 0 ? elements : [];
        }
        return document.querySelector(selector);
    } catch (e) {
        console.warn(`Помилка отримання елемента: ${selector}`, e);
        return isAll ? [] : null;
    }
};

// Збірка DOM елементів
const DomElements = {
    // Основні контейнери
    modelsContainer: getElement('#models-container'),
    favoritesContainer: getElement('#favorites-container'),
    cartContainer: getElement('#cart-container'),        // новий
    favoritesEmpty: getElement('#favorites-empty'),
    cartEmpty: getElement('#cart-empty'),                // новий
    categoriesScrollbar: getElement('#categories-scrollbar'),
    categoriesListContainer: getElement('#categories-list-container'),
    
    // Пошук та фільтри
    searchInput: getElement('#search-input'),
    filterButtons: getElement('.filter-btn', true),
    loadMoreBtn: getElement('#load-more-btn'),
    
    // Навігація
    mainLink: getElement('.nav-link[data-section="main"]'),
    modelsLink: getElement('.nav-link[data-section="models"]'),
    favoritesLink: getElement('.favorites-link'),
    cartLink: getElement('.cart-link'),                  // новий
    navLinks: getElement('.nav-link', true),
    
    // Управління категоріями
    adminCategoriesBtn: getElement('.admin-categories-btn'),
    addCategoryBtn: getElement('#add-category-btn'),
    saveCategoriesBtn: getElement('#save-categories-btn'),
    restoreDefaultCategoriesBtn: getElement('#restore-default-categories'),
    
    // Модальні вікна
    modelModal: getElement('#model-modal'),
    modalBody: getElement('#modal-body'),
    categoriesModal: getElement('#categories-modal'),
    orderFormModal: getElement('#order-form-modal'),     // нове модальне вікно для форми замовлення
    ordersModal: getElement('#orders-modal'),            // нове модальне вікно для перегляду замовлень (адмін)
    
    // Кнопки
    scrollLeftBtn: getElement('.scroll-left'),
    scrollRightBtn: getElement('.scroll-right'),
    clearFavoritesBtn: getElement('#clear-favorites'),
    clearCartBtn: getElement('#clear-cart'),             // новий
    checkoutBtn: getElement('#checkout-btn'),            // новий (оформити замовлення)
    
    // Інші
    favCount: getElement('.fav-count'),
    cartCount: getElement('.cart-count'),                // новий
    modelsSection: getElement('.models-section'),
    favoritesSection: getElement('.favorites-section'),
    cartSection: getElement('.cart-section'),            // новий
    adminSection: getElement('#admin-section'),
    
    // ===== ЕЛЕМЕНТИ ДЛЯ АВТЕНТИФІКАЦІЇ =====
    
    adminPanelBtn: getElement('.admin-panel-btn'),
    authModal: getElement('#auth-modal'),
    authModalBody: getElement('#auth-modal-body'),
    authModalClose: getElement('#auth-modal-close'),
    
    loginForm: getElement('#login-form'),
    loginPasswordInput: getElement('#login-password'),
    loginSubmitBtn: getElement('#login-submit-btn'),
    loginError: getElement('#login-error'),
    
    resetPasswordForm: getElement('#reset-password-form'),
    resetSecurityAnswer: getElement('#reset-security-answer'),
    resetNewPassword: getElement('#reset-new-password'),
    resetConfirmPassword: getElement('#reset-confirm-password'),
    resetSubmitBtn: getElement('#reset-submit-btn'),
    resetError: getElement('#reset-error'),
    showResetFormBtn: getElement('#show-reset-form-btn'),
    backToLoginBtn: getElement('#back-to-login-btn'),
    
    loginAttemptsInfo: getElement('#login-attempts-info'),
    
    adminWelcome: getElement('#admin-welcome'),
    
    // Метод для перевірки завантаження критичних елементів
    checkCriticalElements() {
        const critical = ['modelsContainer', 'favoritesContainer', 'categoriesScrollbar'];
        const missing = critical.filter(el => !this[el]);
        
        if (missing.length > 0) {
            console.warn('Відсутні критичні DOM елементи:', missing);
            return false;
        }
        return true;
    }
};

export { DomElements };
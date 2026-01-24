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
    favoritesEmpty: getElement('#favorites-empty'),
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
    
    // Кнопки
    scrollLeftBtn: getElement('.scroll-left'),
    scrollRightBtn: getElement('.scroll-right'),
    clearFavoritesBtn: getElement('#clear-favorites'),
    
    // Інші
    favCount: getElement('.fav-count'),
    modelsSection: getElement('.models-section'),
    favoritesSection: getElement('.favorites-section'),
    
    // ===== НОВІ ЕЛЕМЕНТИ ДЛЯ АВТЕНТИФІКАЦІЇ =====
    
    // Кнопка адміна в навбарі
    adminPanelBtn: getElement('.admin-panel-btn'),
    
    // Модальне вікно авторизації
    authModal: getElement('#auth-modal'),
    authModalBody: getElement('#auth-modal-body'),
    authModalClose: getElement('#auth-modal-close'),
    
    // Форма входу
    loginForm: getElement('#login-form'),
    loginPasswordInput: getElement('#login-password'),
    loginSubmitBtn: getElement('#login-submit-btn'),
    loginError: getElement('#login-error'),
    
    // Форма скидання пароля
    resetPasswordForm: getElement('#reset-password-form'),
    resetSecurityAnswer: getElement('#reset-security-answer'),
    resetNewPassword: getElement('#reset-new-password'),
    resetConfirmPassword: getElement('#reset-confirm-password'),
    resetSubmitBtn: getElement('#reset-submit-btn'),
    resetError: getElement('#reset-error'),
    showResetFormBtn: getElement('#show-reset-form-btn'),
    backToLoginBtn: getElement('#back-to-login-btn'),
    
    // Інформація про спроби входу
    loginAttemptsInfo: getElement('#login-attempts-info'),
    
    // Секція адмін-панелі (буде додана в HTML)
    adminSection: getElement('#admin-section'),
    adminLogoutBtn: getElement('#admin-logout-btn'),
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
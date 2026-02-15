// js/cart.js
import { StateManager } from './state.js';
import { Utils } from './utils.js';

// Менеджер кошика
const CartManager = {
    // Додати модель до кошика
    addToCart(modelId) {
        const state = StateManager.getState();
        if (!state.cart.includes(modelId)) {
            state.cart.push(modelId);
            this.saveCartToStorage();
            Utils.showNotification('Модель додана до кошика');
            return true;
        }
        Utils.showNotification('Модель вже в кошику', 'warning');
        return false;
    },

    // Видалити модель з кошика
    removeFromCart(modelId) {
        const state = StateManager.getState();
        const index = state.cart.indexOf(modelId);
        if (index !== -1) {
            state.cart.splice(index, 1);
            this.saveCartToStorage();
            Utils.showNotification('Модель видалена з кошика');
            return true;
        }
        return false;
    },

    // Очистити кошик
    clearCart() {
        const state = StateManager.getState();
        state.cart = [];
        this.saveCartToStorage();
        Utils.showNotification('Кошик очищено');
    },

    // Отримати моделі в кошику
    getCartModels() {
        const state = StateManager.getState();
        return state.models.filter(model => state.cart.includes(model.id));
    },

    // Зберегти кошик в localStorage
    saveCartToStorage() {
        const state = StateManager.getState();
        try {
            localStorage.setItem('cart', JSON.stringify(state.cart));
        } catch (e) {
            console.error('Помилка збереження кошика:', e);
        }
    },

    // Завантажити кошик з localStorage
    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                return JSON.parse(savedCart);
            }
        } catch (e) {
            console.error('Помилка завантаження кошика:', e);
        }
        return [];
    },

    // Отримати кількість товарів у кошику
    getCartCount() {
        const state = StateManager.getState();
        return state.cart.length;
    }
};

export { CartManager };
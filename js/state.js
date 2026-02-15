import { CONFIG } from './config.js';
import { CartManager } from './cart.js';

// Безпечне отримання з localStorage
const getStoredFavorites = () => {
    try {
        const favorites = localStorage.getItem('favorites');
        if (favorites) {
            return JSON.parse(favorites);
        }
    } catch (e) {
        console.warn('Помилка читання з localStorage:', e);
    }
    return [];
};

// Початковий стан додатку
const state = {
    models: [],
    filteredModels: [],
    favorites: getStoredFavorites(),
    cart: CartManager.loadCartFromStorage(), // завантажуємо кошик
    currentFilter: 'all',
    displayedCount: CONFIG.initialLoad,
    currentCategory: 'all',
    currentSection: 'main',
    categories: []
};

// Функції для роботи зі станом
const StateManager = {
    getState() {
        return state;
    },
    
    setModels(models) {
        if (Array.isArray(models)) {
            state.models = models;
            state.filteredModels = [...models];
        }
    },
    
    addToFavorites(modelId) {
        if (!state.favorites.includes(modelId)) {
            state.favorites.push(modelId);
            try {
                localStorage.setItem('favorites', JSON.stringify(state.favorites));
            } catch (e) {
                console.warn('Не вдалося зберегти улюблені:', e);
            }
            return true;
        }
        return false;
    },
    
    removeFromFavorites(modelId) {
        const index = state.favorites.indexOf(modelId);
        if (index !== -1) {
            state.favorites.splice(index, 1);
            try {
                localStorage.setItem('favorites', JSON.stringify(state.favorites));
            } catch (e) {
                console.warn('Не вдалося зберегти улюблені:', e);
            }
            return true;
        }
        return false;
    },
    
    clearFavorites() {
        state.favorites = [];
        try {
            localStorage.setItem('favorites', JSON.stringify(state.favorites));
        } catch (e) {
            console.warn('Не вдалося очистити улюблені:', e);
        }
    },
    
    setCurrentFilter(filter) {
        state.currentFilter = filter;
    },
    
    setCurrentCategory(category) {
        state.currentCategory = category;
    },
    
    setCurrentSection(section) {
        state.currentSection = section;
    },
    
    incrementDisplayedCount() {
        state.displayedCount += CONFIG.modelsPerLoad;
    },
    
    resetDisplayedCount() {
        state.displayedCount = CONFIG.initialLoad;
    },
    
    setCategories(categories) {
        if (Array.isArray(categories)) {
            state.categories = categories;
        }
    },
    
    addCategory(category) {
        if (category && category.id) {
            state.categories.push(category);
        }
    },
    
    removeCategory(categoryId) {
        const index = state.categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            return state.categories.splice(index, 1)[0];
        }
        return null;
    },
    
    updateCategory(categoryId, updates) {
        const category = state.categories.find(c => c.id === categoryId);
        if (category) {
            Object.assign(category, updates);
            return true;
        }
        return false;
    },
    
    findCategory(categoryId) {
        return state.categories.find(c => c.id === categoryId);
    },
    
    findModel(modelId) {
        return state.models.find(m => m.id === modelId);
    },
    
    getFavoriteModels() {
        return state.models.filter(model => state.favorites.includes(model.id));
    },
    
    getDisplayedModels() {
        return state.filteredModels.slice(0, state.displayedCount);
    },
    
    hasMoreModels() {
        return state.displayedCount < state.filteredModels.length;
    },
    
    resetFilters() {
        state.currentCategory = 'all';
        state.currentFilter = 'all';
        state.displayedCount = CONFIG.initialLoad;
        state.filteredModels = [...state.models];
    }
};

export { StateManager };
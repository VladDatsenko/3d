// js/utils.js
import { CONFIG } from './config.js';

// Утиліти
const Utils = {
    // Debounce функція
    debounce(func, wait = CONFIG.debounceDelay) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Показати сповіщення
    showNotification(message, type = 'success') {
        // Перевірити, чи є вже сповіщення
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        if (type === 'error') {
            notification.style.background = '#ff2a6d';
        } else if (type === 'warning') {
            notification.style.background = '#ffc107';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, CONFIG.notificationDuration);
    },

    // Завантажити дані
    async loadData() {
        try {
            // Спочатку спробувати завантажити з localStorage
            const savedModels = localStorage.getItem('models_data');
            if (savedModels) {
                const parsedModels = JSON.parse(savedModels);
                if (Array.isArray(parsedModels) && parsedModels.length > 0) {
                    console.log('Завантажено моделі з localStorage:', parsedModels.length);
                    return parsedModels;
                }
            }
            
            // Якщо немає в localStorage, завантажити з data.json
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            const models = data.models || [];
            
            // Зберегти в localStorage для майбутнього використання
            if (models.length > 0) {
                localStorage.setItem('models_data', JSON.stringify(models));
            }
            
            return models;
        } catch (error) {
            console.error('Error loading data:', error);
            return this.getFallbackData();
        }
    },

    // Резервні дані
    getFallbackData() {
        return [
            {
                id: '1',
                title: 'Арт-ваза "Хвиля"',
                author: 'CreativePrints',
                image: 'https://images.unsplash.com/photo-1589939705388-13b77b3a5d65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                description: 'Елегантна ваза з унікальним візерунком хвилі.',
                printTime: '8 годин',
                weight: '145 г',
                difficulty: 'Середня',
                downloads: '2.5K',
                dimensions: '120x120x180 мм',
                formats: ['STL', '3MF'],
                tags: ['декор', 'ваза', 'мистецтво', 'сучасний', 'арт'],
                featured: true,
                isNew: false
            },
            {
                id: '2',
                title: 'Підставка для телефону',
                author: 'GadgetLab',
                image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                description: 'Ергономічна підставка з регульованим кутом нахилу.',
                printTime: '3 години',
                weight: '65 г',
                difficulty: 'Легка',
                downloads: '8.7K',
                dimensions: '80x60x40 мм',
                formats: ['STL', 'STEP'],
                tags: ['гаджет', 'стіл', 'організація', 'аксесуар', 'техніка'],
                featured: true,
                isNew: false
            }
        ];
    },

    // Завантажити категорії з localStorage (ВИПРАВЛЕНО - краща обробка помилок)
    loadCategories() {
        try {
            const savedCategories = localStorage.getItem('categories');
            if (savedCategories) {
                const parsedCategories = JSON.parse(savedCategories);
                if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
                    console.log('Завантажено категорії з localStorage:', parsedCategories.length);
                    return parsedCategories;
                }
            }
        } catch (e) {
            console.warn('Помилка завантаження категорій з localStorage:', e);
        }
        
        console.log('Категорії не знайдені в localStorage, повертаємо null');
        return null;
    },

    // Зберегти категорії в localStorage
    saveCategories(categories) {
        try {
            const categoriesToSave = categories.filter(category => 
                category && 
                category.id && 
                category.name && 
                category.name.trim() !== ''
            );
            
            localStorage.setItem('categories', JSON.stringify(categoriesToSave));
            console.log('Категорії збережено в localStorage:', categoriesToSave.length);
            return true;
        } catch (e) {
            console.error('Error saving categories:', e);
            return false;
        }
    },

    // Очистити некоректні категорії
    cleanupCategories(categories) {
        if (!Array.isArray(categories)) return [];
        
        const cleaned = categories.filter(category => 
            category && 
            typeof category === 'object' &&
            category.id && 
            category.name && 
            typeof category.name === 'string' &&
            category.name.trim() !== ''
        );
        
        console.log(`Очищено категорії: з ${categories.length} до ${cleaned.length}`);
        return cleaned;
    },

    // Генерувати ID для нової категорії
    generateCategoryId() {
        return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Генерувати ID для нової моделі
    generateModelId() {
        return 'model_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Зберегти моделі в localStorage
    saveModels(models) {
        try {
            localStorage.setItem('models_data', JSON.stringify(models));
            console.log('Моделі збережено в localStorage:', models.length);
            return true;
        } catch (e) {
            console.error('Error saving models:', e);
            return false;
        }
    }
};

export { Utils };
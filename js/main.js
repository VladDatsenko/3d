// js/main.js - головний файл (ОНОВЛЕНО - видалено статистику)
console.log('main.js запущено');

// Статичні імпорти
import { CONFIG } from './config.js';
import { StateManager } from './state.js';
import { DomElements } from './dom-elements.js';
import { Utils } from './utils.js';
import { DEFAULT_CATEGORIES, AVAILABLE_ICONS } from './constants.js';
import { CategoriesManager } from './categories.js';
import { ModelsManager } from './models.js';
import { UIManager } from './ui.js';
import { EventHandlers } from './events.js';
import { AuthSystem } from './auth.js';
import { AuthEvents } from './auth-events.js';

// Головна функція ініціалізації
async function initApp() {
    try {
        console.log('=== Початок ініціалізації додатка ===');
        
        // 1. Ініціалізація системи автентифікації
        console.log('Ініціалізація системи автентифікації...');
        AuthSystem.init();
        AuthEvents.init();
        
        // 2. Завантажити моделі
        console.log('Завантаження моделей...');
        const models = await Utils.loadData();
        if (!models || models.length === 0) {
            throw new Error('Не вдалося завантажити моделі');
        }
        StateManager.setModels(models);
        console.log(`Завантажено ${models.length} моделей`);
        
        // 3. Завантажити категорії
        console.log('Завантаження категорій...');
        let categories = Utils.loadCategories();
        if (!categories || categories.length === 0) {
            console.log('Використано стандартні категорії (перше завантаження або дані відсутні)');
            categories = [...DEFAULT_CATEGORIES]; // Створюємо копію
        }
        
        categories = Utils.cleanupCategories(categories);
        
        // Переконатися, що є категорія "Всі"
        if (!categories.some(cat => cat.id === 'all')) {
            const allCategory = DEFAULT_CATEGORIES.find(cat => cat.id === 'all');
            if (allCategory) {
                categories.unshift(allCategory);
            }
        }
        
        StateManager.setCategories(categories);
        console.log(`Завантажено ${categories.length} категорій`);
        
        // 4. Налаштувати теги категорій
        const categoryTags = CategoriesManager.setupCategoryTags(categories);
        if (EventHandlers.setCategoryTags) {
            EventHandlers.setCategoryTags(categoryTags);
        }
        
        // 5. Застосувати фільтри та відобразити моделі
        console.log('Застосування фільтрів та відображення моделей...');
        ModelsManager.applyFilters('', categoryTags);
        
        // 6. Ініціалізувати обробники подій
        console.log('Ініціалізація обробників подій...');
        EventHandlers.init();
        
        // 7. Відобразити UI
        console.log('Відображення UI...');
        UIManager.renderCategories();
        UIManager.renderModels();
        UIManager.updateFavoritesCounter();
        UIManager.updateCartCounter();
        
        // Встановити головну сторінку як активну
        StateManager.setCurrentSection('main');
        UIManager.toggleSections('main');
        UIManager.updateNavigation('main');
        
        // 8. Додати CSS анімації
        addNotificationStyles();
        addAuthStyles();
        addShareStyles();
        
        // 9. Ініціалізація додаткових функцій
        initializeAdditionalFeatures();
        
        console.log('=== Додаток успішно ініціалізовано! ===');
    } catch (error) {
        console.error('Помилка ініціалізації додатка:', error);
        console.error('Помилка завантаження додатка:', error);
    }
}

// Додати стилі для сповіщень (лише для успішних сповіщень)
function addNotificationStyles() {
    if (document.querySelector('#notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            font-weight: 600;
            max-width: 300px;
        }
        .notification.warning {
            background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
        }
    `;
    document.head.appendChild(style);
}

// Додати стилі для автентифікації та тем
function addAuthStyles() {
    if (document.querySelector('#auth-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = `
        /* Стилі для адмін-панелі та форм вже в admin-panel.css */
        
        /* Додаткові стилі для сповіщень тем */
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-card);
            color: var(--accent-primary);
            padding: 0.75rem 1.25rem;
            border-radius: var(--radius-md);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--accent-primary);
            font-weight: 600;
            max-width: 300px;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .success-message {
            background: rgba(var(--accent-primary-rgb), 0.1);
            color: var(--accent-primary);
            padding: 1rem 1.25rem;
            border-radius: var(--radius-md);
            font-weight: 600;
            border: 1px solid rgba(var(--accent-primary-rgb), 0.3);
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .form-row {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .form-row .form-group {
            flex: 1;
        }
        
        textarea.form-input {
            min-height: 100px;
            resize: vertical;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        select.form-input {
            cursor: pointer;
        }
        
        /* Адаптивність для форм */
        @media (max-width: 768px) {
            .form-row {
                flex-direction: column;
                gap: 0.75rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// Додати стилі для секції поділу
function addShareStyles() {
    if (document.querySelector('#share-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'share-styles';
    style.textContent = `
        /* Стилі для секції поділу */
        .modal-share {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .modal-share h4 {
            margin-bottom: 1rem;
            color: var(--text-primary);
            font-size: 1.1rem;
        }
        
        .share-url-input {
            flex: 1;
            padding: 0.75rem;
            background: var(--bg-accent);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-size: 0.9rem;
            font-family: 'Inter', monospace;
        }
        
        .share-url-input:focus {
            outline: none;
            border-color: var(--accent-primary);
        }
        
        .copy-share-btn {
            padding: 0.75rem 1.25rem;
            white-space: nowrap;
            transition: all 0.2s ease;
        }
        
        .copy-share-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(var(--accent-primary-rgb), 0.2);
        }
        
        /* Адаптивність для секції поділу */
        @media (max-width: 768px) {
            .modal-share > div {
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .share-url-input {
                width: 100%;
            }
            
            .copy-share-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

// Налаштування обробників для модальних вікон
function setupModalHandlers() {
    // Додаткові обробники для модальних вікон, які не в AuthEvents
    const modals = [
        'add-model-modal',
        'change-password-modal',
        'auth-modal',
        'categories-modal',
        'model-modal',
        'order-form-modal',
        'orders-modal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Закриття по кліку на фон
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
            
            // Закриття по кнопці закриття
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('show');
                });
            }
            
            // ESC для закриття
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    modal.classList.remove('show');
                }
            });
        }
    });
}

// Ініціалізація додаткових функцій
function initializeAdditionalFeatures() {
    // Перевірка версії додатка
    const appVersion = '1.0.0';
    console.log(`Версія додатка: ${appVersion}`);
    
    // Перевірка підтримки Web Storage
    if (!window.localStorage) {
        console.warn('LocalStorage не підтримується. Деякі функції можуть не працювати.');
        console.warn('Ваш браузер не підтримує збереження даних. Рекомендуємо оновити браузер.');
    }
    
    // Перевірка мережі
    window.addEventListener('online', () => {
        console.log('Мережа: онлайн');
    });
    
    window.addEventListener('offline', () => {
        console.log('Мережа: офлайн');
        console.warn('Ви в режимі офлайн. Деякі функції можуть бути обмежені.');
    });
    
    // Відстеження подій для статистики (опційно)
    if (CONFIG.admin.trackStatistics) {
        setupAnalytics();
    }
    
    // Ініціалізація Service Worker для PWA (якщо потрібно)
    if ('serviceWorker' in navigator && CONFIG.enablePWA) {
        registerServiceWorker();
    }
}

// Налаштування аналітики
function setupAnalytics() {
    console.log('Налаштування аналітики...');
    
    // Проста аналітика на основі localStorage
    const analyticsKey = 'app_analytics';
    let analytics = localStorage.getItem(analyticsKey);
    
    if (!analytics) {
        analytics = {
            firstVisit: new Date().toISOString(),
            totalVisits: 0,
            pageViews: {},
            lastVisit: null
        };
    } else {
        try {
            analytics = JSON.parse(analytics);
        } catch (e) {
            analytics = {
                firstVisit: new Date().toISOString(),
                totalVisits: 0,
                pageViews: {},
                lastVisit: null
            };
        }
    }
    
    // Оновити статистику
    analytics.totalVisits = (analytics.totalVisits || 0) + 1;
    analytics.lastVisit = new Date().toISOString();
    
    // Зберегти
    try {
        localStorage.setItem(analyticsKey, JSON.stringify(analytics));
    } catch (e) {
        console.warn('Не вдалося зберегти аналітику:', e);
    }
}

// Реєстрація Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker зареєстрований успішно:', registration.scope);
                })
                .catch(error => {
                    console.log('Помилка реєстрації ServiceWorker:', error);
                });
        });
    }
}

// Функція для перевірки оновлень даних
async function checkForUpdates() {
    try {
        // Перевірити чи є оновлення даних
        const lastUpdateCheck = localStorage.getItem('last_update_check');
        const now = Date.now();
        
        // Перевіряти раз на день
        if (!lastUpdateCheck || (now - parseInt(lastUpdateCheck)) > 24 * 60 * 60 * 1000) {
            console.log('Перевірка оновлень даних...');
            
            // Тут можна додати логіку для перевірки оновлень з сервера
            localStorage.setItem('last_update_check', now.toString());
        }
    } catch (error) {
        console.warn('Помилка перевірки оновлень:', error);
    }
}

// Глобальні функції для відладки (лише для розробки)
if (CONFIG.debugMode) {
    window.debugState = () => {
        const state = StateManager.getState();
        console.log('=== ДЕБАГ СТАНУ ===');
        console.log('Моделі:', state.models.length);
        console.log('Категорії:', state.categories.length);
        console.log('Обране:', state.favorites.length);
        console.log('Кошик:', state.cart.length);
        console.log('Поточна категорія:', state.currentCategory);
        console.log('Поточний фільтр:', state.currentFilter);
        console.log('Поточна секція:', state.currentSection);
        console.log('Автентифікований:', AuthSystem.isAuthenticated());
        console.log('===================');
        return state;
    };
    
    window.clearAllData = () => {
        if (confirm('Видалити ВСІ дані? Цю дію неможливо скасувати!')) {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        }
    };
}

// Запуск додатка
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM завантажений, запуск додатка...');
    
    // Додати завантажувач
    addLoadingScreen();
    
    // Невелика затримка для стабільності
    setTimeout(() => {
        initApp().then(() => {
            // Перевірити оновлення після ініціалізації
            checkForUpdates();
            
            // Приховати завантажувач
            removeLoadingScreen();
        }).catch(error => {
            console.error('Помилка ініціалізації:', error);
            removeLoadingScreen();
            console.error('Критична помилка ініціалізації. Будь ласка, перезавантажте сторінку.', error);
        });
    }, 100);
});

// Додатковий обробник для помилок завантаження
window.addEventListener('error', (event) => {
    console.error('Глобальна помилка:', event.error);
    
    // Показати користувачеві дружнє повідомлення
    if (event.error && event.error.message && event.error.message.includes('fetch')) {
        console.error('Проблема з мережею. Перевірте підключення до інтернету.');
    }
});

// Додати екран завантаження
function addLoadingScreen() {
    const loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--bg-primary);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.3s ease;
    `;
    
    loader.innerHTML = `
        <div class="loader-spinner" style="
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255,255,255,0.1);
            border-radius: 50%;
            border-top-color: var(--accent-primary);
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        "></div>
        <div style="color: var(--text-primary); font-weight: 600; font-size: 1.1rem;">
            Завантаження 3DPrint Gallery...
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(loader);
}

// Приховати екран завантаження
function removeLoadingScreen() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 300);
    }
}

// Експорт функцій для тестування (якщо потрібно)
export { initApp };
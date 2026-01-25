// js/main.js - головний файл
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
            categories = DEFAULT_CATEGORIES;
            console.log('Використано стандартні категорії');
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
        
        // 5. Ініціалізувати обробники подій
        console.log('Ініціалізація обробників подій...');
        EventHandlers.init();
        
        // 6. Відобразити UI (якщо не в адмін-режимі)
        if (!AuthSystem.isAuthenticated()) {
            console.log('Відображення UI для користувача...');
            UIManager.renderCategories();
            UIManager.renderModels();
            UIManager.updateFavoritesCounter();
        } else {
            console.log('Користувач автентифікований як адмін. Показуємо адмін-панель...');
        }
        
        // 7. Додати CSS анімації
        addNotificationStyles();
        addAuthStyles();
        
        // 8. Оновити статистику адмін-панелі
        updateAdminStats();
        
        // 9. Додати обробники для нових модальних вікон
        setupModalHandlers();
        
        // 10. Ініціалізація додаткових функцій
        initializeAdditionalFeatures();
        
        console.log('=== Додаток успішно ініціалізовано! ===');
    } catch (error) {
        console.error('Помилка ініціалізації додатка:', error);
        showErrorNotification('Помилка завантаження додатка. Перевірте консоль.');
    }
}

// Додати стилі для сповіщень
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
        .notification.error {
            background: linear-gradient(135deg, #ff2a6d 0%, #c2185b 100%);
        }
    `;
    document.head.appendChild(style);
}

// Додати стилі для автентифікації
function addAuthStyles() {
    if (document.querySelector('#auth-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = `
        /* Стилі для адмін-панелі та форм вже в admin-panel.css */
        
        /* Додаткові стилі для нових модальних вікон */
        .success-message {
            background: rgba(68, 214, 44, 0.1);
            color: var(--accent-primary);
            padding: 1rem 1.25rem;
            border-radius: var(--radius-md);
            font-weight: 600;
            border: 1px solid rgba(68, 214, 44, 0.3);
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

// Налаштування обробників для модальних вікон
function setupModalHandlers() {
    // Додаткові обробники для модальних вікон, які не в AuthEvents
    const modals = [
        'add-model-modal',
        'change-password-modal',
        'auth-modal',
        'categories-modal',
        'model-modal'
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
        Utils.showNotification('Ваш браузер не підтримує збереження даних. Рекомендуємо оновити браузер.', 'warning');
    }
    
    // Перевірка мережі
    window.addEventListener('online', () => {
        console.log('Мережа: онлайн');
    });
    
    window.addEventListener('offline', () => {
        console.log('Мережа: офлайн');
        Utils.showNotification('Ви в режимі офлайн. Деякі функції можуть бути обмежені.', 'warning');
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

// Оновити статистику адмін-панелі
function updateAdminStats() {
    setTimeout(() => {
        const state = StateManager.getState();
        
        // Кількість моделей
        const modelsCount = document.getElementById('stat-models-count');
        if (modelsCount) {
            modelsCount.textContent = state.models.length;
        }
        
        // Кількість в обраному
        const favoritesCount = document.getElementById('stat-favorites-count');
        if (favoritesCount) {
            favoritesCount.textContent = state.favorites.length;
        }
        
        // Кількість категорій
        const categoriesCount = document.getElementById('stat-categories-count');
        if (categoriesCount) {
            categoriesCount.textContent = state.categories.length;
        }
        
        // Загальна кількість завантажень
        const totalDownloads = document.getElementById('stat-total-downloads');
        if (totalDownloads && state.models.length > 0) {
            const total = state.models.reduce((sum, model) => {
                const downloads = parseInt(model.downloads.replace('K', '000').replace(/[^0-9]/g, '')) || 0;
                return sum + downloads;
            }, 0);
            totalDownloads.textContent = total > 1000 ? 
                `${(total / 1000).toFixed(1)}K` : 
                total.toLocaleString();
        }
        
        // Оновити дату в адмін-привітанні
        const adminWelcome = document.getElementById('admin-welcome');
        if (adminWelcome && AuthSystem.isAuthenticated()) {
            const authState = AuthSystem.getAuthState();
            const lastActivity = authState.lastActivity ? 
                new Date(authState.lastActivity).toLocaleString('uk-UA') : 
                'тільки що';
            adminWelcome.innerHTML = `
                <h3>Ласкаво просимо до адмін-панелі!</h3>
                <p>Остання активність: ${lastActivity}</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">
                    Моделей: ${state.models.length} | Категорій: ${state.categories.length} | Обраних: ${state.favorites.length}
                </p>
            `;
        }
    }, 500);
}

// Функція для сповіщення про помилку
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
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
            showErrorNotification('Критична помилка ініціалізації. Будь ласка, перезавантажте сторінку.');
        });
    }, 100);
});

// Додатковий обробник для помилок завантаження
window.addEventListener('error', (event) => {
    console.error('Глобальна помилка:', event.error);
    
    // Показати користувачеві дружнє повідомлення
    if (event.error && event.error.message && event.error.message.includes('fetch')) {
        showErrorNotification('Проблема з мережею. Перевірте підключення до інтернету.');
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
export { initApp, updateAdminStats, showErrorNotification };
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
    `;
    document.head.appendChild(style);
}

// Додати стилі для автентифікації
function addAuthStyles() {
    if (document.querySelector('#auth-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = `
        /* Стилі для адмін-панелі */
        .admin-section {
            padding: 2rem 0;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .admin-welcome {
            background: var(--bg-card);
            padding: 1.5rem;
            border-radius: var(--radius-lg);
            margin-bottom: 2rem;
            border: 1px solid rgba(68, 214, 44, 0.2);
            box-shadow: var(--shadow-md);
        }
        
        .admin-welcome h3 {
            color: var(--accent-primary);
            margin-bottom: 0.5rem;
            font-size: 1.5rem;
        }
        
        .admin-welcome p {
            color: var(--text-secondary);
            line-height: 1.6;
        }
        
        .admin-content {
            display: flex;
            flex-direction: column;
            gap: 3rem;
        }
        
        .admin-stats h3,
        .admin-actions h3 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            color: var(--text-primary);
            padding-bottom: 0.5rem;
            border-bottom: 2px solid rgba(68, 214, 44, 0.3);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 1.5rem;
        }
        
        .stat-card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1.25rem;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: var(--transition);
            box-shadow: var(--shadow-sm);
        }
        
        .stat-card:hover {
            border-color: var(--accent-primary);
            transform: translateY(-4px);
            box-shadow: var(--shadow-lg);
        }
        
        .stat-icon {
            width: 60px;
            height: 60px;
            background: var(--gradient-primary);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            color: white;
            flex-shrink: 0;
        }
        
        .stat-info {
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: 800;
            color: var(--accent-primary);
            line-height: 1;
            margin-bottom: 0.25rem;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }
        
        .action-btn {
            background: var(--bg-card);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: var(--radius-lg);
            padding: 1.75rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            cursor: pointer;
            transition: var(--transition);
            color: var(--text-primary);
            text-decoration: none;
            text-align: center;
            box-shadow: var(--shadow-sm);
        }
        
        .action-btn:hover {
            border-color: var(--accent-primary);
            transform: translateY(-4px);
            background: rgba(68, 214, 44, 0.05);
            box-shadow: var(--shadow-lg);
        }
        
        .action-btn i {
            font-size: 2.5rem;
            color: var(--accent-primary);
        }
        
        .action-btn span {
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        /* Форми автентифікації */
        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .form-label {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 1rem;
        }
        
        .form-input {
            padding: 0.875rem 1.25rem;
            border-radius: var(--radius-md);
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: var(--bg-card);
            color: var(--text-primary);
            font-size: 1rem;
            transition: var(--transition);
            width: 100%;
        }
        
        .form-input:focus {
            border-color: var(--accent-primary);
            outline: none;
            box-shadow: 0 0 0 3px rgba(68, 214, 44, 0.2);
        }
        
        .form-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .security-question {
            background: var(--bg-accent);
            padding: 1.25rem;
            border-radius: var(--radius-lg);
            margin-bottom: 1.5rem;
            border: 1px solid rgba(68, 214, 44, 0.1);
        }
        
        .security-question p {
            margin-bottom: 0.75rem;
            color: var(--text-primary);
        }
        
        .security-question strong {
            color: var(--accent-primary);
        }
        
        .error-message {
            background: rgba(255, 42, 109, 0.1);
            color: var(--accent-danger);
            padding: 1rem 1.25rem;
            border-radius: var(--radius-md);
            font-weight: 600;
            border: 1px solid rgba(255, 42, 109, 0.3);
            animation: shake 0.5s;
        }
        
        .attempts-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(255, 193, 7, 0.1);
            color: #ffc107;
            padding: 1rem 1.25rem;
            border-radius: var(--radius-md);
            font-weight: 600;
            border: 1px solid rgba(255, 193, 7, 0.3);
        }
        
        .attempts-info i {
            font-size: 1.25rem;
        }
        
        /* Адаптивність адмін-панелі */
        @media (max-width: 1024px) {
            .stats-grid {
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            }
            
            .actions-grid {
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            }
        }
        
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            }
            
            .actions-grid {
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            }
            
            .stat-card {
                padding: 1.25rem;
                gap: 1rem;
            }
            
            .stat-icon {
                width: 50px;
                height: 50px;
                font-size: 1.5rem;
            }
            
            .stat-value {
                font-size: 1.75rem;
            }
            
            .action-btn {
                padding: 1.5rem;
            }
            
            .action-btn i {
                font-size: 2rem;
            }
            
            .form-actions {
                flex-direction: column;
                align-items: stretch;
            }
            
            .form-actions button {
                width: 100%;
            }
        }
        
        @media (max-width: 480px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .actions-grid {
                grid-template-columns: 1fr;
            }
            
            .admin-welcome {
                padding: 1.25rem;
            }
            
            .admin-welcome h3 {
                font-size: 1.3rem;
            }
        }
    `;
    document.head.appendChild(style);
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
    }, 500);
}

// Функція для сповіщення про помилку
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = '#ff2a6d';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Запуск додатка
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM завантажений, запуск додатка...');
    setTimeout(() => initApp(), 100); // Невелика затримка для стабільності
});

// Додатковий обробник для помилок завантаження
window.addEventListener('error', (event) => {
    console.error('Глобальна помилка:', event.error);
});

// Експорт функції ініціалізації (якщо потрібно)
export { initApp };
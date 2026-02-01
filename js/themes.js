// js/themes.js
// Система зміни кольорових тем

const ThemeManager = {
    // Доступні теми
    themes: {
        green: {
            name: 'Зелена',
            class: 'theme-green',
            color: '#44ff00'
        },
        pink: {
            name: 'Рожева',
            class: 'theme-pink',
            color: '#ff00aa'
        },
        blue: {
            name: 'Блакитна',
            class: 'theme-blue',
            color: '#00aaff'
        },
        gold: {
            name: 'Золота',
            class: 'theme-gold',
            color: '#ffaa00'
        },
        purple: {
            name: 'Фіолетова',
            class: 'theme-purple',
            color: '#aa00ff'
        }
    },

    // Поточна тема
    currentTheme: 'green',

    // DOM елементи
    elements: {
        themeBtn: null,
        themeDropdown: null,
        themeOptions: null,
        body: null
    },

    // Ініціалізація
    init() {
        console.log('Ініціалізація менеджера тем...');
        
        // Отримання DOM елементів
        this.elements.themeBtn = document.querySelector('.theme-btn');
        this.elements.themeDropdown = document.querySelector('.theme-dropdown');
        this.elements.themeOptions = document.querySelectorAll('.theme-option');
        this.elements.body = document.body;
        
        // Перевірка елементів
        if (!this.elements.themeBtn || !this.elements.themeDropdown) {
            console.error('Не знайдено елементи для зміни теми:', {
                themeBtn: !!this.elements.themeBtn,
                themeDropdown: !!this.elements.themeDropdown,
                themeOptions: this.elements.themeOptions?.length || 0
            });
            return;
        }
        
        // Завантажити збережену тему
        this.loadTheme();
        
        // Налаштування обробників подій
        this.setupEventListeners();
        
        console.log('Менеджер тем успішно ініціалізовано');
    },

    // Налаштування обробників подій
    setupEventListeners() {
        // Клік по кнопці теми
        this.elements.themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Клік по кнопці теми');
            this.toggleDropdown();
        });

        // Клік по опціях теми
        this.elements.themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const theme = option.dataset.theme;
                console.log('Клік по темі:', theme);
                if (theme && this.themes[theme]) {
                    this.changeTheme(theme);
                    this.closeDropdown();
                }
            });
        });

        // Закриття випадаючого списку при кліку поза ним
        document.addEventListener('click', (e) => {
            if (!this.elements.themeBtn.contains(e.target) && !this.elements.themeDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Закриття по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.themeDropdown.classList.contains('show')) {
                this.closeDropdown();
            }
        });
    },

    // Перемикання випадаючого списку
    toggleDropdown() {
        const isOpen = this.elements.themeDropdown.classList.contains('show');
        console.log('Перемикання dropdown, поточний стан:', isOpen);
        if (isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    },

    // Відкрити випадаючий список
    openDropdown() {
        console.log('Відкриття dropdown');
        this.elements.themeDropdown.classList.add('show');
        // Оновити активну опцію
        this.updateActiveOption();
    },

    // Закрити випадаючий список
    closeDropdown() {
        console.log('Закриття dropdown');
        this.elements.themeDropdown.classList.remove('show');
    },

    // Змінити тему
    changeTheme(themeId) {
        console.log(`Зміна теми на: ${themeId}`);
        
        // Перевірити чи тема існує
        if (!this.themes[themeId]) {
            console.error(`Тема ${themeId} не знайдена`);
            return;
        }
        
        // Видалити всі класи тем
        Object.values(this.themes).forEach(theme => {
            this.elements.body.classList.remove(theme.class);
        });
        
        // Додати новий клас теми
        this.elements.body.classList.add(this.themes[themeId].class);
        
        // Оновити поточну тему
        this.currentTheme = themeId;
        
        // Зберегти у localStorage
        this.saveTheme();
        
        // Оновити активну опцію
        this.updateActiveOption();
        
        // Показати сповіщення
        this.showNotification(`Тема змінена на: ${this.themes[themeId].name}`);
    },

    // Оновити активну опцію у випадаючому списку
    updateActiveOption() {
        this.elements.themeOptions.forEach(option => {
            const theme = option.dataset.theme;
            if (theme === this.currentTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    },

    // Завантажити тему з localStorage
    loadTheme() {
        try {
            const savedTheme = localStorage.getItem('site_theme');
            console.log('Завантаження теми з localStorage:', savedTheme);
            if (savedTheme && this.themes[savedTheme]) {
                this.currentTheme = savedTheme;
                // Застосувати тему
                this.elements.body.classList.add(this.themes[savedTheme].class);
                this.updateActiveOption();
                console.log(`Завантажено збережену тему: ${savedTheme}`);
            } else {
                // Використати стандартну зелену тему
                this.currentTheme = 'green';
                this.elements.body.classList.add('theme-green');
                this.updateActiveOption();
                console.log('Використано стандартну зелену тему');
            }
        } catch (error) {
            console.error('Помилка завантаження теми:', error);
            this.currentTheme = 'green';
            this.elements.body.classList.add('theme-green');
        }
    },

    // Зберегти тему в localStorage
    saveTheme() {
        try {
            localStorage.setItem('site_theme', this.currentTheme);
            console.log('Тема збережена:', this.currentTheme);
        } catch (error) {
            console.error('Помилка збереження теми:', error);
        }
    },

    // Показати сповіщення
    showNotification(message) {
        console.log('Сповіщення:', message);
        // Створюємо просте сповіщення
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-card);
            color: var(--accent-primary);
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            z-index: 10000;
            border: 1px solid var(--accent-primary);
            box-shadow: var(--shadow-lg);
            font-weight: 600;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        // Додаємо стилі для анімації
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 300);
        }, 2000);
    },

    // Отримати поточну тему
    getCurrentTheme() {
        return this.themes[this.currentTheme];
    },

    // Отримати всі теми
    getAllThemes() {
        return this.themes;
    },

    // Скинути на стандартну тему
    resetToDefault() {
        this.changeTheme('green');
    }
};

// Автоматична ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM завантажений, ініціалізація ThemeManager...');
    ThemeManager.init();
});

// Експорт для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
} else {
    window.ThemeManager = ThemeManager;
}
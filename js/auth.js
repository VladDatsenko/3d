// js/auth.js
import { CONFIG } from './config.js';
import { Utils } from './utils.js';

// Система автентифікації та авторизації
const AuthSystem = {
    // Стан автентифікації
    state: {
        isAuthenticated: false,
        loginAttempts: 0,
        lockedUntil: null,
        lastActivity: null,
        currentSession: null
    },

    // Інтервал для перевірки DevTools
    devToolsInterval: null,

    // Ініціалізація системи
    init() {
        console.log('Ініціалізація системи автентифікації...');
        this.loadAuthState();
        this.checkSession();
        this.setupActivityTracker();
        this.securityCheck();
    },

    // Завантажити стан автентифікації з localStorage
    loadAuthState() {
        try {
            const savedState = localStorage.getItem('auth_state');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                // Перевіряємо чи сесія ще дійсна
                if (parsedState.isAuthenticated && parsedState.lastActivity) {
                    const sessionAge = Date.now() - parsedState.lastActivity;
                    if (sessionAge <= CONFIG.admin.sessionDuration) {
                        this.state = { ...this.state, ...parsedState };
                        console.log('Сесія відновлена');
                    } else {
                        // Сесія закінчилась
                        console.log('Сесія закінчилась, видаляємо...');
                        this.clearAuthState();
                    }
                } else {
                    this.state = { ...this.state, ...parsedState };
                }
            }
        } catch (error) {
            console.error('Помилка завантаження стану автентифікації:', error);
            this.clearAuthState();
        }
    },

    // Очистити стан автентифікації
    clearAuthState() {
        this.state = {
            isAuthenticated: false,
            loginAttempts: 0,
            lockedUntil: null,
            lastActivity: null,
            currentSession: null
        };
        this.saveAuthState();
    },

    // Зберегти стан автентифікації
    saveAuthState() {
        try {
            localStorage.setItem('auth_state', JSON.stringify(this.state));
        } catch (error) {
            console.error('Помилка збереження стану автентифікації:', error);
        }
    },

    // Перевірити чи система заблокована
    isLocked() {
        if (this.state.lockedUntil && Date.now() < this.state.lockedUntil) {
            const minutesLeft = Math.ceil((this.state.lockedUntil - Date.now()) / 60000);
            return { locked: true, minutesLeft };
        }
        return { locked: false };
    },

    // Проста функція хешування (для frontend)
    hashPassword(password) {
        if (!CONFIG.security.useHashing) return password;
        
        // Просте хешування для демонстрації
        const str = password + CONFIG.security.hashSalt;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },

    // Перевірити збережений пароль
    getSavedPasswordHash() {
        try {
            const savedHash = localStorage.getItem('admin_password_hash');
            if (savedHash) return savedHash;
            
            // Якщо немає збереженого пароля, створюємо хеш за замовчуванням
            const defaultHash = this.hashPassword(CONFIG.admin.defaultPassword);
            localStorage.setItem('admin_password_hash', defaultHash);
            return defaultHash;
        } catch (error) {
            console.error('Помилка отримання пароля:', error);
            return this.hashPassword(CONFIG.admin.defaultPassword);
        }
    },

    // Перевірка пароля
    verifyPassword(inputPassword) {
        // Перевірка на блокування
        const lockStatus = this.isLocked();
        if (lockStatus.locked) {
            return {
                success: false,
                message: `Система заблокована. Спробуйте через ${lockStatus.minutesLeft} хвилин.`,
                locked: true
            };
        }

        // Хешуємо введений пароль для порівняння
        const hashedInput = this.hashPassword(inputPassword);
        const savedHash = this.getSavedPasswordHash();
        
        // Перевіряємо пароль
        if (hashedInput === savedHash) {
            // Скидаємо лічильник спроб
            this.state.loginAttempts = 0;
            this.state.lockedUntil = null;
            this.state.isAuthenticated = true;
            this.state.lastActivity = Date.now();
            this.state.currentSession = Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.saveAuthState();
            
            return {
                success: true,
                message: 'Успішна автентифікація'
            };
        } else {
            // Збільшуємо лічильник спроб
            this.state.loginAttempts++;
            
            // Перевіряємо чи не перевищено ліміт спроб
            if (this.state.loginAttempts >= CONFIG.admin.maxLoginAttempts) {
                this.state.lockedUntil = Date.now() + CONFIG.admin.lockoutDuration;
                // ВИДАЛЕНО: Utils.showNotification(`Забагато невдалих спроб. Система заблокована на ${CONFIG.admin.lockoutDuration / 60000} хвилин.`, 'error');
                console.warn(`Забагато невдалих спроб. Система заблокована на ${CONFIG.admin.lockoutDuration / 60000} хвилин.`);
            }
            
            this.saveAuthState();
            
            const attemptsLeft = CONFIG.admin.maxLoginAttempts - this.state.loginAttempts;
            return {
                success: false,
                message: `Невірний пароль. Залишилось спроб: ${attemptsLeft > 0 ? attemptsLeft : 0}`,
                attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0
            };
        }
    },

    // Перевірка секретного питання
    verifySecurityQuestion(answer) {
        const hashedInput = this.hashPassword(answer.toLowerCase().trim());
        const hashedAnswer = this.hashPassword(CONFIG.admin.securityAnswer.toLowerCase().trim());
        
        return hashedInput === hashedAnswer;
    },

    // Вхід в систему
    login(password) {
        const result = this.verifyPassword(password);
        if (result.success) {
            Utils.showNotification('Успішний вхід в адмін-панель');
            this.dispatchAuthChange();
            return result;
        } else if (!result.locked) {
            // ВИДАЛЕНО: Utils.showNotification(result.message, 'error');
            // Залишаємо лише повернення результату - форма сама покаже помилку
        }
        return result;
    },

    // Вихід з системи
    logout() {
        this.cleanup();
        this.state.isAuthenticated = false;
        this.state.lastActivity = null;
        this.state.currentSession = null;
        this.saveAuthState();
        Utils.showNotification('Ви вийшли з адмін-панелі');
        this.dispatchAuthChange();
    },

    // Перевірка сесії
    checkSession() {
        if (this.state.isAuthenticated && this.state.lastActivity) {
            const sessionAge = Date.now() - this.state.lastActivity;
            if (sessionAge > CONFIG.admin.sessionDuration) {
                this.logout();
                return false;
            }
            return true;
        }
        return false;
    },

    // Оновити активність
    updateActivity() {
        if (this.state.isAuthenticated) {
            this.state.lastActivity = Date.now();
            this.saveAuthState();
        }
    },

    // Відстеження активності
    setupActivityTracker() {
        // Оновлюємо активність при взаємодії з сторінкоу
        const activityEvents = ['click', 'keypress', 'mousemove', 'scroll'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                if (this.state.isAuthenticated) {
                    this.updateActivity();
                }
            });
        });
    },

    // Зміна пароля
    changePassword(currentPassword, newPassword) {
        if (!this.state.isAuthenticated) {
            return {
                success: false,
                message: 'Для зміни пароля потрібно увійти в систему'
            };
        }

        // Перевіряємо поточний пароль
        const verifyResult = this.verifyPassword(currentPassword);
        if (!verifyResult.success) {
            return {
                success: false,
                message: 'Невірний поточний пароль'
            };
        }

        // Змінюємо пароль
        try {
            const hashedNewPassword = this.hashPassword(newPassword);
            localStorage.setItem('admin_password_hash', hashedNewPassword);
            
            Utils.showNotification('Пароль успішно змінено');
            return {
                success: true,
                message: 'Пароль успішно змінено'
            };
        } catch (error) {
            console.error('Помилка зміни пароля:', error);
            return {
                success: false,
                message: 'Помилка збереження нового пароля'
            };
        }
    },

    // Скидання пароля через секретне питання
    resetPassword(securityAnswer, newPassword) {
        if (this.verifySecurityQuestion(securityAnswer)) {
            try {
                const hashedNewPassword = this.hashPassword(newPassword);
                localStorage.setItem('admin_password_hash', hashedNewPassword);
                
                // Скидаємо блокування
                this.state.loginAttempts = 0;
                this.state.lockedUntil = null;
                this.saveAuthState();
                
                Utils.showNotification('Пароль успішно скинуто');
                return {
                    success: true,
                    message: 'Пароль успішно скинуто'
                };
            } catch (error) {
                console.error('Помилка скидання пароля:', error);
                return {
                    success: false,
                    message: 'Помилка збереження нового пароля'
                };
            }
        } else {
            return {
                success: false,
                message: 'Невірна відповідь на секретне питання'
            };
        }
    },

    // Отримати стан автентифікації
    getAuthState() {
        return {
            ...this.state,
            securityQuestion: CONFIG.admin.securityQuestion,
            maxLoginAttempts: CONFIG.admin.maxLoginAttempts
        };
    },

    // Перевірити чи користувач автентифікований
    isAuthenticated() {
        return this.state.isAuthenticated && this.checkSession();
    },

    // Скинути спроби входу
    resetLoginAttempts() {
        this.state.loginAttempts = 0;
        this.state.lockedUntil = null;
        this.saveAuthState();
    },

    // Отримати залишок спроб
    getRemainingAttempts() {
        return Math.max(0, CONFIG.admin.maxLoginAttempts - this.state.loginAttempts);
    },

    // Подія зміни стану автентифікації
    dispatchAuthChange() {
        const event = new CustomEvent('authChange', {
            detail: { 
                isAuthenticated: this.state.isAuthenticated,
                loginAttempts: this.state.loginAttempts
            }
        });
        document.dispatchEvent(event);
    },

    // Додаткові перевірки безпеки
    securityCheck() {
        // Перевірка на відкриття DevTools (базова)
        const devToolsCheck = () => {
            if (!this.state.isAuthenticated) return;
            
            const threshold = 160;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            
            if (widthThreshold || heightThreshold) {
                console.warn('DevTools виявлено');
            }
        };

        // Перевіряємо періодично
        this.devToolsInterval = setInterval(devToolsCheck, 1000);
    },

    // Очищення ресурсів
    cleanup() {
        if (this.devToolsInterval) {
            clearInterval(this.devToolsInterval);
            this.devToolsInterval = null;
        }
    }
};

export { AuthSystem };
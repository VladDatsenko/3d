// js/auth-events.js
import { AuthSystem } from './auth.js';
import { DomElements } from './dom-elements.js';
import { UIManager } from './ui.js';
import { Utils } from './utils.js';

// Обробники подій для автентифікації
const AuthEvents = {
    // Ініціалізація обробників автентифікації
    init() {
        console.log('Ініціалізація обробників автентифікації...');
        
        this.setupAdminButton();
        this.setupLoginForm();
        this.setupResetForm();
        this.setupLogoutButton();
        this.setupAuthModal();
        this.setupAdminActions();
        
        // Слухач зміни стану автентифікації
        document.addEventListener('authChange', (e) => {
            this.handleAuthChange(e.detail.isAuthenticated);
        });
        
        // Початкова перевірка стану
        this.handleAuthChange(AuthSystem.isAuthenticated());
        
        // Перевірити та оновити інформацію про спроби
        this.updateLoginAttemptsInfo();
    },

    // Налаштування кнопки адміна
    setupAdminButton() {
        // Кнопка вже налаштована в events.js
        // Оновлюємо її зовнішній вигляд
        this.updateAdminButton();
    },

    // Оновити вигляд кнопки адміна
    updateAdminButton() {
        const adminBtn = document.querySelector('.admin-categories-btn');
        if (!adminBtn) return;
        
        const isAuthenticated = AuthSystem.isAuthenticated();
        
        if (isAuthenticated) {
            adminBtn.innerHTML = '<i class="fas fa-user-cog"></i>';
            adminBtn.title = 'Адмін-панель';
        } else {
            adminBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
            adminBtn.title = 'Вхід до адмін-панелі';
        }
    },

    // Показати модальне вікно авторизації
    showAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            // Показати форму входу
            document.getElementById('login-form-container').style.display = 'block';
            document.getElementById('reset-password-form').style.display = 'none';
            
            // Скинути помилки
            const loginError = document.getElementById('login-error');
            if (loginError) {
                loginError.style.display = 'none';
                loginError.textContent = '';
            }
            
            // Скинути поле пароля
            const loginPasswordInput = document.getElementById('login-password');
            if (loginPasswordInput) {
                loginPasswordInput.value = '';
            }
            
            // Встановити секретне питання
            const questionElement = document.getElementById('security-question-text');
            if (questionElement) {
                questionElement.textContent = AuthSystem.getAuthState().securityQuestion;
            }
            
            // Показати/приховати інформацію про спроби
            this.updateLoginAttemptsInfo();
            
            authModal.classList.add('show');
            
            // Фокус на поле пароля
            setTimeout(() => {
                if (loginPasswordInput) {
                    loginPasswordInput.focus();
                }
            }, 100);
        }
    },

    // Закрити модальне вікно авторизації
    closeAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.remove('show');
            
            // Скинути всі поля форми
            this.resetAuthForms();
        }
    },

    // Скинути поля форм автентифікації
    resetAuthForms() {
        const loginPasswordInput = document.getElementById('login-password');
        if (loginPasswordInput) loginPasswordInput.value = '';
        
        const resetSecurityAnswer = document.getElementById('reset-security-answer');
        if (resetSecurityAnswer) resetSecurityAnswer.value = '';
        
        const resetNewPassword = document.getElementById('reset-new-password');
        if (resetNewPassword) resetNewPassword.value = '';
        
        const resetConfirmPassword = document.getElementById('reset-confirm-password');
        if (resetConfirmPassword) resetConfirmPassword.value = '';
        
        const loginError = document.getElementById('login-error');
        if (loginError) {
            loginError.style.display = 'none';
            loginError.textContent = '';
        }
        
        const resetError = document.getElementById('reset-error');
        if (resetError) {
            resetError.style.display = 'none';
            resetError.textContent = '';
        }
    },

    // Налаштування модального вікна авторизації
    setupAuthModal() {
        // Обробники вже в events.js
        // Додаємо тільки обробник для форми
        const loginForm = document.getElementById('login-form-container');
        if (loginForm) {
            loginForm.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        const resetForm = document.getElementById('reset-password-form');
        if (resetForm) {
            resetForm.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    },

    // Оновити інформацію про спроби входу
    updateLoginAttemptsInfo() {
        const attemptsInfo = document.getElementById('login-attempts-info');
        if (!attemptsInfo) return;
        
        const authState = AuthSystem.getAuthState();
        const remainingAttempts = AuthSystem.getRemainingAttempts();
        
        // Перевіряємо чи система заблокована
        const lockStatus = AuthSystem.isLocked();
        if (lockStatus.locked) {
            attemptsInfo.style.display = 'flex';
            attemptsInfo.innerHTML = `
                <i class="fas fa-lock"></i>
                <span>Система заблокована. Спробуйте через ${lockStatus.minutesLeft} хвилин.</span>
            `;
            attemptsInfo.style.background = 'rgba(255, 42, 109, 0.1)';
            attemptsInfo.style.color = 'var(--accent-danger)';
            attemptsInfo.style.borderColor = 'rgba(255, 42, 109, 0.3)';
            return;
        }
        
        if (authState.loginAttempts > 0) {
            attemptsInfo.style.display = 'flex';
            attemptsInfo.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>Залишилось спроб: <strong>${remainingAttempts}</strong></span>
            `;
            attemptsInfo.style.background = 'rgba(255, 193, 7, 0.1)';
            attemptsInfo.style.color = '#ffc107';
            attemptsInfo.style.borderColor = 'rgba(255, 193, 7, 0.3)';
        } else {
            attemptsInfo.style.display = 'none';
        }
    },

    // Налаштування форми входу
    setupLoginForm() {
        const loginSubmitBtn = document.getElementById('login-submit-btn');
        if (loginSubmitBtn) {
            loginSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        const loginPasswordInput = document.getElementById('login-password');
        if (loginPasswordInput) {
            loginPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            });
            
            // Скинути помилку при зміні пароля
            loginPasswordInput.addEventListener('input', () => {
                const loginError = document.getElementById('login-error');
                if (loginError) {
                    loginError.style.display = 'none';
                    loginError.textContent = '';
                }
            });
        }
    },

    // Обробка входу
    handleLogin() {
        const loginPasswordInput = document.getElementById('login-password');
        const password = loginPasswordInput ? loginPasswordInput.value.trim() : '';
        
        if (!password) {
            this.showLoginError('Будь ласка, введіть пароль');
            return;
        }
        
        const result = AuthSystem.login(password);
        
        if (result.success) {
            this.closeAuthModal();
            this.showAdminPanel();
            this.updateAdminButton();
        } else {
            this.updateLoginAttemptsInfo();
            
            if (result.locked) {
                this.showLoginError(result.message);
            } else {
                this.showLoginError(result.message);
            }
        }
    },

    // Показати помилку входу
    showLoginError(message) {
        const loginError = document.getElementById('login-error');
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
            
            // Анімація помилки
            loginError.style.animation = 'none';
            setTimeout(() => {
                loginError.style.animation = 'shake 0.5s';
            }, 10);
        }
    },

    // Налаштування форми скидання пароля
    setupResetForm() {
        // Перехід до форми скидання
        const showResetFormBtn = document.getElementById('show-reset-form-btn');
        if (showResetFormBtn) {
            showResetFormBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('login-form-container').style.display = 'none';
                document.getElementById('reset-password-form').style.display = 'block';
                
                // Скинути помилки
                const resetError = document.getElementById('reset-error');
                if (resetError) {
                    resetError.style.display = 'none';
                    resetError.textContent = '';
                }
                
                // Фокус на поле відповіді
                setTimeout(() => {
                    const resetSecurityAnswer = document.getElementById('reset-security-answer');
                    if (resetSecurityAnswer) {
                        resetSecurityAnswer.focus();
                    }
                }, 100);
            });
        }
        
        // Повернення до форми входу
        const backToLoginBtn = document.getElementById('back-to-login-btn');
        if (backToLoginBtn) {
            backToLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('login-form-container').style.display = 'block';
                document.getElementById('reset-password-form').style.display = 'none';
                
                // Скинути поля форми скидання
                const resetSecurityAnswer = document.getElementById('reset-security-answer');
                if (resetSecurityAnswer) resetSecurityAnswer.value = '';
                
                const resetNewPassword = document.getElementById('reset-new-password');
                if (resetNewPassword) resetNewPassword.value = '';
                
                const resetConfirmPassword = document.getElementById('reset-confirm-password');
                if (resetConfirmPassword) resetConfirmPassword.value = '';
                
                // Скинути помилки
                const resetError = document.getElementById('reset-error');
                if (resetError) {
                    resetError.style.display = 'none';
                    resetError.textContent = '';
                }
                
                // Фокус на поле пароля
                setTimeout(() => {
                    const loginPasswordInput = document.getElementById('login-password');
                    if (loginPasswordInput) {
                        loginPasswordInput.focus();
                    }
                }, 100);
            });
        }
        
        // Обробка скидання пароля
        const resetSubmitBtn = document.getElementById('reset-submit-btn');
        if (resetSubmitBtn) {
            resetSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePasswordReset();
            });
        }
    },

    // Обробка скидання пароля
    handlePasswordReset() {
        const resetSecurityAnswer = document.getElementById('reset-security-answer');
        const resetNewPassword = document.getElementById('reset-new-password');
        const resetConfirmPassword = document.getElementById('reset-confirm-password');
        
        const answer = resetSecurityAnswer ? resetSecurityAnswer.value.trim() : '';
        const newPassword = resetNewPassword ? resetNewPassword.value.trim() : '';
        const confirmPassword = resetConfirmPassword ? resetConfirmPassword.value.trim() : '';
        
        // Валідація
        if (!answer || !newPassword || !confirmPassword) {
            this.showResetError('Будь ласка, заповніть всі поля');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showResetError('Паролі не співпадають');
            return;
        }
        
        if (newPassword.length < 4) {
            this.showResetError('Пароль повинен містити мінімум 4 символи');
            return;
        }
        
        const result = AuthSystem.resetPassword(answer, newPassword);
        
        if (result.success) {
            Utils.showNotification('Пароль успішно скинуто! Тепер ви можете увійти з новим паролем.');
            this.closeAuthModal();
            this.showAuthModal(); // Показати форму входу знову
        } else {
            this.showResetError(result.message);
        }
    },

    // Показати помилку скидання пароля
    showResetError(message) {
        const resetError = document.getElementById('reset-error');
        if (resetError) {
            resetError.textContent = message;
            resetError.style.display = 'block';
            
            // Анімація помилки
            resetError.style.animation = 'none';
            setTimeout(() => {
                resetError.style.animation = 'shake 0.5s';
            }, 10);
        }
    },

    // Налаштування кнопки виходу
    setupLogoutButton() {
        const adminLogoutBtn = document.getElementById('admin-logout-btn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                AuthSystem.logout();
                this.updateAdminButton();
            });
        }
    },

    // Обробка зміни стану автентифікації
    handleAuthChange(isAuthenticated) {
        this.updateAdminButton();
        this.updateLoginAttemptsInfo();
        
        const adminSection = document.getElementById('admin-section');
        if (adminSection) {
            if (isAuthenticated) {
                // Показати адмін-панель
                adminSection.classList.remove('hidden');
                // Приховати інші секції
                const modelsSection = document.querySelector('.models-section');
                if (modelsSection) {
                    modelsSection.classList.add('hidden');
                }
                const favoritesSection = document.querySelector('.favorites-section');
                if (favoritesSection) {
                    favoritesSection.classList.add('hidden');
                }
                
                // Оновити навігацію
                this.updateNavigation('admin');
                
                // Оновити вітання
                const adminWelcome = document.getElementById('admin-welcome');
                if (adminWelcome) {
                    const authState = AuthSystem.getAuthState();
                    const lastActivity = authState.lastActivity ? 
                        new Date(authState.lastActivity).toLocaleString('uk-UA') : 
                        'тільки що';
                    adminWelcome.innerHTML = `
                        <h3>Ласкаво просимо до адмін-панелі!</h3>
                        <p>Остання активність: ${lastActivity}</p>
                    `;
                }
            } else {
                // Приховати адмін-панель
                adminSection.classList.add('hidden');
                // Показати основну секцію
                const modelsSection = document.querySelector('.models-section');
                if (modelsSection) {
                    modelsSection.classList.remove('hidden');
                }
                
                // Оновити навігацію
                this.updateNavigation('main');
            }
        }
    },

    // Оновити навігацію
    updateNavigation(section) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });
    },

    // Показати адмін-панель
    showAdminPanel() {
        if (AuthSystem.isAuthenticated()) {
            // Прокрутити до адмін-панелі
            const adminSection = document.getElementById('admin-section');
            if (adminSection) {
                adminSection.scrollIntoView({ behavior: 'smooth' });
                this.handleAuthChange(true);
            }
        }
    },

    // Налаштування дій адмін-панелі
    setupAdminActions() {
        // Керування категоріями
        const manageCategoriesBtn = document.getElementById('admin-manage-categories');
        if (manageCategoriesBtn) {
            manageCategoriesBtn.addEventListener('click', () => {
                UIManager.showCategoriesModal();
            });
        }
        
        // Додавання моделі
        const addModelBtn = document.getElementById('admin-add-model');
        if (addModelBtn) {
            addModelBtn.addEventListener('click', () => {
                Utils.showNotification('Функція додавання моделей скоро буде доступна', 'info');
            });
        }
        
        // Резервна копія
        const backupBtn = document.getElementById('admin-backup-data');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                Utils.showNotification('Функція резервного копіювання скоро буде доступна', 'info');
            });
        }
        
        // Зміна пароля
        const changePasswordBtn = document.getElementById('admin-change-password');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                Utils.showNotification('Функція зміни пароля скоро буде доступна', 'info');
            });
        }
    }
};

export { AuthEvents };
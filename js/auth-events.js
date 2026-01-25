// js/auth-events.js
import { AuthSystem } from './auth.js';
import { DomElements } from './dom-elements.js';
import { UIManager } from './ui.js';
import { Utils } from './utils.js';
import { StateManager } from './state.js';

// Обробники подій для адмін-панелі
const AuthEvents = {
    // Ініціалізація обробників адмін-панелі
    init() {
        console.log('Ініціалізація обробників адмін-панелі...');
        
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
        
        // Додаткові обробники для нових функцій
        this.setupAddModelModal();
        this.setupChangePasswordModal();
        this.setupBackupFunction();
    },

    // Налаштування кнопки адміна
    setupAdminButton() {
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
            adminBtn.classList.add('logged-in');
        } else {
            adminBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
            adminBtn.title = 'Вхід до адмін-панелі';
            adminBtn.classList.remove('logged-in');
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
                
                // Оновити статистику
                this.updateAdminStats();
                
                // Заповнити категорії в формі додавання моделі
                this.populateModelCategories();
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
                this.showAddModelModal();
            });
        }
        
        // Резервна копія
        const backupBtn = document.getElementById('admin-backup-data');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }
        
        // Зміна пароля
        const changePasswordBtn = document.getElementById('admin-change-password');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.showChangePasswordModal();
            });
        }
    },

    // ===== НОВІ ФУНКЦІЇ =====

    // Налаштування модального вікна додавання моделі
    setupAddModelModal() {
        const addModelModal = document.getElementById('add-model-modal');
        if (!addModelModal) return;
        
        // Закриття по кліку на фон
        addModelModal.addEventListener('click', (e) => {
            if (e.target === addModelModal) {
                this.closeAddModelModal();
            }
        });
        
        // Закриття по кнопці
        const modalClose = addModelModal.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeAddModelModal();
            });
        }
        
        // Скасування
        const cancelBtn = document.getElementById('add-model-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeAddModelModal();
            });
        }
        
        // ESC для закриття
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && addModelModal.classList.contains('show')) {
                this.closeAddModelModal();
            }
        });
        
        // Обробка відправки форми
        const submitBtn = document.getElementById('add-model-submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddModel();
            });
        }
    },

    // Показати модальне вікно додавання моделі
    showAddModelModal() {
        const modal = document.getElementById('add-model-modal');
        if (modal) {
            // Очистити форму
            this.resetAddModelForm();
            
            // Заповнити категорії
            this.populateModelCategories();
            
            modal.classList.add('show');
            
            // Фокус на першому полі
            setTimeout(() => {
                const titleInput = document.getElementById('model-title');
                if (titleInput) {
                    titleInput.focus();
                }
            }, 100);
        }
    },

    // Закрити модальне вікно додавання моделі
    closeAddModelModal() {
        const modal = document.getElementById('add-model-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    },

    // Скинути форму додавання моделі
    resetAddModelForm() {
        const formElements = [
            'model-title', 'model-author', 'model-image', 'model-category',
            'model-description', 'model-print-time', 'model-weight',
            'model-difficulty', 'model-tags', 'model-formats', 'model-dimensions'
        ];
        
        formElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        
        const featuredCheckbox = document.getElementById('model-featured');
        const newCheckbox = document.getElementById('model-new');
        if (featuredCheckbox) featuredCheckbox.checked = false;
        if (newCheckbox) newCheckbox.checked = false;
        
        const errorElement = document.getElementById('add-model-error');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    },

    // Заповнити категорії в формі додавання моделі
    populateModelCategories() {
        const categorySelect = document.getElementById('model-category');
        if (!categorySelect) return;
        
        const state = StateManager.getState();
        const categories = state.categories.filter(cat => cat.id !== 'all');
        
        // Очистити опції, залишивши тільки першу
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // Додати категорії
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    },

    // Обробка додавання нової моделі
    handleAddModel() {
        // Зібрати дані з форми
        const title = document.getElementById('model-title').value.trim();
        const author = document.getElementById('model-author').value.trim();
        const image = document.getElementById('model-image').value.trim();
        const category = document.getElementById('model-category').value;
        const description = document.getElementById('model-description').value.trim();
        const printTime = document.getElementById('model-print-time').value.trim();
        const weight = document.getElementById('model-weight').value.trim();
        const difficulty = document.getElementById('model-difficulty').value;
        const tags = document.getElementById('model-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const formats = document.getElementById('model-formats').value.split(',').map(f => f.trim()).filter(f => f);
        const dimensions = document.getElementById('model-dimensions').value.trim();
        const featured = document.getElementById('model-featured').checked;
        const isNew = document.getElementById('model-new').checked;
        
        // Валідація
        const errorElement = document.getElementById('add-model-error');
        if (!title || !author || !image || !category || !description || 
            !printTime || !weight || !difficulty || tags.length === 0 || formats.length === 0) {
            this.showAddModelError('Будь ласка, заповніть всі обов\'язкові поля (позначені *)');
            return;
        }
        
        // ФІКС: Правильна валідація URL
        if (!image.startsWith('http://') && !image.startsWith('https://')) {
            this.showAddModelError('Будь ласка, введіть коректний URL зображення (має починатися з http:// або https://)');
            return;
        }
        
        // Створити нову модель
        const newModel = {
            id: Date.now().toString(),
            title,
            author,
            image,
            description,
            printTime,
            weight,
            difficulty,
            downloads: "0",
            dimensions: dimensions || "Не вказано",
            formats,
            tags,
            featured,
            isNew
        };
        
        // Додати модель до стану
        const state = StateManager.getState();
        state.models.push(newModel);
        
        // Зберегти моделі в localStorage
        try {
            localStorage.setItem('models_data', JSON.stringify(state.models));
        } catch (error) {
            console.error('Помилка збереження моделей:', error);
            this.showAddModelError('Помилка збереження моделі');
            return;
        }
        
        // Закрити модальне вікно
        this.closeAddModelModal();
        
        // Показати повідомлення про успіх
        Utils.showNotification(`Модель "${title}" успішно додана!`);
        
        // Оновити статистику
        this.updateAdminStats();
        
        // Якщо користувач не в адмін-панелі, переключитися на головну
        if (state.currentSection !== 'admin') {
            StateManager.setCurrentSection('main');
            UIManager.toggleSections('main');
            UIManager.updateNavigation('main');
        }
    },

    // Показати помилку в формі додавання моделі
    showAddModelError(message) {
        const errorElement = document.getElementById('add-model-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Анімація помилки
            errorElement.style.animation = 'none';
            setTimeout(() => {
                errorElement.style.animation = 'shake 0.5s';
            }, 10);
        }
    },

    // Налаштування модального вікна зміни пароля
    setupChangePasswordModal() {
        const changePasswordModal = document.getElementById('change-password-modal');
        if (!changePasswordModal) return;
        
        // Закриття по кліку на фон
        changePasswordModal.addEventListener('click', (e) => {
            if (e.target === changePasswordModal) {
                this.closeChangePasswordModal();
            }
        });
        
        // Закриття по кнопці
        const modalClose = changePasswordModal.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeChangePasswordModal();
            });
        }
        
        // Скасування
        const cancelBtn = document.getElementById('change-password-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeChangePasswordModal();
            });
        }
        
        // ESC для закриття
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && changePasswordModal.classList.contains('show')) {
                this.closeChangePasswordModal();
            }
        });
        
        // Обробка відправки форми
        const submitBtn = document.getElementById('change-password-submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleChangePassword();
            });
        }
    },

    // Показати модальне вікно зміни пароля
    showChangePasswordModal() {
        const modal = document.getElementById('change-password-modal');
        if (modal) {
            // Очистити форму
            this.resetChangePasswordForm();
            
            modal.classList.add('show');
            
            // Фокус на першому полі
            setTimeout(() => {
                const currentPasswordInput = document.getElementById('current-password');
                if (currentPasswordInput) {
                    currentPasswordInput.focus();
                }
            }, 100);
        }
    },

    // Закрити модальне вікно зміни пароля
    closeChangePasswordModal() {
        const modal = document.getElementById('change-password-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    },

    // Скинути форму зміни пароля
    resetChangePasswordForm() {
        const formElements = [
            'current-password', 'new-password', 'confirm-password'
        ];
        
        formElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        
        const errorElement = document.getElementById('change-password-error');
        const successElement = document.getElementById('change-password-success');
        
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
        
        if (successElement) {
            successElement.style.display = 'none';
            successElement.textContent = '';
        }
    },

    // Обробка зміни пароля
    handleChangePassword() {
        const currentPassword = document.getElementById('current-password').value.trim();
        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        
        const errorElement = document.getElementById('change-password-error');
        const successElement = document.getElementById('change-password-success');
        
        // Валідація
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showChangePasswordError('Будь ласка, заповніть всі поля');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showChangePasswordError('Новий пароль повинен містити мінімум 6 символів');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showChangePasswordError('Нові паролі не співпадають');
            return;
        }
        
        // Спробувати змінити пароль
        const result = AuthSystem.changePassword(currentPassword, newPassword);
        
        if (result.success) {
            // Показати повідомлення про успіх
            if (successElement) {
                successElement.textContent = 'Пароль успішно змінено!';
                successElement.style.display = 'block';
                
                // Скинути помилку
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                
                // Очистити форму через 2 секунди
                setTimeout(() => {
                    this.closeChangePasswordModal();
                }, 2000);
            }
        } else {
            this.showChangePasswordError(result.message);
        }
    },

    // Показати помилку в формі зміни пароля
    showChangePasswordError(message) {
        const errorElement = document.getElementById('change-password-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Анімація помилки
            errorElement.style.animation = 'none';
            setTimeout(() => {
                errorElement.style.animation = 'shake 0.5s';
            }, 10);
        }
    },

    // Налаштування функції резервного копіювання
    setupBackupFunction() {
        // Функція вже налаштована в setupAdminActions()
    },

    // Створити резервну копію
    createBackup() {
        const state = StateManager.getState();
        
        // Створити об'єкт з даними для резервної копії
        const backupData = {
            timestamp: new Date().toISOString(),
            models: state.models,
            categories: state.categories.filter(cat => cat.id !== 'all'),
            favorites: state.favorites,
            adminHash: localStorage.getItem('admin_password_hash')
        };
        
        // Конвертувати в JSON
        const jsonData = JSON.stringify(backupData, null, 2);
        
        // Створити Blob
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        // Створити URL для завантаження
        const url = URL.createObjectURL(blob);
        
        // Створити посилання для завантаження
        const a = document.createElement('a');
        a.href = url;
        a.download = `3dprint_gallery_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Очистити
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        // Показати повідомлення
        Utils.showNotification('Резервна копія успішно створена та завантажена');
    },

    // Оновити статистику адмін-панелі
    updateAdminStats() {
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
    }
};

export { AuthEvents };
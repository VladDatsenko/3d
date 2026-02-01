// js/auth-events.js
import { AuthSystem } from './auth.js';
import { DomElements } from './dom-elements.js';
import { UIManager } from './ui.js';
import { Utils } from './utils.js';
import { StateManager } from './state.js';
import { CategoriesManager } from './categories.js';
import { ModelsManager } from './models.js';

// Обробники подій для адмін-панелі
const AuthEvents = {
    // Змінна для відстеження моделі, яку редагуємо
    editingModelId: null,
    
    // Ініціалізація системи
    init() {
        console.log('Ініціалізація обробників адмін-панелі...');
        
        this.setupAdminButton();
        this.setupLoginForm();
        this.setupResetForm();
        this.setupAuthModal();
        this.setupAdminActions();
        this.setupCategoriesModalEvents();
        this.setupModelFormHandlers();
        
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

    // Налаштування обробників для форми моделі
    setupModelFormHandlers() {
        const addModelModal = document.getElementById('add-model-modal');
        if (!addModelModal) return;
        
        // Слухач для закриття модального вікна
        addModelModal.addEventListener('click', (e) => {
            if (e.target === addModelModal) {
                this.closeAddModelModal();
                this.resetEditModelForm();
            }
        });
        
        // Слухач для кнопки закриття
        const modalClose = addModelModal.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeAddModelModal();
                this.resetEditModelForm();
            });
        }
        
        // Слухач для кнопки скасування
        const cancelBtn = document.getElementById('add-model-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeAddModelModal();
                this.resetEditModelForm();
            });
        }
        
        // ESC для закриття
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && addModelModal.classList.contains('show')) {
                this.closeAddModelModal();
                this.resetEditModelForm();
            }
        });
        
        // Обробка відправки форми
        const submitBtn = document.getElementById('add-model-submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSaveModel();
            });
        }
    },

    // Обробка збереження моделі (додавання або редагування)
    handleSaveModel() {
        // Перевірити, чи це редагування
        const addModelModal = document.getElementById('add-model-modal');
        const isEditing = addModelModal.hasAttribute('data-editing-model');
        const modelId = isEditing ? addModelModal.getAttribute('data-editing-model') : null;
        
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
        
        if (!image.startsWith('http')) {
            this.showAddModelError('Будь ласка, введіть коректний URL зображення');
            return;
        }
        
        // Підготувати дані моделі
        const modelData = {
            title,
            author,
            image,
            description,
            printTime,
            weight,
            difficulty,
            dimensions: dimensions || "Не вказано",
            formats,
            tags,
            featured,
            isNew
        };
        
        let resultModel;
        
        if (isEditing && modelId) {
            // Редагування існуючої моделі
            resultModel = ModelsManager.updateModel(modelId, modelData);
            if (resultModel) {
                Utils.showNotification(`Модель "${title}" успішно оновлена!`);
            } else {
                this.showAddModelError('Помилка оновлення моделі');
                return;
            }
        } else {
            // Створення нової моделі
            resultModel = ModelsManager.createNewModel(modelData);
            if (resultModel) {
                Utils.showNotification(`Модель "${title}" успішно додана!`);
            } else {
                this.showAddModelError('Помилка додавання моделі');
                return;
            }
        }
        
        // Закрити модальне вікно
        this.closeAddModelModal();
        this.resetEditModelForm();
        
        // Оновити статистику
        this.updateAdminStats();
        
        // Оновити відображення моделей
        const state = StateManager.getState();
        if (state.currentSection === 'admin') {
            // Якщо ми в адмін-панелі, оновити статистику
            this.updateAdminStats();
        } else {
            // Якщо на головній, оновити відображення
            UIManager.renderModels();
        }
    },

    // Скинути форму редагування моделі
    resetEditModelForm() {
        this.editingModelId = null;
        const addModelModal = document.getElementById('add-model-modal');
        if (addModelModal) {
            addModelModal.removeAttribute('data-editing-model');
            
            // Відновити оригінальний заголовок
            const modalTitle = addModelModal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Додати нову модель';
            }
            
            // Відновити текст кнопки
            const submitBtn = document.getElementById('add-model-submit-btn');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Додати модель';
            }
        }
        
        // Очистити форму
        this.resetAddModelForm();
    },

    // Налаштування обробників для модального вікна керування категоріями
    setupCategoriesModalEvents() {
        console.log('Налаштування обробників для модального вікна категорій...');
        
        // Кнопка "Додати категорію"
        if (DomElements.addCategoryBtn) {
            DomElements.addCategoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Додати категорію натиснуто');
                CategoriesManager.addNewCategory();
                this.setupCategoryInputListeners();
            });
        }
        
        // Кнопка "Зберегти зміни"
        if (DomElements.saveCategoriesBtn) {
            DomElements.saveCategoriesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Зберегти зміни натиснуто');
                if (CategoriesManager.saveCategoriesFromEditor()) {
                    UIManager.closeCategoriesModal();
                    UIManager.renderCategories();
                }
            });
        }
        
        // Кнопка "Відновити стандартні"
        if (DomElements.restoreDefaultCategoriesBtn) {
            DomElements.restoreDefaultCategoriesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Відновити стандартні натиснуто');
                if (CategoriesManager.restoreDefaultCategories()) {
                    CategoriesManager.renderCategoriesEditor();
                    this.setupCategoryInputListeners();
                }
            });
        }
        
        // Додаємо делегування подій для контейнера
        if (DomElements.categoriesListContainer) {
            DomElements.categoriesListContainer.addEventListener('click', (e) => {
                this.handleCategoryEditorClick(e);
            });
        }
        
        // Додаємо обробники для полів введення
        this.setupCategoryInputListeners();
    },
    
    // Налаштування обробників для полів введення категорій
    setupCategoryInputListeners() {
        console.log('Налаштування обробників для полів категорій...');
        
        // Поля введення для оновлення категорій в реальному часі
        const nameInputs = document.querySelectorAll('.category-name-input');
        nameInputs.forEach(input => {
            input.addEventListener('input', this.handleCategoryInputChange.bind(this));
        });
        
        const colorInputs = document.querySelectorAll('.category-color-input');
        colorInputs.forEach(input => {
            input.addEventListener('input', this.handleCategoryInputChange.bind(this));
        });
        
        const tagInputs = document.querySelectorAll('.category-tags-input');
        tagInputs.forEach(input => {
            input.addEventListener('input', this.handleCategoryInputChange.bind(this));
        });
        
        const iconSelects = document.querySelectorAll('.category-icon-select');
        iconSelects.forEach(select => {
            select.addEventListener('change', this.handleCategoryInputChange.bind(this));
        });
    },
    
    // Обробник кліку для редактора категорій (делегування)
    handleCategoryEditorClick(e) {
        const target = e.target;
        const toggleLockBtn = target.closest('.toggle-lock-btn');
        const deleteCategoryBtn = target.closest('.delete-category-btn');
        
        if (toggleLockBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.handleToggleLock.call(this, toggleLockBtn);
        }
        
        if (deleteCategoryBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.handleDeleteCategory.call(this, deleteCategoryBtn);
        }
    },
    
    // Обробник перемикання блокування категорії
    handleToggleLock(button) {
        const categoryId = button.dataset.id;
        
        if (categoryId) {
            console.log('Перемикання блокування для категорії:', categoryId);
            CategoriesManager.toggleCategoryLock(categoryId);
            
            // Після зміни стану, додаємо нові обробники
            this.setupCategoryInputListeners();
        }
    },
    
    // Обробник видалення категорії
    handleDeleteCategory(button) {
        const categoryId = button.dataset.id;
        
        if (categoryId) {
            console.log('Видалення категорії:', categoryId);
            
            // Знаходимо назву категорії для повідомлення
            const category = StateManager.findCategory(categoryId);
            const categoryName = category ? category.name : 'цієї категорії';
            
            if (confirm(`Ви впевнені, що хочете видалити категорію "${categoryName}"?`)) {
                if (CategoriesManager.deleteCategory(categoryId)) {
                    // Оновлюємо інтерфейс
                    setTimeout(() => {
                        CategoriesManager.renderCategoriesEditor();
                        this.setupCategoryInputListeners();
                    }, 50);
                }
            }
        }
    },
    
    // Обробник зміни в полях категорії
    handleCategoryInputChange(e) {
        const input = e.target;
        const categoryId = input.dataset.id;
        
        if (!categoryId) return;
        
        const category = StateManager.findCategory(categoryId);
        if (!category) return;
        
        // Оновлюємо значення в залежності від типу поля
        if (input.classList.contains('category-name-input')) {
            category.name = input.value.trim();
        } else if (input.classList.contains('category-color-input')) {
            category.color = input.value;
        } else if (input.classList.contains('category-tags-input')) {
            category.tags = input.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (input.classList.contains('category-icon-select')) {
            category.icon = input.value;
        }
        
        // Оновлюємо перегляд іконки в реальному часі
        if (input.classList.contains('category-icon-select')) {
            const iconPreview = input.closest('.category-edit-item').querySelector('.icon-preview i');
            if (iconPreview) {
                iconPreview.className = `fas ${input.value}`;
            }
        }
    },

    // Налаштування кнопки адміна (тепер вхід/вихід)
    setupAdminButton() {
        this.updateAdminButton();
    },

    // Оновити вигляд кнопки адміна
    updateAdminButton() {
        const adminBtn = document.querySelector('.admin-categories-btn');
        if (!adminBtn) return;
        
        const isAuthenticated = AuthSystem.isAuthenticated();
        
        if (isAuthenticated) {
            adminBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            adminBtn.title = 'Вийти з адмін-панелі';
            adminBtn.classList.add('logged-in');
        } else {
            adminBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
            adminBtn.title = 'Вхід до адмін  панелі';
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
            document.body.classList.add('modal-open');
            
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
            document.body.classList.remove('modal-open');
            
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

    // Показати помилку входу (в формі, не глобально)
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
            this.showAuthModal();
        } else {
            this.showResetError(result.message);
        }
    },

    // Показати помилку скидання пароля (в формі, не глобально)
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

    // Обробка зміни стану автентифікації
    handleAuthChange(isAuthenticated) {
        this.updateAdminButton();
        this.updateLoginAttemptsInfo();
        
        if (isAuthenticated) {
            StateManager.setCurrentSection('admin');
            UIManager.toggleSections('admin');
            this.updateNavigation('main');
            
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
            
            this.updateAdminStats();
            this.populateModelCategories();
        } else {
            StateManager.setCurrentSection('main');
            UIManager.toggleSections('main');
            this.updateNavigation('main');
            
            // Перерендерити моделі, щоб приховати кнопки адміна
            UIManager.renderModels();
            UIManager.renderFavorites();
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
                console.log('Керування категоріями натиснуто');
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

    // Налаштування модального вікна додавання моделі
    setupAddModelModal() {
        // Вже налаштовано в setupModelFormHandlers
    },

    // Показати модальне вікно додавання моделі
    showAddModelModal() {
        const modal = document.getElementById('add-model-modal');
        if (modal) {
            // Очистити форму
            this.resetAddModelForm();
            this.resetEditModelForm();
            
            // Заповнити категорії
            this.populateModelCategories();
            
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            
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
            document.body.classList.remove('modal-open');
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
        
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    },

    // Показати помилку в формі додавання моделі (в формі, не глобально)
    showAddModelError(message) {
        const errorElement = document.getElementById('add-model-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
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
        
        changePasswordModal.addEventListener('click', (e) => {
            if (e.target === changePasswordModal) {
                this.closeChangePasswordModal();
            }
        });
        
        const modalClose = changePasswordModal.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeChangePasswordModal();
            });
        }
        
        const cancelBtn = document.getElementById('change-password-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeChangePasswordModal();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && changePasswordModal.classList.contains('show')) {
                this.closeChangePasswordModal();
            }
        });
        
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
            this.resetChangePasswordForm();
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            
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
            document.body.classList.remove('modal-open');
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
        
        const result = AuthSystem.changePassword(currentPassword, newPassword);
        
        if (result.success) {
            if (successElement) {
                successElement.textContent = 'Пароль успішно змінено!';
                successElement.style.display = 'block';
                
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                
                setTimeout(() => {
                    this.closeChangePasswordModal();
                }, 2000);
            }
        } else {
            this.showChangePasswordError(result.message);
        }
    },

    // Показати помилку в формі зміни пароля (в формі, не глобально)
    showChangePasswordError(message) {
        const errorElement = document.getElementById('change-password-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
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
        
        const backupData = {
            timestamp: new Date().toISOString(),
            models: state.models,
            categories: state.categories.filter(cat => cat.id !== 'all'),
            favorites: state.favorites,
            adminHash: localStorage.getItem('admin_password_hash')
        };
        
        const jsonData = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `3dprint_gallery_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        Utils.showNotification('Резервна копія успішно створена та завантажена');
    },

    // Оновити статистику адмін-панелі
    updateAdminStats() {
        const state = StateManager.getState();
        
        const modelsCount = document.getElementById('stat-models-count');
        if (modelsCount) {
            modelsCount.textContent = state.models.length;
        }
        
        const favoritesCount = document.getElementById('stat-favorites-count');
        if (favoritesCount) {
            favoritesCount.textContent = state.favorites.length;
        }
        
        const categoriesCount = document.getElementById('stat-categories-count');
        if (categoriesCount) {
            categoriesCount.textContent = state.categories.length;
        }
        
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
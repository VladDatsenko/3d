// js/events.js
import { StateManager } from './state.js';
import { DomElements } from './dom-elements.js';
import { UIManager } from './ui.js';
import { CategoriesManager } from './categories.js';
import { ModelsManager } from './models.js';
import { Utils } from './utils.js';
import { AuthSystem } from './auth.js';
import { AuthEvents } from './auth-events.js';

// Обробники подій
const EventHandlers = {
    // Глобальні змінні
    categoryTags: {},
    contextMenu: null,
    currentContextModelId: null,
    
    // Ініціалізація обробників
    init() {
        console.log('Ініціалізація обробників подій...');
        
        // Перевірка критичних DOM елементів
        if (!DomElements.modelsContainer) {
            console.error('Критичний DOM елемент modelsContainer не знайдено');
            return;
        }
        
        // Отримати контекстне меню
        this.contextMenu = document.getElementById('context-menu');
        
        this.setupModelEventListeners();
        this.setupCategoryEventListeners();
        this.setupNavigationEventListeners();
        this.setupModalEventListeners();
        this.setupCategoryScroll();
        this.setupAdminButton();
        this.setupShareButton();
        this.setupHashRouter();
        this.setupContextMenu();
        
        console.log('Обробники подій успішно ініціалізовано');
    },

    // Налаштування контекстного меню
    setupContextMenu() {
        if (!this.contextMenu) return;
        
        // Закриття контекстного меню при кліку поза ним
        document.addEventListener('click', (e) => {
            if (this.contextMenu.classList.contains('show')) {
                this.hideContextMenu();
            }
        });
        
        // Закриття по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.contextMenu.classList.contains('show')) {
                this.hideContextMenu();
            }
        });
        
        // Обробка кліків по пунктам меню
        this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                this.handleContextMenuAction(action);
            });
        });
    },
    
    // Показати контекстне меню
    showContextMenu(x, y, modelId) {
        if (!this.contextMenu || !modelId) return;
        
        this.currentContextModelId = modelId;
        
        // Підсвітити активну картку
        const modelCard = document.querySelector(`.model-card[data-id="${modelId}"]`);
        if (modelCard) {
            modelCard.classList.add('context-menu-active');
        }
        
        // Позиціонування меню
        const menuWidth = this.contextMenu.offsetWidth;
        const menuHeight = this.contextMenu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let posX = x;
        let posY = y;
        
        // Перевірка, щоб меню не виходило за межі вікна
        if (x + menuWidth > windowWidth) {
            posX = windowWidth - menuWidth - 10;
        }
        if (y + menuHeight > windowHeight) {
            posY = windowHeight - menuHeight - 10;
        }
        
        // Показати меню
        this.contextMenu.style.left = posX + 'px';
        this.contextMenu.style.top = posY + 'px';
        this.contextMenu.classList.add('show');
    },
    
    // Приховати контекстне меню
    hideContextMenu() {
        if (!this.contextMenu) return;
        
        this.contextMenu.classList.remove('show');
        
        // Зняти підсвітлення з картки
        if (this.currentContextModelId) {
            const modelCard = document.querySelector(`.model-card[data-id="${this.currentContextModelId}"]`);
            if (modelCard) {
                modelCard.classList.remove('context-menu-active');
            }
            this.currentContextModelId = null;
        }
    },
    
    // Обробка дій контекстного меню
    handleContextMenuAction(action) {
        if (!this.currentContextModelId) return;
        
        const modelId = this.currentContextModelId;
        const shareUrl = `${window.location.origin}${window.location.pathname}#model-${modelId}`;
        
        switch (action) {
            case 'open-new-tab':
                // Відкрити в новій вкладці
                window.open(shareUrl, '_blank');
                Utils.showNotification('Модель відкрита в новій вкладці');
                break;
                
            case 'copy-link':
                // Копіювати посилання
                navigator.clipboard.writeText(shareUrl)
                    .then(() => {
                        Utils.showNotification('Посилання скопійовано в буфер обміну');
                    })
                    .catch(() => {
                        // Fallback для старих браузерів
                        const textArea = document.createElement('textarea');
                        textArea.value = shareUrl;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        textArea.style.top = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        
                        try {
                            document.execCommand('copy');
                            Utils.showNotification('Посилання скопійовано в буфер обміну');
                        } catch (err) {
                            Utils.showNotification('Помилка копіювання. Скопіюйте посилання вручну.', 'error');
                        }
                        
                        document.body.removeChild(textArea);
                    });
                break;
                
            case 'open-modal':
                // Відкрити у модальному вікні
                UIManager.showModelModal(modelId);
                this.attachModalEventListeners(modelId);
                break;
        }
        
        this.hideContextMenu();
    },

    // Налаштування кнопки адміна (тепер вхід/вихід в одній кнопці)
    setupAdminButton() {
        if (DomElements.adminCategoriesBtn) {
            // Оновлюємо іконку кнопки
            AuthEvents.updateAdminButton();
            
            // Додаємо обробник кліку
            DomElements.adminCategoriesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (AuthSystem.isAuthenticated()) {
                    // Якщо адмін - виконуємо вихід
                    AuthSystem.logout();
                    // Кнопка оновиться через подію authChange
                } else {
                    // Якщо не адмін - показуємо модалку авторизації
                    AuthEvents.showAuthModal();
                }
            });
            
            // Слухаємо зміни стану автентифікації
            document.addEventListener('authChange', () => {
                AuthEvents.updateAdminButton();
            });
        }
    },

    // Налаштування обробників для моделей
    setupModelEventListeners() {
        // Делегування подій для контейнера моделей
        if (DomElements.modelsContainer) {
            DomElements.modelsContainer.addEventListener('click', (e) => {
                this.handleModelCardClick(e, 'models');
            });
            
            // Додаємо обробник ПРАВОЇ кнопки миші для контекстного меню
            DomElements.modelsContainer.addEventListener('contextmenu', (e) => {
                this.handleModelCardRightClick(e, 'models');
            });
        }
        
        // Делегування подій для контейнера обраних
        if (DomElements.favoritesContainer) {
            DomElements.favoritesContainer.addEventListener('click', (e) => {
                this.handleModelCardClick(e, 'favorites');
            });
            
            // Додаємо обробник ПРАВОЇ кнопки миші для обраного
            DomElements.favoritesContainer.addEventListener('contextmenu', (e) => {
                this.handleModelCardRightClick(e, 'favorites');
            });
        }
        
        // Кнопка "Завантажити ще"
        if (DomElements.loadMoreBtn) {
            DomElements.loadMoreBtn.addEventListener('click', () => {
                StateManager.incrementDisplayedCount();
                UIManager.renderModels();
            });
        }
        
        // Пошук
        if (DomElements.searchInput) {
            DomElements.searchInput.addEventListener('input', Utils.debounce(() => {
                const query = DomElements.searchInput.value.trim();
                ModelsManager.applyFilters(query, this.categoryTags);
                UIManager.renderModels();
            }));
        }
        
        // Фільтри
        if (DomElements.filterButtons && DomElements.filterButtons.length > 0) {
            DomElements.filterButtons.forEach(btn => {
                if (btn && btn.dataset && btn.dataset.filter) {
                    btn.addEventListener('click', () => {
                        const filter = btn.dataset.filter;
                        StateManager.setCurrentFilter(filter);
                        UIManager.updateFilterButtons(filter);
                        ModelsManager.applyFilters('', this.categoryTags);
                        UIManager.renderModels();
                    });
                }
            });
        }
    },

    // Обробник ПРАВОГО кліку по картці моделі (контекстне меню)
    handleModelCardRightClick(e, containerType) {
        e.preventDefault(); // Блокуємо стандартне контекстне меню
        
        const target = e.target;
        const modelCard = target.closest('.model-card');
        
        if (modelCard) {
            const modelId = modelCard.dataset.id;
            if (modelId) {
                // Показуємо контекстне меню
                this.showContextMenu(e.clientX, e.clientY, modelId);
                
                // Запобігаємо подальшій обробці
                e.stopPropagation();
                return false;
            }
        }
        
        // Якщо клік не по картці моделі - приховуємо меню
        this.hideContextMenu();
    },

    // Обробник ЛІВОГО кліку по картці моделі
    handleModelCardClick(e, containerType) {
        // Спочатку перевіряємо, чи це не клік по контекстному меню
        if (e.target.closest('#context-menu')) {
            return;
        }
        
        // Приховуємо контекстне меню при лівому кліку
        if (this.contextMenu && this.contextMenu.classList.contains('show')) {
            this.hideContextMenu();
            return;
        }
        
        const target = e.target;
        const favoriteBtn = target.closest('.favorite-btn');
        const detailsBtn = target.closest('.view-details');
        const downloadBtn = target.closest('.download-btn');
        const editBtn = target.closest('.edit-model-btn');
        const deleteBtn = target.closest('.delete-model-btn');
        const modelCard = target.closest('.model-card');
        
        // Кнопка "Улюблене"
        if (favoriteBtn) {
            e.stopPropagation();
            const modelId = favoriteBtn.dataset.id;
            if (modelId) {
                this.handleFavoriteClick(modelId, favoriteBtn, containerType);
            }
            return;
        }
        
        // Кнопка "Детальніше"
        if (detailsBtn) {
            e.stopPropagation();
            const modelId = detailsBtn.dataset.id;
            if (modelId) {
                UIManager.showModelModal(modelId);
                this.attachModalEventListeners(modelId);
            }
            return;
        }
        
        // Кнопка "Завантаження"
        if (downloadBtn) {
            e.stopPropagation();
            const modelId = downloadBtn.dataset.id;
            if (modelId) {
                ModelsManager.downloadModel(modelId);
                UIManager.renderModels(); // Оновити відображення
            }
            return;
        }
        
        // Кнопка "Редагувати" (тільки для адміна)
        if (editBtn) {
            e.stopPropagation();
            e.preventDefault();
            const modelId = editBtn.dataset.id;
            if (modelId && AuthSystem.isAuthenticated()) {
                this.handleEditModel(modelId);
            }
            return;
        }
        
        // Кнопка "Видалити" (тільки для адміна)
        if (deleteBtn) {
            e.stopPropagation();
            e.preventDefault();
            const modelId = deleteBtn.dataset.id;
            if (modelId && AuthSystem.isAuthenticated()) {
                this.handleDeleteModel(modelId, containerType);
            }
            return;
        }
        
        // ЛІВИЙ клік по картці моделі
        if (modelCard && !favoriteBtn && !detailsBtn && !downloadBtn && !editBtn && !deleteBtn) {
            const modelId = modelCard.dataset.id;
            if (modelId) {
                UIManager.showModelModal(modelId);
                this.attachModalEventListeners(modelId);
            }
        }
    },

    // Обробник редагування моделі
    handleEditModel(modelId) {
        console.log('Редагування моделі:', modelId);
        
        // Отримати модель
        const model = StateManager.findModel(modelId);
        if (!model) {
            Utils.showNotification('Модель не знайдена', 'error');
            return;
        }
        
        // Показати форму редагування
        this.showEditModelModal(model);
    },

    // Показати модальне вікно редагування моделі
    showEditModelModal(model) {
        // Отримати форму додавання моделі
        const modal = document.getElementById('add-model-modal');
        if (!modal) return;
        
        // Отримати категорію моделі
        const categoryId = ModelsManager.getModelCategory(model);
        
        // Заповнити форму даними моделі
        document.getElementById('model-title').value = model.title;
        document.getElementById('model-author').value = model.author;
        document.getElementById('model-image').value = model.image;
        document.getElementById('model-description').value = model.description;
        document.getElementById('model-print-time').value = model.printTime;
        document.getElementById('model-weight').value = model.weight;
        document.getElementById('model-difficulty').value = model.difficulty;
        document.getElementById('model-tags').value = model.tags.join(', ');
        document.getElementById('model-formats').value = model.formats.join(', ');
        document.getElementById('model-dimensions').value = model.dimensions;
        document.getElementById('model-featured').checked = model.featured || false;
        document.getElementById('model-new').checked = model.isNew || false;
        
        // Заповнити категорії в селекті
        const state = StateManager.getState();
        const categories = state.categories.filter(cat => cat.id !== 'all');
        const categorySelect = document.getElementById('model-category');
        
        // Очистити опції
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // Додати категорії
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (category.id === categoryId) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
        
        // Змінити заголовок форми
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Редагувати модель';
        }
        
        // Змінити текст кнопки
        const submitBtn = document.getElementById('add-model-submit-btn');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Зберегти зміни';
        }
        
        // Додати атрибут для ідентифікації редагування
        modal.setAttribute('data-editing-model', model.id);
        
        // Показати модальне вікно
        modal.classList.add('show');
        
        // Фокус на першому полі
        setTimeout(() => {
            const titleInput = document.getElementById('model-title');
            if (titleInput) {
                titleInput.focus();
            }
        }, 100);
    },

    // Обробник видалення моделі
    handleDeleteModel(modelId, containerType) {
        console.log('Видалення моделі:', modelId);
        
        if (ModelsManager.deleteModel(modelId)) {
            // Оновити UI в залежності від того, де ми знаходимось
            UIManager.renderModels();
            UIManager.updateFavoritesCounter();
            
            // Якщо ми на сторінці обраних, перемалювати
            if (containerType === 'favorites' || StateManager.getState().currentSection === 'favorites') {
                UIManager.renderFavorites();
            }
            
            // Оновити статистику адмін-панелі
            if (AuthSystem.isAuthenticated()) {
                AuthEvents.updateAdminStats();
            }
            
            // Закрити модальне вікно, якщо воно відкрите для цієї моделі
            const modelModal = document.getElementById('model-modal');
            if (modelModal && modelModal.classList.contains('show')) {
                const modalModelId = modelModal.querySelector('.download-btn')?.dataset.id;
                if (modalModelId === modelId) {
                    UIManager.closeModelModal();
                }
            }
            
            // Закрити контекстне меню, якщо воно відкрите
            this.hideContextMenu();
        }
    },

    // Налаштування обробників для категорій
    setupCategoryEventListeners() {
        // Делегування подій для контейнера категорій
        if (DomElements.categoriesScrollbar) {
            DomElements.categoriesScrollbar.addEventListener('click', (e) => {
                const categoryBtn = e.target.closest('.category-btn');
                if (categoryBtn && categoryBtn.dataset.category) {
                    const categoryId = categoryBtn.dataset.category;
                    StateManager.setCurrentCategory(categoryId);
                    UIManager.updateCategoryButtons(categoryId);
                    ModelsManager.applyFilters('', this.categoryTags);
                    UIManager.renderModels();
                }
            });
        }
    },

    // Налаштування навігації
    setupNavigationEventListeners() {
        // Головна сторінка
        if (DomElements.mainLink) {
            DomElements.mainLink.addEventListener('click', (e) => {
                e.preventDefault();
                UIManager.resetToMainPage();
            });
        }
        
        // Сторінка моделей
        if (DomElements.modelsLink) {
            DomElements.modelsLink.addEventListener('click', (e) => {
                e.preventDefault();
                const state = StateManager.getState();
                if (state.currentSection === 'favorites') {
                    StateManager.setCurrentSection('main');
                    UIManager.toggleSections('main');
                    UIManager.updateNavigation('models');
                } else {
                    const modelsSection = document.getElementById('models');
                    if (modelsSection) {
                        modelsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    UIManager.updateNavigation('models');
                }
            });
        }
        
        // Сторінка обраного
        if (DomElements.favoritesLink) {
            DomElements.favoritesLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                StateManager.setCurrentSection('favorites');
                UIManager.toggleSections('favorites');
                UIManager.updateNavigation('favorites');
                UIManager.updateFavoritesCounter();
            });
        }
        
        // Очищення обраного
        if (DomElements.clearFavoritesBtn) {
            DomElements.clearFavoritesBtn.addEventListener('click', () => {
                const confirmDelete = confirm('Видалити всі моделі з обраного?');
                if (confirmDelete) {
                    StateManager.clearFavorites();
                    UIManager.updateFavoritesCounter();
                    UIManager.renderFavorites();
                    Utils.showNotification('Всі моделі видалені з обраного');
                }
            });
        }
    },

    // Налаштування модальних вікон
    setupModalEventListeners() {
        // Закриття модального вікна моделі
        if (DomElements.modelModal) {
            // Клік на фон
            DomElements.modelModal.addEventListener('click', (e) => {
                if (e.target === DomElements.modelModal) {
                    UIManager.closeModelModal();
                }
            });
            
            // Клік на хрестик
            const modelModalClose = DomElements.modelModal.querySelector('.modal-close');
            if (modelModalClose) {
                modelModalClose.addEventListener('click', () => {
                    UIManager.closeModelModal();
                });
            }
        }
        
        // Закриття модального вікна категорій
        if (DomElements.categoriesModal) {
            // Клік на фон
            DomElements.categoriesModal.addEventListener('click', (e) => {
                if (e.target === DomElements.categoriesModal) {
                    UIManager.closeCategoriesModal();
                }
            });
            
            // Клік на хрестик
            const categoriesModalClose = DomElements.categoriesModal.querySelector('.modal-close');
            if (categoriesModalClose) {
                categoriesModalClose.addEventListener('click', () => {
                    UIManager.closeCategoriesModal();
                });
            }
        }
        
        // Закриття модального вікна авторизації
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            // Клік на фон
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    authModal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                }
            });
            
            // Клік на хрестик
            const authModalClose = authModal.querySelector('.modal-close');
            if (authModalClose) {
                authModalClose.addEventListener('click', () => {
                    authModal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                });
            }
        }
        
        // Закриття модального вікна додавання/редагування моделі
        const addModelModal = document.getElementById('add-model-modal');
        if (addModelModal) {
            addModelModal.addEventListener('click', (e) => {
                if (e.target === addModelModal) {
                    addModelModal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                    this.resetEditModelForm();
                }
            });
            
            const addModalClose = addModelModal.querySelector('.modal-close');
            if (addModalClose) {
                addModalClose.addEventListener('click', () => {
                    addModelModal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                    this.resetEditModelForm();
                });
            }
        }
        
        // Закриття модального вікна зміни пароля
        const changePasswordModal = document.getElementById('change-password-modal');
        if (changePasswordModal) {
            changePasswordModal.addEventListener('click', (e) => {
                if (e.target === changePasswordModal) {
                    changePasswordModal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                }
            });
            
            const changePasswordClose = changePasswordModal.querySelector('.modal-close');
            if (changePasswordClose) {
                changePasswordClose.addEventListener('click', () => {
                    changePasswordModal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                });
            }
        }
        
        // Глобальне закриття по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Закрити модальне вікно моделі
                if (DomElements.modelModal && DomElements.modelModal.classList.contains('show')) {
                    UIManager.closeModelModal();
                }
                
                // Закрити модальне вікно категорій
                if (DomElements.categoriesModal && DomElements.categoriesModal.classList.contains('show')) {
                    UIManager.closeCategoriesModal();
                }
                
                // Закрити модальне вікно авторизації
                const authModal = document.getElementById('auth-modal');
                if (authModal && authModal.classList.contains('show')) {
                    authModal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                }
                
                // Закрити модальне вікно додавання/редагування моделі
                const addModelModal = document.getElementById('add-model-modal');
                if (addModelModal && addModelModal.classList.contains('show')) {
                    addModelModal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                    this.resetEditModelForm();
                }
                
                // Закрити модальне вікно зміни пароля
                const changePasswordModal = document.getElementById('change-password-modal');
                if (changePasswordModal && changePasswordModal.classList.contains('show')) {
                    changePasswordModal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                }
                
                // Закрити контекстне меню
                if (this.contextMenu && this.contextMenu.classList.contains('show')) {
                    this.hideContextMenu();
                }
            }
        });
    },

    // Скинути форму редагування моделі
    resetEditModelForm() {
        const addModelModal = document.getElementById('add-model-modal');
        if (addModelModal) {
            addModelModal.removeAttribute('data-editing-model');
            
            const modalTitle = addModelModal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Додати нову модель';
            }
            
            const submitBtn = document.getElementById('add-model-submit-btn');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Додати модель';
            }
        }
        
        // Викликати оригінальний скид форми
        AuthEvents.resetAddModelForm();
    },

    // Налаштування прокрутки категорій
    setupCategoryScroll() {
        if (DomElements.scrollLeftBtn && DomElements.scrollRightBtn && DomElements.categoriesScrollbar) {
            DomElements.scrollLeftBtn.addEventListener('click', () => {
                DomElements.categoriesScrollbar.scrollBy({ left: -200, behavior: 'smooth' });
            });
            
            DomElements.scrollRightBtn.addEventListener('click', () => {
                DomElements.categoriesScrollbar.scrollBy({ left: 200, behavior: 'smooth' });
            });
        }
    },

    // Налаштування обробки кнопки "Поділитися"
    setupShareButton() {
        // Делегування подій для кнопки копіювання
        document.addEventListener('click', (e) => {
            if (e.target.closest('.copy-share-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const button = e.target.closest('.copy-share-btn');
                const url = button.dataset.url;
                
                // Спробувати використати Clipboard API
                navigator.clipboard.writeText(url)
                    .then(() => {
                        this.showCopySuccess(button);
                    })
                    .catch(() => {
                        // Fallback для старих браузерів
                        this.fallbackCopyToClipboard(url, button);
                    });
            }
        });
    },
    
    // Показати успішне копіювання
    showCopySuccess(button) {
        const originalHTML = button.innerHTML;
        const originalBg = button.style.background;
        
        button.innerHTML = '<i class="fas fa-check"></i> Скопійовано!';
        button.style.background = 'var(--accent-primary)';
        button.style.color = 'white';
        
        Utils.showNotification('Посилання скопійовано в буфер обміну');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = originalBg;
            button.style.color = '';
        }, 2000);
    },
    
    // Fallback для копіювання
    fallbackCopyToClipboard(text, button) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess(button);
        } catch (err) {
            console.error('Не вдалося скопіювати посилання:', err);
            Utils.showNotification('Помилка копіювання. Скопіюйте посилання вручну.', 'error');
        }
        
        document.body.removeChild(textArea);
    },

    // Налаштування hash router для відкриття моделей
    setupHashRouter() {
        // Слухач зміни hash
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
        
        // Перевірка початкового hash при завантаженні
        setTimeout(() => {
            this.handleHashChange();
        }, 100);
    },
    
    // Обробка зміни hash
    handleHashChange() {
        const hash = window.location.hash.substring(1);
        
        if (hash.startsWith('model-')) {
            const modelId = hash.substring(6);
            this.openModelFromHash(modelId);
        } else {
            // Якщо hash НЕ модель - просто закриваємо модальне вікно
            const modelModal = document.getElementById('model-modal');
            if (modelModal && modelModal.classList.contains('show')) {
                UIManager.closeModelModal();
            }
        }
    },
    
    // Відкрити модель з hash
    openModelFromHash(modelId) {
        // Перевірити, чи модель існує
        const model = StateManager.findModel(modelId);
        if (!model) {
            console.warn(`Модель з ID ${modelId} не знайдена`);
            // Видалити неправильний hash
            history.replaceState(null, '', window.location.pathname + window.location.search);
            return;
        }
        
        // Якщо ми на сторінці обраних, не змінюємо секцію
        const state = StateManager.getState();
        if (state.currentSection !== 'favorites') {
            StateManager.setCurrentSection('main');
            UIManager.toggleSections('main');
            UIManager.updateNavigation('main');
        }
        
        // Відкрити модальне вікно моделі
        UIManager.showModelModal(modelId);
    },

    // Додати обробники для модального вікна моделі
    attachModalEventListeners(modelId) {
        setTimeout(() => {
            // Кнопка завантаження в модальному вікні
            const modalDownloadBtn = DomElements.modalBody?.querySelector('.download-btn');
            if (modalDownloadBtn && modalDownloadBtn.dataset && modalDownloadBtn.dataset.id) {
                modalDownloadBtn.addEventListener('click', () => {
                    ModelsManager.downloadModel(modelId);
                    // Оновити модальне вікно, щоб показати нову кількість завантажень
                    setTimeout(() => {
                        UIManager.showModelModal(modelId);
                        this.attachModalEventListeners(modelId);
                    }, 100);
                });
            }
            
            // Кнопка "Улюблене" в модальному вікні
            const modalFavoriteBtn = DomElements.modalBody?.querySelector('.toggle-favorite');
            if (modalFavoriteBtn && modalFavoriteBtn.dataset && modalFavoriteBtn.dataset.id) {
                modalFavoriteBtn.addEventListener('click', () => {
                    const state = StateManager.getState();
                    const isCurrentlyFavorite = state.favorites.includes(modelId);
                    
                    if (isCurrentlyFavorite) {
                        StateManager.removeFromFavorites(modelId);
                        modalFavoriteBtn.innerHTML = `
                            <i class="fas fa-heart"></i> Додати в обране
                        `;
                    } else {
                        StateManager.addToFavorites(modelId);
                        modalFavoriteBtn.innerHTML = `
                            <i class="fas fa-heart"></i> Видалити з обраного
                        `;
                    }
                    
                    // Оновити лічильник та відображення обраних
                    UIManager.updateFavoritesCounter();
                    
                    // Якщо ми на сторінці обраних - перемалювати
                    if (StateManager.getState().currentSection === 'favorites') {
                        UIManager.renderFavorites();
                    }
                    
                    // Оновити кнопку на картці моделі (якщо вона видима)
                    const cardFavoriteBtn = document.querySelector(`.favorite-btn[data-id="${modelId}"]`);
                    if (cardFavoriteBtn) {
                        if (isCurrentlyFavorite) {
                            cardFavoriteBtn.classList.remove('active');
                        } else {
                            cardFavoriteBtn.classList.add('active');
                        }
                    }
                    
                    Utils.showNotification(
                        isCurrentlyFavorite ? 'Модель видалена з обраного' : 'Модель додана до обраного'
                    );
                });
            }
            
            // Кнопки адміна в модальному вікні
            const editModalBtn = DomElements.modalBody?.querySelector('.edit-model-modal-btn');
            if (editModalBtn && editModalBtn.dataset && editModalBtn.dataset.id && AuthSystem.isAuthenticated()) {
                editModalBtn.addEventListener('click', () => {
                    this.handleEditModel(modelId);
                    UIManager.closeModelModal();
                });
            }
            
            const deleteModalBtn = DomElements.modalBody?.querySelector('.delete-model-modal-btn');
            if (deleteModalBtn && deleteModalBtn.dataset && deleteModalBtn.dataset.id && AuthSystem.isAuthenticated()) {
                deleteModalBtn.addEventListener('click', () => {
                    if (confirm('Ви впевнені, що хочете видалити цю модель?')) {
                        this.handleDeleteModel(modelId, 'models');
                        UIManager.closeModelModal();
                    }
                });
            }
        }, 100);
    },

    // Обробник кліку по "Улюблене"
    handleFavoriteClick(modelId, button, containerType) {
        const state = StateManager.getState();
        const isCurrentlyFavorite = state.favorites.includes(modelId);
        
        if (isCurrentlyFavorite) {
            StateManager.removeFromFavorites(modelId);
            button.classList.remove('active');
        } else {
            StateManager.addToFavorites(modelId);
            button.classList.add('active');
        }
        
        UIManager.updateFavoritesCounter();
        
        // Якщо ми на сторінці обраних - перемалювати
        if (containerType === 'favorites' || StateManager.getState().currentSection === 'favorites') {
            UIManager.renderFavorites();
        }
        
        // Оновити кнопку в модальному вікні (якщо воно відкрите)
        const modalFavoriteBtn = DomElements.modalBody?.querySelector('.toggle-favorite');
        if (modalFavoriteBtn && modalFavoriteBtn.dataset.id === modelId) {
            modalFavoriteBtn.innerHTML = `
                <i class="fas fa-heart"></i> 
                ${isCurrentlyFavorite ? 'Додати в обране' : 'Видалити з обраного'}
            `;
        }
        
        Utils.showNotification(
            isCurrentlyFavorite ? 'Модель видалена з обраного' : 'Модель додана до обраного'
        );
    },

    // Оновити categoryTags
    setCategoryTags(tags) {
        this.categoryTags = tags || {};
    }
};

export { EventHandlers };
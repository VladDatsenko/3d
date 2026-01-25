// js/events.js
import { StateManager } from './state.js';
import { DomElements } from './dom-elements.js';
import { UIManager } from './ui.js';
import { CategoriesManager } from './categories.js';
import { ModelsManager } from './models.js';
import { Utils } from './utils.js';
import { AuthSystem } from './auth.js';

// Обробники подій
const EventHandlers = {
    // Глобальні змінні
    categoryTags: {},
    
    // Ініціалізація обробників
    init() {
        console.log('Ініціалізація обробників подій...');
        
        // Перевірка критичних DOM елементів
        if (!DomElements.modelsContainer) {
            console.error('Критичний DOM елемент modelsContainer не знайдено');
            return;
        }
        
        this.setupModelEventListeners();
        this.setupCategoryEventListeners();
        this.setupNavigationEventListeners();
        this.setupModalEventListeners();
        this.setupCategoryScroll();
        this.setupAdminButton();
        
        console.log('Обробники подій успішно ініціалізовано');
    },

    // Налаштування кнопки адміна
    setupAdminButton() {
        if (DomElements.adminCategoriesBtn) {
            // Оновлюємо іконку кнопки
            this.updateAdminButtonIcon();
            
            // Додаємо обробник кліку
            DomElements.adminCategoriesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (AuthSystem.isAuthenticated()) {
                    // Якщо адмін - переходимо до адмін-панелі
                    this.showAdminPanel();
                } else {
                    // Якщо не адмін - показуємо модалку авторизації
                    this.showAuthModal();
                }
            });
            
            // Слухаємо зміни стану автентифікації
            document.addEventListener('authChange', () => {
                this.updateAdminButtonIcon();
            });
        }
    },

    // Оновити іконку кнопки адміна
    updateAdminButtonIcon() {
        if (!DomElements.adminCategoriesBtn) return;
        
        const isAuthenticated = AuthSystem.isAuthenticated();
        
        if (isAuthenticated) {
            DomElements.adminCategoriesBtn.innerHTML = '<i class="fas fa-user-cog"></i>';
            DomElements.adminCategoriesBtn.title = 'Адмін-панель';
            DomElements.adminCategoriesBtn.classList.add('logged-in');
        } else {
            DomElements.adminCategoriesBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
            DomElements.adminCategoriesBtn.title = 'Вхід до адмін-панелі';
            DomElements.adminCategoriesBtn.classList.remove('logged-in');
        }
    },

    // Показати модальне вікно авторизації
    showAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.add('show');
        }
    },

    // Показати адмін-панель
    showAdminPanel() {
        const adminSection = document.getElementById('admin-section');
        if (adminSection) {
            adminSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Налаштування обробників для моделей
    setupModelEventListeners() {
        // Делегування подій для контейнера моделей
        if (DomElements.modelsContainer) {
            DomElements.modelsContainer.addEventListener('click', (e) => {
                this.handleModelCardClick(e, 'models');
            });
        }
        
        // Делегування подій для контейнера обраних
        if (DomElements.favoritesContainer) {
            DomElements.favoritesContainer.addEventListener('click', (e) => {
                this.handleModelCardClick(e, 'favorites');
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
                if (btn && btn.dataset.filter) {
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

    // Обробник кліку по картці моделі
    handleModelCardClick(e, containerType) {
        const target = e.target;
        const favoriteBtn = target.closest('.favorite-btn');
        const detailsBtn = target.closest('.view-details');
        const downloadBtn = target.closest('.download-btn');
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
            }
            return;
        }
        
        // Клік по картці моделі
        if (modelCard && !favoriteBtn && !detailsBtn && !downloadBtn) {
            const modelId = modelCard.dataset.id;
            if (modelId) {
                UIManager.showModelModal(modelId);
                this.attachModalEventListeners(modelId);
            }
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
                this.resetToMainPage();
                UIManager.updateNavigation('main');
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
                }
            });
            
            // Клік на хрестик
            const authModalClose = authModal.querySelector('.modal-close');
            if (authModalClose) {
                authModalClose.addEventListener('click', () => {
                    authModal.classList.remove('show');
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
                }
            }
        });
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

    // Додати обробники для модального вікна моделі
    attachModalEventListeners(modelId) {
        setTimeout(() => {
            // Кнопка завантаження в модальному вікні
            const modalDownloadBtn = DomElements.modalBody?.querySelector('.download-btn');
            if (modalDownloadBtn && modalDownloadBtn.dataset.id) {
                modalDownloadBtn.addEventListener('click', () => {
                    ModelsManager.downloadModel(modelId);
                });
            }
            
            // Кнопка "Улюблене" в модальному вікні
            const modalFavoriteBtn = DomElements.modalBody?.querySelector('.toggle-favorite');
            if (modalFavoriteBtn && modalFavoriteBtn.dataset.id) {
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

    // Скинути на головну сторінку
    resetToMainPage() {
        StateManager.resetFilters();
        UIManager.updateCategoryButtons('all');
        UIManager.updateFilterButtons('all');
        UIManager.updateNavigation('main');
        UIManager.toggleSections('main');
        
        if (DomElements.searchInput) {
            DomElements.searchInput.value = '';
        }
        
        ModelsManager.applyFilters('', this.categoryTags);
        UIManager.renderModels();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Оновити categoryTags
    setCategoryTags(tags) {
        this.categoryTags = tags || {};
    }
};

export { EventHandlers };
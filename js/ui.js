// js/ui.js
import { StateManager } from './state.js';
import { DomElements } from './dom-elements.js';
import { ModelsManager } from './models.js';
import { CategoriesManager } from './categories.js';
import { Utils } from './utils.js';
import { AVAILABLE_ICONS } from './constants.js';
import { EventHandlers } from './events.js';
import { CartManager } from './cart.js';

// Функції для оновлення UI
const UIManager = {
    // Змінна для збереження позиції скролу перед відкриттям модального вікна
    scrollPositionBeforeModal: 0,
    
    // Відобразити категорії
    renderCategories() {
        if (!DomElements.categoriesScrollbar) return;
        
        const state = StateManager.getState();
        const validCategories = state.categories.filter(category => 
            category && category.name && category.name !== 'undefined' && category.name.trim() !== ''
        );
        
        DomElements.categoriesScrollbar.innerHTML = validCategories.map(category => {
            const iconInfo = AVAILABLE_ICONS.find(icon => icon.value === category.icon) || AVAILABLE_ICONS[0];
            
            return `
            <button class="category-btn ${category.id === state.currentCategory ? 'active' : ''}" 
                    data-category="${category.id}"
                    style="--category-color: ${category.color || '#44d62c'}">
                <i class="fas ${category.icon || 'fa-cube'}"></i>
                ${category.name || 'Нова категорія'}
                ${category.isLocked ? '<i class="fas fa-lock" style="font-size: 0.7rem; margin-left: 0.25rem; opacity: 0.7;"></i>' : ''}
            </button>
            `;
        }).join('');
        
        console.log('Категорії оновлено');
    },

    // Відобразити моделі
    renderModels() {
        if (!DomElements.modelsContainer) return;
        
        const state = StateManager.getState();
        const modelsToShow = StateManager.getDisplayedModels();
        
        DomElements.modelsContainer.innerHTML = modelsToShow.map(model => 
            ModelsManager.createModelHTML(model, false) // false = не в кошику
        ).join('');
        
        this.updateLoadMoreButton();
    },

    // Відобразити обране
    renderFavorites() {
        if (!DomElements.favoritesContainer || !DomElements.favoritesEmpty) return;
        
        const state = StateManager.getState();
        const favoriteModels = StateManager.getFavoriteModels();
        
        if (favoriteModels.length === 0) {
            DomElements.favoritesEmpty.classList.remove('hidden');
            DomElements.favoritesContainer.innerHTML = '';
            return;
        }

        DomElements.favoritesEmpty.classList.add('hidden');
        DomElements.favoritesContainer.innerHTML = favoriteModels.map(model => 
            ModelsManager.createModelHTML(model, false) // false = не в кошику
        ).join('');
    },

    // Відобразити кошик
    renderCart() {
        if (!DomElements.cartContainer || !DomElements.cartEmpty) return;
        
        const cartModels = CartManager.getCartModels();
        
        if (cartModels.length === 0) {
            DomElements.cartEmpty.classList.remove('hidden');
            DomElements.cartContainer.innerHTML = '';
            return;
        }

        DomElements.cartEmpty.classList.add('hidden');
        DomElements.cartContainer.innerHTML = cartModels.map(model => 
            ModelsManager.createModelHTML(model, true) // true = в кошику
        ).join('');
    },

    // Оновити кнопку "Завантажити ще"
    updateLoadMoreButton() {
        if (!DomElements.loadMoreBtn) return;
        
        const hasMore = StateManager.hasMoreModels();
        DomElements.loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    },

    // Оновити лічильник обраного
    updateFavoritesCounter() {
        if (!DomElements.favCount) return;
        
        const state = StateManager.getState();
        DomElements.favCount.textContent = state.favorites.length;
    },

    // Оновити лічильник кошика
    updateCartCounter() {
        if (!DomElements.cartCount) return;
        
        const count = CartManager.getCartCount();
        DomElements.cartCount.textContent = count;
    },

    // Оновити активність кнопок фільтрів
    updateFilterButtons(activeFilter) {
        DomElements.filterButtons?.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === activeFilter);
        });
    },

    // Оновити активність категорій
    updateCategoryButtons(activeCategory) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === activeCategory);
        });
    },

    // Оновити активність навігації
    updateNavigation(section) {
        DomElements.navLinks?.forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    },

    // Показати/приховати секції
    toggleSections(section) {
        // Приховуємо всі секції
        if (DomElements.modelsSection) {
            DomElements.modelsSection.classList.add('hidden');
        }
        if (DomElements.favoritesSection) {
            DomElements.favoritesSection.classList.add('hidden');
        }
        if (DomElements.cartSection) {
            DomElements.cartSection.classList.add('hidden');
        }
        if (DomElements.adminSection) {
            DomElements.adminSection.classList.add('hidden');
        }

        // Показуємо потрібну
        switch(section) {
            case 'main':
                if (DomElements.modelsSection) {
                    DomElements.modelsSection.classList.remove('hidden');
                }
                break;
            case 'favorites':
                if (DomElements.favoritesSection) {
                    DomElements.favoritesSection.classList.remove('hidden');
                }
                break;
            case 'cart':
                if (DomElements.cartSection) {
                    DomElements.cartSection.classList.remove('hidden');
                }
                break;
            case 'admin':
                if (DomElements.adminSection) {
                    DomElements.adminSection.classList.remove('hidden');
                }
                break;
        }
        
        // Оновити відображення в залежності від секції
        if (section === 'favorites') {
            this.renderFavorites();
        }
        if (section === 'cart') {
            this.renderCart();
        }
    },

    // Показати модальне вікно моделі
    showModelModal(modelId) {
        const model = StateManager.findModel(modelId);
        if (!model) return;
        
        if (!DomElements.modelModal || !DomElements.modalBody) return;
        
        // Зберегти поточну позицію скролу
        this.scrollPositionBeforeModal = window.scrollY || document.documentElement.scrollTop;
        
        // Додати клас для заборони скролу сторінки
        document.body.classList.add('modal-open');
        
        // Показати модальне вікно
        DomElements.modalBody.innerHTML = ModelsManager.createModelDetailsHTML(model);
        DomElements.modelModal.classList.add('show');
        
        // Додаємо hash до URL
        window.location.hash = `model-${modelId}`;
    },

    // Закрити модальне вікно моделі
    closeModelModal() {
        if (DomElements.modelModal) {
            DomElements.modelModal.classList.remove('show');
            
            // Видалити клас для дозволу скролу сторінки
            document.body.classList.remove('modal-open');
            
            // Очищаємо hash, якщо він містить посилання на модель
            if (window.location.hash.startsWith('#model-')) {
                // Використовуємо replaceState, щоб не додавати запис в історію
                history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            
            // Відновити позицію скролу, якщо потрібно
            this.restoreScrollPosition();
        }
    },
    
    // Відновити позицію скролу після закриття модального вікна
    restoreScrollPosition() {
        const state = StateManager.getState();
        
        // Затримка для того, щоб модальне вікно повністю закрилося
        setTimeout(() => {
            // Якщо ми на сторінці обраних або кошика - нічого не робимо
            if (state.currentSection === 'favorites' || state.currentSection === 'cart') {
                return;
            }
            
            // Якщо ми на головній сторінці - відновлюємо позицію скролу
            if (state.currentSection === 'main') {
                window.scrollTo({
                    top: this.scrollPositionBeforeModal,
                    behavior: 'smooth'
                });
            }
        }, 50);
    },
    
    // Скинути на головну сторінку
    resetToMainPage() {
        // Скинути фільтри
        StateManager.resetFilters();
        
        // Оновити UI
        this.updateCategoryButtons('all');
        this.updateFilterButtons('all');
        this.updateNavigation('main');
        this.toggleSections('main');
        
        // Очистити пошук
        if (DomElements.searchInput) {
            DomElements.searchInput.value = '';
        }
        
        // Застосувати фільтри та відобразити моделі
        const categoryTags = {};
        ModelsManager.applyFilters('', categoryTags);
        this.renderModels();
        this.renderCategories();
        
        // Прокрутити до верху
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Показати модальне вікно категорій
    showCategoriesModal() {
        console.log('Відкриття модального вікна категорій');
        CategoriesManager.renderCategoriesEditor();
        if (DomElements.categoriesModal) {
            DomElements.categoriesModal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    },

    // Закрити модальне вікно категорій
    closeCategoriesModal() {
        if (DomElements.categoriesModal) {
            DomElements.categoriesModal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    },

    // Оновити тему
    updateTheme(isDark) {
        if (isDark) {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
        }
    },

    // Показати форму замовлення
    showOrderFormModal() {
        if (DomElements.orderFormModal) {
            // Скинути попередні повідомлення
            const errorEl = document.getElementById('order-form-error');
            const successEl = document.getElementById('order-form-success');
            if (errorEl) errorEl.style.display = 'none';
            if (successEl) successEl.style.display = 'none';
            
            DomElements.orderFormModal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    },

    // Закрити форму замовлення
    closeOrderFormModal() {
        if (DomElements.orderFormModal) {
            DomElements.orderFormModal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    },

    // Показати модальне вікно замовлень (для адміна)
    showOrdersModal() {
        if (DomElements.ordersModal) {
            // Тут можна завантажити список замовлень з localStorage
            const ordersList = document.getElementById('orders-list');
            if (ordersList) {
                // Поки що заглушка
                ordersList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Немає нових замовлень</p>';
            }
            DomElements.ordersModal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    },

    // Закрити модальне вікно замовлень
    closeOrdersModal() {
        if (DomElements.ordersModal) {
            DomElements.ordersModal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    }
};

export { UIManager };
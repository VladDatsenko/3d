import { StateManager } from './state.js';
import { DomElements } from './dom-elements.js';
import { Utils } from './utils.js';
import { AVAILABLE_ICONS } from './constants.js';

// Функції для управління категоріями
const CategoriesManager = {
    // Налаштування міток категорій для фільтрації
    setupCategoryTags(categories) {
        const categoryTags = {};
        categories.forEach(category => {
            if (category.tags && category.tags.length > 0 && category.id !== 'all') {
                categoryTags[category.id] = category.tags;
            }
        });
        return categoryTags;
    },

    // Відобразити редактор категорій
    renderCategoriesEditor() {
        if (!DomElements.categoriesListContainer) return;
        
        const state = StateManager.getState();
        const validCategories = state.categories.filter(category => 
            category && category.name && category.name !== 'undefined'
        );
        
        DomElements.categoriesListContainer.innerHTML = validCategories.map(category => {
            const iconInfo = AVAILABLE_ICONS.find(icon => icon.value === category.icon) || AVAILABLE_ICONS[0];
            
            return `
            <div class="category-edit-item" data-id="${category.id}">
                <div class="category-edit-fields">
                    <div class="icon-preview">
                        <i class="fas ${category.icon || 'fa-cube'}"></i>
                    </div>
                    <div class="icon-select-container">
                        <select class="category-icon-select" data-id="${category.id}" ${category.isLocked && category.id === 'all' ? 'disabled' : ''}>
                            ${AVAILABLE_ICONS.map(icon => 
                                `<option value="${icon.value}" ${icon.value === (category.icon || 'fa-cube') ? 'selected' : ''}>
                                    ${icon.display} ${icon.label}
                                </option>`
                            ).join('')}
                        </select>
                        <div class="select-arrow">
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                    <input type="text" class="category-name-input" 
                           value="${category.name || 'Нова категорія'}" 
                           placeholder="Назва категорії"
                           data-id="${category.id}"
                           ${category.isLocked && category.id === 'all' ? 'disabled' : ''}>
                    <input type="color" class="category-color-input" 
                           value="${category.color || '#44d62c'}"
                           data-id="${category.id}"
                           ${category.isLocked && category.id === 'all' ? 'disabled' : ''}>
                    <input type="text" class="category-tags-input" 
                           value="${category.tags ? category.tags.join(', ') : ''}" 
                           placeholder="Теги (через кому)"
                           data-id="${category.id}"
                           ${category.isLocked && category.id === 'all' ? 'disabled' : ''}>
                    <div class="category-actions">
                        <button class="btn btn-secondary toggle-lock-btn" data-id="${category.id}" title="${category.isLocked ? 'Розблокувати' : 'Заблокувати'}">
                            <i class="fas ${category.isLocked ? 'fa-lock' : 'fa-unlock'}"></i>
                        </button>
                        ${!category.isLocked ? 
                            `<button class="btn btn-secondary delete-category-btn" data-id="${category.id}" title="Видалити">
                                <i class="fas fa-trash"></i>
                            </button>` : 
                            `<span class="locked-badge" title="Заблоковано">
                                <i class="fas fa-lock"></i>
                            </span>`
                        }
                    </div>
                </div>
            </div>
            `;
        }).join('');
    },

    // Додати нову категорію
    addNewCategory() {
        const newCategory = {
            id: Utils.generateCategoryId(),
            name: 'Нова категорія',
            icon: 'fa-cube',
            color: '#44d62c',
            tags: [],
            isDefault: false,
            isLocked: false
        };
        
        StateManager.addCategory(newCategory);
        this.renderCategoriesEditor();
        
        setTimeout(() => {
            const newItem = document.querySelector(`.category-edit-item[data-id="${newCategory.id}"]`);
            if (newItem) {
                newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                newItem.style.animation = 'pulse 0.5s';
                setTimeout(() => {
                    newItem.style.animation = '';
                }, 500);
            }
        }, 100);
    },

    // Видалити категорію
    deleteCategory(categoryId) {
        const category = StateManager.findCategory(categoryId);
        if (!category) return false;
        
        if (category.isLocked) {
            Utils.showNotification('Заблоковані категорії не можна видаляти', 'error');
            return false;
        }
        
        if (categoryId === 'all') {
            Utils.showNotification('Категорію "Всі" не можна видаляти', 'error');
            return false;
        }
        
        if (!confirm(`Видалити категорію "${category.name}"?`)) {
            return false;
        }
        
        const removedCategory = StateManager.removeCategory(categoryId);
        if (removedCategory) {
            const state = StateManager.getState();
            if (state.currentCategory === categoryId) {
                StateManager.setCurrentCategory('all');
            }
            return true;
        }
        return false;
    },

    // Перемикач замка категорії
    toggleCategoryLock(categoryId) {
        const category = StateManager.findCategory(categoryId);
        if (!category) return false;
        
        if (categoryId === 'all') {
            Utils.showNotification('Категорія "Всі" повинна залишатися заблокованою', 'error');
            return false;
        }
        
        const updated = StateManager.updateCategory(categoryId, { isLocked: !category.isLocked });
        if (updated) {
            const action = category.isLocked ? 'розблоковано' : 'заблоковано';
            Utils.showNotification(`Категорію "${category.name}" ${action}`);
            return true;
        }
        return false;
    },

    // Зберегти зміни категорій з редактора
    saveCategoriesFromEditor() {
        const state = StateManager.getState();
        const cleanedCategories = Utils.cleanupCategories(state.categories);
        StateManager.setCategories(cleanedCategories);
        
        if (Utils.saveCategories(cleanedCategories)) {
            Utils.showNotification('Категорії збережено');
            return true;
        } else {
            Utils.showNotification('Помилка збереження категорій', 'error');
            return false;
        }
    },

    // Відновити стандартні категорії
    restoreDefaultCategories() {
        if (!confirm('Ця дія відновить стандартні категорії. Всі зміни будуть втрачені. Продовжити?')) {
            return false;
        }
        
        const defaultCategories = Utils.getDefaultCategories();
        const allCategory = defaultCategories.find(cat => cat.id === 'all');
        const state = StateManager.getState();
        
        StateManager.setCategories(defaultCategories);
        
        if (state.currentCategory !== 'all' && !defaultCategories.find(cat => cat.id === state.currentCategory)) {
            StateManager.setCurrentCategory('all');
        }
        
        if (Utils.saveCategories(defaultCategories)) {
            Utils.showNotification('Стандартні категорії відновлено');
            return true;
        }
        return false;
    }
};

export { CategoriesManager };
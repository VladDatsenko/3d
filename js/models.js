// js/models.js
import { StateManager } from './state.js';
import { Utils } from './utils.js';
import { AuthSystem } from './auth.js';

// Функції для роботи з моделями
const ModelsManager = {
    // Застосувати фільтри
    applyFilters(searchQuery = '', categoryTags = {}) {
        const state = StateManager.getState();
        const query = searchQuery.toLowerCase().trim();
        
        state.filteredModels = state.models.filter(model => {
            // Пошук
            const matchesSearch = !query || 
                model.title.toLowerCase().includes(query) ||
                model.author.toLowerCase().includes(query) ||
                model.description.toLowerCase().includes(query) ||
                model.tags.some(tag => tag.toLowerCase().includes(query));
            
            // Категорія
            let matchesCategory = true;
            if (state.currentCategory !== 'all') {
                const tags = categoryTags[state.currentCategory] || [];
                matchesCategory = tags.some(catTag => 
                    model.tags.some(tag => tag.toLowerCase().includes(catTag.toLowerCase()))
                );
            }
            
            // Тип фільтру
            const matchesFilter = state.currentFilter === 'all' || 
                (state.currentFilter === 'featured' && model.featured) ||
                (state.currentFilter === 'new' && model.isNew);
            
            return matchesSearch && matchesCategory && matchesFilter;
        });
        
        StateManager.resetDisplayedCount();
        return state.filteredModels;
    },

    // Завантажити модель (симуляція)
    downloadModel(modelId) {
        const model = StateManager.findModel(modelId);
        if (!model) return false;
        
        // Оновлення кількості завантажень
        const numericDownloads = parseInt(model.downloads.replace('K', '000').replace(/[^0-9]/g, '')) || 0;
        model.downloads = (numericDownloads + 1).toLocaleString();
        if (numericDownloads + 1 >= 1000) {
            model.downloads = ((numericDownloads + 1) / 1000).toFixed(1) + 'K';
        }
        
        // Оновити модель в стані
        const state = StateManager.getState();
        const modelIndex = state.models.findIndex(m => m.id === modelId);
        if (modelIndex !== -1) {
            state.models[modelIndex] = model;
            this.saveModelsToStorage();
        }
        
        // Симуляція завантаження
        const link = document.createElement('a');
        link.href = '#'; // Можна додати реальну URL моделі
        link.download = `${model.title.replace(/\s+/g, '_')}.stl`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Utils.showNotification(`Модель "${model.title}" завантажується...`);
        return true;
    },

    // Створити HTML для моделі
    createModelHTML(model) {
        const state = StateManager.getState();
        const isNew = model.isNew ? '<span class="model-badge">NEW</span>' : '';
        const isFeatured = model.featured ? '<span class="model-badge">POPULAR</span>' : '';
        const isFavorite = state.favorites.includes(model.id) ? 'active' : '';
        const isAdmin = AuthSystem.isAuthenticated();
        
        return `
        <div class="model-card" data-id="${model.id}">
            <img src="${model.image}" alt="${model.title}" class="model-image">
            ${isNew}${isFeatured}
            <div class="model-content">
                <div class="model-header">
                    <div>
                        <h3 class="model-title">${model.title}</h3>
                        <div class="model-author">
                            <span class="author-avatar">${model.author.charAt(0)}</span>
                            ${model.author}
                        </div>
                    </div>
                    <button class="favorite-btn ${isFavorite}" data-id="${model.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="model-stats">
                    <div class="model-stat">
                        <i class="fas fa-clock"></i>
                        ${model.printTime}
                    </div>
                    <div class="model-stat">
                        <i class="fas fa-weight-hanging"></i>
                        ${model.weight}
                    </div>
                    <div class="model-stat">
                        <i class="fas fa-download"></i>
                        ${model.downloads}
                    </div>
                </div>
                <div class="model-tags">
                    ${model.tags.slice(0, 3).map(tag => `<span class="model-tag">${tag}</span>`).join('')}
                    ${model.tags.length > 3 ? '<span class="model-tag">+' + (model.tags.length - 3) + '</span>' : ''}
                </div>
                <div class="model-actions">
                    <button class="btn btn-primary view-details" data-id="${model.id}">
                        <i class="fas fa-eye"></i> Детальніше
                    </button>
                    <button class="btn btn-secondary download-btn" data-id="${model.id}">
                        <i class="fas fa-download"></i> STL
                    </button>
                </div>
                
                ${isAdmin ? `
                <div class="model-admin-actions" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn btn-warning edit-model-btn" data-id="${model.id}" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;">
                            <i class="fas fa-edit"></i> Редагувати
                        </button>
                        <button class="btn btn-danger delete-model-btn" data-id="${model.id}" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;">
                            <i class="fas fa-trash"></i> Видалити
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        `;
    },

    // Створити HTML для детальної інформації про модель
    createModelDetailsHTML(model) {
        const state = StateManager.getState();
        const isFavorite = state.favorites.includes(model.id);
        const isAdmin = AuthSystem.isAuthenticated();
        
        // Генеруємо посилання для поділу
        const shareUrl = `${window.location.origin}${window.location.pathname}#model-${model.id}`;
        
        return `
        <img src="${model.image}" alt="${model.title}" class="modal-image">
        <h2 class="modal-title">${model.title}</h2>
        <div class="modal-author">Автор: ${model.author}</div>
        <p class="modal-description">${model.description}</p>
        
        <div class="modal-details">
            <div class="detail-item">
                <span class="detail-label">Час друку</span>
                <span class="detail-value">${model.printTime}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Вага моделі</span>
                <span class="detail-value">${model.weight}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Складність</span>
                <span class="detail-value">${model.difficulty}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Завантажень</span>
                <span class="detail-value">${model.downloads}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Розмір</span>
                <span class="detail-value">${model.dimensions}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Формат</span>
                <span class="detail-value">${model.formats.join(', ')}</span>
            </div>
        </div>
        
        <div class="modal-tags">
            ${model.tags.map(tag => `<span class="model-tag">${tag}</span>`).join('')}
        </div>
        
        <!-- СЕКЦІЯ ПОДІЛИТИСЯ -->
        <div class="modal-share" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
            <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Поділитися моделлю</h4>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="text" 
                       value="${shareUrl}" 
                       readonly 
                       class="share-url-input"
                       style="flex: 1; padding: 0.75rem; background: var(--bg-accent); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.9rem;">
                <button class="btn btn-primary copy-share-btn" 
                        data-url="${shareUrl}"
                        style="padding: 0.75rem 1.25rem; white-space: nowrap;">
                    <i class="fas fa-copy"></i> Копіювати
                </button>
            </div>
            <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">
                Відправте це посилання, щоб показати модель іншим
            </small>
        </div>
        
        <div class="modal-actions">
            <button class="btn btn-primary download-btn" data-id="${model.id}" style="flex: 2;">
                <i class="fas fa-download"></i> Завантажити модель
            </button>
            <button class="btn btn-secondary toggle-favorite" data-id="${model.id}">
                <i class="fas fa-heart"></i> 
                ${isFavorite ? 'Видалити з обраного' : 'Додати в обране'}
            </button>
        </div>
        
        ${isAdmin ? `
        <div class="modal-admin-actions" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
            <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Адмін-дії</h4>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-warning edit-model-modal-btn" data-id="${model.id}" style="flex: 1;">
                    <i class="fas fa-edit"></i> Редагувати модель
                </button>
                <button class="btn btn-danger delete-model-modal-btn" data-id="${model.id}" style="flex: 1;">
                    <i class="fas fa-trash"></i> Видалити модель
                </button>
            </div>
        </div>
        ` : ''}
        `;
    },

    // Видалити модель
    deleteModel(modelId) {
        const model = StateManager.findModel(modelId);
        if (!model) {
            Utils.showNotification('Модель не знайдена', 'error');
            return false;
        }
        
        if (!confirm(`Ви впевнені, що хочете видалити модель "${model.title}"?`)) {
            return false;
        }
        
        // Видалити модель зі стану
        const state = StateManager.getState();
        const index = state.models.findIndex(m => m.id === modelId);
        if (index !== -1) {
            state.models.splice(index, 1);
            
            // Видалити з обраного
            StateManager.removeFromFavorites(modelId);
            
            // Зберегти зміни
            this.saveModelsToStorage();
            
            // Оновити відфільтровані моделі
            state.filteredModels = state.filteredModels.filter(m => m.id !== modelId);
            
            Utils.showNotification(`Модель "${model.title}" видалена`);
            return true;
        }
        
        Utils.showNotification('Помилка видалення моделі', 'error');
        return false;
    },

    // Оновити модель
    updateModel(modelId, updatedData) {
        const state = StateManager.getState();
        const index = state.models.findIndex(m => m.id === modelId);
        
        if (index !== -1) {
            // Зберегти оригінальні дані, які не змінюються
            const originalModel = state.models[index];
            const updatedModel = {
                ...originalModel,
                ...updatedData,
                id: modelId, // Гарантуємо, що ID не зміниться
                downloads: originalModel.downloads // Зберігаємо кількість завантажень
            };
            
            state.models[index] = updatedModel;
            
            // Оновити в filteredModels
            const filteredIndex = state.filteredModels.findIndex(m => m.id === modelId);
            if (filteredIndex !== -1) {
                state.filteredModels[filteredIndex] = updatedModel;
            }
            
            this.saveModelsToStorage();
            return updatedModel;
        }
        
        return null;
    },

    // Зберегти моделі в localStorage
    saveModelsToStorage() {
        const state = StateManager.getState();
        try {
            localStorage.setItem('models_data', JSON.stringify(state.models));
            return true;
        } catch (error) {
            console.error('Помилка збереження моделей:', error);
            return false;
        }
    },

    // Отримати категорію моделі
    getModelCategory(model) {
        const state = StateManager.getState();
        const categories = state.categories.filter(cat => cat.id !== 'all');
        
        // Знайти категорію по тегам
        for (const category of categories) {
            if (category.tags && category.tags.length > 0) {
                const hasMatchingTag = category.tags.some(tag => 
                    model.tags.some(modelTag => 
                        modelTag.toLowerCase().includes(tag.toLowerCase())
                    )
                );
                
                if (hasMatchingTag) {
                    return category.id;
                }
            }
        }
        
        return 'all'; // За замовчуванням
    },

    // Створити нову модель
    createNewModel(data) {
        const newModel = {
            id: Date.now().toString(),
            title: data.title || 'Нова модель',
            author: data.author || 'Невідомий автор',
            image: data.image || 'https://images.unsplash.com/photo-1589939705388-13b77b3a5d65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            description: data.description || 'Опис моделі',
            printTime: data.printTime || 'Не вказано',
            weight: data.weight || 'Не вказано',
            difficulty: data.difficulty || 'Середня',
            downloads: "0",
            dimensions: data.dimensions || "Не вказано",
            formats: data.formats || ['STL'],
            tags: data.tags || [],
            featured: data.featured || false,
            isNew: data.isNew || false
        };
        
        const state = StateManager.getState();
        state.models.push(newModel);
        this.saveModelsToStorage();
        
        return newModel;
    }
};

export { ModelsManager };
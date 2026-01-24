import { StateManager } from './state.js';
import { Utils } from './utils.js';

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
        const numericDownloads = parseInt(model.downloads.replace('K', '000').replace(/[^0-9]/g, ''));
        model.downloads = (numericDownloads + 1).toLocaleString();
        if (numericDownloads + 1 >= 1000) {
            model.downloads = ((numericDownloads + 1) / 1000).toFixed(1) + 'K';
        }
        
        // Симуляція завантаження
        const link = document.createElement('a');
        link.href = '#';
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
            </div>
        </div>
        `;
    },

    // Створити HTML для детальної інформації про модель
    createModelDetailsHTML(model) {
        const state = StateManager.getState();
        const isFavorite = state.favorites.includes(model.id);
        
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
        
        <div class="modal-actions">
            <button class="btn btn-primary download-btn" data-id="${model.id}" style="flex: 2;">
                <i class="fas fa-download"></i> Завантажити модель
            </button>
            <button class="btn btn-secondary toggle-favorite" data-id="${model.id}">
                <i class="fas fa-heart"></i> 
                ${isFavorite ? 'Видалити з обраного' : 'Додати в обране'}
            </button>
        </div>
        `;
    }
};

export { ModelsManager };
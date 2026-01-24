// Категорії за замовчуванням
const DEFAULT_CATEGORIES = [
    { id: 'all', name: 'Всі', icon: 'fa-boxes', color: '#44d62c', tags: [], isDefault: true, isLocked: true },
    { id: 'toys', name: 'Іграшки', icon: 'fa-gamepad', color: '#44d62c', tags: ['іграшки', 'ігри', 'гра', 'робот', 'трансформер'], isDefault: true, isLocked: true },
    { id: 'decor', name: 'Декор', icon: 'fa-palette', color: '#44d62c', tags: ['декор', 'мистецтво', 'ваза', 'рамка', 'суккулент', 'рослини'], isDefault: true, isLocked: true },
    { id: 'tools', name: 'Інструменти', icon: 'fa-tools', color: '#44d62c', tags: ['інструменти', 'організація', 'майстерня'], isDefault: true, isLocked: true },
    { id: 'gifts', name: 'Подарунки', icon: 'fa-gift', color: '#44d62c', tags: ['подарунки', 'подарунок'], isDefault: true, isLocked: true },
    { id: 'tech', name: 'Техніка', icon: 'fa-robot', color: '#44d62c', tags: ['техніка', 'гаджет', 'ноутбук', 'геймінг'], isDefault: true, isLocked: true },
    { id: 'puzzles', name: 'Головоломки', icon: 'fa-puzzle-piece', color: '#44d62c', tags: ['головоломки', 'головоломка'], isDefault: true, isLocked: true },
    { id: 'home', name: 'Для дому', icon: 'fa-home', color: '#44d62c', tags: ['дім', 'домашній', 'побут', 'офіс'], isDefault: true, isLocked: true },
    { id: 'art', name: 'Мистецтво', icon: 'fa-paint-brush', color: '#44d62c', tags: ['мистецтво', 'арт', 'творчість'], isDefault: true, isLocked: true },
    { id: 'accessories', name: 'Аксесуари', icon: 'fa-headphones', color: '#44d62c', tags: ['аксесуар', 'навушники', 'ліхтарик', 'ключі'], isDefault: true, isLocked: true }
];

// Доступні іконки для категорій
const AVAILABLE_ICONS = [
    { value: 'fa-boxes', label: '📦 Коробки', display: '📦' },
    { value: 'fa-gamepad', label: '🎮 Геймпад', display: '🎮' },
    { value: 'fa-palette', label: '🎨 Палітра', display: '🎨' },
    { value: 'fa-tools', label: '🛠️ Інструменти', display: '🛠️' },
    { value: 'fa-gift', label: '🎁 Подарунок', display: '🎁' },
    { value: 'fa-robot', label: '🤖 Робот', display: '🤖' },
    { value: 'fa-puzzle-piece', label: '🧩 Пазл', display: '🧩' },
    { value: 'fa-home', label: '🏠 Дім', display: '🏠' },
    { value: 'fa-paint-brush', label: '🖌️ Пензель', display: '🖌️' },
    { value: 'fa-headphones', label: '🎧 Навушники', display: '🎧' },
    { value: 'fa-cube', label: '🧊 Куб', display: '🧊' },
    { value: 'fa-print', label: '🖨️ Принтер', display: '🖨️' },
    { value: 'fa-cogs', label: '⚙️ Шестерні', display: '⚙️' },
    { value: 'fa-magic', label: '✨ Магія', display: '✨' },
    { value: 'fa-lightbulb', label: '💡 Лампочка', display: '💡' },
    { value: 'fa-star', label: '⭐ Зірка', display: '⭐' },
    { value: 'fa-heart', label: '❤️ Серце', display: '❤️' },
    { value: 'fa-crown', label: '👑 Корона', display: '👑' },
    { value: 'fa-gem', label: '💎 Алмаз', display: '💎' },
    { value: 'fa-flag', label: '🏳️ Прапор', display: '🏳️' }
];

export { DEFAULT_CATEGORIES, AVAILABLE_ICONS };
// js/config.js
console.log('config.js завантажено');

const CONFIG = {
    // Основна конфігурація
    modelsPerLoad: 12,
    initialLoad: 12,
    debounceDelay: 300,
    notificationDuration: 3000,
    
    // Налаштування адміністратора
    admin: {
        // Пароль для входу (будь-ласка, змініть при першому використанні)
        defaultPassword: 'admin123',
        // Секретне питання для відновлення пароля
        securityQuestion: 'Який ваш улюблений колір?',
        securityAnswer: 'зелений',
        // Час сесії (в мілісекундах) - до ручного виходу
        sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 днів
        // Максимальна кількість спроб входу
        maxLoginAttempts: 5,
        // Блокування при перевищенні спроб (хвилин)
        lockoutDuration: 15 * 60 * 1000 // 15 хвилин
    },
    
    // Налаштування безпеки
    security: {
        // Використовувати хешування пароля
        useHashing: true,
        // Сіль для хешування (згенерована випадково)
        hashSalt: '3dprint_gallery_salt_2023'
    }
};

export { CONFIG };
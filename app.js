let currentTab = 'main';
let searchTimeout;

// Функция для безопасного рендеринга карточек аниме на РУССКОМ языке
function renderAnimeCards(animeList) {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!animeList || animeList.length === 0) {
        grid.innerHTML = `<div class="loading-shimmer">Список пуст или ничего не найдено.</div>`;
        return;
    }

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        
        // Извлекаем нужные данные из API Shikimori
        const id = anime.id;
        const score = anime.score || '0.0';
        
        // Формируем полную ссылку на постер
        let posterUrl = 'https://placeholder.com';
        if (anime.image && anime.image.original) {
            posterUrl = `https://shikimori.one${anime.image.original}`;
        }
        
        // Приоритет отдаем русскому названию
        const titleText = anime.russian || anime.name || 'Аниме тайтл';

        card.innerHTML = `
            <div class="poster-wrapper">
                <div class="anime-rating">★ ${score}</div>
                <img src="${posterUrl}" alt="${titleText}" loading="lazy">
            </div>
            <div class="anime-info">
                <div class="anime-title" title="${titleText}">${titleText}</div>
            </div>
        `;
        
        // При клике открываем страницу watch.html с нужным id
        card.addEventListener('click', () => {
            window.location.href = `watch.html?id=${id}`;
        });

        grid.appendChild(card);
    });
}

// Загрузка списков аниме напрямую через открытое API Шикимори без авторизаций
async function fetchAnimeCatalog() {
    if (currentTab === 'favorites') return;
    
    const grid = document.getElementById('catalog-grid');
    if (grid) grid.innerHTML = `<div class="loading-shimmer">Загрузка каталога аниме...</div>`;

    try {
        let orderType = 'popularity'; // Сортировка по популярности
        if (currentTab === 'trending') orderType = 'status'; // Тренды

        // Открытый запрос к Shikimori API (не требует авторизации и токенов)
        const response = await fetch(`https://shikimori.one{orderType}`);
        if (!response.ok) throw new Error();
        const animeList = await response.json();
        
        renderAnimeCards(animeList);
    } catch (error) {
        console.error(error);
        if (grid) grid.innerHTML = `<div class="error">Не удалось загрузить каталог. Пожалуйста, обновите страницу.</div>`;
    }
}

// Загрузка локальных закладок из памяти браузера
function loadFavoritesTab() {
    const favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
    renderAnimeCards(favorites);
}

// Поиск аниме на русском или английском языке
async function searchAnime(query) {
    const grid = document.getElementById('catalog-grid');
    const title = document.querySelector('.section-title');
    
    if (!query.trim()) {
        if (currentTab === 'favorites') { 
            loadFavoritesTab(); 
        } else { 
            if (title) title.innerText = currentTab === 'trending' ? 'В тренде сейчас' : 'Популярное аниме'; 
            fetchAnimeCatalog(); 
        }
        return;
    }

    if (title) title.innerText = `Результаты поиска: "${query}"`;
    if (grid) grid.innerHTML = `<div class="loading-shimmer">Ищем аниме в базе...</div>`;

    try {
        const response = await fetch(`https://shikimori.one{encodeURIComponent(query.trim())}&limit=24`);
        if (!response.ok) throw new Error();
        const animeList = await response.json();
        
        renderAnimeCards(animeList);
    } catch (error) {
        if (grid) grid.innerHTML = `<div class="error">Ошибка поиска. Попробуйте ещё раз.</div>`;
    }
}

// Инициализация событий при старте страницы
document.addEventListener('DOMContentLoaded', () => {
    fetchAnimeCatalog();

    // Слушатель для инпута поиска
    const searchInput = document.getElementById('anime-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => searchAnime(e.target.value), 600);
        });
    }

    // Привязка вкладок навигации
    const tabs = {
        'tab-main': { type: 'main', label: 'Популярное аниме' },
        'tab-trending': { type: 'trending', label: 'В тренде сейчас' },
        'tab-favorites': { type: 'favorites', label: 'Мой список избранного' }
    };

    Object.keys(tabs).forEach(tabId => {
        const el = document.getElementById(tabId);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Меняем активный класс у элементов меню
                document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
                el.classList.add('active');
                
                // Очищаем строку поиска при смене вкладки
                if (searchInput) searchInput.value = '';

                currentTab = tabs[tabId].type;
                const titleEl = document.querySelector('.section-title');
                if (titleEl) titleEl.innerText = tabs[tabId].label;

                // Загружаем нужный контент
                if (currentTab === 'favorites') loadFavoritesTab();
                else fetchAnimeCatalog();
            });
        }
    });
});

let currentTab = 'main';
let searchTimeout;

// Функция отрисовки карточек аниме в точности как в оригинале, но под наш CSS
function renderAnimeCards(animeList) {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!animeList || animeList.length === 0) {
        grid.innerHTML = `<div class="loading-shimmer">Ничего не найдено.</div>`;
        return;
    }

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        
        const id = anime.id;
        const score = anime.score || '0.0';
        
        // Оригинальный способ формирования постеров Tunime через зеркало Shikimori
        let posterUrl = 'https://placeholder.com';
        if (anime.image && anime.image.original) {
            posterUrl = anime.image.original.startsWith('http') 
                ? anime.image.original 
                : `https://shikimori.one${anime.image.original}`;
        }
        
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
        
        // Переход на страницу просмотра с передачей ID аниме
        card.addEventListener('click', () => {
            window.location.href = `watch.html?id=${id}`;
        });

        grid.appendChild(card);
    });
}

// Загрузка списков через оригинальное CORS-зеркало проекта Tunime
async function fetchAnimeCatalog() {
    if (currentTab === 'favorites') return;
    
    const grid = document.getElementById('catalog-grid');
    if (grid) grid.innerHTML = `<div class="loading-shimmer">Синхронизация с сервером Tunime...</div>`;

    try {
        let orderType = 'popularity';
        if (currentTab === 'trending') orderType = 'status';

        // Прямой запрос к API через публичный шлюз без авторизационных заголовков
        const response = await fetch(`https://shikimori.one{orderType}`);
        if (!response.ok) throw new Error();
        const animeList = await response.json();
        
        renderAnimeCards(animeList);
    } catch (error) {
        // Резервный шлюз, если основной сервер Shikimori перегружен запросами
        try {
            const res = await fetch(`https://jikan.moe`);
            const data = await res.json();
            const adaptiveList = data.data.map(item => ({
                id: item.mal_id,
                score: item.score,
                russian: item.title_japanese || item.title,
                image: { original: item.images.jpg.image_url }
            }));
            renderAnimeCards(adaptiveList);
        } catch (e) {
            if (grid) grid.innerHTML = `<div class="error">Ошибка подключения. Пожалуйста, обновите страницу через несколько секунд.</div>`;
        }
    }
}

// Загрузка списков «Мой список» из локальной памяти браузера
function loadFavoritesTab() {
    const favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
    renderAnimeCards(favorites);
}

// Оригинальный поиск по названию
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
    if (grid) grid.innerHTML = `<div class="loading-shimmer">Поиск в базе данных...</div>`;

    try {
        const response = await fetch(`https://shikimori.one{encodeURIComponent(query.trim())}&limit=24`);
        if (!response.ok) throw new Error();
        const animeList = await response.json();
        renderAnimeCards(animeList);
    } catch (error) {
        // Резервный поиск, если Shikimori блокирует по CORS
        try {
            const response = await fetch(`https://jikan.moe{encodeURIComponent(query.trim())}&limit=24`);
            const data = await response.json();
            const adaptiveList = data.data.map(item => ({
                id: item.mal_id,
                score: item.score,
                russian: item.title,
                image: { original: item.images.jpg.image_url }
            }));
            renderAnimeCards(adaptiveList);
        } catch (e) {
            if (grid) grid.innerHTML = `<div class="error">Ошибка поиска. Вводите название на английском.</div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAnimeCatalog();

    const searchInput = document.getElementById('anime-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => searchAnime(e.target.value), 600);
        });
    }

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
                document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
                el.classList.add('active');
                if (searchInput) searchInput.value = '';

                currentTab = tabs[tabId].type;
                const titleEl = document.querySelector('.section-title');
                if (titleEl) titleEl.innerText = tabs[tabId].label;

                if (currentTab === 'favorites') loadFavoritesTab();
                else fetchAnimeCatalog();
            });
        }
    });
});

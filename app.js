let currentTab = 'main';
let searchTimeout;

// Функция для безопасного рендеринга карточек на русском языке
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
        
        // Получаем ID (поддерживаем разные варианты ID от Kinobox базы)
        const id = anime.id || anime.shikimori_id || anime.kinopoisk_id;
        const score = anime.rating_kinopoisk || anime.rating_imdb || '0.0';
        const posterUrl = anime.poster_url || 'https://placeholder.com';
        const titleText = anime.title || anime.title_ru || 'Аниме тайтл';

        card.innerHTML = `
            <div class="poster-wrapper">
                <div class="anime-rating">★ ${score}</div>
                <img src="${posterUrl}" alt="${titleText}" loading="lazy">
            </div>
            <div class="anime-info">
                <div class="anime-title" title="${titleText}">${titleText}</div>
            </div>
        `;
        
        // Переход на страницу просмотра при клике на карточку
        card.addEventListener('click', () => {
            window.location.href = `watch.html?id=${id}`;
        });

        grid.appendChild(card);
    });
}

// Загрузка списков аниме напрямую через Kinobox API без CORS ошибок
async function fetchAnimeCatalog() {
    if (currentTab === 'favorites') return;
    
    const grid = document.getElementById('catalog-grid');
    if (grid) grid.innerHTML = `<div class="loading-shimmer">Синхронизация с базой видео...</div>`;

    try {
        let sortType = 'rating'; // Популярные (по рейтингу)
        if (currentTab === 'trending') sortType = 'updated'; // Тренды (недавно обновленные серии)

        const response = await fetch(`https://kinobox.tv{sortType}&limit=24`);
        if (!response.ok) throw new Error();
        const animeList = await response.json();
        
        renderAnimeCards(animeList);
    } catch (error) {
        console.error(error);
        if (grid) grid.innerHTML = `<div class="error">Не удалось загрузить списки. Сервер временно недоступен.</div>`;
    }
}

// Загрузка локальных закладок
function loadFavoritesTab() {
    const favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
    renderAnimeCards(favorites);
}

// Поиск аниме на русском языке
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
    if (grid) grid.innerHTML = `<div class="loading-shimmer">Ищем видео на сервере...</div>`;

    try {
        const response = await fetch(`https://kinobox.tv{encodeURIComponent(query.trim())}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        // Фильтруем результаты, оставляя только аниме
        const animeResults = data.filter(item => item.type === 'anime' || (item.genres && item.genres.includes('аниме')));
        renderAnimeCards(animeResults);
    } catch (error) {
        if (grid) grid.innerHTML = `<div class="error">Ошибка поиска. Попробуйте ввести точное название.</div>`;
    }
}

// Инициализация скрипта и обработка кликов меню
document.addEventListener('DOMContentLoaded', () => {
    // Дефолтная загрузка каталога
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

const JIKAN_BASE = 'https://jikan.moe';
let searchTimeout;
let currentTab = 'main';

function renderAnimeCards(animeList) {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';

    if (!animeList || animeList.length === 0) {
        grid.innerHTML = `<div class="loading-shimmer">Ничего не найдено.</div>`;
        return;
    }

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        
        // Jikan API использует mal_id вместо id
        const id = anime.mal_id;
        const score = anime.score || '0.0';
        const posterUrl = anime.images && anime.images.jpg ? anime.images.jpg.image_url : '';
        // Берем английское название или японское, так как Jikan не отдает русский текст напрямую
        const titleText = anime.title_english || anime.title || 'Без названия';

        card.innerHTML = `
            <div class="poster-wrapper">
                <div class="anime-rating">★ ${score}</div>
                <img src="${posterUrl}" alt="${titleText}" loading="lazy">
            </div>
            <div class="anime-info">
                <div class="anime-title" title="${titleText}">${titleText}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `watch.html?id=${id}`;
        });

        grid.appendChild(card);
    });
}

// Загрузка каталога через стабильный Jikan API
async function fetchAnimeCatalog() {
    if (currentTab === 'favorites') return;
    
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = `<div class="loading-shimmer">Загружаем список...</div>`;

    try {
        let url = `${JIKAN_BASE}/top/anime?limit=24`;
        
        // Меняем тип топа в зависимости от выбранной вкладки
        if (currentTab === 'trending') {
            url = `${JIKAN_BASE}/top/anime?filter=airing&limit=24`; // Онгоинги (в тренде)
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const resData = await response.json();
        renderAnimeCards(resData.data);
    } catch (error) {
        grid.innerHTML = `<div class="error">Ошибка загрузки каталога. Пожалуйста, обновите страницу через минуту (у API есть лимит запросов).</div>`;
    }
}

function loadFavoritesTab() {
    const favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
    renderAnimeCards(favorites);
}

async function searchAnime(query) {
    const grid = document.getElementById('catalog-grid');
    const title = document.querySelector('.section-title');
    
    if (!query.trim()) {
        if (currentTab === 'favorites') { loadFavoritesTab(); }
        else { 
            title.innerText = currentTab === 'trending' ? 'В тренде сейчас' : 'Популярное аниме'; 
            fetchAnimeCatalog(); 
        }
        return;
    }

    title.innerText = `Результаты поиска: "${query}"`;
    grid.innerHTML = `<div class="loading-shimmer">Ищем аниме...</div>`;

    try {
        const response = await fetch(`${JIKAN_BASE}/anime?q=${encodeURIComponent(query.trim())}&limit=24`);
        if (!response.ok) throw new Error();
        const resData = await response.json();
        renderAnimeCards(resData.data);
    } catch (error) {
        grid.innerHTML = `<div class="error">Не удалось выполнить поиск. Попробуйте ввести на английском.</div>`;
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

    // Логика переключения вкладок меню
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
                document.querySelector('.section-title').innerText = tabs[tabId].label;

                if (currentTab === 'favorites') loadFavoritesTab();
                else fetchAnimeCatalog();
            });
        }
    });
});

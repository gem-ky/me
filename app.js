const SHIKIMORI_CATALOG = 'https://shikimori.one';
const JIKAN_SEARCH = 'https://jikan.moe';
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
        
        // Обработка разных форматов данных от разных API и localStorage
        const id = anime.id || anime.mal_id;
        const score = anime.score || (anime.images ? anime.score : '0.0');
        let posterUrl = '';
        if (anime.image && anime.image.original) {
            posterUrl = anime.image.original.startsWith('http') ? anime.image.original : `https://shikimori.one${anime.image.original}`;
        } else if (anime.images && anime.images.jpg) {
            posterUrl = anime.images.jpg.image_url;
        }

        const titleText = anime.russian || anime.title_japanese || anime.title || anime.name;

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

async function fetchAnimeCatalog(order = 'popularity') {
    if (currentTab === 'favorites') return;
    try {
        const response = await fetch(`${SHIKIMORI_CATALOG}?limit=24&order=${order}`);
        if (!response.ok) throw new Error();
        const animeList = await response.json();
        renderAnimeCards(animeList);
    } catch (error) {
        document.getElementById('catalog-grid').innerHTML = `<div class="error">Ошибка загрузки. Проверьте соединение.</div>`;
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
        else { title.innerText = 'Популярное аниме'; fetchAnimeCatalog(); }
        return;
    }

    title.innerText = `Результаты поиска: "${query}"`;
    grid.innerHTML = `<div class="loading-shimmer">Ищем аниме...</div>`;

    try {
        // Безопасный глобальный поиск без CORS-блокировок
        const response = await fetch(`${JIKAN_SEARCH}?q=${encodeURIComponent(query.trim())}&limit=24`);
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
        'tab-main': { type: 'main', label: 'Популярное аниме', order: 'popularity' },
        'tab-trending': { type: 'trending', label: 'В тренде сейчас', order: 'kind' },
        'tab-favorites': { type: 'favorites', label: 'Мой список избранного', order: null }
    };

    Object.keys(tabs).forEach(tabId => {
        const el = document.getElementById(tabId);
        if (el) {
            el.addEventListener('click', () => {
                document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
                el.classList.add('active');
                if (searchInput) searchInput.value = '';

                currentTab = tabs[tabId].type;
                document.querySelector('.section-title').innerText = tabs[tabId].label;

                if (currentTab === 'favorites') loadFavoritesTab();
                else fetchAnimeCatalog(tabs[tabId].order);
            });
        }
    });
});

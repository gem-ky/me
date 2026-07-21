const SHIKIMORI_API = 'https://shikimori.one';
let searchTimeout;

function renderAnimeCards(animeList) {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';

    if (!animeList || animeList.length === 0) {
        grid.innerHTML = `<div class="loading-shimmer">Ничего не найдено. Попробуйте другой запрос.</div>`;
        return;
    }

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        const posterUrl = `https://shikimori.one${anime.image.original}`;
        
        card.innerHTML = `
            <div class="poster-wrapper">
                <div class="anime-rating">★ ${anime.score || '0.0'}</div>
                <img src="${posterUrl}" alt="${anime.name}" loading="lazy">
            </div>
            <div class="anime-info">
                <div class="anime-title" title="${anime.russian || anime.name}">
                    ${anime.russian || anime.name}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `watch.html?id=${anime.id}`;
        });

        grid.appendChild(card);
    });
}

async function fetchAnimeCatalog() {
    try {
        const response = await fetch(`${SHIKIMORI_API}?limit=24&order=popularity`);
        if (!response.ok) throw new Error('Ошибка сети');
        const animeList = await response.json();
        renderAnimeCards(animeList);
    } catch (error) {
        console.error('Ошибка каталога:', error);
        document.getElementById('catalog-grid').innerHTML = `<div class="error">Не удалось загрузить каталог.</div>`;
    }
}

async function searchAnime(query) {
    const grid = document.getElementById('catalog-grid');
    const title = document.querySelector('.section-title');
    
    if (!query.trim()) {
        title.innerText = 'Популярное аниме';
        fetchAnimeCatalog();
        return;
    }

    title.innerText = `Результаты поиска: "${query}"`;
    grid.innerHTML = `<div class="loading-shimmer">Ищем на серверах...</div>`;

    try {
        // Добавлен принудительный перевод в UTF-8 строку для серверов Shikimori
        const url = `${SHIKIMORI_API}?limit=24&search=${encodeURIComponent(query.trim())}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка ответа сервера');
        const animeList = await response.json();
        renderAnimeCards(animeList);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        grid.innerHTML = `<div class="error">Ошибка сервера. Попробуйте ввести на английском (например, Naruto)</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAnimeCatalog();

    const searchInput = document.getElementById('anime-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchAnime(value);
            }, 600); // Немного увеличили задержку, чтобы поберечь лимиты API
        });
    }
});

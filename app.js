const SHIKIMORI_API = 'https://shikimori.one';
let searchTimeout;

// Универсальная функция для отрисовки карточек аниме в сетку
function renderAnimeCards(animeList) {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = ''; // Очищаем сетку от старых элементов или лоадера

    if (animeList.length === 0) {
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
        
        // Переход на страницу просмотра при клике
        card.addEventListener('click', () => {
            window.location.href = `watch.html?id=${anime.id}`;
        });

        grid.appendChild(card);
    });
}

// Загрузка трендов по умолчанию
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

// Поиск аниме по названию
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
        // Запрос к API Шикимори с фильтром поиска (параметр search)
        const response = await fetch(`${SHIKIMORI_API}?limit=24&search=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Ошибка поиска');
        const animeList = await response.json();
        renderAnimeCards(animeList);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        grid.innerHTML = `<div class="error">Ошибка при выполнении поиска.</div>`;
    }
}

// Инициализация событий при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    fetchAnimeCatalog();

    const searchInput = document.getElementById('anime-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            
            // Сбрасываем старый таймер ожидания ввода
            clearTimeout(searchTimeout);
            
            // Запускаем поиск только если пользователь сделал паузу в 500мс
            searchTimeout = setTimeout(() => {
                searchAnime(value);
            }, 500);
        });
    }
});

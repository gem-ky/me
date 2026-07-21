const SHIKIMORI_API = 'https://shikimori.one';

// Функция для загрузки данных из API Шикимори
async function fetchAnimeCatalog() {
    const grid = document.getElementById('catalog-grid');
    try {
        // Запрашиваем 20 популярных тайтлов, упорядоченных по популярности
        const response = await fetch(`${SHIKIMORI_API}?limit=20&order=popularity`);
        if (!response.ok) throw new Error('Ошибка сети');
        
        const animeList = await response.json();
        
        // Очищаем индикатор загрузки
        grid.innerHTML = '';

        // Генерируем карточки
        animeList.forEach(anime => {
            const card = document.createElement('div');
            card.className = 'anime-card';
            // Полный путь к постеру (Шикимори отдаёт относительные пути)
            const posterUrl = `https://shikimori.one${anime.image.original}`;
            
            card.innerHTML = `
                <div class="poster-wrapper">
                    <div class="anime-rating">★ ${anime.score}</div>
                    <img src="${posterUrl}" alt="${anime.name}" loading="lazy">
                </div>
                <div class="anime-info">
                    <div class="anime-title" title="${anime.russian || anime.name}">
                        ${anime.russian || anime.name}
                    </div>
                </div>
            `;
            
                       // При клике перенаправляем на страницу просмотра с ID тайтла
            card.addEventListener('click', () => {
                window.location.href = `watch.html?id=${anime.id}`;
            });

            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Ошибка:', error);
        grid.innerHTML = `<div class="error">Не удалось загрузить каталог. Пожалуйста, обновите страницу.</div>`;
    }
}

// Запускаем загрузку при старте страницы
document.addEventListener('DOMContentLoaded', fetchAnimeCatalog);

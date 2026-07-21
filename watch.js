// Получаем ID аниме из параметров ссылки (например: watch.html?id=5114)
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');

if (!animeId) {
    alert('Аниме не найдено!');
    window.location.href = 'index.html';
}

async function loadAnimeDetails() {
    try {
        // 1. Загружаем инфо о тайтле с Шикимори
        const response = await fetch(`https://shikimori.one{animeId}`);
        if (!response.ok) throw new Error('Ошибка API');
        const anime = await response.json();

        // Заполняем интерфейс данными
        document.getElementById('anime-title-watch').innerText = anime.russian || anime.name;
        document.getElementById('anime-poster-watch').src = `https://shikimori.one${anime.image.original}`;
        document.getElementById('anime-status').innerText = anime.status === 'released' ? 'Вышло' : 'Онгоинг';
        document.getElementById('anime-episodes').innerText = `${anime.episodes_aired} / ${anime.episodes || '?'}`;
        document.getElementById('anime-rating-watch').innerText = `★ ${anime.score}`;
        
        // Очищаем описание от лишних тегов сайта
        document.getElementById('anime-desc').innerText = anime.description 
            ? anime.description.replace(/\[.*?\]/g, '') 
            : 'Описание отсутствует.';

        // 2. Встраиваем плеер Kodik по Shikimori ID
        // Используем проверенный публичный плеер-агрегатор
        const playerContainer = document.getElementById('player-placeholder');
        playerContainer.innerHTML = `
            <iframe 
                src="https://kinobox.tv{animeId}" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allowfullscreen 
                allow="autoplay; encrypted-media">
            </iframe>
        `;

    } catch (error) {
        console.error(error);
        document.getElementById('anime-title-watch').innerText = 'Ошибка загрузки';
    }
}

document.addEventListener('DOMContentLoaded', loadAnimeDetails);

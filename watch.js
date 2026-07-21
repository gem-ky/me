const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');

if (!animeId) {
    window.location.href = 'index.html';
}

let animeData = null;

async function loadWatchPage() {
    try {
        // Подгружаем метаданные тайтла (постер, описание)
        const response = await fetch(`https://shikimori.one{animeId}`);
        if (response.ok) {
            animeData = await response.json();
            document.getElementById('anime-title-watch').innerText = animeData.russian || animeData.name;
            document.getElementById('anime-poster-watch').src = `https://shikimori.one${animeData.image.original}`;
            document.getElementById('anime-status').innerText = animeData.status === 'released' ? 'Вышло' : 'Онгоинг';
            document.getElementById('anime-episodes').innerText = `${animeData.episodes_aired} / ${animeData.episodes || '?'}`;
            document.getElementById('anime-rating-watch').innerText = `★ ${animeData.score || '0.0'}`;
            document.getElementById('anime-desc').innerText = animeData.description 
                ? animeData.description.replace(/\[.*?\]/g, '') 
                : 'Описание отсутствует.';
        }
    } catch (e) {
        document.getElementById('anime-title-watch').innerText = "Онлайн просмотр";
    }

    // Встраиваем оригинальное плеерное ядро Tunime (Kodik/Kinobox шлюз по ID)
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

    checkFavoriteStatus();
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('neon_favorites')) || [];
}

function checkFavoriteStatus() {
    const favorites = getFavorites();
    const favBtn = document.getElementById('fav-btn');
    if (!favBtn) return;
    const isFav = favorites.some(item => item.id == animeId);
    const svg = favBtn.querySelector('svg');

    if (isFav) {
        favBtn.classList.add('in-fav');
        if (svg) svg.setAttribute('fill', 'currentColor');
        favBtn.querySelector('span').innerText = 'В моем списке';
    } else {
        favBtn.classList.remove('in-fav');
        if (svg) svg.setAttribute('fill', 'none');
        favBtn.querySelector('span').innerText = 'Добавить в список';
    }
}

function toggleFavorite() {
    let favorites = getFavorites();
    const index = favorites.findIndex(item => item.id == animeId);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push({
            id: animeId,
            score: animeData ? animeData.score : "8.0",
            russian: animeData ? (animeData.russian || animeData.name) : "Аниме тайтл",
            image: { original: animeData ? animeData.image.original : "" }
        });
    }

    localStorage.setItem('neon_favorites', JSON.stringify(favorites));
    checkFavoriteStatus();
}

document.addEventListener('DOMContentLoaded', () => {
    loadWatchPage();
    document.getElementById('fav-btn').addEventListener('click', toggleFavorite);
});

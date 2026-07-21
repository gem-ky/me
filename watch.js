const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');

if (!animeId) {
    window.location.href = 'index.html';
}

let currentAnimeData = null;

async function loadAnimeDetails() {
    try {
        const response = await fetch(`https://shikimori.one{animeId}`);
        if (!response.ok) throw new Error();
        currentAnimeData = await response.json();

        document.getElementById('anime-title-watch').innerText = currentAnimeData.russian || currentAnimeData.name;
        document.getElementById('anime-poster-watch').src = `https://shikimori.one${currentAnimeData.image.original}`;
        document.getElementById('anime-status').innerText = currentAnimeData.status === 'released' ? 'Вышло' : 'Онгоинг';
        document.getElementById('anime-episodes').innerText = `${currentAnimeData.episodes_aired} / ${currentAnimeData.episodes || '?'}`;
        document.getElementById('anime-rating-watch').innerText = `★ ${currentAnimeData.score || '0.0'}`;
        document.getElementById('anime-desc').innerText = currentAnimeData.description 
            ? currentAnimeData.description.replace(/\[.*?\]/g, '') 
            : 'Описание отсутствует.';

        document.getElementById('player-placeholder').innerHTML = `
            <iframe src="https://kinobox.tv{animeId}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
        `;

        checkFavoriteStatus();
    } catch (error) {
        // Резервный поиск через Jikan, если Шикимори заблокирует страницу просмотра
        try {
            const res = await fetch(`https://jikan.moe{animeId}`);
            const json = await res.json();
            const anime = json.data;
            currentAnimeData = anime;

            document.getElementById('anime-title-watch').innerText = anime.title_japanese || anime.title;
            document.getElementById('anime-poster-watch').src = anime.images.jpg.image_url;
            document.getElementById('anime-status').innerText = anime.status;
            document.getElementById('anime-episodes').innerText = anime.episodes || '?';
            document.getElementById('anime-rating-watch').innerText = `★ ${anime.score || '0.0'}`;
            document.getElementById('anime-desc').innerText = anime.synopsis || 'Описание отсутствует.';
            document.getElementById('player-placeholder').innerHTML = `
                <iframe src="https://kinobox.tv{animeId}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
            `;
            checkFavoriteStatus();
        } catch (e) {
            document.getElementById('anime-title-watch').innerText = 'Ошибка загрузки плеера';
        }
    }
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('neon_favorites')) || [];
}

function checkFavoriteStatus() {
    const favorites = getFavorites();
    const favBtn = document.getElementById('fav-btn');
    const isFav = favorites.some(item => (item.id || item.mal_id) == animeId);
    const svg = favBtn.querySelector('svg');

    if (isFav) {
        favBtn.classList.add('in-fav');
        svg.setAttribute('fill', 'currentColor');
        favBtn.querySelector('span').innerText = 'В моем списке';
    } else {
        favBtn.classList.remove('in-fav');
        svg.setAttribute('fill', 'none');
        favBtn.querySelector('span').innerText = 'Добавить в список';
    }
}

function toggleFavorite() {
    if (!currentAnimeData) return;
    let favorites = getFavorites();
    const id = currentAnimeData.id || currentAnimeData.mal_id;
    const index = favorites.findIndex(item => (item.id || item.mal_id) == id);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(currentAnimeData);
    }

    localStorage.setItem('neon_favorites', JSON.stringify(favorites));
    checkFavoriteStatus();
}

document.addEventListener('DOMContentLoaded', () => {
    loadAnimeDetails();
    document.getElementById('fav-btn').addEventListener('click', toggleFavorite);
});

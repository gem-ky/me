// Адрес бэкенда. Локально — localhost, после деплоя замени на адрес своего сервера
// (например https://tunime-backend.onrender.com)
const API_BASE = 'http://localhost:3000/api';

function getToken() { return localStorage.getItem('tunime_token'); }
function getUser() {
  const raw = localStorage.getItem('tunime_user');
  return raw ? JSON.parse(raw) : null;
}
function setSession(token, user) {
  localStorage.setItem('tunime_token', token);
  localStorage.setItem('tunime_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('tunime_token');
  localStorage.removeItem('tunime_user');
}

// Обновляет правый угол хедера в зависимости от того, залогинен ли пользователь
function renderAuthState() {
  const slot = document.getElementById('auth-slot');
  if (!slot) return;
  const user = getUser();
  if (user) {
    slot.innerHTML = `
      <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim)">${user.username}</span>
      <button class="btn" id="logout-btn">Выйти</button>
    `;
    document.getElementById('logout-btn').onclick = () => {
      clearSession();
      renderAuthState();
    };
  } else {
    slot.innerHTML = `<a href="login.html" class="btn btn-primary">Войти</a>`;
  }
}

// Запрос каталога аниме с бэкенда (тот, в свою очередь, идёт в Shikimori)
async function fetchCatalog({ search = '', order = 'popularity', page = 1 } = {}) {
  const params = new URLSearchParams({ search, order, page, limit: 24 });
  const res = await fetch(`${API_BASE}/anime?${params}`);
  if (!res.ok) throw new Error('Не удалось загрузить каталог');
  return res.json();
}

function renderCard(anime) {
  const title = anime.russian || anime.name || 'Без названия';
  const poster = anime.image?.original
    ? `https://shikimori.one${anime.image.original}`
    : '';
  const score = anime.score && anime.score !== '0' ? anime.score : '—';
  const year = anime.aired_on ? anime.aired_on.slice(0, 4) : '????';
  const kind = (anime.kind || '').toUpperCase();

  return `
    <a class="card" href="watch.html?id=${anime.id}">
      <div class="card-poster">
        ${poster ? `<img src="${poster}" alt="${title}" loading="lazy">` : ''}
        <div class="card-score">★ ${score}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${title}</div>
        <div class="card-meta">${kind} · ${year}</div>
      </div>
    </a>
  `;
}

async function loadCatalog(opts) {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="empty-state">Загружаю каталог...</div>`;
  try {
    const data = await fetchCatalog(opts);
    if (!Array.isArray(data) || data.length === 0) {
      grid.innerHTML = `<div class="empty-state">Ничего не найдено</div>`;
      return;
    }
    grid.innerHTML = data.map(renderCard).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Каталог сейчас недоступен.<br>Проверь, что бэкенд запущен на ${API_BASE}</div>`;
  }
}

// ===== Auth forms (login.html / register) =====
// getMode — функция, которая на момент отправки формы вернёт текущий режим ('login' | 'register'),
// т.к. пользователь может переключить режим уже после того как обработчик навешен
async function handleAuthSubmit(getMode) {
  const form = document.getElementById('auth-form');
  const errorBox = document.getElementById('auth-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    const mode = typeof getMode === 'function' ? getMode() : getMode;

    const body = { email: form.email.value, password: form.password.value };
    if (mode === 'register') body.username = form.username.value;

    try {
      const res = await fetch(`${API_BASE}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setSession(data.token, data.user);
      window.location.href = 'index.html';
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderAuthState();
  loadCatalog();

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let t;
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => loadCatalog({ search: searchInput.value }), 400);
    });
  }

  document.querySelectorAll('.filter-row [data-order]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-row [data-order]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadCatalog({ order: btn.dataset.order, search: searchInput?.value || '' });
    });
  });
});

/* ==========================================================================
   Shared UI helpers used across every page
   ========================================================================== */

function escapeHtml(s){
  return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

const KIND_LABEL = { tv:'ТВ-сериал', movie:'Фильм', ova:'OVA', ona:'ONA', special:'Спешл', tv_special:'ТВ-спешл', music:'Клип' };
const STATUS_LABEL = { anons:'Анонс', ongoing:'Онгоинг', released:'Вышло' };

function kindLabel(k){ return KIND_LABEL[k] || k || ''; }
function statusLabel(s){ return STATUS_LABEL[s] || s || ''; }

/** Build the poster-card markup used in strips and grids */
function cardHTML(anime){
  const title = anime.russian || anime.name || 'Без названия';
  const score = anime.score && anime.score !== '0' ? anime.score : null;
  const meta = [kindLabel(anime.kind), anime.aired_on ? anime.aired_on.slice(0,4) : ''].filter(Boolean).join(' · ');
  return `
    <a class="card" href="anime.html?id=${anime.id}" aria-label="${escapeHtml(title)}">
      <div class="card-poster">
        ${score ? `<span class="card-score">★ ${score}</span>` : ''}
        <img src="${Shiki.poster(anime)}" alt="" loading="lazy">
      </div>
      <div class="card-title">${escapeHtml(title)}</div>
      <div class="card-sub">${escapeHtml(meta)}</div>
    </a>`;
}

function renderStrip(el, list){
  el.innerHTML = list.map(cardHTML).join('') || `<div class="notice">Ничего не нашлось.</div>`;
}
function renderGrid(el, list){
  el.innerHTML = list.map(cardHTML).join('') || `<div class="notice">Ничего не нашлось.</div>`;
}

/** Wire up the top nav search box: Enter -> search.html?q=... */
function initNav(active){
  document.querySelectorAll('.navlinks a[data-page]').forEach(a=>{
    if(a.dataset.page === active) a.classList.add('active');
  });
  const input = document.getElementById('navSearchInput');
  if(input){
    input.addEventListener('keydown', e=>{
      if(e.key === 'Enter' && input.value.trim()){
        location.href = 'search.html?q=' + encodeURIComponent(input.value.trim());
      }
    });
  }
}

function qs(name){
  return new URLSearchParams(location.search).get(name);
}

function debounce(fn, ms){
  let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
}

/* register service worker for PWA install/offline shell */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

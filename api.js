/* ==========================================================================
   API — Shikimori (catalog & metadata) + Kodik (video source)
   Shikimori: public REST API, no key required for reads.
   Kodik: requires a personal API token, entered by the user in Настройки
          and stored in localStorage — we never ship a shared/embedded token.
   ========================================================================== */

const SHIKI_BASE = 'https://shikimori.one';

function kodikToken(){
  return localStorage.getItem('seans_kodik_token') || '';
}

async function shikiFetch(path){
  const res = await fetch(SHIKI_BASE + path);
  if(!res.ok) throw new Error('Shikimori API error: ' + res.status);
  return res.json();
}

const Shiki = {
  poster(anime){
    if(!anime || !anime.image) return '';
    const p = anime.image.original || anime.image.preview;
    return p && p.startsWith('http') ? p : SHIKI_BASE + p;
  },

  async list({ order='popularity', kind='', status='', genre='', search='', limit=20, page=1 } = {}){
    const params = new URLSearchParams({ order, limit, page });
    if(kind) params.set('kind', kind);
    if(status) params.set('status', status);
    if(genre) params.set('genre', genre);
    if(search) params.set('search', search);
    return shikiFetch(`/api/animes?${params.toString()}`);
  },

  async byId(id){
    return shikiFetch(`/api/animes/${id}`);
  },

  async genres(){
    const all = await shikiFetch('/api/genres');
    return all.filter(g => g.kind === 'anime' || !g.kind);
  }
};

const Kodik = {
  hasToken(){ return !!kodikToken(); },

  setToken(t){ localStorage.setItem('seans_kodik_token', t.trim()); },

  clearToken(){ localStorage.removeItem('seans_kodik_token'); },

  /** Find playable sources for a title by its Shikimori id */
  async findByShikimoriId(shikimoriId){
    const token = kodikToken();
    if(!token) throw new Error('NO_TOKEN');
    const params = new URLSearchParams({
      token,
      shikimori_id: shikimoriId,
      with_episodes: 'true'
    });
    const res = await fetch(`https://kodikapi.com/search?${params.toString()}`);
    if(!res.ok) throw new Error('Kodik API error: ' + res.status);
    const data = await res.json();
    return data.results || [];
  },

  /** Build an embeddable iframe URL for a given result + episode number */
  embedUrl(result, episode){
    if(!result) return '';
    // result.link is protocol-relative, e.g. //kodik.info/serial/12345/xxxx/720p
    let base = result.link.startsWith('http') ? result.link : 'https:' + result.link;
    if(episode && result.seasons){
      // seasons -> episodes map with direct links when available
      const seasonKeys = Object.keys(result.seasons);
      for(const sk of seasonKeys){
        const ep = result.seasons[sk].episodes && result.seasons[sk].episodes[episode];
        if(ep){ base = ep.startsWith('http') ? ep : 'https:' + ep; break; }
      }
    }
    return base;
  }
};

/* ---------------- local library: favorites + watch history ---------------- */

const Library = {
  _read(key){ try{ return JSON.parse(localStorage.getItem(key) || '{}'); }catch(e){ return {}; } },
  _write(key, val){ localStorage.setItem(key, JSON.stringify(val)); },

  isFavorite(id){ return !!this._read('seans_favorites')[id]; },
  toggleFavorite(anime){
    const favs = this._read('seans_favorites');
    if(favs[anime.id]) delete favs[anime.id];
    else favs[anime.id] = { id: anime.id, russian: anime.russian, name: anime.name, image: anime.image };
    this._write('seans_favorites', favs);
    return !!favs[anime.id];
  },
  favorites(){ return Object.values(this._read('seans_favorites')); },

  markWatched(animeId, episode, meta){
    const hist = this._read('seans_history');
    hist[animeId] = { episode, at: Date.now(), meta };
    this._write('seans_history', hist);
  },
  watchedEpisode(animeId){
    const hist = this._read('seans_history');
    return hist[animeId] ? hist[animeId].episode : 0;
  },
  history(){
    const hist = this._read('seans_history');
    return Object.entries(hist)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a,b) => b.at - a.at);
  }
};

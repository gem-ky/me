import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const SHIKI_BASE = 'https://shikimori.one/api';
const SHIKI_HEADERS = {
  // Shikimori просит указывать User-Agent с названием приложения
  'User-Agent': 'Tunime-Redesign',
};

// GET /api/anime?page=1&order=popularity&search=...
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 24, order = 'popularity', search = '' } = req.query;
    const params = new URLSearchParams({
      page,
      limit,
      order,
      ...(search ? { search } : {}),
    });
    const response = await fetch(`${SHIKI_BASE}/animes?${params}`, {
      headers: SHIKI_HEADERS,
    });
    if (!response.ok) throw new Error(`Shikimori вернул ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Не удалось получить данные каталога.', details: err.message });
  }
});

// GET /api/anime/:id — карточка тайтла
router.get('/:id', async (req, res) => {
  try {
    const response = await fetch(`${SHIKI_BASE}/animes/${req.params.id}`, {
      headers: SHIKI_HEADERS,
    });
    if (!response.ok) throw new Error(`Shikimori вернул ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Не удалось получить данные тайтла.', details: err.message });
  }
});

export default router;

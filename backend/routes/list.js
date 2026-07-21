import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserList, upsertListEntry, removeListEntry } from '../db.js';

const router = Router();
router.use(requireAuth);

// GET /api/list — весь список текущего пользователя
router.get('/', (req, res) => {
  res.json(getUserList(req.userId));
});

// PUT /api/list/:animeId — добавить/обновить запись (статус, оценка, серии)
router.put('/:animeId', async (req, res) => {
  const { status, score, episodesWatched } = req.body;
  const validStatuses = ['watching', 'planned', 'completed', 'dropped', 'on_hold'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Некорректный статус.' });
  }

  await upsertListEntry({
    userId: req.userId,
    animeId: req.params.animeId,
    status,
    score,
    episodesWatched,
  });
  res.json({ ok: true });
});

// DELETE /api/list/:animeId — убрать из списка
router.delete('/:animeId', async (req, res) => {
  await removeListEntry(req.userId, req.params.animeId);
  res.json({ ok: true });
});

export default router;

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { findUserByEmail, createUser } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Заполни все поля.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов.' });
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'Пользователь с такой почтой уже существует.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: randomUUID(),
    username,
    email,
    passwordHash,
    createdAt: Date.now(),
  };
  await createUser(user);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ error: 'Неверная почта или пароль.' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Неверная почта или пароль.' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

export default router;

import express from 'express';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';
import { authCookieOptions } from '../lib/auth-token.js';
import { loginUser, registerUser, getCurrentUserPayload } from '../services/auth.service.js';
import { requireAuth } from '../middleware/require-auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);

    res.cookie('auth_token', result.token, authCookieOptions());
    res.status(201).json({ user: result.user });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Unable to register user.',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);

    res.cookie('auth_token', result.token, authCookieOptions());
    res.json({ user: result.user });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Unable to login.',
    });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: getCurrentUserPayload({
    id: req.auth.userId,
    email: req.auth.email,
    displayName: req.auth.displayName,
    createdAt: null,
    updatedAt: null,
  }) });
});

export default router;

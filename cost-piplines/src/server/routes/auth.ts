import { Router, Request, Response } from 'express';
import { store } from '../store.ts';

const router = Router();

// Current user / auth session status
router.get('/me', (req: Request, res: Response) => {
  res.json({
    user: {
      id: 1,
      email: 'user@cloudops.local',
      name: 'Cloud Engineer',
      role: 'admin',
    },
  });
});

// Simple login fallback
router.post('/login', (req: Request, res: Response) => {
  const { email } = req.body || {};
  res.json({
    success: true,
    user: {
      id: 1,
      email: email || 'dashboard-admin@coforge.com',
      name: 'Cloud Engineer',
      role: 'admin',
    },
    token: 'mock-jwt-token',
  });
});

// Signup fallback
router.post('/signup', (req: Request, res: Response) => {
  const { email, name } = req.body || {};
  res.json({
    success: true,
    user: {
      id: Date.now(),
      email: email || 'user@coforge.com',
      name: name || 'User',
      role: 'user',
    },
    token: 'mock-jwt-token',
  });
});

// Azure SSO status
router.get('/azure/status', (req: Request, res: Response) => {
  res.json({ isConfigured: false });
});

export default router;

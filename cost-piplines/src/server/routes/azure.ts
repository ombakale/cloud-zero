import { Router, Request, Response } from 'express';
import { store } from '../store.ts';

const router = Router();

// 1. Get Azure accounts / subscriptions
router.get('/accounts', (req: Request, res: Response) => {
  const accounts = store.getAzureAccounts();
  if (accounts.length > 0) {
    return res.json(accounts);
  }

  // Fallback default
  res.json([
    {
      id: 'account-1',
      name: 'Primary Azure Subscription',
      accountId: 'primary-subscription',
      accountName: 'Primary Azure Subscription',
      path: '/data/azure',
    },
  ]);
});

// 2. Alert evaluation dates
router.get('/alerts/dates', (req: Request, res: Response) => {
  const alerts = store.getAzureAlerts();
  const dates = [...new Set(alerts.map((a: any) => a.evaluationDate).filter(Boolean))].sort().reverse();
  res.json(dates.length > 0 ? dates : [new Date().toISOString().slice(0, 10)]);
});

// 3. Alerts for a specific evaluation date
router.get('/alerts', (req: Request, res: Response) => {
  const { date } = req.query;
  const alerts = store.getAzureAlerts();
  if (date) {
    return res.json(alerts.filter((a: any) => a.evaluationDate === date));
  }
  res.json(alerts);
});

// 4. Meters list
router.get('/meters', (req: Request, res: Response) => {
  const byService = store.getAzureDataset('by_service');
  res.json(byService);
});

// 5. Meter budgets
router.get('/meter-budgets', (req: Request, res: Response) => {
  res.json(store.getAzureMeterBudgets());
});

router.post('/meter-budgets', (req: Request, res: Response) => {
  const budget = req.body;
  const created = store.addAzureMeterBudget(budget);
  res.status(201).json(created);
});

router.delete('/meter-budgets/:id', (req: Request, res: Response) => {
  store.deleteAzureMeterBudget(req.params.id);
  res.json({ success: true });
});

// 6. Dynamic Azure Dataset endpoint
router.get('/dataset/:filename', (req: Request, res: Response) => {
  const rawFilename = req.params.filename || '';
  const cleanFilename = rawFilename.toLowerCase().replace(/\.csv$/, '').replace(/\.json$/, '');

  const data = store.getAzureDataset(cleanFilename);
  res.json(data);
});

// 7. Linked Accounts / Subscriptions directory
router.get('/linked-accounts', (req: Request, res: Response) => {
  const subData = store.getAzureDataset('by_subscription');
  res.json(subData);
});

// 8. Single Subscription detail
router.get('/linked-accounts/:linkedAccountId', (req: Request, res: Response) => {
  const { linkedAccountId } = req.params;
  const subData = store.getAzureDataset('by_subscription');
  const target = subData.find((s: any) => s.subscriptionId === linkedAccountId || s.subscription === linkedAccountId);

  if (target) {
    return res.json(target);
  }

  res.json({
    subscriptionId: linkedAccountId,
    subscription: linkedAccountId,
    cost: 0,
    sharePct: 0,
  });
});

export default router;

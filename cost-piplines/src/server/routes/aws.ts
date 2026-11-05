import { Router, Request, Response } from 'express';
import { store } from '../store.ts';

const router = Router();

// 1. Get list of configured AWS accounts
router.get('/accounts', (req: Request, res: Response) => {
  const accounts = store.getAwsAccounts();
  if (accounts.length > 0) {
    return res.json(accounts);
  }

  // Fallback if not yet connected
  res.json([
    {
      id: 'account-1',
      name: 'AWS Primary Account',
      accountId: 'primary',
      accountName: 'AWS Primary Account',
      path: '/data',
    },
  ]);
});

// 2. Dynamic AWS Dataset endpoint (returns data shaped for dashboard components)
router.get('/dataset/:filename', (req: Request, res: Response) => {
  const rawFilename = req.params.filename || '';
  const cleanFilename = rawFilename.toLowerCase().replace(/\.csv$/, '').replace(/\.json$/, '');
  
  const data = store.getAwsDataset(cleanFilename);
  res.json(data);
});

// 3. Linked Accounts directory
router.get('/linked-accounts', (req: Request, res: Response) => {
  const varianceData = store.getAwsDataset('account_cost_variance');
  const linkedAccounts = store.getAwsDataset('cost_by_linked_account');
  
  if (varianceData.length > 0) {
    return res.json(varianceData);
  }
  
  res.json(linkedAccounts);
});

// 4. Single Linked Account detail
router.get('/linked-accounts/:linkedAccountId', (req: Request, res: Response) => {
  const { linkedAccountId } = req.params;
  const varianceData = store.getAwsDataset('account_cost_variance');
  const target = varianceData.find((a: any) => a['Linked Account'] === linkedAccountId || a['Account ID'] === linkedAccountId);

  if (target) {
    return res.json(target);
  }

  res.json({
    'Linked Account': linkedAccountId,
    'Account ID': linkedAccountId,
    'Account Name': `Account ${linkedAccountId}`,
    Status: 'ACTIVE',
    'Current Month Spend': 0,
    'Previous Month Spend': 0,
    Diff: 0,
    '% Change': 0,
  });
});

export default router;

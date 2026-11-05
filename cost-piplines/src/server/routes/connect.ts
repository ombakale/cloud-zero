import { Router, Request, Response } from 'express';
import { fetchLiveAwsData, fetchLiveAzureData } from '../cloud-fetcher.ts';
import { store } from '../store.ts';

const router = Router();

// GET /api/connect/status - Check currently active cloud provider and account
router.get('/status', (req: Request, res: Response) => {
  const activeConn = store.getActiveConnection();
  const awsAccounts = store.getAwsAccounts();
  const azureAccounts = store.getAzureAccounts();

  res.json({
    isConnected: !!activeConn.provider,
    activeProvider: activeConn.provider,
    connectedAt: activeConn.connectedAt,
    accountId: activeConn.accountId,
    accountName: activeConn.accountName,
    hasAwsData: awsAccounts.length > 0,
    hasAzureData: azureAccounts.length > 0,
  });
});

// POST /api/connect/aws - Validate and fetch AWS Cost Explorer data
router.post('/aws', async (req: Request, res: Response) => {
  const { accessKeyId, secretAccessKey, region = 'us-east-1', accountName } = req.body || {};

  if (!accessKeyId || !secretAccessKey) {
    return res.status(400).json({
      error: 'MISSING_CREDENTIALS',
      message: 'AWS Access Key ID and Secret Access Key are required.',
    });
  }

  try {
    console.log(`\n☁️ [AWS Connect] Fetching live data for region ${region}...`);
    const result = await fetchLiveAwsData({
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      region: region.trim(),
      accountName: accountName?.trim(),
    });

    console.log(`✅ [AWS Connect] Successfully fetched data for ${result.accountName} (${result.months.length} months)`);
    res.json({
      success: true,
      provider: 'aws',
      message: 'AWS account connected and live cost data fetched successfully.',
      details: result,
    });
  } catch (err: any) {
    console.error('❌ [AWS Connect] Error fetching data:', err.message);
    res.status(500).json({
      error: 'AWS_FETCH_ERROR',
      message: err.message || 'Failed to fetch AWS Cost Explorer data. Please verify your credentials and IAM permissions.',
    });
  }
});

// POST /api/connect/azure - Validate and fetch Azure Cost Management data
router.post('/azure', async (req: Request, res: Response) => {
  const { tenantId, clientId, clientSecret, subscriptionId, subscriptionName } = req.body || {};

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({
      error: 'MISSING_CREDENTIALS',
      message: 'Azure Tenant ID, Client ID, and Client Secret are required.',
    });
  }

  try {
    console.log(`\n🔷 [Azure Connect] Authenticating and querying Azure subscriptions...`);
    const result = await fetchLiveAzureData({
      tenantId: tenantId.trim(),
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      subscriptionId: subscriptionId?.trim(),
      subscriptionName: subscriptionName?.trim(),
    });

    console.log(`✅ [Azure Connect] Successfully fetched Azure data for ${result.subscriptionName}`);
    res.json({
      success: true,
      provider: 'azure',
      message: 'Azure account connected and live cost data fetched successfully.',
      details: result,
    });
  } catch (err: any) {
    console.error('❌ [Azure Connect] Error fetching data:', err.message);
    res.status(500).json({
      error: 'AZURE_FETCH_ERROR',
      message: err.message || 'Failed to authenticate or fetch Azure cost data. Please verify your Azure App Registration credentials.',
    });
  }
});

// POST /api/connect/disconnect - Reset connection
router.post('/disconnect', (req: Request, res: Response) => {
  store.disconnect();
  res.json({ success: true, message: 'Disconnected from cloud account.' });
});

export default router;

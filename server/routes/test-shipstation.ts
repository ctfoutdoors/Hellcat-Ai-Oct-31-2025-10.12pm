import { Router } from 'express';

const router = Router();

router.get('/api/test-shipstation', async (req, res) => {
  const apiKey = process.env.SHIPSTATION_API_KEY;
  const apiSecret = process.env.SHIPSTATION_API_SECRET;
  
  res.json({
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    apiKeyLength: apiKey?.length || 0,
    apiSecretLength: apiSecret?.length || 0,
    apiKeyPreview: apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET',
  });
});

export default router;

import { Router } from 'express';
import { analyzeImage } from '../services/openaiService';

const router = Router();

/**
 * Analyze shipping label image and extract data
 * POST /api/ai/analyze-label
 */
router.post('/analyze-label', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    // Use OpenAI Vision to analyze the shipping label
    const prompt = `Analyze this shipping label image and extract the following information in JSON format:
{
  "trackingNumber": "the tracking number",
  "carrier": "FEDEX|UPS|USPS|DHL|OTHER",
  "dimensions": "LxWxH format",
  "weight": "weight with unit",
  "shipFrom": {
    "name": "sender name",
    "address": "full address"
  },
  "shipTo": {
    "name": "recipient name",
    "address": "full address"
  },
  "serviceType": "service level (e.g., Ground, Express, Priority)",
  "shipDate": "ship date if visible",
  "cost": "shipping cost if visible"
}

Extract all visible information. If a field is not visible, omit it from the response.`;
    
    const analysis = await analyzeImage(imageUrl, prompt);
    
    // Parse the JSON response from AI
    let extractedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = { raw: analysis };
      }
    } catch (parseError) {
      extractedData = { raw: analysis };
    }
    
    res.json(extractedData);
  } catch (error) {
    console.error('Label analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze label' });
  }
});

export default router;

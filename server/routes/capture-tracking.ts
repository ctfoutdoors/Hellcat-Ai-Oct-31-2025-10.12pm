import { Router } from 'express';
import { chromium } from 'playwright';
import { storagePut } from '../storage';

const router = Router();

/**
 * Capture screenshot/PDF of carrier tracking page
 * POST /api/capture-tracking
 * Body: { trackingUrl: string, caseId: number, trackingNumber: string, carrier: string }
 */
router.post('/', async (req, res) => {
  try {
    const { trackingUrl, caseId, trackingNumber, carrier } = req.body;
    
    if (!trackingUrl || !caseId || !trackingNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`📸 Capturing tracking page for ${carrier} ${trackingNumber}...`);

    // Launch browser
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Navigate to tracking page
    await page.goto(trackingUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for images to load (especially delivery photos)
    await page.waitForTimeout(3000);
    
    // Scroll to make sure all images are loaded
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `tracking-${carrier}-${trackingNumber}-${timestamp}`;
    
    // Capture full page screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: 'png'
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    // Upload to S3
    const screenshotKey = `case-${caseId}/evidence/${baseFilename}.png`;
    const pdfKey = `case-${caseId}/evidence/${baseFilename}.pdf`;
    
    const screenshotUpload = await storagePut(screenshotKey, screenshotBuffer, 'image/png');
    const pdfUpload = await storagePut(pdfKey, pdfBuffer, 'application/pdf');
    
    console.log(`✓ Captured tracking proof for case ${caseId}`);
    console.log(`  Screenshot: ${screenshotUpload.url}`);
    console.log(`  PDF: ${pdfUpload.url}`);
    
    res.json({
      success: true,
      screenshot: {
        url: screenshotUpload.url,
        key: screenshotKey,
        filename: `${baseFilename}.png`
      },
      pdf: {
        url: pdfUpload.url,
        key: pdfKey,
        filename: `${baseFilename}.pdf`
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error capturing tracking page:', error);
    res.status(500).json({ 
      error: 'Failed to capture tracking page',
      message: error.message 
    });
  }
});

export default router;

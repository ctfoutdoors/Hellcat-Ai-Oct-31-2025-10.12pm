/**
 * FedEx Screenshot Capture Service
 * Automatically captures proof of delivery screenshots from FedEx tracking pages
 * Extracts delivery photos and metadata
 */

import { storagePut } from '../storage';

interface FedExTrackingScreenshotOptions {
  trackingNumber: string;
  caseId: number;
  userId: number;
}

interface DeliveryProofData {
  screenshotUrl: string;
  thumbnailUrl?: string;
  deliveryPhotoUrl?: string;
  deliveryDate?: Date;
  deliveryTime?: string;
  deliveryLocation?: string;
  recipientName?: string;
  signatureRequired?: boolean;
  signatureObtained?: boolean;
  hasDeliveryPhoto: boolean;
}

/**
 * Capture FedEx tracking page screenshot and extract delivery proof
 * Uses Puppeteer to navigate to FedEx tracking page and capture screenshots
 */
export async function captureFedExDeliveryProof(
  options: FedExTrackingScreenshotOptions
): Promise<DeliveryProofData> {
  const { trackingNumber, caseId, userId } = options;
  
  try {
    // Import puppeteer dynamically
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to FedEx tracking page
    const trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    await page.goto(trackingUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for tracking details to load
    await page.waitForSelector('.tracking-details', { timeout: 10000 }).catch(() => {
      console.log('[FedEx Screenshot] Tracking details not found, continuing...');
    });
    
    // Take full page screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: 'png',
    });
    
    // Upload screenshot to S3
    const timestamp = Date.now();
    const screenshotKey = `evidence/fedex/${caseId}/${trackingNumber}-${timestamp}.png`;
    const { url: screenshotUrl } = await storagePut(screenshotKey, screenshotBuffer, 'image/png');
    
    // Try to find delivery photo
    let deliveryPhotoUrl: string | undefined;
    let hasDeliveryPhoto = false;
    
    try {
      // Look for delivery photo element
      const photoElement = await page.$('.delivery-photo img, .pod-image img, [alt*="delivery"] img');
      
      if (photoElement) {
        const photoSrc = await photoElement.evaluate((el: any) => el.src);
        
        if (photoSrc && !photoSrc.includes('placeholder')) {
          // Download the delivery photo
          const photoResponse = await page.goto(photoSrc);
          if (photoResponse) {
            const photoBuffer = await photoResponse.buffer();
            const photoKey = `evidence/fedex/${caseId}/${trackingNumber}-delivery-photo-${timestamp}.jpg`;
            const { url } = await storagePut(photoKey, photoBuffer, 'image/jpeg');
            deliveryPhotoUrl = url;
            hasDeliveryPhoto = true;
          }
        }
      }
    } catch (photoError) {
      console.log('[FedEx Screenshot] No delivery photo found:', photoError);
    }
    
    // Extract delivery details from page
    let deliveryDate: Date | undefined;
    let deliveryTime: string | undefined;
    let deliveryLocation: string | undefined;
    let recipientName: string | undefined;
    let signatureRequired: boolean | undefined;
    let signatureObtained: boolean | undefined;
    
    try {
      // Extract delivery date and time
      const deliveryDateText = await page.$eval(
        '.delivery-date, .delivered-date, [data-test="delivery-date"]',
        (el: any) => el.textContent
      ).catch(() => null);
      
      if (deliveryDateText) {
        deliveryDate = new Date(deliveryDateText);
      }
      
      // Extract delivery location
      deliveryLocation = await page.$eval(
        '.delivery-location, .pod-location, [data-test="delivery-location"]',
        (el: any) => el.textContent
      ).catch(() => undefined);
      
      // Extract recipient name
      recipientName = await page.$eval(
        '.recipient-name, .delivered-to, [data-test="recipient"]',
        (el: any) => el.textContent
      ).catch(() => undefined);
      
      // Check for signature
      const signatureText = await page.$eval(
        '.signature-status, .signature-info',
        (el: any) => el.textContent.toLowerCase()
      ).catch(() => '');
      
      if (signatureText) {
        signatureRequired = signatureText.includes('signature required');
        signatureObtained = signatureText.includes('signed') || signatureText.includes('signature obtained');
      }
      
    } catch (extractError) {
      console.log('[FedEx Screenshot] Error extracting delivery details:', extractError);
    }
    
    await browser.close();
    
    return {
      screenshotUrl,
      deliveryPhotoUrl,
      hasDeliveryPhoto,
      deliveryDate,
      deliveryTime,
      deliveryLocation,
      recipientName,
      signatureRequired,
      signatureObtained,
    };
    
  } catch (error: any) {
    console.error('[FedEx Screenshot] Error capturing screenshot:', error);
    throw new Error(`Failed to capture FedEx delivery proof: ${error.message}`);
  }
}

/**
 * Capture tracking timeline screenshots for evidence
 * Takes multiple screenshots of different sections of the tracking page
 */
export async function captureFedExTrackingTimeline(
  trackingNumber: string,
  caseId: number
): Promise<string[]> {
  try {
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    await page.goto(trackingUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const screenshots: string[] = [];
    
    // Screenshot 1: Full page
    const fullPageBuffer = await page.screenshot({ fullPage: true, type: 'png' });
    const timestamp = Date.now();
    const fullPageKey = `evidence/fedex/${caseId}/${trackingNumber}-full-${timestamp}.png`;
    const { url: fullPageUrl } = await storagePut(fullPageKey, fullPageBuffer, 'image/png');
    screenshots.push(fullPageUrl);
    
    // Screenshot 2: Tracking timeline section
    try {
      const timelineElement = await page.$('.tracking-timeline, .scan-events, .tracking-history');
      if (timelineElement) {
        const timelineBuffer = await timelineElement.screenshot({ type: 'png' });
        const timelineKey = `evidence/fedex/${caseId}/${trackingNumber}-timeline-${timestamp}.png`;
        const { url: timelineUrl } = await storagePut(timelineKey, timelineBuffer, 'image/png');
        screenshots.push(timelineUrl);
      }
    } catch (err) {
      console.log('[FedEx Screenshot] Timeline section not found');
    }
    
    // Screenshot 3: Delivery details section
    try {
      const detailsElement = await page.$('.delivery-details, .shipment-details, .package-details');
      if (detailsElement) {
        const detailsBuffer = await detailsElement.screenshot({ type: 'png' });
        const detailsKey = `evidence/fedex/${caseId}/${trackingNumber}-details-${timestamp}.png`;
        const { url: detailsUrl } = await storagePut(detailsKey, detailsBuffer, 'image/png');
        screenshots.push(detailsUrl);
      }
    } catch (err) {
      console.log('[FedEx Screenshot] Details section not found');
    }
    
    await browser.close();
    
    return screenshots;
    
  } catch (error: any) {
    console.error('[FedEx Screenshot] Error capturing timeline:', error);
    throw new Error(`Failed to capture tracking timeline: ${error.message}`);
  }
}

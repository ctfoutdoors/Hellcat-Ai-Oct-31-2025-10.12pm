import puppeteer, { Browser, Page } from "puppeteer";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { trackingScreenshots } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * AI Tracking Agent Service
 * Uses Puppeteer for browser automation and GPT-4 Vision for data extraction
 */

interface TrackingData {
  status: string;
  currentLocation: string;
  estimatedDelivery: string | null;
  lastUpdate: string;
  events: Array<{
    timestamp: string;
    location: string;
    description: string;
  }>;
}

interface CarrierConfig {
  name: string;
  urlTemplate: string; // Use {tracking} placeholder
  waitSelector?: string; // CSS selector to wait for before screenshot
  waitTime?: number; // Additional wait time in ms
}

// Carrier URL configurations
const CARRIER_CONFIGS: Record<string, CarrierConfig> = {
  UPS: {
    name: "UPS",
    urlTemplate: "https://www.ups.com/track?track=yes&trackNums={tracking}",
    waitSelector: ".ups-tracking_detail",
    waitTime: 3000,
  },
  FEDEX: {
    name: "FedEx",
    urlTemplate: "https://www.fedex.com/fedextrack/?trknbr={tracking}",
    waitSelector: "#trk-summary-container",
    waitTime: 3000,
  },
  USPS: {
    name: "USPS",
    urlTemplate: "https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}",
    waitSelector: ".tracking-summary",
    waitTime: 2000,
  },
  "OLD DOMINION": {
    name: "Old Dominion",
    urlTemplate: "https://www.odfl.com/Trace/standardResult.faces?pro={tracking}",
    waitSelector: ".tracking-results",
    waitTime: 2000,
  },
  ESTES: {
    name: "Estes",
    urlTemplate: "https://www.estes-express.com/shipment-tracking/?pro={tracking}",
    waitSelector: ".shipment-details",
    waitTime: 2000,
  },
};

/**
 * Get carrier configuration
 */
function getCarrierConfig(carrier: string): CarrierConfig {
  const normalized = carrier.toUpperCase().trim();
  return CARRIER_CONFIGS[normalized] || {
    name: carrier,
    urlTemplate: "", // Will need manual URL
    waitTime: 2000,
  };
}

/**
 * Build tracking URL for carrier
 */
function buildTrackingUrl(carrier: string, trackingNumber: string): string {
  const config = getCarrierConfig(carrier);
  if (!config.urlTemplate) {
    throw new Error(`No URL template configured for carrier: ${carrier}`);
  }
  return config.urlTemplate.replace("{tracking}", trackingNumber);
}

/**
 * Capture screenshot of tracking page
 */
async function captureTrackingPage(
  carrier: string,
  trackingNumber: string
): Promise<{ screenshotBuffer: Buffer; url: string }> {
  let browser: Browser | null = null;
  
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/chromium-browser",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page: Page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1920, height: 1080 });

    // Build tracking URL
    const url = buildTrackingUrl(carrier, trackingNumber);
    const config = getCarrierConfig(carrier);

    console.log(`[TrackingAgent] Navigating to ${url}`);
    
    // Navigate to tracking page
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for specific element if configured
    if (config.waitSelector) {
      try {
        await page.waitForSelector(config.waitSelector, { timeout: 10000 });
      } catch (err) {
        console.warn(`[TrackingAgent] Wait selector ${config.waitSelector} not found, continuing anyway`);
      }
    }

    // Additional wait time for dynamic content
    if (config.waitTime) {
      await new Promise(resolve => setTimeout(resolve, config.waitTime));
    }

    // Capture screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    console.log(`[TrackingAgent] Screenshot captured: ${screenshotBuffer.length} bytes`);

    return {
      screenshotBuffer: screenshotBuffer as Buffer,
      url,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extract tracking data from screenshot using GPT-4 Vision
 */
async function extractTrackingData(
  screenshotBuffer: Buffer,
  carrier: string,
  trackingNumber: string
): Promise<TrackingData> {
  // Convert buffer to base64
  const base64Image = screenshotBuffer.toString("base64");
  const imageUrl = `data:image/png;base64,${base64Image}`;

  console.log(`[TrackingAgent] Extracting data with GPT-4 Vision for ${carrier} ${trackingNumber}`);

  // Call GPT-4 Vision to extract structured data
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a tracking data extraction AI. Extract shipping tracking information from carrier tracking page screenshots.
Return ONLY valid JSON with this exact structure:
{
  "status": "in_transit|delivered|pending|exception|out_for_delivery",
  "currentLocation": "City, State or full address",
  "estimatedDelivery": "YYYY-MM-DD or null",
  "lastUpdate": "YYYY-MM-DD HH:MM:SS",
  "events": [
    {
      "timestamp": "YYYY-MM-DD HH:MM:SS",
      "location": "City, State",
      "description": "Event description"
    }
  ]
}`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract tracking information for ${carrier} tracking number ${trackingNumber} from this screenshot. Return only the JSON object, no markdown formatting.`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "tracking_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["in_transit", "delivered", "pending", "exception", "out_for_delivery"],
            },
            currentLocation: { type: "string" },
            estimatedDelivery: { type: ["string", "null"] },
            lastUpdate: { type: "string" },
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  location: { type: "string" },
                  description: { type: "string" },
                },
                required: ["timestamp", "location", "description"],
                additionalProperties: false,
              },
            },
          },
          required: ["status", "currentLocation", "estimatedDelivery", "lastUpdate", "events"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from vision AI");
  }

  const trackingData: TrackingData = JSON.parse(content);
  console.log(`[TrackingAgent] Extracted data:`, trackingData);

  return trackingData;
}

/**
 * Main function: Sync tracking data for a shipment
 */
export async function syncTrackingData(params: {
  shipmentId?: number;
  trackingNumber: string;
  carrier: string;
}): Promise<{
  success: boolean;
  screenshotId: number;
  trackingData?: TrackingData;
  error?: string;
}> {
  const { shipmentId, trackingNumber, carrier } = params;
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  try {
    console.log(`[TrackingAgent] Starting sync for ${carrier} ${trackingNumber}`);

    // Step 1: Capture screenshot
    const { screenshotBuffer, url } = await captureTrackingPage(carrier, trackingNumber);

    // Step 2: Upload screenshot to S3
    const screenshotKey = `tracking-screenshots/${carrier.toLowerCase()}/${trackingNumber}-${Date.now()}.png`;
    const { url: screenshotUrl } = await storagePut(screenshotKey, screenshotBuffer, "image/png");

    console.log(`[TrackingAgent] Screenshot uploaded to S3: ${screenshotUrl}`);

    // Step 3: Create database record (pending)
    const [screenshot] = await db
      .insert(trackingScreenshots)
      .values({
        shipmentId: shipmentId || null,
        trackingNumber,
        carrier,
        carrierUrl: url,
        screenshotUrl,
        screenshotKey,
        processingStatus: "processing",
        capturedAt: new Date(),
      })
      .$returningId();

    const screenshotId = screenshot.id;

    try {
      // Step 4: Extract data with Vision AI
      const trackingData = await extractTrackingData(screenshotBuffer, carrier, trackingNumber);

      // Step 5: Update database with extracted data
      await db
        .update(trackingScreenshots)
        .set({
          extractedStatus: trackingData.status,
          extractedLocation: trackingData.currentLocation,
          extractedEta: trackingData.estimatedDelivery ? new Date(trackingData.estimatedDelivery) : null,
          extractedDetails: JSON.stringify(trackingData),
          processingStatus: "completed",
        })
        .where(eq(trackingScreenshots.id, screenshotId));

      console.log(`[TrackingAgent] ✅ Sync completed successfully for ${trackingNumber}`);

      return {
        success: true,
        screenshotId,
        trackingData,
      };
    } catch (extractionError: any) {
      // Update record with error
      await db
        .update(trackingScreenshots)
        .set({
          processingStatus: "failed",
          errorMessage: extractionError.message,
        })
        .where(eq(trackingScreenshots.id, screenshotId));

      throw extractionError;
    }
  } catch (error: any) {
    console.error(`[TrackingAgent] ❌ Error syncing ${trackingNumber}:`, error);
    return {
      success: false,
      screenshotId: 0,
      error: error.message,
    };
  }
}

/**
 * Batch sync multiple shipments
 */
export async function syncMultipleShipments(
  shipments: Array<{ shipmentId?: number; trackingNumber: string; carrier: string }>
): Promise<Array<{ trackingNumber: string; success: boolean; error?: string }>> {
  const results = [];

  for (const shipment of shipments) {
    const result = await syncTrackingData(shipment);
    results.push({
      trackingNumber: shipment.trackingNumber,
      success: result.success,
      error: result.error,
    });

    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

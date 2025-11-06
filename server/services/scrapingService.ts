import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";

/**
 * Scraping Service - Web scraping with anti-detection measures
 */

let browser: Browser | null = null;

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
      ],
    });
  }
  return browser;
}

/**
 * Create a new page with anti-detection measures
 */
async function createStealthPage(): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  // Set realistic viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Set user agent
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUserAgent);

  // Set extra headers
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  });

  // Override navigator properties to avoid detection
  await page.evaluateOnNewDocument(() => {
    // Override the navigator.webdriver property
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    // Override the navigator.plugins property
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    // Override the navigator.languages property
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  return page;
}

/**
 * Scrape a webpage and return HTML content
 */
export async function scrapeWebpage(url: string, waitForSelector?: string): Promise<string> {
  const page = await createStealthPage();

  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for specific selector if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    }

    // Random delay to appear more human-like
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    const html = await page.content();
    await page.close();

    return html;
  } catch (error) {
    await page.close();
    throw error;
  }
}

/**
 * Extract structured data from HTML using selectors
 */
export function extractDataFromHtml(
  html: string,
  selectors: {
    [key: string]: string;
  }
): { [key: string]: string | string[] } {
  const $ = cheerio.load(html);
  const result: { [key: string]: string | string[] } = {};

  for (const [key, selector] of Object.entries(selectors)) {
    const elements = $(selector);
    if (elements.length === 1) {
      result[key] = elements.text().trim();
    } else if (elements.length > 1) {
      result[key] = elements
        .map((_, el) => $(el).text().trim())
        .get();
    } else {
      result[key] = "";
    }
  }

  return result;
}

/**
 * Scrape LinkedIn profile (basic public information)
 */
export async function scrapeLinkedInProfile(profileUrl: string): Promise<{
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  experience?: string[];
  education?: string[];
}> {
  try {
    const html = await scrapeWebpage(profileUrl, ".pv-top-card");

    const $ = cheerio.load(html);

    return {
      name: $(".pv-top-card--list li:first-child").text().trim() || undefined,
      headline: $(".pv-top-card--list li:nth-child(2)").text().trim() || undefined,
      location: $(".pv-top-card--list li:nth-child(3)").text().trim() || undefined,
      about: $(".pv-about__summary-text").text().trim() || undefined,
      experience: $(".pv-profile-section.experience-section li")
        .map((_, el) => $(el).text().trim())
        .get(),
      education: $(".pv-profile-section.education-section li")
        .map((_, el) => $(el).text().trim())
        .get(),
    };
  } catch (error) {
    console.error("LinkedIn scraping error:", error);
    return {};
  }
}

/**
 * Scrape company website for basic information
 */
export async function scrapeCompanyWebsite(url: string): Promise<{
  title?: string;
  description?: string;
  text?: string;
}> {
  try {
    const html = await scrapeWebpage(url);
    const $ = cheerio.load(html);

    // Remove script and style elements
    $("script, style, noscript").remove();

    return {
      title: $("title").text().trim() || undefined,
      description: $('meta[name="description"]').attr("content")?.trim() || undefined,
      text: $("body").text().replace(/\s+/g, " ").trim().substring(0, 5000) || undefined,
    };
  } catch (error) {
    console.error("Company website scraping error:", error);
    return {};
  }
}

/**
 * Search for leads on a webpage
 */
export async function scrapeLeadsFromPage(
  url: string,
  config: {
    nameSelector?: string;
    emailSelector?: string;
    titleSelector?: string;
    companySelector?: string;
  }
): Promise<
  Array<{
    name?: string;
    email?: string;
    title?: string;
    company?: string;
  }>
> {
  try {
    const html = await scrapeWebpage(url);
    const $ = cheerio.load(html);

    const leads: Array<{
      name?: string;
      email?: string;
      title?: string;
      company?: string;
    }> = [];

    // Extract email addresses from page
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const pageText = $("body").text();
    const emails = pageText.match(emailRegex) || [];

    // If selectors provided, use them
    if (config.nameSelector) {
      $(config.nameSelector).each((i, el) => {
        const name = $(el).text().trim();
        const email = emails[i] || undefined;

        leads.push({
          name,
          email,
          title: config.titleSelector ? $(el).find(config.titleSelector).text().trim() : undefined,
          company: config.companySelector ? $(el).find(config.companySelector).text().trim() : undefined,
        });
      });
    } else {
      // Generic extraction - find emails and try to associate with names
      emails.forEach((email) => {
        leads.push({ email });
      });
    }

    return leads;
  } catch (error) {
    console.error("Lead scraping error:", error);
    return [];
  }
}

/**
 * Monitor webpage for changes
 */
export async function detectWebpageChanges(
  url: string,
  previousHash?: string
): Promise<{
  changed: boolean;
  currentHash: string;
  content?: string;
}> {
  try {
    const html = await scrapeWebpage(url);
    const $ = cheerio.load(html);

    // Remove dynamic elements that change frequently
    $("script, style, noscript, .timestamp, .date, time").remove();

    const cleanedHtml = $.html();
    const currentHash = hashString(cleanedHtml);

    return {
      changed: previousHash ? currentHash !== previousHash : false,
      currentHash,
      content: cleanedHtml.substring(0, 10000),
    };
  } catch (error) {
    console.error("Change detection error:", error);
    throw error;
  }
}

/**
 * Simple hash function for content comparison
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Random delay helper
 */
export function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

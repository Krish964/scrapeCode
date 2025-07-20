import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

let browserInstance;

async function getBrowser() {
  if (!browserInstance) {
    console.log("🟡 Launching new Puppeteer browser...");

    const isProduction = process.env.NODE_ENV === "production";

    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-zygote",
        "--single-process",
        "--disable-gpu"
      ],
      executablePath: isProduction
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),  // fallback for local dev
    });

    console.log("✅ Browser launched");
  } else {
    console.log("📦 Using existing browser instance");
  }

  return browserInstance;
}

async function preparePage() {
  console.log("🟡 Preparing new page...");
  const browser = await getBrowser();
  const page = await browser.newPage();

  console.log("🟡 Enabling request interception...");
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "stylesheet", "font"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  console.log("✅ Page prepared");
  return page;
}

async function scrapeArticleContent(articleUrl, articleSelectors) {
  try {
    console.log(`🧭 Navigating to article URL: ${articleUrl}`);
    const page = await preparePage();

    console.log("🕐 Waiting for article to load...");
    await page.goto(articleUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    console.log("✅ Article loaded");

    const articleData = await page.evaluate((articleSelectors) => {
      try {
        console.log("🟡 Inside page.evaluate for article content");

        const getText = (sel) => document.querySelector(sel)?.innerText.trim() || null;
        const getImage = (sel) => {
          const el = document.querySelector(sel);
          return el?.src || el?.dataset?.src || null;
        };

        const shortContent = getText('.sortDec');

        const paragraphs = Array.from(document.querySelectorAll(articleSelectors.pSelector))
          .map(p => p.innerText.trim())
          .filter(Boolean)
          .map(text =>
            text
              .replace(/[\u2018\u2019\u201C\u201D]/g, '"')
              .replace(/\\"/g, '"')
              .replace(/\.\.\./g, " ")
              .replace(/\.\.\//g, " ")
              .replace(/[-|•]/g, " ")
              .replace(/[^a-zA-Z0-9.,?'"()₹%₹:;/\s]/g, "")
              .replace(/\s+/g, " ")
              .trim()
          );

        console.log("✅ Article content scraped inside page");

        return {
          shortContent,
          paragraphs,
          date: getText(articleSelectors.dateSelector),
          image: getImage(articleSelectors.imageSelector)
        };
      } catch (err) {
        console.error("⚠️ Error inside evaluate:", err.message);
        return null;
      }
    }, articleSelectors);

    await page.close();
    console.log("🗑️ Page closed");

    if (!articleData || !articleData.paragraphs?.length) {
      console.warn("❌ Missing or empty article content.");
      return null;
    }

    console.log("✅ Article scraping successful.");
    return articleData;

  } catch (err) {
    console.error(`🚫 Error scraping article: ${articleUrl}`, err);
    return null;
  }
}

async function scrapeWebsite(url, selectors) {
  try {
    console.log(`🚀 Starting homepage scrape: ${url}`);
    const page = await preparePage();

    console.log("🕐 Navigating to homepage...");
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log("✅ Homepage loaded");

    for (const selector of selectors.waitForSelectors) {
      try {
        console.log(`🔍 Waiting for selector: ${selector}`);
        await page.waitForSelector(selector, { timeout: 10000 });
        console.log(`✅ Selector found: ${selector}`);
      } catch (err) {
        console.warn(`⚠️ Skipping missing selector: ${selector}`);
      }
    }

    const scrapedDataFromPage = await page.evaluate((selectors) => {
      console.log("🟡 Inside page.evaluate for homepage");
      const data = [];
      const headlines = document.querySelectorAll(selectors.headlineSelector);
      const imageContainers = document.querySelectorAll(selectors.imageSelector);
      const articleLinks = document.querySelectorAll(selectors.articleLinkSelector);

      headlines.forEach((headline, index) => {
        try {
          const imageElement = imageContainers[index]?.querySelector('img');
          const imageSrc = imageElement?.src || imageElement?.dataset?.src || 'No image';

          data.push({
            title: headline.innerText.trim(),
            image: imageSrc,
            articleLink: articleLinks[index]?.href || 'No link'
          });
        } catch (err) {
          console.error(`⚠️ Error at index ${index}: ${err.message}`);
        }
      });

      return data;
    }, selectors);

    await page.close();
    console.log(`✅ Homepage scrape done: ${url}. Articles scraped: ${scrapedDataFromPage.length}`);
    return scrapedDataFromPage;

  } catch (err) {
    console.error(`🚫 Error scraping homepage: ${url}`, err);
    throw err;
  }
}

export { scrapeWebsite, scrapeArticleContent };

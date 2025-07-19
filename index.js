import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

let browserPromise = puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

// 🔁 Reuse browser context & block unnecessary requests
async function preparePage() {
  const browser = await browserPromise;
  const page = await browser.newPage();

  // Block non-essential resources
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    if (["image", "stylesheet", "font"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  return page;
}

// 📄 Scrape full content of individual article
async function scrapeArticleContent(articleUrl, articleSelectors) {
  try {
    console.log(`🧭 Navigating to article URL: ${articleUrl}`);
    const page = await preparePage();

    await page.goto(articleUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // await page.waitForSelector(articleSelectors.h1Selector, { timeout: 10000 });

    const articleData = await page.evaluate((articleSelectors) => {
      try {
        const getText = (sel) => document.querySelector(sel)?.innerText.trim() || null;
        const getImage = (sel) => {
          const el = document.querySelector(sel);
          return el?.src || el?.dataset?.src || null;
        };

        const shortContent = getText('.sortDec'); // from homepage card or top of article

        const paragraphs = Array.from(document.querySelectorAll(articleSelectors.pSelector))
          .map(p => p.innerText.trim())
          .filter(Boolean)
          .map(text =>
            text
              .replace(/[\u2018\u2019\u201C\u201D]/g, '"')   // fancy quotes
              .replace(/\\"/g, '"')                          // escaped quotes
              .replace(/\.\.\./g, " ")
              .replace(/\.\.\//g, " ")
              .replace(/[-|•]/g, " ")
              .replace(/[^a-zA-Z0-9.,?'"()₹%₹:;/\s]/g, "")   // unwanted characters
              .replace(/\s+/g, " ")
              .trim()
          );

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

    await page.close(); // ✅ Clean up memory

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

// 🏠 Scrape homepage and extract article metadata
async function scrapeWebsite(url, selectors) {
  try {
    console.log(`🚀 Starting homepage scrape: ${url}`);
    const page = await preparePage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    for (const selector of selectors.waitForSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
      } catch (err) {
        console.warn(`⚠️ Skipping missing selector: ${selector}`);
      }
    }



    const scrapedDataFromPage = await page.evaluate((selectors) => {
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

    await page.close(); // ✅ Clean up memory
    console.log(`✅ Homepage scrape done: ${url}. Articles: ${scrapedDataFromPage.length}`);
    return scrapedDataFromPage;

  } catch (err) {
    console.error(`🚫 Error scraping homepage: ${url}`, err);
    throw err;
  }
}

export { scrapeWebsite, scrapeArticleContent };




// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";

// puppeteer.use(StealthPlugin());

// const browserPromise = puppeteer.launch({
//   headless: true,
//   args: ["--no-sandbox", "--disable-setuid-sandbox"]
// });

// async function preparePage() {
//   const browser = await browserPromise;
//   const page = await browser.newPage();
//   await page.setRequestInterception(true);
//   page.on("request", (req) => {
//     if (["image", "stylesheet", "font"].includes(req.resourceType())) req.abort();
//     else req.continue();
//   });
//   return page;
// }

// export async function scrapeWebsite(url, selectors) {
//   try {
//     console.log(`🚀 Starting homepage scrape: ${url}`);
//     const page = await preparePage();
//     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

//     for (const sel of selectors.waitForSelectors) {
//       try {
//         await page.waitForSelector(sel, { timeout: 10000 });
//       } catch {
//         console.warn(`⚠️ Skipping missing selector: ${sel}`);
//       }
//     }

//     const data = await page.evaluate((s) => {
//       const items = [];
//       const headlines = document.querySelectorAll(s.headlineSelector);
//       const summaries = document.querySelectorAll(s.contentSelector);
//       const imgs = document.querySelectorAll(s.imageSelector);

//       headlines.forEach((h, i) => {
//         items.push({
//           title: h.innerText.trim(),
//           articleLink: h.href,
//           image: imgs[i]?.src || imgs[i]?.dataset?.src || "No image"
//         });
//       });
//       return items;
//     }, selectors);

//     await page.close();
//     console.log(`✅ Homepage scrape done: ${url}. Articles: ${data.length}`);
//     return data;
//   } catch (err) {
//     console.error("🚫 Error scraping homepage:", err);
//     throw err;
//   }
// }

// export async function scrapeArticleContent(articleUrl, articleSelectors) {
//   try {
//     console.log(`🧭 Navigating to article: ${articleUrl}`);
//     const page = await preparePage();
//     await page.goto(articleUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

//     const res = await page.evaluate((sel) => {
//       const getText = (s) => document.querySelector(s)?.innerText?.trim() || null;
//       const getImg = (s) => document.querySelector(s)?.src || null;

//       const paragraphs = Array.from(document.querySelectorAll(sel.pSelector))
//         .map(p => p.innerText.trim())
//         .filter(Boolean)
//         .map(t => t.replace(/\s+/g, " ").trim());

//       return {
//         shortContent: getText(sel.contentSelector),
//         date: getText(sel.dateSelector),
//         paragraphs,
//         image: getImg(sel.imageSelector)
//       };
//     }, articleSelectors);

//     await page.close();
//     if (!res.paragraphs?.length) {
//       console.warn("❌ Empty article content");
//       return null;
//     }
//     console.log("✅ Article scraping successful");
//     return res;
//   } catch (err) {
//     console.error("🚫 Error scraping article:", err);
//     return null;
//   }
// }
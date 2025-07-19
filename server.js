
import express from "express";
import { scrapeWebsite, scrapeArticleContent } from './index.js';
// const { scrapeTwitterTrends } = require('./twitterTrends');
// const { scrapeRedditPopular } = require('./redditPopular');
import websiteConfigs from './website-config.js';

const app = express();
const port = process.env.PORT || 3000;

let scrapedData = {}; // Store scraped data for all websites

// Function to scrape all websites
async function scrapeAllWebsites() {
  try {
    const websites = Object.keys(websiteConfigs);
    for (const website of websites) {
      console.log(`Scraping ${website}...`);
      const homepageData = await scrapeWebsite(
        websiteConfigs[website].url,
        websiteConfigs[website].selectors
      );

      // Scrape full content for each article
      for (const article of homepageData) {
        if (article.articleLink && article.articleLink !== 'No link available') {
          console.log(`Scraping full content from ${article.articleLink}...`);
          article.fullContent = await scrapeArticleContent(
            article.articleLink,
            websiteConfigs[website].articleSelectors
          );
        } else {
          article.fullContent = 'No full content available';
        }
      }

      scrapedData[website] = homepageData;
    }
  } catch (err) {
    console.error("Error during scraping all websites:", err);
    throw err;
  }
}

// Automatically scrape every 7 days (604800000 milliseconds)
setInterval(() => {
  console.log("Triggering automatic scraping for all websites...");
  scrapeAllWebsites().catch((err) => console.error("Automatic scraping failed:", err));
}, 604800000);

// API route to get mixed data from all sources
app.get('/scrape', async (req, res) => {
  try {
    if (Object.keys(scrapedData).length === 0) {
      console.log("No data found, scraping now...");
      await scrapeAllWebsites();
    }
    res.json(scrapedData); // Return scraped data as JSON
  } catch (error) {
    console.error("Error in /scrape route:", error);
    res.status(500).json({ error: 'An error occurred during scraping' });
  }
});

// // New route for Twitter trends
// app.get('/twitter-trends', async (req, res) => {
//   try {
//     console.log('Fetching Twitter trends...');
//     const trends = await scrapeTwitterTrends();
//     res.json(trends);
//   } catch (error) {
//     console.error('Error in /twitter-trends route:', error);
//     res.status(500).json({ error: 'Failed to fetch Twitter trends' });
//   }
// });

// // New route for Reddit popular posts
// app.get('/reddit-popular', async (req, res) => {
//   try {
//     console.log('Fetching Reddit popular posts...');
//     const posts = await scrapeRedditPopular();
//     res.json(posts);
//   } catch (error) {
//     console.error('Error in /reddit-popular route:', error);
//     res.status(500).json({ error: 'Failed to fetch Reddit popular posts' });
//   }
// });

// Start the Express server
app.listen(port, '::', () => {
  console.log(`Server running on port ${port}`);
});




// import express from "express";
// import { scrapeWebsite, scrapeArticleContent } from "./index.js";
// import configs from "./website-config.js";

// const app = express();
// const port = process.env.PORT || 3000;

// app.get("/", (req, res) => {
//   res.send("✅ Server is running");
// });

// app.get("/scrape", async (req, res) => {
//   try {
//     const site = configs.hindustanTimes;

//     const homepageArticles = await scrapeWebsite(site.url, site.selectors);

//     const fullArticles = [];

//     for (const item of homepageArticles) {
//       const details = await scrapeArticleContent(item.articleLink, site.articleSelectors);
//       if (details) {
//         fullArticles.push({
//           ...item,
//           date: details.date,
//           shortContent: details.shortContent,
//           paragraphs: details.paragraphs,
//           image: details.image // override if needed
//         });
//       }
//     }

//     console.log("📦 Scraping complete, sending result");
//     res.json({ success: true, total: fullArticles.length, data: fullArticles });

//   } catch (error) {
//     console.error("❌ Error during scraping:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`🚀 Server running on http://localhost:${port}`);
// });

const puppeteer = require("puppeteer");

function parsePrice(priceString) {
  if (!priceString) return null;
  const cleaned = priceString.replace(/[^\d,\.]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

async function scrapeSinglePage(page, url) {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    let imageUrl = await page
      .$eval('meta[property="og:image"]', el => el.content)
      .catch(() => null);

    if (!imageUrl) {
      imageUrl = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        const filtered = imgs.filter(img => {
          const src = img.src.toLowerCase();
          const alt = (img.alt || "").toLowerCase();
          return !src.includes("logo") && !alt.includes("logo") && img.src;
        });
        return filtered.length > 0 ? filtered[0].src : null;
      });
    }

    const priceSelectors = [
      '[itemprop="price"]',
      '[class*="price__item"]',
      '[class*="price"]',
      '[class*="cijena"]',
      '[class*="iznos"]',
      '[class*="amount"]',
      ".product-price",
      ".price",
      ".price-actual",
      '[data-price]',
      '[data-price-final]',
      ".price-final",
    ];

    let rawPrice = null;
    for (const selector of priceSelectors) {
      rawPrice = await page.$eval(selector, el => el.textContent.trim()).catch(() => null);
      if (rawPrice && rawPrice.length > 1) break;
    }

    if (!rawPrice) {
      rawPrice = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(/(\d{1,5}[,.]\d{2})\s*(€)/i);
        return match ? match[0] : null;
      });
    }

    const price = parsePrice(rawPrice);

    return { url, price, imageUrl };
  } catch (err) {
    console.error(`❌ Greška za ${url}:`, err.message);
    return { url, price: null, imageUrl: null };
  }
}

async function scrapeProductData(req, res) {
  const { urls } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: "URL lista je prazna ili nevažeća." });
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const results = [];

    for (const url of urls) {
      const data = await scrapeSinglePage(page, url);
      results.push(data);
    }

    const validPrices = results.filter(r => r.price !== null);
    if (validPrices.length === 0) {
      return res.json({ price: null, imageUrl: null });
    }

    const lowest = validPrices.reduce((min, curr) => curr.price < min.price ? curr : min);
    return res.json({ price: lowest.price, imageUrl: lowest.imageUrl });
  } catch (error) {
    console.error("❌ Glavna greška:", error.message);
    return res.status(500).json({ error: "Greška u scrapanju." });
  } finally {
    await browser.close();
  }
}

module.exports = scrapeProductData;

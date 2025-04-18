const puppeteer = require("puppeteer");

function parsePrice(priceString) {
  if (!priceString) return null;

  const cleaned = priceString
    .replace(/\./g, "") // makni točke za tisućice
    .replace(",", ".") // decimalni zarez → točka
    .replace(/[^\d.]/g, ""); // makni sve osim brojeva i točke

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

async function scrapeSinglePage(page, url) {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const hostname = new URL(url).hostname;

    // ======== AMAZON ========
    if (hostname.includes("amazon")) {
      const imageUrl = await page
        .$eval("#landingImage", img => img.src)
        .catch(() => null);

      let price = await page
        .$eval("span.a-price .a-offscreen", el => el.textContent.trim())
        .catch(() => null);

      return {
        url,
        imageUrl,
        price: parsePrice(price),
      };
    }

    // ======== ZALANDO ========
    if (hostname.includes("zalando")) {
      const imageUrl = await page
        .$eval("img[loading='eager']", img => img.src)
        .catch(() => null);

      let price = await page
        .$eval("[data-testid='price']", el => el.textContent.trim())
        .catch(() => null);

      return {
        url,
        imageUrl,
        price: parsePrice(price),
      };
    }

    // ======== ASOS ========
    if (hostname.includes("asos")) {
      const imageUrl = await page
        .$eval("img.gallery-image", img => img.src)
        .catch(() => null);

      let price = await page
        .$eval("[data-testid='product-price']", el => el.textContent.trim())
        .catch(() => null);

      return {
        url,
        imageUrl,
        price: parsePrice(price),
      };
    }

    // ======== GENERIČKI FALLBACK ========
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
        const match = text.match(/(\d{1,5}[,.]\d{2})\s*(€|EUR)/i);
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

async function scrapeMultiple(urls) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const url of urls) {
    const data = await scrapeSinglePage(page, url);
    results.push(data);
  }

  await browser.close();
  return results;
}

module.exports = scrapeMultiple;

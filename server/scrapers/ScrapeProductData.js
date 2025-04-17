const puppeteer = require("puppeteer");

function parsePrice(priceString) {
  if (!priceString) return null;

  // Nađi broj koji je uz HRK ili €
  const match = priceString.match(/(\d{1,5}(?:[.,]\d{2}))\s*(€|HRK|eur|EUR)/i);
  if (!match) return null;

  let numberStr = match[1];

  // Ako je broj u formatu 1.083,39 (europski), makni točku i zamijeni zarez točkom
  if (numberStr.includes(".") && numberStr.includes(",")) {
    numberStr = numberStr.replace(/\./g, "").replace(",", ".");
  } else {
    numberStr = numberStr.replace(",", ".");
  }

  const parsed = parseFloat(numberStr);
  return isNaN(parsed) ? null : parsed;
}

async function scrapeSinglePage(page, url) {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // === Slika ===
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

    // === Cijena ===
    const priceSelectors = [
      '#our_price_display',       
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

// ❗ Ovo exportamo kao običnu funkciju
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

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

// Util funkcije 
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parsePrice(priceString) {
  if (!priceString) return null;

  // Točka kao decimala
  if (priceString.includes(".") && !priceString.includes(",")) {
    const match = priceString.match(/(\d{1,4}\.\d{2})/);
    if (match) return parseFloat(match[1]);
  }

  // Zarez kao decimala
  if (priceString.includes(",")) {
    const match = priceString.replace(/\./g, "").match(/(\d{1,5},\d{2})/);
    if (match) return parseFloat(match[1].replace(",", "."));
  }

  // Fallback
  const fallback = priceString.replace(/[^\d,\.]/g, "");
  const parsed = parseFloat(fallback);
  return Number.isNaN(parsed) ? null : parsed;
}

async function extractJsonLd(page) {
  return page.evaluate(() => {
    const res = { price: null, image: null };
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent.trim());
        const arr = Array.isArray(data) ? data : [data];
        for (const it of arr) {
          if (it && typeof it === "object") {
            const offers = Array.isArray(it.offers) ? it.offers[0] : it.offers;
            const p = offers?.price || it.price || offers?.priceSpecification?.price;
            if (!res.price && p != null) res.price = String(p);
            if (!res.image && it.image) res.image = Array.isArray(it.image) ? it.image[0] : it.image;
          }
        }
      } catch (_) {}
    }
    return res;
  });
}

async function tryAcceptCookies(page) {
  const quick = [
    "#onetrust-accept-btn-handler",
    "button[aria-label*='Accept']",
    "button[aria-label*='Prihvati']",
    "button[aria-label*='Slažem']",
    "button.fc-cta-consent",
    "#didomi-notice-agree-button",
    "button#didomi-notice-agree-button",
    "button[mode='primary']",
    "button#acceptAllButton",
    "button[aria-label*='Allow']",
  ];
  for (const sel of quick) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click().catch(() => {});
        await delay(400);
        return;
      }
    } catch {}
  }

  try {
    const candidates = await page.$$("button, [role='button']");
    for (const el of candidates) {
      const txt = (await page.evaluate((e) => e.textContent || "", el)).toLowerCase();
      if (/(prihvati|slažem|accept|i agree|allow all|allow)/i.test(txt)) {
        await el.click().catch(() => {});
        await delay(400);
        return;
      }
    }
  } catch {}
}

async function gentleScroll(page) {
  try {
    await page.evaluate(async () => {
      await new Promise((r) => {
        let y = 0;
        const step = 500;
        const id = setInterval(() => {
          window.scrollBy(0, step);
          y += step;
          if (y >= document.body.scrollHeight) {
            clearInterval(id);
            r();
          }
        }, 200);
      });
    });
  } catch {}
}

async function debugSnapshot(page, url, why = "noprice") {
  try {
    const safe = url.replace(/[^a-z0-9]/gi, "_").slice(0, 80);
    const dir = path.join(__dirname, "..", "debug");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const html = await page.content();
    fs.writeFileSync(path.join(dir, `${safe}_${why}.html`), html);
    await page.screenshot({ path: path.join(dir, `${safe}_${why}.png`), fullPage: true });
  } catch {}
}

// Scrape jedne stranice (specifični case-ovi + generički fallback)
async function scrapeSinglePage(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    await tryAcceptCookies(page);
    await delay(800);
    await gentleScroll(page);

    const hostname = new URL(url).hostname;

    // Amazon
    if (hostname.includes("amazon")) {
      await page.waitForSelector("span.a-price .a-offscreen", { timeout: 10000 }).catch(() => null);

      const imageUrl = await page.$eval("#landingImage", (img) => img.src).catch(() => null);

      let priceText = await page
        .$eval("span.a-price .a-offscreen", (el) => el.textContent.trim())
        .catch(() => null);

      const isValidPriceFormat = priceText && /[.,]\d{2}/.test(priceText);
      if (!isValidPriceFormat) {
        console.warn("⚠️ Amazon: Neispravan format cijene, fallback.");
        priceText = await page.evaluate(() => {
          const match = document.body.innerText.match(/(?:€|EUR|\$)?\s?(\d{1,4}[.,]\d{2})/);
          return match ? match[1] : null;
        });
      }

      const price = parsePrice(priceText);
      if (price == null) await debugSnapshot(page, url, "amazon_noprice");
      return { url, imageUrl, price };
    }

    // eBay
    if (hostname.includes("ebay")) {
      const imageUrl = await page.evaluate(() => {
        const img =
          document.querySelector('img[alt*="LEGO"], img[role="presentation"], img[src*="i.ebayimg"]') ||
          document.querySelector("img");
        return img?.src || null;
      });

      const priceText = await page.evaluate(() => {
        const selectors = [
          ".x-price-approx__price",
          ".x-price-approx__value",
          ".display-price",
          ".item-price",
          "span[itemprop='price']",
          "span.ux-textspans",
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && /EUR\s?\d/i.test(el.innerText)) return el.innerText.trim();
        }
        const match = document.body.innerText.match(/(EUR\s?\d{1,4}[.,]\d{2})/i);
        return match ? match[1] : null;
      });

      const price = parsePrice(priceText);
      if (price == null) await debugSnapshot(page, url, "ebay_noprice");
      return { url, imageUrl, price };
    }

    // Zalando
    if (hostname.includes("zalando")) {
      const imageUrl = await page.evaluate(() => {
        const img = document.querySelector("img[fetchpriority='high']") || document.querySelector("img");
        return img?.src || null;
      });

      const priceTxt = await page.evaluate(() => {
        const el = document.querySelector("[data-testid='price']");
        if (el) return el.innerText.replace(/\n/g, " ").trim();
        const match = document.body.innerText.match(/(\d{1,5}[.,]\d{2})\s*(€|EUR)/i);
        return match ? match[0] : null;
      });

      const price = parsePrice(priceTxt);
      if (price == null) await debugSnapshot(page, url, "zalando_noprice");
      return { url, imageUrl, price };
    }

    // ASOS
    if (hostname.includes("asos")) {
      const highResImageUrls = await page.evaluate(() => {
        try {
          const raw = document
            .querySelector("script")
            .textContent.match(/window\.asos\.pdp\.config\.product\s*=\s*(\{.+\});/);
          if (!raw) return [];
          const obj = JSON.parse(raw[1]);
          return obj.images.map((img) => img.url);
        } catch {
          return [];
        }
      });

      const imageUrl =
        highResImageUrls.length
          ? highResImageUrls[0]
          : await page.evaluate(() => document.querySelector("img.gallery-image")?.src || null);

      const priceTxt = await page.evaluate(() => {
        const el = document.querySelector("[data-testid='product-price'], .product-hero-price, .current-price");
        return el?.textContent?.trim() || null;
      });

      const price = parsePrice(priceTxt);
      if (price == null) await debugSnapshot(page, url, "asos_noprice");
      return { url, imageUrl, price };
    }

    // Links
    if (hostname.includes("links.hr")) {
      const ld = await extractJsonLd(page);

      let imageUrl =
        ld.image ||
        (await page.$eval('meta[property="og:image"]', (el) => el.content).catch(() => null)) ||
        (await page.$eval("img[itemprop='image']", (el) => el.src).catch(() => null)) ||
        (await page.$eval(".product-image img", (el) => el.src).catch(() => null));

      let priceText = ld.price;
      if (!priceText) {
        priceText =
          (await page.$eval("[data-price]", (el) => el.getAttribute("data-price")).catch(() => null)) ||
          (await page.$eval('meta[itemprop="price"]', (el) => el.getAttribute("content")).catch(() => null)) ||
          (await page.$eval(".price, .product-price, [itemprop='price']", (el) => el.textContent.trim()).catch(() => null)) ||
          (await page.evaluate(() => {
            const m = document.body.innerText.match(/(\d{1,5}[.,]\d{2})\s*(€|EUR)/i);
            return m ? m[0] : null;
          }));
      }

      const price = parsePrice(priceText);
      if (price == null) await debugSnapshot(page, url, "links_noprice");
      return { url, imageUrl, price };
    }

    // eKupi
    if (hostname.includes("ekupi")) {
      const imageUrl = await page.evaluate(() => {
        const largeImg = document.querySelector("img[data-zoom-image]");
        return largeImg?.getAttribute("data-zoom-image") || null;
      });

      const priceText = await page.evaluate(() => {
        const el = document.querySelector(".product-price, div.price");
        if (el && el.textContent.includes("€")) return el.textContent.trim();
        const match = document.body.innerText.match(/(\d{1,4}[.,]\d{2})\s*€/);
        return match ? match[0] : null;
      });

      const price = parsePrice(priceText);
      if (price == null) await debugSnapshot(page, url, "ekupi_noprice");
      return { url, imageUrl, price };
    }

    // Generički fallback
    let imageUrl = await page.$eval('meta[property="og:image"]', (el) => el.content).catch(() => null);
    if (!imageUrl) {
      imageUrl = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        const filtered = imgs.filter((img) => {
          const src = (img.src || "").toLowerCase();
          const alt = (img.alt || "").toLowerCase();
          return src && !src.includes("logo") && !alt.includes("logo");
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
      '[class*="FinalPriceWrapper"]',
      "[data-price]",
      "[data-price-final]",
      '[data-qa="sale-price"]',
      '[data-qa="product-price"]',
      ".product-price",
      ".price",
      ".price-actual",
      ".price-final",
    ];

    let rawPrice = null;
    for (const selector of priceSelectors) {
      rawPrice = await page.$eval(selector, (el) => el.textContent.trim()).catch(() => null);
      if (rawPrice && rawPrice.length > 1) break;
    }

    if (!rawPrice) {
      rawPrice = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(/(\d{1,5}[.,]\d{2})\s*(€|EUR)/i);
        return match ? match[0] : null;
      });
    }

    const price = parsePrice(rawPrice);
    if (price == null) await debugSnapshot(page, url, "generic_noprice");
    return { url, imageUrl, price };
  } catch (err) {
    console.error(`❌ Greška za ${url}:`, err.message);
    try {
      await debugSnapshot(page, url, "exception");
    } catch {}
    return { url, price: null, imageUrl: null };
  }
}

// Scrape više URL-ova
async function scrapeMultiple(urls) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    "Accept-Language": "hr-HR,hr;q=0.9,en;q=0.8",
  });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 768 });

  const results = [];

  for (const url of urls) {
    const data = await scrapeSinglePage(page, url);
    results.push(data);
  }

  await browser.close();
  return results;
}

module.exports = scrapeMultiple;

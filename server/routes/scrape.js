const express = require("express");
const router = express.Router();
const scrapeProductData = require("../ScrapeProductData");

router.post("/scrape-product", async (req, res) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: "Lista URL-ova je obavezna." });
  }

  let allResults = [];

  for (const url of urls) {
    const result = await scrapeProductData(url);
    allResults.push({ url, ...result });
  }

  // pronađi najmanju cijenu
  const validPrices = allResults.map(r => r.price).filter(p => typeof p === "number");
  const minPrice = validPrices.length ? Math.min(...validPrices) : null;

  // pronađi prvu valjanu sliku (ili null)
  const imageUrl = allResults.find(r => r.imageUrl)?.imageUrl || null;

  res.json({
    imageUrl,
    price: minPrice,
    allResults,
  });
});

module.exports = router;

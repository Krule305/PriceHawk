const express = require("express");
const router = express.Router();
const scrapeProductData = require("../scrapers/ScrapeProductData");

router.post("/scrape-product", async (req, res) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: "Lista URL-ova je obavezna." });
  }

  try {
    const allResults = await scrapeProductData(urls);

    const validPrices = allResults.map(r => r.price).filter(p => typeof p === "number");
    const minPrice = validPrices.length ? Math.min(...validPrices) : null;

    const imageUrl = allResults.find(r => r.imageUrl)?.imageUrl || null;

    res.json({
      imageUrl,
      price: minPrice,
      allResults,
    });
  } catch (err) {
    console.error("Greška u backend route:", err.message);
    res.status(500).json({ error: "Greška kod scrapanja" });
  }
});

module.exports = router;

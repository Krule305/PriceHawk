const router = require('express').Router();
const scrapeMultiple = require('../scrapers/ScrapeProductData');

// POST ruta za pokretanje scrapinga
router.post('/api/scrape', async (req, res) => {
  try {
    // Dohvaćanje URL-ova
    const { urls } = req.body || {};
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'No urls' });
    }

    console.log(' /api/scrape ->', urls);

    // Pokretanje funkcije za scraping više URL-ova
    // Očekuje povratak niza objekata: [{ url, price, imageUrl }]
    const results = await scrapeMultiple(urls);

    // Slanje rezultata nazad klijentu
    res.json(results);
  } catch (e) {
    console.error('/api/scrape error:', e);
    res.status(500).json({ error: 'Scrape failed' });
  }
});

module.exports = router;

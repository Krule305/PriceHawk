const scrapeAllProducts = require("./scrapeCron");

(async () => {
  console.log(`[${new Date().toLocaleString()}] Pokrećem scrapeCron...`);
  await scrapeAllProducts();
  console.log(`[${new Date().toLocaleString()}] Gotovo.`);
  process.exit(0);
})().catch(err => {
  console.error("Greška:", err);
  process.exit(1);
});

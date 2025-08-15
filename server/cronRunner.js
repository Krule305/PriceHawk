const scrapeAllProducts = require("./scrapeCron");

(async () => {
  const now = new Date().toLocaleString();
  console.log(`[${now}] Pokrećem scrapeCron...`);
  await scrapeAllProducts();
  console.log(`[${new Date().toLocaleString()}] Gotovo.`);
  process.exit(0); // VAŽNO: zatvori proces nakon jedne runde
})().catch(err => {
  console.error(`[${new Date().toLocaleString()}] Greška:`, err);
  process.exit(1);
});

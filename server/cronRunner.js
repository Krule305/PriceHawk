const scrapeAllProducts = require("./scrapeCron");
const cron = require("node-cron");

function logWithTimestamp(message) {
  const now = new Date().toLocaleString();
  console.log(`[${now}] ${message}`);
}

// Pokreni odmah pri startu
(async () => {
  logWithTimestamp(" Prvo pokretanje scrapeCron...");
  await scrapeAllProducts();
})();

// Cron job – u 08:00 i 20:00
cron.schedule("0 8,20 * * *", async () => {
  logWithTimestamp("Pokrećem scrapeCron...");
  await scrapeAllProducts();
});

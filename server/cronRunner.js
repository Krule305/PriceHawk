const scrapeAllProducts = require("./scrapeCron");

function logWithTimestamp(message) {
  const now = new Date().toLocaleString();
  console.log(`[${now}] ${message}`);
}

async function runScraperPeriodically() {
  logWithTimestamp("🔄 Pokrećem scrapeCron...");
  await scrapeAllProducts();
  setTimeout(runScraperPeriodically, 3 * 60 * 1000);
}

logWithTimestamp("✅ Cron servis pokrenut...");
runScraperPeriodically();

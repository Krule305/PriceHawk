const admin = require("firebase-admin");
const scrapeUrls = require("./scrapers/ScrapeProductData");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function scrapeAllProducts() {
  const usersSnapshot = await db.collection("users").get();

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const productsRef = db.collection("users").doc(userId).collection("products");
    const productsSnapshot = await productsRef.get();

    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;

      try {
        const urls = Array.isArray(product.urls) ? product.urls : [];

        if (urls.length === 0) {
          console.warn(`⚠️ Proizvod "${product.name}" nema ispravne URL-ove. Preskačem.`);
          continue;
        }

        const scrapedResults = await scrapeUrls(urls);

        const validPrices = scrapedResults.filter(r => r.price !== null);
        const lowest = validPrices.reduce((min, curr) => curr.price < min.price ? curr : min, validPrices[0]);

        const updatedData = {
          scrapedPrice: lowest?.price || null,
          imageUrl: lowest?.imageUrl || null,
          updatedAt: new Date(),
        };

        await productsRef.doc(productId).update(updatedData);

        console.log(`✅ Ažurirano: ${product.name} (${userId}) - ${lowest?.price} €`);

      } catch (err) {
        console.error(`❌ Greška kod proizvoda "${product.name}":`, err.message);
      }
    }
  }
}

module.exports = scrapeAllProducts;

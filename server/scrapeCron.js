const admin = require("firebase-admin");
const scrapeUrls = require("./scrapers/ScrapeProductData");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Inicijalizacija Firebase Admin SDK-a 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Ako aplikacija već nije inicijalizirana, inicijaliziraj
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

const { maybeNotifyDrop } = require("./services/priceAlert");

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u || ""; }
}

// Glavna funkcija za scraping svih proizvoda iz svih korisnika
async function scrapeAllProducts() {
  // Dohvati sve korisnike iz Firestore-a
  const usersSnapshot = await db.collection("users").get();

  // Iteriraj kroz svakog korisnika
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userEmail = userDoc.get("email");

    // Dohvati sve proizvode tog korisnika
    const productsRef = db.collection("users").doc(userId).collection("products");
    const productsSnapshot = await productsRef.get();

    // Iteriraj kroz svaki proizvod
    for (const productDoc of productsSnapshot.docs) {
      const product = productDoc.data();
      const productId = productDoc.id;

      try {
        // Provjeri ima li proizvod URL-ove
        const urls = Array.isArray(product.urls) ? product.urls : [];
        if (urls.length === 0) {
          console.warn(`⚠️ "${product.name}" nema URL-ove. Preskačem.`);
          continue;
        }

        // Pokreni scraping za sve URL-ove proizvoda
        const scrapedResults = await scrapeUrls(urls);

        // Osiguraj da svaki rezultat ima .url polje (ako nedostaje, uzmi iz originalnog niza)
        const results = (scrapedResults || []).map((r, i) => ({
          ...(r || {}),
          url: r?.url ?? urls[i] ?? null,
        }));

        // Filtriraj samo rezultate s valjanom cijenom
        const valid = results.filter(r => r && r.price != null);

        // Ako nema valjanih cijena, samo ažuriraj vrijeme zadnje provjere i preskoči
        if (valid.length === 0) {
          await productsRef.doc(productId).update({ updatedAt: new Date() });
          console.warn(` Nije pronađena cijena za "${product.name}" (${userId}).`);
          continue;
        }

        // Odredi najnižu cijenu, prvu valjanu sliku i URL te trgovine
        const lowest = valid.reduce((min, curr) => (curr.price < min.price ? curr : min), valid[0]);
        const firstImage = valid.find(v => !!v.imageUrl)?.imageUrl || null;
        const bestUrl = lowest.url || null;

        // Podaci za ažuriranje u bazi
        const updatedData = {
          scrapedPrice: lowest.price,
          imageUrl: firstImage,
          bestUrl,
          updatedAt: new Date(),
        };

        // Spremi u Firestore
        await productsRef.doc(productId).update(updatedData);

        console.log(`Ažurirano: ${product.name} (${userId}) - ${lowest.price} € @ ${hostOf(bestUrl)}`);

        //  Provjeri treba li poslati email obavijest o padu cijene
        await maybeNotifyDrop({
          userId,
          productId,
          userEmail,
          product: { ...product, ...updatedData },
        });

      } catch (err) {
        console.error(`Greška kod "${product.name}":`, err?.message || err);
      }
    }
  }
}

module.exports = scrapeAllProducts;
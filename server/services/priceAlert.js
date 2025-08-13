const admin = require("firebase-admin");
const { sendMail } = require("./mailer");

// Pragovi i intervali za ponovno slanje
const MIN_DROP_ABS = 1.00;
const MIN_DROP_PCT = 5;
const COOLDOWN_HOURS = 24;

// Helper funkcije
function toMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

function isSignificantDrop(newPrice, lastNotifiedPrice) {
  if (lastNotifiedPrice == null) return true; // prvi put
  const absDrop = lastNotifiedPrice - newPrice;
  if (absDrop <= 0) return false;
  const pctDrop = (absDrop / lastNotifiedPrice) * 100;
  return absDrop >= MIN_DROP_ABS || pctDrop >= MIN_DROP_PCT;
}

function shopName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Trgovina";
  }
}

// Glavna funkcija – provjera uvjeta i eventualno slanje obavijesti
async function maybeNotifyDrop({ userId, productId, product, userEmail }) {
  const db = admin.firestore();

  const {
    name,
    targetPrice,
    scrapedPrice,
    imageUrl,
    bestUrl,
    lastNotifiedAt,
    lastNotifiedPrice,
  } = product;

  // Validacija ulaza 
  if (scrapedPrice == null || targetPrice == null) return;
  if (scrapedPrice >= targetPrice) return;

  // Cooldown provjera
  const now = Date.now();
  if (lastNotifiedAt && (now - toMs(lastNotifiedAt)) < COOLDOWN_HOURS * 3600_000) return;

  // Provjera značajnog pada
  if (!isSignificantDrop(scrapedPrice, lastNotifiedPrice)) return;

  if (!userEmail) return;

  // Priprema emaila 
  const store = bestUrl ? shopName(bestUrl) : null;
  const linkHtml = bestUrl
    ? `<p>Najpovoljnije: <a href="${bestUrl}" target="_blank" rel="noopener noreferrer">${store}</a></p>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>🔔 Cijena je pala ispod tvoje željene</h2>
      <p><strong>${name}</strong></p>
      <p>Trenutna najniža cijena: <strong>${scrapedPrice.toFixed(2)} €</strong><br/>
         Tvoja željena cijena: <strong>${targetPrice.toFixed(2)} €</strong></p>
      ${imageUrl ? `<img src="${imageUrl}" alt="${name}" style="max-width:280px;display:block;margin:12px 0"/>` : ""}
      ${linkHtml}
      <hr/>
      <small>Obavijest iz aplikacije PriceHawk.</small>
    </div>`;

  // Slanje emaila
  await sendMail({
    to: userEmail,
    subject: `🔔 ${name} je pao ispod ${targetPrice.toFixed(2)} €${store ? " @ " + store : ""}`,
    html,
  });

  // Ažuriranje Firestorea
  await db.collection("users").doc(userId)
    .collection("products").doc(productId)
    .update({
      lastNotifiedAt: new Date(),
      lastNotifiedPrice: scrapedPrice,
    });
}

module.exports = { maybeNotifyDrop };

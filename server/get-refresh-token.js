// get-refresh-token.js
require("dotenv").config();
const express = require("express");
const { google } = require("googleapis");
const url = require("url");

// ✅ ESM-friendly "open"
async function openInBrowser(href) {
  try {
    const mod = await import("open");
    await mod.default(href);
  } catch {
    console.log("👉 Otvori ručno ovaj URL u pregledniku:\n", href, "\n");
  }
}

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GMAIL_USER,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.error("❌ Nedostaju GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI u .env");
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Scope dovoljan za slanje mailova u ime GMAIL_USER
const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

async function main() {
  // 1) Pokreni lokalni server da primi redirect
  const { port, pathname } = new url.URL(GOOGLE_REDIRECT_URI);
  const app = express();

  const server = app.listen(port, () => {
    console.log(`➡️  Slušam na ${GOOGLE_REDIRECT_URI} (čekam Google redirect)`);
  });

  // 2) Ruta koja hvata ?code=...
  app.get(pathname, async (req, res) => {
    const code = req.query.code;
    if (!code) {
      res.status(400).send("Nedostaje 'code' u queryju.");
      return;
    }

    try {
      const { tokens } = await oAuth2Client.getToken(code);
      console.log("\n ACCESS_TOKEN:", tokens.access_token || "(dobiven)")
      console.log(" REFRESH_TOKEN:", tokens.refresh_token);
      console.log("\n  Spremi REFRESH_TOKEN u .env kao GMAIL_REFRESH_TOKEN\n");

      res.send("Gotovo! Možeš zatvoriti ovaj prozor. Refresh token je ispisan u konzoli.");
    } catch (err) {
      console.error("Greška pri razmjeni code->token:", err.message);
      res.status(500).send("Greška pri dobivanju tokena.");
    } finally {
      setTimeout(() => server.close(() => process.exit(0)), 500);
    }
  });

  // 3) Generiraj Google consent URL i otvori u pregledniku
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",     // tražimo refresh_token
    prompt: "consent",          // forsiraj refresh_token i ako si već dao consent
    scope: SCOPES,
    login_hint: GMAIL_USER || undefined,
  });

  console.log("\n Otvaram Google consent u pregledniku...");
  console.log(authorizeUrl, "\n");
  await openInBrowser(authorizeUrl);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

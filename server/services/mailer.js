require("dotenv").config();
const { google } = require("googleapis");

// env varijable
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GMAIL_SENDER,
  GMAIL_SENDER_NAME,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !GMAIL_SENDER) {
  throw new Error(
    "Missing env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GMAIL_SENDER"
  );
}

// OAuth2 klijent i Gmail API
const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

function toBase64Url(str) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodeHeader(value = "") {
  return /[^\x20-\x7E]/.test(value)
    ? `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
    : value;
}

// Sastavljanje poruke
function buildRawMessage({ from, to, cc, bcc, replyTo, subject, text, html }) {
  const fromHeader = GMAIL_SENDER_NAME ? `${GMAIL_SENDER_NAME} <${from}>` : from;

  const headers = [
    `From: ${fromHeader}`,
    `To: ${Array.isArray(to) ? to.join(", ") : to}`,
    cc ? `Cc: ${Array.isArray(cc) ? cc.join(", ") : cc}` : null,
    bcc ? `Bcc: ${Array.isArray(bcc) ? bcc.join(", ") : bcc}` : null,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeHeader(subject || "")}`,
    `MIME-Version: 1.0`,
    html
      ? `Content-Type: text/html; charset="UTF-8"`
      : `Content-Type: text/plain; charset="UTF-8"`,
  ]
    .filter(Boolean)
    .join("\r\n");

  const body = html || text || "";
  return toBase64Url(`${headers}\r\n\r\n${body}`);
}

// Slanje emaila preko Gmail API-ja
async function sendMail({ to, subject, html, text, cc, bcc, replyTo }) {
  if (!to) throw new Error("sendMail: 'to' is required");

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const raw = buildRawMessage({
    from: GMAIL_SENDER,
    to,
    cc,
    bcc,
    replyTo,
    subject,
    html,
    text,
  });

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

// Dohvat access tokena)
async function verifyAuth() {
  const { token } = await oauth2.getAccessToken();
  if (!token) throw new Error("Failed to obtain Gmail access token");
  return true;
}

module.exports = { sendMail, verifyAuth };

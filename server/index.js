require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(require('./routes/scrape'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/chrome-path", (req, res) => {
  const p = process.env.PUPPETEER_EXECUTABLE_PATH || "";
  const exists = p ? fs.existsSync(p) : false;
  res.json({ envPath: p || null, existsEnvPath: exists });
});

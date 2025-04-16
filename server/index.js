const express = require("express");
const cors = require("cors");
const scrapeRoutes = require("./routes/scrape");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// koristi scrape route
app.use("/api", scrapeRoutes);

app.listen(PORT, () => {
  console.log(`Server radi na http://localhost:${PORT}`);
});

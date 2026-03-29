const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

let balance = 100;
let btc = 0;

// SAFE price fetch
async function getPrice() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    return res.data.bitcoin.usd;
  } catch (err) {
    console.log("Price error:", err.message);
    return null;
  }
}

// BOT LOGIC
async function runBot() {
  const price = await getPrice();

  if (!price) {
    return { error: "Price unavailable" };
  }

  if (price < 60000 && balance > 10) {
    const amount = balance * 0.1;
    btc += amount / price;
    balance -= amount;
  }

  if (price > 70000 && btc > 0) {
    balance += btc * price;
    btc = 0;
  }

  return {
    price,
    balance: balance.toFixed(2),
    btc: btc.toFixed(6),
  };
}

// LOOP (never crash)
setInterval(async () => {
  try {
    await runBot();
  } catch (e) {
    console.log("Bot error:", e.message);
  }
}, 15000);

// API
app.get("/", async (req, res) => {
  const data = await runBot();
  res.json(data);
});

app.listen(PORT, () => console.log("Bot running"));

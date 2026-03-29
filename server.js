const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

let balance = 100;
let btc = 0;

async function getPrice() {
  const res = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
  );
  return res.data.bitcoin.usd;
}

async function runBot() {
  const price = await getPrice();

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

setInterval(runBot, 15000);

app.get("/", async (req, res) => {
  res.json(await runBot());
});

app.listen(PORT, () => console.log("Bot running"));

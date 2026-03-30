import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// simple memory
let lastPrice = 0;

async function getSolPrice() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
  );
  const data = await res.json();
  return data.solana.usd;
}

// loop
setInterval(async () => {
  try {
    const price = await getSolPrice();

    console.log("SOL price:", price);

    // simple logic example
    if (lastPrice && price < lastPrice * 0.98) {
      console.log("BUY SIGNAL 📉");
    }

    if (lastPrice && price > lastPrice * 1.02) {
      console.log("SELL SIGNAL 📈");
    }

    lastPrice = price;
  } catch (err) {
    console.log("Error:", err.message);
  }
}, 10000);

// api for your phone later
app.get("/", (req, res) => {
  res.json({ status: "Bot running 🚀", lastPrice });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

import express from "express";

const app = express();

// ===== GET SOLANA PRICE FROM DEXSCREENER =====
async function getSolPrice() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112"
    );

    const data = await res.json();

    console.log("DEX RESPONSE:", data);

    // take first pair price
    const price = data?.pairs?.[0]?.priceUsd;

    return price ? Number(price) : 0;

  } catch (err) {
    console.log("Error fetching SOL price:", err);
    return 0;
  }
}

// ===== MAIN ROUTE =====
app.get("/", async (req, res) => {
  const price = await getSolPrice();

  res.json({
    status: "Bot running 🚀",
    solanaPrice: price,
    time: new Date()
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// ================= SOL PRICE =================
async function getSolPrice() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112"
    );
    const data = await res.json();

    if (!data.pairs || data.pairs.length === 0) return 0;

    return parseFloat(data.pairs[0].priceUsd);
  } catch (err) {
    console.log("SOL price error:", err.message);
    return 0;
  }
}

// ================= MEMECOINS =================
async function getMemecoins() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search/?q=solana"
    );

    const data = await res.json();

    if (!data.pairs) return [];

    const coins = data.pairs
      .filter((p) =>
        p.chainId === "solana" &&
        p.baseToken &&
        p.priceUsd &&
        p.liquidity?.usd > 500 &&
        p.volume?.h24 > 100
      )
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, 10)
      .map((p) => ({
        name: p.baseToken.name,
        symbol: p.baseToken.symbol,
        price: Number(p.priceUsd),
        volume24h: p.volume?.h24 || 0,
        liquidity: p.liquidity?.usd || 0,
      }));

    return coins;
  } catch (err) {
    console.log("Memecoin error:", err.message);
    return [];
  }
}

// ================= ROUTES =================

// Root (fixes "Cannot GET /")
app.get("/", (req, res) => {
  res.send("🚀 Sniper bot is running!");
});

// Data endpoint
app.get("/data", async (req, res) => {
  const solPrice = await getSolPrice();
  const memecoins = await getMemecoins();

  res.json({
    status: "Sniper bot running 🚀",
    solanaPrice: solPrice,
    memecoins: memecoins,
    time: new Date().toISOString(),
  });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

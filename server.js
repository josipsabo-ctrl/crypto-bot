import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Get SOL price
async function getSolanaPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const data = await res.json();
    return data.solana?.usd || 0;
  } catch (err) {
    console.log("Solana error:", err);
    return 0;
  }
}

// ✅ Get memecoins (filtered, no SOL)
async function getMemecoins() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=usd"
    );

    const text = await res.text();

    // ❌ avoid HTML crash
    if (text.startsWith("<")) {
      console.log("Dexscreener returned HTML");
      return [];
    }

    const data = JSON.parse(text);

    return data.pairs
      ?.filter(
        (p) =>
          p.chainId === "solana" &&
          p.baseToken.symbol !== "SOL" &&
          p.liquidity?.usd > 10000 &&
          p.volume?.h24 > 5000
      )
      .slice(0, 5)
      .map((p) => ({
        name: p.baseToken.name,
        symbol: p.baseToken.symbol,
        price: p.priceUsd,
        volume24h: p.volume.h24,
        liquidity: p.liquidity.usd,
      })) || [];
  } catch (err) {
    console.log("Memecoin error:", err);
    return [];
  }
}

// ✅ ROOT ROUTE (IMPORTANT)
app.get("/", async (req, res) => {
  const solanaPrice = await getSolanaPrice();
  const memecoins = await getMemecoins();

  res.json({
    status: "Sniper bot running 🚀",
    solanaPrice,
    memecoins,
    time: new Date().toISOString(),
  });
});

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Solana price
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

// 🔹 Memecoins
async function getMemecoins() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=usd"
    );

    const data = await res.json();

    return data.pairs
      ?.filter((p) =>
        p.chainId === "solana" &&
        p.baseToken.symbol !== "SOL" &&   // ❌ remove SOL
        p.liquidity?.usd > 10000 &&       // 💧 real liquidity
        p.volume?.h24 > 5000              // 🔥 active trading
      )
      .slice(0, 5)
      .map((p) => ({
        name: p.baseToken.name,
        symbol: p.baseToken.symbol,
        price: p.priceUsd,
        volume24h: p.volume.h24,
      })) || [];

  } catch (err) {
    console.log("Memecoin error:", err);
    return [];
  }
}

// 🔹 Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

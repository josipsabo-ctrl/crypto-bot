import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Fetch SOL price
async function getSolPrice() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112"
    );
    const data = await res.json();

    const pair = data.pairs?.[0];
    return pair?.priceUsd ? parseFloat(pair.priceUsd) : 0;
  } catch (err) {
    console.log("SOL price error:", err.message);
    return 0;
  }
}

// ✅ Fetch MEMECOINS (WORKING FILTER)
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
      .sort((a, b) => b.volume.h24 - a.volume.h24)
      .slice(0, 10)
      .map((p) => ({
        name: p.baseToken.name,
        symbol: p.baseToken.symbol,
        price: parseFloat(p.priceUsd),
        volume24h: p.volume.h24,
        liquidity: p.liquidity.usd,
      }));

    return coins;
  } catch (err) {
    console.log("Memecoin error:", err.message);
    return [];
  }
}

// ✅ ROOT ROUTE (fixes "Cannot GET /")
app.get("/", (req, res

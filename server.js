import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 GET DATA FROM DEXSCREENER (SOL + MEMECOINS)
async function getMarketData() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=SOL",
      {
        headers: {
          accept: "application/json",
        },
      }
    );

    const data = await res.json();

    if (!data.pairs) return { solPrice: 0, memecoins: [] };

    // ✅ SOL PRICE (from first strong pair)
    const solPair = data.pairs.find(
      (p) =>
        p.baseToken.symbol === "SOL" &&
        p.quoteToken.symbol === "USDC"
    );

    const solPrice = solPair?.priceUsd || 0;

    // ✅ REAL MEMECOINS FILTER
    const memecoins = data.pairs
      .filter((p) =>
        p.chainId === "solana" &&
        p.baseToken.symbol !== "SOL" && // ❌ remove SOL
        p.liquidity?.usd > 20000 &&
        p.volume?.h24 > 10000
      )
      .slice(0, 5)
      .map((p) => ({
        name: p.baseToken.name,
        symbol: p.baseToken.symbol,
        price: p.priceUsd,
        volume24h: p.volume.h24,
        liquidity: p.liquidity.usd,
      }));

    return { solPrice, memecoins };

  } catch (err) {
    console.log("Market error:", err);
    return { solPrice: 0, memecoins: [] };
  }
}

// ✅ ROUTE
app.get("/", async (req, res) => {
  const { solPrice, memecoins } = await getMarketData();

  res.json({
    status: "Sniper bot running 🚀",
    solanaPrice: solPrice,
    memecoins,
    time: new Date().toISOString(),
  });
});

// ✅ START
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

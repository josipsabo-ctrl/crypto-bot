import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ MAIN FUNCTION
async function getMarketData() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=sol",
      {
        headers: { accept: "application/json" },
      }
    );

    const data = await res.json();

    if (!data || !data.pairs) {
      return { solPrice: 0, memecoins: [] };
    }

    // ✅ SOL PRICE
    const solPair = data.pairs.find(
      (p) =>
        p.baseToken?.symbol === "SOL" &&
        p.quoteToken?.symbol === "USDC"
    );

    const solPrice = solPair?.priceUsd || 0;

    // ✅ MEMECOINS
    const memecoins = data.pairs
      .filter((p) =>
        p.chainId === "solana" &&
        p.baseToken?.symbol !== "SOL" &&
        p.liquidity?.usd > 5000 &&
        p.volume?.h24 > 1000
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
    console.log("Error:", err);
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

// ✅ HEALTH CHECK
app.get("/health", (req, res) => {
  res.send("OK");
});

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

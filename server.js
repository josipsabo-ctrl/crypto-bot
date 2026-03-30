import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ FIXED SOL PRICE (with headers)
async function getSolanaPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      {
        headers: {
          "accept": "application/json",
        },
      }
    );

    const data = await res.json();

    console.log("SOL RAW:", data); // DEBUG

    return data?.solana?.usd || 0;
  } catch (err) {
    console.log("Solana error:", err);
    return 0;
  }
}

// ✅ FIXED MEMECOINS (proper headers + validation)
async function getMemecoins() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=solana",
      {
        headers: {
          "accept": "application/json",
        },
      }
    );

    const text = await res.text(); // 🔥 IMPORTANT
    const data = JSON.parse(text);

    console.log("DEX RAW OK");

    return data.pairs
      ?.filter((p) =>
        p.chainId === "solana" &&
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
      })) || [];

  } catch (err) {
    console.log("Memecoin error:", err);
    return [];
  }
}

// ✅ ROUTE
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

// ✅ START
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from "express";

const app = express();

// ===== GET SOL PRICE =====
async function getMemecoins() {
  try {
    const url = "https://api.dexscreener.com/latest/dex/search?q=solana";

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    // 🔍 DEBUG: check response type
    const text = await res.text();

    // ❗ If HTML → log it
    if (text.startsWith("<")) {
      console.log("❌ Got HTML instead of JSON:");
      console.log(text.slice(0, 200));
      return [];
    }

    const data = JSON.parse(text);

    const coins = data.pairs
      ?.filter(p =>
        p.chainId === "solana" &&
        p.liquidity?.usd > 5000 &&
        p.volume?.h24 > 1000
      )
      .slice(0, 5)
      .map(p => ({
        name: p.baseToken.name,
        symbol: p.baseToken.symbol,
        price: p.priceUsd,
        volume24h: p.volume.h24,
        liquidity: p.liquidity.usd
      })) || [];

    return coins;

  } catch (err) {
    console.log("Memecoin error:", err);
    return [];
  }
}

// ===== GET TRENDING MEMECOINS =====
async function getMemecoins() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/pairs/solana"
    );

    const data = await res.json();

    // filter strong tokens
    const coins = data.pairs
      .filter(p =>
        p.liquidity?.usd > 10000 &&     // liquidity filter
        p.volume?.h24 > 5000 &&         // volume filter
        p.priceUsd &&
        p.baseToken?.name
      )
      .slice(0, 5) // top 5

      .map(p => ({
        name: p.baseToken.name,
        symbol: p.baseToken.symbol,
        price: p.priceUsd,
        volume24h: p.volume.h24,
        liquidity: p.liquidity.usd
      }));

    return coins;

  } catch (err) {
    console.log("Memecoin error:", err);
    return [];
  }
}

// ===== MAIN ROUTE =====
app.get("/", async (req, res) => {
  const solPrice = await getSolPrice();
  const coins = await getMemecoins();

  res.json({
    status: "Sniper bot running 🚀",
    solanaPrice: solPrice,
    memecoins: coins,
    time: new Date()
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ GET SOLANA PRICE (Coingecko)
async function getSolanaPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );

    const data = await res.json();

    return data.solana?.usd || 0;
  } catch (err) {
    console.log("Solana price error:", err);
    return 0;
  }
}

// ✅ GET MEMECOINS FROM DEXSCREENER
async function getMemecoins() {
  try {
    const url =
      "https://api.dexscreener.com/latest/dex/search?q=solana";

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    const text = await res.text();

    // ❌ If API returns HTML instead of JSON
    if (text.startsWith("<")) {
      console.log("❌ Dexscreener returned HTML");
      return [];
    }

    const data = JSON.parse(text);

    const coins =
      data.pairs
        ?.filter(
          (p) =>
            p.chainId === "solana" &&
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
        })) || [];

    return coins;
  } catch (err) {
    console.log("Memecoin error:", err);
    return [];
  }
}

// ✅ MAIN ROUTE
app.get("/", async (req, res) => {
  const solanaPrice = await getSolanaPrice();
  const memecoins = await getMemecoins();

  res.json({
    status: "Sniper bot running 🚀",
    solanaPrice,
    memecoins,

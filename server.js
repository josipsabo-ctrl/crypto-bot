import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ SAFE FETCH (never crash)
async function safeFetch(url) {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
    });

    const text = await res.text();

    if (!text.startsWith("{")) {
      console.log("❌ Not JSON:", text.slice(0, 100));
      return null;
    }

    return JSON.parse(text);
  } catch (err) {
    console.log("Fetch error:", err);
    return null;
  }
}

// ✅ MAIN DATA FUNCTION
async function getMarketData() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/pairs/solana",
      {
        headers: { accept: "application/json" },
      }
    );

    const data = await res.json();

    if (!data.pairs) {
      return { solPrice: 0, memecoins: [] };
    }

    // ✅ SOL PRICE
    const solPair = data.pairs.find(
      (p) =>
        p.baseToken?.symbol === "SOL" &&
        p.quoteToken?.symbol === "USDC"
    );

    const solPrice = solPair?.priceUsd || 0;

    // ✅ MEMECOINS (MUCH BETTER FILTER)
    const memecoins = data.pairs
      .filter((p) =>
        p.chainId === "solana" &&
        p.baseToken?.symbol !== "SOL" &&
        p.liquidity?.usd > 10000 &&
        p.volume?.h24 > 5000 &&
        p.priceUsd > 0
      )
      .slice(0, 10)
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
    // ✅ MEMECOINS (RELAXED FILTER)
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
    console.log("Market error:", err);
    return { solPrice: 0, memecoins: [] };
  }
}

// ✅ ROUTE (never crash)
app.get("/", async (req, res) => {
  try {
    const { solPrice, memecoins } = await getMarketData();

    res.json({
      status: "Sniper bot running 🚀",
      solanaPrice: solPrice,
      memecoins,
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      status: "Error but still alive ⚠️",
      error: err.message,
    });
  }
});

// ✅ IMPORTANT (keeps Render alive)
app.get("/health", (req, res) => {
  res.send("OK");
});

// ✅ START SERVER (CRITICAL)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

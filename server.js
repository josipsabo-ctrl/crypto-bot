async function getMarketData() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/solana",
      {
        headers: { accept: "application/json" },
      }
    );

    const data = await res.json();

    if (!data.pairs) return { solPrice: 0, memecoins: [] };

    // ✅ SOL PRICE
    const solPair = data.pairs.find(
      (p) =>
        p.baseToken.symbol === "SOL" &&
        p.quoteToken.symbol === "USDC"
    );

    const solPrice = solPair?.priceUsd || 0;

    // ✅ REAL MEMECOINS
    const memecoins = data.pairs
      .filter((p) =>
        p.chainId === "solana" &&
        p.baseToken.symbol !== "SOL" &&
        p.liquidity?.usd > 10000 &&
        p.volume?.h24 > 5000
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

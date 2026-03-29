const express = require("express");
const axios = require("axios");
const { RSI } = require("technicalindicators");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== AI SETUP =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing",
});

// ===== ACCOUNT =====
let balance = 100;
let btc = 0;

// ===== GET PRICE HISTORY (STABLE + FALLBACK) =====
async function getHistory() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart",
      {
        params: {
          vs_currency: "usd",
          days: "1",
        },
        timeout: 5000,
      }
    );

    if (!res.data.prices) return [];

    return res.data.prices.map(p => p[1]);

  } catch (err) {
    console.log("Main API failed, using fallback...");

    try {
      const res = await axios.get(
        "https://api.coindesk.com/v1/bpi/currentprice.json"
      );

      const price = res.data.bpi.USD.rate_float;

      // fake history for RSI
      return Array(50).fill(price);

    } catch (err2) {
      console.log("Fallback failed:", err2.message);
      return [];
    }
  }
}

// ===== AI DECISION =====
async function aiDecision(price, rsi) {
  try {
    const prompt = `
You are a professional crypto trader.

Price: ${price}
RSI: ${rsi}

Decide: buy, sell, or hold.

Return JSON:
{"action":"buy|sell|hold","confidence":0-100}
`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return JSON.parse(res.choices[0].message.content);

  } catch (err) {
    console.log("AI error:", err.message);
    return { action: "hold", confidence: 0 };
  }
}

// ===== MAIN BOT =====
async function runBot() {
  const prices = await getHistory();

  if (!prices || prices.length < 20) {
    return { error: "Waiting for data..." };
  }

  const price = prices[prices.length - 1];

  const rsiArr = RSI.calculate({
    period: 14,
    values: prices.slice(-50),
  });

  const rsi = rsiArr[rsiArr.length - 1];

  if (!rsi) {
    return { error: "RSI unavailable" };
  }

  const ai = await aiDecision(price, rsi);

  // ===== TRADE LOGIC =====
  if (ai.confidence > 70) {
    if (ai.action === "buy" && balance > 10) {
      const amount = balance * 0.1;
      btc += amount / price;
      balance -= amount;
    }

    if (ai.action === "sell" && btc > 0) {
      balance += btc * price;
      btc = 0;
    }
  }

  return {
    price,
    rsi: rsi.toFixed(2),
    ai_action: ai.action,
    confidence: ai.confidence,
    balance: balance.toFixed(2),
    btc: btc.toFixed(6),
  };
}

// ===== LOOP (SAFE) =====
setInterval(async () => {
  try {
    await runBot();
  } catch (err) {
    console.log("Bot error:", err.message);
  }
}, 20000);

// ===== API =====
app.get("/", async (req, res) => {
  const data = await runBot();
  res.json(data);
});

app.listen(PORT, () => console.log("Bot running"));

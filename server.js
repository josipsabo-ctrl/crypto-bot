const express = require("express");
const axios = require("axios");
const { RSI } = require("technicalindicators");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// AI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// account
let balance = 100;
let btc = 0;

// get price history
async function getHistory() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7"
    );
    return res.data.prices.map(p => p[1]);
  } catch (err) {
    console.log("History error:", err.message);
    return [];
  }
}

// AI decision
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

// main bot
async function runBot() {
  const prices = await getHistory();

  if (!prices || prices.length < 20) {
    return { error: "Not enough data" };
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

  // trade only if strong confidence
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

// loop
setInterval(async () => {
  try {
    await runBot();
  } catch (err) {
    console.log("Bot error:", err.message);
  }
}, 20000);

// API
app.get("/", async (req, res) => {
  const data = await runBot();
  res.json(data);
});

app.listen(PORT, () => console.log("Bot running"));

import express from "express";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

// ✅ FIX: no node-fetch needed (Node 18+ has fetch)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let balance = 100;
let btc = 0;

// ✅ GET BTC PRICE
async function getBTCPrice() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    const data = await res.json();
    return parseFloat(data.price);
  } catch (err) {
    console.log("Price error:", err.message);
    return null;
  }
}

// ✅ AI DECISION
async function getAIAdvice(price) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing API key");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a crypto trading AI. Respond ONLY JSON like {\"action\":\"buy\",\"confidence\":80}"
        },
        {
          role: "user",
          content: `BTC price is ${price}`
        }
      ]
    });

    const text = response.choices[0].message.content;
    return JSON.parse(text);

  } catch (err) {
    console.log("AI ERROR:", err.message);
    return { action: "hold", confidence: 0 };
  }
}

// ✅ ROUTE
app.get("/", async (req, res) => {
  const price = await getBTCPrice();

  if (!price) {
    return res.json({ error: "Price unavailable" });
  }

  const ai = await getAIAdvice(price);

  if (ai.action === "buy" && balance > 0) {
    btc = balance / price;
    balance = 0;
  }

  if (ai.action === "sell" && btc > 0) {
    balance = btc * price;
    btc = 0;
  }

  res.json({
    price,
    ai_action: ai.action,
    confidence: ai.confidence,
    balance,
    btc
  });
});

// ✅ START SERVER
app.listen(port, () => {
  console.log("Bot running on port", port);
});

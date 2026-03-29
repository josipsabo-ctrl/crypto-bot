import express from "express";
import fetch from "node-fetch";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

// ✅ INIT OPENAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // <-- THIS IS CRITICAL
});

let balance = 100;
let btc = 0;

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

async function getAIAdvice(price) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("API KEY NOT FOUND");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a crypto trading AI. Answer only JSON: {action: buy/sell/hold, confidence: 0-100}"
        },
        {
          role: "user",
          content: `BTC price is ${price}. What should I do?`
        }
      ],
    });

    const text = response.choices[0].message.content;
    return JSON.parse(text);
  } catch (err) {
    console.log("AI ERROR:", err.message);
    return { action: "hold", confidence: 0 };
  }
}

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
    btc,
  });
});

app.listen(port, () => {
  console.log("Bot running on port", port);
});

import express from "express";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let balance = 100;
let btc = 0;

// COINGECKO PRICE
async function getBTCPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    const data = await res.json();
    return data.bitcoin.usd;
  } catch (err) {
    console.log("Price error:", err.message);
    return null;
  }
}

// AI
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
          content: "Return ONLY JSON like {\"action\":\"buy\",\"confidence\":80}"
        },
        {
          role: "user",
          content: `BTC price is ${price}`
        }
      ]
    });

    return JSON.parse(response.choices[0].message.content);

  } catch (err) {
    console.log("AI ERROR:", err.message);
    return { action: "hold", confidence: 0 };
  }
}

// ROUTE
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

app.listen(port, () => {
  console.log("Bot running on port", port);
});

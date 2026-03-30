import express from "express";
import fetch from "node-fetch";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 10000;

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get BTC price from CoinGecko
async function getPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    const data = await res.json();
    return data.bitcoin.usd;
  } catch (err) {
    return null;
  }
}

// AI decision
async function getAI(price) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Bitcoin price is ${price}. Should I buy, sell or hold? Answer short.`,
        },
      ],
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.log("AI error:", err.message);
    return "AI error";
  }
}

// API route
app.get("/", async (req, res) => {
  const price = await getPrice();

  if (!price) {
    return res.json({ error: "Price unavailable" });
  }

  const ai = await getAI(price);

  res.json({
    price,
    ai_action: ai,
    balance: "100.00",
    btc: "0.000000",
  });
});

// Start server
app.listen(port, () => {
  console.log("Bot running on port " + port);
});

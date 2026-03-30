import express from "express";

const app = express();

// ===== GET SOLANA PRICE FROM COINGECKO =====
async function getPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const data = await res.json();

    console.log("API RESPONSE:", data);

    if (data.solana && data.solana.usd) {
      return data.solana.usd;
    } else {
      return 0;
    }

  } catch (err) {
    console.log("Error fetching price:", err);
    return 0;
  }
}

// ===== MAIN ROUTE =====
app.get("/", async (req, res) => {
  const price = await getPrice();

  res.json({
    status: "Bot running 🚀",
    solanaPrice: price,
    time: new Date()
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

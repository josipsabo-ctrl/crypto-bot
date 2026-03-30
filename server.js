import express from "express";

const app = express();

async function getPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const data = await res.json();
    return data.solana.usd;
  } catch (err) {
    console.log("Error fetching price", err);
    return 0;
  }
}

app.get("/", async (req, res) => {
  const price = await getPrice();

  res.json({
    status: "Bot running 🚀",
    solanaPrice: price
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

import express from "express";

import dotenv from "dotenv";

// import handlers
import accountBalanceHandler from "./api/account-balance";
import availableRoutesHandler from "./api/available-routes";
import buildDepositTxHandler from "./api/build-deposit-tx";
import coingeckoHandler from "./api/coingecko";
import limitsHandler from "./api/limits";
import poolsListHandler from "./api/pools-list";
import poolsHandler from "./api/pools";
import suggestedFeesHandler from "./api/suggested-fees";
import tokenListHandler from "./api/token-list";

// Log and ignore unhandled promise rejections.
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
  // Application specific logging, throwing an error, or other logic here
});

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get("/api/account-balance", accountBalanceHandler);
app.get("/api/available-routes", availableRoutesHandler);
app.get("/api/build-deposit-tx", buildDepositTxHandler);
app.get("/api/coingecko", coingeckoHandler);
app.get("/api/limits", limitsHandler);
app.get("/api/pools-list", poolsListHandler);
app.get("/api/pools", poolsHandler);
app.get("/api/suggested-fees", suggestedFeesHandler);
app.get("/api/token-list", tokenListHandler);
app.get("/health", (_, res) => {
  res.status(200).send("OK");
});
app.get("/loaderio-1782387504fc19a1272e09e91ebc0c06", (_, res) => {
  res.status(200).send("loaderio-1782387504fc19a1272e09e91ebc0c06");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

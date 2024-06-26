import dotenv from "dotenv";
dotenv.config();

import { initTracing } from "./lib/tracing";

// Need to import this before anything else to ensure that tracing is initialized
if (process.env.DISABLE_TRACING !== "true") {
  initTracing();
}

import express from "express";

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
import { Redis, checkReqCacheHandler, setReqCacheHandler } from "./cache";

// Log and ignore unhandled promise rejections.
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
  // Application specific logging, throwing an error, or other logic here
});

const app = express();
const port = process.env.PORT || 3000;

async function main() {
  const cache = await Redis.get();

  app.get(
    "/api/account-balance",
    checkReqCacheHandler(150, cache),
    accountBalanceHandler,
    setReqCacheHandler(150, 150, cache),
  );
  app.get("/api/available-routes", availableRoutesHandler);
  app.get("/api/build-deposit-tx", buildDepositTxHandler);
  app.get(
    "/api/coingecko",
    checkReqCacheHandler(150, cache),
    coingeckoHandler,
    setReqCacheHandler(150, 150, cache),
  );
  app.get(
    "/api/limits",
    checkReqCacheHandler(60, cache),
    limitsHandler,
    setReqCacheHandler(240, 60, cache),
  );
  app.get("/api/pools-list", poolsListHandler);
  app.get("/api/pools", poolsHandler);
  app.get("/api/suggested-fees", suggestedFeesHandler);
  app.get("/api/token-list", tokenListHandler);
  app.get("/health", (_, res) => {
    res.status(200).send("OK");
  });

  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

main();

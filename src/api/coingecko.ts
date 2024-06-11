import { Request, Response } from "express";
import { ethers } from "ethers";
import { object, assert, Infer, optional, string } from "superstruct";
import { coingecko } from "@across-protocol/sdk-v2";

import { getLogger, handleErrorCondition, validAddress } from "./_utils";
import {
  getCachedTokenPriceOrFetchFromCG,
  getTokenPriceCacheKey,
} from "../prices/cache";
import { Redis } from "../cache";

const { Coingecko } = coingecko;
const {
  REACT_APP_COINGECKO_PRO_API_KEY,
  FIXED_TOKEN_PRICES,
  REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES,
  BALANCER_V2_TOKENS,
} = process.env;

const CoingeckoQueryParamsSchema = object({
  l1Token: validAddress(),
  baseCurrency: optional(string()),
});

type CoingeckoQueryParams = Infer<typeof CoingeckoQueryParamsSchema>;

const handler = async (
  { query }: Request<CoingeckoQueryParams>,
  response: Response,
  next: () => void,
) => {
  const logger = getLogger();
  logger.debug({
    at: "Coingecko",
    message: "Query data",
    query,
  });
  try {
    assert(query, CoingeckoQueryParamsSchema);

    let { l1Token, baseCurrency } = query;

    // Start the symbol as lower case for CG.
    // This isn't explicitly required, but there's nothing in their docs that guarantee that upper-case symbols will
    // work.
    if (!baseCurrency) baseCurrency = "eth";
    else baseCurrency = baseCurrency.toLowerCase();

    l1Token = ethers.utils.getAddress(l1Token);

    // Resolve the optional address lookup that maps one token's
    // contract address to another.
    const redirectLookupAddresses: Record<string, string> =
      REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES !== undefined
        ? JSON.parse(REDIRECTED_TOKEN_PRICE_LOOKUP_ADDRESSES)
        : {};

    // Perform a 1-deep lookup to see if the provided l1Token is
    // to be "redirected" to another provided token contract address
    if (redirectLookupAddresses[l1Token]) {
      l1Token = redirectLookupAddresses[l1Token];
    }

    const coingeckoClient = Coingecko.get(
      logger,
      REACT_APP_COINGECKO_PRO_API_KEY,
    );

    const _fixedTokenPrices: {
      [token: string]: number;
    } = FIXED_TOKEN_PRICES !== undefined ? JSON.parse(FIXED_TOKEN_PRICES) : {};

    // Make sure all keys in `fixedTokenPrices` are in checksum format.
    const fixedTokenPrices = Object.fromEntries(
      Object.entries(_fixedTokenPrices).map(([token, price]) => [
        ethers.utils.getAddress(token),
        price,
      ]),
    );

    const balancerV2PoolTokens =
      BALANCER_V2_TOKENS !== undefined
        ? JSON.parse(BALANCER_V2_TOKENS).map(ethers.utils.getAddress)
        : [];

    // Check cache
    const cache = await Redis.get();
    const price = await getCachedTokenPriceOrFetchFromCG(
      [
        coingeckoClient,
        l1Token,
        baseCurrency,
        fixedTokenPrices,
        balancerV2PoolTokens,
      ],
      cache,
      getTokenPriceCacheKey({ l1TokenAddress: l1Token, baseCurrency }),
      60,
    );

    // Two different explanations for how `stale-while-revalidate` works:

    // https://vercel.com/docs/concepts/edge-network/caching#stale-while-revalidate
    // This tells our CDN the value is fresh for 10 seconds. If a request is repeated within the next 10 seconds,
    // the previously cached value is still fresh. The header x-vercel-cache present in the response will show the
    // value HIT. If the request is repeated between 1 and 20 seconds later, the cached value will be stale but
    // still render. In the background, a revalidation request will be made to populate the cache with a fresh value.
    // x-vercel-cache will have the value STALE until the cache is refreshed.

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
    // The response is fresh for 150s. After 150s it becomes stale, but the cache is allowed to reuse it
    // for any requests that are made in the following 150s, provided that they revalidate the response in the background.
    // Revalidation will make the cache be fresh again, so it appears to clients that it was always fresh during
    // that period — effectively hiding the latency penalty of revalidation from them.
    // If no request happened during that period, the cache became stale and the next request will revalidate normally.
    logger.debug({
      at: "Coingecko",
      message: "Response data",
      responseJson: { price },
    });
    if (!response.locals.responseSent) {
      response.setHeader(
        "Cache-Control",
        "s-maxage=150, stale-while-revalidate=150",
      );
      response.status(200).json({ price });
    }
    response.locals.responseJson = { price };
    next();
  } catch (error: unknown) {
    return handleErrorCondition("coingecko", response, logger, error);
  }
};

export default handler;

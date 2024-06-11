import axios from "axios";
import { cacheFn } from "../cache/utils";
import { makeGetCacheKey } from "../cache";
import { getTokenPrice } from "./service";
import { resolveSelfBaseUrl } from "../lib/url";

type TokenPriceCacheKeyParams = {
  l1TokenAddress: string;
  baseCurrency: string;
};

export const getTokenPriceCacheKey = (keyParams: TokenPriceCacheKeyParams) =>
  makeGetCacheKey("tokenPrice")(keyParams);

export const getCachedTokenPriceOrFetchFromCG = cacheFn(
  (params: Parameters<typeof getTokenPrice>) => {
    return getTokenPrice(...params);
  },
);

export const getCachedTokenPriceOrFetchFromSelf = cacheFn(
  async (params: { l1Token: string; baseCurrency: string }) => {
    return Number(
      (
        await axios(`${resolveSelfBaseUrl()}/api/coingecko`, {
          params,
        })
      ).data.price,
    );
  },
);

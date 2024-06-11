import { ethers } from "ethers";
import { cacheFn } from "../cache/utils";
import { makeGetCacheKey } from "../cache";

type LatestMainnetBlockCacheKeyParams = {
  hubPoolChainId: string;
};

export const getLatestMainnetBlockCacheKey = (
  keyParams: LatestMainnetBlockCacheKeyParams,
) => makeGetCacheKey("latestMainnetBlock")(keyParams);

export const getCachedLatestMainnetBlock = cacheFn(
  async (params: { provider: ethers.providers.StaticJsonRpcProvider }) => {
    const latestBlock = await params.provider.getBlock("latest");
    return { number: latestBlock.number, timestamp: latestBlock.timestamp };
  },
);

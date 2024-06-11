import { ethers } from "ethers";
import { coingecko } from "@across-protocol/sdk-v2";

import { InputError, getBalancerV2TokenPrice } from "../api/_utils";
import {
  CHAIN_IDs,
  TOKEN_SYMBOLS_MAP,
  SUPPORTED_CG_BASE_CURRENCIES,
  coinGeckoAssetPlatformLookup,
} from "../api/_constants";

/**
 * Helper function to fetch prices from coingecko. Can fetch either or both token and base currency.
 * Set hardcodedTokenPriceUsd to 0 to load the token price from coingecko, otherwise load only the base
 * currency.
 * @param coingeckoClient
 * @param tokenAddress
 * @param baseCurrency
 * @param hardcodedTokenPrices
 * @param balancerV2PoolTokens
 * @returns
 */
export async function getCoingeckoPrices(
  coingeckoClient: coingecko.Coingecko,
  tokenAddress: string,
  baseCurrency: string,
  hardcodedTokenPrices: {
    [token: string]: number;
  } = {},
  balancerV2PoolTokens: string[] = [],
): Promise<number> {
  const baseCurrencyToken = Object.values(TOKEN_SYMBOLS_MAP).find(
    ({ symbol }) => symbol === baseCurrency.toUpperCase(),
  );

  if (!baseCurrencyToken) throw new InputError(`Base currency not supported`);

  // Special case: token and base are the same. Coingecko class returns a single result in this case, so it must
  // be handled separately.
  const baseCurrentTokenAddress =
    baseCurrencyToken.addresses[CHAIN_IDs.MAINNET];
  if (tokenAddress.toLowerCase() === baseCurrentTokenAddress.toLowerCase())
    return 1;

  // If either token or base currency is in hardcoded list then use hardcoded USD price.
  let basePriceUsdPromise: Promise<number> | number | undefined =
    hardcodedTokenPrices[baseCurrentTokenAddress];
  let tokenPriceUsdPromise: Promise<number> | number | undefined =
    hardcodedTokenPrices[tokenAddress];

  if (
    basePriceUsdPromise === undefined &&
    balancerV2PoolTokens.includes(
      ethers.utils.getAddress(baseCurrentTokenAddress),
    )
  ) {
    // Note this assumes mainnet token because all token addresses are assumed to be mainnet in this function.
    basePriceUsdPromise = getBalancerV2TokenPrice(baseCurrentTokenAddress);
  }

  if (
    tokenPriceUsdPromise === undefined &&
    balancerV2PoolTokens.includes(ethers.utils.getAddress(tokenAddress))
  ) {
    // Note this assumes mainnet token because all token addresses are assumed to be mainnet in this function.
    basePriceUsdPromise = getBalancerV2TokenPrice(tokenAddress);
  }

  // Fetch undefined base and token USD prices from coingecko client.
  // Always use usd as the base currency for the purpose of conversion.
  if (basePriceUsdPromise === undefined && tokenPriceUsdPromise === undefined) {
    const groupedPromise = coingeckoClient.getContractPrices(
      [baseCurrentTokenAddress, tokenAddress],
      "usd",
    );
    basePriceUsdPromise = groupedPromise.then((prices) => prices[0].price);
    tokenPriceUsdPromise = groupedPromise.then((prices) => prices[1].price);
  } else if (basePriceUsdPromise === undefined) {
    basePriceUsdPromise = coingeckoClient
      .getContractPrices([baseCurrentTokenAddress, tokenAddress], "usd")
      .then((prices) => prices[0].price);
  } else if (tokenPriceUsdPromise === undefined) {
    basePriceUsdPromise = coingeckoClient
      .getContractPrices([baseCurrentTokenAddress, tokenAddress], "usd")
      .then((prices) => prices[0].price);
  }

  // Extract from a promise.all.
  const [basePriceUsd, tokenPriceUsd] = await Promise.all([
    basePriceUsdPromise,
    tokenPriceUsdPromise,
  ]);

  // Drop any decimals beyond the number of decimals for this token.
  return Number(
    (tokenPriceUsd / basePriceUsd).toFixed(baseCurrencyToken.decimals),
  );
}

export async function getTokenPrice(
  coingeckoClient: coingecko.Coingecko,
  tokenAddress: string,
  baseCurrency: string,
  hardcodedTokenPrices: {
    [token: string]: number;
  } = {},
  balancerV2PoolTokens: string[] = [],
) {
  tokenAddress = ethers.utils.getAddress(tokenAddress);

  const platformId = coinGeckoAssetPlatformLookup[tokenAddress] ?? "ethereum";

  let price: number;

  // Caller wants to override price for token, possibly because the token is not supported yet on the Coingecko API,
  // so assume the caller set the USD price of the token. We now need to dynamically load the base currency.
  if (
    hardcodedTokenPrices[tokenAddress] !== undefined &&
    !isNaN(hardcodedTokenPrices[tokenAddress])
  ) {
    // If base is USD, return hardcoded token price in USD.
    if (baseCurrency === "usd") price = hardcodedTokenPrices[tokenAddress];
    else {
      price = await getCoingeckoPrices(
        coingeckoClient,
        tokenAddress,
        baseCurrency,
        hardcodedTokenPrices,
        balancerV2PoolTokens,
      );
    }
  } else if (
    balancerV2PoolTokens.includes(ethers.utils.getAddress(tokenAddress))
  ) {
    if (baseCurrency === "usd") {
      price = await getBalancerV2TokenPrice(tokenAddress);
    } else if (SUPPORTED_CG_BASE_CURRENCIES.has(baseCurrency)) {
      throw new Error(
        "Only CG base currency allowed for BalancerV2 tokens is usd",
      );
    } else {
      price = await getCoingeckoPrices(
        coingeckoClient,
        tokenAddress,
        baseCurrency,
        hardcodedTokenPrices,
        balancerV2PoolTokens,
      );
    }
  }
  // Fetch price dynamically from Coingecko API
  else if (SUPPORTED_CG_BASE_CURRENCIES.has(baseCurrency)) {
    // This base matches a supported base currency for CG.
    [, price] = await coingeckoClient.getCurrentPriceByContract(
      tokenAddress,
      baseCurrency,
      platformId,
    );
  } else {
    price = await getCoingeckoPrices(
      coingeckoClient,
      tokenAddress,
      baseCurrency,
      hardcodedTokenPrices,
      balancerV2PoolTokens,
    );
  }

  return price;
}

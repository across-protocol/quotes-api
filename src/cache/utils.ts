import hash from "object-hash";

import { Cache } from "./cache";

export function makeGetCacheKey(prefix: string) {
  return function getCacheKey(keyParams: Record<string, string>) {
    return `${prefix}:${hash(keyParams)}`;
  };
}

export function cacheFn<T, U>(fn: (args: U) => Promise<T>) {
  return async function (
    args: U,
    cache: Cache,
    cacheKey: string,
    ttl: number,
  ): Promise<T> {
    const cached = await cache.get(cacheKey);

    if (!cached || cached.expiry < Date.now() / 1000) {
      const value = await fn(args);
      await cache.set(cacheKey, JSON.stringify(value), ttl);
      return value;
    }

    return JSON.parse(cached.value) as T;
  };
}

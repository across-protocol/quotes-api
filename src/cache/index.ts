import { Request, Response } from "express";
export { LocalCache } from "./local";
export { Redis } from "./redis";

import { Cache } from "./cache";

function cacheKey(req: Request): string {
  // TODO: compress this key.
  return `expressCache,path:${req.path},params:${JSON.stringify(req.params)}`;
}

export function checkCacheHandler(
  staleWhileRevalidate: number,
  caches: Cache[],
) {
  return async function (req: Request, res: Response, next: () => void) {
    const key = cacheKey(req);
    const currentTime = Math.round(Date.now() / 1000);
    for (const cache of caches) {
      const cachedValue = await cache.get(key);
      if (cachedValue === undefined) continue;
      const timeRemaining = cachedValue.expiry - currentTime;
      if (timeRemaining < 0) continue;

      // In staleWhileRevalidate, we send the cached value, set responseSent to true
      // so that the later middlewares know that the response has already been sent.
      if (timeRemaining < staleWhileRevalidate) {
        res.status(200).json(JSON.parse(cachedValue.value));
        res.locals.responseSent = true;
        next();
        return;
      }

      // No call to next because we don't need to revalidate.
      res.status(200).json(JSON.parse(cachedValue.value));
      return;
    }

    // Next is called because we didn't find a cached value, so we have to process normally.
    next();
  };
}

export function setCacheHandler(
  maxAge: number,
  staleWhileRevalidate: number,
  caches: Cache[],
) {
  return async function (req: Request, res: Response, next: () => void) {
    const key = cacheKey(req);
    for (const cache of caches) {
      await cache.set(
        key,
        JSON.stringify(res.locals.responseJson),
        maxAge + staleWhileRevalidate,
      );
    }
    next();
  };
}

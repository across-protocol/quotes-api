import { Request, Response } from "express";
import { Cache } from "./cache";
import { makeGetCacheKey } from "./utils";

const getCacheKey = makeGetCacheKey("expressCache");

function cacheKey(req: Request): string {
  return getCacheKey({
    path: req.path,
    ...req.params,
  });
}

export function checkCacheHandler(staleWhileRevalidate: number, cache: Cache) {
  return async function (req: Request, res: Response, next: () => void) {
    const key = cacheKey(req);
    const currentTime = Math.round(Date.now() / 1000);
    const cachedValue = await cache.get(key);

    // If we didn't find a cached value or the value is expired, we have to process normally.
    if (cachedValue === undefined) {
      next();
      return;
    }
    const timeRemaining = cachedValue.expiry - currentTime;
    if (timeRemaining < 0) {
      next();
      return;
    }

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
  };
}

export function setCacheHandler(
  maxAge: number,
  staleWhileRevalidate: number,
  cache: Cache,
) {
  return async function (req: Request, res: Response, next: () => void) {
    const key = cacheKey(req);
    await cache.set(
      key,
      JSON.stringify(res.locals.responseJson),
      maxAge + staleWhileRevalidate,
    );
    next();
  };
}

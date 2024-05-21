import { Request, Response } from "express";
import { isEqual } from "lodash";

export interface Cache {
  set: (key: string, value: string, ttl: number) => Promise<void>;
  get: (key: string) => Promise<{ expiry: number; value: string } | undefined>;
}

function cacheKey(req: Request): string {
  // TODO: compress this key by hashing.
  return `expressCache,path:${req.path},params:${JSON.stringify(req.params)}`;
}

export function checkCacheHandler(
  maxAge: number,
  staleWhileRevalidate: number,
  caches: Cache[],
) {
  return function (req: Request, res: Response, next: () => void) {
    const key = cacheKey(req);
    const cachedResult
  };
}

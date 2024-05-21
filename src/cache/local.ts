import { createClient } from "redis";

import { Cache } from "./cache";

type RedisClient = ReturnType<typeof createClient>;

export class LocalCache extends Cache {
  cache: Record<string, { value: string; expiry: number }> = {};
  keyCount

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.cache.l)
    this.cache[key] = {
      value,
      expiry: ttl
        ? Math.round(Date.now() / 1000) + ttl
        : Number.MAX_SAFE_INTEGER,
    };
  }

  async get(
    key: string,
  ): Promise<{ value: string; expiry: number } | undefined> {
    const entry = this.cache[key];
    if (entry?.value && entry?.expiry >= Math.round(Date.now() / 1000)) {
      return { value: entry.value, expiry: entry.expiry };
    } else {
      delete this.cache[key];
    }
  }
}

import { Cache } from "./cache";

const KEY_THRESHOLD = 10000;
const KEY_TARGET = 1000;

export class LocalCache implements Cache {
  cache: Map<string, { value: string; expiry: number }> = new Map();

  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.cache[key] = {
      value,
      expiry: ttl
        ? Math.round(Date.now() / 1000) + ttl
        : Number.MAX_SAFE_INTEGER,
    };
    if (this.cache.size >= KEY_THRESHOLD) {
      this.prune();
    }
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

  // Removes enough keys to get down to the target size.
  // Simple algorithm to just remove the first n keys, which are the oldest elements of the cache.
  prune() {
    const keysToRemove = this.cache.size - KEY_TARGET;
    let removed = 0;
    for (const key of this.cache.keys()) {
      this.cache.delete(key);
      if (removed++ >= keysToRemove) {
        break;
      }
    }
  }
}

import hash from "object-hash";

export function makeGetCacheKey(prefix: string) {
  return function getCacheKey(keyParams: Record<string, string>) {
    return `${prefix}:${hash(keyParams)}`;
  };
}

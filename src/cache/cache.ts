export interface Cache {
  set: (key: string, value: string, ttl: number) => Promise<void>;
  get: (key: string) => Promise<{ expiry: number; value: string } | undefined>;
}

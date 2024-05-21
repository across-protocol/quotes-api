import { createClient } from "redis";

import { Cache } from "./cache";

type RedisClient = ReturnType<typeof createClient>;

export class Redis extends Cache {
  static instance: Promise<Redis> | undefined;

  private static async create(): Promise<Redis> {
    const client = await createClient({ url: process.env.REDIS_URL })
      .on("error", (err) => console.log("Redis Client Error", err))
      .connect();
    return new Redis(client);
  }

  static async get() {
    if (this.instance === undefined) {
      this.instance = this.create();
    }
    return this.instance;
  }

  private constructor(readonly client: RedisClient) {
    super();
  }

  async set(key: string, value: string, ttl?: number) {
    await this.client.set(
      key,
      value,
      ttl !== undefined ? { EX: ttl } : undefined,
    );
  }

  async get(
    key: string,
  ): Promise<{ value: string; expiry: number } | undefined> {
    const [value, expiry] = await Promise.all([
      this.client.get(key),
      this.client.expireTime(key),
    ]);
    if (value && expiry > 0) {
      return {
        value,
        expiry,
      };
    }
  }
}

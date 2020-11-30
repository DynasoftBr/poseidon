import { CacheLayer } from "./cache-layer";

export class LocalProcessCache implements CacheLayer {
  #map = new Map<string, any>();

  async has(key: string): Promise<boolean> {
    return this.#map.has(key);
  }

  async set<T>(key: string, payload: T): Promise<void> {
    this.#map.set(key, payload);
  }

  async get<T = any>(key: string): Promise<T> {
    return this.#map.get(key);
  }
}

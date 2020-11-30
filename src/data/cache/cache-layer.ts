export interface CacheLayer {
  has(key: string): Promise<boolean>;
  set<T>(key: string, payload: T): Promise<void>;
  get<T = any>(key: string): Promise<T>;
  
}

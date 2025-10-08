// Lightweight in-memory client cache with TTL suitable for single-page session caching
type CacheEntry<T> = { value: T; expiresAt: number };

class ClientCache {
  private store: Map<string, CacheEntry<any>> = new Map();

  constructor(private defaultTTLms = 3 * 60 * 1000) {}

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number) {
    const ttl = typeof ttlMs === 'number' ? ttlMs : this.defaultTTLms;
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  del(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

export const clientCache = new ClientCache();

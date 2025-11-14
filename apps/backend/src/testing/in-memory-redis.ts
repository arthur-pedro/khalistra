export class InMemoryRedisService {
  private readonly store = new Map<string, string>();

  setJson(key: string, value: unknown) {
    this.store.set(key, JSON.stringify(value));
    return Promise.resolve();
  }

  getJson<T>(key: string): Promise<T | null> {
    const raw = this.store.get(key);
    return Promise.resolve(raw ? (JSON.parse(raw) as T) : null);
  }

  delete(key: string) {
    this.store.delete(key);
    return Promise.resolve();
  }
}

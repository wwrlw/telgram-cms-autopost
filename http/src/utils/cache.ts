interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 30000;

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // Проверяем, не истек ли TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Создаем глобальный экземпляр кэша
export const cache = new SimpleCache();

// Очищаем кэш каждые 5 минут
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

/**
 * Декоратор для кэширования результатов функций
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 30000
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Проверяем кэш
    if (cache.has(key)) {
      console.log(`🎯 Cache HIT for key: ${key}`);
      return cache.get(key);
    }

    // Выполняем функцию и кэшируем результат
    console.log(`🔄 Cache MISS for key: ${key}, executing function...`);
    const result = await fn(...args);
    cache.set(key, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Кэширование MongoDB запросов с автоматической генерацией ключей
 */
export function mongoCached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number = 30000
): T {
  return cached(fn, (...args) => {
    // Генерируем ключ на основе имени функции и аргументов
    const argsStr = JSON.stringify(args);
    return `${fn.name}:${Buffer.from(argsStr).toString('base64')}`;
  }, ttl);
}

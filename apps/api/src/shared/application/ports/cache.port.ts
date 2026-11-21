/** Puerto de caché clave-valor (implementado con Redis en infraestructura). */
export interface CachePort {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  delete(...keys: string[]): Promise<void>
  /**
   * Lee de caché; si no existe, ejecuta `loader`, guarda el resultado y lo devuelve (patrón cache-aside).
   */
  getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T>
}

export const CACHE = Symbol('CACHE')

import fetch from 'node-fetch';
import { PackageMeta } from '../types/index.js';
import { withRetry } from '../utils/errorHandler.js';

const cache = new Map<string, PackageMeta>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Fetches package metadata from npm registry with caching and retry logic
 * @param name - Package name
 * @returns Package metadata or empty values on failure
 */
export async function getPackageMeta(name: string): Promise<PackageMeta> {
  const now = Date.now();
  const cachedTimestamp = cacheTimestamps.get(name);
  
  if (cache.has(name) && cachedTimestamp && (now - cachedTimestamp) < CACHE_TTL) {
    return cache.get(name)!;
  }

  try {
    const meta = await withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`https://registry.npmjs.org/${name}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'pkg-to-csv'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data: any = await res.json();
      const latestVersion: string = data['dist-tags']?.latest ?? '';
      const license: string = data.license ?? (data.versions?.[latestVersion]?.license ?? '');
      const description = data.description ?? '';
      const npmLink = `https://www.npmjs.com/package/${name}`;
      
      return { latestVersion, license, description, npmLink };
    }, 2, 500);
    
    cache.set(name, meta);
    cacheTimestamps.set(name, now);
    
    return meta;
  } catch (error) {
    const emptyMeta = { latestVersion: '', license: '', description: '', npmLink: '' };
    cache.set(name, emptyMeta);
    cacheTimestamps.set(name, now);
    return emptyMeta;
  }
}

/**
 * Fetches metadata for multiple packages concurrently
 * @param names - Array of package names
 * @returns Map of package names to their metadata
 */
export async function getPackageMetaBatch(names: string[]): Promise<Map<string, PackageMeta>> {
  const results = new Map<string, PackageMeta>();
  const promises = names.map(async name => {
    const meta = await getPackageMeta(name);
    results.set(name, meta);
  });
  
  await Promise.allSettled(promises);
  return results;
}
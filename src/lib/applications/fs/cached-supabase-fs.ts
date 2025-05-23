import { IFileSystem } from './common';

/**
 * Implements the IFileSystem interface with a caching layer, primarily designed for
 * Supabase file operations but generic enough to wrap any IFileSystem instance.
 * This class uses a secondary IFileSystem instance (typically `OpfsImpl` for persistence)
 * as a cache to reduce direct calls to the primary file system (typically `SupabaseFsImpl`).
 *
 * Caching Strategies:
 * - `readFile`: Read-through. Attempts to read from cache first. On miss, reads from primary
 *               FS, then asynchronously updates the cache.
 * - `writeFile`: Write-through. Writes to primary FS first. If successful, then writes to cache.
 *                Cache write failures are logged but do not fail the operation.
 * - `deleteFile`: Deletes from primary FS. If successful, then deletes from cache.
 *                 Cache delete failures are logged.
 * - `exists`: Cache-aside. Checks cache first. If found, returns true. Otherwise, checks primary FS.
 *             Does not populate cache on miss for `exists`.
 * - `listFiles`, `mkdir`, `rmdir`: Cache-bypass for reads (`listFiles`), and write-through
 *                                  with best-effort cache updates/invalidations for modifications
 *                                  (`mkdir`, `rmdir`). These operations primarily target the
 *                                  primary FS, with subsequent attempts to keep the cache consistent.
 *                                  Detailed cache synchronization for directory structures is complex
 *                                  and not fully implemented; these are best-effort.
 */
export class CachedSupabaseFsImpl implements IFileSystem {
  private supabaseFs: IFileSystem; // The primary file system (e.g., actual SupabaseFS)
  private cacheFs: IFileSystem;    // The caching file system (e.g., OPFS)
  private cacheBasePrefix: string; // Base path within cacheFs for storing cached items

  /**
   * Constructs a new CachedSupabaseFsImpl instance.
   * @param supabaseFs The primary `IFileSystem` instance (e.g., `SupabaseFsImpl`) whose operations are to be cached.
   * @param cacheFs The `IFileSystem` instance to be used as the cache backend (e.g., an `OpfsImpl` instance).
   * @param cacheBasePrefix A base path prefix within the `cacheFs` under which all cached items
   *                        from `supabaseFs` will be stored. For example, if `cacheBasePrefix` is
   *                        `'/supabase_cache'`, a Supabase file at `/bucket/file.txt` would be cached
   *                        at `/supabase_cache/bucket/file.txt` within the `cacheFs`.
   */
  constructor(supabaseFs: IFileSystem, cacheFs: IFileSystem, cacheBasePrefix: string) {
    this.supabaseFs = supabaseFs;
    this.cacheFs = cacheFs;
    this.cacheBasePrefix = cacheBasePrefix.endsWith('/') 
        ? cacheBasePrefix.slice(0, -1) 
        : cacheBasePrefix;
    if (this.cacheBasePrefix === '/') { // Avoid double slash if root is prefix
        this.cacheBasePrefix = '';
    }
  }

  /**
   * Generates the full cache path for a given path from the primary file system.
   * @param primaryPath The original path in the primary file system (e.g., `/bucket/file.txt`).
   * @returns The corresponding path in the cache (e.g., `/supabase_cache/bucket/file.txt`).
   * @private
   */
  private getCachePath(primaryPath: string): string {
    const normalizedPrimaryPath = primaryPath.startsWith('/') ? primaryPath.substring(1) : primaryPath;
    // If cacheBasePrefix is empty (meaning root of cacheFs), just ensure a leading slash.
    return `${this.cacheBasePrefix}/${normalizedPrimaryPath}`;
  }

  /**
   * @inheritdoc
   * Implements a read-through caching strategy.
   * Attempts to read from the cache first. If not found or an error occurs during cache read,
   * it reads from the primary file system (`supabaseFs`). If the primary read is successful,
   * the result is then asynchronously cached in `cacheFs`.
   */
  async readFile(path: string): Promise<string | Uint8Array> {
    const cachePath = this.getCachePath(path);
    try {
      // 1. Try reading from cacheFs
      const cachedData = await this.cacheFs.readFile(cachePath);
      // console.log(`readFile: Cache hit for ${path} at ${cachePath}`);
      return cachedData;
    } catch (cacheError) {
      // console.log(`readFile: Cache miss or error for ${path} at ${cachePath}:`, cacheError.message);
      // 2. If cache read fails, read from supabaseFs
      const dataFromSupabase = await this.supabaseFs.readFile(path);
      
      // 3. Asynchronously write to cacheFs. Log errors but don't fail main operation.
      this.cacheFs.writeFile(cachePath, dataFromSupabase)
        .then(() => { /* console.log(`readFile: Successfully cached ${path} to ${cachePath}`); */ })
        .catch(err => {
          console.error(`readFile: Failed to cache ${path} to ${cachePath}:`, err.message);
        });
      
      return dataFromSupabase;
    }
  }

  /**
   * @inheritdoc
     * Implements a write-through caching strategy.
     * Writes to the primary file system (`supabaseFs`) first. If successful, it then updates
     * the cache in `cacheFs`. Cache write failures are logged but do not fail the overall operation.
   */
  async writeFile(path: string, content: string | Uint8Array): Promise<void> {
    // 1. Call supabaseFs.writeFile
    await this.supabaseFs.writeFile(path, content);
    // console.log(`writeFile: Successfully wrote to Supabase for ${path}`);

    // 2. If successful, generate cachePath and call cacheFs.writeFile
    const cachePath = this.getCachePath(path);
    try {
      await this.cacheFs.writeFile(cachePath, content);
      // console.log(`writeFile: Successfully updated cache for ${path} at ${cachePath}`);
    } catch (cacheError) {
      console.error(`writeFile: Failed to update cache for ${path} at ${cachePath}:`, cacheError.message);
      // Do not fail the main operation if Supabase write succeeded.
    }
  }

  /**
   * @inheritdoc
   * Deletes the file from the primary file system (`supabaseFs`), then attempts to delete it
   * from the cache (`cacheFs`). Cache delete failures are logged but do not fail the operation.
   */
  async deleteFile(path: string): Promise<void> {
    // 1. Call supabaseFs.deleteFile
    await this.supabaseFs.deleteFile(path);
    // console.log(`deleteFile: Successfully deleted from Supabase for ${path}`);

    // 2. If successful, generate cachePath and try to cacheFs.deleteFile
    const cachePath = this.getCachePath(path);
    try {
      if (await this.cacheFs.exists(cachePath)) { // Check if exists before deleting
        await this.cacheFs.deleteFile(cachePath);
        // console.log(`deleteFile: Successfully deleted from cache for ${path} at ${cachePath}`);
      }
    } catch (cacheError) {
      console.error(`deleteFile: Failed to delete from cache for ${path} at ${cachePath}:`, cacheError.message);
      // Log errors on cache delete, but don't fail main operation.
    }
  }

  /**
   * @inheritdoc
   * Directly calls the primary file system (`supabaseFs`). Caching for list operations is
   * not implemented in this version due to complexity of cache validation for listings.
   */
  async listFiles(path: string): Promise<string[]> {
    // console.log(`listFiles: Directly calling Supabase for ${path}. No caching.`);
    return this.supabaseFs.listFiles(path);
  }

  /**
   * @inheritdoc
   * Creates a directory in the primary file system (`supabaseFs`). If successful, attempts to create a
   * corresponding directory structure or placeholder in the cache (`cacheFs`).
   * Cache operation failures are logged.
   */
  async mkdir(path: string): Promise<void> {
    // 1. Directly call supabaseFs.mkdir
    await this.supabaseFs.mkdir(path);
    // console.log(`mkdir: Successfully created directory in Supabase for ${path}`);

    // 2. If successful, try to create a similar structure in the cache.
    const cachePath = this.getCachePath(path);
    try {
      await this.cacheFs.mkdir(cachePath); 
      // console.log(`mkdir: Successfully mirrored directory in cache for ${path} at ${cachePath}`);
    } catch (cacheError) {
      console.error(`mkdir: Failed to mirror directory in cache for ${path} at ${cachePath}:`, cacheError.message);
    }
  }

  /**
   * @inheritdoc
   * Removes a directory from the primary file system (`supabaseFs`). If successful, attempts to remove the
   * corresponding directory structure or placeholder from the cache (`cacheFs`).
   * Cache operation failures are logged.
   */
  async rmdir(path: string): Promise<void> {
    // 1. Directly call supabaseFs.rmdir
    await this.supabaseFs.rmdir(path);
    // console.log(`rmdir: Successfully removed directory from Supabase for ${path}`);
    
    // 2. If successful, try to remove from cache.
    const cachePath = this.getCachePath(path);
    try {
      if (await this.cacheFs.exists(cachePath)) {
        await this.cacheFs.rmdir(cachePath);
        // console.log(`rmdir: Successfully removed from cache for ${path} at ${cachePath}`);
      }
    } catch (cacheError) {
      console.error(`rmdir: Failed to remove from cache for ${path} at ${cachePath}:`, cacheError.message);
    }
  }

  /**
   * @inheritdoc
   * Implements a cache-aside strategy for existence checks.
   * Checks `cacheFs` first. If the path exists in the cache, returns true.
   * Otherwise, checks the primary file system (`supabaseFs`). The cache is not populated on a miss.
   */
  async exists(path: string): Promise<boolean> {
    const cachePath = this.getCachePath(path);
    // 1. Check cacheFs.exists
    if (await this.cacheFs.exists(cachePath)) {
      // console.log(`exists: Cache hit for ${path} at ${cachePath}`);
      return true;
    }
    // console.log(`exists: Cache miss for ${path} at ${cachePath}. Checking Supabase.`);
    // 2. Else, call supabaseFs.exists
    return this.supabaseFs.exists(path);
  }
}

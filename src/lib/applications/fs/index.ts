import { IFileSystem } from './common';
import { memFsInstance } from './memfs'; // memFsInstance is the singleton MemFSImpl
import { SupabaseFsImpl } from './supabase-fs';
import { OpfsImpl } from './opfs';
import { CachedSupabaseFsImpl } from './cached-supabase-fs'; // Import CachedSupabaseFsImpl
import { SupabaseClient, Session } from '@supabase/supabase-js';

// Re-export IFileSystem for convenience if needed by consumers of UnifiedFsService
export { IFileSystem } from './common';

/**
 * Provides a unified interface for interacting with various file system implementations.
 * This service routes file operations based on path prefixes to different storage backends:
 * - In-memory file system (MemFS) for temporary, volatile storage.
 * - Origin Private File System (OPFS) for persistent, browser-based local storage.
 * - Supabase Storage for cloud-based storage, with a caching layer (using OPFS) to
 *   optimize performance and reduce network requests.
 *
 * Path Conventions:
 * - **`/mem/...`**: Routes to `MemFSImpl`. This storage is volatile and session-specific.
 *   Example: `/mem/temp-data.json` maps to `/temp-data.json` in the in-memory file system.
 * - **`/local/...`**: Routes to `OpfsImpl`. This storage is persistent for the browser's origin.
 *   Example: `/local/settings/user-prefs.json` maps to `/settings/user-prefs.json` in OPFS.
 * - **`/supabase/...`**: Routes to `CachedSupabaseFsImpl`. This provides access to Supabase Storage buckets,
 *   with OPFS used as a cache for file reads and writes. Requires an active user session.
 *   The path structure after `/supabase/` should align with Supabase Storage conventions
 *   (e.g., `/supabase/my-bucket/documents/report.pdf`).
 *
 * Session Handling:
 * - Operations on `/supabase/` paths require a valid `Session` object. If a session is not provided,
 *   an error will be thrown to prevent unauthorized access.
 * - `/mem/` and `/local/` paths do not require a session.
 */
export class UnifiedFsService implements IFileSystem {
    private memFs: IFileSystem;
    private supabaseFs: IFileSystem; // Instance of CachedSupabaseFsImpl
    private opfs: OpfsImpl;         // Instance of OpfsImpl for /local/ paths

    /**
     * Constructs a new UnifiedFsService.
     * Initializes all underlying file system implementations:
     * - `MemFSImpl` (singleton) for `/mem/` paths.
     * - `OpfsImpl` for `/local/` paths.
     * - `SupabaseFsImpl` (actual, non-cached) as the primary store for Supabase.
     * - Another `OpfsImpl` instance as the cache backend for Supabase operations.
     * - `CachedSupabaseFsImpl` which wraps `SupabaseFsImpl` and its `OpfsImpl` cache.
     *
     * @param supabaseClient An initialized SupabaseClient, required for all Supabase-related operations.
     */
    constructor(supabaseClient: SupabaseClient) {
        this.memFs = memFsInstance;
        this.opfs = new OpfsImpl(); // For /local/ paths

        // Setup for Supabase with caching:
        // 1. The actual Supabase file system implementation.
        const actualSupabaseFs = new SupabaseFsImpl(supabaseClient);
        // 2. An OpfsImpl instance to serve as the cache for Supabase operations.
        const cacheBackendForSupabase = new OpfsImpl(); 
        // 3. Define a base path within the cache's OPFS for Supabase cached items.
        const supabaseCacheBasePrefix = '/_supabase_cache_'; // Internal prefix for OPFS cache
        // 4. The cached Supabase file system instance.
        this.supabaseFs = new CachedSupabaseFsImpl(actualSupabaseFs, cacheBackendForSupabase, supabaseCacheBasePrefix);
    }

    /**
     * Determines the appropriate file system instance (MemFS, OPFS, or SupabaseFS) based on the path prefix
     * and session state, and returns the instance along with the path stripped of its prefix.
     * @param path The full path with a prefix (e.g., `/mem/file.txt`, `/local/file.txt`, `/supabase/bucket/file.txt`).
     * @param session The current user session. Required for `/supabase/` paths.
     * @returns An object containing the chosen `IFileSystem` instance and the `strippedPath`.
     * @throws Error if the path prefix is invalid or if a session is required but not provided.
     * @private
     */
    private getFsInstance(path: string, session: Session | null): { fs: IFileSystem, strippedPath: string } {
        if (path.startsWith('/mem/')) {
            // Ensure /mem/ prefix itself is stripped, not just /mem.
            // e.g. /mem/foo -> /foo
            return { fs: this.memFs, strippedPath: path.substring('/mem'.length) };
        } else if (path.startsWith('/local/')) { // New condition for OPFS
            return { fs: this.opfs, strippedPath: path.substring('/local'.length) };
        } else if (path.startsWith('/supabase/')) {
            if (!session) {
                throw new Error('Permission denied: Supabase storage requires an authenticated session.');
            }
            // Here, one might also check session.user.id or other properties if needed for multi-tenancy in Supabase RLS.
            // For now, just checking session presence is enough as per requirements.
            return { fs: this.supabaseFs, strippedPath: path.substring('/supabase'.length) };
        } else {
            throw new Error(`Invalid path prefix: path must start with /mem/, /local/, or /supabase/. Received: ${path}`);
        }
    }

    // Implement IFileSystem methods, adding the session argument

    /**
     * Reads a file from the appropriate file system based on the path prefix.
     * @param path The full path, including the prefix (e.g., `/mem/file.txt` or `/supabase/bucket/file.txt`).
     * @param session The user session. Required for `/supabase/` paths.
     * @returns A promise that resolves with the file content as a string or Uint8Array.
     * @throws Error if path prefix is invalid, session is required but missing, or if the underlying FS operation fails.
     */
    async readFile(path: string, session: Session | null): Promise<string | Uint8Array> {
        const { fs, strippedPath } = this.getFsInstance(path, session);
        // The IFileSystem interface methods don't expect a session argument.
        // So, we don't pass `session` to `fs.readFile`.
        return fs.readFile(strippedPath);
    }

    /**
     * Writes content to a file in the appropriate file system.
     * @param path The full path, including the prefix.
     * @param content The content to write.
     * @param session The user session. Required for `/supabase/` paths.
     * @returns A promise that resolves when the write is complete.
     * @throws Error if path prefix is invalid, session is required but missing, or if the underlying FS operation fails.
     */
    async writeFile(path: string, content: string | Uint8Array, session: Session | null): Promise<void> {
        const { fs, strippedPath } = this.getFsInstance(path, session);
        return fs.writeFile(strippedPath, content);
    }

    /**
     * Deletes a file from the appropriate file system.
     * @param path The full path, including the prefix.
     * @param session The user session. Required for `/supabase/` paths.
     * @returns A promise that resolves when the file is deleted.
     * @throws Error if path prefix is invalid, session is required but missing, or if the underlying FS operation fails.
     */
    async deleteFile(path: string, session: Session | null): Promise<void> {
        const { fs, strippedPath } = this.getFsInstance(path, session);
        return fs.deleteFile(strippedPath);
    }

    /**
     * Lists files and directories from the appropriate file system.
     * @param path The full path to the directory, including the prefix.
     * @param session The user session. Required for `/supabase/` paths.
     * @returns A promise that resolves with an array of names.
     * @throws Error if path prefix is invalid, session is required but missing, or if the underlying FS operation fails.
     */
    async listFiles(path: string, session: Session | null): Promise<string[]> {
        const { fs, strippedPath } = this.getFsInstance(path, session);
        return fs.listFiles(strippedPath);
    }

    /**
     * Creates a directory in the appropriate file system.
     * @param path The full path to the directory, including the prefix.
     * @param session The user session. Required for `/supabase/` paths.
     * @returns A promise that resolves when the directory is created.
     * @throws Error if path prefix is invalid, session is required but missing, or if the underlying FS operation fails.
     */
    async mkdir(path: string, session: Session | null): Promise<void> {
        const { fs, strippedPath } = this.getFsInstance(path, session);
        // The mkdir in IFileSystem might take options, but our current IFileSystem interface doesn't show it.
        // Assuming the base interface's mkdir signature is `mkdir(path: string): Promise<void>`
        // If it were `mkdir(path: string, options?: any): Promise<void>`, we'd pass them if applicable.
        return fs.mkdir(strippedPath);
    }

    /**
     * Removes a directory from the appropriate file system.
     * @param path The full path to the directory, including the prefix.
     * @param session The user session. Required for `/supabase/` paths.
     * @returns A promise that resolves when the directory is removed.
     * @throws Error if path prefix is invalid, session is required but missing, or if the underlying FS operation fails.
     */
    async rmdir(path: string, session: Session | null): Promise<void> {
        const { fs, strippedPath } = this.getFsInstance(path, session);
        return fs.rmdir(strippedPath);
    }

    /**
     * Checks if a file or directory exists in the appropriate file system.
     * @param path The full path to check, including the prefix.
     * @param session The user session. Required for `/supabase/` paths.
     * @returns A promise that resolves with true if the path exists, false otherwise.
     * @throws Error if path prefix is invalid, session is required but missing, or if the underlying FS operation fails.
     */
    async exists(path: string, session: Session | null): Promise<boolean> {
        const { fs, strippedPath } = this.getFsInstance(path, session);
        return fs.exists(strippedPath);
    }
}

// Example Usage (conceptual, not part of the file content for submission):
//
// // Assuming you have a Supabase client and a session object (e.g., from a hook)
// // const supabase = createClient(...);
// // const session = useSupabaseSession(); // Hypothetical hook
//
// // const unifiedFs = new UnifiedFsService(supabase);
//
// // To read a local file:
// // unifiedFs.readFile('/local/my-notes/note.txt', session).then(...);
//
// // To read a Supabase file (requires session to be non-null):
// // if (session) {
// //   unifiedFs.readFile('/supabase/my-bucket/documents/report.pdf', session).then(...);
// // } else {
// //   console.error("Cannot access Supabase files without a session.");
// // }
//
// // If an operation on /supabase/ is attempted with a null session,
// // getFsInstance will throw an error, which will propagate up.
```

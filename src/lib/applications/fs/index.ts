import { IFileSystem } from './common';
import { memFsInstance } from './memfs'; // memFsInstance is the singleton MemFSImpl
import { SupabaseFsImpl } from './supabase-fs';
import { SupabaseClient, Session } from '@supabase/supabase-js';

// Re-export IFileSystem for convenience if needed by consumers of UnifiedFsService
export { IFileSystem } from './common';

/**
 * Provides a unified interface to interact with different file system implementations.
 * It routes operations to either an in-memory file system (MemFS) or Supabase Storage
 * based on path prefixes and session state.
 *
 * Path Conventions:
 * - `/local/...`: Routes to MemFS. Accessible without a session.
 *                 Example: `/local/my-document.txt` maps to `/my-document.txt` in MemFS.
 * - `/supabase/...`: Routes to SupabaseFS. Requires an active user session.
 *                    The path structure after `/supabase/` should match the SupabaseFS convention
 *                    (e.g., `/supabase/my-bucket/path/to/file.txt`).
 *
 * Session Handling:
 * - Operations on `/supabase/` paths require a valid `Session` object. If no session is
 *   provided, an error is thrown, preventing unauthorized access to Supabase Storage.
 */
export class UnifiedFsService implements IFileSystem {
    private memFs: IFileSystem; // Use IFileSystem type for flexibility
    private supabaseFs: SupabaseFsImpl;
    // supabaseClient is stored in supabaseFs, so not strictly needed here unless for other direct uses.

    /**
     * Constructs a new UnifiedFsService.
     * @param supabaseClient An initialized SupabaseClient, required for SupabaseFS operations.
     */
    constructor(supabaseClient: SupabaseClient) {
        this.memFs = memFsInstance; // Use the singleton instance, which should conform to IFileSystem
        this.supabaseFs = new SupabaseFsImpl(supabaseClient);
    }

    /**
     * Determines the appropriate file system instance (MemFS or SupabaseFS) based on the path prefix
     * and session state, and returns the instance along with the path stripped of its prefix.
     * @param path The full path with a prefix (e.g., `/local/file.txt`, `/supabase/bucket/file.txt`).
     * @param session The current user session. Required for `/supabase/` paths.
     * @returns An object containing the chosen `IFileSystem` instance and the `strippedPath`.
     * @throws Error if the path prefix is invalid or if a session is required but not provided.
     * @private
     */
    private getFsInstance(path: string, session: Session | null): { fs: IFileSystem, strippedPath: string } {
        if (path.startsWith('/supabase/')) {
            if (!session) {
                throw new Error('Permission denied: Supabase storage requires an authenticated session.');
            }
            // Here, one might also check session.user.id or other properties if needed for multi-tenancy in Supabase RLS.
            // For now, just checking session presence is enough as per requirements.
            return { fs: this.supabaseFs, strippedPath: path.substring('/supabase'.length) };
        } else if (path.startsWith('/local/')) {
            // Ensure /local/ prefix itself is stripped, not just /local.
            // e.g. /local/foo -> /foo
            return { fs: this.memFs, strippedPath: path.substring('/local'.length) };
        } else {
            throw new Error(`Invalid path prefix: path must start with /local/ or /supabase/. Received: ${path}`);
        }
    }

    // Implement IFileSystem methods, adding the session argument

    /**
     * Reads a file from the appropriate file system based on the path prefix.
     * @param path The full path, including the prefix (e.g., `/local/file.txt` or `/supabase/bucket/file.txt`).
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

import { useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { UnifiedFsService, IFileSystem } from '../lib/applications/fs'; // Assuming IFileSystem is re-exported from here
import { useSession } from './use-session'; // Assuming path is correct

/**
 * Represents the set of file system operations provided by the `useFileSystem` hook.
 * These methods mirror the `IFileSystem` interface but are pre-configured with the
 * current user session, simplifying their usage in components.
 *
 * Path Conventions:
 * Operations use prefixed paths to determine the target file system:
 * - `/mem/...`: For temporary, in-memory file storage (MemFS, session-only, volatile).
 * - `/local/...`: For persistent local file storage using the Origin Private File System (OPFS).
 * - `/supabase/...`: For Supabase Storage (cloud, user-specific). Operations are cached using OPFS
 *                    to improve performance. Note that this may have data freshness implications if
 *                    external modifications to Supabase occur.
 */
export type FileSystemHookType = {
    /**
     * Reads a file from the specified path.
     * @param path The full path, including the prefix (e.g., `/mem/file.txt`, `/local/data.json`, or `/supabase/bucket/file.txt`).
     *             For `/supabase/` paths, data may be served from a local cache (OPFS).
     * @returns A promise that resolves with the file content as a string or Uint8Array.
     * @throws Error if the path is invalid, file not found, or permission denied (e.g., no session for Supabase).
     */
    readFile: (path: string) => Promise<string | Uint8Array>;
    /**
     * Writes content to a file at the specified path.
     * @param path The full path, including the prefix.
     * @param content The content to write (string or Uint8Array).
     * @returns A promise that resolves when the write operation is complete.
     * @throws Error if the path is invalid, write fails, or permission denied.
     */
    writeFile: (path: string, content: string | Uint8Array) => Promise<void>;
    /**
     * Deletes a file at the specified path.
     * @param path The full path, including the prefix.
     * @returns A promise that resolves when the file is deleted.
     * @throws Error if the path is invalid, deletion fails, or permission denied.
     */
    deleteFile: (path: string) => Promise<void>;
    /**
     * Lists files and directories within the specified directory path.
     * @param path The full path to the directory, including the prefix.
     * @returns A promise that resolves with an array of names (strings).
     * @throws Error if the path is invalid, listing fails, or permission denied.
     */
    listFiles: (path: string) => Promise<string[]>;
    /**
     * Creates a new directory at the specified path.
     * @param path The full path to the directory, including the prefix.
     * @returns A promise that resolves when the directory is created.
     * @throws Error if the path is invalid, creation fails, or permission denied.
     */
    mkdir: (path: string) => Promise<void>;
    /**
     * Removes an existing directory at the specified path.
     * @param path The full path to the directory, including the prefix.
     * @returns A promise that resolves when the directory is removed.
     * @throws Error if the path is invalid, removal fails (e.g., directory not empty), or permission denied.
     */
    rmdir: (path: string) => Promise<void>;
    /**
     * Checks if a file or directory exists at the specified path.
     * @param path The full path to check, including the prefix.
     * @returns A promise that resolves with true if the path exists, false otherwise.
     * @throws Error if the path is invalid or checking fails due to permission issues.
     */
    exists: (path: string) => Promise<boolean>;
};


/**
 * Custom React hook that provides a simplified interface to the `UnifiedFsService`.
 * It handles Supabase client initialization and session management automatically.
 *
 * This hook allows components to perform file system operations without needing to
 * manually manage Supabase client instances or pass session objects to each FS call.
 *
 * Path Conventions:
 * - `/mem/...`: Routes to MemFS for temporary, in-memory file storage (session-only, volatile).
 * - `/local/...`: Routes to OPFS for persistent local file storage using the Origin Private File System.
 * - `/supabase/...`: Routes to a cached layer on top of SupabaseFS. Supabase operations are cached
 *                    using OPFS as a backing store to improve performance and reduce direct API calls.
 *                    This implies that recently read/written Supabase files might be served from the
 *                    local cache, and external modifications to Supabase might not be immediately reflected.
 *                    All Supabase operations still require an active user session.
 *
 * @returns An object of type `FileSystemHookType` containing methods for file system operations.
 *          These methods are pre-bound with the current user session.
 */
export function useFileSystem(): FileSystemHookType {
    // 1. Initialize Supabase client
    // Create a new Supabase client instance. This is lightweight.
    // For Next.js App Router, you'd typically pass Database generic.
    // Let's assume a Database type if available, otherwise use default.
    // const supabase = createClientComponentClient<Database>(); // Replace <Database> with your actual DB type if any
    const supabase = createClientComponentClient();


    // 2. Instantiate UnifiedFsService, memoized
    // This ensures the service instance is stable across re-renders unless the Supabase client changes.
    const unifiedFsService = useMemo(() => {
        return new UnifiedFsService(supabase);
    }, [supabase]);

    // 3. Get session
    // useSession() hook provides the current Session object or null if not authenticated.
    const session = useSession();

    // 4. Return wrapped methods
    // Each method from UnifiedFsService is wrapped to automatically include the current session.
    // This simplifies the API for components using this hook.
    
    /**
     * @see FileSystemHookType.readFile
     */
    const readFile = async (path: string): Promise<string | Uint8Array> => {
        return unifiedFsService.readFile(path, session);
    };

    /**
     * @see FileSystemHookType.writeFile
     */
    const writeFile = async (path: string, content: string | Uint8Array): Promise<void> => {
        return unifiedFsService.writeFile(path, content, session);
    };

    /**
     * @see FileSystemHookType.deleteFile
     */
    const deleteFile = async (path: string): Promise<void> => {
        return unifiedFsService.deleteFile(path, session);
    };

    /**
     * @see FileSystemHookType.listFiles
     */
    const listFiles = async (path: string): Promise<string[]> => {
        return unifiedFsService.listFiles(path, session);
    };

    /**
     * @see FileSystemHookType.mkdir
     */
    const mkdir = async (path: string): Promise<void> => {
        // If IFileSystem.mkdir eventually supports options, they would be passed here.
        return unifiedFsService.mkdir(path, session);
    };

    /**
     * @see FileSystemHookType.rmdir
     */
    const rmdir = async (path: string): Promise<void> => {
        return unifiedFsService.rmdir(path, session);
    };

    /**
     * @see FileSystemHookType.exists
     */
    const exists = async (path: string): Promise<boolean> => {
        return unifiedFsService.exists(path, session);
    };

    return {
        readFile,
        writeFile,
        deleteFile,
        listFiles,
        mkdir,
        rmdir,
        exists,
    };
}

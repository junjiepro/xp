import { IFileSystem } from './common';

/**
 * Implements the IFileSystem interface using the Origin Private File System (OPFS).
 * This class provides an asynchronous API for file system operations within the browser's
 * origin-bound private storage, offering persistent storage capabilities.
 *
 * Data stored using this implementation will persist across sessions for the same origin.
 * Note: OPFS is typically available in Web Workers or specific secure contexts.
 * This implementation assumes the necessary environment is present.
 *
 * In the context of `UnifiedFsService`:
 * - It is accessed directly via the `/local/` path prefix for general-purpose local persistent storage.
 * - An instance of it is also used as the caching backend for `CachedSupabaseFsImpl` (which handles `/supabase/` paths).
 */
export class OpfsImpl implements IFileSystem {
  /**
   * Gets the root directory handle for the Origin Private File System.
   * @returns A promise that resolves with the root FileSystemDirectoryHandle.
   * @throws Error if OPFS is not available or accessible.
   * @private
   */
  private async getRootDirectoryHandle(): Promise<FileSystemDirectoryHandle> {
    if (!navigator.storage || !navigator.storage.getDirectory) {
      throw new Error('Origin Private File System API is not available in this context.');
    }
    return navigator.storage.getDirectory();
  }

  /**
   * Normalizes a path by removing leading and trailing slashes and ensuring it's not empty.
   * @param path The path string to normalize.
   * @returns The normalized path string.
   * @private
   */
  private normalizePath(path: string): string {
    if (!path) return '';
    let normalized = path.trim();
    if (normalized.startsWith('/')) {
      normalized = normalized.substring(1);
    }
    if (normalized.endsWith('/')) {
      normalized = normalized.substring(0, normalized.length - 1);
    }
    return normalized;
  }

  /**
   * Recursively gets a directory handle for the given path segments.
   * @param pathSegments An array of directory names representing the path.
   * @param baseHandle The directory handle to start from (usually the root).
   * @param create If true, directories will be created if they don't exist.
   * @returns A promise that resolves with the FileSystemDirectoryHandle for the target directory.
   * @throws Error if the path is invalid, not found (and create is false), or not a directory.
   * @private
   */
  private async getDirectoryHandleRecursive(
    pathSegments: string[],
    baseHandle: FileSystemDirectoryHandle,
    create: boolean = false,
  ): Promise<FileSystemDirectoryHandle> {
    let currentHandle = baseHandle;
    for (const segment of pathSegments) {
      if (!segment) continue; // Skip empty segments that might result from splitting "//"
      try {
        currentHandle = await currentHandle.getDirectoryHandle(segment, { create });
      } catch (e) {
        // Type check error to be more specific if possible, e.g. DOMException for "NotFoundError"
        if (e instanceof DOMException && e.name === 'TypeMismatchError') {
          throw new Error(`Path conflict: '${segment}' is a file, not a directory, in path '${pathSegments.join('/')}'.`);
        }
        throw e; // Re-throw other errors
      }
    }
    return currentHandle;
  }

  /**
   * Gets a file handle for the given path segments.
   * @param pathSegments An array of directory names and the final file name.
   * @param baseHandle The directory handle to start from (usually the root).
   * @param create If true, the file (and parent directories) will be created if they don't exist.
   * @returns A promise that resolves with the FileSystemFileHandle for the target file.
   * @throws Error if the path is invalid, not found (and create is false), or not a file.
   * @private
   */
  private async getFileHandleRecursive(
    pathSegments: string[],
    baseHandle: FileSystemDirectoryHandle,
    create: boolean = false,
  ): Promise<FileSystemFileHandle> {
    if (pathSegments.length === 0) {
      throw new Error('File path cannot be empty.');
    }
    const fileName = pathSegments.pop()!; // Must have at least one segment due to check
    if (!fileName) {
        throw new Error('File name cannot be empty.');
    }

    const dirHandle = await this.getDirectoryHandleRecursive(pathSegments, baseHandle, create);
    try {
        return await dirHandle.getFileHandle(fileName, { create });
    } catch (e) {
        if (e instanceof DOMException && e.name === 'TypeMismatchError') {
          throw new Error(`Path conflict: '${fileName}' is a directory, not a file, in path '${pathSegments.join('/')}/${fileName}'.`);
        }
        throw e;
    }
  }
  
  /**
   * @inheritdoc
   */
  async exists(path: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(path);
    if (normalizedPath === '') { // Root always exists conceptually
        try {
            await this.getRootDirectoryHandle();
            return true;
        } catch {
            return false; // OPFS not available
        }
    }

    const segments = normalizedPath.split('/');
    const rootHandle = await this.getRootDirectoryHandle();
    
    try {
      // Try getting it as a directory first
      await this.getDirectoryHandleRecursive([...segments], rootHandle, false);
      return true;
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'NotFoundError' || e.name === 'TypeMismatchError')) {
        // If not found as dir, or if it was a type mismatch (meaning part of path was a file)
        // try as a file if not TypeMismatchError on the final segment.
        // If TypeMismatchError and it was the last segment, it means it's a file.
      } else {
        throw e; // other errors
      }
    }

    try {
      // Try getting it as a file
      await this.getFileHandleRecursive([...segments], rootHandle, false);
      return true;
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'NotFoundError' || e.name === 'TypeMismatchError')) {
        return false;
      }
      throw e; // other errors
    }
  }

  /**
   * @inheritdoc
   */
  async readFile(path: string): Promise<Uint8Array> {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) throw new Error("readFile: Path cannot be empty (root cannot be read as a file).");
    
    const segments = normalizedPath.split('/');
    const rootHandle = await this.getRootDirectoryHandle();
    const fileHandle = await this.getFileHandleRecursive(segments, rootHandle, false);
    const file = await fileHandle.getFile();
    return new Uint8Array(await file.arrayBuffer());
  }

  /**
   * @inheritdoc
   */
  async writeFile(path: string, content: string | Uint8Array): Promise<void> {
    const normalizedPath = this.normalizePath(path);
     if (!normalizedPath) throw new Error("writeFile: Path cannot be empty (root cannot be written as a file).");

    const segments = normalizedPath.split('/');
    const rootHandle = await this.getRootDirectoryHandle();
    const fileHandle = await this.getFileHandleRecursive(segments, rootHandle, true);
    
    const writable = await fileHandle.createWritable();
    const dataToWrite = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    await writable.write(dataToWrite);
    await writable.close();
  }

  /**
   * @inheritdoc
   */
  async deleteFile(path: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) throw new Error("deleteFile: Path cannot be empty.");

    const segments = normalizedPath.split('/');
    if (segments.length === 0) throw new Error("Cannot delete root directory."); // Should be caught by normalize + split
    
    const fileName = segments.pop()!;
     if (!fileName) throw new Error('File name cannot be empty for deletion.');

    const rootHandle = await this.getRootDirectoryHandle();
    const dirHandle = await this.getDirectoryHandleRecursive(segments, rootHandle, false);
    
    // Before removing, ensure it's a file, not a directory
    try {
        await dirHandle.getFileHandle(fileName, { create: false });
    } catch (e) {
        if (e instanceof DOMException && e.name === 'TypeMismatchError') {
            throw new Error(`'${fileName}' is a directory, not a file. Use rmdir to delete directories.`);
        }
        throw e; // rethrow NotFoundError or other errors
    }

    await dirHandle.removeEntry(fileName);
  }

  /**
   * @inheritdoc
   */
  async mkdir(path: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) return; // Creating root is a no-op, it already exists.

    const segments = normalizedPath.split('/');
    const rootHandle = await this.getRootDirectoryHandle();
    await this.getDirectoryHandleRecursive(segments, rootHandle, true);
  }

  /**
   * @inheritdoc
   */
  async rmdir(path: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    if (!normalizedPath) throw new Error("Cannot remove the root directory.");

    const segments = normalizedPath.split('/');
    if (segments.length === 0) throw new Error("Cannot remove root directory."); // Should be caught by normalizePath

    const dirName = segments.pop()!;
    if (!dirName) throw new Error('Directory name cannot be empty for rmdir.');

    const rootHandle = await this.getRootDirectoryHandle();
    const parentDirHandle = await this.getDirectoryHandleRecursive(segments, rootHandle, false);

    // Check if directory is empty before removing (OPFS removeEntry without recursive:true should fail if not empty)
    // However, to provide a clearer error or adhere to IFileSystem potentially stricter contract:
    const dirToRemoveHandle = await parentDirHandle.getDirectoryHandle(dirName, { create: false });
    let isEmpty = true;
    for await (const entry of dirToRemoveHandle.values()) {
        isEmpty = false;
        break;
    }
    if (!isEmpty) {
        throw new Error(`Directory not empty: ${path}`);
    }
    
    await parentDirHandle.removeEntry(dirName, { recursive: false }); // OPFS default is recursive: false
  }

  /**
   * @inheritdoc
   */
  async listFiles(path: string): Promise<string[]> {
    const normalizedPath = this.normalizePath(path);
    const rootHandle = await this.getRootDirectoryHandle();
    let dirHandle: FileSystemDirectoryHandle;

    if (normalizedPath === '') { // List root directory
      dirHandle = rootHandle;
    } else {
      const segments = normalizedPath.split('/');
      dirHandle = await this.getDirectoryHandleRecursive(segments, rootHandle, false);
    }
    
    const entries: string[] = [];
    for await (const entry of dirHandle.values()) {
      entries.push(entry.name + (entry.kind === 'directory' ? '/' : ''));
    }
    return entries;
  }
}

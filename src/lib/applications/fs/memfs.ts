import { vol, Volume } from 'memfs';
import { IFileSystem } from './common';
import * as path from 'path'; // Import path module

export class MemFSImpl implements IFileSystem {
  private volume: Volume;

  constructor() {
    // Initialize a new volume for each instance, or use a shared one if needed.
    // For now, a new volume per instance to ensure isolation.
    this.volume = new Volume();
  }

  async readFile(filePath: string): Promise<string | Uint8Array> {
    // memfs.readFile returns Buffer by default, which is compatible with Uint8Array.
    // If a string is needed, the user of this class should decode it.
    // For simplicity, we'll return as Buffer/Uint8Array.
    // To return string, use: return this.volume.promises.readFile(filePath, 'utf-8') as Promise<string>;
    return this.volume.promises.readFile(filePath) as Promise<Uint8Array>;
  }

  async writeFile(filePath: string, content: string | Uint8Array): Promise<void> {
    const directory = path.dirname(filePath);
    if (!(await this.exists(directory))) {
      await this.mkdir(directory, { recursive: true });
    }
    return this.volume.promises.writeFile(filePath, content);
  }

  async deleteFile(filePath: string): Promise<void> {
    // For memfs, unlink is used for both files and empty directories.
    // We should ensure this method is for files.
    // However, IFileSystem doesn't distinguish between rmdir and unlink for non-directories.
    // We'll assume deleteFile is for files.
    // If it's a directory, memfs unlink might throw EISDIR, or remove it if empty.
    // Let's check if it's a file first.
    const stats = await this.volume.promises.stat(filePath);
    if (stats.isDirectory()) {
      // Throw an error if trying to delete a directory with deleteFile
      throw new Error(`Path is a directory: ${filePath}. Use rmdir instead.`);
    }
    return this.volume.promises.unlink(filePath);
  }

  async listFiles(dirPath: string): Promise<string[]> {
    // Default behavior of readdir returns string[].
    return this.volume.promises.readdir(dirPath) as Promise<string[]>;
  }

  async mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
    // memfs mkdir supports recursive option.
    return this.volume.promises.mkdir(dirPath, { recursive: options?.recursive ?? false });
  }

  async rmdir(dirPath: string): Promise<void> {
    // memfs rmdir should remove an empty directory.
    // It will throw an error if the directory is not empty.
    const stats = await this.volume.promises.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${dirPath}`);
    }
    // Check if directory is empty
    const files = await this.listFiles(dirPath);
    if (files.length > 0) {
      throw new Error(`Directory not empty: ${dirPath}`);
    }
    return this.volume.promises.rmdir(dirPath);
  }

  async exists(filePath: string): Promise<boolean> {
    // memfs vol.exists is synchronous, but IFileSystem.exists is async.
    // We can wrap it in a Promise.resolve, or use stat and catch errors.
    try {
      await this.volume.promises.stat(filePath);
      return true;
    } catch (error) {
      // Typically, ENOENT means file not found.
      if (error.code === 'ENOENT') {
        return false;
      }
      // Rethrow other errors
      throw error;
    }
  }
}

// Export an instance for convenience, or allow users to create their own.
export const memFS = new MemFSImpl();
// To use a shared volume across all imports of this module, define `vol` outside the class
// and pass it to the constructor, or just use `vol` directly if `MemFSImpl` is a singleton.
// For example:
// import { vol } from 'memfs';
// export class MemFSImpl implements IFileSystem {
//   private volume: typeof vol = vol; // Use the global memfs volume
//   // ... rest of the implementation
// }
// export const memFS = new MemFSImpl();

// The current implementation uses a new Volume() for each MemFSImpl instance.
// If a global shared in-memory file system is desired, `vol` should be used directly.
// Let's switch to using the global `vol` for simplicity as per example in task.
// This means removing the private `volume` field and constructor, and using `vol.promises` directly.

// Re-implementing with global `vol`
import { vol as globalVol } from 'memfs'; // aliasing to avoid confusion with the class member

export class MemFSImplGlobal implements IFileSystem {
  // No constructor needed if using global vol

  async readFile(filePath: string): Promise<string | Uint8Array> {
    return globalVol.promises.readFile(filePath) as Promise<Uint8Array>;
  }

  async writeFile(filePath: string, content: string | Uint8Array): Promise<void> {
    const directory = path.dirname(filePath);
    // Check if directory exists using globalVol, not 'this.exists' which might not be bound to globalVol if called from elsewhere
    try {
      await globalVol.promises.stat(directory);
    } catch (e) {
      if (e.code === 'ENOENT') {
        await globalVol.promises.mkdir(directory, { recursive: true });
      } else {
        throw e;
      }
    }
    return globalVol.promises.writeFile(filePath, content);
  }

  async deleteFile(filePath: string): Promise<void> {
    const stats = await globalVol.promises.stat(filePath);
    if (stats.isDirectory()) {
      throw new Error(`Path is a directory: ${filePath}. Use rmdir instead.`);
    }
    return globalVol.promises.unlink(filePath);
  }

  async listFiles(dirPath: string): Promise<string[]> {
    return globalVol.promises.readdir(dirPath) as Promise<string[]>;
  }

  async mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
    return globalVol.promises.mkdir(dirPath, { recursive: options?.recursive ?? false });
  }

  async rmdir(dirPath: string): Promise<void> {
    const stats = await globalVol.promises.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${dirPath}`);
    }
    const files = await globalVol.promises.readdir(dirPath) as string[];
    if (files.length > 0) {
      throw new Error(`Directory not empty: ${dirPath}`);
    }
    return globalVol.promises.rmdir(dirPath);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await globalVol.promises.stat(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }
}

// Export an instance using the global volume.
export const memFSGlobal = new MemFSImplGlobal();
// The original request was to implement a class, MemFSImpl.
// The choice of instance-specific volume vs global volume is an implementation detail.
// The prompt example uses `import { vol } from 'memfs'; vol.writeFileSync(...)` which points to a global/static usage.
// Let's stick to the global `vol` for the class.

// Final simplified version using global `vol` directly in the class methods.
// Removed `MemFSImplGlobal` and `memFSGlobal` to stick to the requested `MemFSImpl`.
// Removed the instance-specific volume implementation as well.

import { vol as defaultVolume } from 'memfs'; // Use defaultVolume to refer to the global memfs volume
import { IFileSystem } from './common';
import * as pathUtil from 'path'; // Renamed to avoid conflict with filePath parameter names

/**
 * Implements the IFileSystem interface using the 'memfs' library for an in-memory file system.
 * This class directly uses the global volume (`vol`) provided by 'memfs'.
 * Paths are treated as standard POSIX paths (e.g., /foo/bar.txt).
 */
export class MemFSImpl implements IFileSystem {
  // Using the global `vol` from memfs by default.
  // No constructor needed if we are directly using the imported `defaultVolume`.

  /**
   * Reads the content of a file from the in-memory file system.
   * @param filePath The full path to the file.
   * @returns A promise that resolves with the file content as a Buffer/Uint8Array.
   * @throws Error (e.g., ENOENT) if the file is not found or other 'memfs' errors occur.
   */
  async readFile(filePath: string): Promise<string | Uint8Array> {
    // Default readFile in memfs returns a Buffer.
    return defaultVolume.promises.readFile(filePath);
  }

  /**
   * Writes content to a file in the in-memory file system.
   * If parent directories do not exist, they are created recursively.
   * @param filePath The full path to the file.
   * @param content The content to write, either as a string or Uint8Array.
   * @returns A promise that resolves when the write operation is complete.
   * @throws Error if write fails or other 'memfs' errors occur.
   */
  async writeFile(filePath: string, content: string | Uint8Array): Promise<void> {
    const directory = pathUtil.dirname(filePath);
    try {
      // Check if directory exists.
      await defaultVolume.promises.stat(directory);
    } catch (e) {
      // If directory does not exist, create it.
      if (e.code === 'ENOENT') {
        await defaultVolume.promises.mkdir(directory, { recursive: true });
      } else {
        // Rethrow other errors.
        throw e;
      }
    }
    return defaultVolume.promises.writeFile(filePath, content);
  }

  /**
   * Deletes a file from the in-memory file system.
   * @param filePath The full path to the file.
   * @returns A promise that resolves when the file is successfully deleted.
   * @throws Error (EISDIR) if the path is a directory.
   * @throws Error (e.g., ENOENT) if 'memfs' unlink fails (e.g., file not found).
   */
  async deleteFile(filePath: string): Promise<void> {
    const stats = await defaultVolume.promises.stat(filePath);
    if (stats.isDirectory()) {
      throw new Error(`EISDIR: Path is a directory, use rmdir instead: ${filePath}`);
    }
    return defaultVolume.promises.unlink(filePath);
  }

  /**
   * Lists files and directories within a given directory path in the in-memory file system.
   * @param dirPath The full path to the directory.
   * @returns A promise that resolves with an array of names (strings) of files and directories.
   * @throws Error (e.g., ENOENT) if the directory is not found or 'memfs' readdir fails.
   */
  async listFiles(dirPath: string): Promise<string[]> {
    // memfs readdir returns string[] by default.
    const result = await defaultVolume.promises.readdir(dirPath);
    // Ensure it's string[] for type safety, though readdir without options should be string[]
    if (result.some(item => typeof item !== 'string')) {
        // This case should ideally not happen with memfs's default readdir
        return (result as any[]).map(item => String(item));
    }
    return result as string[];
  }

  /**
   * Creates a new directory in the in-memory file system.
   * @param dirPath The full path to the directory to be created.
   * @param options Optional settings. `recursive: true` allows creating parent directories if they don't exist. Defaults to non-recursive.
   * @returns A promise that resolves when the directory is successfully created.
   * @throws Error (e.g., EEXIST, ENOENT) if 'memfs' mkdir fails.
   */
  async mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
    return defaultVolume.promises.mkdir(dirPath, { recursive: options?.recursive ?? false });
  }

  /**
   * Removes an existing directory from the in-memory file system.
   * The directory must be empty.
   * @param dirPath The full path to the directory to be removed.
   * @returns A promise that resolves when the directory is successfully removed.
   * @throws Error (ENOTDIR) if the path is not a directory.
   * @throws Error (ENOTEMPTY) if the directory is not empty.
   * @throws Error (e.g., ENOENT) if 'memfs' rmdir fails.
   */
  async rmdir(dirPath: string): Promise<void> {
    const stats = await defaultVolume.promises.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`ENOTDIR: Path is not a directory: ${dirPath}`);
    }
    // Check if directory is empty before attempting to remove.
    const files = await defaultVolume.promises.readdir(dirPath);
    if (files.length > 0) {
      throw new Error(`ENOTEMPTY: Directory not empty: ${dirPath}`);
    }
    return defaultVolume.promises.rmdir(dirPath);
  }

  /**
   * Checks if a file or directory exists at the given path in the in-memory file system.
   * @param filePath The full path to check.
   * @returns A promise that resolves with true if the path exists, false otherwise.
   * @throws Error if 'memfs' stat fails for reasons other than ENOENT (file not found).
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await defaultVolume.promises.stat(filePath);
      return true;
    } catch (error) {
      // ENOENT is the error code for "No such file or directory".
      if (error.code === 'ENOENT') {
        return false;
      }
      // For other errors, rethrow them.
      throw error;
    }
  }
}

/**
 * A pre-instantiated singleton instance of `MemFSImpl`.
 * This instance can be used directly for in-memory file system operations.
 * Example: `import { memFsInstance } from './memfs'; memFsInstance.readFile(...);`
 */
export const memFsInstance = new MemFSImpl();
// This allows: import { memFsInstance } from './memfs'; memFsInstance.readFile(...);
// Or: import { MemFSImpl } from './memfs'; const myFs = new MemFSImpl(); myFs.readFile(...);

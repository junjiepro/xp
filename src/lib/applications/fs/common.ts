/**
 * Defines a generic interface for a file system.
 * This interface provides a contract for various file operations,
 * allowing for different implementations (e.g., in-memory, remote storage).
 */
export interface IFileSystem {
  /**
   * Reads the content of a file.
   * @param path The full path to the file.
   * @returns A promise that resolves with the file content as a string or Uint8Array.
   * @throws Error if the file is not found, the path is a directory, or other read errors occur.
   */
  readFile(path: string): Promise<string | Uint8Array>;

  /**
   * Writes content to a file. If the file exists, it will be overwritten.
   * If parent directories do not exist, they should ideally be created by the implementation.
   * @param path The full path to the file.
   * @param content The content to write, either as a string or Uint8Array.
   * @returns A promise that resolves when the write operation is complete.
   * @throws Error if the path is invalid, write fails, or other errors occur.
   */
  writeFile(path: string, content: string | Uint8Array): Promise<void>;

  /**
   * Deletes a file.
   * @param path The full path to the file.
   * @returns A promise that resolves when the file is successfully deleted.
   * @throws Error if the path is not found, is a directory, or deletion fails.
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Lists files and directories within a given directory path.
   * @param path The full path to the directory.
   * @returns A promise that resolves with an array of names (strings) of files and directories.
   *          The names should be relative to the input path (e.g., "file.txt", "subdir").
   * @throws Error if the path is not found, is not a directory, or listing fails.
   */
  listFiles(path: string): Promise<string[]>;

  /**
   * Creates a new directory.
   * Implementations may support recursive directory creation.
   * @param path The full path to the directory to be created.
   * @returns A promise that resolves when the directory is successfully created.
   * @throws Error if the path is invalid, a file or directory already exists at the path (non-recursive), or creation fails.
   */
  mkdir(path: string): Promise<void>; // Note: MemFSImpl allows options here, but base IFileSystem does not specify them.

  /**
   * Removes an existing directory.
   * The directory should typically be empty for the operation to succeed.
   * @param path The full path to the directory to be removed.
   * @returns A promise that resolves when the directory is successfully removed.
   * @throws Error if the path is not found, is not a directory, the directory is not empty, or removal fails.
   */
  rmdir(path: string): Promise<void>;

  /**
   * Checks if a file or directory exists at the given path.
   * @param path The full path to check.
   * @returns A promise that resolves with true if the path exists, false otherwise.
   * @throws Error if there's an issue checking existence (e.g., permission errors, though typically should resolve to false).
   */
  exists(path: string): Promise<boolean>;
}

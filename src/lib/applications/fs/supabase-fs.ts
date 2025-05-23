import { IFileSystem } from './common';
import { SupabaseClient, FileObject } from '@supabase/supabase-js';

/**
 * Implements the IFileSystem interface using the Supabase client library's storage API.
 * This class provides direct, non-cached interaction with Supabase Storage buckets.
 *
 * Path Convention:
 * Paths are expected in the format `/bucket-name/path/to/object` or `/bucket-name/path/to/folder/`.
 * - The first segment is the Supabase bucket name.
 * - The rest of the path is the object key or folder prefix within that bucket.
 *
 * Directory Emulation:
 * Directories are represented by empty objects with a trailing slash in their key (e.g., `my-folder/`).
 * - `mkdir` creates these directory marker objects.
 * - `rmdir` removes them, but only if the "directory" is empty.
 * - `listFiles` lists objects under a given prefix (directory path).
 *
 * In the context of `UnifiedFsService`, this `SupabaseFsImpl` is typically wrapped by
 * `CachedSupabaseFsImpl` to provide a caching layer before operations reach Supabase Storage.
 * Direct use of `SupabaseFsImpl` would bypass this cache.
 */
export class SupabaseFsImpl implements IFileSystem {
  private supabase: SupabaseClient;

  /**
   * Constructs a new SupabaseFsImpl instance.
   * @param supabase An initialized SupabaseClient instance.
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Parses a full path into its bucket name and object path components.
   * @param fullPath The full path, e.g., `/my-bucket/file.txt` or `/my-bucket/folder/`.
   * @returns An object containing `bucketName` and `objectPath`.
   * @throws Error if the path format is invalid.
   * @private
   */
  private parsePath(fullPath: string): { bucketName: string, objectPath: string } {
    if (!fullPath || fullPath === '/') {
      throw new Error('Path must start with a bucket name and specify an object or directory: /bucket-name/path/to/object or /bucket-name/path/to/directory/');
    }
    const cleanedPath = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
    const parts = cleanedPath.split('/');
    if (parts.length === 0 || !parts[0]) {
      throw new Error('Bucket name cannot be empty.');
    }
    const bucketName = parts[0];
    // objectPath can be "file.txt", "folder/file.txt", "folder/", or "" (if fullPath was /bucketName/)
    const objectPath = parts.slice(1).join('/');
    return { bucketName, objectPath };
  }

  /**
   * Reads a file from Supabase Storage.
   * @param path The full path to the file (e.g., `/bucket/file.txt`). Must not end with `/`.
   * @returns A promise that resolves with the file content as Uint8Array.
   * @throws Error if the path is invalid, file not found, or download fails.
   */
  async readFile(path: string): Promise<string | Uint8Array> {
    const { bucketName, objectPath } = this.parsePath(path);
    if (!objectPath || objectPath.endsWith('/')) {
      throw new Error(`readFile: Path must be a file, not a directory or empty: ${path}`);
    }

    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .download(objectPath);

    if (error) { throw new Error(`Supabase readFile failed for ${path}: ${error.message}`); }
    if (!data) { throw new Error(`Supabase readFile: No data returned for ${path}.`); }
    return new Uint8Array(await data.arrayBuffer());
  }

  /**
   * Writes content to a file in Supabase Storage. Overwrites if the file exists.
   * @param path The full path to the file (e.g., `/bucket/file.txt`). Must not end with `/`.
   * @param content The content to write, as a string or Uint8Array. String content is UTF-8 encoded.
   * @returns A promise that resolves when the write operation is complete.
   * @throws Error if the path is invalid or the upload fails.
   */
  async writeFile(path: string, content: string | Uint8Array): Promise<void> {
    const { bucketName, objectPath } = this.parsePath(path);
    if (!objectPath || objectPath.endsWith('/')) {
      throw new Error(`writeFile: Path must be a file, not a directory or empty: ${path}`);
    }
    
    const fileData = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    
    const { error } = await this.supabase.storage
      .from(bucketName)
      .upload(objectPath, fileData, { upsert: true });

    if (error) { throw new Error(`Supabase writeFile failed for ${path}: ${error.message}`); }
  }

  /**
   * Deletes a file from Supabase Storage.
   * @param path The full path to the file (e.g., `/bucket/file.txt`). Must not end with `/`.
   * @returns A promise that resolves when the file is deleted. Does not error if file was already non-existent.
   * @throws Error if the path is invalid or the deletion fails for other reasons.
   */
  async deleteFile(path: string): Promise<void> {
    const { bucketName, objectPath } = this.parsePath(path);
    if (!objectPath || objectPath.endsWith('/')) {
      throw new Error(`deleteFile: Path must be a file, not a directory or empty: ${path}`);
    }
    // Supabase `remove` does not error if the file doesn't exist, but returns data indicating success/failure for each path.
    // We'll check the error property on the result for simplicity, though a more robust check might look at the returned data array.
    const { error } = await this.supabase.storage
      .from(bucketName)
      .remove([objectPath]);

    if (error) { throw new Error(`Supabase deleteFile failed for ${path}: ${error.message}`); }
  }

  /**
   * Lists files and "directories" within a given path in Supabase Storage.
   * @param path The full path to the "directory" (e.g., `/bucket/folder/` or `/bucket/folder`).
   *             If path does not end with `/`, it's treated as a directory prefix.
   *             For bucket root, use `/bucket/`.
   * @returns A promise that resolves with an array of names (strings) of objects and directory markers.
   * @throws Error if listing fails.
   */
  async listFiles(path: string): Promise<string[]> {
    const { bucketName, objectPath } = this.parsePath(path);
    // Ensure objectPath for listing is a prefix, ending with '/' or being empty for root.
    let listPrefix = objectPath;
    if (objectPath && !objectPath.endsWith('/')) {
      listPrefix = `${objectPath}/`; // Treat as directory prefix
    }

    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .list(listPrefix || undefined, { limit: 1000 });

    if (error) { throw new Error(`Supabase listFiles failed for ${path}: ${error.message}`); }
    
    // Filter out the directory object itself if it's listed (e.g. when listing "folder/", "folder/" object might appear)
    return data ? data.map(item => item.name).filter(name => name !== (listPrefix ? listPrefix.split('/').slice(-2, -1)[0] + '/' : '')) : [];
  }

  /**
   * Creates a "directory" in Supabase Storage by creating an empty object with a trailing slash.
   * @param path The full path to the directory (e.g., `/bucket/new-folder/`). Must end with `/`.
   * @returns A promise that resolves when the directory marker is created.
   *          Does not throw if the directory marker already exists or if a file exists at the same path.
   * @throws Error if the path is invalid or the creation fails for reasons other than the object already existing.
   */
  async mkdir(path: string): Promise<void> {
    const { bucketName, objectPath } = this.parsePath(path);
    if (!objectPath || !objectPath.endsWith('/')) {
      throw new Error(`mkdir: Path must be a directory path ending with '/': ${path}`);
    }

    // Check if directory object already exists
    // This check is simplified: we try to upload with upsert:false. If it fails due to existing object, that's fine.
    const { data: existingObjects, error: listError } = await this.supabase.storage
        .from(bucketName)
        .list(objectPath.substring(0, objectPath.lastIndexOf('/')), { search: objectPath.substring(objectPath.lastIndexOf('/')+1), limit: 1 });

    if (listError) {
        // Handle cases where parent path doesn't exist vs other errors
        if (!(listError.message.includes("Not found") || (listError as any).status === 404 || listError.message.includes("The resource was not found"))) {
            throw new Error(`Supabase mkdir (checking existence for ${objectPath}) failed: ${listError.message}`);
        }
        // If parent path not found, it means the directory object also doesn't exist.
    }

    if (existingObjects && existingObjects.some(obj => obj.name === objectPath.split('/').filter(Boolean).pop() + '/')) {
        console.log(`mkdir: Directory object ${objectPath} already exists in bucket ${bucketName}.`);
        return;
    }
    
    const { error: uploadError } = await this.supabase.storage
      .from(bucketName)
      .upload(objectPath, new Blob(['']), { upsert: false }); // Empty content, upsert:false to avoid overwriting existing file/folder object

    if (uploadError) {
      // If error is because file already exists (e.g. HTTP 409 or similar from Supabase), it's like mkdir succeeded.
      // Supabase's `upload` with `upsert:false` should error if the object exists. Specific error codes (e.g., 'already_exists', '409') might need checking.
      // For now, if 'Duplicate' or a similar message indicating it exists, we can ignore.
      // This depends on Supabase's specific error message for this case.
      // A common error for existing object is { "statusCode": "409", "error": "Duplicate", "message": "The resource already exists" }
      if (uploadError.message.toLowerCase().includes('duplicate') || uploadError.message.includes('already exists')) {
         console.log(`mkdir: Directory object ${objectPath} effectively already exists (or a file exists at this path).`);
         return;
      }
      throw new Error(`Supabase mkdir (creating directory object ${objectPath}) failed: ${uploadError.message}`);
    }
  }

  /**
   * Removes a "directory" from Supabase Storage.
   * This involves deleting the directory marker object (e.g., `folder/`).
   * The directory must be empty (i.e., contain no other objects under its prefix).
   * @param path The full path to the directory (e.g., `/bucket/folder/`). Must end with `/`.
   * @returns A promise that resolves when the directory marker is removed.
   * @throws Error if the path is invalid, the directory is not empty, or removal fails.
   */
  async rmdir(path: string): Promise<void> {
    const { bucketName, objectPath } = this.parsePath(path);
    if (!objectPath || !objectPath.endsWith('/')) {
      throw new Error(`rmdir: Path must be a directory path ending with '/': ${path}`);
    }

    // Check if directory is empty (should only contain the directory object itself, or be empty if that object isn't listed)
    const { data: files, error: listError } = await this.supabase.storage
      .from(bucketName)
      .list(objectPath, { limit: 2 }); // List items *under* this prefix

    if (listError) {
      if (listError.message.includes("Not found") || (listError as any).status === 404 || listError.message.includes("The resource was not found")) {
        console.warn(`rmdir: Directory ${objectPath} not found or listing failed, assuming already removed or non-existent.`);
        return; // Nothing to remove if the directory itself or its listing fails this way.
      }
      throw new Error(`Supabase rmdir (listing files in ${objectPath}) failed: ${listError.message}`);
    }

    if (files && files.length > 0) {
      throw new Error(`Supabase rmdir failed: Directory ${objectPath} is not empty. Contains: ${files.map(f=>f.name).join(', ')}`);
    }

    // Remove the directory object itself (e.g., "folder/")
    const { error: removeError } = await this.supabase.storage
      .from(bucketName)
      .remove([objectPath]);
    
    // Ignore "Not found" errors for the directory object itself, as it means it's already gone.
    if (removeError && !(removeError.message.includes("Not found") || (removeError as any).status === 404 || removeError.message.includes("The resource was not found"))) {
        throw new Error(`Supabase rmdir (removing directory object ${objectPath}) failed: ${removeError.message}`);
    }
  }

  /**
   * Checks if a file or "directory" (directory marker object) exists in Supabase Storage.
   * @param path The full path to check (e.g., `/bucket/file.txt` or `/bucket/folder/`).
   *             For bucket root, use `/bucket/`. Ambiguous paths like `/bucket` (no trailing slash for root) will throw.
   * @returns A promise that resolves with true if the path exists, false otherwise.
   * @throws Error for ambiguous paths like `/bucketName` (must be `/bucketName/` for root check).
   */
  async exists(path: string): Promise<boolean> {
    const { bucketName, objectPath } = this.parsePath(path);

    if (!objectPath && !path.endsWith('/')) { // e.g. /bucketName (not /bucketName/)
        throw new Error(`exists: Ambiguous path ${path}. For bucket root, use /${bucketName}/. For files/dirs, specify the full path.`);
    }
    
    // If path is for bucket root like /bucketName/, objectPath would be ""
    // We are checking if an object (file or directory marker) exists at objectPath.
    // Supabase list with search is a way to check.
    // objectPath = "file.txt" -> list parent, search "file.txt"
    // objectPath = "folder/" -> list parent, search "folder/"
    // objectPath = "" (from /bucketName/) -> list root, search for what? This case needs care.

    let searchInPath: string | undefined = undefined;
    let searchForName: string;

    if (objectPath === '') { // Path was /bucketName/
        // This implies checking for the existence of the bucket itself, or if it's listable.
        // IFileSystem.exists is about a path. The "root directory" of a bucket conceptually always exists if the bucket does.
        const { error: listBucketError } = await this.supabase.storage.from(bucketName).list(undefined, { limit: 1 });
        // If list errors because bucket not found, then "false". Otherwise, for accessible bucket, root "exists".
        return !listBucketError || !(listBucketError.message.includes("Bucket not found") || (listBucketError as any).status === 404) ;
    }

    if (objectPath.includes('/')) {
      searchInPath = objectPath.substring(0, objectPath.lastIndexOf('/'));
      searchForName = objectPath.substring(objectPath.lastIndexOf('/') + 1);
    } else {
      // Path is like "file.txt" or "folder/" (at the root of the bucket)
      searchInPath = undefined; // Search at the root of the bucket
      searchForName = objectPath;
    }
    
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .list(searchInPath, { search: searchForName, limit: 1 });

    if (error) {
      if (error.message.includes("Not found") || (error as any).status === 404 || error.message.includes("The resource was not found")) {
        return false; // Parent path doesn't exist or other "not found" condition.
      }
      // Other errors might indicate a problem, but for 'exists', could be treated as 'false'.
      console.error(`Supabase exists (listing for ${objectPath}) encountered an error: ${error.message}. Returning false.`);
      return false;
    }
    
    // Ensure the found item's name exactly matches what we're looking for
    return data ? data.some(item => item.name === searchForName) : false;
  }
}

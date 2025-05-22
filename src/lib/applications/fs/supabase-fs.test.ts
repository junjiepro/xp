import { SupabaseFsImpl } from './supabase-fs';
import { IFileSystem } from './common'; // For type checking if needed
import { SupabaseClient, FileObject } from '@supabase/supabase-js'; // For types

// Mock Supabase client
const mockSupabaseClient = {
    storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
    },
};

// Utility to reset mocks before each test
const resetMocks = () => {
    // Clears call history and resets mock implementation to default (jest.fn())
    mockSupabaseClient.storage.from.mockClear().mockReturnThis(); // Ensure 'from' always returns 'this' for chaining
    mockSupabaseClient.storage.upload.mockReset();
    mockSupabaseClient.storage.download.mockReset();
    mockSupabaseClient.storage.remove.mockReset();
    mockSupabaseClient.storage.list.mockReset();
};

describe('SupabaseFsImpl', () => {
    let fs: SupabaseFsImpl;

    beforeEach(() => {
        resetMocks();
        fs = new SupabaseFsImpl(mockSupabaseClient as any as SupabaseClient);
    });

    // Helper for path parsing tests (internal logic, but good to ensure it's behaving)
    describe('Path Parsing (Implicit via method calls)', () => {
        test('should throw error for invalid root path', async () => {
            await expect(fs.readFile('/', null)).rejects.toThrow('Path must start with a bucket name');
            await expect(fs.readFile('/mybucket', null)).rejects.toThrow('Path must be a file'); // readFile specific
        });
         test('should throw error for path only bucket name for writeFile', async () => {
            await expect(fs.writeFile('/mybucket', 'content', null)).rejects.toThrow('Path must be a file');
        });
    });

    describe('readFile', () => {
        test('should download a file and return Uint8Array content', async () => {
            const mockBlob = new Blob(['hello world'], { type: 'text/plain' });
            mockSupabaseClient.storage.download.mockResolvedValueOnce({ data: mockBlob, error: null });

            const content = await fs.readFile('/mybucket/path/to/file.txt');
            
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.download).toHaveBeenCalledWith('path/to/file.txt');
            expect(content).toBeInstanceOf(Uint8Array);
            expect(new TextDecoder().decode(content as Uint8Array)).toBe('hello world');
        });

        test('should throw if path is a directory for readFile', async () => {
            await expect(fs.readFile('/mybucket/path/to/dir/')).rejects.toThrow('Path must be a file');
        });

        test('should handle download error for readFile', async () => {
            mockSupabaseClient.storage.download.mockResolvedValueOnce({ data: null, error: new Error('Download failed') });
            await expect(fs.readFile('/mybucket/path/to/file.txt')).rejects.toThrow('Download failed');
        });
         test('should throw if no data is returned for readFile', async () => {
            mockSupabaseClient.storage.download.mockResolvedValueOnce({ data: null, error: null });
            await expect(fs.readFile('/mybucket/path/to/file.txt')).rejects.toThrow('No data returned');
        });
    });

    describe('writeFile', () => {
        test('should upload string content to the correct bucket and path', async () => {
            mockSupabaseClient.storage.upload.mockResolvedValueOnce({ data: {}, error: null });
            const content = 'hello world';
            const expectedData = new TextEncoder().encode(content);

            await fs.writeFile('/mybucket/file.txt', content);
            
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.upload).toHaveBeenCalledWith('file.txt', expectedData, { upsert: true });
        });

        test('should upload Uint8Array content', async () => {
            mockSupabaseClient.storage.upload.mockResolvedValueOnce({ data: {}, error: null });
            const content = new Uint8Array([1, 2, 3]);
            
            await fs.writeFile('/mybucket/data.bin', content);
            
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.upload).toHaveBeenCalledWith('data.bin', content, { upsert: true });
        });

        test('should handle upload error for writeFile', async () => {
            mockSupabaseClient.storage.upload.mockResolvedValueOnce({ data: null, error: new Error('Upload failed miserably') });
            await expect(fs.writeFile('/mybucket/file.txt', 'content')).rejects.toThrow('Upload failed miserably');
        });

        test('should throw if path is a directory for writeFile', async () => {
            await expect(fs.writeFile('/mybucket/path/to/dir/', 'content')).rejects.toThrow('Path must be a file');
        });
    });

    describe('deleteFile', () => {
        test('should remove a file from the correct bucket and path', async () => {
            mockSupabaseClient.storage.remove.mockResolvedValueOnce({ data: [{/* some data about removed file */}], error: null });
            await fs.deleteFile('/mybucket/file_to_delete.txt');
            
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.remove).toHaveBeenCalledWith(['file_to_delete.txt']);
        });

        test('should handle remove error for deleteFile', async () => {
            mockSupabaseClient.storage.remove.mockResolvedValueOnce({ data: null, error: new Error('Remove failed') });
            await expect(fs.deleteFile('/mybucket/file.txt')).rejects.toThrow('Remove failed');
        });

        test('should throw if path is a directory for deleteFile', async () => {
            await expect(fs.deleteFile('/mybucket/path/to/dir/')).rejects.toThrow('Path must be a file');
        });
    });

    describe('listFiles', () => {
        const mockFileObjects: FileObject[] = [
            { name: 'file1.txt', id: 'id1', updated_at: '', created_at: '', last_accessed_at: '', metadata: {} },
            { name: 'subdir/', id: 'id2', updated_at: '', created_at: '', last_accessed_at: '', metadata: {} },
        ];

        test('should list files from the correct bucket and path prefix', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: mockFileObjects, error: null });
            const result = await fs.listFiles('/mybucket/folder/');
            
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith('folder/', expect.anything());
            expect(result).toEqual(['file1.txt', 'subdir/']);
        });
        
        test('should list files from bucket root if path is /mybucket/', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: mockFileObjects, error: null });
            const result = await fs.listFiles('/mybucket/');
            
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith(undefined, expect.anything()); // objectPath is empty for root
            expect(result).toEqual(['file1.txt', 'subdir/']);
        });

        test('should treat path without trailing slash as directory for listFiles', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: mockFileObjects, error: null });
            await fs.listFiles('/mybucket/folder'); // No trailing slash
            expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith('folder/', expect.anything());
        });
        
        test('should handle empty list for listFiles', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: [], error: null });
            const result = await fs.listFiles('/mybucket/emptyfolder/');
            expect(result).toEqual([]);
        });

        test('should handle list error for listFiles', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: null, error: new Error('List failed') });
            await expect(fs.listFiles('/mybucket/folder/')).rejects.toThrow('List failed');
        });
    });

    describe('mkdir', () => {
        test('should create a directory object (empty file with trailing slash)', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: [], error: null }); // Mock for exists check
            mockSupabaseClient.storage.upload.mockResolvedValueOnce({ data: {}, error: null });
            
            await fs.mkdir('/mybucket/newdir/');
            
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            // Check for existing directory object
            expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith('newdir', {"limit": 1, "search": "/"}); // simplified, based on actual implementation
            // Upload of the directory marker
            expect(mockSupabaseClient.storage.upload).toHaveBeenCalledWith('newdir/', expect.any(Blob), { upsert: false });
        });

        test('should not create if directory object already exists', async () => {
            const existingDirObject: FileObject[] = [{ name: 'newdir/', id: 'id', updated_at: '', created_at: '', last_accessed_at: '', metadata: {} }];
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: existingDirObject, error: null }); // Simulate dir object exists

            await fs.mkdir('/mybucket/newdir/');
            expect(mockSupabaseClient.storage.upload).not.toHaveBeenCalled();
        });
        
        test('should throw if path does not end with slash for mkdir', async () => {
            await expect(fs.mkdir('/mybucket/newdir')).rejects.toThrow('Path must be a directory path ending with');
        });

        test('should handle upload error for mkdir if not "already exists"', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: [], error: null }); // Does not exist
            mockSupabaseClient.storage.upload.mockResolvedValueOnce({ data: null, error: new Error('Mkdir upload failed') });
            await expect(fs.mkdir('/mybucket/newdir_err/')).rejects.toThrow('Mkdir upload failed');
        });

        test('should not throw if upload error is "already exists" for mkdir', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: [], error: null }); // Does not exist initially
            // Supabase might return a specific error for "duplicate" or "already exists"
            const duplicateError = new Error('HttpException: The resource already exists') as any; // Cast to any to add statusCode
            duplicateError.statusCode = '409'; // Or whatever Supabase uses
            mockSupabaseClient.storage.upload.mockResolvedValueOnce({ data: null, error: duplicateError });
            
            // Based on current SupabaseFsImpl, it checks for "duplicate" or "already exists" in message
            await expect(fs.mkdir('/mybucket/newdir_dup/')).resolves.not.toThrow();
        });
    });

    describe('rmdir', () => {
        test('should remove an empty directory object', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: [], error: null }); // Directory is empty
            mockSupabaseClient.storage.remove.mockResolvedValueOnce({ data: [{/* success data */}], error: null });
            
            await fs.rmdir('/mybucket/emptydir/');
            
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith('emptydir/', { limit: 2 }); // Check if empty
            expect(mockSupabaseClient.storage.remove).toHaveBeenCalledWith(['emptydir/']); // Remove the dir object
        });

        test('should throw if directory is not empty for rmdir', async () => {
            const mockFiles: FileObject[] = [{ name: 'file.txt', id: 'id', updated_at: '', created_at: '', last_accessed_at: '', metadata: {} }];
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: mockFiles, error: null }); // Directory not empty
            
            await expect(fs.rmdir('/mybucket/nonemptydir/')).rejects.toThrow('Directory nonemptydir/ is not empty');
            expect(mockSupabaseClient.storage.remove).not.toHaveBeenCalled();
        });
        
        test('should not throw if directory object not found on remove for rmdir (already gone)', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: [], error: null }); // Directory is empty
            const notFoundError = new Error('Not found') as any;
            notFoundError.statusCode = '404'; // Or similar for "Not Found"
            mockSupabaseClient.storage.remove.mockResolvedValueOnce({ data: null, error: notFoundError });
            
            await expect(fs.rmdir('/mybucket/alreadygonedir/')).resolves.not.toThrow();
        });

        test('should throw if path does not end with slash for rmdir', async () => {
            await expect(fs.rmdir('/mybucket/dir')).rejects.toThrow('Path must be a directory path ending with');
        });
    });

    describe('exists', () => {
        test('should return true for an existing file', async () => {
            const mockFile: FileObject[] = [{ name: 'file.txt', id: 'id', updated_at: '', created_at: '', last_accessed_at: '', metadata: {} }];
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: mockFile, error: null });
            
            const result = await fs.exists('/mybucket/foo/file.txt');
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith('foo', { search: 'file.txt', limit: 1 });
            expect(result).toBe(true);
        });

        test('should return true for an existing directory object', async () => {
            const mockDirObject: FileObject[] = [{ name: 'dir/', id: 'id', updated_at: '', created_at: '', last_accessed_at: '', metadata: {} }];
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: mockDirObject, error: null });
            
            const result = await fs.exists('/mybucket/foo/dir/');
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith('foo', { search: 'dir/', limit: 1 });
            expect(result).toBe(true);
        });
        
        test('should return true for bucket root path /mybucket/', async () => {
            // exists for /bucketName/ checks if bucket is listable
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: [], error: null });
            const result = await fs.exists('/mybucket/');
            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket');
            expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith(undefined, { limit: 1 });
            expect(result).toBe(true);
        });

        test('should return false if bucket not found for root path /mybucket/', async () => {
            const bucketNotFoundError = new Error('Bucket not found') as any;
            bucketNotFoundError.status = 404; // Or similar
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: null, error: bucketNotFoundError });
            const result = await fs.exists('/mybucket_nonexistent/');
             expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('mybucket_nonexistent');
            expect(mockSupabaseClient.storage.list).toHaveBeenCalledWith(undefined, { limit: 1 });
            expect(result).toBe(false); // Should be false if bucket itself doesn't exist.
        });


        test('should return false for a non-existent path', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: [], error: null }); // No item found
            const result = await fs.exists('/mybucket/nonexistent.txt');
            expect(result).toBe(false);
        });
        
        test('should return false if list errors (e.g. parent path not found)', async () => {
            mockSupabaseClient.storage.list.mockResolvedValueOnce({ data: null, error: new Error('Storage error: Not found') });
            const result = await fs.exists('/mybucket/some/nonexistent.txt');
            expect(result).toBe(false);
        });

        test('should throw for ambiguous path like /mybucket (no trailing slash for root)', async () => {
            await expect(fs.exists('/mybucket')).rejects.toThrow('Ambiguous path');
        });
    });
});

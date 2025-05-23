import { CachedSupabaseFsImpl } from './cached-supabase-fs';
import { IFileSystem } from './common';

describe('CachedSupabaseFsImpl', () => {
  let mockSupabaseFs: jest.Mocked<IFileSystem>;
  let mockCacheFs: jest.Mocked<IFileSystem>;
  let cachedFs: CachedSupabaseFsImpl;
  const cacheBasePrefix = '/cache/supabase';

  beforeEach(() => {
    mockSupabaseFs = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      deleteFile: jest.fn(),
      listFiles: jest.fn(),
      mkdir: jest.fn(),
      rmdir: jest.fn(),
      exists: jest.fn(),
    };
    mockCacheFs = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      deleteFile: jest.fn(),
      listFiles: jest.fn(),
      mkdir: jest.fn(),
      rmdir: jest.fn(),
      exists: jest.fn(),
    };
    cachedFs = new CachedSupabaseFsImpl(mockSupabaseFs, mockCacheFs, cacheBasePrefix);
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error for cache failures
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const testSupabasePath = '/bucket/file.txt';
  const expectedCachePath = `${cacheBasePrefix}/bucket/file.txt`;
  const testContent = 'file content';
  const testContentUint8 = new TextEncoder().encode(testContent);

  describe('getCachePath', () => {
    test('should correctly prepend cacheBasePrefix', () => {
      expect((cachedFs as any).getCachePath('/bucket/file.txt')).toBe('/cache/supabase/bucket/file.txt');
    });
    test('should handle leading slash in supabasePath', () => {
      expect((cachedFs as any).getCachePath('bucket/file.txt')).toBe('/cache/supabase/bucket/file.txt');
    });
     test('should handle empty supabasePath (e.g. for root operations if any)', () => {
      expect((cachedFs as any).getCachePath('/')).toBe('/cache/supabase/');
      expect((cachedFs as any).getCachePath('')).toBe('/cache/supabase/');
    });
     test('should handle cacheBasePrefix being "/" or empty', () => {
        let fs = new CachedSupabaseFsImpl(mockSupabaseFs, mockCacheFs, "/");
        expect((fs as any).getCachePath('/bucket/file.txt')).toBe('/bucket/file.txt');
        fs = new CachedSupabaseFsImpl(mockSupabaseFs, mockCacheFs, "");
        expect((fs as any).getCachePath('/bucket/file.txt')).toBe('/bucket/file.txt');
    });
  });

  describe('readFile', () => {
    test('cache hit: should return data from cacheFs and not call supabaseFs', async () => {
      mockCacheFs.readFile.mockResolvedValue(testContentUint8);
      
      const result = await cachedFs.readFile(testSupabasePath);
      
      expect(result).toEqual(testContentUint8);
      expect(mockCacheFs.readFile).toHaveBeenCalledWith(expectedCachePath);
      expect(mockSupabaseFs.readFile).not.toHaveBeenCalled();
    });

    test('cache miss: should read from supabaseFs, cache the result, and return data', async () => {
      mockCacheFs.readFile.mockRejectedValue(new Error('Cache miss - Not found'));
      mockSupabaseFs.readFile.mockResolvedValue(testContentUint8);
      mockCacheFs.writeFile.mockResolvedValue(undefined); // Cache write success
      
      const result = await cachedFs.readFile(testSupabasePath);
      
      expect(result).toEqual(testContentUint8);
      expect(mockCacheFs.readFile).toHaveBeenCalledWith(expectedCachePath);
      expect(mockSupabaseFs.readFile).toHaveBeenCalledWith(testSupabasePath);
      // Asynchronous cache write, wait for it if necessary for assertion, or trust it's called
      // For this test, we can ensure it's called. If it's truly async without awaiting,
      // we might need to use timers or other mechanisms if the test environment doesn't handle it.
      // Here, we assume the promise chain completes or is testable.
      await new Promise(process.nextTick); // Allow microtasks queue to flush
      expect(mockCacheFs.writeFile).toHaveBeenCalledWith(expectedCachePath, testContentUint8);
    });

    test('cache miss and cache write fails: should still return data from supabaseFs', async () => {
      mockCacheFs.readFile.mockRejectedValue(new Error('Cache miss'));
      mockSupabaseFs.readFile.mockResolvedValue(testContentUint8);
      mockCacheFs.writeFile.mockRejectedValue(new Error('Cache write failed')); // Cache write fails
      
      const result = await cachedFs.readFile(testSupabasePath);
      
      expect(result).toEqual(testContentUint8);
      expect(mockSupabaseFs.readFile).toHaveBeenCalledWith(testSupabasePath);
      await new Promise(process.nextTick);
      expect(mockCacheFs.writeFile).toHaveBeenCalledWith(expectedCachePath, testContentUint8);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to cache'), expect.any(String));
    });

    test('supabase error: should propagate error and not write to cache', async () => {
      mockCacheFs.readFile.mockRejectedValue(new Error('Cache miss'));
      mockSupabaseFs.readFile.mockRejectedValue(new Error('Supabase down'));
      
      await expect(cachedFs.readFile(testSupabasePath)).rejects.toThrow('Supabase down');
      expect(mockCacheFs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('writeFile', () => {
    test('should write to supabaseFs and then to cacheFs (write-through)', async () => {
      mockSupabaseFs.writeFile.mockResolvedValue(undefined);
      mockCacheFs.writeFile.mockResolvedValue(undefined);

      await cachedFs.writeFile(testSupabasePath, testContentUint8);

      expect(mockSupabaseFs.writeFile).toHaveBeenCalledWith(testSupabasePath, testContentUint8);
      expect(mockCacheFs.writeFile).toHaveBeenCalledWith(expectedCachePath, testContentUint8);
    });

    test('supabase error: should propagate error and not write to cacheFs', async () => {
      mockSupabaseFs.writeFile.mockRejectedValue(new Error('Supabase write fail'));

      await expect(cachedFs.writeFile(testSupabasePath, testContentUint8)).rejects.toThrow('Supabase write fail');
      expect(mockCacheFs.writeFile).not.toHaveBeenCalled();
    });

    test('cache write error: should log error but main operation succeeds', async () => {
      mockSupabaseFs.writeFile.mockResolvedValue(undefined);
      mockCacheFs.writeFile.mockRejectedValue(new Error('Cache write fail detailed'));

      await expect(cachedFs.writeFile(testSupabasePath, testContentUint8)).resolves.toBeUndefined();
      expect(mockSupabaseFs.writeFile).toHaveBeenCalledWith(testSupabasePath, testContentUint8);
      expect(mockCacheFs.writeFile).toHaveBeenCalledWith(expectedCachePath, testContentUint8);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to update cache'), expect.any(String));
    });
  });

  describe('deleteFile', () => {
    test('should delete from supabaseFs and then from cacheFs', async () => {
      mockSupabaseFs.deleteFile.mockResolvedValue(undefined);
      mockCacheFs.exists.mockResolvedValueOnce(true); // Assume cache entry exists
      mockCacheFs.deleteFile.mockResolvedValue(undefined);

      await cachedFs.deleteFile(testSupabasePath);

      expect(mockSupabaseFs.deleteFile).toHaveBeenCalledWith(testSupabasePath);
      expect(mockCacheFs.exists).toHaveBeenCalledWith(expectedCachePath);
      expect(mockCacheFs.deleteFile).toHaveBeenCalledWith(expectedCachePath);
    });
    
    test('should delete from supabaseFs and attempt cacheFs delete even if cache entry not found', async () => {
      mockSupabaseFs.deleteFile.mockResolvedValue(undefined);
      mockCacheFs.exists.mockResolvedValueOnce(false); // Cache entry does not exist

      await cachedFs.deleteFile(testSupabasePath);

      expect(mockSupabaseFs.deleteFile).toHaveBeenCalledWith(testSupabasePath);
      expect(mockCacheFs.exists).toHaveBeenCalledWith(expectedCachePath);
      expect(mockCacheFs.deleteFile).not.toHaveBeenCalled(); // Not called if not exists
    });


    test('supabase error: should propagate error and not delete from cacheFs', async () => {
      mockSupabaseFs.deleteFile.mockRejectedValue(new Error('Supabase delete fail'));

      await expect(cachedFs.deleteFile(testSupabasePath)).rejects.toThrow('Supabase delete fail');
      expect(mockCacheFs.deleteFile).not.toHaveBeenCalled();
    });

    test('cache delete error: should log error but main operation succeeds', async () => {
      mockSupabaseFs.deleteFile.mockResolvedValue(undefined);
      mockCacheFs.exists.mockResolvedValueOnce(true);
      mockCacheFs.deleteFile.mockRejectedValue(new Error('Cache delete fail'));

      await expect(cachedFs.deleteFile(testSupabasePath)).resolves.toBeUndefined();
      expect(mockCacheFs.deleteFile).toHaveBeenCalledWith(expectedCachePath);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to delete from cache'), expect.any(String));
    });
  });

  describe('listFiles', () => {
    test('should directly call supabaseFs.listFiles and not interact with cache', async () => {
      const fileList = ['file1.txt', 'subdir/'];
      mockSupabaseFs.listFiles.mockResolvedValue(fileList);

      const result = await cachedFs.listFiles(testSupabasePath);

      expect(result).toEqual(fileList);
      expect(mockSupabaseFs.listFiles).toHaveBeenCalledWith(testSupabasePath);
      expect(mockCacheFs.listFiles).not.toHaveBeenCalled();
    });
  });

  describe('mkdir', () => {
    const dirPath = '/bucket/new_dir/';
    const cacheDirPath = `${cacheBasePrefix}/bucket/new_dir/`;

    test('should call supabaseFs.mkdir and then cacheFs.mkdir', async () => {
      mockSupabaseFs.mkdir.mockResolvedValue(undefined);
      mockCacheFs.mkdir.mockResolvedValue(undefined);

      await cachedFs.mkdir(dirPath);

      expect(mockSupabaseFs.mkdir).toHaveBeenCalledWith(dirPath);
      expect(mockCacheFs.mkdir).toHaveBeenCalledWith(cacheDirPath);
    });
    
    test('cache mkdir error: should log error but main op succeeds', async () => {
        mockSupabaseFs.mkdir.mockResolvedValue(undefined);
        mockCacheFs.mkdir.mockRejectedValue(new Error('Cache mkdir fail'));

        await cachedFs.mkdir(dirPath);
        expect(mockSupabaseFs.mkdir).toHaveBeenCalledWith(dirPath);
        expect(mockCacheFs.mkdir).toHaveBeenCalledWith(cacheDirPath);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to mirror directory in cache'), expect.any(String));
    });
  });

  describe('rmdir', () => {
    const dirPath = '/bucket/empty_dir/';
    const cacheDirPath = `${cacheBasePrefix}/bucket/empty_dir/`;

    test('should call supabaseFs.rmdir, then cacheFs.rmdir if cache entry exists', async () => {
      mockSupabaseFs.rmdir.mockResolvedValue(undefined);
      mockCacheFs.exists.mockResolvedValueOnce(true);
      mockCacheFs.rmdir.mockResolvedValue(undefined);

      await cachedFs.rmdir(dirPath);

      expect(mockSupabaseFs.rmdir).toHaveBeenCalledWith(dirPath);
      expect(mockCacheFs.exists).toHaveBeenCalledWith(cacheDirPath);
      expect(mockCacheFs.rmdir).toHaveBeenCalledWith(cacheDirPath);
    });
    
    test('cache rmdir error: should log error but main op succeeds', async () => {
        mockSupabaseFs.rmdir.mockResolvedValue(undefined);
        mockCacheFs.exists.mockResolvedValueOnce(true);
        mockCacheFs.rmdir.mockRejectedValue(new Error('Cache rmdir fail'));

        await cachedFs.rmdir(dirPath);
        expect(mockSupabaseFs.rmdir).toHaveBeenCalledWith(dirPath);
        expect(mockCacheFs.rmdir).toHaveBeenCalledWith(cacheDirPath);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to remove from cache'), expect.any(String));
    });
  });

  describe('exists', () => {
    test('cache hit: should return true from cacheFs and not call supabaseFs', async () => {
      mockCacheFs.exists.mockResolvedValue(true);
      
      const result = await cachedFs.exists(testSupabasePath);
      
      expect(result).toBe(true);
      expect(mockCacheFs.exists).toHaveBeenCalledWith(expectedCachePath);
      expect(mockSupabaseFs.exists).not.toHaveBeenCalled();
    });

    test('cache miss: should call supabaseFs.exists and return its result', async () => {
      mockCacheFs.exists.mockResolvedValue(false);
      mockSupabaseFs.exists.mockResolvedValue(true); // Supabase has it
      
      const result = await cachedFs.exists(testSupabasePath);
      
      expect(result).toBe(true);
      expect(mockCacheFs.exists).toHaveBeenCalledWith(expectedCachePath);
      expect(mockSupabaseFs.exists).toHaveBeenCalledWith(testSupabasePath);
    });
    
    test('cache miss and supabase miss: should return false', async () => {
      mockCacheFs.exists.mockResolvedValue(false);
      mockSupabaseFs.exists.mockResolvedValue(false); // Supabase doesn't have it
      
      const result = await cachedFs.exists(testSupabasePath);
      
      expect(result).toBe(false);
      expect(mockSupabaseFs.exists).toHaveBeenCalledWith(testSupabasePath);
    });
  });
});

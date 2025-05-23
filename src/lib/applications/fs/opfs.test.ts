import { OpfsImpl } from './opfs';
import { IFileSystem } from './common';

// --- Mocks Setup ---
let mockRootDirectoryHandle: any;
let mockNavigatorStorageGetDirectory: jest.Mock;

// Helper to create a mock FileSystemFileHandle
const createFileMock = (name: string, content: Uint8Array = new Uint8Array()) => ({
  kind: 'file' as const,
  name,
  getFile: jest.fn().mockResolvedValue(new File([content], name, { type: 'application/octet-stream' })),
  createWritable: jest.fn().mockResolvedValue({
    write: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    seek: jest.fn().mockResolvedValue(undefined),
    truncate: jest.fn().mockResolvedValue(undefined),
  }),
});

// Helper to create a mock FileSystemDirectoryHandle
const createDirectoryMock = (name: string, entries: Record<string, any> = {}) => {
    const handle: any = { // Use 'any' for easier dynamic mock building
        kind: 'directory' as const,
        name,
        entries, // Store entries directly for easier manipulation in tests
        getFileHandle: jest.fn(async (fileName, options) => {
            if (handle.entries[fileName]?.kind === 'file') {
                return handle.entries[fileName];
            }
            if (options?.create) {
                handle.entries[fileName] = createFileMock(fileName);
                return handle.entries[fileName];
            }
            const e = new DOMException(`File not found: ${fileName}`, 'NotFoundError');
            throw e;
        }),
        getDirectoryHandle: jest.fn(async (dirName, options) => {
            if (handle.entries[dirName]?.kind === 'directory') {
                return handle.entries[dirName];
            }
            if (options?.create) {
                handle.entries[dirName] = createDirectoryMock(dirName);
                return handle.entries[dirName];
            }
            const e = new DOMException(`Directory not found: ${dirName}`, 'NotFoundError');
            throw e;
        }),
        removeEntry: jest.fn(async (entryName, options) => {
            if (!handle.entries[entryName]) {
                 const e = new DOMException(`Entry not found: ${entryName}`, 'NotFoundError');
                 throw e;
            }
            if (handle.entries[entryName].kind === 'directory') {
                const dirEntries = Object.keys(handle.entries[entryName].entries);
                if (dirEntries.length > 0 && (!options || !options.recursive)) {
                    // Simplified: OPFS actual error is InvalidModificationError for non-empty rmdir without recursive
                    const e = new DOMException('Directory not empty.', 'InvalidModificationError');
                    throw e;
                }
            }
            delete handle.entries[entryName];
            return undefined;
        }),
        values: jest.fn().mockImplementation(async function*() {
            for (const entryName in handle.entries) {
                yield handle.entries[entryName];
            }
        }),
    };
    return handle;
};


describe('OpfsImpl', () => {
  let fs: IFileSystem;

  beforeEach(() => {
    jest.resetAllMocks(); // Reset all mocks including global ones if any
    mockRootDirectoryHandle = createDirectoryMock('root_opfs_dir');
    mockNavigatorStorageGetDirectory = jest.fn().mockResolvedValue(mockRootDirectoryHandle);

    // Global navigator mock
    global.navigator = {
      storage: {
        getDirectory: mockNavigatorStorageGetDirectory,
      },
    } as any;

    fs = new OpfsImpl();
  });

  test('constructor does not throw if OPFS API is present', () => {
    expect(() => new OpfsImpl()).not.toThrow();
  });

  test('constructor throws if OPFS API is not available', () => {
    (global.navigator as any) = { storage: {} }; // Simulate API missing getDirectory
    expect(() => new OpfsImpl()['getRootDirectoryHandle']()).rejects.toThrow('Origin Private File System API is not available');
    (global.navigator as any) = { }; // Simulate API missing storage
     expect(() => new OpfsImpl()['getRootDirectoryHandle']()).rejects.toThrow('Origin Private File System API is not available');

  });

  describe('exists', () => {
    test('should return true for an existing file', async () => {
      mockRootDirectoryHandle.entries['test.txt'] = createFileMock('test.txt');
      expect(await fs.exists('/test.txt')).toBe(true);
    });

    test('should return true for an existing directory', async () => {
      mockRootDirectoryHandle.entries['mydir'] = createDirectoryMock('mydir');
      expect(await fs.exists('/mydir/')).toBe(true);
      expect(await fs.exists('/mydir')).toBe(true); // Also true without trailing slash
    });

    test('should return false for a non-existent path', async () => {
      expect(await fs.exists('/nonexistent.txt')).toBe(false);
    });
    
    test('should return true for root path', async () => {
        expect(await fs.exists('/')).toBe(true);
        expect(await fs.exists('')).toBe(true);
    });

    test('should correctly check nested existing file', async () => {
        const nestedDir = createDirectoryMock('nes_dir');
        nestedDir.entries['deepfile.txt'] = createFileMock('deepfile.txt');
        mockRootDirectoryHandle.entries['nes_dir'] = nestedDir;
        expect(await fs.exists('/nes_dir/deepfile.txt')).toBe(true);
    });
  });

  describe('readFile', () => {
    test('should read file content as Uint8Array', async () => {
      const content = new TextEncoder().encode('hello opfs');
      mockRootDirectoryHandle.entries['readtest.txt'] = createFileMock('readtest.txt', content);
      
      const data = await fs.readFile('/readtest.txt');
      expect(data).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(data as Uint8Array)).toBe('hello opfs');
    });

    test('readFile should throw for non-existent file', async () => {
      await expect(fs.readFile('/nonexistent_read.txt')).rejects.toThrow('NotFoundError');
    });

    test('readFile should throw if path is a directory', async () => {
        mockRootDirectoryHandle.entries['dir_as_file'] = createDirectoryMock('dir_as_file');
        // getFileHandleRecursive would throw TypeMismatchError if it finds a dir instead of a file
        // The mock getFileHandle throws NotFoundError if not found, or if kind is not file.
        // We'll refine the mock for getFileHandle to throw TypeMismatchError
         mockRootDirectoryHandle.getFileHandle = jest.fn(async (fileName) => {
            if (mockRootDirectoryHandle.entries[fileName]?.kind === 'directory') {
                 throw new DOMException(`Type Mismatch: ${fileName} is a directory.`, 'TypeMismatchError');
            }
            // ... (original logic for finding file or creating)
            throw new DOMException('Not Found', 'NotFoundError');
        });
        await expect(fs.readFile('/dir_as_file')).rejects.toThrow("Path conflict: 'dir_as_file' is a directory, not a file");
    });
  });

  describe('writeFile', () => {
    test('should write string content to a new file', async () => {
      await fs.writeFile('/writetest.txt', 'hello write');
      
      expect(mockRootDirectoryHandle.getFileHandle).toHaveBeenCalledWith('writetest.txt', { create: true });
      // Assuming getFileHandle creates the mock and returns it:
      const mockFile = mockRootDirectoryHandle.entries['writetest.txt'];
      expect(mockFile.createWritable).toHaveBeenCalled();
      const writable = await mockFile.createWritable();
      expect(writable.write).toHaveBeenCalledWith(new TextEncoder().encode('hello write'));
      expect(writable.close).toHaveBeenCalled();
    });

    test('should write Uint8Array content and create parent directories', async () => {
        const content = new Uint8Array([1, 2, 3]);
        await fs.writeFile('/newdir/writeuint.dat', content);

        expect(mockRootDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('newdir', { create: true });
        const newDirMock = mockRootDirectoryHandle.entries['newdir']; // created by mock
        expect(newDirMock.getFileHandle).toHaveBeenCalledWith('writeuint.dat', { create: true });
        
        const mockFile = newDirMock.entries['writeuint.dat'];
        const writable = await mockFile.createWritable();
        expect(writable.write).toHaveBeenCalledWith(content);
        expect(writable.close).toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    test('should delete an existing file', async () => {
      mockRootDirectoryHandle.entries['deleteme.txt'] = createFileMock('deleteme.txt');
      await fs.deleteFile('/deleteme.txt');
      expect(mockRootDirectoryHandle.removeEntry).toHaveBeenCalledWith('deleteme.txt');
       expect(mockRootDirectoryHandle.entries['deleteme.txt']).toBeUndefined();
    });

    test('deleteFile should throw for non-existent file', async () => {
      await expect(fs.deleteFile('/nonexistent_delete.txt')).rejects.toThrow('NotFoundError');
    });

    test('deleteFile should throw if path is a directory', async () => {
        mockRootDirectoryHandle.entries['dir_to_delete_as_file'] = createDirectoryMock('dir_to_delete_as_file');
        // OpfsImpl.deleteFile checks if it's a file first using getFileHandle
        // Change mock getFileHandle to throw TypeMismatchError if it's a directory
        mockRootDirectoryHandle.getFileHandle = jest.fn(async (name) => {
            if (mockRootDirectoryHandle.entries[name]?.kind === 'directory') {
                throw new DOMException('Type Mismatch', 'TypeMismatchError');
            }
            throw new DOMException('Not Found', 'NotFoundError');
        });
        await expect(fs.deleteFile('/dir_to_delete_as_file')).rejects.toThrow("'dir_to_delete_as_file' is a directory, not a file.");
    });
  });

  describe('mkdir', () => {
    test('should create a single directory', async () => {
      await fs.mkdir('/mkdir_test');
      expect(mockRootDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('mkdir_test', { create: true });
    });

    test('should create nested directories', async () => {
      await fs.mkdir('/mkdir_parent/mkdir_child');
      expect(mockRootDirectoryHandle.getDirectoryHandle).toHaveBeenCalledWith('mkdir_parent', { create: true });
      // The mock for getDirectoryHandle should handle recursive creation for the test
      const parentDirMock = mockRootDirectoryHandle.entries['mkdir_parent'];
      expect(parentDirMock.getDirectoryHandle).toHaveBeenCalledWith('mkdir_child', { create: true });
    });
    
    test('mkdir on existing directory should not throw (idempotent)', async () => {
        mockRootDirectoryHandle.entries['existing_mkdir'] = createDirectoryMock('existing_mkdir');
        await expect(fs.mkdir('/existing_mkdir/')).resolves.not.toThrow();
    });
  });

  describe('rmdir', () => {
    test('should remove an empty directory', async () => {
      mockRootDirectoryHandle.entries['empty_rm_dir'] = createDirectoryMock('empty_rm_dir', {}); // Empty entries
      await fs.rmdir('/empty_rm_dir');
      expect(mockRootDirectoryHandle.removeEntry).toHaveBeenCalledWith('empty_rm_dir', { recursive: false });
    });

    test('rmdir should throw if directory is not empty', async () => {
      const fileInDir = createFileMock('file.txt');
      mockRootDirectoryHandle.entries['non_empty_rm_dir'] = createDirectoryMock('non_empty_rm_dir', { 'file.txt': fileInDir });
      await expect(fs.rmdir('/non_empty_rm_dir')).rejects.toThrow('Directory not empty: /non_empty_rm_dir');
    });

    test('rmdir should throw for non-existent directory', async () => {
      await expect(fs.rmdir('/nonexistent_rm_dir')).rejects.toThrow('NotFoundError');
    });
  });

  describe('listFiles', () => {
    test('should list an empty directory', async () => {
      mockRootDirectoryHandle.entries['list_empty_dir'] = createDirectoryMock('list_empty_dir', {});
      const files = await fs.listFiles('/list_empty_dir');
      expect(files).toEqual([]);
    });

    test('should list files and directories with trailing slash for dirs', async () => {
      const file1 = createFileMock('file1.txt');
      const subdir1 = createDirectoryMock('subdir1');
      mockRootDirectoryHandle.entries['list_dir_complex'] = createDirectoryMock('list_dir_complex', {
        'file1.txt': file1,
        'subdir1': subdir1,
      });
      const files = await fs.listFiles('/list_dir_complex');
      expect(files).toHaveLength(2);
      expect(files).toContain('file1.txt');
      expect(files).toContain('subdir1/');
    });

    test('should list root directory', async () => {
        mockRootDirectoryHandle.entries['root_file.txt'] = createFileMock('root_file.txt');
        mockRootDirectoryHandle.entries['root_subdir'] = createDirectoryMock('root_subdir');
        const files = await fs.listFiles('/');
        expect(files).toContain('root_file.txt');
        expect(files).toContain('root_subdir/');
    });
  });
});

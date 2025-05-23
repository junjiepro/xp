import { UnifiedFsService } from './index';
import { memFsInstance } from './memfs'; // This is the singleton instance
import { SupabaseFsImpl } from './supabase-fs';
import { Session, SupabaseClient } from '@supabase/supabase-js';

// Mock the underlying FS implementations
// memFsInstance is a direct export, so we need to mock its methods.
// We can achieve this by mocking the entire './memfs' module.
import { CachedSupabaseFsImpl } from './cached-supabase-fs';

jest.mock('./memfs', () => ({
    memFsInstance: {
        readFile: jest.fn(), writeFile: jest.fn(), deleteFile: jest.fn(),
        listFiles: jest.fn(), mkdir: jest.fn(), rmdir: jest.fn(), exists: jest.fn(),
    },
}));

jest.mock('./supabase-fs'); // Underlying SupabaseFsImpl used by CachedSupabaseFsImpl
jest.mock('./opfs');       // OpfsImpl used for /local/ and as cache backend for CachedSupabaseFsImpl
jest.mock('./cached-supabase-fs'); // The one we are testing the integration of

const mockSupabaseClient = {} as SupabaseClient;

describe('UnifiedFsService', () => {
    let unifiedFs: UnifiedFsService;
    let mockMemFs: jest.Mocked<typeof memFsInstance>;
    // let mockSupabaseFs: jest.Mocked<SupabaseFsImpl>; // No longer directly used for /supabase/ path
    let mockOpfs: jest.Mocked<OpfsImpl>; // For /local/ paths
    let mockCachedSupabaseFs: jest.Mocked<CachedSupabaseFsImpl>; // For /supabase/ paths

    const mockSession = { user: { id: 'test-user' } } as Session;
    const nullSession = null;

    beforeEach(() => {
        jest.clearAllMocks();

        mockMemFs = memFsInstance as jest.Mocked<typeof memFsInstance>;

        // Mock for OpfsImpl used for /local/ paths
        // The UnifiedFsService constructor will call `new OpfsImpl()` twice:
        // 1. For this.opfs (used for /local/)
        // 2. For cacheStorageFsForSupabase (passed to CachedSupabaseFsImpl)
        // We need to ensure the mock for this.opfs is distinct or correctly configured if shared.
        // For simplicity, let's assume the first OpfsImpl instance created is for /local/
        // and the second one for the cache.
        const MockedOpfsImpl = OpfsImpl as jest.MockedClass<typeof OpfsImpl>;
        
        // Mock for OpfsImpl that will be assigned to this.opfs (for /local/ routes)
        mockOpfs = {
            readFile: jest.fn(), writeFile: jest.fn(), deleteFile: jest.fn(),
            listFiles: jest.fn(), mkdir: jest.fn(), rmdir: jest.fn(), exists: jest.fn(),
        } as jest.Mocked<OpfsImpl>;

        // Mock for CachedSupabaseFsImpl that will be assigned to this.supabaseFs
        mockCachedSupabaseFs = {
            readFile: jest.fn(), writeFile: jest.fn(), deleteFile: jest.fn(),
            listFiles: jest.fn(), mkdir: jest.fn(), rmdir: jest.fn(), exists: jest.fn(),
        } as jest.Mocked<CachedSupabaseFsImpl>;

        let opfsInstanceCount = 0;
        MockedOpfsImpl.mockImplementation(() => {
            opfsInstanceCount++;
            if (opfsInstanceCount === 1) { // First instance is for this.opfs
                return mockOpfs;
            }
            // Second instance is for the cache backend of CachedSupabaseFsImpl
            // It can be a new distinct mock if needed for specific cache backend tests,
            // but for UnifiedFsService tests, it's an internal detail of CachedSupabaseFsImpl.
            return { 
                readFile: jest.fn(), writeFile: jest.fn(), deleteFile: jest.fn(),
                listFiles: jest.fn(), mkdir: jest.fn(), rmdir: jest.fn(), exists: jest.fn(),
            } as jest.Mocked<OpfsImpl>; 
        });
        
        // Mock for SupabaseFsImpl (actual one, passed to CachedSupabaseFsImpl)
        // This mock is an internal detail of CachedSupabaseFsImpl setup by UnifiedFsService constructor
        const MockedSupabaseFsImpl = SupabaseFsImpl as jest.MockedClass<typeof SupabaseFsImpl>;
        MockedSupabaseFsImpl.mockImplementation(() => ({
            readFile: jest.fn(), writeFile: jest.fn(), deleteFile: jest.fn(),
            listFiles: jest.fn(), mkdir: jest.fn(), rmdir: jest.fn(), exists: jest.fn(),
        } as jest.Mocked<SupabaseFsImpl>));


        const MockedCachedSupabaseFsImpl = CachedSupabaseFsImpl as jest.MockedClass<typeof CachedSupabaseFsImpl>;
        MockedCachedSupabaseFsImpl.mockImplementation(() => mockCachedSupabaseFs);
        
        unifiedFs = new UnifiedFsService(mockSupabaseClient);
    });

    const testCases = [
        { method: 'readFile', args: ['path'], mockReturn: 'content' as string | Uint8Array },
        { method: 'writeFile', args: ['path', 'content'], mockReturn: undefined },
        { method: 'deleteFile', args: ['path'], mockReturn: undefined },
        { method: 'listFiles', args: ['path'], mockReturn: ['file1.txt'] },
        { method: 'mkdir', args: ['path'], mockReturn: undefined },
        { method: 'rmdir', args: ['path'], mockReturn: undefined },
        { method: 'exists', args: ['path'], mockReturn: true },
    ] as const;

    testCases.forEach(({ method, args, mockReturn }) => {
        describe(`${method}`, () => {
            const memPath = `/mem/${args[0]}`;
            const localPath = `/local/${args[0]}`;
            const supabasePath = `/supabase/bucket/${args[0]}`; // UnifiedFS expects /supabase/bucket/path
            const invalidPath = `/invalid/${args[0]}`;
            
            const strippedNonBucketPath = `/${args[0]}`; // For /mem/ and /local/
            const strippedSupabasePath = `/bucket/${args[0]}`; // For /supabase/
            const actualArgs = args.slice(1);

            test(`should route to MemFS for ${memPath} paths`, async () => {
                (mockMemFs[method] as jest.Mock).mockResolvedValueOnce(mockReturn);
                const result = await (unifiedFs[method] as any)(memPath, ...actualArgs, nullSession);
                expect(mockMemFs[method]).toHaveBeenCalledWith(strippedNonBucketPath, ...actualArgs);
                expect(result).toEqual(mockReturn);
                expect(mockOpfs[method]).not.toHaveBeenCalled();
                expect(mockCachedSupabaseFs[method]).not.toHaveBeenCalled();
            });

            test(`should route to OpfsImpl for ${localPath} paths`, async () => {
                (mockOpfs[method] as jest.Mock).mockResolvedValueOnce(mockReturn);
                const result = await (unifiedFs[method] as any)(localPath, ...actualArgs, nullSession);
                expect(mockOpfs[method]).toHaveBeenCalledWith(strippedNonBucketPath, ...actualArgs);
                expect(result).toEqual(mockReturn);
                expect(mockMemFs[method]).not.toHaveBeenCalled();
                expect(mockCachedSupabaseFs[method]).not.toHaveBeenCalled();
            });

            test(`should route to CachedSupabaseFsImpl for ${supabasePath} paths with a session`, async () => {
                (mockCachedSupabaseFs[method] as jest.Mock).mockResolvedValueOnce(mockReturn);
                const result = await (unifiedFs[method] as any)(supabasePath, ...actualArgs, mockSession);
                expect(mockCachedSupabaseFs[method]).toHaveBeenCalledWith(strippedSupabasePath, ...actualArgs);
                expect(result).toEqual(mockReturn);
                expect(mockMemFs[method]).not.toHaveBeenCalled();
                expect(mockOpfs[method]).not.toHaveBeenCalled();
            });

            test(`should throw error for ${supabasePath} paths without a session`, async () => {
                await expect((unifiedFs[method] as any)(supabasePath, ...actualArgs, nullSession))
                    .rejects.toThrow('Permission denied: Supabase storage requires an authenticated session.');
                expect(mockSupabaseFs[method]).not.toHaveBeenCalled();
            });

            test(`should throw error for invalid path ${invalidPath}`, async () => {
                await expect((unifiedFs[method] as any)(invalidPath, ...actualArgs, mockSession))
                    .rejects.toThrow(`Invalid path prefix: path must start with /mem/, /local/, or /supabase/. Received: ${invalidPath}`);
            });

            test(`should propagate errors from MemFS for ${memPath}`, async () => {
                const error = new Error('MemFS error');
                (mockMemFs[method] as jest.Mock).mockRejectedValueOnce(error);
                await expect((unifiedFs[method] as any)(memPath, ...actualArgs, nullSession)).rejects.toThrow('MemFS error');
            });
            
            test(`should propagate errors from OpfsImpl for ${localPath}`, async () => {
                const error = new Error('OpfsImpl error');
                (mockOpfs[method] as jest.Mock).mockRejectedValueOnce(error);
                await expect((unifiedFs[method] as any)(localPath, ...actualArgs, nullSession)).rejects.toThrow('OpfsImpl error');
            });

            test(`should propagate errors from SupabaseFS for ${supabasePath} with session`, async () => {
                const error = new Error('SupabaseFS error');
                (mockSupabaseFs[method] as jest.Mock).mockRejectedValueOnce(error);
                await expect((unifiedFs[method] as any)(supabasePath, ...actualArgs, mockSession)).rejects.toThrow('SupabaseFS error');
            });
        });
    });

    // Specific test for writeFile content type (string vs Uint8Array)
    describe('writeFile content handling', () => {
        const memPath = '/mem/test.txt';
        const strippedPath = '/test.txt';

        test('should pass string content correctly to MemFS', async () => {
            const stringContent = "text data";
            await unifiedFs.writeFile(memPath, stringContent, nullSession);
            expect(mockMemFs.writeFile).toHaveBeenCalledWith(strippedPath, stringContent);
        });

        test('should pass Uint8Array content correctly to MemFS', async () => {
            const uint8ArrayContent = new Uint8Array([1,2,3]);
            await unifiedFs.writeFile(memPath, uint8ArrayContent, nullSession);
            expect(mockMemFs.writeFile).toHaveBeenCalledWith(strippedPath, uint8ArrayContent);
        });
    });
     describe('Path stripping logic', () => {
        test('should correctly strip /mem/ prefix', async () => {
            mockMemFs.exists.mockResolvedValueOnce(true);
            await unifiedFs.exists('/mem/foo/bar.txt', nullSession);
            expect(mockMemFs.exists).toHaveBeenCalledWith('/foo/bar.txt');
        });

        test('should correctly strip /supabase/ prefix', async () => {
            mockSupabaseFs.exists.mockResolvedValueOnce(true);
            await unifiedFs.exists('/supabase/my-bucket/foo/bar.txt', mockSession);
            expect(mockSupabaseFs.exists).toHaveBeenCalledWith('/my-bucket/foo/bar.txt');
        });
         test('should handle paths that are just prefixes like /mem/ or /supabase/', async () => {
            mockMemFs.listFiles.mockResolvedValueOnce([]);
            await unifiedFs.listFiles('/mem/', nullSession);
            expect(mockMemFs.listFiles).toHaveBeenCalledWith('/');

            mockSupabaseFs.listFiles.mockResolvedValueOnce([]);
            await unifiedFs.listFiles('/supabase/', mockSession); // This should be /supabase/bucket/ for SupabaseFS
            // The SupabaseFSImpl expects /bucket/path, so /supabase/ itself is an invalid path for SupabaseFS methods usually
            // However, UnifiedFS getFsInstance strips to "/", then SupabaseFSImpl.parsePath gets bucket="" and objectPath=""
            // SupabaseFsImpl.parsePath throws "Bucket name cannot be empty" for this.
            // This means getFsInstance's stripping to "/" for "/supabase/" is problematic for SupabaseFsImpl.
            // Let's verify the actual behavior.
            // Current UnifiedFsService: path.substring('/supabase'.length) -> "/"
            // SupabaseFsImpl.parsePath("/") -> throws error.
            await expect(unifiedFs.listFiles('/supabase/', mockSession)).rejects.toThrow('Path must start with a bucket name');
        });

         test('should handle paths like /mem/file.txt (root file)', async () => {
            mockMemFs.readFile.mockResolvedValueOnce("data");
            await unifiedFs.readFile('/mem/file.txt', nullSession);
            expect(mockMemFs.readFile).toHaveBeenCalledWith('/file.txt');
        });

        test('should handle paths like /supabase/bucket/file.txt (root file in bucket)', async () => {
            mockSupabaseFs.readFile.mockResolvedValueOnce("data");
            await unifiedFs.readFile('/supabase/bucket/file.txt', mockSession);
            expect(mockSupabaseFs.readFile).toHaveBeenCalledWith('/bucket/file.txt');
        });
    });
});

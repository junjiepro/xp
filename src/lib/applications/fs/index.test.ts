import { UnifiedFsService } from './index';
import { memFsInstance } from './memfs'; // This is the singleton instance
import { SupabaseFsImpl } from './supabase-fs';
import { Session, SupabaseClient } from '@supabase/supabase-js';

// Mock the underlying FS implementations
// memFsInstance is a direct export, so we need to mock its methods.
// We can achieve this by mocking the entire './memfs' module.
jest.mock('./memfs', () => ({
    memFsInstance: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        deleteFile: jest.fn(),
        listFiles: jest.fn(),
        mkdir: jest.fn(),
        rmdir: jest.fn(),
        exists: jest.fn(),
    },
    // Export other things from memfs if UnifiedFsService depends on them directly (it doesn't)
}));

jest.mock('./supabase-fs');

const mockSupabaseClient = {} as SupabaseClient; // Mock Supabase client

describe('UnifiedFsService', () => {
    let unifiedFs: UnifiedFsService;
    let mockMemFs: jest.Mocked<typeof memFsInstance>; // Typed mock for the singleton
    let mockSupabaseFs: jest.Mocked<SupabaseFsImpl>;

    const mockSession = { user: { id: 'test-user' } } as Session;
    const nullSession = null;

    beforeEach(() => {
        jest.clearAllMocks();

        // Assign the mocked singleton
        mockMemFs = memFsInstance as jest.Mocked<typeof memFsInstance>;

        // For SupabaseFsImpl, mock its constructor and methods
        // SupabaseFsImpl is a class, so we mock its constructor to return our mock instance
        const MockedSupabaseFsImpl = SupabaseFsImpl as jest.MockedClass<typeof SupabaseFsImpl>;
        MockedSupabaseFsImpl.mockImplementation(() => {
            // Create a new mock instance for each test to ensure method mocks are clean
            const instance = {
                readFile: jest.fn(),
                writeFile: jest.fn(),
                deleteFile: jest.fn(),
                listFiles: jest.fn(),
                mkdir: jest.fn(),
                rmdir: jest.fn(),
                exists: jest.fn(),
            } as unknown as jest.Mocked<SupabaseFsImpl>; // Cast to unknown first
            mockSupabaseFs = instance; // Store the instance to make assertions on it
            return instance;
        });
        
        unifiedFs = new UnifiedFsService(mockSupabaseClient);
        // After UnifiedFsService is constructed, SupabaseFsImpl constructor has been called,
        // so mockSupabaseFs should be set.
    });

    const testCases = [
        { method: 'readFile', args: ['path'], mockReturn: 'content' },
        { method: 'writeFile', args: ['path', 'content'], mockReturn: undefined },
        { method: 'deleteFile', args: ['path'], mockReturn: undefined },
        { method: 'listFiles', args: ['path'], mockReturn: ['file1.txt'] },
        { method: 'mkdir', args: ['path'], mockReturn: undefined },
        { method: 'rmdir', args: ['path'], mockReturn: undefined },
        { method: 'exists', args: ['path'], mockReturn: true },
    ] as const; // `as const` for stricter typing of method names

    testCases.forEach(({ method, args, mockReturn }) => {
        describe(`${method}`, () => {
            const localPath = `/local/${args[0]}`;
            const supabasePath = `/supabase/bucket/${args[0]}`;
            const invalidPath = `/invalid/${args[0]}`;
            const strippedPath = args[0].startsWith('bucket/') ? `/${args[0]}` : `/${args[0]}`; // e.g. /bucket/path -> /path
            const actualArgs = args.slice(1); // Content for writeFile, etc.

            test(`should route to MemFS for ${localPath} paths`, async () => {
                (mockMemFs[method] as jest.Mock).mockResolvedValueOnce(mockReturn);
                
                const result = await (unifiedFs[method] as any)(localPath, ...actualArgs, nullSession);
                
                expect(mockMemFs[method]).toHaveBeenCalledWith(strippedPath, ...actualArgs);
                expect(result).toEqual(mockReturn);
                if (mockSupabaseFs && mockSupabaseFs[method]) { // mockSupabaseFs might not be initialized if constructor fails
                     expect(mockSupabaseFs[method]).not.toHaveBeenCalled();
                }
            });

            test(`should route to SupabaseFS for ${supabasePath} paths with a session`, async () => {
                (mockSupabaseFs[method] as jest.Mock).mockResolvedValueOnce(mockReturn);

                const result = await (unifiedFs[method] as any)(supabasePath, ...actualArgs, mockSession);
                
                expect(mockSupabaseFs[method]).toHaveBeenCalledWith(`/bucket/${args[0]}`, ...actualArgs);
                expect(result).toEqual(mockReturn);
                expect(mockMemFs[method]).not.toHaveBeenCalled();
            });

            test(`should throw error for ${supabasePath} paths without a session`, async () => {
                await expect((unifiedFs[method] as any)(supabasePath, ...actualArgs, nullSession))
                    .rejects.toThrow('Permission denied: Supabase storage requires an authenticated session.');
                expect(mockSupabaseFs[method]).not.toHaveBeenCalled();
            });

            test(`should throw error for invalid path ${invalidPath}`, async () => {
                await expect((unifiedFs[method] as any)(invalidPath, ...actualArgs, mockSession))
                    .rejects.toThrow('Invalid path prefix: path must start with /local/ or /supabase/.');
            });

            test(`should propagate errors from MemFS for ${localPath}`, async () => {
                const error = new Error('MemFS error');
                (mockMemFs[method] as jest.Mock).mockRejectedValueOnce(error);
                await expect((unifiedFs[method] as any)(localPath, ...actualArgs, nullSession)).rejects.toThrow('MemFS error');
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
        const path = '/local/test.txt';
        const strippedPath = '/test.txt';

        test('should pass string content correctly to MemFS', async () => {
            const stringContent = "text data";
            await unifiedFs.writeFile(path, stringContent, nullSession);
            expect(mockMemFs.writeFile).toHaveBeenCalledWith(strippedPath, stringContent);
        });

        test('should pass Uint8Array content correctly to MemFS', async () => {
            const uint8ArrayContent = new Uint8Array([1,2,3]);
            await unifiedFs.writeFile(path, uint8ArrayContent, nullSession);
            expect(mockMemFs.writeFile).toHaveBeenCalledWith(strippedPath, uint8ArrayContent);
        });
    });
     describe('Path stripping logic', () => {
        test('should correctly strip /local/ prefix', async () => {
            mockMemFs.exists.mockResolvedValueOnce(true);
            await unifiedFs.exists('/local/foo/bar.txt', nullSession);
            expect(mockMemFs.exists).toHaveBeenCalledWith('/foo/bar.txt');
        });

        test('should correctly strip /supabase/ prefix', async () => {
            mockSupabaseFs.exists.mockResolvedValueOnce(true);
            await unifiedFs.exists('/supabase/my-bucket/foo/bar.txt', mockSession);
            expect(mockSupabaseFs.exists).toHaveBeenCalledWith('/my-bucket/foo/bar.txt');
        });
         test('should handle paths that are just prefixes like /local/ or /supabase/', async () => {
            mockMemFs.listFiles.mockResolvedValueOnce([]);
            await unifiedFs.listFiles('/local/', nullSession);
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

         test('should handle paths like /local/file.txt (root file)', async () => {
            mockMemFs.readFile.mockResolvedValueOnce("data");
            await unifiedFs.readFile('/local/file.txt', nullSession);
            expect(mockMemFs.readFile).toHaveBeenCalledWith('/file.txt');
        });

        test('should handle paths like /supabase/bucket/file.txt (root file in bucket)', async () => {
            mockSupabaseFs.readFile.mockResolvedValueOnce("data");
            await unifiedFs.readFile('/supabase/bucket/file.txt', mockSession);
            expect(mockSupabaseFs.readFile).toHaveBeenCalledWith('/bucket/file.txt');
        });
    });
});

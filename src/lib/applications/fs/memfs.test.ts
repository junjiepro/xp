import { memFsInstance, MemFSImpl } from './memfs';
import { vol } from 'memfs';
import { IFileSystem } from './common';

describe('MemFSImpl', () => {
    let fs: IFileSystem;

    beforeEach(() => {
        vol.reset(); // Clear the in-memory file system before each test
        // Optionally, create a new instance for each test if worried about global instance state
        // fs = new MemFSImpl(); 
        fs = memFsInstance; // Using the global instance as per MemFSImpl design with global vol
    });

    describe('writeFile and readFile', () => {
        test('should write and read a text file', async () => {
            await fs.writeFile('/test.txt', 'hello world');
            const content = await fs.readFile('/test.txt');
            expect(Buffer.from(content).toString('utf-8')).toBe('hello world');
        });

        test('should write and read a file with Uint8Array content', async () => {
            const data = new TextEncoder().encode('binary data');
            await fs.writeFile('/binary.dat', data);
            const content = await fs.readFile('/binary.dat') as Uint8Array;
            expect(Buffer.from(content)).toEqual(Buffer.from(data));
        });

        test('should overwrite an existing file', async () => {
            await fs.writeFile('/overwrite.txt', 'initial content');
            await fs.writeFile('/overwrite.txt', 'new content');
            const content = await fs.readFile('/overwrite.txt');
            expect(Buffer.from(content).toString('utf-8')).toBe('new content');
        });

        test('writeFile should create necessary parent directories', async () => {
            await fs.writeFile('/parent/child/file.txt', 'nested');
            const content = await fs.readFile('/parent/child/file.txt');
            expect(Buffer.from(content).toString('utf-8')).toBe('nested');
            expect(await fs.exists('/parent/child')).toBe(true);
            expect(vol.statSync('/parent/child').isDirectory()).toBe(true);
        });

        test('readFile should throw if file does not exist', async () => {
            await expect(fs.readFile('/nonexistent.txt')).rejects.toThrow('ENOENT');
        });

        test('readFile should throw if path is a directory', async () => {
            await fs.mkdir('/dir_only');
            await expect(fs.readFile('/dir_only')).rejects.toThrow('EISDIR');
        });
    });

    describe('deleteFile', () => {
        test('should delete an existing file', async () => {
            await fs.writeFile('/delete_me.txt', 'content');
            expect(await fs.exists('/delete_me.txt')).toBe(true);
            await fs.deleteFile('/delete_me.txt');
            expect(await fs.exists('/delete_me.txt')).toBe(false);
        });

        test('deleteFile should throw if file does not exist', async () => {
            // memfs vol.promises.unlink throws ENOENT
            await expect(fs.deleteFile('/nonexistent_to_delete.txt')).rejects.toThrow('ENOENT');
        });

        test('deleteFile should throw if path is a directory', async () => {
            await fs.mkdir('/dir_not_file');
            // MemFSImpl deleteFile specifically checks if it's a directory
            await expect(fs.deleteFile('/dir_not_file')).rejects.toThrow('EISDIR: Path is a directory, use rmdir instead: /dir_not_file');
        });
    });

    describe('listFiles', () => {
        test('should list an empty directory', async () => {
            await fs.mkdir('/empty_list_dir');
            const files = await fs.listFiles('/empty_list_dir');
            expect(files).toEqual([]);
        });

        test('should list a directory with files and subdirectories', async () => {
            await fs.mkdir('/list_dir');
            await fs.writeFile('/list_dir/file1.txt', 'one');
            await fs.writeFile('/list_dir/file2.txt', 'two');
            await fs.mkdir('/list_dir/subdir');
            await fs.writeFile('/list_dir/subdir/file3.txt', 'three');

            const files = await fs.listFiles('/list_dir');
            expect(files).toHaveLength(3);
            expect(files).toContain('file1.txt');
            expect(files).toContain('file2.txt');
            expect(files).toContain('subdir'); 
        });

        test('listFiles should throw if directory does not exist', async () => {
            await expect(fs.listFiles('/nonexistent_list_dir')).rejects.toThrow('ENOENT');
        });
    });

    describe('mkdir', () => {
        test('should create a single directory', async () => {
            await fs.mkdir('/new_dir');
            expect(await fs.exists('/new_dir')).toBe(true);
            expect(vol.statSync('/new_dir').isDirectory()).toBe(true);
        });

        test('should create nested directories with recursive option', async () => {
            // Our MemFSImpl.mkdir supports options { recursive: boolean }
            await (fs as MemFSImpl).mkdir('/nested/a/b', { recursive: true });
            expect(await fs.exists('/nested/a/b')).toBe(true);
            expect(vol.statSync('/nested/a/b').isDirectory()).toBe(true);
        });
        
        test('mkdir without recursive should not create nested directories', async () => {
            await expect((fs as MemFSImpl).mkdir('/nonrecursive/a/b', { recursive: false })).rejects.toThrow('ENOENT');
        });

        test('mkdir should throw if directory already exists (non-recursive)', async () => {
            await fs.mkdir('/existing_dir_mkdir');
            await expect(fs.mkdir('/existing_dir_mkdir')).rejects.toThrow('EEXIST'); // Default is recursive: false
        });

        test('mkdir with recursive true should not throw if directory already exists', async () => {
            await (fs as MemFSImpl).mkdir('/existing_dir_mkdir_rec', { recursive: true });
            await expect((fs as MemFSImpl).mkdir('/existing_dir_mkdir_rec', { recursive: true })).resolves.not.toThrow();
        });
        
        test('mkdir should throw if a file with the same name exists', async () => {
            await fs.writeFile('/file_as_dir_name', 'content');
            await expect(fs.mkdir('/file_as_dir_name')).rejects.toThrow('EEXIST'); // Or could be ENOTDIR depending on memfs exact behavior for this case
        });
    });

    describe('rmdir', () => {
        test('should remove an empty directory', async () => {
            await fs.mkdir('/empty_rm_dir');
            await fs.rmdir('/empty_rm_dir');
            expect(await fs.exists('/empty_rm_dir')).toBe(false);
        });

        test('rmdir should throw if directory is not empty', async () => {
            await fs.mkdir('/non_empty_rm_dir');
            await fs.writeFile('/non_empty_rm_dir/file.txt', 'content');
            await expect(fs.rmdir('/non_empty_rm_dir')).rejects.toThrow('ENOTEMPTY: Directory not empty: /non_empty_rm_dir');
        });

        test('rmdir should throw if directory does not exist', async () => {
            await expect(fs.rmdir('/nonexistent_rm_dir')).rejects.toThrow('ENOENT');
        });

        test('rmdir should throw if path is a file', async () => {
            await fs.writeFile('/file_for_rmdir_test.txt', 'content');
            await expect(fs.rmdir('/file_for_rmdir_test.txt')).rejects.toThrow('ENOTDIR: Path is not a directory: /file_for_rmdir_test.txt');
        });
    });

    describe('exists', () => {
        test('should return true for an existing file', async () => {
            await fs.writeFile('/exists_file.txt', 'content');
            expect(await fs.exists('/exists_file.txt')).toBe(true);
        });

        test('should return true for an existing directory', async () => {
            await fs.mkdir('/exists_dir_exists');
            expect(await fs.exists('/exists_dir_exists')).toBe(true);
        });

        test('should return false for a non-existent path', async () => {
            expect(await fs.exists('/nonexistent_exists_path.txt')).toBe(false);
        });

        test('should return false for a path after deleting a file', async () => {
            await fs.writeFile('/exists_then_deleted.txt', 'content');
            expect(await fs.exists('/exists_then_deleted.txt')).toBe(true);
            await fs.deleteFile('/exists_then_deleted.txt');
            expect(await fs.exists('/exists_then_deleted.txt')).toBe(false);
        });

        test('should return false for a path after removing a directory', async () => {
            await fs.mkdir('/exists_dir_then_rmdir');
            expect(await fs.exists('/exists_dir_then_rmdir')).toBe(true);
            await fs.rmdir('/exists_dir_then_rmdir');
            expect(await fs.exists('/exists_dir_then_rmdir')).toBe(false);
        });
    });

    describe('UTF-8 characters in paths and content', () => {
        test('should handle UTF-8 characters in file paths for writeFile and readFile', async () => {
            const filePath = '/测试文件_你好世界.txt';
            const fileContent = '文件内容是UTF-8编码的';
            await fs.writeFile(filePath, fileContent);
            const content = await fs.readFile(filePath);
            expect(Buffer.from(content).toString('utf-8')).toBe(fileContent);
            expect(await fs.exists(filePath)).toBe(true);
        });

        test('should handle UTF-8 characters in directory paths for mkdir and listFiles', async () => {
            const dirPath = '/测试目录_你好';
            await fs.mkdir(dirPath);
            expect(await fs.exists(dirPath)).toBe(true);
            expect(vol.statSync(dirPath).isDirectory()).toBe(true);

            await fs.writeFile(`${dirPath}/file.txt`, 'content');
            const files = await fs.listFiles(dirPath);
            expect(files).toEqual(['file.txt']);
        });
    });
});

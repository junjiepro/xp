import { UnifiedFsService as ActualUnifiedFsService, UnifiedFsServiceWriteFileParams } from '@/services/unified-fs'; // Assuming this is the actual path
import { Session as ActualSession } from '@supabase/supabase-js';

// Re-exporting for convenience or to be augmented if needed
export type UnifiedFsService = ActualUnifiedFsService;
export type Session = ActualSession;

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

export interface OpenFile extends FileItem {
  content: string | null; // Initially null, loaded on demand
  isLoading: boolean;     // True while loading content
  error: string | null;   // Error message if loading fails
  isDirty: boolean;       // True if content has changed since last save
}


// In-memory store for the mock file system
const mockFsStore: Record<string, { type: 'file'; content: string } | { type: 'directory'; children: Set<string> }> = {
  '/mem/': { type: 'directory', children: new Set(['temp.data', 'cache/']) },
  '/mem/temp.data': { type: 'file', content: 'some data in mem' },
  '/mem/cache/': { type: 'directory', children: new Set(['user_prefs.json']) },
  '/mem/cache/user_prefs.json': { type: 'file', content: '{"theme":"dark"}' },
  '/local/': { type: 'directory', children: new Set(['projectA/', 'file1.txt', 'another_dir/']) },
  '/local/projectA/': { type: 'directory', children: new Set(['src/', 'README.md', '.gitignore']) },
  '/local/projectA/src/': { type: 'directory', children: new Set(['index.ts', 'app.tsx']) },
  '/local/projectA/src/index.ts': { type: 'file', content: 'console.log("hello local index");\nexport const greeting = "Hello World";\n// More lines for testing scrolling\n// Line 4\n// Line 5\n// Line 6\n// Line 7\n// Line 8\n// Line 9\n// Line 10' },
  '/local/projectA/src/app.tsx': { type: 'file', content: 'import React from "react";\n\nconst App = () => {\n  return <h1>Hello from app.tsx</h1>;\n};\n\nexport default App;' },
  '/local/projectA/README.md': { type: 'file', content: '# Project A\n\nThis is the README for Project A.' },
  '/local/projectA/.gitignore': { type: 'file', content: 'node_modules\n.DS_Store' },
  '/local/file1.txt': { type: 'file', content: 'hello from file1.txt\nThis is a simple text file.' },
  '/local/another_dir/': { type: 'directory', children: new Set() },
  '/supabase/': { type: 'directory', children: new Set(['bucket1/', 'notes.md', 'shared_docs/']) },
  '/supabase/bucket1/': { type: 'directory', children: new Set(['image.png', 'backup.zip']) },
  '/supabase/bucket1/image.png': { type: 'file', content: 'img_data_supabase_bucket1_image.png_content' },
  '/supabase/bucket1/backup.zip': { type: 'file', content: 'zip_data_supabase_bucket1_backup.zip_content' },
  '/supabase/notes.md': { type: 'file', content: 'My supabase notes\n\n- Remember to check backups.\n- Update API keys.' },
  '/supabase/shared_docs/': { type: 'directory', children: new Set(['document.pdf']) },
  '/supabase/shared_docs/document.pdf': { type: 'file', content: 'pdf_data_supabase_shared_docs_document.pdf_content' },
};

function getParentPath(path: string): string {
  if (path === '/') return '/';
  // Ensure trailing slash for parent if it's not root
  let parent = path.substring(0, path.lastIndexOf('/'));
  if (path.endsWith('/') && parent !== '/') { // e.g. /foo/bar/ -> /foo/
    parent = parent.substring(0, parent.lastIndexOf('/'));
  }
  return parent === '' ? '/' : (parent.endsWith('/') ? parent : parent + '/');
}


export const mockUnifiedFsService: Partial<UnifiedFsService> = {
  async listFiles(path: string, session?: Session | null): Promise<string[]> {
    console.log(`Mock listFiles called for: ${path} with session:`, session);
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay

    if (path === '/supabase/' && !session) {
      return Promise.reject(new Error('Supabase session required to list /supabase/'));
    }
    const entry = mockFsStore[path];
    if (entry && entry.type === 'directory') {
      return Array.from(entry.children);
    }
    if (path === '/') { // Special case for root, should list root prefixes if not handled by FileExplorer directly
      return ['mem/', 'local/', 'supabase/'];
    }
    // If path doesn't exist or isn't a directory, return empty or throw error
    // For simplicity, returning empty array for non-existent paths in listFiles
    return [];
  },

  async exists(path: string, session?: Session | null): Promise<boolean> {
    console.log(`Mock exists called for: ${path}`);
    if (path.startsWith('/supabase/') && path !== '/supabase/' && !session) {
      // Allow /supabase/ itself to exist without session for root listing
      // but deeper paths require session.
      return false; 
    }
    return path in mockFsStore;
  },

  async readFile(path: string, session?: Session | null): Promise<string> {
    console.log(`Mock readFile called for: ${path}`);
    if (path.startsWith('/supabase/') && !session) {
      return Promise.reject(new Error("Supabase session required to read from /supabase/"));
    }
    const entry = mockFsStore[path];
    if (entry && entry.type === 'file') {
      return entry.content;
    }
    return Promise.reject(new Error(`File not found: ${path}`));
  },

  async writeFile(params: UnifiedFsServiceWriteFileParams, session?: Session | null): Promise<void> {
    const { path, content } = params;
    console.log(`Mock writeFile called for: ${path}`);
    if (path.startsWith('/supabase/') && !session) {
      return Promise.reject(new Error("Supabase session required to write to /supabase/"));
    }
    const parentPath = getParentPath(path);
    const itemName = path.substring(parentPath.length);

    if (!mockFsStore[parentPath] || mockFsStore[parentPath].type !== 'directory') {
      return Promise.reject(new Error(`Parent directory ${parentPath} does not exist.`));
    }
    
    const parentDir = mockFsStore[parentPath] as { type: 'directory'; children: Set<string> };
    parentDir.children.add(itemName);
    mockFsStore[path] = { type: 'file', content: content || '' }; // Allow empty string for content
    console.log(`Mock FS: Wrote file ${path}`, mockFsStore);
  },

  async mkdir(path: string, session?: Session | null): Promise<void> {
    console.log(`Mock mkdir called for: ${path}`);
    if (!path.endsWith('/')) return Promise.reject(new Error("Directory path must end with '/'"));
    if (path.startsWith('/supabase/') && !session) {
      return Promise.reject(new Error("Supabase session required to create directory in /supabase/"));
    }

    const parentPath = getParentPath(path);
    const dirName = path.substring(parentPath.length);

    if (!mockFsStore[parentPath] || mockFsStore[parentPath].type !== 'directory') {
      return Promise.reject(new Error(`Parent directory ${parentPath} does not exist.`));
    }
    if (mockFsStore[path]) {
      return Promise.reject(new Error(`Path already exists: ${path}`));
    }
    
    const parentDir = mockFsStore[parentPath] as { type: 'directory'; children: Set<string> };
    parentDir.children.add(dirName);
    mockFsStore[path] = { type: 'directory', children: new Set() };
    console.log(`Mock FS: Created directory ${path}`, mockFsStore);
  },

  async deleteFile(path: string, session?: Session | null): Promise<void> {
    console.log(`Mock deleteFile called for: ${path}`);
    if (path.endsWith('/')) return Promise.reject(new Error("Path for deleteFile must not end with '/'"));
     if (path.startsWith('/supabase/') && !session) {
      return Promise.reject(new Error("Supabase session required to delete file in /supabase/"));
    }

    const entry = mockFsStore[path];
    if (!entry) return Promise.reject(new Error(`File not found: ${path}`));
    if (entry.type !== 'file') return Promise.reject(new Error(`Not a file: ${path}`));

    const parentPath = getParentPath(path);
    const itemName = path.substring(parentPath.length);
    
    delete mockFsStore[path];
    const parentDir = mockFsStore[parentPath] as { type: 'directory'; children: Set<string> };
    parentDir?.children.delete(itemName); // Remove from parent's children list
    console.log(`Mock FS: Deleted file ${path}`, mockFsStore);
  },

  async rmdir(path: string, session?: Session | null): Promise<void> {
    console.log(`Mock rmdir called for: ${path}`);
    if (!path.endsWith('/')) return Promise.reject(new Error("Directory path for rmdir must end with '/'"));
    if (path.startsWith('/supabase/') && !session) {
      return Promise.reject(new Error("Supabase session required to remove directory in /supabase/"));
    }

    const entry = mockFsStore[path];
    if (!entry) return Promise.reject(new Error(`Directory not found: ${path}`));
    if (entry.type !== 'directory') return Promise.reject(new Error(`Not a directory: ${path}`));
    if (entry.children.size > 0) return Promise.reject(new Error(`Directory not empty: ${path}`));

    const parentPath = getParentPath(path);
    const dirName = path.substring(parentPath.length);

    delete mockFsStore[path];
    const parentDir = mockFsStore[parentPath] as { type: 'directory'; children: Set<string> };
    parentDir?.children.delete(dirName); // Remove from parent's children list
    console.log(`Mock FS: Removed directory ${path}`, mockFsStore);
  }
};

// Mock session object for testing purposes
export const mockSession = {
  user: { id: 'mock-user-id' },
  access_token: 'mock-access-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600 * 1000,
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
} as Session; // Cast to Session to satisfy type requirements

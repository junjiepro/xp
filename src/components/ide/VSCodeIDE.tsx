import React, { useState, useEffect, useCallback } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import FileExplorer from './FileExplorer';
import EditorTabs from './EditorTabs';
import { 
  UnifiedFsService as UnifiedFsServiceType,
  Session as SessionType,
  FileItem, 
  OpenFile,
  mockUnifiedFsService, 
  mockSession 
} from './types';
import { useToast } from "@/components/ui/use-toast";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Define Folder Aliases
const FOLDER_ALIASES: Record<string, string> = {
  '/project/localA': '/local/projectA/',
  '/project/sharedSupa': '/supabase/shared_docs/',
  // Add more aliases here if needed
};

interface VSCodeIDEProps {
  unifiedFsServiceProp?: UnifiedFsServiceType | null;
  sessionProp?: SessionType | null;
}

const VSCodeIDE: React.FC<VSCodeIDEProps> = ({ 
  unifiedFsServiceProp, 
  sessionProp 
}) => {
  const unifiedFsService = unifiedFsServiceProp !== undefined ? unifiedFsServiceProp : mockUnifiedFsService as UnifiedFsServiceType;
  const session = sessionProp !== undefined ? sessionProp : mockSession as SessionType | null;

  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const { toast } = useToast();

  const [openedFolderPath, setOpenedFolderPath] = useState<string | null>(null); // Stores REAL path
  const [displayRootPath, setDisplayRootPath] = useState<string | null>(null); // Stores ALIAS or REAL path for display
  const [folderPathInput, setFolderPathInput] = useState<string>('/project/localA'); // Default to an alias for demo


  const loadFileContent = useCallback(async (filePath: string) => {
    if (!unifiedFsService || !unifiedFsService.readFile) return;
    setOpenFiles(prevFiles => 
      prevFiles.map(f => f.path === filePath ? { ...f, isLoading: true, error: null } : f)
    );
    try {
      const content = await unifiedFsService.readFile(filePath, session);
      setOpenFiles(prevFiles =>
        prevFiles.map(f => f.path === filePath ? { ...f, content: content as string, isLoading: false, isDirty: false } : f)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setOpenFiles(prevFiles =>
        prevFiles.map(f => f.path === filePath ? { ...f, error: errorMessage, isLoading: false } : f)
      );
    }
  }, [unifiedFsService, session]);

  useEffect(() => {
    if (activeTab) {
      const activeFile = openFiles.find(f => f.path === activeTab);
      if (activeFile && activeFile.content === null && !activeFile.isLoading && !activeFile.error) {
        loadFileContent(activeTab);
      }
    }
  }, [activeTab, openFiles, loadFileContent]);

  const handleFileOpenFromExplorer = (file: FileItem) => {
    if (file.type === 'directory') return;
    setOpenFiles(prevFiles => {
      if (prevFiles.find(f => f.path === file.path)) return prevFiles;
      const newOpenFile: OpenFile = { ...file, content: null, isLoading: false, error: null, isDirty: false };
      return [...prevFiles, newOpenFile];
    });
    setActiveTab(file.path);
  };

  const handleCloseTab = (filePathToClose: string) => {
    setOpenFiles(prevFiles => {
      const newFiles = prevFiles.filter(f => f.path !== filePathToClose);
      if (activeTab === filePathToClose) {
        setActiveTab(newFiles.length > 0 ? newFiles[newFiles.length - 1].path : null);
      }
      return newFiles;
    });
  };

  const handleActiveTabChange = (newActiveTabPath: string | null) => setActiveTab(newActiveTabPath);

  const handleContentChange = (filePath: string, newContent: string) => {
    setOpenFiles(prevFiles =>
      prevFiles.map(f => f.path === filePath ? { ...f, content: newContent, isDirty: true } : f)
    );
  };

  const handleSaveFile = async (filePath: string) => {
    if (!unifiedFsService || !unifiedFsService.writeFile) {
      toast({ title: "Save Error", description: "File service not available.", variant: "destructive" });
      return;
    }
    const fileToSave = openFiles.find(f => f.path === filePath);
    if (!fileToSave || fileToSave.content === null) {
      toast({ title: "Save Error", description: "File content not loaded.", variant: "destructive" });
      return;
    }
    try {
      await unifiedFsService.writeFile({ path: filePath, content: fileToSave.content }, session);
      setOpenFiles(prevFiles =>
        prevFiles.map(f => f.path === filePath ? { ...f, isDirty: false } : f)
      );
      toast({ title: "File Saved", description: `${fileToSave.name} saved successfully.` });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast({ title: "Save Error", description: `Failed to save ${fileToSave.name}: ${errorMessage}`, variant: "destructive" });
    }
  };

  const handleOpenFolder = async () => {
    const userInputPath = folderPathInput.trim();
    let realPathToOpen: string;
    let displayPathForExplorer: string;

    // Check if userInputPath is an alias
    if (FOLDER_ALIASES[userInputPath]) {
      realPathToOpen = FOLDER_ALIASES[userInputPath];
      displayPathForExplorer = userInputPath; // Show the alias in explorer header
      toast({ title: "Alias Recognized", description: `Alias "${userInputPath}" maps to "${realPathToOpen}".` });
    } else {
      // Not an alias, treat as a direct path
      realPathToOpen = userInputPath.endsWith('/') ? userInputPath : userInputPath + '/';
      displayPathForExplorer = realPathToOpen; // Show the real path
      
      const validPrefixes = ['/mem/', '/local/', '/supabase/'];
      if (!validPrefixes.some(prefix => realPathToOpen.startsWith(prefix))) {
        toast({ title: "Invalid Path", description: "Path must be an alias or start with /mem/, /local/, or /supabase/", variant: "destructive" });
        return;
      }
    }

    if (unifiedFsService?.exists) {
      try {
        const pathExists = await unifiedFsService.exists(realPathToOpen, session);
        if (!pathExists) {
          toast({ title: "Path Not Found", description: `Directory "${realPathToOpen}" does not exist.`, variant: "destructive" });
          return;
        }
        // Assuming exists(path_ending_with_slash) means it's a directory
        setOpenedFolderPath(realPathToOpen);
        setDisplayRootPath(displayPathForExplorer);
        toast({ title: "Folder Opened", description: `Explorer now showing: ${displayPathForExplorer}`});
      } catch (e) {
        toast({ title: "Error Checking Path", description: `Could not verify path: ${e instanceof Error ? e.message : String(e)}`, variant: "destructive" });
      }
    } else { // Optimistic open if no `exists` method
      setOpenedFolderPath(realPathToOpen);
      setDisplayRootPath(displayPathForExplorer);
      toast({ title: "Folder Opened (optimistic)", description: `Explorer now showing: ${displayPathForExplorer}`});
    }
  };

  const handleClearOpenedFolder = () => {
    setOpenedFolderPath(null);
    setDisplayRootPath(null);
    setFolderPathInput(''); 
    toast({ title: "Folder View Cleared", description: "Explorer showing all root directories."});
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen w-full">
      <ResizablePanel defaultSize={25} minSize={15} className="flex flex-col">
        <div className="p-2 space-y-2 border-b">
          <div className="flex space-x-2">
            <Input 
              type="text" 
              placeholder="Enter path or alias..."
              value={folderPathInput}
              onChange={(e) => setFolderPathInput(e.target.value)}
              className="h-8 text-xs"
            />
            <Button onClick={handleOpenFolder} size="sm" className="text-xs h-8">Open</Button>
          </div>
          {openedFolderPath && ( // Show clear button if a folder (real or alias) is open
            <Button onClick={handleClearOpenedFolder} variant="outline" size="sm" className="w-full text-xs h-8">
              Clear Opened Folder (Show All Roots)
            </Button>
          )}
        </div>
        <div className="flex-grow overflow-auto">
          <FileExplorer 
            unifiedFsService={unifiedFsService} 
            session={session}
            onFileSelect={handleFileOpenFromExplorer}
            rootPath={openedFolderPath} // REAL path for fs operations
            displayRootPath={displayRootPath} // ALIAS or REAL path for display
            aliases={FOLDER_ALIASES} // Pass aliases map
          />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75} minSize={25}>
        <EditorTabs 
          openFiles={openFiles}
          activeTab={activeTab}
          onActiveTabChange={handleActiveTabChange}
          onCloseTab={handleCloseTab}
          onContentChange={handleContentChange}
          onSaveFile={handleSaveFile}
          unifiedFsService={unifiedFsService}
          session={session}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default VSCodeIDE;

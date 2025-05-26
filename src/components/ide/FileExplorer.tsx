import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UnifiedFsService, Session, FileItem } from './types';
import DirectoryTreeViewNode from './DirectoryTreeViewNode';
import { Input } from '@/components/ui/input';

interface FileExplorerProps {
  unifiedFsService: UnifiedFsService | null;
  session: Session | null;
  onFileSelect: (item: FileItem) => void;
  rootPath: string | null; 
  displayRootPath: string | null; 
  aliases: Record<string, string>;
  onAliasSelect: (aliasPath: string) => void; // New callback for selecting an alias root
}

function getParentPath(path: string): string {
  if (path === '/') return '/';
  let parent = path.substring(0, path.lastIndexOf('/'));
  if (path.endsWith('/') && parent !== '/') { 
    parent = parent.substring(0, parent.lastIndexOf('/'));
  }
  return parent === '' ? '/' : (parent.endsWith('/') ? parent : parent + '/');
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  unifiedFsService, 
  session, 
  onFileSelect, 
  rootPath, 
  displayRootPath, 
  aliases,
  onAliasSelect
}) => {
  const [allItems, setAllItems] = useState<Record<string, FileItem>>({});
  const [childNodesMap, setChildNodesMap] = useState<Record<string, string[]>>({});
  const [userExpandedPaths, setUserExpandedPaths] = useState<Set<string>>(() => new Set(rootPath ? [rootPath] : ['/']));
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [rootItemPaths, setRootItemPaths] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const determineItemType = useCallback(async (itemPath: string, itemNameHint?: string): Promise<'file' | 'directory'> => {
    // If the path is an alias key, it's a directory (conceptual)
    if (aliases[itemPath]) return 'directory'; 
    if (!unifiedFsService) return 'file';
    if (itemNameHint?.endsWith('/')) return 'directory';
    if (itemPath.endsWith('/')) return 'directory';
    try {
      if (unifiedFsService.exists && await unifiedFsService.exists(itemPath + '/', session)) return 'directory';
    } catch (e) { /* ignore */ }
    return 'file';
  }, [unifiedFsService, session, aliases]);

  const loadDirectory = useCallback(async (path: string, isRootLoad: boolean = false) => {
    if (!unifiedFsService) {
      setError("File service is not available.");
      return;
    }
    // Path for loading is always the REAL path
    const pathToLoad = aliases[path] || path; // Resolve alias if 'path' is an alias key
    setLoadingPaths(prev => new Set(prev).add(pathToLoad));
    setError(null);

    try {
      const newItemsUpdates: Record<string, FileItem> = {};
      let childrenPathsResult: string[] = [];

      if (isRootLoad) {
        const currentRealPathForLoading = rootPath; // This is already the real path from VSCodeIDE
        
        if (currentRealPathForLoading) { // A specific folder (aliased or real) is opened
          let rootDisplayName = "";
          if (displayRootPath && displayRootPath !== currentRealPathForLoading && aliases[displayRootPath] === currentRealPathForLoading) {
             rootDisplayName = displayRootPath.split('/').filter(Boolean).pop() || displayRootPath;
          } else {
             rootDisplayName = currentRealPathForLoading.split('/').filter(Boolean).pop() || currentRealPathForLoading;
          }
          
          newItemsUpdates[currentRealPathForLoading] = { name: rootDisplayName, path: currentRealPathForLoading, type: 'directory' };
          setRootItemPaths([currentRealPathForLoading]); 
          setUserExpandedPaths(prev => new Set(prev).add(currentRealPathForLoading)); 

          const items = await unifiedFsService.listFiles(currentRealPathForLoading, session);
          for (const childName of items) {
            const childItemPath = currentRealPathForLoading.endsWith('/') ? `${currentRealPathForLoading}${childName}` : `${currentRealPathForLoading}/${childName}`;
            const type = await determineItemType(childItemPath, childName);
            const cleanChildName = childName.endsWith('/') ? childName.slice(0, -1) : childName;
            newItemsUpdates[childItemPath] = { name: cleanChildName, path: childItemPath, type };
            childrenPathsResult.push(childItemPath);
          }
          setChildNodesMap(prev => ({ ...prev, [currentRealPathForLoading]: childrenPathsResult }));

        } else { // Default view: Show aliases, then default roots if no aliases
          const aliasKeys = Object.keys(aliases);
          if (aliasKeys.length > 0) {
            for (const aliasKey of aliasKeys) {
              const aliasName = aliasKey.split('/').filter(Boolean).pop() || aliasKey;
              // For alias roots, path is the alias itself, name is derived from alias
              newItemsUpdates[aliasKey] = { name: aliasName, path: aliasKey, type: 'directory' };
              childrenPathsResult.push(aliasKey);
            }
          } else { // Fallback to default roots if no aliases defined
            const defaultRoots = ['/mem/', '/local/', '/supabase/'];
            for (const drPath of defaultRoots) {
              const itemName = drPath.split('/').filter(Boolean).pop() || '';
              newItemsUpdates[drPath] = { name: itemName, path: drPath, type: 'directory' };
              childrenPathsResult.push(drPath);
            }
          }
          setRootItemPaths(childrenPathsResult);
          setChildNodesMap(prev => ({ ...prev, '/': childrenPathsResult })); 
          setUserExpandedPaths(prev => new Set(prev).add('/')); 
        }
      } else { // Not a root load, loading a subdirectory (path is always real here)
        const items = await unifiedFsService.listFiles(pathToLoad, session);
        for (const itemName of items) {
          const itemPath = pathToLoad.endsWith('/') ? `${pathToLoad}${itemName}` : `${pathToLoad}/${itemName}`;
          const type = await determineItemType(itemPath, itemName);
          const cleanItemName = itemName.endsWith('/') ? itemName.slice(0, -1) : itemName;
          newItemsUpdates[itemPath] = { name: cleanItemName, path: itemPath, type };
          childrenPathsResult.push(itemPath);
        }
        setChildNodesMap(prev => ({ ...prev, [pathToLoad]: childrenPathsResult }));
      }
      
      setAllItems(prev => ({ ...prev, ...newItemsUpdates }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setChildNodesMap(prev => { const newMap = { ...prev }; delete newMap[pathToLoad]; return newMap; });
    } finally {
      setLoadingPaths(prev => { const newSet = new Set(prev); newSet.delete(pathToLoad); return newSet; });
    }
  }, [unifiedFsService, session, determineItemType, rootPath, displayRootPath, aliases]);

  useEffect(() => {
    setAllItems({}); setChildNodesMap({}); setRootItemPaths([]);
    setUserExpandedPaths(new Set(rootPath ? [rootPath] : ['/']));
    setLoadingPaths(new Set()); setError(null);
    loadDirectory(rootPath || '/', true); 
  }, [rootPath, displayRootPath, loadDirectory]); // Rerun if displayRootPath changes too, for header

  const handleToggleExpand = useCallback((itemToToggle: FileItem) => {
    // If the item path is an alias key, it's a conceptual root. Trigger onAliasSelect.
    if (aliases[itemToToggle.path]) {
      onAliasSelect(itemToToggle.path);
      return;
    }

    if (itemToToggle.type !== 'directory') return; // Should not happen for aliases if type is set correctly
    
    setUserExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemToToggle.path)) newSet.delete(itemToToggle.path);
      else {
        newSet.add(itemToToggle.path);
        if (!childNodesMap[itemToToggle.path] && unifiedFsService) {
          loadDirectory(itemToToggle.path, false); // path is real
        }
      }
      return newSet;
    });
  }, [childNodesMap, loadDirectory, unifiedFsService, aliases, onAliasSelect]);

  const handleRefresh = () => {
    setAllItems({}); setChildNodesMap({}); setLoadingPaths(new Set()); setError(null);
    loadDirectory(rootPath || '/', true); 
  };

  const handleNewFileRequest = async (parentDir: FileItem) => {/* ... */}; // Unchanged, use real paths
  const handleNewFolderRequest = async (parentDir: FileItem) => {/* ... */}; // Unchanged, use real paths
  const handleDeleteRequest = async (itemToDelete: FileItem) => {/* ... */}; // Unchanged, use real paths

  const { visibleItems, effectivelyExpandedPaths } = useMemo(() => {
    // ... (Filtering logic remains the same, operates on allItems which uses real paths for children) ...
    if (!searchTerm.trim()) return { visibleItems: null, effectivelyExpandedPaths: null };
    const term = searchTerm.toLowerCase();
    const newVisibleItems = new Set<string>();
    const newEffectivelyExpandedPaths = new Set<string>();
    function checkVisibilityAndCollect(itemPath: string): boolean { // itemPath can be alias or real
      const item = allItems[itemPath]; // allItems stores alias roots by alias path, real items by real path
      if (!item) return false;
      let isVisible = item.name.toLowerCase().includes(term);
      
      // If itemPath is an alias, its children are resolved from its real path
      const realPathForChildren = aliases[itemPath] || itemPath;

      if (item.type === 'directory') {
        const children = childNodesMap[realPathForChildren] || [];
        let anyChildVisible = false;
        for (const childPath of children) if (checkVisibilityAndCollect(childPath)) anyChildVisible = true;
        if (anyChildVisible) { isVisible = true; newEffectivelyExpandedPaths.add(itemPath); }
      }
      if (isVisible) newVisibleItems.add(itemPath);
      return isVisible;
    }
    rootItemPaths.forEach(path => checkVisibilityAndCollect(path)); // rootItemPaths can be alias or real
    return { visibleItems: newVisibleItems, effectivelyExpandedPaths: newEffectivelyExpandedPaths };
  }, [searchTerm, allItems, childNodesMap, rootItemPaths, aliases]);

  const renderNode = useCallback((itemPath: string, depth: number): JSX.Element | null => {
    if (searchTerm.trim() && visibleItems && !visibleItems.has(itemPath)) return null;

    const item = allItems[itemPath]; // itemPath can be an alias key or a real path
    if (!item) {
      // This case might occur if rootPath is a real path that's not yet in allItems
      // (e.g. initial load of a directly opened folder).
      // If itemPath is the current real rootPath and not in allItems, make a temp item.
      if (itemPath === rootPath && depth === 0) {
         let itemName = "";
         if (displayRootPath && aliases[displayRootPath] === rootPath) { 
            itemName = displayRootPath.split('/').filter(Boolean).pop() || displayRootPath;
         } else if (rootPath) { 
            itemName = rootPath.split('/').filter(Boolean).pop() || rootPath;
         }
         if (!itemName) return null; // Should not happen if rootPath is valid
         const tempRootItem: FileItem = { name: itemName, path: rootPath, type: 'directory'}; // path is real
         return ( <DirectoryTreeViewNode key={itemPath} item={tempRootItem} depth={depth} isExpanded={true} isLoading={loadingPaths.has(itemPath)} onToggleExpand={handleToggleExpand} onFileSelect={onFileSelect} onNewFileRequest={handleNewFileRequest} onNewFolderRequest={handleNewFolderRequest} onDeleteRequest={handleDeleteRequest} childrenToRender={null}/>);
      }
      return null;
    }
    
    let isExpanded = userExpandedPaths.has(itemPath); // itemPath can be alias key or real path
    if (searchTerm.trim() && effectivelyExpandedPaths?.has(itemPath)) isExpanded = true;
    
    const isLoadingChildren = loadingPaths.has(aliases[itemPath] || itemPath); // Use real path for loading state
    // Child nodes are always mapped by the REAL path (or '/' for default/alias roots)
    const realPathForChildrenLookup = aliases[itemPath] || itemPath;
    const childrenFilePaths = childNodesMap[realPathForChildrenLookup] || [];
    
    let childrenToRender: React.ReactNode = null;
    if (item.type === 'directory' && isExpanded && childrenFilePaths.length > 0) {
      childrenToRender = childrenFilePaths.map(childPath => renderNode(childPath, depth + 1)).filter(Boolean);
    } else if (item.type === 'directory' && isExpanded && !isLoadingChildren && childrenFilePaths.length === 0 && !loadingPaths.has(realPathForChildrenLookup)) {
       childrenToRender = ( <div style={{ paddingLeft: `${(depth + 1) * 20 + 24}px` }} className="text-xs text-gray-400 p-1 italic">(empty)</div> );
    }

    return (
      <DirectoryTreeViewNode
        key={itemPath} item={item} depth={depth}
        isExpanded={isExpanded} isLoading={isLoadingChildren}
        onToggleExpand={handleToggleExpand} onFileSelect={onFileSelect}
        childrenToRender={childrenToRender}
        onNewFileRequest={handleNewFileRequest} onNewFolderRequest={handleNewFolderRequest}
        onDeleteRequest={handleDeleteRequest}
      />
    );
  }, [allItems, userExpandedPaths, loadingPaths, childNodesMap, handleToggleExpand, onFileSelect, rootPath, displayRootPath, aliases, searchTerm, visibleItems, effectivelyExpandedPaths, handleNewFileRequest, handleNewFolderRequest, handleDeleteRequest, onAliasSelect]); 
  
  let currentRootForDisplay: string;
  if (displayRootPath) { 
    currentRootForDisplay = displayRootPath.split('/').filter(Boolean).pop() || displayRootPath;
  } else if (rootPath) { 
    currentRootForDisplay = rootPath.split('/').filter(Boolean).pop() || rootPath;
  } else if (Object.keys(aliases).length > 0 && !rootPath) { // Showing aliases as roots
    currentRootForDisplay = "Project Aliases";
  }
  else {
    currentRootForDisplay = "All Roots";
  }
  const explorerTitle = displayRootPath || rootPath || (Object.keys(aliases).length > 0 && !rootPath ? "Projects" : "All Roots");

  return (
    <div className="p-2 flex flex-col h-full text-xs">
      <div className="mb-1">
        <Input 
          type="search" placeholder="Search files/folders..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="h-8 text-xs mb-1"
        />
      </div>
      <div className="mb-1 flex items-center border-t pt-1">
        <span className="font-semibold text-sm flex-grow truncate" title={explorerTitle}>
            Explorer: {currentRootForDisplay}
        </span>
        <button 
            onClick={handleRefresh} 
            className="p-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loadingPaths.size > 0 && Array.from(loadingPaths).some(p => rootPath ? p === (aliases[rootPath] || rootPath) : p === '/')}
            title={`Refresh ${currentRootForDisplay}`}
        >
            Refresh
        </button>
      </div>

      {(loadingPaths.has(rootPath || '/')) && rootItemPaths.length === 0 && 
        <p className="text-sm text-gray-400">Loading: {currentRootForDisplay}...</p>
      }
      {error && <div className="p-2 my-1 text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded text-xs">Error: {error}</div>}
      
      <div className="overflow-auto flex-grow">
        {searchTerm.trim() && visibleItems && visibleItems.size === 0 && (
          <p className="text-sm text-gray-400 p-2">No matching files or folders found for "{searchTerm}".</p>
        )}
        {rootItemPaths.map(rPath => renderNode(rPath, 0)).filter(Boolean)}
      </div>
    </div>
  );
};

export default FileExplorer;

import React from 'react';
import { FileItem } from './types';
import { ChevronRight, ChevronDown, Folder, FileText, Loader2, FilePlus, FolderPlus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'; // Assuming this path is correct

interface DirectoryTreeViewNodeProps {
  item: FileItem;
  depth: number;
  isExpanded: boolean;
  isLoading: boolean;
  onToggleExpand: (item: FileItem) => void;
  onFileSelect: (item: FileItem) => void;
  childrenToRender?: React.ReactNode;
  // Context menu action handlers
  onNewFileRequest: (parentDir: FileItem) => void;
  onNewFolderRequest: (parentDir: FileItem) => void;
  onDeleteRequest: (item: FileItem) => void;
}

const DirectoryTreeViewNode: React.FC<DirectoryTreeViewNodeProps> = ({
  item,
  depth,
  isExpanded,
  isLoading,
  onToggleExpand,
  onFileSelect,
  childrenToRender,
  onNewFileRequest,
  onNewFolderRequest,
  onDeleteRequest,
}) => {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'directory') {
      onToggleExpand(item);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Allow context menu to trigger without selecting/toggling
    if (e.type === 'contextmenu') return;

    if (item.type === 'file') {
      onFileSelect(item);
    } else {
      onToggleExpand(item);
    }
  };

  const indentSize = 20;

  const contextMenuItems = [];
  if (item.type === 'directory') {
    contextMenuItems.push(
      <DropdownMenuItem key="newfile" onClick={(e) => { e.stopPropagation(); onNewFileRequest(item); }}>
        <FilePlus size={14} className="mr-2" /> New File
      </DropdownMenuItem>,
      <DropdownMenuItem key="newfolder" onClick={(e) => { e.stopPropagation(); onNewFolderRequest(item); }}>
        <FolderPlus size={14} className="mr-2" /> New Folder
      </DropdownMenuItem>
    );
  }
  // Add separator if there are items before delete
  if (contextMenuItems.length > 0) {
      contextMenuItems.push(<DropdownMenuSeparator key="sep" />);
  }
  contextMenuItems.push(
    <DropdownMenuItem key="delete" onClick={(e) => { e.stopPropagation(); onDeleteRequest(item); }} className="text-red-600 hover:!text-red-600 dark:text-red-500 dark:hover:!text-red-500">
      <Trash2 size={14} className="mr-2" /> Delete {item.type === 'directory' ? 'Folder' : 'File'}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="flex items-center p-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded group"
          style={{ paddingLeft: `${depth * indentSize}px` }}
          onClick={handleClick}
          onContextMenu={(e) => e.stopPropagation()} // Allow default context menu to be prevented by DropdownMenuTrigger
          title={item.path}
        >
          {item.type === 'directory' && (
            <button 
              onClick={handleToggle} 
              className="mr-1 focus:outline-none p-0.5 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 rounded"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          )}
          {item.type === 'directory' ? (
            <Folder size={16} className={`mr-2 ${isExpanded ? 'text-blue-600' : 'text-blue-500'}`} />
          ) : (
            <span style={{ width: '16px', display: 'inline-block' }} className="mr-1"></span> // Spacer for file alignment
          )}
          {item.type === 'file' && <FileText size={16} className="mr-2 text-gray-500" />}
          
          <span className="text-sm select-none truncate">{item.name}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()} className="w-48">
        {contextMenuItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DirectoryTreeViewNode;

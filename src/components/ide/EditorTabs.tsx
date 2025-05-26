import React, { useEffect, useState, useRef, useMemo } from 'react';
import { OpenFile, UnifiedFsService, Session } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XIcon, SaveIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// PrismJS imports
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css'; // Chosen theme
// Import languages - make sure these are components, not just types
import 'prismjs/components/prism-clike'; // Base for many languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup'; // For HTML, XML, SVG
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-less';
import 'prismjs/components/prism-scss';
// Note: Some languages depend on others (e.g., jsx needs javascript).
// Prism should handle these dependencies if components are imported correctly.

import { getLanguageFromPath } from './utils'; // Utility function

interface EditorTabsProps {
  openFiles: OpenFile[];
  activeTab: string | null;
  onActiveTabChange: (path: string | null) => void;
  onCloseTab: (path: string) => void;
  onContentChange: (filePath: string, newContent: string) => void;
  onSaveFile: (filePath: string) => void;
  unifiedFsService: UnifiedFsService | null;
  session: Session | null;
}

const EditorArea: React.FC<{ file: OpenFile; onContentChange: EditorTabsProps['onContentChange']; }> = ({ file, onContentChange }) => {
  const [highlightedCode, setHighlightedCode] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (file.content !== null) {
      const language = getLanguageFromPath(file.path);
      if (Prism.languages[language]) {
        const html = Prism.highlight(file.content, Prism.languages[language], language);
        setHighlightedCode(html);
      } else {
        // Fallback for unsupported languages or if language component not loaded
        setHighlightedCode(Prism.highlight(file.content, Prism.languages.markup, 'markup'));
      }
    } else {
      setHighlightedCode('');
    }
  }, [file.content, file.path]);

  // Scroll synchronization
  const handleScroll = (source: 'textarea' | 'pre') => {
    if (textareaRef.current && preRef.current) {
      if (source === 'textarea') {
        preRef.current.scrollTop = textareaRef.current.scrollTop;
        preRef.current.scrollLeft = textareaRef.current.scrollLeft;
      } else {
        textareaRef.current.scrollTop = preRef.current.scrollTop;
        textareaRef.current.scrollLeft = preRef.current.scrollLeft;
      }
    }
  };
  
  const editorStyles: React.CSSProperties = {
    fontFamily: '"Fira Code", "Dank Mono", "Operator Mono", monospace', // Common coding fonts
    fontSize: '14px',
    lineHeight: '1.5',
    tabSize: 4, // Standard tab size
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    padding: '1rem', // Consistent padding
    margin: 0,
    whiteSpace: 'pre', // Important for pre to respect whitespace
    overflow: 'auto', // For scrolling
    minHeight: '100%', // Ensure it fills space
    outline: 'none',
    position: 'relative',
  };


  return (
    <div className="relative w-full h-full">
      <textarea
        ref={textareaRef}
        value={file.content || ''}
        onChange={(e) => onContentChange(file.path, e.target.value)}
        onScroll={() => handleScroll('textarea')}
        spellCheck="false"
        className="absolute inset-0 w-full h-full resize-none border-0 bg-transparent text-transparent caret-white dark:caret-white"
        style={{
          ...editorStyles,
          zIndex: 1, // Textarea for input, caret color needs to be visible
          color: 'transparent', // Make text transparent
        }}
      />
      <pre
        ref={preRef}
        aria-hidden="true"
        onScroll={() => handleScroll('pre')}
        className="absolute inset-0 w-full h-full language-*" // language-* class for prism theme
        style={{
          ...editorStyles,
          zIndex: 0, // Pre for display
          pointerEvents: 'none', // Allow clicks to pass through to textarea
        }}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </div>
  );
};


const EditorTabs: React.FC<EditorTabsProps> = ({
  openFiles,
  activeTab,
  onActiveTabChange,
  onCloseTab,
  onContentChange,
  onSaveFile,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (activeTab) {
          const currentFile = openFiles.find(f => f.path === activeTab);
          if (currentFile && currentFile.isDirty) {
            onSaveFile(activeTab);
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, openFiles, onSaveFile]);

  if (openFiles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 bg-gray-50 dark:bg-gray-850">
        <span className="font-semibold text-gray-400 dark:text-gray-500">
          No file open. Select a file from the explorer to begin editing.
        </span>
      </div>
    );
  }

  return (
    <Tabs value={activeTab ?? undefined} onValueChange={onActiveTabChange} className="flex flex-col h-full bg-gray-50 dark:bg-gray-850">
      <TabsList className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 p-1 overflow-x-auto no-scrollbar">
        {openFiles.map((file) => (
          <TabsTrigger
            key={file.path}
            value={file.path}
            className={`flex items-center text-xs px-2 py-1.5 mr-1 rounded-t-md relative group whitespace-nowrap
                        ${activeTab === file.path 
                          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm editor-tab-active' 
                          : 'bg-gray-200 dark:bg-gray-750 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 editor-tab-inactive'
                        }`}
            style={{ minWidth: '120px', maxWidth: '220px' }} 
          >
            <span className="truncate flex-grow" title={file.name}>
              {file.name}{file.isDirty ? '*' : ''}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseTab(file.path); }}
              className={`ml-2 p-0.5 rounded hover:bg-red-500 hover:text-white opacity-60 hover:opacity-100
                          ${activeTab === file.path ? 'group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}
                          transition-opacity`}
              aria-label={`Close ${file.name}`}
            >
              <XIcon size={14} />
            </button>
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="flex-grow overflow-auto relative"> {/* Added relative for positioning context */}
        {openFiles.map((file) => (
          <TabsContent key={file.path} value={file.path} className="h-full p-0 m-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            {file.isLoading && (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading content...</span>
              </div>
            )}
            {file.error && (
              <div className="flex h-full items-center justify-center text-red-500 p-4">
                Error loading file: {file.error}
              </div>
            )}
            {file.content !== null && !file.isLoading && !file.error && (
              <div className="flex flex-col h-full">
                <EditorArea file={file} onContentChange={onContentChange} />
                {file.isDirty && file.path === activeTab && (
                   <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <Button size="sm" onClick={() => onSaveFile(file.path)} title="Save (Ctrl+S / Cmd+S)">
                      <SaveIcon size={16} className="mr-2" />
                      Save File
                    </Button>
                    <span className="ml-3 text-xs text-yellow-600 dark:text-yellow-400 italic">Unsaved changes</span>
                   </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};

export default EditorTabs;

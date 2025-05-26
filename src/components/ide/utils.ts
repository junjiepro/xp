/**
 * Maps a file path to a Prism.js language identifier based on its extension.
 * @param filePath The path of the file.
 * @returns A string representing the Prism.js language, or 'markup' as a default.
 */
export function getLanguageFromPath(filePath: string): string {
  const extension = filePath.substring(filePath.lastIndexOf('.') + 1);
  switch (extension) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'jsx':
      return 'jsx';
    case 'tsx':
      return 'tsx';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'html':
    case 'htm':
    case 'xml':
    case 'svg':
      return 'markup'; // 'markup' is Prism's general HTML/XML/SVG
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'hpp':
    case 'cxx':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'go':
      return 'go';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'rs':
      return 'rust';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'swift':
      return 'swift';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'sh':
    case 'bash':
      return 'bash';
    case 'sql':
      return 'sql';
    case 'less':
      return 'less';
    case 'scss':
      return 'scss';
    // Add more mappings as needed
    default:
      return 'markup'; // Default to markup or plain text if no specific lang
  }
}

# code-editor
A code editor for tscircuit snippets that automatically loads types for snippets

## Store Interface

```typescript
interface CodeEditorFile {
  filename: string
  content: string
  language: 'typescript' | 'json' | 'javascript'
}

interface CodeEditorState {
  // State
  files: Record<string, CodeEditorFile>
  activeFile: string
  cursorPosition: number | null
  isStreaming: boolean
  readOnly: boolean
  
  // Config
  showToolbar: boolean
  baseApiUrl: string
  codeCompletionApiKey?: string
  
  // File Actions
  setFile: (filename: string, content: string) => void
  updateFileContent: (filename: string, content: string) => void
  setActiveFile: (filename: string) => void
  removeFile: (filename: string) => void
  
  // Editor State
  setCursorPosition: (position: number | null) => void
  setIsStreaming: (isStreaming: boolean) => void
  setReadOnly: (readOnly: boolean) => void
  
  // Editor Config
  setShowToolbar: (show: boolean) => void
  setBaseApiUrl: (url: string) => void
  setCodeCompletionApiKey: (key: string) => void
  
  // Computed
  dtsContent: string | null
}

// Events emitted by the editor
interface CodeEditorEvents {
  onCodeChange: (code: string, filename: string) => void
  onCursorPositionChange: (position: number | null) => void
  onDtsChange: (dts: string) => void
  onError: (error: Error) => void
}
```

## Component Props

```typescript
interface TscircuitCodeEditorProps {
  // Optional configuration overrides
  readOnly?: boolean
  showToolbar?: boolean
  baseApiUrl?: string
  codeCompletionApiKey?: string
  
  // Event handlers
  onCodeChange?: (code: string, filename: string) => void
  onDtsChange?: (dts: string) => void
  onError?: (error: Error) => void
}
```

## Migration Guide

1. Install the package:
```bash
npm install @tscircuit/code-editor
```

2. Replace existing CodeEditor implementation with TscircuitCodeEditor:

```typescript
// Before
<CodeEditor
  onCodeChange={handleCodeChange}
  onDtsChange={handleDtsChange}
  readOnly={isReadOnly}
  initialCode={code}
  manualEditsFileContent={manualEdits}
  isStreaming={isStreaming}
  showImportAndFormatButtons={showToolbar}
/>

// After
const { setFile, setActiveFile, setIsStreaming, setReadOnly } = useTscircuitCodeEditor()

// Initialize files
useEffect(() => {
  setFile('index.tsx', code)
  setFile('manual-edits.json', manualEdits)
  setIsStreaming(isStreaming)
  setReadOnly(isReadOnly)
}, [code, manualEdits, isStreaming, isReadOnly])

<TscircuitCodeEditor
  onCodeChange={handleCodeChange}
  onDtsChange={handleDtsChange}
  showToolbar={showToolbar}
/>
```

## Store Implementation Example

```typescript
import { create } from 'zustand'
import type { CodeEditorState } from './types'

export const useCodeEditorStore = create<CodeEditorState>((set, get) => ({
  files: {},
  activeFile: '',
  cursorPosition: null,
  isStreaming: false,
  readOnly: false,
  showToolbar: true,
  baseApiUrl: '',
  
  setFile: (filename, content) => 
    set((state) => ({
      files: {
        ...state.files,
        [filename]: {
          filename,
          content,
          language: filename.endsWith('.json') ? 'json' : 'typescript'
        }
      }
    })),
    
  updateFileContent: (filename, content) =>
    set((state) => ({
      files: {
        ...state.files,
        [filename]: {
          ...state.files[filename],
          content
        }
      }
    })),
    
  // ... implement other actions
}))
```

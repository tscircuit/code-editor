# @tscircuit/code-editor
A code editor for tscircuit snippets that automatically loads types for snippets

### Store Interface
```typescript
// types.ts
interface OriginalFile {
  path: string
  content: string
  language: 'typescript' | 'json'
}

interface FileChange {
  path: string
  content: string
  lastModified: Date
}

interface FileWithChanges {
  path: string
  originalContent: string
  currentContent: string
  hasChanges: boolean
  language: 'typescript' | 'json'
}

interface EditorStore {
  // Original state from server
  originalFiles: Record<string, OriginalFile>
  
  // User changes
  changes: Record<string, FileChange>
  
  // UI state
  currentFilePath: string | null

  // Actions
  updateContent: (path: string, content: string) => void
  resetChanges: (paths?: string[]) => void
  setCurrentFile: (path: string) => void
  
  // Computed
  getFilesWithChanges: () => Record<string, FileWithChanges>
  getCurrentFile: () => FileWithChanges | null
  initializeEditor: (config: {
    originalFiles: Record<string, OriginalFile>
  }) => void

}
```

### Component Props
```typescript
interface TscircuitCodeEditorProps {
  // Appearance
  className?: string
  theme?: 'light' | 'dark'
  fontSize?: number
  showLineNumbers?: boolean
  
  // Toolbar configuration
  showToolbar?: boolean
  toolbarItems?: React.ComponentType
  
  // Event handlers
  onSave?: (file: FileWithChanges) => Promise<void>
  onError?: (error: Error) => void
  
  // Custom components
  LoadingComponent?: React.ComponentType
  ErrorComponent?: React.ComponentType<{ error: Error }>
  FileListComponent?: React.ComponentType<{
    files: Record<string, FileWithChanges>
    currentPath: string | null
    onSelect: (path: string) => void
  }>
}
```

### Migration Guide

1. Install the package:
```bash
bun install @tscircuit/code-editor
```

2. Replace existing CodeEditor implementation with TscircuitCodeEditor:
```typescript
// Before
<CodeEditor
  onCodeChange={handleCodeChange}
  readOnly={isReadOnly}
  initialCode={code}
  isStreaming={isStreaming}
  showImportAndFormatButtons={showToolbar}
/>

// After
const CircuitEditor = () => {
  const [isLoading, setIsLoading] = useState(true)

  const { getCurrentFile, initializeEditor } = useTscircuitEditor()
  
  // Load files from server
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/package_files/list?package_release_id=${releaseId}`)
        const files = await response.json()
        
        // Initialize editor with original files
        initializeEditor({
          originalFiles: files.reduce((acc, file) => ({
            ...acc,
            [file.path]: {
              path: file.path,
              content: file.content,
              language: file.path.endsWith('.json') ? 'json' : 'typescript'
            }
          }), {})
        })
      } catch (error) {
        console.error('Failed to load files:', error)
      }
      setIsLoading(false)
    }
    
    loadFiles()
  }, [releaseId])

  const handleSave = async () => {
    const currentFile = getCurrentFile()
    if (currentFile?.hasChanges) {
      await saveToServer({
        path: currentFile.path,
        content: currentFile.currentContent
      })
    }
  }

  return (
    <TscircuitCodeEditor
      theme="dark"
      showToolbar
      toolbarItems={<>Custom toolbar headers...</>}
      onSave={handleSave}
      onError={(error) => {
        toast.error(error.message)
      }}
    />
  )
}
```

### Store Implementation Example
```typescript
import { create } from 'zustand'

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  originalFiles: {},
  changes: {},
  currentFilePath: null,

  // Actions
  updateContent: (path, content) => {
    const originalFile = get().originalFiles[path]
    if (!originalFile) return

    // Only create change if content is different from original
    if (content === originalFile.content) {
      // Remove change if content matches original
      set((state) => {
        const newChanges = { ...state.changes }
        delete newChanges[path]
        return { changes: newChanges }
      })
    } else {
      // Update or create change
      set((state) => ({
        changes: {
          ...state.changes,
          [path]: {
            path,
            content,
            lastModified: new Date()
          }
        }
      }))
    }
  },

  resetChanges: (paths) => {
    set((state) => {
      if (!paths) return { changes: {} }
      const newChanges = { ...state.changes }
      paths.forEach(path => {
        delete newChanges[path]
      })
      return { changes: newChanges }
    })
  },

  setCurrentFile: (path) => {
    set({ currentFilePath: path })
  },

  // Computed
  getFilesWithChanges: () => {
    const state = get()
    return Object.keys(state.originalFiles).reduce((acc, path) => {
      const originalFile = state.originalFiles[path]
      const change = state.changes[path]
      
      acc[path] = {
        path,
        originalContent: originalFile.content,
        currentContent: change?.content ?? originalFile.content,
        hasChanges: !!change,
        language: originalFile.language
      }
      return acc
    }, {} as Record<string, FileWithChanges>)
  },

  getCurrentFile: () => {
    const state = get()
    if (!state.currentFilePath) return null

    const files = get().getFilesWithChanges()
    return files[state.currentFilePath] || null
  }

  initializeEditor: (config) => {
    set({
      originalFiles: config.originalFiles,
      changes: {},  // Reset any existing changes
      currentFilePath: Object.keys(config.originalFiles)[0] || null  // Set first file as current
    })
  },
}))
```

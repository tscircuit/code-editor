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

interface ChangedFile {
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

// Hook configuration
interface EditorConfig {
  loadInitialFiles: () => Promise<Record<string, string>>
}

interface EditorStore {
  // Original state from server
  originalFiles: Record<string, OriginalFile>
  
  // User changes
  changedFiles: Record<string, ChangedFile>
  
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
  
  // Custom components
  LoadingComponent?: React.ComponentType
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
  const { getCurrentFile, isLoading } = useTscircuitEditor({
    // Provide file loading function
    loadInitialFiles: () => fetch(`/package_files/list?package_release_id=${releaseId}`)
      .then(res => res.json())
      .then(files => files.reduce((acc, file) => ({
        ...acc,
        [file.path]: file.content
      }), {}))
  })

  const handleSave = async () => {
    const currentFile = getCurrentFile()
    if (currentFile?.hasChanges) {
      await saveToServer({
        path: currentFile.path,
        content: currentFile.currentContent
      })
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <TscircuitCodeEditor
      theme="dark"
      showToolbar
      toolbarItems={<>Custom toolbar headers...</>}
      onSave={handleSave}
    />
  )
}
```

### Store Implementation Example
```typescript
import { create } from 'zustand'

const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  originalFiles: {},
  changedFiles: {},
  currentFilePath: null,

  // Actions
  updateContent: (path, content) => {
    const originalFile = get().originalFiles[path]
    if (!originalFile) return

    // Only create change if content is different from original
    if (content === originalFile.content) {
      // Remove change if content matches original
      set((state) => {
        const newChanges = { ...state.changedFiles }
        delete newChanges[path]
        return { changedFiles: newChanges }
      })
    } else {
      // Update or create change
      set((state) => ({
        changedFiles: {
          ...state.changedFiles,
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
      if (!paths) return { changedFiles: {} }
      const newChanges = { ...state.changedFiles }
      paths.forEach(path => {
        delete newChanges[path]
      })
      return { changedFiles: newChanges }
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
      const change = state.changedFiles[path]
      
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
  },

  initializeEditor: (config) => {
    set({
      originalFiles: config.originalFiles,
      changedFiles: {},  // Reset any existing changes
      currentFilePath: Object.keys(config.originalFiles)[0] || null
    })
  }
}))

// Hook implementation
const useTscircuitEditor = (config: EditorConfig) => {
  const store = useEditorStore()
  const [isLoading, setIsLoading] = useState(true)

  // Initialize immediately 
  if (config?.loadInitialFiles) {
    setIsLoading(true)
    config.loadInitialFiles()
      .then(filesContent => {
        const originalFiles = Object.entries(filesContent).reduce(
          (acc, [path, content]) => ({
            ...acc,
            [path]: {
              path,
              content,
              language: path.endsWith('.json') ? 'json' : 'typescript'
            }
          }), 
          {}
        )
        store.initializeEditor({ originalFiles })
      })
      .finally(() => setIsLoading(false))
  }

  return {
    ...store,
    isLoading
  }
}

export { useTscircuitEditor }
```

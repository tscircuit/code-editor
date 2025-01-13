# code-editor
A code editor for tscircuit snippets that automatically loads types for snippets

## Store Interface

```typescript
// types.ts
interface EditorFile {
  path: string
  savedContent: string // Last saved on server
  currentContent: string
  language: 'typescript' | 'json'
  lastSavedAt: Date
}

// store.ts
interface EditorStore {
  // State
  files: Record<string, EditorFile>
  currentFilePath: string | null
  hasUnsavedChanges: boolean

  // Actions
  updateContent: (content: string) => void
  saveCurrentFile: () => Promise<void>
  setActiveFile: (path: string) => void
}
```

## Component Props

```typescript
interface TscircuitCodeEditorProps {
  // Optional className for container
  className?: string
  
  // Editor appearance
  theme?: 'light' | 'dark'
  showLineNumbers?: boolean
  fontSize?: number
  
  // Toolbar options
  showToolbar?: boolean
  toolbarItems?: React.ComponentType
  
  // Event handlers
  onSave?: (file: EditorFile) => Promise<void>
  onError?: (error: Error) => void
  
  // Custom components
  LoadingComponent?: React.ComponentType
  ErrorComponent?: React.ComponentType<{ error: Error }>
}
```

## Migration Guide

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
  const { setCurrentFile } = useTscircuitEditor()

  useEffect(() => {
    setCurrentFile('main.tsx')
  }, [])

  return (
    <TscircuitCodeEditor
      theme="dark"
      showToolbar
      toolBarItems={<>pass the items</>}
      onSave={async (file) => {
        await saveToServer(file.path, file.currentContent)
      }}
      onError={(error) => {
        toast.error(error.message)
      }}
    />
  )
}
```

## Store Implementation Example

```typescript
import { create } from 'zustand'
import type { CodeEditorState } from './types'

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  files: {},
  currentFilePath: null,

  // Actions
  updateContent: (content: string) => {
    set((state) => {
      const path = state.currentFilePath
      if (!path) return state

      return {
        files: {
          ...state.files,
          [path]: {
            ...state.files[path],
            currentContent: content
          }
        }
      }
    })
  },

  saveCurrentFile: async () => {
    const state = get()
    const file = get().getCurrentFile()
    if (!file) return

    set((state) => ({
      files: {
        ...state.files,
        [file.path]: {
          ...file,
          savedContent: file.currentContent,
          lastSavedAt: new Date()
        }
      }
    }))
  },

  setCurrentFile: (path: string) => {
    set({ currentFilePath: path })
  },

  // Computed
  getCurrentFile: () => {
    const state = get()
    if (!state.currentFilePath) return null
    return state.files[state.currentFilePath]
  },

  get hasUnsavedChanges() {
    const file = get().getCurrentFile()
    if (!file) return false
    return file.savedContent !== file.currentContent
  }
}))
```

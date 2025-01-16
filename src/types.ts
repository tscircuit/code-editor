export interface OriginalFile {
  path: string
  content: string
  language: "typescript" | "json"
}

export interface ChangedFile {
  path: string
  content: string
  lastModified: Date
}

export interface FileWithChanges {
  path: string
  originalContent: string
  currentContent: string
  hasChanges: boolean
  language: "typescript" | "json"
}

// Hook configuration
export interface EditorConfig {
  loadInitialFiles: () => Promise<Record<string, string>>
}

export interface EditorStore {
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

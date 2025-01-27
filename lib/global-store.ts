import { useEffect, useState } from "react"
import { create } from "zustand"
import type { EditorConfig, EditorStore, FileWithChanges } from "./types"

const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  originalFiles: {},
  changedFiles: {},
  currentFilePath: null,

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
      console.log("updateContengggt", path, content)
      // Update or create change
      set((state) => ({
        changedFiles: {
          ...state.changedFiles,
          [path]: {
            path,
            content,
            lastModified: new Date(),
          },
        },
      }))
    }
  },

  resetChanges: (paths) => {
    set((state) => {
      if (!paths) return { changedFiles: {} }
      const newChanges = { ...state.changedFiles }
      for (const path of paths) {
        delete newChanges[path]
      }
      return { changedFiles: newChanges }
    })
  },

  setCurrentFile: (path) => {
    set({ currentFilePath: path })
  },

  getFilesWithChanges: () => {
    const state = get()
    return Object.keys(state.originalFiles).reduce(
      (acc, path) => {
        const originalFile = state.originalFiles[path]
        const change = state.changedFiles[path]

        acc[path] = {
          path,
          originalContent: originalFile.content,
          currentContent: change?.content ?? originalFile.content,
          hasChanges: !!change,
          language: originalFile.language,
        }
        return acc
      },
      {} as Record<string, FileWithChanges>,
    )
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
      changedFiles: {}, // Reset any existing changes
      currentFilePath: Object.keys(config.originalFiles)[0] || null,
    })
  },
}))

// Hook implementation
const useTscircuitEditor = (config?: EditorConfig) => {
  const store = useEditorStore()
  const [isLoading, setIsLoading] = useState(true)


  // run once on mount
  useEffect(() => {
    const initializeStore = async () => {
      if (config?.loadInitialFiles) {
        try {
          const filesContent = await config.loadInitialFiles()
          const originalFiles = Object.entries(filesContent).reduce(
            (acc, [path, content]) => ({
              ...acc,
              [path]: {
                path,
                content,
                language: path.endsWith(".json") ? "json" : "typescript",
              },
            }),
            {},
          )
          store.initializeEditor({ originalFiles })
        } catch (error) {
          console.error("Failed to load initial files:", error)
          store.initializeEditor({ originalFiles: {} })
        } finally {
          setIsLoading(false)
        }
      } else {
        store.initializeEditor({ originalFiles: {} })
        setIsLoading(false)
      }
    }

    initializeStore()
  }, [])

  return {
    ...store,
    isLoading,
  }
}

export { useTscircuitEditor }

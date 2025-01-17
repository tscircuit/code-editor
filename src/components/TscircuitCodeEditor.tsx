import type { setupTypeAcquisition } from "@typescript/ata"
import type { createVirtualTypeScriptEnvironment } from "@typescript/vfs"
import type { EditorView } from "codemirror"
import { initializeEditor } from "../lib/codemirror"
import { useEffect, useRef, useState } from "react"
import { useTscircuitEditor } from "../global-store"
import type { FileWithChanges } from "types"

interface TsCodeEditorProps {
  readOnly?: boolean
  className?: string
  language?: "typescript" | "json"
  apiUrl?: string
  toolbarItems?: React.ReactNode
  showToolbar?: boolean
}

export const TscircuitCodeEditor = ({
  className = "",
  language = "typescript",
  readOnly = false,
  apiUrl = "",
  toolbarItems,
  showToolbar = false,
}: TsCodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const ataRef = useRef<ReturnType<typeof setupTypeAcquisition> | null>(null)
  const envRef = useRef<ReturnType<
    typeof createVirtualTypeScriptEnvironment
  > | null>(null)
  const currentFileRef = useRef<FileWithChanges | null>(null)

  const { getCurrentFile, updateContent } = useTscircuitEditor()
  const currentFile = getCurrentFile()
  const initialCode = currentFile?.currentContent

  // Keep currentFileRef in sync
  useEffect(() => {
    currentFileRef.current = currentFile
  }, [currentFile])

  const [ataInitialized, setAtaInitialized] = useState(false)

  const [currentCode, setCurrentCode] = useState(
    getCurrentFile()?.currentContent || "",
  )

  // Update editor content
  const updateCurrentEditorContent = (newContent: string) => {
    if (viewRef.current) {
      const state = viewRef.current.state
      if (state.doc.toString() !== newContent) {
        viewRef.current.dispatch({
          changes: { from: 0, to: state.doc.length, insert: newContent },
        })
      }
    }
  }

  const onChange = (code: string) => {
    const currentFilePath = currentFileRef.current?.path
    if (currentFilePath) {
      updateContent(currentFilePath, code)
    }
  }

  useEffect(() => {
    if (!editorRef.current) return

    initializeEditor(
      {
        container: editorRef.current,
        initialCode: initialCode || "",
        language,
        readOnly,
        apiUrl,
        onChange,
        setCurrentCode,
        setAtaInitialized,
      },
      { viewRef, ataRef, envRef },
    )

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
      ataRef.current = null
      envRef.current = null
    }
  }, [])

  // Update editor content when file changes
  useEffect(() => {
    if (initialCode !== undefined) {
      updateCurrentEditorContent(initialCode)
    }
  }, [currentFile?.path, initialCode])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {showToolbar && toolbarItems}
      <div ref={editorRef} className="flex-1 overflow-auto" />
    </div>
  )
}

import { indentWithTab } from "@codemirror/commands"
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
import { EditorState } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import { EditorView } from "codemirror"
import { useEffect, useRef } from "react"
import { useTscircuitEditor } from "../global-store"
import { basicSetup } from "../lib/codemirror/basic-setup"
import { CodeEditorHeader } from "./CodeEditorHeader"
import type { FileWithChanges } from "../types"

interface TscircuitCodeEditorProps {
  // Appearance
  className?: string
  theme?: "light" | "dark"
  fontSize?: number
  showLineNumbers?: boolean

  // Core props
  onChange?: (code: string) => void
  readOnly?: boolean

  // Language options
  language?: "typescript" | "json"
}

export const TscircuitCodeEditor = ({
  onChange,
  className = "",
  language = "typescript",
}: TscircuitCodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const currentFileRef = useRef<FileWithChanges | null>(null)

  const { getCurrentFile, updateContent } = useTscircuitEditor()
  const currentFile = getCurrentFile()
  const initialCode = currentFile?.currentContent

  // Keep currentFileRef in sync
  useEffect(() => {
    currentFileRef.current = currentFile
  }, [currentFile])

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

  useEffect(() => {
    if (!editorRef.current) return

    // Set up base extensions
    const baseExtensions = [
      basicSetup,
      language === "typescript"
        ? javascript({ typescript: true, jsx: true })
        : json(),
      keymap.of([indentWithTab]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString()
          onChange?.(newContent)
          const currentFilePath = currentFileRef.current?.path
          if (currentFilePath) {
            updateContent(currentFilePath, newContent)
          }
        }
      }),
    ]

    // Only create the editor once
    if (!viewRef.current) {
      const state = EditorState.create({
        doc: initialCode,
        extensions: baseExtensions,
      })

      const view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view
    }

    return () => {
      // Only destroy on unmount
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, []) // Empty dependency array - only run once on mount

  // Update editor content when file changes
  useEffect(() => {
    if (initialCode !== undefined) {
      updateCurrentEditorContent(initialCode)
    }
  }, [currentFile?.path, initialCode])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <CodeEditorHeader />
      <div ref={editorRef} className="flex-1 overflow-auto" />
    </div>
  )
}

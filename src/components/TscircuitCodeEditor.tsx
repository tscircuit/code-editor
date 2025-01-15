import { basicSetup } from "../lib/codemirror/basic-setup"
import { autocompletion } from "@codemirror/autocomplete"
import { indentWithTab } from "@codemirror/commands"
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
import { EditorState } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import { EditorView } from "codemirror"
import React, { useEffect, useRef } from "react"

interface CodeEditorProps {
  // Core props
  code: string
  onChange?: (code: string) => void
  readOnly?: boolean
  
  // Optional styling
  className?: string
  
  // Language options
  language?: "typescript" | "json"
}

export const TscircuitCodeEditor = ({
  code,
  onChange,
  readOnly = false,
  className = "",
  language = "typescript"
}: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Set up base extensions
    const baseExtensions = [
      basicSetup,
      language === "typescript" 
        ? javascript({ typescript: true, jsx: true })
        : json(),
      keymap.of([indentWithTab]),
      EditorState.readOnly.of(readOnly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString()
          onChange?.(newContent)
        }
      })
    ]

    const state = EditorState.create({
      doc: code,
      extensions: baseExtensions,
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [code, readOnly, language])

  // Update editor content when code prop changes
  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString()
      if (currentContent !== code) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: code
          }
        })
      }
    }
  }, [code])

  return (
    <div 
      ref={editorRef} 
      className={className}
    />
  )
}

export default TscircuitCodeEditor
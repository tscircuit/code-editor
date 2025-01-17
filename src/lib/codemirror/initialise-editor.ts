import { EditorState } from "@codemirror/state"
import { EditorView } from "codemirror"
import { keymap } from "@codemirror/view"
import { indentWithTab } from "@codemirror/commands"
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
import { createSystem, createDefaultMapFromCDN } from "@typescript/vfs"
import { createVirtualTypeScriptEnvironment } from "@typescript/vfs"
import type { setupTypeAcquisition } from "@typescript/ata"
import ts from "typescript"
import { createTypeScriptSetup, basicSetup } from "./index"

const defaultImports = `
import React from "@types/react/jsx-runtime"
import { Circuit, createUseComponent } from "@tscircuit/core"
import type { CommonLayoutProps } from "@tscircuit/props"
`

interface InitializeEditorParams {
  container: HTMLDivElement
  initialCode: string
  language: "typescript" | "json"
  readOnly: boolean
  apiUrl: string
  onChange?: (code: string) => void
  setCurrentCode: (code: string) => void
  setAtaInitialized: (initialized: boolean) => void
}

interface EditorRefs {
  viewRef: { current: EditorView | null }
  ataRef: { current: ReturnType<typeof setupTypeAcquisition> | null }
  envRef: {
    current: ReturnType<typeof createVirtualTypeScriptEnvironment> | null
  }
}

export async function initializeEditor(
  params: InitializeEditorParams,
  refs: EditorRefs,
): Promise<void> {
  const {
    container,
    initialCode,
    language,
    readOnly,
    apiUrl,
    onChange,
    setCurrentCode,
    setAtaInitialized,
  } = params
  const { viewRef, ataRef, envRef } = refs

  try {
    // Create initial file system map
    const fsMap = new Map<string, string>()
    fsMap.set("index.tsx", initialCode)

    // Load TypeScript lib files from CDN
    await createDefaultMapFromCDN(
      { target: ts.ScriptTarget.ES2022 },
      "5.6.3",
      true,
      ts,
    ).then((defaultFsMap) => {
      defaultFsMap.forEach((content, filename) => {
        fsMap.set(filename, content)
      })
    })

    // Create TypeScript environment
    const system = createSystem(fsMap)
    const env = createVirtualTypeScriptEnvironment(system, [], ts, {
      jsx: ts.JsxEmit.ReactJSX,
      declaration: true,
      allowJs: true,
      target: ts.ScriptTarget.ES2022,
      resolveJsonModule: true,
    })
    envRef.current = env

    // Create TypeScript setup with environment
    const tsSetup = createTypeScriptSetup({
      fsMap,
      currentFile: "index.tsx",
      env,
      apiUrl,
      TSCI_PACKAGE_PATTERN: /@tsci\/[\w.-]+/g,
    })

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
          setCurrentCode(newContent)
          onChange?.(newContent)

          // If TypeScript is enabled, run ATA
          if (language === "typescript" && ataRef.current) {
            ataRef.current(`${defaultImports}${newContent}`)
          }
        }
      }),
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),
    ]

    // Add TypeScript extensions if in TypeScript mode
    const extensions = [
      ...baseExtensions,
      ...(language === "typescript" ? tsSetup.tsExtensions : []),
    ]

    // Create editor instance
    const state = EditorState.create({
      doc: initialCode,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: container,
    })

    viewRef.current = view

    // Setup ATA if in TypeScript mode
    if (language === "typescript") {
      const ata = tsSetup.setupATA((code, path) => {
        fsMap.set(path, code)
        env.createFile(path, code)
      })

      ataRef.current = ata
      setAtaInitialized(true)

      // Run initial ATA
      if (initialCode) {
        ata(`${defaultImports}${initialCode}`)
      }
    }
  } catch (error) {
    console.error("Error initializing editor:", error)
  }
}

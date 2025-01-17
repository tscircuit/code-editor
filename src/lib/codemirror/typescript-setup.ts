import { autocompletion } from "@codemirror/autocomplete"
import {
  tsAutocomplete,
  tsFacet,
  tsHover,
  tsLinter,
  tsSync,
} from "@valtown/codemirror-ts"
import type { ATABootstrapConfig } from "@typescript/ata"
import { setupTypeAcquisition } from "@typescript/ata"
import type { createVirtualTypeScriptEnvironment } from "@typescript/vfs"
import ts from "typescript"
import { Decoration, hoverTooltip, EditorView } from "@codemirror/view"

interface TypeScriptSetupParams {
  fsMap: Map<string, string>
  currentFile: string
  env: ReturnType<typeof createVirtualTypeScriptEnvironment>
  apiUrl: string
  TSCI_PACKAGE_PATTERN: RegExp
}

export function createTypeScriptSetup(params: TypeScriptSetupParams) {
  const { fsMap, currentFile, env, apiUrl, TSCI_PACKAGE_PATTERN } = params

  // Create hover tooltip handler
  const createHoverTooltip = (view: EditorView, pos: number) => {
    const line = view.state.doc.lineAt(pos)
    const lineText = view.state.sliceDoc(line.from, line.to)
    const matches = Array.from(lineText.matchAll(TSCI_PACKAGE_PATTERN))

    for (const match of matches) {
      if (match.index !== undefined) {
        const start = line.from + match.index
        const end = start + match[0].length
        if (pos >= start && pos <= end) {
          return {
            pos: start,
            end,
            above: true,
            create() {
              const dom = document.createElement("div")
              dom.textContent = "Ctrl/Cmd+Click to open snippet"
              return { dom }
            },
          }
        }
      }
    }
    return null
  }

  // Create package link click handler
  const createClickHandler = (event: MouseEvent, view: EditorView) => {
    if (!event.ctrlKey && !event.metaKey) return false
    const pos = view.posAtCoords({
      x: event.clientX,
      y: event.clientY,
    })
    if (pos === null) return false

    const line = view.state.doc.lineAt(pos)
    const lineText = view.state.sliceDoc(line.from, line.to)
    const matches = Array.from(lineText.matchAll(TSCI_PACKAGE_PATTERN))

    for (const match of matches) {
      if (match.index !== undefined) {
        const start = line.from + match.index
        const end = start + match[0].length
        if (pos >= start && pos <= end) {
          const importName = match[0]
          const [owner, name] = importName.replace("@tsci/", "").split(".")
          window.open(`/${owner}/${name}`, "_blank")
          return true
        }
      }
    }
    return false
  }

  // Create package link decorations
  const createDecorations = (view: EditorView) => {
    const decorations = []
    for (const { from, to } of view.visibleRanges) {
      for (let pos = from; pos < to;) {
        const line = view.state.doc.lineAt(pos)
        const lineText = line.text
        const matches = Array.from(lineText.matchAll(TSCI_PACKAGE_PATTERN))
        for (const match of matches) {
          if (match.index !== undefined) {
            const start = line.from + match.index
            const end = start + match[0].length
            decorations.push(
              Decoration.mark({
                class: "cm-underline",
              }).range(start, end)
            )
          }
        }
        pos = line.to + 1
      }
    }
    return Decoration.set(decorations)
  }

  // TypeScript-specific extensions
  const tsExtensions = [
    // Core TypeScript functionality
    tsFacet.of({ env, path: currentFile }),
    tsSync(),
    tsLinter(),
    autocompletion({ override: [tsAutocomplete()] }),
    tsHover(),

    // Hover tooltips for package links
    hoverTooltip(createHoverTooltip),

    // Click handler for package links
    EditorView.domEventHandlers({
      click: createClickHandler,
    }),

    // Styling for package links
    EditorView.theme({
      ".cm-content .cm-underline": {
        textDecoration: "underline",
        textDecorationColor: "rgba(0, 0, 255, 0.3)",
        cursor: "pointer",
      },
    }),

    // Package link decorations
    EditorView.decorations.of(createDecorations),
  ]

  return {
    tsExtensions,
    setupATA: (onFileReceived?: (code: string, path: string) => void) => {
      const ataConfig: ATABootstrapConfig = {
        projectName: "my-project",
        typescript: ts,
        logger: console,
        fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
          const registryPrefixes = [
            "https://data.jsdelivr.com/v1/package/resolve/npm/@tsci/",
            "https://data.jsdelivr.com/v1/package/npm/@tsci/",
            "https://cdn.jsdelivr.net/npm/@tsci/",
          ]
          if (
            typeof input === "string" &&
            registryPrefixes.some((prefix) => input.startsWith(prefix))
          ) {
            const fullPackageName = input
              .replace(registryPrefixes[0], "")
              .replace(registryPrefixes[1], "")
              .replace(registryPrefixes[2], "")
            const packageName = fullPackageName.split("/")[0].replace(/\./, "/")
            const pathInPackage = fullPackageName.split("/").slice(1).join("/")
            const jsdelivrPath = `${packageName}${pathInPackage ? `/${pathInPackage}` : ""}`
            return fetch(
              `${apiUrl}/snippets/download?jsdelivr_resolve=${input.includes("/resolve/")}&jsdelivr_path=${encodeURIComponent(jsdelivrPath)}`,
            )
          }
          return fetch(input, init)
        },
        delegate: {
          started: () => {
            const manualEditsTypeDeclaration = `
              declare module "*.json" {
                const value: {
                  pcb_placements?: any[],
                  edit_events?: any[],
                  manual_trace_hints?: any[],
                } | undefined;
                export default value;
              }
            `
            env.createFile("manual-edits.d.ts", manualEditsTypeDeclaration)
          },
          receivedFile: (code: string, path: string) => {
            fsMap.set(path, code)
            env.createFile(path, code)
            onFileReceived?.(code, path)
          },
        },
      }

      return setupTypeAcquisition(ataConfig)
    },
  }
}
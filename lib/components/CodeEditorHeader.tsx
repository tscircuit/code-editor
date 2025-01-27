import { useState } from "react"
import { useTscircuitEditor } from "../global-store"
import "../prettier"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

export const CodeEditorHeader = () => {
    // TODO
  const [footprintDialogOpen, setFootprintDialogOpen] = useState(false)

  const { setCurrentFile, getCurrentFile, updateContent, originalFiles } =
    useTscircuitEditor()

  const formatCurrentFile = async () => {
    if (!window.prettier || !window.prettierPlugins) return

    try {
      const currentContent = getCurrentFile()?.currentContent
      const currentFile = getCurrentFile()?.path

      if (currentFile?.endsWith(".json")) {
        try {
          const jsonObj = JSON.parse(currentContent || "")
          const formattedJson = JSON.stringify(jsonObj, null, 2)
          updateContent(currentFile, formattedJson)
        } catch (jsonError) {
          throw new Error("Invalid JSON content")
        }
        return
      }

      const formattedCode = await window.prettier.format(currentContent || "", {
        semi: false,
        parser: "typescript",
        plugins: window.prettierPlugins,
      })

      updateContent(currentFile, formattedCode)
    } catch (error) {
      console.error("Formatting error:", error)
    }
  }

  return (
    <div className="flex items-center gap-2 px-2 border-b border-gray-200 bg-gray-100">
      <div>
        <Select
          value={getCurrentFile()?.path || ""}
          onValueChange={(value) => {
            setCurrentFile(value)
          }}
        >
          <SelectTrigger className="h-7 min-w-[100px] px-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50">
            <SelectValue placeholder="Select file" />
          </SelectTrigger>
          <SelectContent className="min-w-[100px]">
            {Object.keys(originalFiles).map((filename) => (
              <SelectItem
                className="text-sm text-black py-1 hover:bg-gray-50"
                key={filename}
                value={filename}
              >
                <span className="text-xs">{filename}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 px-2 py-1 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              Insert
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFootprintDialogOpen(true)}>
              Chip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => console.log("Import clicked")}
        >
          Import
        </Button>
        <Button size="sm" variant="ghost" onClick={formatCurrentFile}>
          Format
        </Button>
      </div>
    </div>
  )
}

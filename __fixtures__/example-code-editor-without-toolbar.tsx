import { TscircuitCodeEditor } from "../lib/components/TscircuitCodeEditor"
import { useTscircuitEditor } from "../lib/global-store"
import { CodeEditorHeader } from "../lib/components/CodeEditorHeader"

const loadInitialFiles = () => {
  return Promise.resolve({
    "index.tsx": "console.log('Example fixture')",
  })
}

export default {
  "Example Code Editor Without Toolbar": () => {
    const { getCurrentFile } = useTscircuitEditor({
      loadInitialFiles,
    })

    return (
      <div className="p-4 w-screen h-screen">
        <TscircuitCodeEditor />
      </div>
    )
  },
}

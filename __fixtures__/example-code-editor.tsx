import { TscircuitCodeEditor } from "../src/components/TscircuitCodeEditor"
import { useTscircuitEditor } from "../src/global-store"

const loadInitialFiles = () => {
  return Promise.resolve({
    "index.tsx": "console.log('Example fixture')",
    "manual-edits.json": "{}",
  })
}

export default {
  "Example Code Editor": () => {
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

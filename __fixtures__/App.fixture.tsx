import React from "react"
import { TscircuitCodeEditor } from "../src/components/TscircuitCodeEditor"

export default {
  "Basic Editor": () => (
    <div className="p-4 w-screen h-screen">
      <TscircuitCodeEditor
        code="console.log('Hello from Cosmos!')"
        className="h-full w-full border border-gray-200 rounded-md"
      />
    </div>
  ),

  "TypeScript Example": () => (
    <div className="p-4 w-screen h-screen">
      <TscircuitCodeEditor
        code={`
interface Circuit {
  name: string;
  pins: number;
}

const myCircuit: Circuit = {
  name: "Test Circuit",
  pins: 8
};
        `.trim()}
        className="h-full w-full border border-gray-200 rounded-md"
      />
    </div>
  ),
}

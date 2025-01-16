import React, { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { install } from "@twind/core"
import config from "../twind.config"
import { TscircuitCodeEditor } from "./components/TscircuitCodeEditor"

install(config)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div>
      <TscircuitCodeEditor />
    </div>
  </React.StrictMode>,
)

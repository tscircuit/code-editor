import { install } from "@twind/core"
import config from "./twind.config"

// Install Twind
install(config)

export default ({ children }: { children: React.ReactNode }) => {
  return <div className="min-h-screen bg-gray-50 p-4">{children}</div>
}

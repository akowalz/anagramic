import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dev-only font picker overlay; excluded from production builds.
if (import.meta.env.DEV) {
  import("./FontPicker/FontPicker.tsx").then(({ default: FontPicker }) => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    createRoot(container).render(<FontPicker />)
  })
}

export interface Plugin {
  id: string
  name: string
  version: string
  author: string
  description: string
  icon_url?: string
  source_url: string
  wasm_path?: string
  status: "active" | "error" | "inactive"
  message: string
}

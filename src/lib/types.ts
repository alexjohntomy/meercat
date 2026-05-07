export interface FileNode {
  name: string
  path: string
  kind: "file" | "directory"
  children?: FileNode[]
}

export interface Comment {
  id: string
  filePath: string
  startLine: number
  endLine: number
  anchorContent?: {
    firstLine: string
    lastLine: string
  }
  text: string
  createdAt: string
}

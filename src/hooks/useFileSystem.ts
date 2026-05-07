import { useCallback, useRef, useState } from "react"
import type { FileNode } from "@/lib/types"

import { EXCLUDE_DIRS, SUPPORTED_EXTS } from "@/lib/constants"

async function readDirRecursive(
  handle: FileSystemDirectoryHandle,
  rootPath: string
): Promise<FileNode[]> {
  const entries: FileNode[] = []
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind === "directory") {
      if (EXCLUDE_DIRS.has(name)) continue
      const children = await readDirRecursive(
        entry as FileSystemDirectoryHandle,
        `${rootPath}/${name}`
      )
      if (children.length > 0) {
        entries.push({
          name,
          path: `${rootPath}/${name}`,
          kind: "directory",
          children,
        })
      }
    } else {
      const ext = name.split(".").pop()!.toLowerCase()
      if (!SUPPORTED_EXTS.has(ext)) continue
      entries.push({ name, path: `${rootPath}/${name}`, kind: "file" })
    }
  }
  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return entries
}

async function resolveFileHandle(
  rootHandle: FileSystemDirectoryHandle,
  path: string
): Promise<FileSystemFileHandle> {
  const parts = path.replace(/^\//, "").split("/")
  let handle: FileSystemDirectoryHandle | FileSystemFileHandle = rootHandle
  for (let i = 0; i < parts.length - 1; i++) {
    handle = await (handle as FileSystemDirectoryHandle).getDirectoryHandle(
      parts[i]
    )
  }
  return (handle as FileSystemDirectoryHandle).getFileHandle(
    parts[parts.length - 1]
  )
}

export function flattenTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  for (const node of nodes) {
    if (node.kind === "file") result.push(node)
    if (node.children) result.push(...flattenTree(node.children))
  }
  return result
}

export function useFileSystem() {
  const rootHandleRef = useRef<FileSystemDirectoryHandle | null>(null)
  const [tree, setTree] = useState<FileNode[] | null>(null)
  const [projectName, setProjectName] = useState<string>("")
  const [open, setOpen] = useState(false)

  const openProject = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" })
      rootHandleRef.current = handle
      setProjectName(handle.name)
      const files = await readDirRecursive(handle, "")
      setTree(files)
      setOpen(true)
      return handle
    } catch (err) {
      if ((err as DOMException).name !== "AbortError") throw err
      return null
    }
  }, [])

  const loadFromHandle = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      if (
        (await handle.requestPermission({ mode: "readwrite" })) !== "granted"
      ) {
        return false
      }
      rootHandleRef.current = handle
      setProjectName(handle.name)
      const files = await readDirRecursive(handle, "")
      setTree(files)
      setOpen(true)
      return true
    },
    []
  )

  const readFileContent = useCallback(
    async (path: string): Promise<string> => {
      const rootHandle = rootHandleRef.current
      if (!rootHandle) throw new Error("No project open")
      const fileHandle = await resolveFileHandle(rootHandle, path)
      const file = await fileHandle.getFile()
      return await file.text()
    },
    []
  )

  const getRootHandle = useCallback((): FileSystemDirectoryHandle | null => {
    return rootHandleRef.current
  }, [])

  const closeProject = useCallback(() => {
    rootHandleRef.current = null
    setTree(null)
    setProjectName("")
    setOpen(false)
  }, [])

  return {
    tree,
    projectName,
    open,
    openProject,
    loadFromHandle,
    readFileContent,
    getRootHandle,
    closeProject,
  }
}

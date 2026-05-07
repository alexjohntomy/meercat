import { useCallback, useRef, useState } from "react"
import type { Comment } from "@/lib/types"
import { createId, loadComments, saveComments } from "@/lib/comments"

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const rootHandleRef = useRef<FileSystemDirectoryHandle | null>(null)
  const loadedRef = useRef(false)

  const init = useCallback(
    async (rootHandle: FileSystemDirectoryHandle) => {
      rootHandleRef.current = rootHandle
      const existing = await loadComments(rootHandle)
      setComments(existing)
      loadedRef.current = true
    },
    []
  )

  const persist = useCallback(
    async (next: Comment[] | ((prev: Comment[]) => Comment[])) => {
      const updated = await new Promise<Comment[]>((resolve) => {
        setComments((prev) => {
          const result = typeof next === "function" ? next(prev) : next
          resolve(result)
          return result
        })
      })
      if (rootHandleRef.current && loadedRef.current) {
        try {
          await saveComments(rootHandleRef.current, updated)
        } catch (err) {
          console.error("Failed to save comments:", err)
        }
      }
    },
    []
  )

  const addComment = useCallback(
    async (
      filePath: string,
      startLine: number,
      endLine: number,
      text: string,
      anchorContent?: { firstLine: string; lastLine: string }
    ) => {
      const comment: Comment = {
        id: createId(),
        filePath,
        startLine,
        endLine,
        anchorContent,
        text,
        createdAt: new Date().toISOString(),
      }
      await persist((prev) => [...prev, comment])
    },
    [persist]
  )

  const updateComment = useCallback(
    async (id: string, updates: Partial<Pick<Comment, "text" | "endLine">>) => {
      await persist((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        )
      )
    },
    [persist]
  )

  const deleteComment = useCallback(
    async (id: string) => {
      await persist((prev) => prev.filter((c) => c.id !== id))
    },
    [persist]
  )

  const getCommentsForFile = useCallback(
    (filePath: string): Comment[] => {
      return comments
        .filter((c) => c.filePath === filePath)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    },
    [comments]
  )

  return {
    comments,
    init,
    addComment,
    updateComment,
    deleteComment,
    getCommentsForFile,
  }
}

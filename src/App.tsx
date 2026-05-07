import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FolderOpen } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { CodePanel } from "@/components/CodePanel"
import { CommentSidebar } from "@/components/CommentSidebar"
import { CommandPalette } from "@/components/CommandPalette"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { FileTree } from "@/components/FileTree"
import { TabBar } from "@/components/TabBar"
import { useFileSystem } from "@/hooks/useFileSystem"
import { useComments } from "@/hooks/useComments"
import { getRecentNames, loadHandle, saveHandle } from "@/lib/storage"

import { SUPPORTED_EXTS } from "@/lib/constants"

import { fmtErr, getFileName } from "@/lib/utils"

function App() {
  const {
    tree,
    projectName,
    open,
    openProject,
    loadFromHandle,
    readFileContent,
    getRootHandle,
    closeProject,
  } = useFileSystem()

  const {
    comments,
    init,
    addComment,
    updateComment,
    deleteComment,
    getCommentsForFile,
  } = useComments()

  const [tabs, setTabs] = useState<{ path: string; code: string }[]>([])
  const tabsRef = useRef(tabs)
  useEffect(() => { tabsRef.current = tabs }, [tabs])
  const [activePath, setActivePath] = useState<string | null>(null)

  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [selectedRange, setSelectedRange] = useState<{
    start: number
    end: number
  } | null>(null)
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)

  const [recentNames, setRecentNames] = useState<string[]>(() => getRecentNames())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    closeProject()
    setTabs([])
    setActivePath(null)
    setSelectedLine(null)
    setSelectedRange(null)
    setHighlightedCommentId(null)
    setErrorMessage(null)
  }, [closeProject])

  useEffect(() => {
    if (open) {
      const handle = getRootHandle()
      if (handle) {
        init(handle).catch((err) => {
          setErrorMessage(fmtErr(err))
        })
      }
    }
  }, [open, init, getRootHandle])

  useEffect(() => {
    setSelectedLine(null)
    setSelectedRange(null)
    setHighlightedCommentId(null)
    setErrorMessage(null)
  }, [activePath])

  const activeTab = tabs.find((t) => t.path === activePath)
  const code = activeTab?.code ?? ""
  const currentFile = activePath

  const fileComments = useMemo(() => {
    if (!currentFile) return []
    return getCommentsForFile(currentFile)
  }, [currentFile, getCommentsForFile])

  const commentCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of comments) {
      map.set(c.filePath, (map.get(c.filePath) || 0) + 1)
    }
    return map
  }, [comments])

  const commentedFiles = useMemo(() => {
    return Array.from(commentCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
  }, [commentCounts])

  const tabItems = useMemo(
    () =>
      tabs.map((t) => ({
        path: t.path,
        name: getFileName(t.path),
      })),
    [tabs]
  )

  const handleOpenProject = useCallback(async () => {
    const handle = await openProject()
    if (handle) {
      await saveHandle(handle.name, handle)
      setRecentNames(getRecentNames())
    }
  }, [openProject])

  const handleRecentProject = useCallback(
    async (name: string) => {
      const handle = await loadHandle(name)
      if (handle) {
        const ok = await loadFromHandle(handle)
        if (ok) {
          setRecentNames(getRecentNames())
        }
      }
    },
    [loadFromHandle]
  )

  const handleFileSelect = useCallback(
    async (path: string) => {
      const ext = path.split(".").pop()!.toLowerCase()
      if (!SUPPORTED_EXTS.has(ext)) {
        setErrorMessage(`Unsupported file format (.${ext})`)
        return
      }

      const existing = tabs.find((t) => t.path === path)
      if (existing) {
        setActivePath(path)
        return
      }
      try {
        const content = await readFileContent(path)
        setTabs((prev) => [...prev, { path, code: content }])
        setActivePath(path)
      } catch {
        setErrorMessage(`Failed to open file: ${path}`)
      }
    },
    [tabs, readFileContent]
  )

  const handleCloseTab = useCallback(
    (path: string) => {
      const idx = tabsRef.current.findIndex((t) => t.path === path)
      setTabs((prev) => prev.filter((t) => t.path !== path))
      if (path === activePath) {
        const remaining = tabsRef.current.filter((t) => t.path !== path)
        if (remaining.length > 0) {
          const newIdx = Math.min(idx, remaining.length - 1)
          setActivePath(remaining[newIdx].path)
        } else {
          setActivePath(null)
        }
      }
    },
    [activePath]
  )

  const handleLineClick = useCallback((line: number) => {
    setSelectedRange(null)
    setSelectedLine(line)
  }, [])

  const handleLineShiftClick = useCallback((line: number) => {
    if (selectedLine !== null) {
      const start = Math.min(selectedLine, line)
      const end = Math.max(selectedLine, line)
      setSelectedRange({ start, end })
    }
  }, [selectedLine])

  const handleAddComment = useCallback(
    async (text: string) => {
      if (!currentFile) return
      const lines = code.split("\n")
      try {
        if (selectedRange) {
          const anchorContent = {
            firstLine: lines[selectedRange.start - 1] ?? "",
            lastLine: lines[selectedRange.end - 1] ?? "",
          }
          await addComment(currentFile, selectedRange.start, selectedRange.end, text, anchorContent)
          setSelectedRange(null)
          setSelectedLine(null)
        } else if (selectedLine) {
          const anchorContent = {
            firstLine: lines[selectedLine - 1] ?? "",
            lastLine: lines[selectedLine - 1] ?? "",
          }
          await addComment(currentFile, selectedLine, selectedLine, text, anchorContent)
          setSelectedLine(null)
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to save comment")
      }
    },
    [currentFile, selectedLine, selectedRange, addComment, code]
  )

  const handleUpdateComment = useCallback(
    async (id: string, text: string) => {
      try {
        await updateComment(id, { text })
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to update comment")
      }
    },
    [updateComment]
  )

  const handleDeleteComment = useCallback(
    async (id: string) => {
      try {
        await deleteComment(id)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to delete comment")
      }
    },
    [deleteComment]
  )

  const handleTextSelect = useCallback(
    (start: number | null, end: number | null) => {
      if (start !== null && end !== null) {
        setSelectedLine(null)
        setSelectedRange({ start, end })
      }
    },
    []
  )

  const handleJumpToLine = useCallback((line: number) => {
    setHighlightedCommentId(null)
    setSelectedLine(line)
    setSelectedRange(null)
  }, [])

  const handleCancelSelection = useCallback(() => {
    setSelectedLine(null)
    setSelectedRange(null)
  }, [])

  useEffect(() => {
    if (selectedLine === null && selectedRange === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancelSelection()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [selectedLine, selectedRange, handleCancelSelection])

  if (!open) {
    return (
      <div className="flex h-svh flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <img src="/meercat-wordmark.svg" className="h-12 w-auto" alt="Meercat" />

          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Browse your code and leave review comments
            </p>

            <Button
              onClick={handleOpenProject}
              size="lg"
              className="gap-2"
            >
              <FolderOpen size={16} weight="bold" />
              Open Project
            </Button>

            <p className="text-[10px] text-muted-foreground">
              Works in Chromium-based browsers
            </p>
          </div>

          {recentNames.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              <Separator className="w-32" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Recent
              </span>
              <div className="flex flex-col gap-1.5">
                {recentNames.map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecentProject(name)}
                    className="w-48 justify-start gap-2"
                  >
                    <FolderOpen size={12} />
                    <span className="truncate">{name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      <CommandPalette tree={tree} onOpenFile={handleFileSelect} />

      <header className="flex h-10 shrink-0 items-center px-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="opacity-80 transition-opacity hover:opacity-100"
            aria-label="Back to start"
          >
          <img src="/meercat-wordmark.svg" className="h-5 w-auto" alt="Meercat" />
          </button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground">{projectName}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">⌘K to search</span>
          <Button
            variant="outline"
            size="xs"
            onClick={handleOpenProject}
            className="gap-1"
          >
            <FolderOpen size={12} />
            Open
          </Button>
        </div>
      </header>

      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1 overflow-hidden"
      >
        <ResizablePanel
          defaultSize="18%"
          minSize="12%"
          maxSize="60%"
          className="bg-sidebar"
        >
            <div className="flex h-full flex-col border-t border-sidebar">
            <div className="flex h-8 shrink-0 items-center border-b border-sidebar-accent px-3">
              <span className="text-xs font-medium text-sidebar-foreground">
                Files
              </span>
            </div>
            <FileTree
              tree={tree}
              currentFile={currentFile}
              commentCounts={commentCounts}
              onFileSelect={handleFileSelect}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize="58%" minSize="25%">
          <div className="flex h-full flex-col border-t border-border">
            <TabBar
              tabs={tabItems}
              activePath={activePath}
              onSelect={setActivePath}
              onClose={handleCloseTab}
            />
            {errorMessage && (
              <div className="flex items-center justify-between gap-2 border-b border-destructive/20 bg-destructive/8 px-3 py-1.5">
                <p className="truncate text-[11px] text-destructive">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="shrink-0 text-[10px] text-destructive/70 underline hover:text-destructive"
                >
                  Dismiss
                </button>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <ErrorBoundary key={currentFile} filePath={currentFile ?? undefined}>
                <CodePanel
                  code={code}
                  currentFile={currentFile}
                  fileComments={fileComments}
                  commentedFiles={commentedFiles}
                  selectedLine={selectedLine}
                  selectedRange={selectedRange}
                  highlightedCommentId={highlightedCommentId}
                  onLineClick={handleLineClick}
                  onLineShiftClick={handleLineShiftClick}
                  onTextSelect={handleTextSelect}
                  onOpenFile={handleFileSelect}
                />
              </ErrorBoundary>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize="24%" minSize="16%" maxSize="55%">
          <CommentSidebar
            comments={fileComments}
            currentFile={currentFile}
            selectedLine={selectedLine}
            selectedRange={selectedRange}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            onJumpToLine={handleJumpToLine}
            onCancelSelection={handleCancelSelection}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default App

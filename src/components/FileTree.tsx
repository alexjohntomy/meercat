import { CaretRight, FileCode, Folder, FolderOpen } from "@phosphor-icons/react"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FileNode } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FileTreeProps {
  tree: FileNode[] | null
  currentFile: string | null
  commentCounts: Map<string, number>
  onFileSelect: (path: string) => void
}

function FileTreeNode({
  node,
  depth,
  currentFile,
  commentCounts,
  onFileSelect,
}: {
  node: FileNode
  depth: number
  currentFile: string | null
  commentCounts: Map<string, number>
  onFileSelect: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isDir = node.kind === "directory"
  const isActive = node.path === currentFile
  const count = commentCounts.get(node.path) ?? 0

  if (isDir) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex w-full items-center gap-1 px-2 py-1 text-left text-xs transition-colors hover:bg-sidebar-accent",
            "text-sidebar-foreground/80"
          )}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          <CaretRight
            size={12}
            className={cn(
              "shrink-0 transition-transform",
              expanded && "rotate-90"
            )}
          />
          {expanded ? (
            <FolderOpen size={14} weight="fill" className="shrink-0 text-sidebar-foreground/60" />
          ) : (
            <Folder size={14} weight="fill" className="shrink-0 text-sidebar-foreground/60" />
          )}
          <span className="truncate">{node.name}</span>
          {count > 0 && (
            <span className="ml-auto mr-1 flex size-4 items-center justify-center rounded-full bg-sidebar-primary text-[10px] leading-none text-sidebar-primary-foreground">
              {count}
            </span>
          )}
        </button>
        {expanded &&
          node.children?.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              currentFile={currentFile}
              commentCounts={commentCounts}
              onFileSelect={onFileSelect}
            />
          ))}
      </div>
    )
  }

  return (
    <button
      onClick={() => onFileSelect(node.path)}
      className={cn(
        "flex w-full items-center gap-1.5 px-2 py-1 text-left text-xs transition-colors",
        "text-sidebar-foreground/80 hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
      style={{ paddingLeft: `${22 + depth * 14}px` }}
    >
      <FileCode size={14} className="shrink-0 text-sidebar-foreground/50" />
      <span className="truncate">{node.name}</span>
      {count > 0 && (
        <span className="ml-auto mr-1 flex size-4 items-center justify-center rounded-full bg-sidebar-primary text-[10px] leading-none text-sidebar-primary-foreground">
          {count}
        </span>
      )}
    </button>
  )
}

export function FileTree({
  tree,
  currentFile,
  commentCounts,
  onFileSelect,
}: FileTreeProps) {
  if (!tree || tree.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-sidebar-foreground/50">
        No files found
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="py-2">
        {tree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            depth={0}
            currentFile={currentFile}
            commentCounts={commentCounts}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

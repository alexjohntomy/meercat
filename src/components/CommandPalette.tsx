import { useEffect, useMemo, useState } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { FileNode } from "@/lib/types"
import { flattenTree } from "@/hooks/useFileSystem"
import { getFileName } from "@/lib/utils"

interface CommandPaletteProps {
  tree: FileNode[] | null
  onOpenFile: (path: string) => void
}

function getDir(path: string): string {
  const parts = path.split("/")
  return parts.length > 1 ? parts.slice(0, -1).join("/") : ""
}

export function CommandPalette({ tree, onOpenFile }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const allFiles = useMemo(() => (tree ? flattenTree(tree) : []), [tree])

  const handleSelect = (path: string) => {
    onOpenFile(path)
    setOpen(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      className="sm:max-w-lg"
    >
      <CommandInput placeholder="Search files..." />
      <CommandList>
        <CommandEmpty>No files found</CommandEmpty>
        <CommandGroup>
          {allFiles.map((file) => (
            <CommandItem
              key={file.path}
              value={file.path}
              onSelect={() => handleSelect(file.path)}
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-medium text-foreground">
                  {getFileName(file.path)}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {getDir(file.path)}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

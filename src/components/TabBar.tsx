import { X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface Tab {
  path: string
  name: string
}

interface TabBarProps {
  tabs: Tab[]
  activePath: string | null
  onSelect: (path: string) => void
  onClose: (path: string) => void
}

export function TabBar({ tabs, activePath, onSelect, onClose }: TabBarProps) {
  if (tabs.length === 0) return null

  return (
    <div className="flex h-8 shrink-0 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.path === activePath
        return (
          <div
            key={tab.path}
            title={tab.path}
            role="button"
            onClick={() => onSelect(tab.path)}
            className={cn(
              "group relative flex cursor-pointer items-center gap-1 border-r border-border px-3 text-xs transition-colors",
              isActive
                ? "bg-background text-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="max-w-[120px] truncate">{tab.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.path)
              }}
              className={cn(
                "ml-1 flex size-4 shrink-0 items-center justify-center rounded-sm opacity-0 transition-opacity",
                "hover:bg-muted-foreground/20 group-hover:opacity-100",
                isActive && "opacity-50"
              )}
            >
              <X size={10} weight="bold" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

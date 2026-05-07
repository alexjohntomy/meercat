import { Trash, Plus } from "@phosphor-icons/react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { Comment } from "@/lib/types"
import { parseTag } from "@/lib/tags"

interface CommentSidebarProps {
  comments: Comment[]
  currentFile: string | null
  selectedLine: number | null
  selectedRange: { start: number; end: number } | null
  onAddComment: (text: string) => void
  onUpdateComment: (id: string, text: string) => void
  onDeleteComment: (id: string) => void
  onJumpToLine: (line: number) => void
  onCancelSelection: () => void
}

function CommentCard({
  comment,
  onUpdate,
  onDelete,
  onJumpToLine,
}: {
  comment: Comment
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onJumpToLine: (line: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const { tag, clean } = parseTag(comment.text)

  const handleSave = () => {
    onUpdate(comment.id, draft)
    setEditing(false)
  }

  const lineLabel =
    comment.startLine === comment.endLine
      ? `Line ${comment.startLine}`
      : `Lines ${comment.startLine}–${comment.endLine}`

  return (
    <div className="group rounded-sm border border-border bg-card p-2">
      <div className="mb-1 flex items-center justify-between">
        <button
          onClick={() => onJumpToLine(comment.startLine)}
          className="text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          {lineLabel}
        </button>
        <button
          onClick={() => onDelete(comment.id)}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash size={12} className="text-muted-foreground hover:text-destructive" />
        </button>
      </div>
      {editing ? (
        <div className="space-y-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[60px] text-xs"
          />
          <div className="flex gap-1">
            <Button size="xs" onClick={handleSave}>
              Save
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setDraft(comment.text)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-text space-y-1"
        >
          {tag && (
            <Badge
              variant="outline"
              className="text-[10px] font-normal"
              style={{
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              {tag.label}
            </Badge>
          )}
          <p className="text-xs leading-relaxed text-foreground">{clean}</p>
        </div>
      )}
    </div>
  )
}

export function CommentSidebar({
  comments,
  currentFile,
  selectedLine,
  selectedRange,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onJumpToLine,
  onCancelSelection,
}: CommentSidebarProps) {
  const [draft, setDraft] = useState("")

  const handleAdd = () => {
    if (!draft.trim()) return
    onAddComment(draft.trim())
    setDraft("")
  }

  const showCreateBtn = selectedLine !== null || selectedRange !== null

  return (
    <div className="flex h-full flex-col border-t border-border">
      <div className="flex h-8 shrink-0 items-center border-b border-border px-3">
        <span className="text-xs font-medium text-foreground">
          Comments
          {currentFile && (
            <span className="ml-1 text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </span>
      </div>

      <ScrollArea className="flex-1">
        {!currentFile ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Select a file to view comments
          </div>
        ) : comments.length === 0 && !showCreateBtn ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Click a line number in the code to add a comment
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {showCreateBtn && (
              <div className="border border-dashed border-primary/40 p-2">
                <p className="mb-1 text-[10px] text-muted-foreground">
                  {selectedRange
                    ? `Lines ${selectedRange.start}–${selectedRange.end}`
                    : `Line ${selectedLine}`}
                </p>
                <div className="space-y-1">
                  <Textarea
                    placeholder="Write a comment..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && !draft.trim()) {
                        onCancelSelection()
                        return
                      }
                      if (e.metaKey && e.key === "Enter") {
                        e.preventDefault()
                        handleAdd()
                      }
                    }}
                    className="min-h-[60px] text-xs"
                  />
                  <div className="flex gap-1">
                    <Button size="xs" onClick={handleAdd}>
                      <Plus size={12} weight="bold" />
                      Add
                    </Button>
                    <span className="text-[10px] text-muted-foreground self-center">
                      ⌘⏎
                    </span>
                  </div>
                </div>
              </div>
            )}

            {comments.length > 0 && showCreateBtn && (
              <Separator className="my-1" />
            )}

            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onUpdate={onUpdateComment}
                onDelete={onDeleteComment}
                onJumpToLine={onJumpToLine}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

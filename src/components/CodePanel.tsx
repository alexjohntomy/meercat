import { useEffect, useRef, useState } from "react"
import { EditorView, gutter, GutterMarker, lineNumbers, Decoration } from "@codemirror/view"
import { Compartment, EditorState, StateEffect, StateField } from "@codemirror/state"
import type { Range } from "@codemirror/state"
import type { DecorationSet } from "@codemirror/view"
import { languages } from "@codemirror/language-data"
import { javascript } from "@codemirror/lang-javascript"
import { FileCode, Plus } from "@phosphor-icons/react"
import type { Comment } from "@/lib/types"
import { meercatTheme } from "@/lib/meercatTheme"

interface CodePanelProps {
  code: string
  currentFile: string | null
  fileComments: Comment[]
  commentedFiles: { path: string; count: number }[]
  selectedLine: number | null
  selectedRange: { start: number; end: number } | null
  highlightedCommentId: string | null
  onLineClick: (line: number) => void
  onLineShiftClick: (line: number) => void
  onTextSelect: (start: number | null, end: number | null) => void
  onOpenFile: (path: string) => void
}

class CommentDot extends GutterMarker {
  toDOM() {
    const el = document.createElement("div")
    el.className = "cm-comment-dot"
    return el
  }
}

class Spacer extends GutterMarker {
  toDOM() {
    const el = document.createElement("div")
    el.style.width = "14px"
    return el
  }
}

const setCommentedLines = StateEffect.define<Set<number>>()
const setHighlightLines = StateEffect.define<Set<number>>()

const commentedField = StateField.define<Set<number>>({
  create: () => new Set(),
  update: (value, tr) => {
    for (const e of tr.effects) {
      if (e.is(setCommentedLines)) return e.value
    }
    return value
  },
  compare: (a, b) => {
    if (a.size !== b.size) return false
    for (const v of a) if (!b.has(v)) return false
    return true
  },
})

const highlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (value, tr) => {
    for (const e of tr.effects) {
      if (e.is(setHighlightLines)) {
        const decorations: Array<Range<Decoration>> = []
        for (const line of e.value) {
          const docLine = tr.state.doc.line(line)
          decorations.push(
            Decoration.line({
              class: "cm-highlighted-line",
            }).range(docLine.from)
          )
        }
        return Decoration.set(decorations.sort((a, b) => a.from - b.from))
      }
    }
    return value.map(tr.changes)
  },
  provide: (f) => EditorView.decorations.from(f),
})

const langCompartment = new Compartment()

function getLanguageExtension(filename: string) {
  const desc = languages.find(lang =>
    lang.name === filename || lang.extensions.some(ext => filename.endsWith("." + ext))
  )
  if (desc) return desc.load()
  return javascript({ typescript: true })
}

export function CodePanel({
  code,
  currentFile,
  fileComments,
  commentedFiles,
  selectedLine,
  selectedRange,
  highlightedCommentId,
  onLineClick,
  onLineShiftClick,
  onTextSelect,
  onOpenFile,
}: CodePanelProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onLineClickRef = useRef(onLineClick)
  const onLineShiftClickRef = useRef(onLineShiftClick)
  const onTextSelectRef = useRef(onTextSelect)
  useEffect(() => {
    onLineClickRef.current = onLineClick
    onLineShiftClickRef.current = onLineShiftClick
    onTextSelectRef.current = onTextSelect
  }, [onLineClick, onLineShiftClick, onTextSelect])

  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null)
  const selectionLinesRef = useRef<{ start: number; end: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!containerRef.current || !code) return

    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }

    const dotGutter = gutter({
      class: "cm-dot-gutter",
      lineMarker: (v, line) => {
        const commented = v.state.field(commentedField)
        const docLine = v.state.doc.lineAt(line.from)
        return commented.has(docLine.number) ? new CommentDot() : null
      },
      initialSpacer: () => new Spacer(),
    })

    const state = EditorState.create({
      doc: code,
      extensions: [
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        lineNumbers({
          formatNumber: (n, state) => {
            const w = String(state.doc.lines).length
            return String(n).padStart(w, "0")
          },
        }),
        commentedField,
        highlightField,
        dotGutter,
        meercatTheme,
        EditorView.updateListener.of((update) => {
          if (!update.selectionSet) return
          const sel = update.state.selection.main
          if (sel.empty) {
            if (selectionLinesRef.current !== null) {
              selectionLinesRef.current = null
              setSelectionCoords(null)
            }
          } else {
            const fromLine = update.state.doc.lineAt(sel.from).number
            const toLine = update.state.doc.lineAt(sel.to).number
            selectionLinesRef.current = { start: fromLine, end: toLine }

            const coords = update.view.coordsAtPos(sel.from)
            if (coords && outerRef.current) {
              const r = outerRef.current.getBoundingClientRect()
              setSelectionCoords({
                x: Math.max(coords.left - r.left, 4),
                y: coords.top - r.top - 28,
              })
            }
          }
        }),
        EditorView.theme({
          "&": {
            fontSize: "13px",
            fontFamily: `ui-monospace, "SF Mono", Consolas, monospace`,
            backgroundColor: "transparent",
            height: "100%",
          },
          ".cm-scroller": {
            fontFamily: `ui-monospace, "SF Mono", Consolas, monospace`,
            overflow: "auto",
          },
          ".cm-content": {
            padding: "8px 0",
            caretColor: "transparent",
          },
          ".cm-line": {
            padding: "0 8px",
          },
          ".cm-lineNumbers": {
            minWidth: "24px",
            userSelect: "none",
          },
          ".cm-lineNumbers .cm-gutterElement": {
            cursor: "pointer",
            padding: "0 4px 0 6px",
            fontFamily: `ui-monospace, "SF Mono", Consolas, monospace`,
            fontSize: "11px",
            color: "#65442e",
          },
          ".cm-dot-gutter": {
            width: "14px !important",
            cursor: "pointer",
          },
          ".cm-dot-gutter .cm-gutterElement": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "14px",
            padding: 0,
          },
          ".cm-comment-dot": {
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: "#f48c06",
          },
          ".cm-highlighted-line": {
            backgroundColor: "rgba(244, 140, 6, 0.1) !important",
          },
          ".cm-selectionBackground": {
            backgroundColor: "rgba(127, 85, 57, 0.15) !important",
          },
          "&.cm-focused": {
            outline: "none",
          },
          ".cm-gutters": {
            borderRight: "1px solid #d7b9a5",
            backgroundColor: "#fbf9f6",
          },
        }),
        langCompartment.of(javascript({ typescript: true })),
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    const handleGutterClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const inGutter =
        target.closest(".cm-dot-gutter") ||
        target.closest(".cm-lineNumbers")
      if (!inGutter) return

      const pos = view.posAtCoords({ x: e.clientX, y: e.clientY })
      if (pos === null) return
      const line = view.state.doc.lineAt(pos)
      const lineNumber = line.number

      if (e.shiftKey) {
        onLineShiftClickRef.current(lineNumber)
      } else {
        onLineClickRef.current(lineNumber)
      }
    }

    view.dom.addEventListener("mousedown", handleGutterClick)

    const handleScroll = () => {
      const sel = view.state.selection.main
      if (!sel.empty && outerRef.current) {
        const coords = view.coordsAtPos(sel.from)
        if (coords) {
          const r = outerRef.current.getBoundingClientRect()
          if (buttonRef.current) {
            buttonRef.current.style.top = `${coords.top - r.top - 28}px`
            buttonRef.current.style.left = `${Math.max(coords.left - r.left, 4)}px`
          }
        } else {
          setSelectionCoords(null)
        }
      }
    }
    view.scrollDOM.addEventListener("scroll", handleScroll)

    return () => {
      view.dom.removeEventListener("mousedown", handleGutterClick)
      view.scrollDOM.removeEventListener("scroll", handleScroll)
      view.destroy()
      viewRef.current = null
    }
  }, [code, currentFile])

  useEffect(() => {
    if (!viewRef.current || !currentFile) return
    const lang = getLanguageExtension(currentFile)
    if (lang instanceof Promise) {
      lang.then((ext) => {
        viewRef.current?.dispatch({ effects: langCompartment.reconfigure(ext) })
      })
    } else {
      viewRef.current.dispatch({ effects: langCompartment.reconfigure(lang) })
    }
  }, [currentFile])

  useEffect(() => {
    if (!viewRef.current) return
    const lines = new Set<number>()
    for (const c of fileComments) {
      for (let i = c.startLine; i <= c.endLine; i++) lines.add(i)
    }
    viewRef.current.dispatch({
      effects: setCommentedLines.of(lines),
    })
  }, [fileComments])

  useEffect(() => {
    if (!viewRef.current) return
    const lines = new Set<number>()

    for (const c of fileComments) {
      for (let i = c.startLine; i <= c.endLine; i++) lines.add(i)
    }

    if (selectedRange) {
      for (let i = selectedRange.start; i <= selectedRange.end; i++) lines.add(i)
    } else if (selectedLine) {
      lines.add(selectedLine)
    }
    if (highlightedCommentId) {
      const comment = fileComments.find((c) => c.id === highlightedCommentId)
      if (comment) {
        for (let i = comment.startLine; i <= comment.endLine; i++) lines.add(i)
      }
    }
    viewRef.current.dispatch({
      effects: setHighlightLines.of(lines),
    })
  }, [selectedLine, selectedRange, highlightedCommentId, fileComments])

  if (!currentFile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground">
            Select a file from the sidebar
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            or press ⌘K to search
          </p>
        </div>
        {commentedFiles.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
              Jump to commented files
            </span>
            <div className="flex flex-col gap-1">
              {commentedFiles.map((f) => (
                <button
                  key={f.path}
                  onClick={() => onOpenFile(f.path)}
                  className="flex items-center gap-2 rounded px-3 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <FileCode size={12} className="shrink-0" />
                  <span className="truncate max-w-[220px]">{f.path}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground/50">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!code) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div ref={outerRef} className="relative h-full">
      <div ref={containerRef} className="h-full overflow-hidden" />
      {selectionCoords && (
        <button
          ref={buttonRef}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={() => {
            const s = selectionLinesRef.current
            if (s) onTextSelect(s.start, s.end)
            setSelectionCoords(null)
          }}
          style={{
            position: "absolute",
            top: selectionCoords.y,
            left: selectionCoords.x,
            zIndex: 50,
          }}
          className="flex size-5 items-center justify-center bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          <Plus size={12} weight="bold" />
        </button>
      )}
    </div>
  )
}

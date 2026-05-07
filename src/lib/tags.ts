export interface TagDef {
  label: string
  color: string
}

export const TAG_DEFS: Record<string, TagDef> = {
  review: { label: "review", color: "#f48c06" },
  question: { label: "question", color: "#606c38" },
  bug: { label: "bug", color: "#d00000" },
  hack: { label: "hack", color: "#e85d04" },
  todo: { label: "todo", color: "#ffba08" },
  idea: { label: "idea", color: "#7f5539" },
}

const TAG_PATTERN = /^\[(\w+)]/

export function parseTag(text: string): {
  tag: TagDef | null
  clean: string
} {
  const match = text.trim().match(TAG_PATTERN)
  if (match) {
    const key = match[1].toLowerCase()
    const def = TAG_DEFS[key]
    if (def) {
      return { tag: def, clean: text.trim().slice(match[0].length).trim() }
    }
  }
  return { tag: null, clean: text.trim() }
}

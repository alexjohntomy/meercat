import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags } from "@lezer/highlight"

const meercatHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#e85d04" },
  { tag: tags.string, color: "#606c38" },
  { tag: tags.number, color: "#f48c06" },
  { tag: tags.comment, color: "#65442e", fontStyle: "italic" },
  { tag: tags.typeName, color: "#7f5539" },
  { tag: tags.variableName, color: "#272b1e" },
  { tag: tags.operator, color: "#83552d" },
  { tag: tags.punctuation, color: "#65442e" },
  { tag: tags.tagName, color: "#faa307" },
  { tag: tags.attributeName, color: "#7f5539" },
  { tag: tags.attributeValue, color: "#606c38" },
  { tag: tags.propertyName, color: "#83552d" },
  { tag: tags.bool, color: "#f48c06" },
  { tag: tags.moduleKeyword, color: "#7f5539" },
  { tag: tags.controlKeyword, color: "#e85d04" },
  { tag: tags.definitionKeyword, color: "#e85d04" },
  { tag: tags.modifier, color: "#e85d04" },
  { tag: tags.meta, color: "#65442e" },
  { tag: tags.invalid, color: "#9d0208" },
  { tag: tags.link, color: "#606c38", textDecoration: "underline" },
  { tag: tags.heading, color: "#7f5539", fontWeight: "bold" },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.quote, color: "#65442e" },
  { tag: tags.separator, color: "#65442e" },
  { tag: tags.inserted, color: "#606c38" },
  { tag: tags.deleted, color: "#9d0208" },
  { tag: tags.changed, color: "#f48c06" },
])

export const meercatTheme = syntaxHighlighting(meercatHighlightStyle, {
  fallback: true,
})

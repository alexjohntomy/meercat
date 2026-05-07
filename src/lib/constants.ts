export const SUPPORTED_EXTS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "mts", "cts",
  "json", "css", "scss", "less", "html", "htm", "md", "sql",
  "vue", "svelte", "yaml", "yml", "toml",
])

export const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "target",
  ".cache",
  ".turbo",
  "coverage",
  ".nyc_output",
])

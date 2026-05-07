<h1 align="center">
  <img src="https://raw.githubusercontent.com/alexjohntomy/meercat/main/public/meercat-wordmark.svg" alt="Meercat Wordmark" width="200">
</h1>

I wanted to do a thorough review of a codebase recently and wanted a Google Docs style inline-comment experience. But all the tools I saw were built around PRs and diffs, which doesn't really serve the "sit down and read through an entire codebase carefully" use case. The target usecase is basically stuff like your own project after a long build sprint, a friend asking you to do a review of their open source thing, or just AI-written code that's piled up without being properly reviewed. Of course, small focused PRs are the thing to aspire to, but I think this kind of review tool can be helpful for more comprehensive reviews between major versions (and ideally you should definitely make focused PRs based on your comments). I think this might also make sense as a way to leave comments for coding agents (or vice versa), instead of referencing single blocks at a time. Built almost entirely with OpenCode's Big Pickle model, with a micropass by Sonnet 4.6 and Gemini 3 Flash.

<h1 align="center">
  <img src="https://raw.githubusercontent.com/alexjohntomy/meercat/main/public/screenshot.png" alt="Meercat screenshot" width="800">
</h1>

## Features

- **File tree** — browse project files with a sidebar tree view
- **Code viewer** — syntax-highlighted code display for multiple languages via CodeMirror
- **Line-level comments** — select lines or ranges and add review comments
- **Tab management** — open multiple files and switch between them
- **Comment tags** — prefix comments with `[bug]`, `[todo]`, `[idea]`, etc. to add a colored label
- **Command palette** — quick file search with `Cmd+K`
- **Responsive layout** — resizable panels for file tree, code, and comments

## Browser Support

Meercat uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) to read your project files and persist comments directly into your project folder — no server needed. This API is currently only supported in Chromium-based browsers (Chrome, Edge, Helium, Dia, etc.).

## Comment Storage

Comments are saved to a `.review-notes/comments.json` file inside your project folder. You can commit it, share it, or delete it.

```json
[
  {
    "id": "1746009600000-abc123",
    "filePath": "src/App.tsx",
    "startLine": 42,
    "endLine": 44,
    "anchorContent": {
      "firstLine": "  const handleAddComment = useCallback(",
      "lastLine": "    [currentFile, selectedLine, selectedRange, addComment, code]"
    },
    "text": "[bug] closes over stale code",
    "createdAt": "2026-05-07T10:00:00.000Z"
  }
]
```

`anchorContent` captures the first and last lines of the selection and is intended as the base for comment re-anchoring after edits in a future version.

## Stack

- React, Vite, shadcn/ui
- CodeMirror 6 with multi-language support
- Tailwind CSS 4 via `@tailwindcss/vite`
- `react-resizable-panels` for panel layouts
- `@phosphor-icons/react` for icons

## Getting Started

```bash
pnpm install
pnpm dev
```

Build for production:

```bash
pnpm build
```

## Contributing

Want to contribute? Open an issue, fork the repo, create a branch for your fix or feature, commit your changes, and open a pull request. Feature ideas are welcome in the issues panel too.

## License

MIT — see [LICENSE](LICENSE).

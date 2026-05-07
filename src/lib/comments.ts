import type { Comment } from "@/lib/types"
import { fmtErr } from "@/lib/utils"

const COMMENTS_DIR = ".review-notes"
const COMMENTS_FILE = "comments.json"

export function createId(): string {
  return crypto.randomUUID()
}

export async function loadComments(
  rootHandle: FileSystemDirectoryHandle
): Promise<Comment[]> {
  try {
    const dirHandle = await rootHandle.getDirectoryHandle(COMMENTS_DIR)
    const fileHandle = await dirHandle.getFileHandle(COMMENTS_FILE)
    const file = await fileHandle.getFile()
    const text = await file.text()
    return JSON.parse(text) as Comment[]
  } catch (err) {
    // NotFoundError is expected on first open — no comments file yet
    if (err instanceof DOMException && err.name === "NotFoundError") return []
    throw new Error(`Failed to load comments: ${fmtErr(err)}`, { cause: err })
  }
}

export async function saveComments(
  rootHandle: FileSystemDirectoryHandle,
  comments: Comment[]
): Promise<void> {
  let dirHandle: FileSystemDirectoryHandle
  try {
    dirHandle = await rootHandle.getDirectoryHandle(COMMENTS_DIR)
  } catch {
    dirHandle = await rootHandle.getDirectoryHandle(COMMENTS_DIR, {
      create: true,
    })
  }
  try {
    const fileHandle = await dirHandle.getFileHandle(COMMENTS_FILE, {
      create: true,
    })
    const writable = await fileHandle.createWritable()
    await writable.write(JSON.stringify(comments, null, 2))
    await writable.close()
  } catch (err) {
    throw new Error(`Failed to save comments: ${fmtErr(err)}`, { cause: err })
  }
}

const DB_NAME = "meercat-recent"
const STORE_NAME = "handles"
const LS_NAMES_KEY = "meercat-recent-names"

function openDB(): Promise<IDBDatabase | null> {
  if (!window.indexedDB) return Promise.resolve(null)
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (db) db.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
}

export async function saveHandle(
  name: string,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDB()
  if (db) {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put(handle, name)
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // IndexedDB unavailable — recent list degrades gracefully
    }
  }
  const names = getRecentNames().filter((n) => n !== name)
  names.unshift(name)
  if (names.length > 5) names.pop()
  try {
    localStorage.setItem(LS_NAMES_KEY, JSON.stringify(names))
  } catch {
    // localStorage may be full or disabled
  }
}

export async function loadHandle(
  name: string
): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB()
  if (!db) return null
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).get(name)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => resolve(null)
  })
}

export function getRecentNames(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_NAMES_KEY) || "[]")
  } catch {
    return []
  }
}

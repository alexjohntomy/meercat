/// <reference types="vite/client" />

declare module "@fontsource-variable/geist" {}
declare module "@fontsource-variable/space-grotesk" {}

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
  name: string
  requestPermission(descriptor: { mode: "read" | "readwrite" }): Promise<"granted" | "denied">
}

interface FileSystemFileHandle {
  getFile(): Promise<File>
  name: string
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | Blob | ArrayBuffer): Promise<void>
  close(): Promise<void>
}

interface Window {
  showDirectoryPicker(options?: { mode?: "read" | "readwrite" }): Promise<FileSystemDirectoryHandle>
}

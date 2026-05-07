import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtErr(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function getFileName(path: string): string {
  return path.split("/").pop()!
}

/**
 * Convert a file system path to a proper file:// URL
 * Handles Windows backslash paths (C:\Users\...) correctly
 */
export function pathToFileUrl(filePath: string): string {
  if (!filePath) return ''
  const normalizedPath = filePath.replace(/\\/g, '/')
  // Unix paths start with /, Windows paths start with drive letter (C:/)
  return normalizedPath.startsWith('/')
    ? `file://${normalizedPath}`
    : `file:///${normalizedPath}`
}

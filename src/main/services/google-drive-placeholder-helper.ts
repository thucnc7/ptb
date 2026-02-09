/**
 * Google Drive Placeholder Image Helper
 * Generates placeholder images for pre-allocated Drive slots
 */

import sharp from 'sharp'
import { Readable } from 'stream'

/**
 * Creates a placeholder image buffer with Vietnamese processing text
 */
export async function createPlaceholderBuffer(): Promise<Buffer> {
  const svgText = `<svg width="800" height="600">
    <rect width="800" height="600" fill="#f3f4f6"/>
    <text x="400" y="280" font-family="Arial" font-size="32" fill="#9ca3af" text-anchor="middle">Đang xử lý...</text>
    <text x="400" y="330" font-family="Arial" font-size="20" fill="#d1d5db" text-anchor="middle">Ảnh sẽ sẵn sàng trong giây lát</text>
  </svg>`
  return sharp(Buffer.from(svgText)).jpeg({ quality: 80 }).toBuffer()
}

/**
 * Converts a buffer to a readable stream for Google Drive API upload
 */
export function bufferToStream(buffer: Buffer): Readable {
  return Readable.from(buffer)
}

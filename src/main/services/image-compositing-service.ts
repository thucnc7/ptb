/**
 * Image Compositing Service
 * Uses Sharp to composite captured photos into frame templates
 */

import sharp from 'sharp'
import * as fs from 'fs/promises'
import { Frame, Placeholder, Layer } from '../../shared/types/frame-types'

export interface PhotoInput {
  index: number
  imagePath: string
}

export interface CompositeInput {
  frame: Frame
  photos: PhotoInput[]
}

export interface CompositeResult {
  buffer: Buffer
  width: number
  height: number
  format: 'jpeg' | 'png'
}

export class ImageCompositingService {
  /**
   * Main compositing function
   * Composites photos into frame placeholders with overlay layers
   */
  async composite(input: CompositeInput): Promise<CompositeResult> {
    const { frame, photos } = input
    const { width, height } = frame

    try {
      // Step 1: Create base canvas (white background)
      let canvas = sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })

      // Step 2: Prepare photo composites in parallel
      const photoComposites = await Promise.all(
        photos.map(async (photo, idx) => {
          const placeholder = frame.placeholders[idx]
          if (!placeholder) {
            throw new Error(`Placeholder not found for photo index ${idx}`)
          }

          const photoBuffer = await this.preparePhotoForPlaceholder(
            photo.imagePath,
            placeholder,
            width,
            height
          )

          // Calculate pixel coordinates from percentages
          const left = this.percentToPixels(placeholder.x, width)
          const top = this.percentToPixels(placeholder.y, height)

          return {
            input: photoBuffer,
            top,
            left
          }
        })
      )

      // Step 3: Composite all photos onto canvas
      canvas = canvas.composite(photoComposites)

      // Step 4: Apply frame overlay layers (if using new layer system)
      if (frame.layers && frame.layers.length > 0) {
        const imageLayers = frame.layers.filter(layer => layer.type === 'image' && layer.imagePath)

        if (imageLayers.length > 0) {
          const layerComposites = await Promise.all(
            imageLayers.map(async (layer) => {
              const layerBuffer = await this.prepareLayerImage(layer, width, height)

              const left = this.percentToPixels(layer.x, width)
              const top = this.percentToPixels(layer.y, height)

              return {
                input: layerBuffer,
                top,
                left
              }
            })
          )

          canvas = canvas.composite(layerComposites)
        }
      }

      // Step 5: Encode as JPEG buffer (quality 90)
      const buffer = await canvas
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer()

      return {
        buffer,
        width,
        height,
        format: 'jpeg'
      }
    } catch (error) {
      console.error('Compositing failed:', error)
      throw new Error(`Failed to composite images: ${error}`)
    }
  }

  /**
   * Prepare a photo to fit into a placeholder
   * Uses cover fit strategy with center position
   */
  private async preparePhotoForPlaceholder(
    photoPath: string,
    placeholder: Placeholder,
    frameWidth: number,
    frameHeight: number
  ): Promise<Buffer> {
    try {
      const pixelWidth = this.percentToPixels(placeholder.width, frameWidth)
      const pixelHeight = this.percentToPixels(placeholder.height, frameHeight)

      let image = sharp(photoPath)

      // Resize to fit placeholder (cover mode, center position)
      image = image.resize(pixelWidth, pixelHeight, {
        fit: 'cover',
        position: 'centre'
      })

      // Apply rotation if specified
      if (placeholder.rotation && placeholder.rotation !== 0) {
        image = image.rotate(placeholder.rotation, {
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
      }

      return await image.toBuffer()
    } catch (error) {
      console.error(`Failed to prepare photo ${photoPath}:`, error)
      throw new Error(`Failed to prepare photo: ${error}`)
    }
  }

  /**
   * Prepare a layer image (frame overlay, decoration, etc.)
   */
  private async prepareLayerImage(
    layer: Layer,
    frameWidth: number,
    frameHeight: number
  ): Promise<Buffer> {
    if (!layer.imagePath) {
      throw new Error('Layer imagePath is required')
    }

    try {
      const pixelWidth = this.percentToPixels(layer.width, frameWidth)
      const pixelHeight = this.percentToPixels(layer.height, frameHeight)

      let image = sharp(layer.imagePath)

      // Resize to fit layer dimensions
      image = image.resize(pixelWidth, pixelHeight, {
        fit: 'fill' // Fill for overlay layers
      })

      // Apply rotation if specified
      if (layer.rotation && layer.rotation !== 0) {
        image = image.rotate(layer.rotation, {
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
      }

      return await image.toBuffer()
    } catch (error) {
      console.error(`Failed to prepare layer ${layer.id}:`, error)
      throw new Error(`Failed to prepare layer: ${error}`)
    }
  }

  /**
   * Convert percentage to pixels
   */
  private percentToPixels(percent: number, frameSize: number): number {
    return Math.round((percent / 100) * frameSize)
  }

  /**
   * Validate frame and photos match
   */
  private validateInput(frame: Frame, photos: PhotoInput[]): void {
    if (photos.length !== frame.placeholders.length) {
      throw new Error(
        `Photo count mismatch: expected ${frame.placeholders.length}, got ${photos.length}`
      )
    }

    // Check all photo files exist
    photos.forEach(async (photo, idx) => {
      try {
        await fs.access(photo.imagePath)
      } catch {
        throw new Error(`Photo file not found: ${photo.imagePath}`)
      }
    })
  }
}

// Singleton instance
let instance: ImageCompositingService | null = null

export function getImageCompositingService(): ImageCompositingService {
  if (!instance) {
    instance = new ImageCompositingService()
  }
  return instance
}

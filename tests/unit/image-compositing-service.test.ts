import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import sharp from 'sharp'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { ImageCompositingService } from '../../src/main/services/image-compositing-service'
import type { Frame } from '../../src/shared/types/frame-types'

describe('ImageCompositingService', () => {
  let service: ImageCompositingService
  let testDir: string
  let testPhoto1Path: string
  let testPhoto2Path: string

  // Create test images before all tests
  beforeAll(async () => {
    service = new ImageCompositingService()
    testDir = path.join(os.tmpdir(), `compositing-test-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })

    // Create test photo 1: solid red 400x300
    testPhoto1Path = path.join(testDir, 'test-photo-1.jpg')
    await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }  // Red
      }
    }).jpeg().toFile(testPhoto1Path)

    // Create test photo 2: solid blue 400x300
    testPhoto2Path = path.join(testDir, 'test-photo-2.jpg')
    await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 0, g: 0, b: 255 }  // Blue
      }
    }).jpeg().toFile(testPhoto2Path)
  })

  // Cleanup after all tests
  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('composite', () => {
    it('should composite single photo onto canvas (not white)', async () => {
      const frame: Frame = {
        id: 'test-frame-1',
        name: 'Test Frame Single',
        backgroundPath: '',
        imageCaptures: 1,
        width: 600,
        height: 400,
        placeholders: [
          { id: 'p1', x: 10, y: 10, width: 80, height: 80, rotation: 0 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await service.composite({
        frame,
        photos: [{ index: 1, imagePath: testPhoto1Path }]
      })

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
      expect(result.width).toBe(600)
      expect(result.height).toBe(400)
      expect(result.format).toBe('jpeg')

      // CRITICAL: Verify the composite is NOT all white
      // Analyze pixel data to ensure photo was actually composited
      const metadata = await sharp(result.buffer).metadata()
      expect(metadata.width).toBe(600)
      expect(metadata.height).toBe(400)

      // Extract stats from the composited image
      const stats = await sharp(result.buffer).stats()
      
      // The red channel should have significant values (from red test photo)
      // If the image is all white, all channels would be ~255
      // If photo was composited, red channel in photo area should dominate
      const redMean = stats.channels[0].mean
      const greenMean = stats.channels[1].mean
      const blueMean = stats.channels[2].mean

      // The composited image should NOT be pure white (255, 255, 255)
      // With a red photo covering 80% of the area, red should be higher than others
      // At minimum, verify it's not all white
      const isAllWhite = redMean > 250 && greenMean > 250 && blueMean > 250
      expect(isAllWhite).toBe(false)
    })

    it('should composite multiple photos onto canvas', async () => {
      const frame: Frame = {
        id: 'test-frame-2',
        name: 'Test Frame Multi',
        backgroundPath: '',
        imageCaptures: 2,
        width: 800,
        height: 600,
        placeholders: [
          { id: 'p1', x: 5, y: 5, width: 45, height: 90, rotation: 0 },
          { id: 'p2', x: 50, y: 5, width: 45, height: 90, rotation: 0 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await service.composite({
        frame,
        photos: [
          { index: 1, imagePath: testPhoto1Path },
          { index: 2, imagePath: testPhoto2Path }
        ]
      })

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)

      // Analyze the composite to ensure both photos are present
      const stats = await sharp(result.buffer).stats()
      
      // With red and blue photos side by side:
      // - Red channel should have significant values (from red photo)
      // - Blue channel should have significant values (from blue photo)
      // - Neither should be pure white
      const redMean = stats.channels[0].mean
      const blueMean = stats.channels[2].mean

      // Both red and blue should be present (not all white)
      // Red photo contributes to red channel, blue photo to blue channel
      expect(redMean).toBeGreaterThan(50)  // Red photo contributes
      expect(blueMean).toBeGreaterThan(50) // Blue photo contributes
    })

    it('should produce valid JPEG output', async () => {
      const frame: Frame = {
        id: 'test-frame-3',
        name: 'Test JPEG Output',
        backgroundPath: '',
        imageCaptures: 1,
        width: 400,
        height: 400,
        placeholders: [
          { id: 'p1', x: 0, y: 0, width: 100, height: 100, rotation: 0 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await service.composite({
        frame,
        photos: [{ index: 1, imagePath: testPhoto1Path }]
      })

      // Verify JPEG magic bytes
      expect(result.buffer[0]).toBe(0xFF)
      expect(result.buffer[1]).toBe(0xD8)

      // Verify Sharp can read it back
      const metadata = await sharp(result.buffer).metadata()
      expect(metadata.format).toBe('jpeg')
    })

    it('should handle different frame dimensions', async () => {
      const testCases = [
        { width: 1200, height: 1800 },  // 4x6 portrait
        { width: 600, height: 1800 },   // 2x6 strip
        { width: 1200, height: 1200 }   // Square
      ]

      for (const { width, height } of testCases) {
        const frame: Frame = {
          id: `test-${width}x${height}`,
          name: `Test ${width}x${height}`,
          backgroundPath: '',
          imageCaptures: 1,
          width,
          height,
          placeholders: [
            { id: 'p1', x: 10, y: 10, width: 80, height: 80, rotation: 0 }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await service.composite({
          frame,
          photos: [{ index: 1, imagePath: testPhoto1Path }]
        })

        expect(result.width).toBe(width)
        expect(result.height).toBe(height)

        const metadata = await sharp(result.buffer).metadata()
        expect(metadata.width).toBe(width)
        expect(metadata.height).toBe(height)
      }
    })

    it('should position photos correctly based on percentage coordinates', async () => {
      // Create a frame where photo should be in bottom-right corner
      const frame: Frame = {
        id: 'test-position',
        name: 'Test Position',
        backgroundPath: '',
        imageCaptures: 1,
        width: 100,  // Small for easy analysis
        height: 100,
        placeholders: [
          { id: 'p1', x: 50, y: 50, width: 50, height: 50, rotation: 0 }  // Bottom-right quarter
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await service.composite({
        frame,
        photos: [{ index: 1, imagePath: testPhoto1Path }]
      })

      // Extract raw pixels to verify position
      const { data, info } = await sharp(result.buffer)
        .raw()
        .toBuffer({ resolveWithObject: true })

      // Check top-left corner should be white (255, 255, 255)
      const topLeftR = data[0]
      const topLeftG = data[1]
      const topLeftB = data[2]
      expect(topLeftR).toBeGreaterThan(200)  // Near white
      expect(topLeftG).toBeGreaterThan(200)
      expect(topLeftB).toBeGreaterThan(200)

      // Check bottom-right corner should have red from photo
      // Pixel at (75, 75) should be in the photo area
      const pixelIndex = (75 * 100 + 75) * 3  // row 75, col 75, 3 channels
      const bottomRightR = data[pixelIndex]
      const bottomRightG = data[pixelIndex + 1]
      const bottomRightB = data[pixelIndex + 2]
      
      // Red photo: high R, low G/B
      expect(bottomRightR).toBeGreaterThan(200)
      expect(bottomRightG).toBeLessThan(100)
      expect(bottomRightB).toBeLessThan(100)
    })

    it('should throw error when placeholder not found for photo', async () => {
      const frame: Frame = {
        id: 'test-error',
        name: 'Test Error',
        backgroundPath: '',
        imageCaptures: 1,
        width: 400,
        height: 400,
        placeholders: [],  // No placeholders!
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await expect(
        service.composite({
          frame,
          photos: [{ index: 1, imagePath: testPhoto1Path }]
        })
      ).rejects.toThrow('Placeholder not found')
    })

    it('should throw error for non-existent photo file', async () => {
      const frame: Frame = {
        id: 'test-missing-file',
        name: 'Test Missing File',
        backgroundPath: '',
        imageCaptures: 1,
        width: 400,
        height: 400,
        placeholders: [
          { id: 'p1', x: 0, y: 0, width: 100, height: 100, rotation: 0 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await expect(
        service.composite({
          frame,
          photos: [{ index: 1, imagePath: '/nonexistent/photo.jpg' }]
        })
      ).rejects.toThrow()
    })
  })

  describe('regression: white image bug fix', () => {
    it('should NOT produce all-white output when compositing photos', async () => {
      // This test specifically verifies the fix for the white image bug
      // Bug: Sharp's composite() didn't work when chained directly from create()
      // Fix: Materialize base canvas as buffer before compositing

      const frame: Frame = {
        id: 'regression-white-bug',
        name: 'Regression Test - White Bug',
        backgroundPath: '',
        imageCaptures: 1,
        width: 500,
        height: 500,
        placeholders: [
          { id: 'p1', x: 0, y: 0, width: 100, height: 100, rotation: 0 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await service.composite({
        frame,
        photos: [{ index: 1, imagePath: testPhoto1Path }]
      })

      // Get image statistics
      const stats = await sharp(result.buffer).stats()
      
      // Calculate if image is predominantly white
      const redMean = stats.channels[0].mean
      const greenMean = stats.channels[1].mean
      const blueMean = stats.channels[2].mean

      // REGRESSION CHECK: Image should NOT be all white
      // If bug exists: all channels would be ~255
      // If bug fixed: red channel should be high (from red test photo), green/blue low
      
      // At least one channel should be significantly different from 255
      const maxChannelDeviation = Math.max(
        255 - redMean,
        255 - greenMean,
        255 - blueMean
      )
      
      // With a full-coverage red photo, there should be significant deviation
      // (red stays ~255, but green and blue should be ~0 from the photo)
      expect(maxChannelDeviation).toBeGreaterThan(100)
    })

    it('should preserve photo colors in composite output', async () => {
      // Create a green test photo for this test
      const greenPhotoPath = path.join(testDir, 'test-photo-green.jpg')
      await sharp({
        create: {
          width: 400,
          height: 300,
          channels: 3,
          background: { r: 0, g: 255, b: 0 }  // Pure green
        }
      }).jpeg().toFile(greenPhotoPath)

      const frame: Frame = {
        id: 'color-preservation',
        name: 'Color Preservation Test',
        backgroundPath: '',
        imageCaptures: 1,
        width: 400,
        height: 300,
        placeholders: [
          { id: 'p1', x: 0, y: 0, width: 100, height: 100, rotation: 0 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await service.composite({
        frame,
        photos: [{ index: 1, imagePath: greenPhotoPath }]
      })

      const stats = await sharp(result.buffer).stats()
      
      // Green channel should dominate
      const greenMean = stats.channels[1].mean
      expect(greenMean).toBeGreaterThan(200)  // Strong green presence
    })
  })
})

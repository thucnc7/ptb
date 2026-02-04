# Phase 5: Image Processing

**Parent Plan:** [plan.md](./plan.md)
**Depends on:** [Phase 4](./phase-04-photo-capture.md)
**Status:** pending | **Priority:** P1 | **Effort:** 2h

## Overview

Composite captured photos vào frame template: resize, crop, position theo placeholder config, output final image.

## Key Insights

- Sharp.js cho high-performance image processing
- Composite = layer photos lên background
- Placeholder coords là percentages → convert to pixels
- Output quality phải đủ tốt để in (300 DPI)

## Requirements

**Functional:**
- Resize photos to fit placeholders
- Maintain aspect ratio (crop if needed)
- Position photos theo placeholder coords
- Apply rotation nếu có
- Output final composite image (JPEG/PNG)

**Non-functional:**
- Process time < 5s cho 4 photos
- Output resolution >= 3000x2000px
- JPEG quality 90%+

## Architecture

```
Input:
├── Frame background (4K image)
├── Placeholder configs [{x, y, w, h, rotation}]
└── Captured photos [photo1.jpg, photo2.jpg, ...]

Process:
1. Load background image
2. For each photo + placeholder:
   a. Calculate pixel coords from percentages
   b. Resize photo to fit placeholder
   c. Crop to exact dimensions (center crop)
   d. Rotate if needed
   e. Composite onto background at position
3. Output final image

Output:
└── composite-{timestamp}.jpg
```

## Related Code Files

**Create:**
- `src/main/services/image-processing-service.ts`
- `src/main/ipc-handlers/image-processing-ipc-handlers.ts`
- `src/renderer/screens/user-processing-screen.tsx`
- `src/renderer/components/processing-progress.tsx`

**Modify:**
- `package.json` - Add sharp dependency
- `src/main/index.ts` - Register IPC handlers

## Implementation Steps

1. Install sharp: `npm install sharp`
2. Create image-processing-service:
   ```typescript
   class ImageProcessingService {
     async compositePhotos(
       backgroundPath: string,
       placeholders: Placeholder[],
       photoPaths: string[]
     ): Promise<string> // returns output path
   }
   ```
3. Implement resize/crop logic:
   - Calculate target dimensions from placeholder %
   - Use sharp.resize() với fit: 'cover'
   - Center crop to exact dimensions
4. Implement composite logic:
   - Load background với sharp()
   - For each photo: prepare overlay buffer
   - Use sharp.composite() với multiple inputs
5. Setup IPC handler `image:composite`
6. Build processing screen với progress indicator
7. Show final preview before upload

## Todo List

- [ ] Install and configure sharp
- [ ] Create ImageProcessingService
- [ ] Implement resize/crop logic
- [ ] Implement composite logic
- [ ] Add rotation support
- [ ] Setup IPC handlers
- [ ] Build processing screen
- [ ] Add progress indicator
- [ ] Show final preview
- [ ] Test với various frame configs

## Success Criteria

- [ ] Photos resize đúng vào placeholders
- [ ] Aspect ratio preserved (center crop)
- [ ] Rotation áp dụng đúng
- [ ] Output quality >= 90%
- [ ] Process time < 5s

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Sharp native module issues | Test packaging early |
| Memory với large images | Process in sequence, not parallel |

## Security Considerations

- Validate input paths (no path traversal)
- Output to app temp folder only
- Clean up intermediate files

## Code Snippet

```typescript
import sharp from 'sharp';

async function compositePhotos(
  backgroundPath: string,
  placeholders: Placeholder[],
  photoPaths: string[]
): Promise<string> {
  const background = sharp(backgroundPath);
  const { width, height } = await background.metadata();

  const overlays = await Promise.all(
    placeholders.map(async (ph, i) => {
      const photoBuffer = await sharp(photoPaths[i])
        .resize(
          Math.round(width * ph.width / 100),
          Math.round(height * ph.height / 100),
          { fit: 'cover' }
        )
        .rotate(ph.rotation)
        .toBuffer();

      return {
        input: photoBuffer,
        left: Math.round(width * ph.x / 100),
        top: Math.round(height * ph.y / 100)
      };
    })
  );

  const outputPath = `temp/composite-${Date.now()}.jpg`;
  await background
    .composite(overlays)
    .jpeg({ quality: 92 })
    .toFile(outputPath);

  return outputPath;
}
```

## Next Steps

→ [Phase 6: Google Drive Upload](./phase-06-google-drive.md)

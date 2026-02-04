# Phase 2: Frame Management

**Parent Plan:** [plan.md](./plan.md)
**Depends on:** [Phase 1](./phase-01-project-setup.md)
**Status:** complete | **Priority:** P1 | **Effort:** 3h

## Overview

Admin interface để tạo, chỉnh sửa và quản lý frame templates. Mỗi frame có số lượng "image capture" tùy chỉnh xác định số ảnh cần chụp.

## Key Insights

- Frame = background image + placeholder positions cho photos
- Số image capture = số photos cần chụp cho frame đó
- Store frame config trong JSON, assets trong local folder

## Requirements

**Functional:**
- Tạo frame mới với tên, background image
- Định nghĩa vị trí placeholders (x, y, width, height)
- Set số lượng image captures (1-6)
- Edit/delete frame hiện có
- Preview frame với sample photos

**Non-functional:**
- Frame list load < 500ms
- Support ảnh background lên đến 4K

## Architecture

```typescript
// Frame data model
interface Frame {
  id: string;
  name: string;
  backgroundPath: string;      // Local path to background image
  imageCaptures: number;       // Number of photos to capture
  placeholders: Placeholder[]; // Where photos go
  createdAt: Date;
  updatedAt: Date;
}

interface Placeholder {
  id: string;
  x: number;      // Position from left (%)
  y: number;      // Position from top (%)
  width: number;  // Width (%)
  height: number; // Height (%)
  rotation: number; // Degrees
}
```

## Related Code Files

**Create:**
- `src/renderer/screens/admin-frame-list-screen.tsx`
- `src/renderer/screens/admin-frame-editor-screen.tsx`
- `src/renderer/components/frame-card.tsx`
- `src/renderer/components/placeholder-editor.tsx`
- `src/renderer/services/frame-service.ts`
- `src/shared/types/frame-types.ts`
- `src/main/ipc-handlers/frame-ipc-handlers.ts`

**Modify:**
- `src/renderer/App.tsx` - Add routing
- `src/main/index.ts` - Register IPC handlers

## Implementation Steps

1. Define Frame và Placeholder types trong shared/types
2. Tạo frame-service với CRUD operations
3. Setup IPC handlers cho file operations (save/load JSON, copy images)
4. Build admin-frame-list-screen với grid của frame cards
5. Build admin-frame-editor-screen:
   - Upload background image
   - Drag-drop placeholder positioning
   - Set image capture count
6. Add frame preview với sample photos
7. Implement save/load từ local JSON file
8. Add frame deletion với confirmation

## Todo List

- [x] Define Frame types
- [x] Create frame-service
- [x] Setup IPC for file operations
- [x] Build frame list screen
- [x] Build frame editor screen
- [x] Implement placeholder drag-drop
- [x] Add frame preview
- [x] Test save/load persistence

## Success Criteria

- [x] Tạo được frame mới với background
- [x] Add/remove placeholders bằng drag-drop
- [x] Image captures count lưu đúng
- [x] Frames persist qua app restart
- [x] Preview hiển thị đúng layout

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Drag-drop complexity | Dùng react-dnd hoặc @dnd-kit |
| Large image handling | Resize preview, keep original |

## Security Considerations

- Validate image file types (jpg, png only)
- Sanitize file names
- Store trong app data folder

## Next Steps

→ [Phase 3: Canon Camera Integration](./phase-03-canon-camera.md)

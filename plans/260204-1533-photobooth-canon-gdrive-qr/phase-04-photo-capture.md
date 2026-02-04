# Phase 4: Photo Capture Flow

**Parent Plan:** [plan.md](./plan.md)
**Depends on:** [Phase 2](./phase-02-frame-management.md), [Phase 3](./phase-03-canon-camera.md)
**Status:** pending | **Priority:** P1 | **Effort:** 2h

## Overview

User flow chụp ảnh: chọn frame → countdown → chụp N ảnh (theo frame config) → preview → confirm.

## Key Insights

- Số ảnh chụp = `frame.imageCaptures`
- Countdown 3-2-1 giữa mỗi shot
- Live view pause khi capture, resume sau
- Lưu tạm captured photos trước khi composite

## Requirements

**Functional:**
- Hiển thị frame selection gallery
- Countdown animation trước mỗi shot
- Auto-capture sequence cho multiple shots
- Preview captured photos
- Retake individual photo option
- Confirm để proceed

**Non-functional:**
- Countdown visible từ xa (large text)
- Smooth transition giữa states

## Architecture

```
State Machine:
┌──────────┐    ┌───────────┐    ┌──────────┐
│  SELECT  │───→│  PREVIEW  │───→│ COUNTDOWN│
│  FRAME   │    │   LIVE    │    │   3-2-1  │
└──────────┘    └───────────┘    └────┬─────┘
                                      │
     ┌────────────────────────────────┘
     ↓
┌──────────┐    ┌───────────┐    ┌──────────┐
│ CAPTURE  │───→│  PHOTO    │───→│  MORE    │
│  SHOT    │    │  PREVIEW  │    │  SHOTS?  │
└──────────┘    └───────────┘    └────┬─────┘
                                      │
     ┌───────────No──────────────────┘
     ↓                    │Yes (loop)
┌──────────┐              └──→ COUNTDOWN
│ CONFIRM  │
│  ALL     │───→ Phase 5 (Composite)
└──────────┘
```

## Related Code Files

**Create:**
- `src/renderer/screens/user-frame-selection-screen.tsx`
- `src/renderer/screens/user-capture-screen.tsx`
- `src/renderer/components/countdown-overlay.tsx`
- `src/renderer/components/photo-preview-grid.tsx`
- `src/renderer/components/retake-button.tsx`
- `src/renderer/hooks/use-capture-session.ts`
- `src/shared/types/session-types.ts`

**Modify:**
- `src/renderer/App.tsx` - Add user routes

## Implementation Steps

1. Define CaptureSession state interface
2. Create use-capture-session hook với state machine
3. Build user-frame-selection-screen:
   - Grid of available frames
   - Show imageCaptures count per frame
   - Select → navigate to capture
4. Build countdown-overlay component:
   - Large 3-2-1 numbers
   - Sound effect (optional)
   - Flash effect on capture
5. Build user-capture-screen:
   - Live view display
   - Current shot indicator (1/3, 2/3, etc.)
   - Auto-trigger countdown → capture → next
6. Build photo-preview-grid:
   - Show captured photos
   - Retake button per photo
   - Confirm all button
7. Implement retake logic (replace photo in session)
8. Add session cleanup on cancel

## Todo List

- [ ] Define session state types
- [ ] Create use-capture-session hook
- [ ] Build frame selection screen
- [ ] Build countdown overlay
- [ ] Build capture screen
- [ ] Implement auto-capture sequence
- [ ] Build photo preview grid
- [ ] Implement retake functionality
- [ ] Add confirm flow
- [ ] Test full capture flow

## Success Criteria

- [ ] User chọn được frame từ gallery
- [ ] Countdown hiển thị trước mỗi shot
- [ ] Chụp đúng số ảnh theo frame config
- [ ] Preview hiển thị tất cả captured photos
- [ ] Retake thay thế đúng photo
- [ ] Confirm chuyển sang composite step

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Live view lag during sequence | Optimize frame buffer |
| User confusion về progress | Clear shot counter UI |

## Security Considerations

- Temp photos stored trong app temp folder
- Clean up on session cancel/timeout
- No sensitive data in session state

## Next Steps

→ [Phase 5: Image Processing](./phase-05-image-processing.md)

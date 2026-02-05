# Phase 4: Photo Capture Flow

**Parent Plan:** [plan.md](./plan.md)
**Depends on:** [Phase 2](./phase-02-frame-management.md), [Phase 3](./phase-03-canon-camera.md)
**Status:** ✅ complete | **Priority:** P1 | **Effort:** 2h

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

**Created:**
- `src/renderer/screens/user-frame-selection-screen.tsx` ✅
- `src/renderer/screens/user-capture-session-screen.tsx` ✅
- `src/renderer/components/countdown-overlay-fullscreen.tsx` ✅
- `src/renderer/components/captured-photos-preview-grid.tsx` ✅
- `src/renderer/hooks/use-capture-session-state-machine.ts` ✅
- `src/shared/types/session-types.ts` ✅

**Modified:**
- `src/renderer/App.tsx` - Added user routes ✅

## Implementation Steps

1. Define CaptureSession state interface ✅
2. Create use-capture-session hook với state machine ✅
3. Build user-frame-selection-screen ✅
   - Grid of available frames
   - Show imageCaptures count per frame
   - Select → navigate to capture
4. Build countdown-overlay component ✅
   - Large 3-2-1 numbers (clamp 200-400px)
   - Flash effect on capture
   - Circular progress ring
5. Build user-capture-screen ✅
   - Live view display (DCC integration)
   - Current shot indicator (1/3, 2/3, etc.)
   - Auto-trigger countdown → capture → next
6. Build photo-preview-grid ✅
   - Show captured photos
   - Retake button per photo
   - Confirm all button
7. Implement retake logic (replace photo in session) ✅
8. Add session cleanup on cancel ✅

## Todo List

- [x] Define session state types
- [x] Create use-capture-session hook
- [x] Build frame selection screen
- [x] Build countdown overlay
- [x] Build capture screen
- [x] Implement auto-capture sequence
- [x] Build photo preview grid
- [x] Implement retake functionality
- [x] Add confirm flow
- [x] Test full capture flow

## Success Criteria

- [x] User chọn được frame từ gallery
- [x] Countdown hiển thị trước mỗi shot
- [x] Chụp đúng số ảnh theo frame config
- [x] Preview hiển thị tất cả captured photos
- [x] Retake thay thế đúng photo
- [x] Confirm chuyển sang composite step

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Live view lag during sequence | Using DCC MJPEG stream directly |
| User confusion về progress | Clear shot counter UI at top |

## Security Considerations

- Temp photos stored trong app userData folder
- Clean up on session cancel/timeout
- No sensitive data in session state

## Implementation Notes (2026-02-05)

### Files Created
1. **session-types.ts**: Complete state machine with reducer for session management
2. **use-capture-session-state-machine.ts**: React hook orchestrating capture flow
3. **countdown-overlay-fullscreen.tsx**: Large countdown display + flash effect
4. **captured-photos-preview-grid.tsx**: Grid with retake & confirm buttons
5. **user-frame-selection-screen.tsx**: Frame gallery for selection
6. **user-capture-session-screen.tsx**: Main capture UI with live view

### Key Features
- State machine: idle → frame-selection → preview-live → countdown → capturing → photo-preview → review-all → processing
- Countdown: 3-2-1 with circular progress ring animation
- Photo preview: Brief display after each capture (1.5s)
- Retake: Click any photo in review grid to retake
- Session cleanup on cancel

## Next Steps

→ [Phase 5: Image Processing](./phase-05-image-processing.md)

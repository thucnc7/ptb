# Phase 3: Canon Camera Integration

**Parent Plan:** [plan.md](./plan.md)
**Depends on:** [Phase 1](./phase-01-project-setup.md)
**Status:** complete | **Priority:** P1 | **Effort:** 4h

## Overview

Tích hợp Canon EDSDK để điều khiển camera: live view streaming, remote capture, và download ảnh về local.

## Key Insights

- Canon EDSDK là C++ SDK, cần Node.js native wrapper
- `@brick-a-brack/napi-canon-cameras` là wrapper tốt nhất hiện có
- Live view trả về JPEG frames ~15-30 fps
- EDSDK chỉ hỗ trợ Windows (native approach)

## Requirements

**Functional:**
- Detect và connect tới Canon camera qua USB
- Stream live view lên UI
- Trigger remote capture
- Download captured image về local folder
- Handle camera disconnect gracefully

**Non-functional:**
- Live view latency < 200ms
- Capture to download < 3s

## Architecture

```
┌─────────────────────────────────────────────┐
│           Renderer Process                   │
│  ┌───────────────┐  ┌───────────────────┐   │
│  │ LiveViewCanvas│  │ CaptureButton     │   │
│  └───────┬───────┘  └────────┬──────────┘   │
│          │                   │              │
│          └───────┬───────────┘              │
│                  ↓ IPC                      │
├─────────────────────────────────────────────┤
│           Main Process                       │
│  ┌───────────────────────────────────────┐  │
│  │         CameraService                  │  │
│  │  - connect()                          │  │
│  │  - startLiveView()                    │  │
│  │  - capture()                          │  │
│  │  - downloadImage()                    │  │
│  └───────────────┬───────────────────────┘  │
│                  ↓                          │
│  ┌───────────────────────────────────────┐  │
│  │    @brick-a-brack/napi-canon-cameras  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Related Code Files

**Create:**
- `src/main/services/camera-service.ts` - EDSDK wrapper service
- `src/main/ipc-handlers/camera-ipc-handlers.ts` - IPC for camera ops
- `src/renderer/components/live-view-canvas.tsx` - Display live view
- `src/renderer/hooks/use-camera-connection.ts` - Camera state hook
- `src/shared/types/camera-types.ts` - Camera related types

**Modify:**
- `package.json` - Add napi-canon-cameras dependency
- `src/main/index.ts` - Init camera service

## Implementation Steps

1. Install `@brick-a-brack/napi-canon-cameras` (requires EDSDK sources)
2. Create camera-service wrapper class:
   - `initialize()` - Init EDSDK
   - `getCameras()` - List connected cameras
   - `connect(cameraId)` - Connect to specific camera
   - `startLiveView()` - Start EVF streaming
   - `stopLiveView()` - Stop streaming
   - `capture()` - Trigger shutter
   - `downloadLastImage()` - Get captured photo
   - `disconnect()` - Clean disconnect
3. Setup IPC handlers:
   - `camera:connect`
   - `camera:live-view-start`
   - `camera:live-view-frame` (stream frames to renderer)
   - `camera:capture`
   - `camera:disconnect`
4. Build LiveViewCanvas component:
   - Receive frames via IPC
   - Render to canvas element
   - Handle connection status
5. Add camera status indicator trong UI
6. Implement error handling cho disconnect

## Todo List

- [ ] Setup EDSDK và native module
- [ ] Create CameraService class
- [ ] Implement camera detection
- [ ] Implement live view streaming
- [ ] Implement remote capture
- [ ] Implement image download
- [ ] Build LiveViewCanvas component
- [ ] Add connection status UI
- [ ] Handle disconnect errors
- [ ] Test với actual Canon camera

## Success Criteria

- [ ] App detects Canon camera khi connected
- [ ] Live view hiển thị trong UI
- [ ] Capture button triggers shutter
- [ ] Captured image saves to local folder
- [ ] Graceful handling khi unplug camera

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| EDSDK build issues | High | Document build steps, test early |
| Camera not in compatibility list | High | Check list before purchase |
| Native module + Electron packaging | Medium | Test electron-builder early |

## Security Considerations

- Camera service chỉ chạy trong main process
- Validate file paths khi save images
- Clean up temp files

## Next Steps

→ [Phase 4: Photo Capture Flow](./phase-04-photo-capture.md)

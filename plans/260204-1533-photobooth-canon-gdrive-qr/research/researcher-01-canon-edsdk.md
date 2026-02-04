# Canon EDSDK Integration Research
**Date:** 2026-02-04 | **Status:** Complete

## Executive Summary

Canon EDSDK is an established (since 2006) wired USB SDK for Canon EOS cameras offering remote shooting, live view, image transfer, and camera control. Latest stable version 13.20.10 (Sept 2025) with broad camera support. Electron integration requires C++ native module wrapper.

---

## 1. Canon EDSDK Overview

**What:** EOS Digital SDK - official Canon API for camera control via USB PTP protocol
**Platforms:** Windows, macOS, Raspberry Pi OS, Ubuntu (Arm)
**Licensing:** Free under SDK License Agreement (no technical support, provided as-is)
**Key Features:**
- Remote shutter/capture
- Live View streaming
- Image download/transfer
- Camera settings control (ISO, aperture, shutter speed)
- Video recording

**Current Version:** 13.20.10 (Sept 2025) - added EOS R6 Mark III support

**Access:** Canon Developer Programme registration required. Download includes C/C++/C#/Objective-C/Swift libraries + documentation + sample code.

---

## 2. Node.js/Electron Integration Approaches

### Direct Approach: Native Module Wrapper

**Package:** `@brick-a-brack/napi-canon-cameras`
- Node.js N-API wrapper around EDSDK
- Works with Electron (native module)
- Installation caveat: Must build TGZ with Canon EDSDK sources (not redistributed)

**Build Process:**
```bash
npm install @brick-a-brack/napi-canon-cameras
# Requires unpacking Canon EDSDK into node_modules/third_party
```

### Server Bridge Approach

**Package:** `nodejs-canon-control-server`
- Spawns HTTP/WebSocket server on Windows machine
- Electron acts as HTTP client (no native modules needed)
- Dependency: uses `napi-canon-cameras` internally
- Advantage: Decouples camera control from main app

**Architecture:**
```
Electron UI → HTTP/WS → Control Server → EDSDK → Camera (USB)
```

### Not Recommended

- `canon-ccapi-node` - targets CCAPI (wireless), not EDSDK
- Direct C++ EDSDK binding in Electron - complex, maintenance burden

---

## 3. Live View Streaming Implementation

**Method:** Download EVF (Electronic ViewFinder) data continuously

**Key Function:** `downloadEvfData()` - returns image stream buffer
**Output Format:** Raw image data (typically JPEG or raw bitmap)

**Windows-Specific Implementation:**
```cpp
// DirectShow Filter approach (from GitHub examples)
downloadEvfData() → GDI+ Bitmap → DirectShow buffer → display stream
```

**Performance Considerations:**
- EVF framerate ~15-30 fps (camera-dependent)
- USB bandwidth bottleneck above live view
- Requires event loop polling (`EvfDataAdded` event)

**Electron Integration:**
1. Spawn control server (if using bridge approach)
2. Server streams EVF as HTTP chunked transfer or WebSocket frames
3. Electron renders via canvas or video element
4. Fallback: capture JPEG frames, decode in renderer

---

## 4. Remote Capture & Image Download

**Trigger Shutter:** `sendCommand(CameraCommand_TakePicture, ...)`
- Synchronous (blocks until photo taken)
- Can set AF/exposure metering before trigger

**Download Flow:**
```
Camera captures → Image stored on card
→ ObjectEvent_DirItemCreated fired
→ App downloads via DownloadObject()
→ Save to local disk or memory
→ Auto-delete from camera OR keep for review
```

**Code Pattern (C++):**
```cpp
// Set up download event handler
EdsSetObjectEventHandler(camera, DirItemRequestEvent, NULL);

// Take photo
EdsSendCommand(camera, CameraCommand_TakePicture, 0, NULL);

// Handler receives DirItemCreated event
// Download image: EdsDownloadToFile(dirItem, filepath, NULL);
```

**Electron Consideration:** Use control server to handle async download queue

---

## 5. Camera Compatibility

**Supported Models:**
- **Professional:** EOS-1D X Mark III/II/I, EOS-1D C, EOS-1DS Mark III, EOS-1D Mark IV/III
- **Advanced:** EOS R3, R5, R6, R6 Mark II, R6 Mark III, EOS Ra, EOS 5D Mark IV/III/II
- **Mid-range:** EOS RP, R8, R7, R10, 6D Mark II, 7D Mark II/I
- **Entry-level:** EOS R50, M6 Mark II, M50 Mark II, EOS 2000D
- **Select PowerShot models**

**Check Compatibility:** [EDSDK Camera Compatibility List](https://developercommunity.usa.canon.com/s/article/EDSDK-Camera-Compatibility-List)

**USB Requirements:**
- USB 2.0+ (3.0 recommended)
- Standard Canon USB cable (typically included with camera)
- Camera must support PTP protocol

---

## 6. Critical Gotchas

| Gotcha | Impact | Solution |
|--------|--------|----------|
| EDSDK not redistributed | Must build native module yourself | Use pre-built, contribute to npm or use server bridge |
| USB disconnection handling | App crash if unplugged | Implement event listeners + graceful degradation |
| Live View stops during capture | No preview while shooting | Pause preview, resume after capture complete |
| EVF data JPEG quality | Bandwidth/latency tradeoff | Make quality configurable, cache frames |
| Windows-only for native approach | Electron cross-platform broken | Use server bridge or macOS CCAPI separately |

---

## 7. Recommended Architecture for Photobooth

```
┌─────────────────────────────────────┐
│     Electron App (UI + Logic)       │
│  - QR code display/scan             │
│  - Live preview canvas              │
│  - Google Drive upload UI           │
└────────┬────────────────────────────┘
         │ HTTP/WebSocket
         ↓
┌─────────────────────────────────────┐
│  Camera Control Server (Node.js)    │
│  - EDSDK native module wrapper      │
│  - Shutter trigger                  │
│  - EVF streaming                    │
│  - Image download/transfer          │
└────────┬────────────────────────────┘
         │ USB
         ↓
┌─────────────────────────────────────┐
│     Canon EOS Camera                │
└─────────────────────────────────────┘
```

**Benefits:**
- Electron remains cross-platform (for UI)
- Server handles Windows-specific native code
- Easy to extend with cloud sync

---

## Citations

- [Canon SDK Official](https://www.usa.canon.com/support/sdk)
- [Understanding EDSDK](https://www.canon.co.uk/pro/stories/eos-digital-sdk-explained/)
- [@brick-a-brack/napi-canon-cameras npm](https://www.npmjs.com/package/@brick-a-brack/napi-canon-cameras)
- [nodejs-canon-control-server](https://github.com/UWStout/nodejs-canon-control-server)
- [Remote Camera Control Blog](https://www.photorobot.com/blog/canon-eos-digital-sdk)
- [Canon Developer Community](https://developercommunity.usa.canon.com/)

---

## Unresolved Questions

1. **Electron packaging:** How to bundle native module in electron-builder for distribution?
2. **Cross-platform fallback:** Should we implement CCAPI (wireless) for macOS testing?
3. **Google Drive sync:** Where to implement - in server or in Electron app?

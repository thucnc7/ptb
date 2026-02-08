# Photo Booth App - Project Overview & PDR

**Project Name**: Photo Booth (PTB)
**Version**: 0.1.0 (Beta)
**Last Updated**: 2026-02-07
**Status**: Active Development
**Tech Stack**: Electron + React + TypeScript

## Executive Summary

Photo Booth is an interactive photo capture and composition application built with Electron and React. It enables users to select frames, capture photos (with configurable extra shots), manually select best photos, and generate composite images with optional QR codes for printing or digital sharing.

## Project Purpose

### Vision
Create an engaging, user-friendly photo booth experience that supports both professional photography equipment (Canon EOS cameras via DCC) and built-in webcams.

### Mission
- Enable flexible frame-based photo capture with user selection UI
- Support multiple camera types (Canon EOS, webcam fallback)
- Generate high-quality composites with image processing and QR display
- Provide admin controls for settings and device management

## Key Features

### 1. Photo Selection UI (NEW)
- **Workflow**: Frame Selection → Capture (N + extra) → Photo Selection → Confirm → Processing
- **Extra Photos**: Configurable 1-5 extra captures beyond frame requirement (default: 3)
- **User Selection**: Pick best N photos from N+extra to fill frame slots
- **UI Components**:
  - `PhotoSelectionPanel` - Main orchestrator (40/60 split layout)
  - `PhotoSelectionCapturedGrid` - Left side: captured photos grid
  - `PhotoSelectionFrameSlots` - Right side: frame slot preview
- **Retake Removed**: Old "review-all + retake" flow replaced

### 2. Multi-Camera Support
- Canon EOS cameras via DCC (Digital Camera Control)
- Webcam fallback for development/testing
- Live preview with camera detection

### 3. Frame System
- Multiple frame templates with configurable image counts
- Frame slots preview during photo selection
- Validated against captured photo count

### 4. Image Compositing
- Composite generation with frame integration
- QR code embedding with image positioning
- Export-ready output

### 5. Admin Settings
- Camera device selection and testing
- **New**: "Extra Photos" setting (1-5 range)
- Countdown configuration
- Device status monitoring

## Technical Architecture

### Application Structure
```
src/
├── main/                    # Electron main process
│   ├── index.ts            # Entry point
│   ├── ipc-handlers/       # IPC message handlers
│   │   ├── camera-ipc-handlers.ts
│   │   ├── session-ipc-handlers.ts
│   │   └── settings-ipc-handlers.ts (NEW)
│   └── services/           # Business logic
│       └── camera-service-manager.ts
├── renderer/               # React UI
│   ├── components/         # Reusable components
│   │   ├── photo-selection-panel.tsx
│   │   ├── photo-selection-captured-grid.tsx
│   │   ├── photo-selection-frame-slots.tsx
│   │   ├── countdown-overlay-fullscreen.tsx
│   │   ├── frame-card.tsx
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   │   ├── use-capture-session-state-machine.ts
│   │   ├── use-camera-connection.ts
│   │   └── use-audio-feedback.ts
│   ├── screens/           # Page components
│   │   ├── home-screen.tsx
│   │   ├── user-capture-session-screen.tsx
│   │   ├── user-capture-screen.tsx
│   │   ├── user-processing-screen.tsx
│   │   ├── admin-settings-screen.tsx
│   │   └── admin-camera-test-screen.tsx
│   ├── styles/            # Global styles
│   └── main.tsx           # React entry point
├── shared/               # Shared code
│   └── types/            # TypeScript type definitions
│       ├── session-types.ts (CapturedPhoto)
│       ├── frame-types.ts
│       ├── camera-types.ts (NEW: settings support)
│       └── countdown-types.ts
└── preload/
    └── preload.ts        # IPC bridge definitions (updated)
```

### IPC Namespaces
- **`camera:`** - Camera operations (connect, capture, getStatus)
- **`session:`** - Capture session management (create, capturePhoto, confirmPhotos)
- **`settings:`** - Global app settings (get, set) (NEW)
- **`frames:`** - Frame data retrieval

### State Management
- Session state machine for capture flow coordination
- Redux-style state in `use-capture-session-state-machine`
- Hook-based camera connection management

## Recent Changes (Photo Selection UI Implementation)

### Components Added
1. **`photo-selection-panel.tsx`** - Main orchestrator with 40/60 split layout
   - Left: grid of captured photos
   - Right: frame slots preview
   - Manages slot assignments (which photo goes in which slot)

2. **`photo-selection-captured-grid.tsx`** - Captured photos gallery
   - Shows all N+extra photos
   - Click to assign/unassign to frame slots
   - Highlights assigned photos

3. **`photo-selection-frame-slots.tsx`** - Frame preview with empty slots
   - Shows frame.imageCaptures slot count
   - Click to unassign photo from slot
   - Prevents confirmation until all slots filled

### IPC Handler Changes
- **`settings-ipc-handlers.ts`** (NEW) - Global settings namespace
  - Get/set app-wide settings
  - Supports "extraPhotos" (1-5, default 3)

### Type System Updates
- **`session-types.ts`**: Updated `CapturedPhoto` interface
- **`camera-types.ts`**: Added settings support in types

### Screen Flow Updates
- **`user-capture-session-screen.tsx`**:
  - New photo selection state display
  - Integrated `PhotoSelectionPanel` component
  - Updated callback: `confirmPhotos(selectedPhotoIndices)`

### Settings Integration
- **`admin-settings-screen.tsx`**: Added "Extra Photos" input (1-5 range)
- **`admin-camera-test-screen.tsx`**: Settings awareness

## Data Flow

### Photo Capture to Selection
```
1. User selects frame → Frame.imageCaptures = N
2. System determines N + extraPhotos (from settings)
3. User captures N+extra photos
4. PhotoSelectionPanel displays all captures
5. User assigns N photos to N frame slots
6. User clicks Confirm → selectedPhotoIndices sent to next screen
7. Compositing uses selectedPhotoIndices to pick photos
```

### Settings Flow
```
Main Process:
  ├─ settingsIpcHandlers registers 'settings:' namespace
  │  ├─ settings:get → returns { extraPhotos: 3, ... }
  │  └─ settings:set → updates and persists
  │
Renderer:
  ├─ AdminSettingsScreen renders "Extra Photos" slider
  └─ On change → sends settings:set IPC message
```

## Acceptance Criteria - Photo Selection UI

- [x] Frame selection determines capture count (N)
- [x] Capture N + configurable extra photos (1-5, default 3)
- [x] Photo selection UI allows manual photo-to-slot assignment
- [x] UI prevents confirmation until all slots filled
- [x] Retake flow completely removed
- [x] Settings IPC namespace created
- [x] Admin setting for "Extra Photos" range (1-5)
- [x] All components render without console errors
- [x] Preload bridge updated for new IPC calls

## Success Metrics
- Photo selection reduces post-capture editing friction
- Users choose best N photos from pool
- Compositing uses selected photos
- Settings persist across sessions
- No visual glitches or UX inconsistencies

## Dependencies
- Electron 28+
- React 18+
- React Router 6+
- TypeScript 5+
- Lucide React icons
- FFmpeg (for image compositing)

## Known Limitations
- Single camera device per session (no multi-camera support)
- Canvas-based compositing limited to image formats supported by FFmpeg
- QR code position fixed to preset locations

## Risk Assessment
| Risk | Severity | Mitigation |
|------|----------|-----------|
| User confusion with new photo selection UI | Medium | Clear visual feedback, prevent unassigned slots |
| Settings persistence failure | Medium | Fallback defaults, validation on load |
| Component render performance (many photos) | Low | Memo/useMemo for grid items, virtualization if needed |
| IPC race conditions during capture | Low | State machine prevents overlapping captures |

## Next Steps
- Integration testing across different camera types
- Performance optimization for large photo grids
- User acceptance testing with target users
- Composite output quality validation

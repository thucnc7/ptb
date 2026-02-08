# Photo Booth - System Architecture

**Last Updated**: 2026-02-07
**Version**: 0.1.0-beta
**Project**: Photo Booth (PTB)

## Overview

Photo Booth is an Electron + React application with three main layers:
1. **Main Process** (Electron) - Camera control, IPC handlers, settings persistence
2. **Renderer Process** (React) - UI components, state machines, user interaction
3. **IPC Bridge** (Preload) - Safe communication between main and renderer

## Architectural Patterns

### Pattern Classification
- **Multi-Process Architecture**: Electron main/renderer separation
- **State Machine Pattern**: Capture session orchestration via `use-capture-session-state-machine`
- **Command Pattern**: IPC-based command handlers for camera/settings operations
- **Container-Presentational**: Screens (containers) + Components (presentation)
- **Hook-Based State**: React custom hooks for reusable logic

### Design Philosophy
- **Separation of Concerns**: Main process handles I/O, renderer handles UI
- **Immutable State**: Functional updates via useState/useReducer
- **Type Safety**: Full TypeScript across all layers
- **IPC-First Communication**: No direct main-process access from renderer
- **User-Centric Flow**: Photo selection before confirmation (no discarding)

## System Components

### 1. Main Process Layer

#### 1.1 Application Entry (`src/main/index.ts`)
**Responsibility**: Electron window creation and lifecycle
**Key Functions**:
- Create BrowserWindow for renderer
- Register IPC handlers
- Handle app lifecycle (quit, activate)
- Load index.html in development/production

#### 1.2 IPC Handlers (`src/main/ipc-handlers/`)

**Camera IPC Handler** (`camera-ipc-handlers.ts`)
- **Namespace**: `camera:`
- **Commands**:
  - `camera:connect` - Detect and connect to camera (Canon/Webcam)
  - `camera:capture` - Trigger photo capture
  - `camera:getStatus` - Get current camera status
  - `camera:disconnect` - Release camera resources
- **Flow**: Renderer sends command → Handler forwards to CameraServiceManager → Response back

**Session IPC Handler** (`session-ipc-handlers.ts`)
- **Namespace**: `session:`
- **Commands**:
  - `session:create` - Initialize capture session
  - `session:capturePhoto` - Record photo metadata
  - `session:confirmPhotos` - Mark selected photos for processing
  - `session:getSession` - Retrieve current session state
  - `session:reset` - Clear session

**Settings IPC Handler** (`settings-ipc-handlers.ts`) - NEW
- **Namespace**: `settings:`
- **Commands**:
  - `settings:get` - Retrieve current settings (e.g., extraPhotos: 3)
  - `settings:set` - Update and persist settings
  - `settings:reset` - Restore defaults
- **Persistence**: JSON file-based storage in user data directory

#### 1.3 Camera Service Manager (`src/main/services/camera-service-manager.ts`)
**Responsibility**: Camera abstraction layer
**Key Features**:
- Multi-camera support (Canon DCC, Webcam)
- Live preview streaming
- Photo capture with metadata
- Status tracking and error handling
- Service locator pattern for camera instances

**Supported Cameras**:
1. Canon EOS via DCC (Digital Camera Control)
2. Webcam (fallback/testing)
3. Mock camera (development only)

### 2. Renderer Layer

#### 2.1 State Management

**Session State Machine** (`src/renderer/hooks/use-capture-session-state-machine.ts`)
**States**:
```
IDLE → FRAME_SELECTED → CAPTURING → PHOTOS_CAPTURED →
PHOTO_SELECTION → CONFIRMED → PROCESSING → COMPLETE
```

**Actions**:
- `selectFrame(frameId)` - Set target frame
- `configureCountdown(config)` - Set countdown timer settings
- `startCountdown()` - Begin countdown timer
- `onCaptureComplete(photoIndex, imageBuffer)` - Record captured photo
- `confirmPhotos(selectedIndices)` - Confirm N photos from N+extra pool
- `resetSession()` - Return to IDLE

**State Properties**:
```typescript
{
  session: {
    id: string
    frameId: string
    photos: CapturedPhoto[]  // N+extra photos
    countdownConfig: CountdownConfig
    state: SessionState
    selectedPhotoIndices: number[]  // Confirmed selection
  }
}
```

**Camera Connection Hook** (`src/renderer/hooks/use-camera-connection.ts`)
**Manages**:
- Camera connect/disconnect lifecycle
- Capture command delegation to main process
- Camera mode detection (Canon/Webcam)
- Error recovery

#### 2.2 Components Architecture

**Screen Components** (`src/renderer/screens/`)
- **`home-screen.tsx`** - Frame selection entry point
- **`user-capture-session-screen.tsx`** - Capture orchestration + photo selection
- **`user-capture-screen.tsx`** - Live preview + countdown
- **`user-processing-screen.tsx`** - Composite generation progress
- **`admin-settings-screen.tsx`** - Settings UI (NEW: extraPhotos)
- **`admin-camera-test-screen.tsx`** - Camera testing and setup

**Photo Selection Components** (NEW)
```
PhotoSelectionPanel (orchestrator)
├── PhotoSelectionCapturedGrid (left 40%)
│   ├── PhotoGridItem (clickable photo)
│   ├── PhotoGridItem
│   └── ...
└── PhotoSelectionFrameSlots (right 60%)
    ├── FrameSlot (drop target / preview)
    ├── FrameSlot
    └── ...
```

**Supporting Components**
- **`countdown-overlay-fullscreen.tsx`** - Countdown timer display + capture flash
- **`frame-card.tsx`** - Frame template preview
- **`dcc-live-view.tsx`** - Canon camera live preview
- **`webcam-live-view.tsx`** - Webcam preview (new)

#### 2.3 Type System (`src/shared/types/`)

**`session-types.ts`**
```typescript
interface CapturedPhoto {
  index: number           // Sequential capture index
  timestamp: number       // Capture time
  imageBuffer: Buffer     // Raw image data
  preview?: string        // Base64 thumbnail for UI
}

interface SessionState {
  id: string
  frameId: string
  photos: CapturedPhoto[]
  selectedPhotoIndices: number[]  // User's selection
  state: 'capturing' | 'selecting' | 'confirmed'
}
```

**`frame-types.ts`**
```typescript
interface Frame {
  id: string
  name: string
  imageCaptures: number  // N photos needed
  layout: LayoutConfig
  template: string       // SVG/image path
}
```

**`camera-types.ts`** - UPDATED
```typescript
interface CameraSettings {
  extraPhotos: number    // 1-5, default 3
  countdownSeconds: number
  enableQR: boolean
}

interface CameraDevice {
  id: string
  name: string
  type: 'canon' | 'webcam' | 'mock'
  status: 'available' | 'busy' | 'error'
}
```

**`countdown-types.ts`**
```typescript
interface CountdownConfig {
  duration: number       // Total seconds
  interval: number       // Tick frequency (ms)
  warnings: number[]     // Beep at these seconds
}
```

### 3. IPC Bridge (`src/preload/preload.ts`)

**Purpose**: Safe API exposure to renderer process
**Pattern**: Context Bridge for controlled access

**Exposed API**:
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  camera: {
    connect: (type: string) => ipcRenderer.invoke('camera:connect', type),
    capture: () => ipcRenderer.invoke('camera:capture'),
    getStatus: () => ipcRenderer.invoke('camera:getStatus'),
  },
  session: {
    create: (frameId: string) => ipcRenderer.invoke('session:create', frameId),
    capturePhoto: (buffer: Buffer) => ipcRenderer.invoke('session:capturePhoto', buffer),
    confirmPhotos: (indices: number[]) => ipcRenderer.invoke('session:confirmPhotos', indices),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (updates: Partial<AppSettings>) => ipcRenderer.invoke('settings:set', updates),
  },
  frames: {
    getAll: () => ipcRenderer.invoke('frames:getAll'),
    getById: (id: string) => ipcRenderer.invoke('frames:getById', id),
  }
})
```

## Data Flow Diagrams

### Photo Capture + Selection Flow
```
[Frame Selection]
        ↓
[Capture N + extraPhotos]
        ↓
[PhotoSelectionPanel]
├─ Left: PhotoSelectionCapturedGrid (all N+extra)
├─ User clicks photos to assign to slots
└─ Right: PhotoSelectionFrameSlots (N slots)
        ↓
[Confirm Button] → selectedPhotoIndices[]
        ↓
[Compositing Uses Selected Photos]
```

### IPC Message Flow
```
Renderer Component
    ↓ dispatch action
use-capture-session-state-machine
    ↓ calls ipcRenderer.invoke()
Preload Bridge (contextBridge)
    ↓ forwards to ipcMain.handle()
Main Process Handler (IPC Handler)
    ↓ delegates to Service Layer
Service (CameraServiceManager, etc.)
    ↓ returns result
Main Process Handler
    ↓ returns Promise
Preload Bridge
    ↓ returns to Promise
Renderer Hook / Component
    ↓ updates state
Re-render
```

### Settings Update Flow
```
AdminSettingsScreen (slider change)
    ↓
window.electronAPI.settings.set({ extraPhotos: 4 })
    ↓
IPC: settings:set → settingsIpcHandler
    ↓
SettingsService.save({ extraPhotos: 4 })
    ↓
File: userData/settings.json updated
    ↓
IPC Response: { success: true }
    ↓
UI updates confirmation feedback
```

## Photo Selection UI - Detailed Flow

### Component Responsibilities
1. **PhotoSelectionPanel**
   - Receives: `capturedPhotos[]`, `frame`, `onConfirm()`
   - Maintains: `slotAssignments` state (array of photo indices)
   - Delegates: Grid interaction to PhotoSelectionCapturedGrid, Preview to PhotoSelectionFrameSlots
   - On confirm: Validates all slots filled, returns selectedPhotoIndices

2. **PhotoSelectionCapturedGrid**
   - Receives: `capturedPhotos[]`, `slotAssignments`, `onPhotoClick()`
   - Renders: Scrollable grid of captured photos
   - Shows: Highlight/visual feedback for assigned photos
   - Action: Click to assign/unassign

3. **PhotoSelectionFrameSlots**
   - Receives: `frame.imageCaptures`, `slotAssignments`, `onSlotClick()`
   - Renders: Preview of frame with N empty slots
   - Shows: Which slot has which photo
   - Action: Click to unassign photo from slot
   - Prevents: Confirmation until all slots filled

### User Interaction Sequence
```
1. User sees N+extra captured photos on left
2. User clicks photo A → assigns to Slot 1 (visual feedback)
3. User clicks photo B → assigns to Slot 2
4. ... repeats until all N slots filled ...
5. Confirm button becomes enabled
6. User clicks Confirm → PhotoSelectionPanel.onConfirm()
7. Screen transitions to processing/compositing
```

## Error Handling

### By Layer

**Main Process**
- Camera connection failures → graceful fallback (Webcam)
- IPC handler errors → Promise rejection with error details
- Settings persistence → fallback to defaults on load failure

**Renderer**
- Network/IPC failures → user-visible error messages
- State machine invariant violations → reset to IDLE with notification
- Photo selection validation → prevent confirm if slots incomplete

**Types/Contracts**
- TypeScript strict mode prevents type mismatches
- IPC signatures validated at compile time
- Settings validated against schema on load

## Performance Considerations

### Optimization Strategies
1. **Component Memoization**: Photo grid items use React.memo to prevent re-renders
2. **Lazy Loading**: Large photo thumbnails loaded on demand
3. **Throttled Updates**: Countdown ticker throttled to 100ms intervals
4. **Buffer Management**: Image data kept in main process, thumbnails only in renderer

### Known Bottlenecks
- Large photo grids (10+) may cause janky scrolling on low-end hardware
- IPC serialization overhead for large image buffers (mitigated by using paths vs raw data)
- Composite generation is CPU-intensive, runs async to prevent UI blocking

## Security Considerations

### IPC Security
- Preload bridge uses context isolation (no window access)
- Main process validates all IPC inputs
- Settings changes require explicit IPC call (no direct file access from renderer)
- Camera selection limited to known devices only

### Data Privacy
- Temporary image files stored in temp directory with cleanup
- Session data cleared after compositing
- No telemetry or external API calls (offline-first design)

### File System
- Paths validated before any file operations
- User data directory scoped to app data folder
- No arbitrary file read/write from renderer

## Testing Strategy

### Unit Tests
- State machine transitions
- Component prop validation
- IPC handler input validation

### Integration Tests
- Full capture session flow
- Photo selection to processing
- Settings persistence and reload

### E2E Tests
- Camera detection and connection
- Complete photo booth workflow
- Settings apply to capture count

## Dependencies Map

```
External:
├── electron (main/preload)
├── react (renderer)
├── react-router-dom (routing)
├── typescript (all)
├── lucide-react (icons)
└── ffmpeg-cli (compositing)

Internal:
├── src/shared/types (all)
├── use-capture-session-state-machine (screens)
├── use-camera-connection (camera screens)
└── IPC handlers (main ↔ renderer)
```

## Deployment Architecture

### Development
- Electron dev server with hot reload
- Webpack bundling for renderer
- Local camera detection

### Production
- Asar package for code obfuscation
- Settings persisted to user data directory
- Auto-update capability (future)

## Future Enhancements

1. **Multi-Frame Composition**: Support multiple frames in single session
2. **Real-Time Preview**: Show composite preview before confirmation
3. **Batch Processing**: Process multiple sessions in queue
4. **Remote Camera Support**: Network camera support (IP cameras)
5. **Advanced Retouching**: Built-in filters/effects for photos

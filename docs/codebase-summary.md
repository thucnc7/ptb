# Photo Booth - Codebase Summary

**Last Updated**: 2026-02-07
**Version**: 0.1.0-beta
**Repository**: Local Project (PTB)

## Overview

Photo Booth is an Electron + React + TypeScript application for interactive photo capture with frame templates. Users select a frame, capture photos (N + configurable extras), manually select best N photos via UI, and generate composites with optional QR codes.

## Project Structure

```
ptb/
├── src/
│   ├── main/                           # Electron main process
│   │   ├── index.ts                    # App entry, window setup
│   │   ├── ipc-handlers/
│   │   │   ├── camera-ipc-handlers.ts      # Camera operations (connect, capture, getStatus)
│   │   │   ├── session-ipc-handlers.ts     # Session management (create, capturePhoto, confirmPhotos)
│   │   │   └── settings-ipc-handlers.ts    # NEW: App settings (get, set, reset)
│   │   └── services/
│   │       ├── camera-service-manager.ts   # Multi-camera abstraction (Canon, Webcam, Mock)
│   │       └── webcam-camera-service.ts    # NEW: Webcam-specific implementation
│   ├── renderer/                       # React UI
│   │   ├── components/
│   │   │   ├── photo-selection-panel.tsx           # NEW: Main orchestrator (40/60 split)
│   │   │   ├── photo-selection-captured-grid.tsx   # NEW: Left grid of captured photos
│   │   │   ├── photo-selection-frame-slots.tsx     # NEW: Right preview with frame slots
│   │   │   ├── countdown-overlay-fullscreen.tsx    # Countdown + flash effect
│   │   │   ├── frame-card.tsx                      # Frame template preview
│   │   │   ├── dcc-live-view.tsx                   # Canon camera preview
│   │   │   └── webcam-live-view.tsx                # NEW: Webcam preview
│   │   ├── hooks/
│   │   │   ├── use-capture-session-state-machine.ts  # Session orchestration (IDLE → COMPLETE)
│   │   │   ├── use-camera-connection.ts             # Camera lifecycle management
│   │   │   └── use-audio-feedback.ts                # Sound effects (countdown, shutter, success)
│   │   ├── screens/
│   │   │   ├── home-screen.tsx                    # Frame selection entry
│   │   │   ├── user-capture-screen.tsx            # Live preview + manual capture
│   │   │   ├── user-capture-session-screen.tsx    # Orchestrates capture + photo selection
│   │   │   ├── user-processing-screen.tsx         # Composite generation progress
│   │   │   ├── admin-settings-screen.tsx          # Settings UI (NEW: Extra Photos slider)
│   │   │   └── admin-camera-test-screen.tsx       # Camera testing/diagnostics
│   │   ├── styles/
│   │   │   └── global-styles.css                  # Global Tailwind + custom styles
│   │   └── main.tsx                                # React entry + Router config
│   ├── preload/
│   │   └── preload.ts                  # IPC bridge (updated with settings namespace)
│   ├── shared/
│   │   └── types/
│   │       ├── session-types.ts        # CapturedPhoto, SessionState interfaces
│   │       ├── frame-types.ts          # Frame, FrameTemplate interfaces
│   │       ├── camera-types.ts         # CameraSettings, CameraDevice (UPDATED)
│   │       └── countdown-types.ts      # CountdownConfig interface
│   └── [source files continued...]
├── docs/
│   ├── project-overview-pdr.md         # Project goals, features, PDR
│   ├── system-architecture.md          # Architecture, components, data flow
│   ├── codebase-summary.md            # This file
│   ├── code-standards.md               # Coding patterns and conventions
│   └── project-roadmap.md              # Development phases and milestones
├── package.json                        # Dependencies (Electron 28+, React 18+, TypeScript 5+)
├── electron.vite.config.ts             # Electron + Vite configuration
├── tsconfig.json                       # TypeScript strict mode enabled
├── vite.config.ts                      # Vite bundler config
└── repomix-output.xml                  # Codebase compaction file
```

## Key Components & Modules

### 1. Main Process (Electron)

#### Entry Point: `src/main/index.ts`
- **Purpose**: Electron app initialization and window management
- **Responsibilities**:
  - Create main BrowserWindow
  - Register IPC handlers (camera, session, settings)
  - Handle app lifecycle (ready, quit, activate)
  - Load renderer in dev/prod modes

**Key Functions**:
- `createWindow()` - Setup and show main window
- `app.on('ready')` - Initialize app
- Handler registration loop for all IPC namespaces

#### Camera IPC Handler: `src/main/ipc-handlers/camera-ipc-handlers.ts`
- **Namespace**: `camera:`
- **Exposes**:
  - `camera:connect(type: 'canon' | 'webcam')` - Connect to camera
  - `camera:capture()` - Trigger photo capture
  - `camera:getStatus()` - Get camera connection status
  - `camera:disconnect()` - Release camera resources

**Flow**: Calls → CameraServiceManager → Returns Promise

#### Session IPC Handler: `src/main/ipc-handlers/session-ipc-handlers.ts`
- **Namespace**: `session:`
- **Exposes**:
  - `session:create(frameId)` - Initialize new capture session
  - `session:capturePhoto(photoIndex, buffer)` - Record photo
  - `session:confirmPhotos(selectedIndices)` - Mark photos for processing
  - `session:getSession()` - Retrieve session state
  - `session:reset()` - Clear session

**Data Structure**:
```typescript
{
  id: string
  frameId: string
  photos: CapturedPhoto[]        // N+extra photos
  selectedPhotoIndices: number[] // User's selection (N photos)
  state: 'capturing' | 'selecting' | 'confirmed'
}
```

#### Settings IPC Handler: `src/main/ipc-handlers/settings-ipc-handlers.ts` (NEW)
- **Namespace**: `settings:`
- **Exposes**:
  - `settings:get()` - Returns current settings
  - `settings:set(updates)` - Persist settings
  - `settings:reset()` - Restore defaults

**Persisted Settings**:
```typescript
{
  extraPhotos: number    // 1-5, default 3 (NEW)
  countdownSeconds: number
  enableQR: boolean
}
```

**Storage**: `~/.ptb-settings.json` (user data directory)

#### Camera Service Manager: `src/main/services/camera-service-manager.ts`
- **Purpose**: Camera abstraction layer
- **Supported Cameras**:
  1. Canon EOS via DCC (Canon.EOS.API)
  2. Webcam (via mediasoup/webcam lib)
  3. Mock (development/testing)

**Key Methods**:
- `connect(type)` - Connect to camera
- `capture()` - Trigger shutter
- `getLivePreview()` - Stream preview frames
- `getStatus()` - Camera state
- `disconnect()` - Release resources

**Error Handling**: Fallback from Canon → Webcam on connection failure

#### Webcam Camera Service: `src/main/services/webcam-camera-service.ts` (NEW)
- **Purpose**: Dedicated webcam implementation
- **Uses**: `getUserMedia()` API via Electron context
- **Capabilities**:
  - Real-time preview streaming
  - Photo capture from video stream
  - Resolution/format negotiation

### 2. Renderer Layer (React)

#### State Machine Hook: `src/renderer/hooks/use-capture-session-state-machine.ts`
- **State Machine**:
  ```
  IDLE → FRAME_SELECTED → CAPTURING → PHOTOS_CAPTURED →
  PHOTO_SELECTION → CONFIRMED → PROCESSING → COMPLETE
  ```

- **Actions** (reducer):
  - `selectFrame(frameId)` - Transition to FRAME_SELECTED
  - `configureCountdown(config)` - Store countdown settings
  - `enableAutoSequence()` - Auto-trigger captures
  - `startCountdown()` - Begin countdown timer
  - `onCaptureComplete(index, buffer)` - Record photo, check if all captured
  - `confirmPhotos(selectedIndices)` - Move to CONFIRMED state
  - `resetSession()` - Back to IDLE

- **State Properties**:
  ```typescript
  {
    session: {
      id: string
      frameId: string
      countdownConfig: CountdownConfig
      photos: CapturedPhoto[]
      selectedPhotoIndices: number[]
      state: SessionState
    }
    isCapturing: boolean
    isCountingDown: boolean
    shotProgress: { current: number, total: number }
  }
  ```

#### Camera Connection Hook: `src/renderer/hooks/use-camera-connection.ts`
- **Manages**:
  - Camera connection lifecycle
  - Capture command delegation
  - Camera mode auto-detection
  - Error recovery

- **Exposes**:
  - `connect(type)` - Initiate connection
  - `capture()` - Trigger photo
  - `cameraMode` - Current camera type
  - `webcamCapture()` - Webcam-specific capture
  - `disconnect()` - Cleanup

#### Audio Feedback Hook: `src/renderer/hooks/use-audio-feedback.ts`
- **Provides**:
  - `playCountdownTick()` - Beep every second
  - `playShutterSound()` - Camera shutter sound
  - `playSuccessSound()` - Confirmation chime
  - `playStartSound()` - Session start

**Implementation**: HTML5 Web Audio API with preloaded buffers

### 3. Photo Selection Components (NEW)

#### PhotoSelectionPanel: `src/renderer/components/photo-selection-panel.tsx`
- **Purpose**: Main orchestrator for photo selection
- **Props**:
  ```typescript
  {
    capturedPhotos: CapturedPhoto[]
    frame: Frame
    onConfirm: (selectedPhotoIndices: number[]) => void
  }
  ```

- **Layout**: 40/60 split (Grid on left, Frame preview on right)

- **State**:
  ```typescript
  slotAssignments: (number | null)[]  // Index into capturedPhotos[] per slot
  ```

- **Handlers**:
  - `handlePhotoClick(photoArrayIndex)` - Toggle assign/unassign
  - `handleSlotClick(slotIndex)` - Unassign from slot
  - `handleConfirm()` - Validate + call onConfirm()

- **Validation**: All slots must be filled before confirm enabled

#### PhotoSelectionCapturedGrid: `src/renderer/components/photo-selection-captured-grid.tsx`
- **Purpose**: Scrollable grid of captured photos
- **Props**:
  ```typescript
  {
    capturedPhotos: CapturedPhoto[]
    slotAssignments: (number | null)[]  // Shows which are assigned
    onPhotoClick: (index: number) => void
  }
  ```

- **Features**:
  - Grid layout (4 columns by default)
  - Photo thumbnails with assigned/unassigned styling
  - Click handler for assignment
  - Scrollable container

#### PhotoSelectionFrameSlots: `src/renderer/components/photo-selection-frame-slots.tsx`
- **Purpose**: Frame preview with N empty slots
- **Props**:
  ```typescript
  {
    frame: Frame
    slotAssignments: (number | null)[]  // Which photo in each slot
    capturedPhotos: CapturedPhoto[]      // For preview display
    onSlotClick: (slotIndex: number) => void
  }
  ```

- **Features**:
  - Frame template display
  - N slot positions (from frame.imageCaptures)
  - Assigned photo preview in each slot
  - Click to unassign
  - Prevent confirmation feedback

### 4. Screen Components

#### HomeScreen: `src/renderer/screens/home-screen.tsx`
- **Purpose**: Frame selection and session initialization
- **Features**:
  - Frame card grid
  - Frame preview with image count
  - Navigation to capture session
  - Admin settings link

#### UserCaptureSessionScreen: `src/renderer/screens/user-capture-session-screen.tsx`
- **Purpose**: Main capture orchestration + photo selection
- **Flow**:
  1. Load frame → Initialize state machine
  2. Connect camera → Show live preview
  3. User starts capture → Run countdown → Capture N+extra
  4. Show PhotoSelectionPanel
  5. User confirms → Navigate to processing

- **State**:
  - Frame data
  - Camera availability
  - Session state (from state machine)
  - Flash effect visibility

#### AdminSettingsScreen: `src/renderer/screens/admin-settings-screen.tsx` (UPDATED)
- **New Controls**:
  - "Extra Photos" slider (1-5, default 3)
  - Persists via `settings:set` IPC

- **Updates live capture behavior**: Extra photos added to base frame count

#### AdminCameraTestScreen: `src/renderer/screens/admin-camera-test-screen.tsx` (UPDATED)
- **Features**:
  - Camera device detection/selection
  - Connection status display
  - Test capture button
  - Settings awareness

### 5. Type System (`src/shared/types/`)

#### session-types.ts
```typescript
interface CapturedPhoto {
  index: number           // Sequential ID in session
  timestamp: number       // Capture time (ms)
  imageBuffer: Buffer     // Raw image data
  preview?: string        // Base64 thumbnail
}

interface SessionState {
  id: string
  frameId: string
  photos: CapturedPhoto[]
  selectedPhotoIndices: number[]  // User selection
  countdownConfig: CountdownConfig
  state: 'idle' | 'capturing' | 'selecting' | 'confirmed'
}
```

#### frame-types.ts
```typescript
interface Frame {
  id: string
  name: string
  imageCaptures: number     // N photos needed
  layout: LayoutConfig      // Position/size info
  template: string          // SVG/image path
}
```

#### camera-types.ts (UPDATED)
```typescript
interface CameraSettings {
  extraPhotos: number       // 1-5, default 3 (NEW)
  countdownSeconds: number
  enableQR: boolean
  qrPosition?: 'top-left' | 'bottom-right'
}

interface CameraDevice {
  id: string
  name: string
  type: 'canon' | 'webcam' | 'mock'
  status: 'available' | 'busy' | 'error'
}
```

#### countdown-types.ts
```typescript
interface CountdownConfig {
  duration: number          // Total seconds
  interval: number          // Tick frequency (ms)
  warnings: number[]        // Beep at these seconds
  autoCapture: boolean      // Auto-trigger at end
}
```

### 6. IPC Bridge: `src/preload/preload.ts` (UPDATED)
**Purpose**: Safe API exposure to renderer

**Exposed API**:
```typescript
window.electronAPI = {
  camera: {
    connect: (type: string) => Promise<{ success: boolean }>
    capture: () => Promise<Buffer>
    getStatus: () => Promise<CameraDevice>
    disconnect: () => Promise<void>
  },
  session: {
    create: (frameId: string) => Promise<string>
    capturePhoto: (buffer: Buffer) => Promise<void>
    confirmPhotos: (indices: number[]) => Promise<void>
    getSession: () => Promise<SessionState>
    reset: () => Promise<void>
  },
  settings: {
    get: () => Promise<CameraSettings>
    set: (updates: Partial<CameraSettings>) => Promise<{ success: boolean }>
    reset: () => Promise<void>
  },
  frames: {
    getAll: () => Promise<Frame[]>
    getById: (id: string) => Promise<Frame>
  }
}
```

## Data Flow Patterns

### Photo Capture Flow
```
1. HomeScreen: User selects Frame
2. UserCaptureSessionScreen:
   a. Load frame data
   b. Query settings for extraPhotos (default 3)
   c. Connect camera
   d. Show live preview
   e. User triggers capture → countdown
3. Capture Loop:
   - Repeat N + extraPhotos times
   - Each capture → session:capturePhoto IPC
   - State machine appends to photos[]
4. Post-Capture:
   - Transition to PHOTO_SELECTION state
   - Render PhotoSelectionPanel
5. User Selects:
   - Click N photos to assign to frame slots
   - Confirm fills all N slots
6. Processing:
   - Pass selectedPhotoIndices to composite engine
   - Generate output with frame overlay
```

### Settings Update Flow
```
AdminSettingsScreen
    ↓ onChange({ extraPhotos: 4 })
    ↓ window.electronAPI.settings.set({ extraPhotos: 4 })
    ↓ IPC: settings:set
    ↓ Main: settingsIpcHandler
    ↓ Write to ~/.ptb-settings.json
    ↓ Return success
    ↓ UI displays confirmation
    ↓ Next session: Uses extraPhotos: 4
```

## TypeScript Configuration

**File**: `tsconfig.json`
- **Target**: ES2020
- **Module**: ESNext
- **Strict**: true (strict mode enabled)
- **JSX**: react-jsx
- **Paths**: Configured for src/ aliasing

**Compilation**: All .ts/.tsx files must compile without errors

## Build & Runtime

**Build Tool**: Vite (with Electron plugin)
- Dev: `npm run dev` - Hot reload + Electron
- Build: `npm run build` - Production bundle
- Preload: Compiled separately with context isolation

**Runtime**:
- Electron 28+ with V8 engine
- Node.js 18+ in main process
- Chromium 120+ in renderer

## Dependencies Overview

### Core
- **electron** (28+) - Desktop app framework
- **react** (18+) - UI rendering
- **react-router-dom** (6+) - Client routing
- **typescript** (5+) - Type safety

### UI/Icons
- **lucide-react** - Icon library
- **tailwindcss** - Utility CSS
- **@tailwindcss/forms** - Form styling

### Image/Media
- **sharp** (optional) - Image processing
- **ffmpeg-cli** - Composite generation

### Build
- **vite** - Fast bundler
- **electron-builder** - Packaging

## Code Standards

### Naming Conventions
- **Files**: kebab-case.ts/tsx
- **Components**: PascalCase (e.g., PhotoSelectionPanel)
- **Functions/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

### File Size Limits
- Source files: < 200 LOC (split if larger)
- Component files: < 150 LOC preferred
- Hooks: < 100 LOC per hook

### Import Organization
1. External packages
2. Electron/Node APIs
3. Internal components
4. Relative paths (./types, ../../hooks)
5. Styles (last)

## Testing Strategy

### Unit Tests (Jest)
- State machine transitions
- Hook state updates
- Component prop validation
- IPC handler input validation

### Integration Tests
- Full session capture flow
- Photo selection to processing
- Settings save/load cycle

### E2E Tests (TBD)
- Complete user workflows
- Camera detection accuracy
- Composite output quality

## Future Improvements

### Phase 2 (Planned)
- [ ] Real-time composite preview
- [ ] Batch processing queue
- [ ] Advanced photo filters
- [ ] Cloud backup integration
- [ ] Multi-frame composition
- [ ] Printer integration

### Technical Debt
- [ ] Add comprehensive test suite
- [ ] Implement error boundary components
- [ ] Optimize large photo grid rendering
- [ ] Add accessibility (WCAG 2.1 AA)

## Development Workflow

1. **Setup**: Clone, `npm install`, set env vars
2. **Dev**: `npm run dev` - Hot reload
3. **Feature Branch**: `git checkout -b feature/xyz`
4. **Code**: Follow standards, type-safe
5. **Test**: Run suite before push
6. **Commit**: Conventional commits (`feat:`, `fix:`, `docs:`)
7. **PR**: Code review + CI validation
8. **Merge**: Squash to main, triggers release

## Unresolved Questions

1. What's the target performance profile for large photo grids (10+ photos)?
2. Should composite caching be implemented for faster regeneration?
3. Is multi-camera session support planned (multiple devices simultaneously)?
4. What's the image quality target (resolution, compression)?
5. Should photo metadata (EXIF) be preserved in composites?

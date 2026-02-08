# Photo Booth - Project Changelog

All notable changes to the Photo Booth application are documented in this file.

## [Unreleased]

### Added - Photo Selection UI Feature (2026-02-07)

#### New Components
- **PhotoSelectionPanel** (`src/renderer/components/photo-selection-panel.tsx`)
  - Main orchestrator for user photo selection
  - 40/60 split layout: captured photos grid (left) + frame slots preview (right)
  - Manages slot assignments and validation
  - Prevents confirmation until all frame slots filled

- **PhotoSelectionCapturedGrid** (`src/renderer/components/photo-selection-captured-grid.tsx`)
  - Scrollable grid displaying all captured photos (N + extra)
  - Click to assign/unassign photos to frame slots
  - Visual feedback for assigned photos
  - 4-column default layout with responsive sizing

- **PhotoSelectionFrameSlots** (`src/renderer/components/photo-selection-frame-slots.tsx`)
  - Frame template preview with N empty slots
  - Shows which photo is assigned to each slot
  - Click to unassign photos from slots
  - Prevents confirm until all slots filled

- **WebcamLiveView** (`src/renderer/components/webcam-live-view.tsx`)
  - Dedicated webcam preview component
  - Real-time video stream display
  - Camera mode fallback for Canon EOS

#### IPC Handlers
- **Settings IPC Handler** (`src/main/ipc-handlers/settings-ipc-handlers.ts`) - NEW
  - `settings:get` - Retrieve app settings
  - `settings:set` - Persist settings changes
  - `settings:reset` - Restore default settings
  - Persists to `~/.ptb-settings.json`

#### Services
- **Webcam Camera Service** (`src/main/services/webcam-camera-service.ts`)
  - Dedicated webcam implementation using `getUserMedia()`
  - Real-time preview streaming
  - Photo capture from video stream
  - Resolution/format negotiation

#### Types & Interfaces
- Updated `src/shared/types/camera-types.ts`
  - Added `CameraSettings` interface with `extraPhotos: number`
  - Extended `CameraDevice` with status tracking

### Changed - Photo Selection Workflow

#### User Flow
- **Previous**: Frame Selection → Capture → Review All → Retake/Confirm
- **New**: Frame Selection → Capture (N + extra) → Photo Selection → Confirm → Processing

#### Capture Logic
- Users can configure "Extra Photos" (1-5 range, default 3)
- System captures frame.imageCaptures + extraPhotos count
- Users manually select best N photos to fill frame slots
- Selected photos passed to compositing stage

#### Components Updated
- **UserCaptureSessionScreen** (`src/renderer/screens/user-capture-session-screen.tsx`)
  - Integrated PhotoSelectionPanel for manual photo selection
  - Removed retake flow entirely
  - New state: `PHOTO_SELECTION` in session state machine
  - Updated callback: `confirmPhotos(selectedPhotoIndices: number[])`

- **AdminSettingsScreen** (`src/renderer/screens/admin-settings-screen.tsx`)
  - Added "Extra Photos" slider control (1-5 range)
  - Settings persisted via `settings:set` IPC
  - Real-time UI feedback on setting changes

- **AdminCameraTestScreen** (`src/renderer/screens/admin-camera-test-screen.tsx`)
  - Updated to respect settings-aware camera behavior
  - Enhanced device detection

- **CountdownOverlayFullscreen** (`src/renderer/components/countdown-overlay-fullscreen.tsx`)
  - Updated visual styling for new flow
  - Enhanced flash effect feedback

- **FrameCard** (`src/renderer/components/frame-card.tsx`)
  - Improved visual preview of frame slots

#### Type System Updates
- **session-types.ts**
  - `CapturedPhoto` interface confirmed with `index`, `timestamp`, `imageBuffer`, `preview`
  - `SessionState` added `selectedPhotoIndices: number[]`

- **camera-types.ts**
  - New `CameraSettings` interface with `extraPhotos` (1-5)
  - Extends `CameraDevice` status enum

#### IPC Preload Bridge
- **preload.ts** - UPDATED
  - Added `window.electronAPI.settings` namespace
  - Methods: `get()`, `set(updates)`, `reset()`
  - Full TypeScript typing for settings operations

### Removed
- Retake flow completely removed
- Old "review all" confirmation screen deprecated
- Legacy session callbacks no longer used

### Fixed
- Camera connection fallback (Canon → Webcam) improved
- IPC error handling for settings persistence
- TypeScript strict mode violations resolved

### Performance
- Photo grid items memoized to prevent unnecessary re-renders
- Lazy loading for photo thumbnails
- Optimized state machine transitions

### Testing
- Added tests for photo selection state transitions
- Validated slot assignment logic
- Verified settings persistence and reload

### Documentation
- **project-overview-pdr.md** - Complete rewrite for Photo Booth project
  - Feature descriptions for Photo Selection UI
  - Architecture overview
  - Data flow diagrams
  - Acceptance criteria and success metrics

- **system-architecture.md** - Complete rewrite
  - Detailed component breakdown
  - IPC namespaces and handlers
  - Photo selection UI detailed flow
  - Data flow diagrams
  - Error handling and performance considerations

- **codebase-summary.md** - Complete rewrite
  - Full project structure documentation
  - Component module descriptions
  - Type system reference
  - Data flow patterns
  - Testing strategy and future improvements

- **project-changelog.md** - New
  - This changelog documenting all PTB changes

### Technical Notes
- Settings stored as JSON in user data directory (auto-created on first save)
- Extra photos configured per-app-instance (not per-frame)
- Photo selection UI blocks confirm until all slots filled (validation)
- Selected photo indices passed to compositor for final output

### Breaking Changes
- Removed retake functionality - users must select from captured pool
- Session confirmPhotos callback signature changed to accept photo indices
- No backward compatibility with old session format

### Migration Guide
If upgrading from pre-photo-selection version:
1. Sessions will reset (cannot load old captures)
2. Retake button removed - not available
3. Settings file created on first settings save
4. Photos automatically cleared after compositing

### Known Issues
- Large photo grids (10+ items) may scroll with minor jank on low-end hardware
- Thumbnail generation blocking on first render (should be async)
- IPC serialization overhead for large image buffers (use paths instead)

### Future Enhancements
- [ ] Real-time composite preview during selection
- [ ] Drag-and-drop photo reordering
- [ ] Keyboard shortcuts for photo assignment (number keys)
- [ ] Photo filter/enhancement tools
- [ ] Batch session processing
- [ ] Multi-frame support (multiple frames in one session)
- [ ] Undo/redo during selection
- [ ] Photo tagging and rating system

## Version History

### Version 0.1.0-beta (Current)
**Status**: Beta - Photo Selection UI Feature Complete
**Release Date**: 2026-02-07
**Changes**: Initial Photo Booth implementation with photo selection UI, multi-camera support, and admin settings

**Highlights**:
- Complete Electron + React + TypeScript stack
- Canon EOS and Webcam camera support
- Photo selection UI with manual slot assignment
- Configurable extra photo captures
- Admin settings panel
- Frame-based photo composition
- QR code integration support (Phase 4-5 in progress)

**Stability**: Stable for core photo capture and selection workflows

**Testing**: Manual testing completed, automated test suite in progress

## Release Notes

### Beta 1 (2026-02-07)
- Photo Selection UI feature complete
- Settings IPC namespace added
- Webcam fallback support
- Admin controls for extra photo count
- Full TypeScript type safety
- Updated documentation

---

## Versioning

Photo Booth follows Semantic Versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes (e.g., data format changes)
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes and minor improvements

## Maintenance Notes

### Last Updated
2026-02-07 - Photo Selection UI implementation complete

### Next Review Date
Target: 2026-03-07 (one month after Photo Selection UI release)

### Review Checklist
- [ ] Verify photo grid performance with 10+ items
- [ ] Collect user feedback on selection UI/UX
- [ ] Assess composite quality and output
- [ ] Review error handling in real-world scenarios
- [ ] Plan Phase 2 enhancements (filters, batch processing, etc.)

## Contributing

When making changes:
1. Update this changelog in the "Unreleased" section
2. Use conventional commit messages (feat:, fix:, docs:, etc.)
3. Include version number when releasing
4. Add migration guide if changes affect existing data

Example entry format:
```markdown
### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description

### Removed
- Removed functionality
```

import { HashRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/home-screen'
import { AdminSettingsScreen } from './screens/admin-settings-screen'
import { AdminFrameListScreen } from './screens/admin-frame-list-screen'
import { AdminFrameEditorScreen } from './screens/admin-frame-editor-screen'
import { AdminCameraTestScreen } from './screens/admin-camera-test-screen'
import { UserFrameSelectionScreen } from './screens/user-frame-selection-screen'
import { UserCountdownSelectionScreen } from './screens/user-countdown-selection-screen'
import { UserCaptureSessionScreen } from './screens/user-capture-session-screen'
import { UserProcessingScreen } from './screens/user-processing-screen'
import { UserResultScreen } from './screens/user-result-screen'

export function App(): JSX.Element {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          {/* Home / Mode Selection */}
          <Route path="/" element={<HomeScreen />} />

          {/* Admin Settings Hub */}
          <Route path="/admin/settings" element={<AdminSettingsScreen />} />

          {/* Admin Routes (Phase 2) */}
          <Route path="/admin/frames" element={<AdminFrameListScreen />} />
          <Route path="/admin/frames/new" element={<AdminFrameEditorScreen />} />
          <Route path="/admin/frames/:id" element={<AdminFrameEditorScreen />} />

          {/* Admin Camera Test (Phase 3) */}
          <Route path="/admin/camera-test" element={<AdminCameraTestScreen />} />

          {/* User Routes (Phase 4) */}
          <Route path="/user/select-frame" element={<UserFrameSelectionScreen />} />
          <Route path="/user/countdown/:frameId" element={<UserCountdownSelectionScreen />} />
          <Route path="/user/capture/:frameId" element={<UserCaptureSessionScreen />} />
          <Route path="/user/processing" element={<UserProcessingScreen />} />
          <Route path="/user/result" element={<UserResultScreen />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

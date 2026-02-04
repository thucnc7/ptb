import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/home-screen'
import { AdminFrameListScreen } from './screens/admin-frame-list-screen'
import { AdminFrameEditorScreen } from './screens/admin-frame-editor-screen'

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          {/* Home / Mode Selection */}
          <Route path="/" element={<HomeScreen />} />

          {/* Admin Routes (Phase 2) */}
          <Route path="/admin/frames" element={<AdminFrameListScreen />} />
          <Route path="/admin/frames/new" element={<AdminFrameEditorScreen />} />
          <Route path="/admin/frames/:id" element={<AdminFrameEditorScreen />} />

          {/* User Routes (Phase 4) */}
          {/* <Route path="/user" element={<UserLayout />}>
            <Route path="select-frame" element={<UserFrameSelectionScreen />} />
            <Route path="capture" element={<UserCaptureScreen />} />
            <Route path="preview" element={<UserPreviewScreen />} />
            <Route path="processing" element={<UserProcessingScreen />} />
            <Route path="upload" element={<UserUploadScreen />} />
            <Route path="qr" element={<UserQrDisplayScreen />} />
          </Route> */}
        </Routes>
      </div>
    </BrowserRouter>
  )
}

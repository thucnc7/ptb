# Scout Report: Phase 3 - Canon Camera Integration

## 1. Current Project Structure

```
/Users/apple/Code/ptb/
├── src/
│   ├── main/
│   │   ├── index.ts                           # Main process entry, IPC registration
│   │   └── ipc-handlers/
│   │       └── frame-ipc-handlers.ts          # Frame CRUD IPC handlers pattern
│   ├── preload/
│   │   └── preload.ts                         # Context bridge API definitions
│   ├── renderer/
│   │   ├── App.tsx                            # React router setup
│   │   ├── main.tsx                           # Entry point
│   │   ├── screens/                           # Screen components
│   │   │   ├── home-screen.tsx
│   │   │   ├── admin-frame-list-screen.tsx
│   │   │   └── admin-frame-editor-screen.tsx
│   │   ├── components/                        # Reusable components
│   │   │   └── frame-card.tsx
│   │   └── services/                          # Renderer-side service wrappers
│   │       └── frame-service.ts
│   └── shared/
│       └── types/                             # Shared TypeScript types
│           ├── index.ts
│           ├── frame-types.ts
│           └── session-types.ts
└── package.json
```

## 2. Existing Patterns to Follow

### IPC Handler Pattern
- Export a `register*IpcHandlers()` function
- Use `ipcMain.handle('namespace:action', async handler)` pattern
- Namespace IPC channels: `frames:get-all`, `frames:create`, etc.
- Handle errors with throw (client catches)

### Preload Bridge Pattern
- Define `ElectronAPI` interface with typed methods
- Group related methods under namespaces: `frames: { getAll, create, ... }`
- Use `ipcRenderer.invoke()` for async calls
- Expose via `contextBridge.exposeInMainWorld('electronAPI', api)`

### Renderer Service Pattern
- Wrap `window.electronAPI.*` calls in typed functions
- Re-export types for convenience
- Include validation/utility functions

## 3. Current Dependencies

```json
{
  "dependencies": {
    "electron-store": "^8.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  }
}
```

## 4. Recommendations

1. **Follow existing IPC pattern exactly**
2. **Use main/index.ts registration pattern**
3. **Live view streaming via IPC (Buffer to Base64)**
4. **Camera service singleton pattern**
5. **Wrap all EDSDK calls in try/catch**

# Phase 1: Project Setup

**Parent Plan:** [plan.md](./plan.md)
**Status:** complete | **Priority:** P1 | **Effort:** 2h

## Overview

Khởi tạo Electron + React + TypeScript project với cấu trúc thư mục chuẩn, cấu hình build, và các dependencies cơ bản.

## Key Insights

- Electron 28+ hỗ trợ Node 20 với ES modules
- Vite nhanh hơn webpack cho Electron development
- TypeScript strict mode giúp catch bugs sớm

## Requirements

**Functional:**
- Electron app chạy được trên Windows
- Hot reload trong development
- Build thành executable

**Non-functional:**
- Startup time < 3s
- Memory < 200MB idle

## Architecture

```
src/
├── main/                    # Electron main process
│   ├── index.ts            # Entry point
│   └── preload.ts          # Preload script
├── renderer/               # React UI
│   ├── App.tsx
│   ├── main.tsx
│   ├── screens/            # Screen components
│   ├── components/         # Shared components
│   ├── services/           # Business logic
│   └── hooks/              # Custom hooks
├── shared/                 # Shared types/utils
│   └── types/
└── assets/
    └── frames/             # Frame templates
```

## Related Code Files

**Create:**
- `package.json` - Dependencies & scripts
- `tsconfig.json` - TypeScript config
- `electron.vite.config.ts` - Vite config for Electron
- `src/main/index.ts` - Main process entry
- `src/main/preload.ts` - Preload script
- `src/renderer/main.tsx` - Renderer entry
- `src/renderer/App.tsx` - Root component

## Implementation Steps

1. Init npm project với `npm init -y`
2. Install Electron + React + TypeScript dependencies
3. Install electron-vite cho build tooling
4. Setup tsconfig với strict mode
5. Tạo main process entry với BrowserWindow
6. Tạo preload script cho IPC
7. Setup React app với Tailwind CSS
8. Configure electron-builder cho packaging
9. Test dev mode và build

## Todo List

- [x] Initialize npm project
- [x] Install core dependencies (electron, react, typescript)
- [x] Install build tools (electron-vite, electron-builder)
- [x] Setup TypeScript configuration
- [x] Create main process files
- [x] Create renderer process files
- [x] Configure Tailwind CSS
- [x] Setup electron-builder config
- [x] Test development mode
- [ ] Test production build

## Success Criteria

- [x] `npm run dev` starts app với hot reload
- [ ] `npm run build` tạo Windows executable
- [x] No TypeScript errors
- [x] React component renders trong Electron window

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Native module compatibility | Test sharp, canvas sớm |
| Vite + Electron conflicts | Dùng electron-vite template |

## Security Considerations

- Enable contextIsolation trong BrowserWindow
- Disable nodeIntegration trong renderer
- Use preload script cho IPC

## Next Steps

→ [Phase 2: Frame Management](./phase-02-frame-management.md)

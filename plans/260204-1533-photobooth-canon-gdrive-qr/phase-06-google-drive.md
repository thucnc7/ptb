# Phase 6: Google Drive Upload

**Parent Plan:** [plan.md](./plan.md)
**Depends on:** [Phase 5](./phase-05-image-processing.md)
**Status:** pending | **Priority:** P1 | **Effort:** 2h

## Overview

Upload composite image lên Google Drive, tạo public share link để user download qua QR code.

## Key Insights

- OAuth 2.0 cho desktop app (không dùng service account)
- Scope `drive.file` đủ cho upload + share
- `webContentLink` cho direct download (không phải webViewLink)
- Organize theo folders: `/Photobooth/YYYY-MM-DD/`

## Requirements

**Functional:**
- One-time OAuth login
- Auto-refresh token
- Upload image to organized folder
- Make file public
- Return download link

**Non-functional:**
- Upload time < 10s cho 5MB image
- Handle network errors gracefully

## Architecture

```
┌─────────────────────────────────────────────┐
│           Renderer Process                   │
│  ┌───────────────┐  ┌───────────────────┐   │
│  │ UploadProgress│  │ LoginPrompt       │   │
│  └───────┬───────┘  └────────┬──────────┘   │
│          │                   │              │
│          └───────┬───────────┘              │
│                  ↓ IPC                      │
├─────────────────────────────────────────────┤
│           Main Process                       │
│  ┌───────────────────────────────────────┐  │
│  │         DriveService                   │  │
│  │  - authenticate()                     │  │
│  │  - upload(filePath)                   │  │
│  │  - makePublic(fileId)                 │  │
│  │  - getDownloadLink(fileId)            │  │
│  └───────────────┬───────────────────────┘  │
│                  ↓                          │
│  ┌───────────────────────────────────────┐  │
│  │    googleapis + google-auth-library   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Related Code Files

**Create:**
- `src/main/services/google-drive-service.ts`
- `src/main/ipc-handlers/drive-ipc-handlers.ts`
- `src/renderer/components/google-login-button.tsx`
- `src/renderer/components/upload-progress.tsx`
- `src/renderer/screens/user-upload-screen.tsx`

**Modify:**
- `package.json` - Add googleapis dependencies
- `.env.example` - Add Google OAuth credentials
- `src/main/index.ts` - Register IPC handlers

## Implementation Steps

1. Setup Google Cloud Project:
   - Create project in Google Console
   - Enable Drive API
   - Create OAuth 2.0 credentials (Desktop app)
   - Download client_secret.json
2. Install dependencies:
   ```bash
   npm install googleapis google-auth-library
   ```
3. Create GoogleDriveService:
   ```typescript
   class GoogleDriveService {
     async authenticate(): Promise<void>
     async isAuthenticated(): Promise<boolean>
     async upload(filePath: string, fileName: string): Promise<string>
     async makePublic(fileId: string): Promise<void>
     async getDownloadLink(fileId: string): Promise<string>
   }
   ```
4. Implement OAuth flow:
   - Open system browser for login
   - Listen on localhost for callback
   - Exchange code for tokens
   - Store refresh token securely
5. Implement folder structure:
   - Get or create "Photobooth" folder
   - Get or create date subfolder
   - Upload to date folder
6. Setup IPC handlers
7. Build upload progress UI

## Todo List

- [ ] Setup Google Cloud project
- [ ] Create OAuth credentials
- [ ] Install googleapis packages
- [ ] Create GoogleDriveService
- [ ] Implement OAuth flow
- [ ] Implement token storage
- [ ] Implement file upload
- [ ] Implement public sharing
- [ ] Setup IPC handlers
- [ ] Build upload progress UI
- [ ] Handle network errors
- [ ] Test full upload flow

## Success Criteria

- [ ] OAuth login mở browser và authenticate
- [ ] Token persist qua app restart
- [ ] File upload thành công
- [ ] File có public access
- [ ] Download link hoạt động

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| OAuth redirect issues | Test trên Windows sớm |
| Token revocation | Implement re-auth flow |
| Upload timeout | Add retry với exponential backoff |

## Security Considerations

- Store client_secret trong app resources (không commit)
- Store refresh token encrypted (use electron-store với encryption)
- Validate file before upload

## Code Snippet

```typescript
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

class GoogleDriveService {
  private oauth2Client: OAuth2Client;
  private drive: any;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/callback'
    );
  }

  async upload(filePath: string, fileName: string): Promise<string> {
    const folderId = await this.getOrCreateFolder();

    const response = await this.drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(filePath)
      },
      fields: 'id'
    });

    return response.data.id;
  }

  async makePublic(fileId: string): Promise<string> {
    await this.drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' }
    });

    const file = await this.drive.files.get({
      fileId,
      fields: 'webContentLink'
    });

    return file.data.webContentLink;
  }
}
```

## Next Steps

→ [Phase 7: QR Code Display](./phase-07-qr-display.md)

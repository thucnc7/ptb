# Google Drive API & QR Code Research Report

**Date:** 2026-02-04 | **Topic:** Drive API integration & QR code generation for Electron photobooth

---

## 1. Authentication Approach

### Recommendation: OAuth 2.0 (Not Service Account)

**Why OAuth for Electron:**
- Desktop apps cannot keep secrets (OAuth designed for this)
- User operates app directly → OAuth flow appropriate
- No server-side dependency required
- Standard for consumer desktop applications

**Why NOT Service Account:**
- Designed for backend/server-to-server
- Authenticates app, not user
- Requires sharing folders with service account email
- Added complexity without benefit

**OAuth 2.0 Flow:**
1. App opens system browser → Google login
2. User grants permissions
3. Redirect to localhost handler captures auth code
4. Exchange code for access + refresh tokens
5. Store refresh token for future sessions

**Scope Required:** `https://www.googleapis.com/auth/drive.file`
- Narrowly scoped (YAGNI principle)
- Only access files app creates/shares with user

---

## 2. Key Packages

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `googleapis` | ^65.x | Official Drive API client | Full-featured, well-maintained |
| `google-auth-library` | ^9.x | OAuth2 client | Handles token refresh automatically |
| `qrcode` | ^1.5.x | QR code generation | PNG/SVG/canvas support |
| `electron-oauth2` | ^4.x | OAuth helper | Simplifies Electron OAuth flow (optional) |

**Install:** `npm install googleapis google-auth-library qrcode`

---

## 3. File Upload Implementation

```javascript
// Basic upload structure
const drive = google.drive({ version: 'v3', auth: authClient });

await drive.files.create({
  requestBody: {
    name: 'photo.jpg',
    parents: [parentFolderId], // Drive folder ID
    mimeType: 'image/jpeg'
  },
  media: {
    mimeType: 'image/jpeg',
    body: fs.createReadStream(filePath) // or buffer
  },
  fields: 'id,webViewLink,webContentLink'
});
```

**Key Points:**
- Returns file ID, webViewLink (view), webContentLink (download)
- Use streams for large files (memory efficient)
- Set `parents` array to organize in folders

---

## 4. Share Link Generation

```javascript
// Make file publicly shareable
await drive.permissions.create({
  fileId: fileId,
  requestBody: {
    role: 'reader',
    type: 'anyone'  // Public access
  }
});

// Get public URL
const file = await drive.files.get({
  fileId: fileId,
  fields: 'webViewLink,webContentLink'
});
```

**URLs Provided:**
- `webViewLink` → Browse/view online (slower, with UI)
- `webContentLink` → Direct download (faster)

**For QR codes:** Use `webContentLink` for faster photo downloads

---

## 5. QR Code Generation

```javascript
const QRCode = require('qrcode');

// Generate data URL
const qrUrl = await QRCode.toDataURL(driveLink, {
  errorCorrectionLevel: 'H',  // Scan in low light
  type: 'image/png',
  width: 300,
  color: { dark: '#000000', light: '#ffffff' }
});

// Use in Electron: <img src={qrUrl} /> or print
```

**Options:**
- Error correction: L/M/Q/H (H = 30% recovery)
- Size: width/height in pixels
- Output: toDataURL (data URI), toFile (filesystem), toString (SVG/ASCII)

---

## 6. Electron App Architecture

```
Main Process (IPC):
  ├─ Camera capture → temp file
  ├─ Call renderProcess with photo path
  └─ Return: fileId, qrCodeDataURL

Renderer Process:
  ├─ Initialize OAuth (show login window)
  ├─ Upload photo to Drive
  ├─ Make public & get links
  ├─ Generate QR code
  └─ Display QR on screen
```

**Token Storage:** Use Electron securely-managed storage or keychain
- Don't store in plaintext config
- Refresh tokens survive app restarts

---

## 7. Critical Gotchas

1. **webViewLink only works with "view" permission** → Use `webContentLink` for downloads
2. **Permissions.create() can fail if file already public** → Check `webViewLink` first
3. **OAuth redirect URI must match exactly** → Use `http://localhost:3000/callback` (no trailing slash)
4. **QR code with long URLs** → Drive share links ~50-70 chars, fits in QR easily
5. **Stream exhaustion** → Don't reuse streams; create fresh one per upload
6. **Scope must include `drive.file`** → Read-only scope won't allow uploads
7. **Token expiry** → Refresh token has longer TTL but can be revoked; handle gracefully

---

## 8. Scope & Authorization Matrix

| Operation | Required Scope | Flow |
|-----------|----------------|------|
| Upload file | `drive.file` | Create + set parent |
| Make public | `drive.file` | Call permissions.create |
| Get share link | `drive.file` | Call files.get (fields=webViewLink) |
| Read existing | `drive.readonly` | Subset of drive.file |

**Best practice:** Request `drive.file` once at app start, handle token refresh in background

---

## 9. Dependencies Flow

```
User opens photobooth app
  ↓
OAuth login (one-time)
  ↓
Capture photo (Canon)
  ↓
Upload to Drive folder
  ↓
Make file public (1 permission call)
  ↓
Generate QR (milliseconds locally)
  ↓
Display QR on screen
  ↓
User scans → Drive download link
```

**Performance:** Upload largest bottleneck (~1-5s per photo), QR generation negligible (<10ms)

---

## 10. Recommended Implementation Order

1. Setup OAuth client credentials in Google Console
2. Implement OAuth flow in Electron (test token refresh)
3. Add Drive upload with folder organization
4. Implement public sharing + link retrieval
5. Add QR code generation & display
6. Test end-to-end flow

---

## Unresolved Questions

- Should folder structure be per-session or flat? (Needs design decision)
- Refresh token TTL & revocation handling strategy?
- QR code branding/logo overlay desired?
- Network error retry strategy for uploads?


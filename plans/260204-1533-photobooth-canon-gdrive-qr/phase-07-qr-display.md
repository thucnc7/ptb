# Phase 7: QR Code Display

**Parent Plan:** [plan.md](./plan.md)
**Depends on:** [Phase 6](./phase-06-google-drive.md)
**Status:** pending | **Priority:** P1 | **Effort:** 1h

## Overview

Generate QR code từ Google Drive download link và hiển thị cho user scan để download ảnh.

## Key Insights

- `qrcode` npm package nhanh và đơn giản
- Error correction level H cho scan trong low light
- QR size lớn để scan từ xa (photobooth)
- Auto-reset sau timeout để sẵn sàng cho user tiếp theo

## Requirements

**Functional:**
- Generate QR từ Drive download link
- Display QR lớn trên screen
- Show "Scan to download" instruction
- Auto-reset sau 30s timeout
- Manual "Done" button

**Non-functional:**
- QR generation < 100ms
- QR scannable từ 1m distance
- High contrast cho various lighting

## Architecture

```
Google Drive Link
       │
       ↓
┌──────────────┐
│  QR Code     │
│  Generator   │
│  (qrcode.js) │
└──────┬───────┘
       │ Data URL
       ↓
┌──────────────┐
│  QR Display  │
│  Screen      │
│  - Large QR  │
│  - Timer     │
│  - Done btn  │
└──────────────┘
```

## Related Code Files

**Create:**
- `src/renderer/screens/user-qr-display-screen.tsx`
- `src/renderer/components/qr-code-display.tsx`
- `src/renderer/components/session-timer.tsx`
- `src/renderer/services/qr-service.ts`

**Modify:**
- `package.json` - Add qrcode dependency

## Implementation Steps

1. Install qrcode: `npm install qrcode @types/qrcode`
2. Create qr-service:
   ```typescript
   async function generateQR(url: string): Promise<string> // returns data URL
   ```
3. Build qr-code-display component:
   - Large QR image (400x400px minimum)
   - High contrast colors
   - Border/padding cho scanning
4. Build user-qr-display-screen:
   - Final composite preview (small)
   - Large QR code
   - "Scan to download" text
   - Countdown timer (30s)
   - "Done" button
5. Implement auto-reset:
   - Timer countdown
   - Auto navigate to frame selection
   - Clean up session data

## Todo List

- [ ] Install qrcode package
- [ ] Create QR generation service
- [ ] Build QR display component
- [ ] Build QR screen với preview
- [ ] Add countdown timer
- [ ] Implement auto-reset
- [ ] Add "Done" button
- [ ] Test QR scanning
- [ ] Optimize QR size for distance

## Success Criteria

- [ ] QR generates từ Drive link
- [ ] QR scannable bằng phone camera
- [ ] Timer countdown hiển thị
- [ ] Auto-reset sau timeout
- [ ] "Done" button works

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| QR too small to scan | Test từ 1m distance |
| Low light scanning | Use error correction H |

## Security Considerations

- QR chỉ chứa public Drive link
- No sensitive data trong QR
- Session cleanup sau display

## Code Snippet

```typescript
import QRCode from 'qrcode';

export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}
```

```tsx
// QR Display Screen
function QRDisplayScreen({ downloadLink, onDone }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    generateQRCode(downloadLink).then(setQrDataUrl);
  }, [downloadLink]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          onDone();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl mb-8">Scan to Download!</h1>
      <img src={qrDataUrl} alt="QR Code" className="w-96 h-96" />
      <p className="mt-8 text-2xl">Auto-reset in {timeLeft}s</p>
      <button onClick={onDone} className="mt-4 btn-primary">
        Done
      </button>
    </div>
  );
}
```

## User Flow Complete

```
Frame Selection → Live Preview → Countdown → Capture (x N)
       ↓
Photo Preview → Confirm → Processing → Upload → QR Display
       ↓
   (Auto-reset after 30s) → Frame Selection (loop)
```

## Next Steps

Sau khi hoàn thành Phase 7:
1. Integration testing toàn bộ flow
2. UI polish và animations
3. Error handling edge cases
4. Performance optimization
5. Packaging và distribution

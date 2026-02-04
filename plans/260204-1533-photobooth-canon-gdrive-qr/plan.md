---
title: "Photobooth App - Canon Camera + Google Drive + QR"
description: "Windows desktop photobooth với Canon camera integration, frame management, GDrive upload và QR code download"
status: pending
priority: P1
effort: 16h
branch: main
tags: [electron, canon-edsdk, google-drive, qrcode, photobooth]
created: 2026-02-04
---

# Photobooth Application Implementation Plan

## Overview

Xây dựng ứng dụng Windows Desktop Photobooth sử dụng Electron với:
- Kết nối Canon camera qua EDSDK
- Quản lý frame với số lượng ảnh tùy chỉnh
- Live preview từ camera
- Auto upload lên Google Drive
- QR code để user download

## Architecture

```
┌────────────────────────────────────────────────────────┐
│              Electron App (React + TypeScript)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Frame   │ │  Photo   │ │  Image   │ │   QR     │   │
│  │ Manager  │ │ Capture  │ │ Process  │ │ Display  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │            │            │            │          │
│       └────────────┼────────────┼────────────┘          │
│                    │            │                       │
│              ┌─────┴─────┐ ┌────┴────┐                 │
│              │  Camera   │ │  Drive  │                 │
│              │  Service  │ │ Service │                 │
│              └─────┬─────┘ └────┬────┘                 │
└────────────────────┼────────────┼──────────────────────┘
                     │            │
                     ↓            ↓
              ┌──────────┐  ┌──────────┐
              │  Canon   │  │  Google  │
              │  EDSDK   │  │  Drive   │
              └──────────┘  └──────────┘
```

## Implementation Phases

| # | Phase | Status | Effort | Details |
|---|-------|--------|--------|---------|
| 1 | [Project Setup](./phase-01-project-setup.md) | ✅ complete | 2h | Electron + React + TypeScript scaffold |
| 2 | [Frame Management](./phase-02-frame-management.md) | ✅ complete | 3h | Admin UI để tạo/edit frames |
| 3 | [Canon Camera Integration](./phase-03-canon-camera.md) | ✅ complete | 4h | EDSDK wrapper, live view, capture |
| 4 | [Photo Capture Flow](./phase-04-photo-capture.md) | pending | 2h | Countdown, multi-capture sequence |
| 5 | [Image Processing](./phase-05-image-processing.md) | pending | 2h | Composite photos into frames |
| 6 | [Google Drive Upload](./phase-06-google-drive.md) | pending | 2h | OAuth, upload, share link |
| 7 | [QR Code Display](./phase-07-qr-display.md) | pending | 1h | Generate & display QR |

## Tech Stack

- **Runtime:** Electron 28+ với Node 20
- **UI:** React 18 + TypeScript + Tailwind CSS
- **Camera:** Canon EDSDK via `@aspect-ratio/napi-canon-cameras` hoặc custom wrapper
- **Image:** Sharp.js cho resize/composite
- **Cloud:** `googleapis` + `google-auth-library`
- **QR:** `qrcode` npm package

## Key Decisions

1. **Camera approach:** Direct EDSDK wrapper (không dùng server bridge) - đơn giản hơn cho photobooth
2. **Auth:** OAuth 2.0 cho Google Drive - user login một lần
3. **Frame storage:** JSON config + local image assets
4. **QR content:** `webContentLink` (direct download) thay vì `webViewLink`

## Dependencies

```json
{
  "electron": "^28.0.0",
  "react": "^18.2.0",
  "typescript": "^5.3.0",
  "sharp": "^0.33.0",
  "googleapis": "^65.0.0",
  "google-auth-library": "^9.0.0",
  "qrcode": "^1.5.0",
  "@aspect-ratio/napi-canon-cameras": "^1.0.0"
}
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Canon EDSDK không hỗ trợ camera model | High | Kiểm tra compatibility list trước |
| Native module packaging với Electron | Medium | Test electron-builder sớm |
| OAuth token expiry | Low | Implement refresh token handling |

## Success Criteria

- [ ] Admin có thể tạo/edit frames với số lượng ảnh tùy chỉnh
- [ ] Live preview hoạt động từ Canon camera
- [ ] Chụp đúng số lượng ảnh theo frame config
- [ ] Ảnh composite tự động upload lên Drive
- [ ] QR code hiển thị và scan được để download

## Research Reports

- [Canon EDSDK Research](./research/researcher-01-canon-edsdk.md)
- [Google Drive + QR Research](./research/researcher-02-gdrive-qrcode.md)

---

## Validation Log

### Session 1 — 2026-02-04
**Trigger:** Initial plan creation validation
**Questions asked:** 6

#### Questions & Answers

1. **[Risk]** Bạn đã có Canon camera và đã kiểm tra compatibility list chưa? Đây là risk cao nhất của project.
   - Options: Đã có camera, đã check compatible | Có camera, chưa check | Chưa có camera
   - **Answer:** Đã có camera, đã check compatible
   - **Rationale:** Risk chính đã được mitigate, có thể proceed với Phase 3

2. **[Architecture]** Khi không có internet, app nên xử lý upload thế nào?
   - Options: Queue & retry sau | Chỉ hiển thị QR local path | Block - bắt buộc internet
   - **Answer:** Queue & retry sau
   - **Rationale:** Cần thêm offline queue system trong Phase 6

3. **[Scope]** Admin và User mode nên tách biệt như thế nào?
   - Options: Password/PIN cho Admin | Keyboard shortcut ẩn | Không cần tách biệt
   - **Answer:** Custom - Tách thành 2 phase riêng biệt
   - **Custom input:** "1 cái là admin setup các thứ và 1 cái là khi bắt đầu run event thì lúc này sẽ là user sử dụng vậy nên sẽ chỉ hiển thị số lượng ảnh đã chụp, đếm giờ và sau khi chụp xong thì hiển thị thành phẩm ảnh đã ghép vào frame"
   - **Rationale:** User mode cần simplified UI - chỉ counter, timer, final preview

4. **[Scope]** Trong Admin setup, bạn muốn có tính năng nào ngoài quản lý frames?
   - Options: Chỉ Frame management | + Google Drive settings | + Camera settings | Tất cả trên
   - **Answer:** Custom - Tất cả + màn hình preview setup
   - **Custom input:** "có cả các cái trên cộng thêm 1 màn hình setup xem ở màn hình hiển thị cho user sẽ hiển thị như thế nào"
   - **Rationale:** Admin cần preview mode để xem user sẽ thấy gì

5. **[Tradeoffs]** Sau khi chụp xong và hiển thành phẩm, user có được chọn retake không?
   - Options: Có, retake từng ảnh | Có, chụp lại tất cả | Không, auto proceed
   - **Answer:** Có, retake từng ảnh
   - **Rationale:** Phase 4 cần implement per-photo retake UI

6. **[Tradeoffs]** Thời gian hiển thị QR trước khi auto-reset?
   - Options: 30 giây | 60 giây | Chờ user nhấn Done
   - **Answer:** Chờ user nhấn Done
   - **Rationale:** Không auto-reset, cần staff nhấn Done để reset session

#### Confirmed Decisions
- Camera compatibility: ✅ Verified
- Offline mode: Queue uploads for retry
- Admin/User separation: Distinct phases với simplified user UI
- Admin features: Frames + Drive + Camera + Preview mode
- Retake: Per-photo retake allowed
- QR timeout: Manual Done button (no auto-reset)

#### Action Items
- [ ] Phase 2: Add Admin preview mode để xem user UI
- [ ] Phase 4: Update UI - simplified (counter, timer only), add per-photo retake
- [ ] Phase 6: Add offline queue system
- [ ] Phase 7: Remove auto-reset, add manual Done button only

#### Impact on Phases
- **Phase 2**: Cần thêm "Preview Mode" cho admin xem user experience
- **Phase 4**: User UI cần simplified - chỉ hiện counter + timer, có retake từng ảnh
- **Phase 6**: Cần implement upload queue cho offline scenarios
- **Phase 7**: Bỏ auto-timeout, chỉ reset khi staff nhấn Done

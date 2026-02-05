# Báo cáo lỗi: Electron Startup Crash

## 1. Mô tả lỗi
Ứng dụng không thể khởi động và bị crash ngay lập tức với thông báo lỗi:
```
TypeError: Cannot read properties of undefined (reading 'whenReady')
```
Lỗi xảy ra tại dòng gọi `electron.app.whenReady()` trong file `src/main/index.ts`.

## 2. Nguyên nhân gốc rễ (Root Cause Analysis)
Qua quá trình systematic debugging, đã xác định được các nguyên nhân sau:

### A. Xung đột Module Resolution
- **Hiện tượng**: Lệnh `require('electron')` trả về một chuỗi ký tự (string path đến file executable) thay vì trả về object chứa API của Electron (như `app`, `BrowserWindow`).
- **Lý do**: Runtime của Electron đang resolve module `electron` tới file `node_modules/electron/index.js` (của npm package) thay vì module nội bộ (built-in) của Electron. Đây là hành vi bất thường vì module built-in luôn phải có độ ưu tiên cao hơn.
- **Bằng chứng**:
    - Log debug cho thấy `Resolved electron path: ...\node_modules\electron\index.js`.
    - Khi đổi tên file `node_modules/electron/index.js`, ứng dụng báo lỗi `MODULE_NOT_FOUND`, chứng tỏ Node resolution đang tìm file vật lý thay vì dùng module ảo của Electron.

### B. Môi trường khởi chạy (Launch Environment)
- **Hiện tượng**: `electron.exe` hoạt động như một Node.js runtime thông thường, không loading được các thành phần cốt lõi của Electron.
- **Bằng chứng**:
    - `process.type` trả về `undefined` (đúng ra phải là 'browser' trong Main process).
    - Lệnh `npx electron --version` ban đầu trả về version của Node (v24.x) thay vì version của Electron.
    - Sau khi dùng `cross-env ELECTRON_RUN_AS_NODE=` thì version đã hiển thị đúng, nhưng vấn đề resolution module vẫn chưa được giải quyết triệt để trên máy local.

## 3. Các biện pháp đã thử nghiệm
1. **Refactor Lazy Loading**: Chuyển các service (Camera, DCC Monitor) sang khởi tạo trễ để tránh race condition. Kết quả: Code sạch hơn nhưng không sửa được lỗi crash runtime.
2. **Update Electron**: Nâng cấp lên version mới nhất (v40.1.0) và cài lại `node_modules`.
3. **Debug Probe**: Thêm log chi tiết vào `src/main/index.ts` để theo dõi quá trình load module.
4. **Environment Fix**: Cấu hình lại `package.json` để đảm bảo không chạy ở chế độ Node (`ELECTRON_RUN_AS_NODE=`).

## 4. Trạng thái hiện tại
Lỗi vẫn chưa được khắc phục hoàn toàn trên môi trường local hiện tại. Có dấu hiệu cho thấy môi trường cài đặt `electron` cục bộ hoặc cache hệ thống đang gặp vấn đề khiến việc load module built-in bị chặn (shadowing).

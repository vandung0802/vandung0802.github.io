# TÀI LIỆU HANDOFF — APP DUYỆT CHI PVA 379
> Cập nhật: 30/06/2026 | Version: v15 | APP_VERSION: `20260630-v15` | SW VERSION: `20260630-8`

---

## 1. TỔNG QUAN

### URLs
- **App chính:** https://vandung0802.github.io/Duyet-Chi/app3.html
- **Alias root:** https://vandung0802.github.io/ (index.html = app3.html)

### 2 Repo GitHub Pages — push CẢ HAI mỗi lần
| Repo | Local path | URL |
|------|-----------|-----|
| `vandung0802/Duyet-Chi` | `C:\Users\Vo Van Dung\Duyet-Chi\` | `/Duyet-Chi/` |
| `vandung0802/vandung0802.github.io` | `C:\Users\Vo Van Dung\vandung0802.github.io\` | `/` |

### File nguồn — CHỈ sửa file này
`F:\nháp\379 duyệt chi\tóm tắt chuyển pro\app3.html`

### Cloud Functions (local only, KHÔNG git remote, KHÔNG push lên GitHub)
`C:\Users\Vo Van Dung\dc-functions\`

---

## 2. QUY TRÌNH PUSH

```powershell
# B1. Copy file nguồn sang 2 repo
cp "F:/nháp/379 duyệt chi/tóm tắt chuyển pro/app3.html" "C:/Users/Vo Van Dung/Duyet-Chi/app3.html"
cp "F:/nháp/379 duyệt chi/tóm tắt chuyển pro/app3.html" "C:/Users/Vo Van Dung/vandung0802.github.io/index.html"

# B2. Bump SW version (thay số cũ → số mới)
sed -i "s/VERSION = '20260630-8'/VERSION = '20260630-9'/" "C:/Users/Vo Van Dung/Duyet-Chi/sw.js"
cp "C:/Users/Vo Van Dung/Duyet-Chi/sw.js" "C:/Users/Vo Van Dung/vandung0802.github.io/sw.js"

# B3. Commit + push cả 2 repo
cd "C:/Users/Vo Van Dung/Duyet-Chi" && git add app3.html sw.js && git commit -m "..." && git push
cd "C:/Users/Vo Van Dung/vandung0802.github.io" && git add index.html sw.js && git commit -m "..." && git push
```

> Mỗi lần push phải tăng VERSION sw.js. App tự kiểm tra ETag sau 5 giây → tự reload nếu có bản mới.

---

## 3. KIẾN TRÚC KỸ THUẬT

### Stack
- **Frontend:** Vanilla JS + HTML + CSS — single file `app3.html`
- **Backend:** Firebase Realtime Database + Firebase Auth (email/password)
- **Push notification:** Firebase Cloud Functions + VAPID Web Push
- **PWA:** Service Worker `sw.js` — `skipWaiting()` + `clients.claim()`
- **Hosting:** GitHub Pages (2 repo)
- **Google Sheets:** Apps Script tích hợp (sync dữ liệu sang sheet)

### Firebase Data Structure
```
duyetchi/
  meta/        → { persons[], sites[], sheetUrl }
  proposals/   → { [id]: proposalObject }
  images/      → { [id]: { imgImages[], proofImages[] } }
```

### 3 Firebase Listeners (tách riêng — không reload ảnh khi duyệt chi)
```js
db.ref('duyetchi/meta').on('value', ...)       // realtime
db.ref('duyetchi/proposals').on('value', ...)  // realtime
db.ref('duyetchi/images').once('value', ...)   // chỉ tải 1 lần lúc khởi động
```

### Roles
| Key | Tên | Quyền |
|-----|-----|-------|
| `dung` | D Dũng | Duyệt D, xem tất cả, xóa phiếu |
| `hien` | H Hiền | Duyệt H, xem tất cả |
| `trang` | T Trang | Chuyển tiền |
| `other` | Khác | Chỉ xem |

### localStorage keys
| Key | Nội dung |
|-----|---------|
| `dc_role_{uid}` | Cache role → instant login (ẩn màn hình login ngay) |
| `dc_proposals` | Cache danh sách đề xuất |
| `dc_persons` | Cache danh sách người |
| `dc_sites` | Cache danh sách công trình |
| `dc_sheetUrl` | URL Google Sheet |
| `app_version` | Version — dùng clear cache khi lên bản |
| `_page_etag` | ETag — dùng cho auto-reload |
| `dc_notif_seen` | Danh sách ID thông báo đã đọc |

---

## 4. CẤU TRÚC MÀN HÌNH

### 4 Tab chính (bottom nav)
```
📋 Danh sách (home)  |  ➕ Thêm mới (add)  |  📊 Báo cáo (report)  |  ⚙️ Cài đặt (settings)
```
+ nút Thoát (đăng xuất role)

### Tab Danh sách
- 7 ô thống kê (stat boxes): **Tất cả | Chờ duyệt | D duyệt | H duyệt | Đã duyệt | Từ chối | Đã chuyển**
- Ô ID Firebase: `st-all`, `st-pending`, `st-d`, `st-h`, `st-approved`, `st-rejected`, `st-done`
- Filter key: `all`, `pending`, `d_only`, `h_only`, `approved`, `rejected`, `transferred`
- Thanh tìm kiếm `#search-input`
- Danh sách card `#proposal-list`

### Tab Báo cáo — 5 sub-tabs
```
📝 Tóm tắt  |  📋 Danh sách  |  💸 Đã chuyển  |  ⏳ Chưa chuyển  |  ❌ Từ chối
```
- Filter by: **Người** (dropdown) + **Công trình** (dropdown)
- Tóm tắt: thẻ thống kê + bảng theo nhóm trạng thái (thứ tự: Việc gấp → Chờ duyệt → Đã duyệt chờ chuyển → Đã chuyển)
- Tất cả bảng có cột STT đánh số từ dưới lên (hàng cũ nhất = 1)
- Double-tap hàng → nhảy đến card trong tab Danh sách
- Nút **Sao chép gửi Zalo** ở cuối tab Tóm tắt

### Tab Thêm mới
- Upload ảnh Zalo (nhiều file)
- Paste ảnh từ clipboard
- Dropdown Người, Công trình
- Ưu tiên: Bình thường / Gấp / Có thể chờ

### Tab Cài đặt
- Thông tin tài khoản, đổi mật khẩu
- Quản lý danh sách Người + Công trình
- Cài đặt thông báo push (FCM)
- URL Google Sheet

### Modals
| Modal | ID | Mô tả |
|-------|----|-------|
| Sửa đề xuất | `edit-modal` | Chỉnh sửa khi status=pending |
| Nhập số tiền duyệt | `approve-amount-modal` | D/H nhập số tiền approve |
| Nhập số tiền chuyển | `transfer-amount-modal` | T nhập số tiền chuyển |
| Xem ảnh phóng to | `img-modal` | Xem + tải ảnh, điều hướng prev/next |
| Action menu ảnh | `img-action-menu` | Copy / Tải / Xóa ảnh (long press) |

---

## 5. CÁC HÀM QUAN TRỌNG

### Khởi tạo & Auth
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `initAuth()` | 1305 | Khởi tạo Firebase Auth listener |
| `initFirebaseSync()` | 1612 | Khởi tạo 3 listener Firebase |
| `_mergeAndRender()` | 1617 | Merge meta+proposals+images → render |
| `setRole(role)` | 1381 | Set role + `_cardCache.clear()` + renderAll |
| `logoutRole()` | 1363 | Đăng xuất role, xóa cache role, về màn login |
| `trackOnline(uid,name,role)` | 1270 | Ghi trạng thái online lên Firebase |
| `listenOnlineUsers()` | 1281 | Lắng nghe ai đang online |
| `showOtpScreen(uid,name)` | 1217 | Màn hình OTP xác nhận đăng ký |
| `verifyOtp(uid)` | 1228 | Xác nhận OTP đăng ký |
| `enableNotifications(role)` | 1427 | Bật push notification, yêu cầu quyền + đăng ký FCM |
| `updateFbBadge(ok)` | 1759 | Cập nhật badge trạng thái kết nối Firebase (icon trên header) |

### Render chính
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `renderAll()` | 1876 | Debounce 80ms → renderProposals + renderStats + updateNotifBadge |
| `renderStats()` | 1995 | Cập nhật 7 ô thống kê |
| `renderProposals()` | 2017 | Render danh sách card |
| `renderCard(p)` | 2062 | Cache wrapper dùng `_cardHash` |
| `_buildCard(p)` | 2070 | Build HTML card thực sự |
| `showPage(pg, btn)` | 1849 | Chuyển tab chính |
| `setFilter(f, el)` | 2010 | Lọc danh sách theo stat box |
| `matchFilter(p, f)` | 1982 | Logic lọc proposal |
| `populateSelects()` | 3167 | Fill dropdown người/công trình |
| `renderSettings()` | 3261 | Render tab cài đặt |

### Card — nút theo role
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `renderBtnD(p)` | 2180 | Nút D duyệt / từ chối / undo |
| `renderBtnH(p)` | 2204 | Nút H duyệt / từ chối / undo |
| `renderBtnReject(p)` | 2228 | Nút từ chối (D hoặc H) |
| `renderBtnTransfer(p)` | 2265 | Nút T chuyển tiền |
| `renderBtnShare(p)` | 2284 | Nút chia sẻ |

### Xử lý duyệt & chuyển tiền
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `approveBy(id, field)` | 2331 | Mở modal nhập số tiền duyệt |
| `confirmApproveAmount()` | 2361 | Xác nhận duyệt với số tiền |
| `undoApprove(id, field)` | 2397 | Huỷ duyệt |
| `doTransfer(id)` | 2435 | Mở modal nhập số tiền chuyển |
| `confirmTransferAmount()` | 2460 | Xác nhận chuyển tiền |
| `undoTransfer(id)` | 2312 | Huỷ lần chuyển gần nhất |
| `rejectBy(id, who)` | 2505 | Từ chối (D hoặc H) |
| `undoRejectBy(id, who)` | 2526 | Huỷ từ chối |
| `changeStatus(id, status)` | 2554 | Đổi status đề xuất thủ công |
| `shareProof(id)` | 2491 | Chia sẻ ảnh chứng từ (Web Share API) |

### Helper tính toán — QUAN TRỌNG
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `getOfficialApprovedAmount(p)` | 2302 | Số tiền được duyệt chính thức (min của D và H nếu cả 2 duyệt) |
| `getTotalTransferred(p)` | 2307 | Tổng đã chuyển (sum của p.transfers[].amount) |
| `getFilteredProposals()` | 3383 | Lọc proposals theo filter người + công trình trong báo cáo |
| `jumpToProposal(id)` | 3334 | Nhảy đến card (chuyển sang tab Danh sách, scroll đến card) |
| `fmtVND(n)` | 1775 | Format tiền: `1.000.000 đ` |
| `fmt(n)` | 1765 | Format số không có đơn vị |
| `fmtT(ts)` | 1793 | Format giờ: `07:30` |
| `fmtFull(ts)` | 1794 | Format giờ + ngày đầy đủ |
| `showToast(msg)` | 3964 | Hiện toast thông báo nhỏ |

### Firebase & Data
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `pushToFirebase()` | 1541 | Push dữ liệu lên Firebase (chỉ push phần thay đổi) |
| `save()` | 1522 | Lưu vào localStorage + pushToFirebase |
| `migrateAmountsToVND()` | 1777 | Migration dữ liệu cũ sang format VND |
| `submitProposal()` | 3101 | Thêm đề xuất mới |
| `openEditProposal(id)` | 2590 | Mở modal sửa đề xuất |
| `saveEditProposal()` | 2721 | Lưu chỉnh sửa |
| `del(id)` | 2576 | Xóa đề xuất |

### Ảnh
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `compressImage(file)` | 918 | Compress về max 600px, WebP 0.65 |
| `handleImg(input)` | 2754 | Xử lý upload ảnh Zalo |
| `pasteImgFromClipboard(target)` | 2627 | Paste ảnh từ clipboard |
| `uploadProof(id)` | 3019 | Upload ảnh chứng từ |
| `addProofImages(id, files)` | 3031 | Thêm ảnh chứng từ |
| `removeProofImage(id, idx)` | 3075 | Xóa ảnh chứng từ |
| `removeZaloImage(id, idx)` | 3084 | Xóa ảnh Zalo |
| `openImg(id, type, idx)` | 2914 | Mở modal xem ảnh phóng to |
| `attachLongPress(el,...)` | 867 | Long press ảnh → menu Copy/Tải/Xóa |
| `attachThumbLongPress(container)` | 2034 | Gắn long press cho tất cả thumbnail |

### Báo cáo
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `setReportTab(tab, btn)` | 3316 | Chuyển sub-tab báo cáo |
| `_renderReportTab(tab)` | 3325 | Render tab báo cáo đang active |
| `renderReportFilters()` | 3370 | Render dropdown filter người + công trình |
| `applyReportFilter()` | 3389 | Áp dụng filter người + công trình → re-render tab đang active |
| `getFilteredProposals()` | 3383 | Lấy proposals đã lọc theo người + công trình |
| `renderReportSummary()` | 3572 | Tab Tóm tắt |
| `renderReportList()` | 3447 | Tab Danh sách |
| `renderReportTables()` | 3396 | Tab Đã chuyển / Chưa chuyển |
| `renderReportRejected()` | 3407 | Tab Từ chối |
| `renderExcelTable(...)` | 3504 | Render bảng excel-style (dùng trong Đã/Chưa chuyển) |
| `generateReport()` | 3681 | Tạo text báo cáo dạng Zalo |
| `copyReport()` | 3722 | Copy báo cáo vào clipboard |
| `attachReportDoubleTap(el)` | 3355 | Gắn double-tap cho bảng báo cáo |

### Thông báo
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `updateNotifBadge()` | 1914 | Cập nhật badge số thông báo chưa đọc |
| `toggleNotifPanel()` | 1925 | Mở/đóng panel thông báo (🔔) |
| `renderNotifPanel()` | 1949 | Render danh sách thông báo |
| `fcmRegister(role)` | 1407 | Đăng ký push notification (FCM) |
| `sendPushNotif(title,body,roles)` | 1501 | Gửi push qua Cloud Functions |
| `clearAllNotifs()` | 1818 | Xóa badge + đóng notification cũ |

### Cài đặt & quản lý tài khoản
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `doUpdateRole()` | 3223 | Cập nhật tên/role người dùng trong cài đặt |
| `doChangePassword()` | 3237 | Đổi mật khẩu Firebase Auth |

### Google Sheets sync
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `syncToSheet(p)` | 3776 | Sync đề xuất mới lên Sheet |
| `syncStatusToSheet(id,status)` | 3791 | Sync trạng thái lên Sheet |
| `syncEditToSheet(p)` | 3810 | Sync sửa đề xuất lên Sheet (**⚠️ BUG: định nghĩa 2 lần tại dòng 3810 và 3823**) |
| `syncDeleteToSheet(id)` | 3801 | Sync xóa đề xuất lên Sheet |
| `syncApprovalToSheet(...)` | 3836 | Sync duyệt lên Sheet |
| `syncRejectedByToSheet(p,who)` | 3879 | Sync từ chối lên Sheet |
| `syncTransferToSheet(p)` | 3865 | Sync chuyển tiền lên Sheet |
| `saveSheet()` | 3749 | Lưu URL sheet |
| `updateSheetBadge()` | 3767 | Cập nhật badge trạng thái kết nối Sheet |

### Google Apps Script (nhúng trong app3.html — ở cuối file)
| Hàm | Dòng | Mô tả |
|-----|------|-------|
| `copyScript()` | 3888 | Copy code Apps Script vào clipboard |
| `openApp()` | 3890 | Mở URL Google Sheet |
| `doGet(e)` | 3891 | Handler Apps Script (không chạy trên browser) |

---

## 6. BIẾN TOÀN CỤC QUAN TRỌNG

| Biến | Dòng | Giá trị init | Mô tả |
|------|------|-------------|-------|
| `fbConnected` | 845 | `false` | Kết nối Firebase |
| `fbInitialLoadDone` | 846 | `false` | True sau khi load xong lần đầu |
| `persons` | 850 | `[]` | Danh sách người (từ Firebase meta) |
| `sites` | 851 | `[]` | Danh sách công trình (từ Firebase meta) |
| `sheetUrl` | 852 | `''` | URL Google Sheet |
| `filter` | 853 | `'all'` | Filter đang active ở tab Danh sách |
| `currentRole` | 1083 | `''` | Role hiện tại (dung/hien/trang/other) |
| `lastPushedSnapshot` | 1539 | `null` | Snapshot lần push cuối (diff-based push) |
| `PRIORITY_ORDER` | 1865 | `{urgent:0, normal:1, low:2}` | Thứ tự ưu tiên sort |
| `hasCachedSession` | 1839 | auto-detect | True nếu có `dc_role_*` trong localStorage → ẩn màn login ngay lập tức |

### Instant login (`hasCachedSession`)
```js
// Dòng 1839-1840
const hasCachedSession = Object.keys(localStorage).some(k => k.startsWith('dc_role_'));
if (hasCachedSession) document.getElementById('login-screen').style.display = 'none';
```
→ App ẩn login ngay khi có cache, Firebase Auth sẽ restore session async sau.

---

## 6b. LOGIC HÀM TÍNH TIỀN — CHÍNH XÁC

### `getOfficialApprovedAmount(p)` — dòng 2302
```js
const h = parseFloat(p.approvedHAmount) || 0;
const d = parseFloat(p.approvedDAmount) || 0;
return h > 0 ? h : d;
// H amount nếu H đã duyệt với số tiền, ngược lại lấy D amount
```

### `getTotalTransferred(p)` — dòng 2307
```js
if (!Array.isArray(p.transfers)) return 0;
return p.transfers.reduce((a, t) => a + (parseFloat(t.amount) || 0), 0);
```

### `pushToFirebase()` — dòng 1541 — diff-based
```js
// Chỉ push nếu:
// 1. fbInitialLoadDone === true (tránh ghi đè trước khi load xong)
// 2. JSON.stringify(current) !== lastPushedSnapshot
// → chỉ push phần proposals thay đổi, không push lại toàn bộ
```

---

## 6c. CARD CACHE — CHI TIẾT

```js
const _cardCache = new Map();
function _cardHash(p){
  // PHẢI có currentRole ở đầu — thiếu → nút D bị khóa sai
  return currentRole+'|'+p.id+'|'+p.status+'|'+p.amount+'|'+p.ts
    +'|'+(p.approvedDAmount||0)+'|'+(p.approvedHAmount||0)
    +'|'+(p.priority||'')
    +'|'+(p.transfers?p.transfers.length:0)
    +'|'+(p.imgImages?p.imgImages.length:0)
    +'|'+(p.proofImages?p.proofImages.length:0);
}
// setRole() PHẢI gọi _cardCache.clear() — đã có sẵn ở dòng 1384
```

### Flags quan trọng
| Biến | Dòng | Mô tả |
|------|------|-------|
| `fbInitialLoadDone` | 846 | False cho đến khi Firebase load lần đầu xong — tránh ghi đè dữ liệu |
| `lastPushedSnapshot` | 1539 | Snapshot lần push cuối — chỉ push phần thay đổi, không push lại toàn bộ |
| `_renderAllPending` | ~1870 | True khi edit modal đang mở — hoãn renderAll đến khi modal đóng |
| `currentRole` | 1083 | Role hiện tại — ảnh hưởng đến nút trong card, PHẢI có trong `_cardHash` |

---

## 7. CẤU TRÚC DỮ LIỆU PROPOSAL

```js
{
  id: string,
  desc: string,           // Tên đề xuất
  person: string,         // Người đề xuất (dropdown)
  site: string,           // Công trình (dropdown)
  amount: number,         // Số tiền đề xuất (VND)
  note: string,
  priority: 'normal'|'urgent'|'low',
  status: 'pending'|'approved'|'rejected'|'transferred',
  ts: timestamp,

  // D duyệt
  approvedD: boolean,
  approvedDAmount: number,
  approvedDAt: timestamp,
  rejectedByD: { reason, ts },

  // H duyệt
  approvedH: boolean,
  approvedHAmount: number,
  approvedHAt: timestamp,
  rejectedByH: { reason, ts },

  // T chuyển tiền — nhiều lần
  transfers: [{ amount, note, ts, by }],

  // Ảnh (tách vào node 'images' riêng trong Firebase)
  imgImages: [base64...],    // Ảnh Zalo gốc
  proofImages: [base64...],  // Ảnh chứng từ thanh toán
}
```

### Objects hằng số
```js
// Dòng 1086
const ROLES = { dung: {...}, hien: {...}, trang: {...}, other: {...} }

// Dòng 1515
const STATUS = {
  pending: { label:'Chờ duyệt', badge:'badge-wait', icon:'⏳ ⏳' },
  approved: { label:'Đã duyệt', badge:'badge-ok', icon:'✅' },
  rejected: { label:'Từ chối', badge:'badge-no', icon:'❌' },
  transferred: { label:'Đã chuyển', badge:'badge-done', icon:'💸' },
}
```

---

## 8. TÍNH NĂNG ĐÃ LÀM

### Cốt lõi
- [x] Thêm / sửa / xóa đề xuất chi phí
- [x] Upload ảnh Zalo + chứng từ (nhiều ảnh, compress 600px/WebP 0.65)
- [x] Paste ảnh từ clipboard
- [x] Long press thumbnail → Copy / Tải / Xóa
- [x] Xem ảnh phóng to, điều hướng prev/next, tải về
- [x] D duyệt + H duyệt (số tiền độc lập)
- [x] T chuyển tiền nhiều lần (partial transfer)
- [x] Từ chối có ghi lý do (D hoặc H)
- [x] Undo duyệt, undo chuyển, undo từ chối
- [x] Push notification FCM + VAPID (Cloud Functions)
- [x] PWA — cài về màn hình, offline qua localStorage
- [x] Đăng ký tài khoản có OTP xác nhận
- [x] Quên mật khẩu (Firebase reset email)
- [x] Theo dõi ai đang online
- [x] Sync dữ liệu sang Google Sheets
- [x] Nhiều người dùng đồng thời (Firebase realtime)

### Hiệu năng
- [x] Card HTML cache `_cardCache` — tránh rebuild DOM
- [x] `_cardHash` bao gồm `currentRole` — tránh cache sai
- [x] Ảnh load 1 lần duy nhất `.once()` (không `.on()`)
- [x] Báo cáo lazy render — chỉ render tab active
- [x] Debounce 80ms cho `renderAll()`
- [x] `renderStats()` gọi trực tiếp (không qua debounce) sau Firebase load
- [x] `pushToFirebase()` chỉ push phần thay đổi (diff với lastPushedSnapshot)

### UX
- [x] Instant login — ẩn màn login ngay nếu có cache role
- [x] Double-tap bảng báo cáo → nhảy đến card
- [x] Cuộn dọc bảng báo cáo dài
- [x] STT trên tất cả bảng báo cáo (đánh từ dưới lên)
- [x] Thứ tự bảng Tóm tắt: Việc gấp → Chờ duyệt → Đã duyệt chờ chuyển → Đã chuyển

### Bug đã fix
- [x] Thống kê = 0 (timing Firebase + card cache)
- [x] Nút D bị khóa 🔒 (thiếu `currentRole` trong `_cardHash`)
- [x] "Đã duyệt chờ chuyển" hiện sai món đã chuyển đủ tiền
- [x] "VIỆC GẤP" hiện món đã chuyển đủ tiền
- [x] Xóa app.html, app2.html, index.html cũ

### Auto-update
- [x] `sw.js` có `VERSION` thay đổi mỗi lần push
- [x] `controllerchange` event → tự reload khi SW mới active
- [x] ETag check sau 5 giây → tự reload nếu server có bản mới

---

## 8b. BUG & CODE CÒN DƯ (chưa fix)

### ⚠️ Bug: `syncEditToSheet` định nghĩa 2 lần
```js
// Dòng 3810: function syncEditToSheet(p) { ... }
// Dòng 3823: function syncEditToSheet(p) { ... }  ← trùng!
// JS lấy định nghĩa thứ 2, cái đầu bị ghi đè.
// Cần xóa bỏ 1 trong 2.
```

### Code leftover (không dùng nữa, có thể xóa)
| Hàm | Dòng | Lý do leftover |
|-----|------|---------------|
| `_observeImageCards()` | 1719 | Lazy load ảnh cũ — đã bỏ lazy load ảnh |
| `_loadImagesForProposal()` | 1738 | Lazy load ảnh cũ — đã bỏ |
| `uploadToStorage()` | 833 | Firebase Storage upload — chưa dùng (ảnh vẫn là base64 trong RTDB) |

### UI element
| Element | ID/Class | Dòng | Mô tả |
|---------|---------|------|-------|
| Banner nhắc bật thông báo | `#notif-remind-banner` | 455 | Hiện khi chưa bật push notification |

---

## 9. VIỆC CÒN PENDING

| Việc | Ưu tiên | Ghi chú |
|------|---------|---------|
| Nút "Đề xuất duyệt lại" cho phiếu cũ chưa được duyệt | Cao | User vừa đề xuất, chưa bàn xong |
| Firebase Storage thay base64 trong RTDB | Trung bình | Ảnh base64 chậm, tốn băng thông |
| Theme 3D / TPBank purple-gold style | Thấp | User xem mockup, chưa chốt |

---

## 10. SERVICE WORKER

```js
// sw.js — tăng VERSION mỗi lần push
const VERSION = '20260630-8';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim().then(() =>
    self.clients.matchAll({type:'window'}).then(all =>
      all.forEach(c => c.postMessage('SW_RELOAD'))
    )
  ));
});
// + push / notificationclick / message (CLEAR_BADGE, SET_BADGE) handlers
```

SW tại: `Duyet-Chi/sw.js` và `vandung0802.github.io/sw.js`

---

## 11. CONFIG & THÔNG TIN TÀI KHOẢN

| Thứ | Vị trí |
|-----|--------|
| Firebase config | Dòng ~798 trong app3.html |
| VAPID Public Key | Dòng ~1396 trong app3.html |
| APP_VERSION | Dòng 807: `'20260630-v15'` |
| SW VERSION | `sw.js` dòng 1: `'20260630-8'` |
| Email admin | vandung0802@gmail.com |

---

## 12. RÀNG BUỘC BẮT BUỘC

1. **KHÔNG thay đổi kích thước chữ và nút** — chỉ được thay màu/hiệu ứng nếu làm theme
2. **Ảnh luôn phải hiển thị** — không lazy load ẩn ảnh
3. **Push CẢ 2 repo** sau mỗi thay đổi + bump VERSION sw.js
4. **Tự test, không hỏi user** — push xong tự kiểm tra
5. `currentRole` PHẢI có trong `_cardHash`
6. `setRole()` PHẢI gọi `_cardCache.clear()`
7. Ảnh dùng `.once()` không phải `.on()`
8. `pushToFirebase()` kiểm tra `fbInitialLoadDone` trước khi push

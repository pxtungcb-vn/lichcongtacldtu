# Lịch công tác online — Thường trực Tỉnh uỷ Cao Bằng

Ứng dụng web gồm 2 trang:

- **`index.html`** — Trang xem lịch công tác, **công khai cho mọi người**, tự động cập nhật ngay khi có thay đổi (không cần tải lại trang), hiển thị đẹp trên cả máy tính và điện thoại.
- **`admin.html`** — Trang nhập/sửa lịch công tác, **chỉ dành cho người có trách nhiệm** (Lãnh đạo Văn phòng Tỉnh uỷ hoặc Thư ký), yêu cầu đăng nhập.

Dữ liệu được lưu trên **Firebase** (dịch vụ máy chủ miễn phí của Google) — đây là lý do trang xem lịch cập nhật theo thời gian thực. Mã nguồn giao diện được đăng công khai trên **GitHub Pages**.

> Chi phí: với quy mô dùng nội bộ (vài người nhập liệu, vài trăm/nghìn lượt xem mỗi tháng), gói **miễn phí (Spark)** của Firebase là quá đủ, không tốn phí.

---

## PHẦN A — Thiết lập Firebase (làm 1 lần)

### Bước 1: Tạo project Firebase

1. Vào https://console.firebase.google.com, đăng nhập bằng tài khoản Google của anh.
2. Bấm **"Add project" / "Thêm dự án"**.
3. Đặt tên, ví dụ: `lich-cong-tac-caobang` → Continue.
4. Tắt Google Analytics (không cần dùng) → **Create project**.

### Bước 2: Tạo Firestore Database (nơi lưu dữ liệu)

1. Trong menu bên trái, chọn **Build > Firestore Database**.
2. Bấm **Create database**.
3. Chọn khu vực gần Việt Nam, ví dụ `asia-southeast1 (Singapore)`.
4. Chọn **Start in production mode** → Enable.
5. Vào tab **Rules**, xoá hết nội dung mẫu, dán toàn bộ nội dung file **`firestore.rules`** (đi kèm trong bộ mã nguồn này) vào, rồi bấm **Publish**.

### Bước 3: Bật đăng nhập bằng Email/Password

1. Menu bên trái: **Build > Authentication** → **Get started**.
2. Tab **Sign-in method** → chọn **Email/Password** → **Enable** → **Save**.
3. Qua tab **Users** → **Add user** → nhập email + mật khẩu cho **từng người** sẽ nhập liệu (ví dụ Lãnh đạo Văn phòng, Thư ký). Có thể thêm bao nhiêu tài khoản cũng được.
   - *Lưu ý:* đây là nơi **duy nhất** kiểm soát ai được nhập liệu. Ứng dụng không có trang "đăng ký" công khai — chỉ quản trị viên (anh) mới thêm được tài khoản mới tại đây.

### Bước 4: Lấy thông tin cấu hình (config) để dán vào mã nguồn

1. Bấm icon **⚙️ (Project settings)** ở góc trên trái.
2. Kéo xuống phần **Your apps**, bấm icon **`</>`** (Web) để tạo một Web app.
3. Đặt tên (ví dụ "Lich cong tac web") → **Register app** (không cần Firebase Hosting).
4. Firebase sẽ hiện một đoạn mã `firebaseConfig = { apiKey: ..., authDomain: ..., ... }`.
5. Mở file **`firebase-config.js`** trong bộ mã nguồn, thay các giá trị `DIEN_API_KEY_CUA_BAN`, `TEN_PROJECT`, ... bằng đúng giá trị Firebase vừa cho. Lưu file lại.

> Các giá trị này **không phải thông tin bí mật** — để công khai trên GitHub là an toàn, vì quyền truy cập thực sự do Firestore Rules (Bước 2.5) và Authentication (Bước 3) kiểm soát, không phải do giấu config.

---

## PHẦN B — Đăng mã nguồn lên GitHub (GitHub Pages)

Claude sẽ hỗ trợ bước này trực tiếp (tạo repository, đẩy mã nguồn, bật GitHub Pages) sau khi anh kết nối tài khoản GitHub với Claude trong **Settings → Connectors** của claude.ai.

Nếu anh muốn tự làm:

1. Vào https://github.com/new, tạo repository mới, ví dụ `lich-cong-tac-online`, để **Public**.
2. Tải toàn bộ các file trong bộ mã nguồn này lên (dùng "Add file > Upload files" trên GitHub, hoặc Git nếu quen dùng).
3. Vào **Settings > Pages** của repository → ở "Build and deployment", chọn **Source: Deploy from a branch**, Branch: `main`, folder `/ (root)` → **Save**.
4. Sau 1–2 phút, GitHub sẽ cấp một địa chỉ dạng:
   `https://<ten-tai-khoan-github>.github.io/lich-cong-tac-online/`
   Đây là địa chỉ **trang xem lịch công tác công khai** để chia sẻ cho mọi người.
   Trang nhập liệu nằm tại: `.../lich-cong-tac-online/admin.html`

---

## PHẦN C — Sử dụng hằng ngày

### Người xem lịch (tất cả mọi người)

- Mở địa chỉ trang web (được cấp ở Phần B, bước 4) trên máy tính hoặc điện thoại.
- Không cần đăng nhập. Lịch hiển thị tuần hiện tại; có thể bấm "Tuần trước / Tuần sau" để xem tuần khác.
- Khi người nhập liệu lưu thay đổi, trang này **tự cập nhật ngay**, không cần bấm tải lại.

### Người nhập liệu (Lãnh đạo Văn phòng / Thư ký)

1. Mở `admin.html`, đăng nhập bằng email/mật khẩu đã được cấp (Phần A, Bước 3).
2. Chọn đúng tuần cần nhập (dùng nút "Tuần trước / Tuần sau / Về tuần này").
3. Gõ nội dung công tác buổi Sáng / Chiều cho từng người trong Thường trực Tỉnh uỷ, ở từng ngày.
   - Có thể bấm **"Sao chép nội dung từ tuần trước"** nếu tuần mới có nhiều nội dung lặp lại (ví dụ "Làm việc tại cơ quan"), sau đó chỉ cần sửa những phần khác.
4. Bấm **"💾 Lưu lịch công tác tuần này"**. Mọi người xem lịch sẽ thấy thay đổi ngay lập tức.
5. Nếu có thay đổi 4 chức danh Thường trực Tỉnh uỷ (do nhân sự thay đổi), bấm **"Sửa danh sách 4 chức danh"** để cập nhật tên/chức vụ — áp dụng cho mọi tuần.

---

## Cấu trúc file trong bộ mã nguồn

| File | Vai trò |
|---|---|
| `index.html`, `display.js` | Trang xem lịch công tác công khai |
| `admin.html`, `admin.js`, `admin.css` | Trang đăng nhập & nhập liệu |
| `style.css` | Giao diện chung (dùng chung cho cả 2 trang) |
| `shared.js` | Hàm tính tuần/ngày, kết nối Firebase |
| `firebase-config.js` | **Cần điền thông tin Firebase của anh vào đây** (Phần A, Bước 4) |
| `firestore.rules` | Quy tắc phân quyền đọc/ghi dữ liệu — dán vào Firebase Console (Phần A, Bước 2.5) |

## Xử lý một số tình huống thường gặp

- **Trang xem lịch báo "Không thể tải dữ liệu..."**: kiểm tra lại đã điền đúng `firebase-config.js` chưa, và đã **Publish** Firestore Rules chưa.
- **Đăng nhập trang nhập liệu báo lỗi**: kiểm tra email/mật khẩu đã được tạo đúng trong Firebase Authentication > Users chưa.
- **Muốn thêm/xoá người được quyền nhập liệu**: vào Firebase Console > Authentication > Users, thêm hoặc xoá tài khoản — không cần sửa mã nguồn.
- **Muốn đổi tên 4 chức danh hiển thị**: dùng nút "Sửa danh sách 4 chức danh" ngay trong trang nhập liệu, không cần sửa mã nguồn.

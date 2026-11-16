// ============================================================================
// CẤU HÌNH FIREBASE — điền thông tin project Firebase của bạn vào đây.
// Lấy các giá trị này tại: Firebase Console > Project settings > General
// > phần "Your apps" > Web app > SDK setup and configuration.
// Đây KHÔNG phải là thông tin bí mật (an toàn khi để công khai trên GitHub),
// vì quyền truy cập thực sự được kiểm soát bởi Firestore Security Rules
// và Firebase Authentication — xem hướng dẫn trong README.md.
// ============================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyCgBG7PcWnAC13TuvHtLNots4Y7btcc490",
  authDomain: "lichcongtacldtu.firebaseapp.com",
  projectId: "lichcongtacldtu",
  storageBucket: "lichcongtacldtu.appspot.com",
  messagingSenderId: "DIEN_SENDER_ID",
  appId: "DIEN_APP_ID",
};

// Tên 4 chức danh Thường trực Tỉnh uỷ (có thể sửa trực tiếp trong trang
// Quản lý danh sách lãnh đạo ở giao diện nhập liệu; đây chỉ là giá trị
// khởi tạo lần đầu khi chưa có dữ liệu trong Firestore).
export const DEFAULT_LEADERS = [
  {
    id: "l1",
    name: "Đ/c Phan Thăng An",
    title: "Uỷ viên BCH Trung ương Đảng, Bí thư Tỉnh uỷ, Chủ tịch HĐND tỉnh",
  },
  {
    id: "l2",
    name: "Đ/c Bế Thanh Tịnh",
    title: "Phó Bí thư TT Tỉnh uỷ, Trưởng đoàn ĐBQH tỉnh",
  },
  {
    id: "l3",
    name: "Đ/c Lê Hải Hòa",
    title:
      "Uỷ viên dự khuyết BCH Trung ương Đảng, Phó Bí thư Tỉnh uỷ, Chủ tịch UBND tỉnh",
  },
  {
    id: "l4",
    name: "Đ/c Vũ Hồng Quang",
    title: "Phó Bí thư Tỉnh uỷ, Chủ tịch Uỷ ban MTTQ Việt Nam tỉnh",
  },
];

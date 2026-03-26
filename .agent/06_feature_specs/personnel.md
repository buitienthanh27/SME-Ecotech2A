# Feature Spec: Personnel — Quản Lý Nhân Sự

## Ai truy cập
- **HR**: full CRUD nhân viên, phòng ban, thiết lập baseSalary
- **CEO**: xem tất cả, không sửa
- Các roles khác: không truy cập `/personnel`

---

## Layout Trang Personnel

```
Banner: "Quản lý Nhân sự"
Tabs: [Nhân viên] [Phòng ban]
```

---

## Tab Nhân viên

### Thống kê (cards)
- Tổng nhân viên | Đang làm việc | Nghỉ phép | Đã nghỉ việc

### Tìm kiếm & Lọc
- Search: tên, email, SĐT
- Lọc phòng ban: Dropdown departments
- Lọc trạng thái: Đang làm việc | Đang nghỉ phép | Đã nghỉ việc
- Lọc role

### Bảng nhân viên (10/trang)
```
Avatar | Tên | Chức danh | Phòng ban | Role | Lương cơ bản | Trạng thái | Thao tác
```
- **Lương cơ bản**: chỉ hiện với HR, Accountant, CEO — hiển thị `***` với roles khác
- Thao tác (chỉ HR): [Sửa] [Vô hiệu hóa/Kích hoạt]

### Popup Thêm/Sửa Nhân viên (HR only)

```
Họ tên*
Email*
SĐT
Phòng ban*    [Dropdown departments]
Chức danh
Role*         [Dropdown AppRole]
Trạng thái làm việc  [Đang làm việc / Đang nghỉ phép / Đã nghỉ việc]
Ngày gia nhập
```

**⚠️ KHÔNG có field Lương cơ bản trong form này** — baseSalary được cập nhật riêng.

### Cập nhật Lương Cơ Bản (HR only)

Nút riêng [Cập nhật lương] trong row hoặc popup sửa:
```
Cập nhật lương cơ bản — [Tên nhân viên]
Lương hiện tại: 15,000,000 ₫
Lương mới*: [Number input]
Lý do thay đổi: [Textarea]

[Hủy] [Lưu]
```

```typescript
// ConfirmModal: "Lương cơ bản mới sẽ áp dụng từ kỳ lương tiếp theo. Các kỳ lương đã chốt không bị ảnh hưởng."
updateBaseSalary(employeeId, newAmount);
toast.success('Đã cập nhật lương cơ bản');
```

---

## Tab Phòng Ban

### Danh sách departments
```
Tên phòng ban | Trưởng phòng | Số nhân viên | Mô tả | Thao tác (HR: Sửa | Xóa)
```

### Popup Thêm/Sửa Phòng ban (HR only)
```
Tên phòng ban*
Trưởng phòng (Lead)*  [Dropdown employees có role=Lead]
Mô tả
```

### Xóa phòng ban
- ConfirmModal bắt buộc
- **Ràng buộc**: Không xóa được phòng ban còn nhân viên active → hiện lỗi "Phòng ban còn X nhân viên. Vui lòng chuyển nhân viên sang phòng khác trước."

---

## Employee Profile (xem chi tiết)

Khi click vào một nhân viên:
```
[Avatar lớn]  Tên nhân viên
              Chức danh | Phòng ban | Role badge
              Email | SĐT | Ngày gia nhập
              Trạng thái badge

Lương cơ bản: X ₫  (HR/CEO/Accountant only)

Dự án đang tham gia:
[Badge] Tên dự án — Role — X% PB — Trạng thái
```

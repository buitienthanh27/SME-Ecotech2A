# 03 — Business Flows & Phân Quyền

---

## LUỒNG NGHIỆP VỤ END-TO-END

```
[HR] Tạo Department → Tạo Personnel → Thiết lập baseSalary
      ↓
[Sales/PM] Tạo Customer → Tạo Contract
      ↓
[PM/CEO] Tạo Project (Draft → Active ngay, không cần duyệt)
  - Bước 1: Thông tin dự án (tên, mã, KH, HĐ, ngày, ngân sách)
  - Bước 2: Chọn Lead các phòng ban vào dự án
  - Bước 3: Nhập kế hoạch chi phí
  - Nhấn "Tạo dự án" → status = Active
      ↓
[Lead] Thêm nhân viên phòng mình → Gửi PersonnelRequest → ApprovalRequest (Pending)
      ↓
[CEO] Duyệt/từ chối từng người hoặc cả nhóm
  → Approved: nhân viên xuất hiện trong project members, có thể giao task
  → Rejected: Lead chỉnh sửa và gửi lại (ApprovalRequest mới)
      ↓
[PM] Tạo Sprint (Planning) → Activate sprint → Tạo Task trong sprint
[Lead] Tạo task cho nhân viên phòng mình trong sprint đang Active
      ↓
[Employee] Cập nhật % tiến độ task
[PM] Chấm WorkShift / đánh giá hiệu suất
      ↓
[PM] Kết thúc Sprint → Completed → SprintReport tự tổng hợp
  Task chưa Done → chuyển sang Sprint tiếp hoặc Backlog
      ↓
[PM] Tạo TrainingPlan → chọn trainers → nhập chi phí dự kiến → Confirmed → InProgress → Completed
      ↓
[Accountant] Xác nhận chi phí đào tạo thực tế → tạo CashFlowEntry 'Đào tạo'
[Accountant] Nhập CashFlowEntry thu/chi khác (doanh thu, CSVC, Vendor...)
      ↓
[Accountant/CEO] Tạo PayrollPeriod → Xác nhận → Auto tạo CashFlowEntry lương
      ↓
[PM] Đóng Project → status = Completed
```

---

## LUỒNG PHÊ DUYỆT NHÂN SỰ DỰ ÁN (Chi tiết)

```
Bước 1: Lead chọn nhân viên phòng mình
        → Tạo PersonnelRequest (1 request = N nhân viên)
        → ProjectMember.approvalStatus = 'Pending'

Bước 2: ApprovalRequest gửi lên CEO (status: Pending)
        → Hiển thị tại /approvals cho CEO

Bước 3: CEO duyệt/từ chối
  → Approved: ProjectMember.approvalStatus = 'Approved'
              Nhân viên xuất hiện trong dropdown giao task
  → Rejected: ProjectMember.approvalStatus = 'Rejected'
              Lead nhận thông báo, xem lý do từ chối
              Lead tạo PersonnelRequest MỚI (không edit request cũ)

Bước 4: Nhân viên Approved + Active → có thể nhận task
```

> ⚠️ **CRITICAL**: Nhân viên `approvalStatus = Pending` hoặc `Rejected` KHÔNG được hiển thị trong dropdown giao task. Kiểm tra bằng `isMemberAssignableForTask()`.

---

## LUỒNG SPRINT

```
PM tạo Sprint → status = 'Planned'
      ↓
PM activate sprint → status = 'Active'  (điều kiện: ít nhất 1 task)
  [RULE: Chỉ 1 sprint Active tại một thời điểm]
      ↓
PM/Lead thêm task vào sprint đang Active
      ↓
PM complete sprint → status = 'Completed'
  → Dialog hỏi: task chưa Done → chuyển về Backlog hay Sprint tiếp theo?
  → SprintReport tự tổng hợp
  → KHÔNG thể reopen sprint đã Completed
```

---

## LUỒNG PAYROLL

```
[Accountant/CEO] Tạo PayrollPeriod (month, year) → status = 'Draft'
      ↓
Hệ thống tính EmployeeCost cho từng nhân viên:
  allocationAmount = baseSalary × (%PB/100) × (ngày thực tế / ngày trong kỳ)
  timesheetAmount  = số giờ OT × đơn giá OT (từ Settings)
  performanceBonus = từ PerformanceBonus của PM
  totalAmount      = allocationAmount + timesheetAmount + performanceBonus
      ↓
[Accountant/CEO] Review → Xác nhận (Confirm) → status = 'Confirmed'
      ↓
AUTO: Tạo CashFlowEntry type='Chi phí', category='Lương nhân sự' cho từng dự án
NOTE: baseSalary trong EmployeeCost là SNAPSHOT — không thay đổi dù HR cập nhật sau
```

---

## MA TRẬN PHÂN QUYỀN ĐẦY ĐỦ

| Chức năng | CEO | PM | Lead | Accountant | HR | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **DASHBOARD** | | | | | | |
| Xem tất cả thống kê tài chính | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Xem thống kê dự án mình quản lý | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Xem dự án mình tham gia | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Xem phân bổ nhân sự toàn công ty | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Xem phân bổ nhân sự phòng mình | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **PROJECT** | | | | | | |
| Tạo/sửa dự án | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem tất cả dự án | ✅ | ✅ | dự án tham gia | dự án tham gia | ❌ | dự án tham gia |
| Đóng/tạm dừng dự án | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **NHÂN SỰ DỰ ÁN** | | | | | | |
| Thêm nhân viên vào dự án | ✅ | ✅ | phòng mình | ❌ | ❌ | ❌ |
| Duyệt nhân sự dự án | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SPRINT** | | | | | | |
| Tạo/sửa/xóa sprint | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Activate/Complete sprint | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem sprint | ✅ | ✅ | dự án tham gia | ❌ | ❌ | dự án tham gia |
| **TASK** | | | | | | |
| Tạo task | ✅ | ✅ | phòng mình | ❌ | ❌ | ❌ |
| Xem task | ✅ | tất cả dự án | phòng mình | ❌ | ❌ | task của mình |
| Cập nhật task (status, info) | ✅ | ✅ | phòng mình | ❌ | ❌ | chỉ % tiến độ |
| Đổi người thực hiện task | ✅ | ✅ | phòng mình | ❌ | ❌ | ❌ |
| Đánh dấu task Done | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **TIMESHEET** | | | | | | |
| Chấm WorkShift | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Đánh giá hiệu suất | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **TRAINING** | | | | | | |
| Tạo/quản lý TrainingPlan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem TrainingPlan | ✅ | ✅ | có trong trainers | ❌ | ❌ | có trong trainers |
| Xác nhận chi phí đào tạo thực tế | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **CASHFLOW** | | | | | | |
| Xem CashFlow | ✅ | dự án mình | ❌ | ✅ toàn bộ | ❌ | ❌ |
| Nhập CashFlowEntry | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **PAYROLL** | | | | | | |
| Xem bảng lương | ✅ | dự án mình | ❌ | ✅ toàn bộ | ✅ baseSalary | của bản thân |
| Tạo/chốt bảng lương | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **PERSONNEL** | | | | | | |
| CRUD nhân viên | xem | ❌ | ❌ | ❌ | ✅ | ❌ |
| Thiết lập baseSalary | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Quản lý phòng ban | xem | ❌ | ❌ | ❌ | ✅ | ❌ |
| **APPROVALS** | | | | | | |
| Xem Approvals | ✅ | request mình | request mình | ❌ | ❌ | ❌ |
| Duyệt Approvals | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CONTRACT / CUSTOMER** | | | | | | |
| CRUD Customer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD Contract | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## CÁC RÀNG BUỘC NGHIỆP VỤ QUAN TRỌNG

### Nhân sự dự án
- Nhân viên `Inactive` trong dự án: **KHÔNG** xuất hiện trong dropdown giao task
- Muốn chuyển `Active → Inactive`: phải đổi người khỏi tất cả task đang active trước
- Một nhân viên có thể tham gia **nhiều dự án** cùng lúc, tổng `%PB` không bị kiểm soát

### Task
- Assignee **KHÔNG** tự đánh dấu task `Done` — chỉ Lead/PM/CEO
- Khi đổi người thực hiện: `progressPercent` giữ nguyên, lưu `SubstitutionLog`
- Task không có `sprintId` → hiển thị ở **Backlog**

### Payroll
- `baseSalary` trong `EmployeeCost` là **snapshot** — bất biến sau khi chốt
- Sau khi chốt, **tự động** tạo `CashFlowEntry` cho từng dự án

### CashFlow
- Doanh thu chỉ ghi nhận khi **thực thu** — Accountant nhập tay
- PM **KHÔNG** có quyền nhập CashFlowEntry

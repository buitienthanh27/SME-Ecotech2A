# 04 — Màn Hình & Routing

---

## ROUTING (App.tsx)

```
/ (Layout wrapper)
├── /                     → Dashboard.tsx
├── /contracts            → Contracts.tsx
├── /projects             → Projects.tsx
├── /projects/:id/board   → ProjectBoard.tsx  (Kanban realtime)
├── /projects/:id/bonuses → ProjectBonuses.tsx
├── /projects/:id/sprint-report → SprintReport.tsx
├── /personnel            → Personnel.tsx
├── /payroll              → Payroll.tsx
├── /cashflow             → CashFlow.tsx
├── /approvals            → Approvals.tsx
└── /settings             → Settings.tsx
```

Mọi route đều wrap bằng `<ProtectedRoute>` — kiểm tra role từ store.

---

## 1. DASHBOARD (`/`)

### Bộ lọc thời gian (áp dụng toàn Dashboard)
- Dropdown: **Theo khoảng thời gian** | **Theo tháng** | **Theo quý** | **Theo năm**
- Sau khi chọn cách lọc, hiển thị control tương ứng (date range picker / month picker / quarter selector / year selector)
- Tất cả số liệu cập nhật theo filter đã chọn

### KPI Cards (row đầu tiên)
| Card | Nội dung | % so sánh |
|---|---|---|
| Tổng doanh thu thực | từ CashFlowEntry type=Thu nhập | vs kỳ trước |
| Tổng chi phí thực | từ CashFlowEntry type=Chi phí | vs kỳ trước |
| Tổng lợi nhuận thực | = doanh thu - chi phí | vs kỳ trước |
| Tổng hợp đồng đã ký | count Contract status=Đã ký | vs kỳ trước |
| Dự án đang hoạt động | count Project status=Active | vs kỳ trước |

> % tăng = màu xanh ↑, % giảm = màu đỏ ↓ (ngoại trừ chi phí: giảm = xanh)

### Cảnh báo rủi ro (Alert list)
Mỗi alert: **[Icon] Tên cảnh báo — Nội dung chi tiết**
- 🔴 Dự án quá hạn: `endDate < today && status = Active`
- 🟡 Dự án sắp trễ: `endDate trong 7 ngày tới && status = Active`
- 🔴 Dự án vượt ngân sách: `actualExpense > budget`
- 🔴 Dự án lỗ: `actualIncome - actualExpense < 0`
- 🟡 Chưa chốt lương: `không có PayrollPeriod Confirmed cho tháng trước`
- 🟡 Nhân sự Inactive có task active

### Biểu đồ dòng tiền hàng tháng
- Recharts `BarChart` — 2 series: Thu thực (xanh) và Chi thực (đỏ)
- X-axis: các tháng trong năm được chọn
- Lấy data từ `cashFlowEntries` group by tháng

### Top dự án theo lợi nhuận thực
- Bảng: STT | Tên dự án | Lợi nhuận | % trong tổng lợi nhuận năm
- Hiển thị top 5, nút "Xem thêm" → popup danh sách đầy đủ sorted desc
- Lọc theo năm

### Dự án gần đây (3 tháng gần nhất)
- Bảng: STT | Tên dự án | Quản lý | Trạng thái | Doanh thu thực | Chi phí thực | Lợi nhuận thực
- Top 5, nút "Xem tất cả" → popup

### Hợp đồng mới ký (3 tháng gần nhất)
- Bảng: STT | Mã hợp đồng | Khách hàng | Giá trị | Ngày ký
- Top 5 giá trị cao nhất, nút "Xem thêm" → popup sorted desc

### Biểu đồ tròn phân bổ chi phí & nhân sự
- Recharts `PieChart` — Chi phí theo dự án
- Recharts `PieChart` — Nhân sự theo dự án (số người)

### Phân quyền xem Dashboard
- **CEO**: xem tất cả
- **PM**: thống kê tài chính chỉ dự án mình quản lý; dự án/HĐ = toàn bộ
- **Lead**: không xem số liệu tài chính; chỉ dự án/nhân sự phòng mình
- **Accountant**: tất cả số liệu tài chính; không xem task/tiến độ
- **HR**: phân bổ nhân sự toàn công ty; không xem tài chính
- **Employee**: chỉ dự án mình tham gia; không xem tài chính

---

## 2. CUSTOMERS (`/customers`)

### Banner
- Title: "Quản lý khách hàng"
- Nút: "Thêm khách hàng mới" → Popup form

### Thống kê (4 cards)
- Tổng công nợ | Tổng khách hàng | Tổng doanh thu | Tổng đã thu

### Tìm kiếm & Lọc
- Search: Tên công ty, MST, Người liên hệ, SĐT, Email, Địa chỉ
- Lọc trạng thái: Tiềm năng | Đang hợp tác | Ngừng hợp tác | Tất cả
- Lọc hợp đồng: Tất cả | Có hợp đồng | Chưa có hợp đồng

### Bảng danh sách (10/trang)
Cột: code | companyName | taxCode | address | contactPerson | industry | companySize | status | priority | assignedTo | note | source | Cần thu | Đã thu | Công nợ | Thao tác (Xem | Sửa)

### Chi tiết khách hàng
- Trang riêng hiển thị thông tin đầy đủ
- Danh sách hợp đồng liên quan

### Popup thêm/sửa
- Fields: Tên công ty*, MST*, Địa chỉ*, Người liên hệ*, SĐT, Email, Ngành, Quy mô, Trạng thái, Ưu tiên, Ghi chú

---

## 3. CONTRACTS (`/contracts`)

### Banner
- Title: "Quản lý hợp đồng"
- Nút: "Tạo hợp đồng mới" → Popup form

### Thống kê
- Tổng giá trị HĐ | HĐ đã ký | Nháp

### Tìm kiếm & Lọc
- Search: Tên HĐ, Tên DN, Người LH, SĐT, Email, Số HĐ
- Lọc trạng thái: Nháp | Đã gửi | Đã ký | Đang thực hiện | Hoàn thành
- Lọc theo khách hàng

### Bảng danh sách (10/trang)
Cột: Số HĐ | Tên HĐ | Khách hàng | Giá trị | Trạng thái | Thời gian | Ngày ký | Thao tác (Xem | Tải | Sửa)

---

## 4. PROJECTS (`/projects`)

### Banner
- Title: "Quản lý dự án"
- Nút: "Tạo dự án mới" → Modal 3 bước

### Thống kê (3 cards)
- Tổng số dự án | Đang thực hiện | Sau khi lọc

### Tìm kiếm & Lọc
- Search: Tên dự án, Mã dự án
- Lọc trạng thái: Tất cả | Đang thực hiện | Đã hoàn thành | Tạm dừng | Hủy

### Danh sách dự án (dạng Card)
Mỗi card hiển thị:
- Tên dự án, mã, trạng thái badge
- PM phụ trách
- 3 quick-action buttons: [Kanban] [Thưởng] [Sprint Report]
- Tài chính: Doanh thu dự kiến | Chi phí dự kiến | Lợi nhuận dự kiến
- Timeline (startDate → endDate)
- Progress bar biên lợi nhuận
- Avatar stack nhân sự tham gia (max 5, +N nếu nhiều hơn)
- Nút [Sửa] và [Vào board]

### Modal tạo/sửa dự án (3 bước)
**Bước 1 — Thông tin chung:**
- Tên dự án*, Mã dự án*, Khách hàng (dropdown), Hợp đồng (dropdown, lọc theo KH)
- Ngày bắt đầu*, Ngày kết thúc*, Doanh thu dự kiến, Ngân sách, Ghi chú

**Bước 2 — Chọn trưởng phòng:**
- Danh sách departments + Lead của mỗi phòng
- Checkbox chọn Lead nào tham gia dự án
- Hiển thị: Đã chọn (N) / Chưa chọn

**Bước 3 — Kế hoạch chi phí:**
- Table nhập: Hạng mục | Loại (Nhân sự/CSVC/Vendor/Khác) | Số tiền kế hoạch | Ghi chú
- Nút [+] thêm dòng
- Tổng kế hoạch chi phí

---

## 5. PROJECT BOARD (`/projects/:id/board`)

### Header
- Tên dự án, mã, trạng thái
- Tabs: [Board] [Sprint] [Timesheet] [Training] [Nhân sự] [Chi phí]

### Tab Board — Kanban
- Dropdown/Tab chọn Sprint (bao gồm Backlog)
- Sprint info: tên, ngày, goal, % hoàn thành
- 4 cột Kanban: **Todo | In Progress | Review | Done**
- Drag & drop task giữa các cột (`@dnd-kit`)
- Nút [+] thêm task vào sprint/cột
- Presence indicator: avatar nhân viên đang online (Socket.io)

### Task Card
- Tiêu đề, priority badge, type badge
- Assignees avatars
- Due date (đỏ nếu quá hạn)
- Progress bar
- Comment count
- Click → Drawer chi tiết task

### Task Drawer (slide-in từ phải)
- Title, description (editable)
- Status (dropdown, kiểm tra quyền)
- Priority, Type, Sprint, Due date
- Assignees (add/remove, kiểm tra isMemberAssignableForTask)
- Progress % (chỉ assignee cập nhật được)
- Subtasks list
- Progress history (SubstitutionLog)
- Comments (realtime)
- Status history log

### Backlog
- Dạng danh sách (không phải Kanban)
- Hiển thị task không có sprintId
- Có thể kéo task vào sprint từ Backlog

### Tab Sprint Management
- Danh sách sprints của dự án
- Nút tạo sprint mới (PM/CEO)
- Activate / Complete sprint buttons
- Hiển thị trạng thái, ngày, goal, số task

### Tab Timesheet
- Calendar view + List view
- Chấm WorkShift: chọn ngày, ca (Sáng/Chiều/OT), nhân sự
- Đánh giá hiệu suất 1–5 sao

### Tab Training
- Danh sách TrainingPlan của dự án
- Nút tạo TrainingPlan (PM/CEO)
- Xem chi tiết: trainers, costs, status
- Accountant: xác nhận chi phí thực tế

### Tab Nhân sự
- Danh sách members của dự án
- Status: Active/Inactive, ApprovalStatus badge
- Lead: nút [Thêm nhân viên] → form gửi duyệt

### Tab Chi phí
- CostPlan vs thực tế
- Xem CashFlowEntries của dự án

---

## 6. SPRINT REPORT (`/projects/:id/sprint-report`)

- Chọn sprint từ dropdown
- Tổng quan sprint: tên, ngày, goal
- Biểu đồ burn-down / task completion
- Bảng task: Tên | Assignee | Status | Priority | Due | Progress
- Thống kê: tổng task, Done, In Progress, Blocked by sprint
- Export (nếu implement)

---

## 7. PERSONNEL (`/personnel`)

> Chỉ HR có quyền CRUD. CEO xem. Roles khác không truy cập.

### Banner + Tabs
- Tabs: [Nhân viên] [Phòng ban]

### Tab Nhân viên
- Search: tên, email, phòng ban
- Lọc: trạng thái, phòng ban, role
- Bảng: Avatar | Tên | Chức danh | Phòng ban | Role | Lương cơ bản (chỉ HR/CEO xem) | Trạng thái | Thao tác
- Popup thêm/sửa nhân viên (HR only)
- baseSalary chỉ hiển thị với HR, Accountant, CEO

### Tab Phòng ban
- Danh sách departments
- Tên phòng | Lead | Số nhân viên | Thao tác
- Popup thêm/sửa phòng ban

---

## 8. PAYROLL (`/payroll`)

> Accountant và CEO có toàn quyền. PM xem dự án mình. HR xem baseSalary.

### Danh sách kỳ lương
- Tabs/filter: Tất cả | Draft | Confirmed
- Bảng: Kỳ lương | Số nhân viên | Tổng lương | Trạng thái | Thao tác

### Chi tiết kỳ lương
- Bảng EmployeeCost: Nhân viên | Lương cơ bản | Phân bổ | OT | Thưởng | Tổng
- Nút [Chốt bảng lương] (Accountant/CEO, chỉ khi Draft)
- ConfirmModal trước khi chốt

### Tạo kỳ lương mới
- Chọn tháng/năm
- Hệ thống tính toán tự động
- Preview trước khi tạo

---

## 9. CASHFLOW (`/cashflow`)

> Accountant xem + nhập toàn bộ. CEO xem toàn bộ. PM xem dự án mình.

### Thống kê (cards)
- Tổng thu | Tổng chi | Lợi nhuận | trong kỳ được chọn

### Bộ lọc
- Khoảng thời gian
- Loại: Thu/Chi/Tất cả
- Danh mục
- Dự án

### Bảng danh sách
Cột: Ngày | Loại | Danh mục | Dự án | Mô tả | Số tiền | Nguồn (Auto/Manual) | Người nhập | Thao tác

### Thêm CashFlowEntry (Accountant/CEO)
- Popup: Loại*, Danh mục*, Dự án (optional), Ngày*, Số tiền*, Mô tả

### Biểu đồ
- Dòng tiền theo tháng (BarChart)
- Phân bổ theo danh mục (PieChart)

---

## 10. APPROVALS (`/approvals`)

> CEO: xem và duyệt tất cả. PM/Lead: xem request của mình.

### Tabs
- [Chờ duyệt] [Đã duyệt] [Đã từ chối]

### Bảng
Cột: Tiêu đề | Loại | Dự án | Người gửi | Ngày gửi | Ưu tiên | Trạng thái | Thao tác

### Duyệt request (CEO)
- Click vào request → Popup chi tiết
- Danh sách nhân viên trong request (với role, % phân bổ)
- Checkbox chọn từng người để duyệt/từ chối
- Textarea lý do từ chối (bắt buộc khi từ chối)
- Nút [Duyệt tất cả] [Từ chối] [Duyệt được chọn]

---

## 11. SETTINGS (`/settings`)

- Cấu hình đơn giá OT (VND/giờ) — dùng trong tính lương
- Cấu hình thông tin công ty
- Cấu hình thông báo
- Theme / Display preferences

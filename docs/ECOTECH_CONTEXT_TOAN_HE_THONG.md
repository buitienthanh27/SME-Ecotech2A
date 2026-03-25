# ECOTECH — Kiến trúc sư Tài chính
> **Single Source of Context** cho Cursor & toàn bộ team phát triển  
> Phiên bản: 2.2 | Cập nhật: 25/03/2026

---

## 1. TỔNG QUAN SẢN PHẨM

**ECOTECH** là SaaS quản lý dòng tiền & vận hành dự án nội bộ dành cho doanh nghiệp vừa (SME). Hệ thống bao phủ toàn bộ vòng đời: từ ký hợp đồng → lập kế hoạch dự án → thực thi (task, timesheet) → tính lương → đóng sổ tài chính.

### Đối tượng người dùng & vai trò

| Role | Mô tả | Quyền hạn cốt lõi |
|---|---|---|
| `CEO` | Lãnh đạo cao nhất | Xem toàn bộ, duyệt nhân sự dự án, xem Dashboard tổng |
| `PM` | Project Manager | Tạo/quản lý dự án, phân công task, chấm timesheet |
| `Lead` | Trưởng nhóm / phòng ban | Thêm nhân viên phòng mình vào dự án, tạo task cho nhân viên phòng mình |
| `Accountant` | Kế toán | Nhập thu/chi thực tế (CashFlowEntry), tạo & chốt bảng lương (Payroll), xem báo cáo tài chính |
| `HR` | Nhân sự | Quản lý hồ sơ nhân viên, phòng ban, lương cơ bản; không có quyền tài chính dự án |
| `Employee` | Nhân viên | Xem task được giao, cập nhật tiến độ task của mình, chấm công |

---

## 2. KIẾN TRÚC KỸ THUẬT

### Stack

| Thành phần | Công nghệ |
|---|---|
| Frontend framework | React 19 + Vite 6 |
| Routing | React Router 7 |
| State management | Zustand (toàn bộ state + mock seed data) |
| Styling | Tailwind CSS 4 |
| Drag & Drop | `@dnd-kit` (Kanban board) |
| Charts | Recharts |
| Animation | Motion (Framer Motion) |
| Toast | react-hot-toast |
| Realtime | Socket.io (server + client) |
| AI | `@google/genai` — **đã khai báo dependency, chưa tích hợp UI, chưa có kế hoạch cụ thể** |
| Dev server | `tsx server.ts` — Express + Vite middleware |
| Prod | Express serve static `dist/` |

### Realtime — Socket.io

Phòng (room) theo `projectId`. Các màn hình dùng realtime thực sự:

| Màn hình | Sự kiện |
|---|---|
| Kanban Board (`/projects/:id/board`) | Kéo thả task, cập nhật trạng thái task, presence (ai đang online) |
| Chat / Comment trong task | Gửi/nhận message, typing indicator |
| Notification toàn app | Push thông báo: duyệt nhân sự, task mới, deadline |
| Dashboard KPI | Cập nhật số liệu realtime khi có thay đổi dự án |

> **Lưu ý**: `RealtimeService.ts` là pub/sub **cục bộ** (trong tab), khác với Socket.io. Không nhầm lẫn khi đọc code.

### Nguồn dữ liệu

> ⚠️ **Toàn bộ dữ liệu hiện tại là mock/seed trong Zustand**. Không có persistence API hay database thật. Realtime là Socket.io nhưng state đồng bộ tùy màn hình, có thể vẫn local.

---

## 3. ROUTING & MÀN HÌNH

| Đường dẫn | Trang | Ghi chú nghiệp vụ |
|---|---|---|
| `/` | Dashboard | Tổng quan dòng tiền, tiến độ dự án, KPI nhân sự, cảnh báo quá hạn/rủi ro |
| `/contracts` | Contracts | Hợp đồng khách hàng, vòng đời hợp đồng, liên kết project |
| `/projects` | Projects | Danh sách dự án, tạo dự án mới |
| `/projects/:id/board` | ProjectBoard | Kanban realtime, sprint, task, drag & drop |
| `/projects/:id/bonuses` | ProjectBonuses | Thưởng hiệu suất theo dự án |
| `/projects/:id/sprint-report` | SprintReport | Báo cáo sprint |
| `/personnel` | Personnel | Quản lý nhân sự, phòng ban |
| `/payroll` | Payroll | Kỳ lương, EmployeeCost |
| `/cashflow` | CashFlow | Thu/chi, gắn dự án |
| `/approvals` | Approvals | Luồng phê duyệt nhân sự dự án (Lead → CEO) |
| `/settings` | Settings | Cấu hình hệ thống |

---

## 4. MÔ HÌNH NGHIỆP VỤ (DOMAIN)

### 4.1 Khách hàng & Hợp đồng

- `Customer`: thông tin khách hàng.
- `Contract`: hợp đồng, liên kết tùy chọn `projectId`, lưu doanh thu kế hoạch, ngày ký, thời hạn.
- Doanh thu **ghi nhận khi thực thu tiền** (không phải khi ký hợp đồng).

### 4.2 Dự án (Project)

```
Project {
  id, name, code
  status: 'Draft' | 'Active' | 'Completed' | 'OnHold'
  customerId, contractId (optional)
  pmId
  startDate, endDate
  budget (ngân sách kế hoạch, VND)
  costPlan[]        // kế hoạch chi phí ban đầu
  members[]         // PersonnelInProject — chỉ nhân viên đã được CEO duyệt
  sprints[]         // Sprint — giai đoạn phát triển, mỗi sprint chứa tasks[]
  tasks[]           // Task — toàn bộ task (có thể lọc theo sprint)
  workSchedules[]   // WorkShift — lịch làm việc / timesheet
  trainingPlans[]   // TrainingPlan — kế hoạch đào tạo khách hàng sau phát triển
  cashFlowEntries[] // thu chi thực tế gắn với dự án
}
```

**Trạng thái dự án:**
- `Draft` → `Active`: sau khi PM/CEO tạo xong (không cần phê duyệt)
- `Active` → `Completed`: PM đóng dự án
- `Active` → `OnHold`: tạm dừng

### 4.3 Nhân sự trong dự án & Luồng phê duyệt

**Luồng duy nhất cần phê duyệt: Lead thêm nhân viên vào dự án → CEO duyệt**

```
Bước 1: Lead chọn nhân viên phòng mình → tạo PersonnelRequest (1 request = N nhân viên)
Bước 2: ApprovalRequest gửi lên CEO (status: Pending)
Bước 3: CEO duyệt từng người hoặc cả nhóm / từ chối kèm lý do
Bước 4: Nhân viên được duyệt → xuất hiện trong project members, có thể giao task
         Nhân viên bị từ chối → Lead chỉnh sửa danh sách và gửi lại request mới
```

> ⚠️ **Nhân viên chưa được CEO duyệt KHÔNG được hiển thị trong dropdown giao task**

```
PersonnelInProject {
  personnelId
  projectId
  role: 'PM' | 'Lead' | 'Developer' | 'Tester' | 'BA' | 'Other'
  allocationPercent  // % PB — không cần tổng ≤ 100% (nhân viên có thể đa dự án)
  status: 'Active' | 'Inactive'
  approvalStatus: 'Pending' | 'Approved' | 'Rejected'
}
```

**Ràng buộc nhân sự:**
- Nhân viên `Inactive` trong dự án: không xuất hiện trong dropdown giao task
- Muốn chuyển `Active → Inactive`: phải đổi người khỏi tất cả task đang active trước
- Một nhân viên có thể tham gia nhiều dự án cùng lúc, tổng `%PB` không bị kiểm soát

### 4.4 Sprint (Giai đoạn phát triển)

Sprint là đơn vị tổ chức công việc theo giai đoạn trong dự án. Mỗi dự án có nhiều sprint, mỗi sprint chứa nhiều task.

```
Sprint {
  id, projectId
  name            // ví dụ: "Sprint 1 — Phân tích & Thiết kế", "Sprint 2 — Backend Core"
  goal            // mục tiêu ngắn của sprint (optional)
  startDate, endDate
  status: 'Planning' | 'Active' | 'Completed'
  tasks[]         // Task[] thuộc sprint này
  order           // thứ tự hiển thị (sprint 1, 2, 3...)
}
```

**Trạng thái sprint & điều kiện chuyển:**

| Từ | Sang | Điều kiện | Ai được phép |
|---|---|---|---|
| Planning | Active | Có ít nhất 1 task | PM, CEO |
| Active | Completed | PM xác nhận kết thúc sprint | PM, CEO |
| Completed | — | Không thể reopen | — |

**Quy tắc:**
- Chỉ **1 sprint Active** tại một thời điểm trong cùng dự án
- Task không bắt buộc thuộc sprint (`sprintId` optional) — task không có sprint hiển thị ở mục "Backlog"
- Khi sprint kết thúc, task chưa `Done` có thể chuyển sang sprint tiếp theo hoặc về Backlog
- PM tạo/sửa/xóa sprint; Lead chỉ xem sprint của dự án mình tham gia

**Hiển thị trên Kanban Board:**
- Có dropdown/tab chọn sprint ở đầu trang board
- Mỗi sprint hiển thị Kanban 4 cột: **Todo | In Progress | Review | Done**
- Backlog hiển thị riêng dưới dạng danh sách (không phải Kanban)
- SprintReport tự động tổng hợp khi sprint Completed

---

### 4.5 Task & Kanban

```
Task {
  id, title, description
  projectId
  sprintId (optional — nếu null thì thuộc Backlog)
  parentTaskId (optional — sub-task)
  assignees: TaskAssignee[]
  status: 'Todo' | 'In Progress' | 'Review' | 'Done'
  priority: 'High' | 'Medium' | 'Low'
  startDate, dueDate
  progressPercent: 0–100
  progressHistory: SubstitutionLog[]
  tags[]          // nhãn tùy chọn (optional)
}

TaskAssignee {
  personnelId
  assignedAt
  assignedBy
}

SubstitutionLog {
  fromPersonnelId
  toPersonnelId
  atProgress     // % tiến độ tại thời điểm đổi người
  date
  note
}
```

**Trạng thái task & điều kiện chuyển:**

| Từ | Sang | Ai được phép |
|---|---|---|
| Todo | In Progress | Assignee, Lead, PM, CEO |
| In Progress | Review | Assignee, Lead, PM, CEO |
| Review | Done | Lead, PM, CEO (assignee không tự đánh dấu Done) |
| Review | In Progress | Lead, PM, CEO (reject review, trả về làm lại) |
| Todo / In Progress | Todo / In Progress | Chỉnh sửa thông tin, không đổi cột |

> ⚠️ Đã bỏ trạng thái `Blocked`. Nếu task bị chặn, PM ghi chú vào description hoặc comment.

**Quy tắc đổi người thực hiện task:**
- Tiến độ `%` giữ nguyên, người mới tiếp tục từ điểm đó
- Lưu vào `progressHistory` (SubstitutionLog) để audit
- Hiển thị lịch sử trong drawer chi tiết task

**Phân quyền xem & tạo task:**

| Role | Xem task | Tạo task | Cập nhật task |
|---|---|---|---|
| CEO | Tất cả | Tất cả | Tất cả |
| PM | Tất cả trong dự án | Tất cả trong dự án | Tất cả trong dự án |
| Lead | Chỉ task nhân viên phòng mình | Chỉ cho nhân viên phòng mình | Trong phạm vi phòng mình |
| Employee | Chỉ task của bản thân | Không | Chỉ % tiến độ task của mình |

### 4.6 WorkShift & Timesheet

```
WorkShift {
  projectId
  date
  shift: 'Morning' | 'Afternoon' | 'OT'
  personnelIds[]
  performanceRating: 1–5 | 'Tốt' | 'Đạt' | 'Yếu'  // PM đánh giá
  note
}
```

- Lịch làm việc mặc định: **Thứ 2 → Sáng thứ 7**, dựa trên timeline dự án
- OT nhập thêm thủ công bởi PM
- Xem theo 2 dạng: **Calendar view** và **List view**

### 4.7 Kế hoạch đào tạo khách hàng (TrainingPlan)

Sau khi phát triển sản phẩm, dự án có thể có một hoặc nhiều đợt đào tạo để hướng dẫn sử dụng cho phía khách hàng. Mỗi đợt đào tạo là một `TrainingPlan` gắn với dự án.

```
TrainingPlan {
  id, projectId
  name              // tên đợt đào tạo, ví dụ: "Đào tạo module Kế toán — HCM"
  description
  location          // địa điểm đào tạo (onsite tại KH hoặc online)
  startDate, endDate
  status: 'Draft' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled'
  trainers[]        // TrainingPersonnel — nhân sự nội bộ đi đào tạo
  costs[]           // TrainingCost — các khoản chi phí cho đợt đào tạo
  customerContacts  // thông tin đầu mối phía khách hàng (optional)
  note
}

TrainingPersonnel {
  personnelId       // nhân viên đi đào tạo (phải là member Active của dự án)
  role: 'Trainer' | 'Support'   // Trainer = người dạy chính, Support = hỗ trợ
  days              // số ngày tham gia đào tạo
}

TrainingCost {
  id, trainingPlanId
  category: 'Di chuyển' | 'Lưu trú' | 'Ăn uống' | 'Tài liệu' | 'Thuê địa điểm' | 'Khác'
  description
  amount (VND)
  paidBy            // nhân viên ứng trước hoặc công ty trả trực tiếp
  status: 'Kế hoạch' | 'Đã chi'
}
```

**Luồng nghiệp vụ TrainingPlan:**
```
PM tạo TrainingPlan (status = Draft)
  → Chọn nhân sự đi đào tạo (từ members Active của dự án)
  → Nhập các khoản chi phí dự kiến
  → Xác nhận kế hoạch (status = Confirmed)
        ↓
Triển khai đào tạo (status = InProgress)
        ↓
Kết thúc → PM đánh dấu Completed
        ↓
Accountant cập nhật TrainingCost thực tế (status Đã chi)
  → Tạo CashFlowEntry loại Chi, category 'Đào tạo', gắn projectId
```

**Ràng buộc:**
- Chỉ chọn nhân viên có `approvalStatus = Approved` và `status = Active` trong dự án làm trainer
- Mỗi dự án có thể có nhiều `TrainingPlan` (nhiều đợt đào tạo)
- Chi phí đào tạo thực tế do `Accountant` xác nhận và tạo `CashFlowEntry` — không tự động
- PM và CEO xem toàn bộ TrainingPlan; Lead xem TrainingPlan có mình trong danh sách trainers

---

### 4.8 Nhân sự (Personnel) — Quản lý bởi HR

```
Personnel {
  id, fullName, email, phone
  departmentId
  role: 'CEO' | 'PM' | 'Lead' | 'Accountant' | 'HR' | 'Employee'
  baseSalary        // ⭐ lương cơ bản — do HR thiết lập và cập nhật, không ai khác được sửa
  status: 'Active' | 'Inactive'
  joinDate
}

Department {
  id, name, leadId   // leadId = nhân viên có role Lead của phòng
  memberIds[]
}
```

**Phân quyền quản lý nhân sự:**
- `HR`: toàn quyền CRUD nhân viên, phòng ban, **thiết lập và cập nhật `baseSalary`**
- `CEO`: xem toàn bộ, không sửa baseSalary
- `PM / Lead / Accountant / Employee`: không truy cập module Personnel

---

### 4.9 Payroll (Bảng lương)

Lương nhân viên được tính tổng hợp từ **4 thành phần**:

```
EmployeeCost {
  personnelId
  payrollPeriodId
  baseSalary           // lấy từ Personnel.baseSalary tại thời điểm tính lương (snapshot)
  allocationAmount     // = baseSalary × (%PB / 100) × (số ngày thực tế làm / tổng ngày trong kỳ)
                       // tính tổng hợp từ tất cả dự án nhân viên tham gia trong kỳ
  timesheetAmount      // lương OT = số giờ OT × đơn giá OT (cấu hình trong Settings)
  performanceBonus     // thưởng hiệu suất từ PerformanceBonus (PM đánh giá theo dự án)
  totalAmount          // = allocationAmount + timesheetAmount + performanceBonus
}

PayrollPeriod {
  id, month, year
  status: 'Draft' | 'Confirmed'
  entries: EmployeeCost[]
  createdBy            // Accountant hoặc CEO
}
```

> ⚠️ `baseSalary` trong `EmployeeCost` là **snapshot** tại thời điểm chốt lương — không bị ảnh hưởng nếu HR cập nhật lương sau đó.

**Sau khi chốt bảng lương (status = Confirmed):**
- Hệ thống **tự động tạo `CashFlowEntry`** loại Chi, category "Lương nhân sự", gắn với từng dự án tương ứng
- Chỉ `Accountant` hoặc `CEO` được chốt bảng lương

### 4.10 CashFlow

```
CashFlowEntry {
  id, projectId
  type: 'Thu' | 'Chi'
  category: 'Lương nhân sự' | 'CSVC' | 'Vendor' | 'Đào tạo' | 'Ngoài kế hoạch' | 'Doanh thu'
  amount (VND)
  date
  description
  source: 'Auto' | 'Manual'  // Auto = từ Payroll, Manual = kế toán nhập tay
  createdBy
}
```

- Doanh thu ghi nhận **thủ công** khi thực thu — do `Accountant` hoặc `CEO` nhập
- Chi phí lương **tự động** từ Payroll sau khi chốt
- Các chi phí khác (CSVC, Vendor...) do `Accountant` nhập tay; `PM` **không** có quyền nhập CashFlowEntry trực tiếp

### 4.11 Dashboard

4 nhóm thông tin chính hiển thị trên Dashboard, **cập nhật realtime**:

1. **Tổng quan dòng tiền**: biểu đồ thu/chi theo tháng, P&L dự án, tỉ lệ thực hiện vs kế hoạch
2. **Tiến độ dự án**: danh sách dự án Active, % hoàn thành, số task theo trạng thái
3. **KPI nhân sự**: utilization rate, nhân viên theo dự án, hiệu suất trung bình
4. **Cảnh báo rủi ro**: task quá hạn, dự án vượt ngân sách, nhân sự Inactive đang có task

---

## 5. LUỒNG NGHIỆP VỤ END-TO-END

```
[HR] Tạo Department → Tạo Personnel → Thiết lập baseSalary
      ↓
[Sales/PM] Tạo Customer → Tạo Contract
      ↓
[PM/CEO] Tạo Project (Draft → Active ngay, không cần duyệt)
  - Bước 1: Thông tin dự án
  - Bước 2: Thêm Lead các phòng vào dự án
  - Bước 3: Nhập kế hoạch chi phí
  - Nhấn "Tạo dự án" → status = Active
      ↓
[Lead] Thêm nhân viên phòng mình → Gửi PersonnelRequest → ApprovalRequest (Pending)
      ↓
[CEO] Duyệt/từ chối từng người hoặc cả nhóm
  → Approved: nhân viên xuất hiện trong project, có thể giao task
  → Rejected: Lead chỉnh sửa và gửi lại
      ↓
[PM] Tạo Sprint (Planning) → Active sprint → Tạo Task trong sprint
[Lead] Tạo task cho nhân viên phòng mình trong sprint đang Active
      ↓
[Employee] Cập nhật tiến độ task → [PM] Chấm WorkShift / đánh giá hiệu suất
      ↓
[PM] Kết thúc Sprint → status = Completed → SprintReport tự tổng hợp
     Task chưa Done → chuyển sang Sprint tiếp theo hoặc Backlog
      ↓
[PM] Tạo TrainingPlan — kế hoạch đào tạo KH sau phát triển
  → Chọn trainers (từ members Active)
  → Nhập chi phí dự kiến (di chuyển, lưu trú, tài liệu...)
  → Xác nhận → Triển khai → Completed
      ↓
[Accountant] Xác nhận chi phí đào tạo thực tế → tạo CashFlowEntry 'Đào tạo'
[Accountant] Nhập CashFlowEntry thu/chi khác (doanh thu, CSVC, Vendor...)
      ↓
[Accountant/CEO] Tạo PayrollPeriod → Xác nhận → Auto tạo CashFlowEntry lương
      ↓
[PM] Đóng Project → status = Completed
```

---

## 6. MA TRẬN PHÂN QUYỀN

| Chức năng | CEO | PM | Lead | Accountant | HR | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Xem Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo/sửa dự án | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem tất cả dự án | ✅ | ✅ | Tham gia | Tham gia | ❌ | Tham gia |
| Thêm nhân viên vào dự án | ✅ | ✅ | Phòng mình | ❌ | ❌ | ❌ |
| Duyệt nhân sự dự án | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tạo/quản lý Sprint | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem Sprint | ✅ | ✅ | Dự án tham gia | ❌ | ❌ | Dự án tham gia |
| Tạo task | ✅ | ✅ | Phòng mình | ❌ | ❌ | ❌ |
| Xem task | ✅ | ✅ tất cả | Phòng mình | ❌ | ❌ | Task mình |
| Cập nhật task | ✅ | ✅ | Phòng mình | ❌ | ❌ | Chỉ % tiến độ |
| Đổi người thực hiện task | ✅ | ✅ | Phòng mình | ❌ | ❌ | ❌ |
| Chấm WorkShift / đánh giá | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tạo/quản lý TrainingPlan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem TrainingPlan | ✅ | ✅ | Có tên trong trainers | ❌ | ❌ | Có tên trong trainers |
| Xác nhận chi phí đào tạo thực tế | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Xem CashFlow | ✅ | Dự án mình | ❌ | ✅ toàn bộ | ❌ | ❌ |
| Nhập CashFlowEntry (thu/chi) | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Xem Payroll | ✅ | Dự án mình | ❌ | ✅ toàn bộ | ✅ (chỉ baseSalary) | Của bản thân |
| Tạo / chốt bảng lương | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Quản lý nhân viên (CRUD) | Xem | ❌ | ❌ | ❌ | ✅ | ❌ |
| Thiết lập baseSalary | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Quản lý phòng ban | Xem | ❌ | ❌ | ❌ | ✅ | ❌ |
| Xem Approvals | ✅ | Request mình | Request mình | ❌ | ❌ | ❌ |
| Duyệt Approvals | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 7. CẤU TRÚC THƯ MỤC

```
/
├── server.ts                  # Express + Vite middleware / static serve
├── vite.config.ts
├── index.html
├── .env.example
├── src/
│   ├── App.tsx                # Routes chính
│   ├── types.ts               # ⭐ Source of truth cho tất cả types/interfaces
│   ├── store/
│   │   └── useStore.ts        # ⭐ Zustand store — state tập trung + seed data
│   ├── pages/                 # Mỗi route chính = 1 file
│   │   ├── Dashboard.tsx
│   │   ├── Contracts.tsx
│   │   ├── Projects.tsx
│   │   ├── ProjectBoard.tsx   # Kanban realtime
│   │   ├── ProjectBonuses.tsx
│   │   ├── SprintReport.tsx
│   │   ├── Personnel.tsx
│   │   ├── Payroll.tsx
│   │   ├── CashFlow.tsx
│   │   ├── Approvals.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── kanban/            # Kanban board, drag & drop
│   │   ├── project/           # Project detail, tabs, forms
│   │   ├── personnel/         # Personnel list, department
│   │   ├── contract/          # Contract forms, list
│   │   ├── cashflow/          # CashFlow entries, charts
│   │   ├── Layout.tsx         # Shell — Sidebar + Topbar + Outlet
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── RealtimeProvider.tsx  # Socket.io client context
│   ├── hooks/
│   │   └── useSubstitution.ts # Hook xử lý đổi người thực hiện task
│   └── services/
│       └── RealtimeService.ts # Pub/sub CỤC BỘ (không phải Socket.io)
└── docs/
    └── ECOTECH_CONTEXT_TOAN_HE_THONG.md  # File này
```

---

## 8. ZUSTAND STORE — CẤU TRÚC CHÍNH

> Đây là tóm tắt các slice chính. Cursor phải **luôn import từ store**, không hardcode data trong component.

```typescript
// useStore.ts — các slice chính
{
  // Auth / Session
  currentUser: Personnel
  currentRole: 'CEO' | 'PM' | 'Lead' | 'Accountant' | 'HR' | 'Employee'

  // Master data
  customers: Customer[]
  contracts: Contract[]
  departments: Department[]
  personnel: Personnel[]           // toàn bộ nhân viên công ty (bao gồm baseSalary — do HR quản lý)

  // Dự án
  projects: Project[]    // bao gồm members[], sprints[], tasks[], workSchedules[], trainingPlans[]

  // Tài chính
  cashFlowEntries: CashFlowEntry[]
  payrollPeriods: PayrollPeriod[]

  // Phê duyệt
  approvalRequests: ApprovalRequest[]

  // Actions — HR (chỉ role HR được gọi)
  addPersonnel: (personnel) => void
  updatePersonnel: (id, updates) => void
  updateBaseSalary: (personnelId, amount) => void   // ⭐ chỉ HR, snapshot vào Payroll khi chốt
  addDepartment: (dept) => void
  updateDepartment: (id, updates) => void

  // Actions — Project
  addProject: (project) => void
  updateProjectStatus: (id, status) => void
  addPersonnelToProject: (projectId, personnel[]) => void
  approvePersonnel: (approvalRequestId, personnelId, approved, note?) => void

  // Actions — Sprint
  addSprint: (sprint) => void
  updateSprint: (id, updates) => void
  activateSprint: (id) => void          // Planning → Active, chỉ 1 Active tại 1 thời điểm
  completeSprint: (id, unfinishedTaskAction: 'backlog' | 'nextSprint', nextSprintId?) => void

  // Actions — Task
  addTask: (task) => void
  updateTask: (id, updates) => void
  substituteTaskAssignee: (taskId, fromId, toId) => void  // giữ % progress, lưu SubstitutionLog
  moveTaskToSprint: (taskId, sprintId | null) => void     // null = Backlog

  // Actions — TrainingPlan
  addTrainingPlan: (plan) => void
  updateTrainingPlan: (id, updates) => void
  confirmTrainingCost: (costId, actualAmount) => void     // Accountant xác nhận chi thực tế

  // Actions — Tài chính (chỉ Accountant / CEO được gọi)
  addCashFlowEntry: (entry) => void
  confirmPayroll: (periodId) => void   // snapshot baseSalary, auto tạo CashFlowEntry lương
}
```

---

## 9. QUY ƯỚC CODE

- **Format tiền**: VND, dấu phẩy — `1,200,000,000`
- **Format ngày**: `DD/MM/YYYY`
- **Toast**: top-right, ✅ xanh thành công / ❌ đỏ lỗi, auto-dismiss 3s
- **ConfirmModal**: bắt buộc cho mọi action xóa / đổi trạng thái quan trọng
- **Phân trang**: 10/20/50 dòng, hiển thị "X–Y của Z kết quả"
- **Validate form**: highlight đỏ + message lỗi khi submit thiếu field bắt buộc (*)
- **Empty state**: icon + text "Không tìm thấy dữ liệu" khi filter không có kết quả
- **Loading**: skeleton 300ms khi chuyển route
- **Không hardcode data trong component** — luôn lấy từ Zustand store

---

## 10. NHỮNG GÌ CHƯA LÀM / NGOÀI PHẠM VI HIỆN TẠI

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Backend / Database thật | ❌ Chưa có | Toàn bộ mock Zustand |
| Authentication thật | ❌ Chưa có | Role mock trong store |
| AI (Google Genai) | ❌ Chưa tích hợp | Dependency đã khai báo, chưa có usecase |
| Quản lý Vendor/NCC | ❌ Chưa có | Có thể cần cho chi phí dự án |
| Quản lý Thuế (VAT/CIT) | ❌ Chưa có | Có thể cần cho CashFlow sau này |
| Export báo cáo (PDF/Excel) | ❌ Chưa có | |
| Mobile responsive | ⚠️ Chưa ưu tiên | |

# 01 — Tổng Quan Sản Phẩm

## ECOTECH — Kiến trúc sư Tài chính

SaaS quản lý dòng tiền & vận hành dự án nội bộ dành cho **doanh nghiệp vừa (SME)**. Hệ thống bao phủ toàn bộ vòng đời:

```
Ký hợp đồng → Lập kế hoạch dự án → Thực thi (task, timesheet) → Tính lương → Đóng sổ tài chính
```

---

## TECH STACK

| Thành phần | Công nghệ | Ghi chú quan trọng |
|---|---|---|
| Framework | React 19 + Vite 6 | Không dùng class component |
| Routing | React Router 7 | File-based routing qua App.tsx |
| State | **Zustand** | Toàn bộ state + mock seed data. KHÔNG dùng useState cho global state |
| Styling | **Tailwind CSS 4** | Utility-first. Không viết CSS file riêng |
| Drag & Drop | `@dnd-kit` | Chỉ dùng cho Kanban board |
| Charts | **Recharts** | Dashboard & reports |
| Animation | Motion (Framer Motion) | Dùng tiết kiệm, không lạm dụng |
| Toast | react-hot-toast | `toast.success()` / `toast.error()` |
| Realtime | Socket.io | Server + client — xem chi tiết bên dưới |
| AI | `@google/genai` | Đã khai báo, CHƯA tích hợp UI — không implement trừ khi được yêu cầu |
| Dev server | `tsx server.ts` | Express + Vite middleware |

---

## REALTIME — SOCKET.IO

> ⚠️ `RealtimeService.ts` là pub/sub **CỤC BỘ** (trong tab). Khác hoàn toàn với Socket.io. Không nhầm lẫn.

Phòng (room) theo `projectId`. Màn hình dùng Socket.io thực sự:

| Màn hình | Sự kiện |
|---|---|
| `/projects/:id/board` | Kéo thả task, cập nhật trạng thái, presence (ai đang online) |
| Chat trong task | Gửi/nhận message, typing indicator |
| Notification toàn app | Duyệt nhân sự, task mới, deadline |
| Dashboard KPI | Cập nhật số liệu realtime |

---

## NGUỒN DỮ LIỆU

> ⚠️ **Toàn bộ dữ liệu là mock/seed trong Zustand**. Không có backend thật, không có database.

---

## CẤU TRÚC THƯ MỤC DỰ ÁN

```
/
├── server.ts                  # Express + Vite middleware / static serve
├── vite.config.ts
├── index.html
├── .env.example
├── src/
│   ├── App.tsx                # Routes chính — thêm route mới vào đây
│   ├── types.ts               # ⭐ SOURCE OF TRUTH — tất cả types/interfaces
│   ├── store/
│   │   └── useStore.ts        # ⭐ ZUSTAND STORE — state tập trung + seed data
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
│   │   ├── kanban/            # KanbanColumn, TaskCard, drag & drop
│   │   ├── project/           # ProjectDetail, tabs, forms
│   │   ├── personnel/         # PersonnelList, DepartmentPanel
│   │   ├── contract/          # ContractForm, ContractList
│   │   ├── cashflow/          # CashFlowTable, charts
│   │   ├── Layout.tsx         # Shell — Sidebar + Topbar + <Outlet />
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── Topbar.tsx         # Header với role switcher
│   │   ├── ProtectedRoute.tsx # Bảo vệ route theo role
│   │   └── RealtimeProvider.tsx  # Socket.io client context
│   ├── hooks/
│   │   └── useSubstitution.ts # Đổi người thực hiện task
│   └── services/
│       └── RealtimeService.ts # Pub/sub cục bộ (KHÔNG phải Socket.io)
└── .agent/                    # ← Thư mục này — context cho AI agent
```

---

## ROLES & PERMISSIONS TÓM TẮT

| Role | Mô tả |
|---|---|
| `CEO` | Xem toàn bộ, duyệt nhân sự dự án, xem Dashboard tổng |
| `PM` | Tạo/quản lý dự án, tạo sprint, phân công task, chấm timesheet |
| `Lead` | Thêm nhân viên phòng mình vào dự án, tạo task cho phòng mình |
| `Accountant` | Nhập thu/chi, tạo & chốt bảng lương, xem báo cáo tài chính |
| `HR` | Quản lý nhân viên, phòng ban, thiết lập baseSalary |
| `Employee` | Xem task được giao, cập nhật % tiến độ task của mình |

> Chi tiết phân quyền từng chức năng → xem `03_business_flows.md`

---

## QUY ƯỚC UI/UX BẮT BUỘC

- **Format tiền**: VND, dấu phẩy — `1,200,000,000 ₫`
- **Format ngày**: `DD/MM/YYYY`
- **Toast**: top-right — `toast.success()` xanh / `toast.error()` đỏ, auto-dismiss 3s
- **ConfirmModal**: BẮT BUỘC trước mọi action xóa hoặc đổi trạng thái quan trọng
- **Phân trang**: 10/20/50 dòng, hiển thị "X–Y của Z kết quả"
- **Validate form**: highlight đỏ + message lỗi khi submit thiếu field bắt buộc (*)
- **Empty state**: icon + text "Không tìm thấy dữ liệu" khi filter không có kết quả
- **Loading skeleton**: 300ms khi chuyển route
- **Không hardcode data** trong component — luôn lấy từ Zustand store

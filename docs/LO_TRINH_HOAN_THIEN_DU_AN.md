# Lộ trình hoàn thiện dự án ECOTECH

Tài liệu này bổ sung cho [ECOTECH_CONTEXT_TOAN_HE_THONG.md](./ECOTECH_CONTEXT_TOAN_HE_THONG.md): thứ tự ưu tiên, phạm vi từng giai đoạn và tiêu chí “xong” để đưa sản phẩm từ **SPA mock (Zustand)** lên **sản phẩm vận hành được**.

---

## Nguyên tắc chung

1. **Không mở rộng song song** quá nhiều luồng: ưu tiên *nền tảng dữ liệu + xác thực* trước, sau đó *khớp nghiệp vụ từng module* với `types.ts` / ma trận phân quyền.
2. Mỗi giai đoạn có **milestone kiểm thử** (manual + tối thiểu test tự động cho logic tài chính / payroll nếu có).
3. Giữ **một nguồn sự thật** cho domain: `src/types.ts` + API schema (khi có backend).

---

## Giai đoạn 0 — Cơ sở hiện có (đã có trong repo)

| Hạng mục | Trạng thái |
|----------|------------|
| SPA React + Vite + Router + Tailwind | Có |
| Zustand + seed (`useStore.ts`) | Có |
| Các route chính (Dashboard, Projects, Board, Contracts, Personnel, Payroll, CashFlow, Approvals, Settings) | Có |
| Socket.io server + client (presence, relay, board sync một phần) | Có (cần mở rộng & thống nhất sự kiện) |
| Phân quyền theo role + tài khoản Admin demo | Có (`src/lib/permissions.ts`) |
| Luồng PersonnelProject (Lead → CEO/Admin), CashFlow/Payroll một phần nối store | Có (mức mock) |

**Việc nên làm ngay (kỹ thuật nhỏ, không đổi kiến trúc):**

- Đồng bộ **tài liệu** `ECOTECH_CONTEXT_TOAN_HE_THONG.md` mục 1 với code thực tế (vai trò: thêm `Admin`, `Accountant`, `HR`, …).
- Thống nhất **Personnel** trang `Personnel.tsx` (local state) với **Employee** trong Zustand — tránh hai nguồn nhân sự.

---

## Giai đoạn 1 — Chuẩn hóa nghiệp vụ trên mock (không backend)

**Mục tiêu:** Hành vi UI/store khớp đặc tả domain (task, payroll, cashflow, approvals) khi vẫn chỉ có Zustand.

| Thứ tự | Hạng mục | Gợi ý công việc | Tiêu chí xong |
|--------|----------|-----------------|---------------|
| 1.1 | **Task / Kanban** | 4 cột `Todo \| In Progress \| Review \| Done` (spec v2.2, không `Blocked`); Review→Done không do Employee tự xác nhận; `TaskStatus` khớp `types.ts` | Kéo thả & rule khớp ma trận §4.5 |
| 1.2 | **Payroll** | Công thức `EmployeeCost` theo spec (allocation + timesheet + thưởng); đồng bộ dữ liệu Payroll page với `payrollPeriods` store (một nguồn) | Chốt kỳ tạo đúng `CashFlowEntry` Auto; số liệu có thể trace |
| 1.3 | **CashFlow** | Category đúng danh mục nghiệp vụ; PM **không** vào route `/cashflow` (chỉ Accountant/CEO ghi thu/chi) | `ROUTE_ROLES.cashflow` + `canCreateCashFlowEntry` khớp spec |
| 1.4 | **Personnel (HR)** | CRUD gắn store; `updateBaseSalary` chỉ HR (và Admin); CEO read-only | Không còn seed tách khỏi màn HR |
| 1.5 | **Realtime** | Thống nhất: Socket.io cho đa tab; `RealtimeService` chỉ cho preview/local — ghi rõ trong code | Không nhầm hai kênh; board/chat dùng cùng contract sự kiện |
| 1.6 | **Dashboard** | KPI từ store thật; cảnh báo (quá hạn, vượt budget) đủ theo spec | Refresh khi đổi dữ liệu (có thể chưa realtime) |

**Ước lượng:** 2–4 sprint (tùy độ chi tiết và số người).

---

## Giai đoạn 2 — Backend & persistence

**Mục tiêu:** Thay dần mock bằng API + database; Zustand chỉ còn cache / UI state.

| Thứ tự | Hạng mục | Gợi ý công việc | Tiêu chí xong |
|--------|----------|-----------------|---------------|
| 2.1 | **Thiết kế API + schema** | REST hoặc GraphQL; bảng: users, personnel, projects, tasks, payroll_periods, cashflow_entries, approvals | OpenAPI/spec được team chốt |
| 2.2 | **Auth** | Đăng nhập, JWT/session, refresh; map role từ server | `ProtectedRoute` đọc từ token, không hardcode Admin |
| 2.3 | **Migration dữ liệu** | Script seed staging; không phụ thuộc seed trong bundle production | Môi trường dev/staging có data mẫu |
| 2.4 | **Realtime** | Socket.io rooms + auth socket; đồng bộ task/events qua server | Hai trình duyệt thấy cùng trạng thái sau thao tác |

**Ước lượng:** 4–8 sprint (phụ thuộc stack backend và team).

---

## Giai đoạn 3 — Sản phẩm hóa & vận hành

| Thứ tự | Hạng mục | Gợi ý công việc | Tiêu chí xong |
|--------|----------|-----------------|---------------|
| 3.1 | **Export** | PDF/Excel báo cáo tài chính, bảng lương (theo §8 doc gốc) | Xuất được theo kỳ / theo dự án |
| 3.2 | **Responsive / mobile** | Layout breakpoints; ưu tiên màn xem & duyệt | Không vỡ layout trên tablet |
| 3.3 | **Quan sát & nhật ký** | Logging, audit trail (duyệt, chốt lương, sửa lương cơ bản) | Đủ cho kiểm toán nội bộ |
| 3.4 | **Triển khai** | Docker / CI/CD, biến môi trường, HTTPS | Production checklist |

---

## Giai đoạn 4 — Mở rộng tùy chọn

| Hạng mục | Ghi chú (theo doc) |
|----------|---------------------|
| **AI (`@google/genai`)** | Gắn use case (tóm tắt dự án, gợi ý phân bổ…) — sau khi có dữ liệu thật |
| **Thuế / Vendor** | VAT/CIT, nhà cung cấp — khi nghiệp vụ kế toán chốt phạm vi |
| **Tích hợp kế toán / ngân hàng** | Theo nhu cầu doanh nghiệp |

---

## Rủi ro & phụ thuộc

- **Hai mô hình nhân sự** (`Personnel` page vs `employees` trong store) — nếu không gộp sớm, chi phí refactor Giai đoạn 2 tăng.
- **Socket + Zustand** — cần quy ước “source of truth” sau khi có API (thường: server → client).
- **Payroll / thuế** — sai số pháp lý; nên có review kế toán trước khi coi là production-ready.

---

## Gợi ý theo dõi tiến độ

- **Mỗi sprint:** 1–2 hạng mục lớn từ Giai đoạn 1 hoặc 2 + fix bug.
- **Definition of Done:** có mô tả PR, test manual ghi trong ticket, cập nhật `ECOTECH_CONTEXT` nếu đổi route/domain.

---

*Phiên bản: 1.0 — căn cứ `docs/ECOTECH_CONTEXT_TOAN_HE_THONG.md` và trạng thành mã nguồn SME-Ecotech2A.*

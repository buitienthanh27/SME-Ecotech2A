# Feature Spec: Sprint Management

## Mục tiêu
Quản lý các giai đoạn phát triển (sprint) trong một dự án. PM tạo và điều hành sprint; Lead và Employee xem.

---

## UI Components cần có

### 1. SprintList (trong Tab Sprint của ProjectBoard)
- Bảng hoặc danh sách card hiển thị tất cả sprint của dự án
- Mỗi sprint hiển thị: Tên | Ngày bắt đầu/kết thúc | Goal | Trạng thái | Số task | Thao tác

### 2. SprintForm (Popup/Modal tạo/sửa sprint)
Fields bắt buộc (*):
- Tên sprint* (ví dụ: "Sprint 1 — Phân tích & Thiết kế")
- Goal (mục tiêu, optional)
- Ngày bắt đầu*
- Ngày kết thúc*

### 3. SprintSelector (Dropdown trên Kanban Board)
- Dropdown chọn sprint hiện tại đang xem trên board
- Bao gồm option "Backlog" ở cuối
- Hiển thị trạng thái sprint bên cạnh tên

### 4. CompleteSprintDialog
- Hiển thị khi PM nhấn [Kết thúc Sprint]
- Thống kê: X task Done, Y task chưa xong
- Radio: Chuyển task chưa xong về Backlog / Chuyển sang Sprint tiếp theo
- Nếu chọn sprint tiếp theo: dropdown chọn sprint Planned
- Nút [Xác nhận kết thúc]

---

## Business Rules

### Tạo Sprint
- Chỉ PM và CEO
- `sprintNo` tự động tăng (max sprintNo trong project + 1)
- `status` ban đầu = `'Planned'`
- Ngày kết thúc phải sau ngày bắt đầu

### Activate Sprint
- Chỉ PM và CEO
- **Điều kiện**: Có ít nhất 1 task trong sprint
- **Ràng buộc**: Nếu đã có sprint Active trong dự án → tự động hiện cảnh báo, yêu cầu confirm trước
- Chuyển sprint hiện Active thành Planned (hoặc block — hỏi người dùng chọn behavior)
- `status` = `'Active'`

### Complete Sprint
- Chỉ PM và CEO
- Show `CompleteSprintDialog` để xử lý task chưa Done
- Nếu chọn Backlog: `task.sprintId = null` cho tất cả task chưa Done
- Nếu chọn Sprint tiếp: `task.sprintId = nextSprintId` cho tất cả task chưa Done
- `status` = `'Completed'`, ghi `completedAt`
- Sprint Completed **không thể reopen**
- SprintReport tự động được generate

### Xóa Sprint
- Chỉ PM và CEO
- Chỉ được xóa sprint `status = 'Planned'`
- Nếu sprint có task: chuyển task về Backlog trước khi xóa
- ConfirmModal bắt buộc

---

## Permission Check trong Code

```typescript
const { currentRole } = useStore();
const canManageSprint = ['CEO', 'PM'].includes(currentRole);

// Chỉ hiện buttons này nếu có quyền:
{canManageSprint && <Button onClick={handleAddSprint}>+ Tạo Sprint</Button>}
{canManageSprint && sprint.status === 'Planned' && (
  <Button onClick={() => handleActivate(sprint.id)}>Activate</Button>
)}
{canManageSprint && sprint.status === 'Active' && (
  <Button onClick={() => handleComplete(sprint.id)}>Kết thúc Sprint</Button>
)}
```

---

## Store Actions cần dùng

```typescript
const { addSprint, updateSprint, activateSprint, completeSprint, deleteSprint } = useStore();

// Tạo sprint:
addSprint({
  projectId,
  name: form.name,
  sprintNo: maxSprintNo + 1,
  goal: form.goal,
  startDate: form.startDate,
  endDate: form.endDate,
  status: 'Planned',
  order: maxOrder + 1,
});

// Activate:
activateSprint(sprintId);

// Complete:
completeSprint(sprintId, 'backlog'); // hoặc 'nextSprint', nextSprintId
```

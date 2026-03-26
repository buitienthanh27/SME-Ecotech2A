# Feature Spec: Task & Kanban Board

## Mục tiêu
Kanban board realtime 4 cột cho phép quản lý task theo sprint, drag & drop, và xem/cập nhật chi tiết task.

---

## Kanban Board

### Layout
```
[Sprint Selector Dropdown]   [+ Thêm Task]   [Filter]   [Online: Avatar Avatar ...]

┌──────────┐  ┌────────────┐  ┌────────┐  ┌──────┐
│   TODO   │  │ IN PROGRESS│  │ REVIEW │  │ DONE │
│  (N)     │  │  (N)       │  │ (N)    │  │ (N)  │
│          │  │            │  │        │  │      │
│ [card]   │  │ [card]     │  │ [card] │  │[card]│
│ [card]   │  │ [card]     │  │        │  │[card]│
│          │  │            │  │        │  │      │
│  + Add   │  │            │  │        │  │      │
└──────────┘  └────────────┘  └────────┘  └──────┘
```

### Drag & Drop (dnd-kit)
```typescript
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Khi drag kết thúc:
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;
  
  const taskId = active.id as string;
  const newStatus = over.id as TaskStatus; // column id = TaskStatus
  
  // Kiểm tra quyền
  if (!canChangeStatus(currentTask.status, newStatus, currentRole)) {
    toast.error('Bạn không có quyền thực hiện thao tác này');
    return;
  }
  
  updateTaskStatus(taskId, newStatus, { id: currentUser.id, name: currentUser.name });
};
```

### Task Card Component
```tsx
interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

// Hiển thị:
// - Priority badge (Cao=đỏ, Trung bình=vàng, Thấp=xanh lá)
// - Type badge (Feature/Bug/Task/Research)
// - Title (truncate nếu quá dài)
// - Avatar assignees (max 3, +N)
// - Due date (đỏ nếu quá hạn, vàng nếu trong 3 ngày)
// - Progress bar (chỉ hiện nếu progressPercent > 0)
// - Comment count icon
// - Drag handle (::before pseudo-element hoặc icon)
```

---

## Task Drawer (Chi tiết Task)

### Layout (slide-in từ phải, width ~600px)

**Header**: Title (editable inline) | [X đóng]

**Tabs**: [Chi tiết] [Comments] [Lịch sử]

### Tab Chi tiết
```
Status:     [Dropdown — kiểm tra quyền]
Priority:   [Dropdown]
Type:       [Dropdown]
Sprint:     [Dropdown — sprint Planned/Active]
Due date:   [Date picker]
Assignees:  [Avatar list] [+ Thêm] — chỉ isMemberAssignableForTask()
Progress:   [Slider 0-100%] — chỉ assignee cập nhật
Description:[Textarea — editable nếu có quyền]
Tags:       [Tag input]
```

### Tab Comments (realtime)
- List comments theo thời gian
- Input textarea + nút [Gửi]
- Socket.io: `socket.emit('task:comment', {...})`, `socket.on('task:comment', callback)`
- Typing indicator

### Tab Lịch sử
**Status History:**
```
[timestamp] [user] đã chuyển từ "In Progress" → "Review"
```

**Substitution Log (Lịch sử đổi người):**
```
[date] Đổi người thực hiện: [oldAssignee] → [newAssignee] tại mốc [N]%
Ghi chú: [note]
```

---

## Form Tạo/Sửa Task

### Fields
```
Tiêu đề task*
Mô tả (Textarea)
Sprint (Dropdown — null = Backlog)
Assignees (Multi-select — chỉ approved members)
Priority* (Cao/Trung bình/Thấp)
Type (Feature/Bug/Task/Research)
Ngày bắt đầu
Ngày kết thúc
Ước tính (giờ)
Tags
```

### Permission khi tạo task
```typescript
// PM/CEO: tạo task bất kỳ cho bất kỳ ai trong dự án
// Lead: chỉ tạo task và giao cho nhân viên phòng mình
const myDeptMemberIds = getDeptMembers(currentUser.departmentId);
const assignableMembers = project.members
  .filter(isMemberAssignableForTask)
  .filter(m => currentRole === 'Lead' ? myDeptMemberIds.includes(m.employeeId) : true);
```

---

## Đổi Người Thực Hiện Task

### Trigger
- PM/CEO/Lead (phạm vi phòng) nhấn icon 🔄 trên assignee trong Task Drawer

### Modal
```
Đổi người thực hiện
Từ: [Avatar] [Tên người hiện tại]
Sang: [Dropdown chọn người mới — approved members]
Ghi chú: [Textarea]

[Hủy] [Xác nhận đổi người]
```

### Logic
```typescript
const handleSubstitute = () => {
  substituteTaskAssignee(taskId, fromPersonnelId, toPersonnelId, note);
  // Store tự động:
  // 1. Cập nhật assignees
  // 2. Push SubstitutionLog vào progressHistory
  // 3. Giữ nguyên progressPercent
  toast.success(`Đã đổi người thực hiện sang ${newAssigneeName}`);
};
```

---

## Backlog

### Hiển thị
- Dạng danh sách (KHÔNG phải Kanban)
- Khi `SprintSelector = 'Backlog'`
- Bảng: Tiêu đề | Priority | Assignee | Due date | Thao tác [Thêm vào sprint]

### Chuyển task từ Backlog vào Sprint
```typescript
// Popup chọn sprint
const handleMoveToSprint = (taskId: string, sprintId: string) => {
  moveTaskToSprint(taskId, sprintId);
  toast.success('Đã chuyển task vào sprint');
};
```

---

## Status Transition Rules (enforce trong code)

```typescript
const canTransition = (
  from: TaskStatus,
  to: TaskStatus,
  role: AppRole,
  isAssignee: boolean
): boolean => {
  const transitions: Record<string, { to: TaskStatus[]; roles: AppRole[] }[]> = {
    'Todo': [{ to: ['In Progress'], roles: ['CEO', 'PM', 'Lead', 'Employee'] }],
    'In Progress': [{ to: ['Review'], roles: ['CEO', 'PM', 'Lead', 'Employee'] }],
    'Review': [
      { to: ['Done'], roles: ['CEO', 'PM', 'Lead'] },          // Employee KHÔNG tự Done
      { to: ['In Progress'], roles: ['CEO', 'PM', 'Lead'] },   // Reject
    ],
  };
  // Check role có trong allowed roles không
  // Check isAssignee nếu cần
};
```

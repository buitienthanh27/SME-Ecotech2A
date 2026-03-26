# Feature Spec: Approvals — Luồng Phê Duyệt Nhân Sự

## Mục tiêu
Quản lý luồng Lead thêm nhân viên phòng mình vào dự án → CEO duyệt.

---

## Màn hình Approvals (`/approvals`)

### Tabs
- **Chờ duyệt** (badge count)
- **Đã duyệt**
- **Đã từ chối**

### Bảng (mỗi tab)
```
STT | Tiêu đề | Loại | Dự án | Người gửi | Ngày gửi | Ưu tiên | Trạng thái | Thao tác
```

- **CEO**: Xem TẤT CẢ requests + có nút [Duyệt/Từ chối]
- **Lead/PM**: Chỉ xem request của mình, không có nút duyệt

---

## Popup Duyệt Request (CEO only)

```
Tiêu đề: "Duyệt nhân sự dự án: [Tên dự án]"

Thông tin request:
- Người gửi: [Lead name] — [Phòng ban]
- Ngày gửi: [date]
- Dự án: [project name]

Danh sách nhân viên đề xuất:
┌────────────────────────────────────────────────────┐
│ ☑ [Avatar] Nguyễn Văn A — Developer — 50% PB       │
│ ☑ [Avatar] Trần Thị B — Tester — 30% PB            │
│ ☐ [Avatar] Lê Văn C — BA — 40% PB                  │
└────────────────────────────────────────────────────┘

Lý do từ chối (hiện ra khi CEO chọn từ chối 1 người):
[Textarea placeholder="Vui lòng ghi rõ lý do..."]

Nút: [Duyệt tất cả được chọn] [Từ chối được chọn] [Đóng]
```

### Logic khi duyệt
```typescript
// Approve:
approvePersonnelInRequest(requestId, selectedMemberIds);
// → Cập nhật ProjectMember.approvalStatus = 'Approved' cho từng member
// → ApprovalRequest.status = 'Approved' (nếu tất cả approved)
// → Realtime notification cho Lead

// Reject:
rejectPersonnelInRequest(requestId, selectedMemberIds, note);
// → Cập nhật ProjectMember.approvalStatus = 'Rejected'
// → ApprovalRequest.status = 'Rejected' (nếu tất cả rejected)
// → Lưu note vào ApprovalRequest
// → Realtime notification cho Lead
```

---

## Lead thêm nhân viên vào dự án

### Nơi trigger
- Tab "Nhân sự" trong ProjectBoard
- Nút [Thêm nhân viên vào dự án] — chỉ hiện với Lead

### Form (Popup)
```
Chọn nhân viên:
[Danh sách checkbox nhân viên trong phòng ban của Lead]
 ☑ Nguyễn Văn A (Chưa trong dự án)
 ☐ Trần Thị B (Đã trong dự án - disabled)
 ☑ Lê Văn C (Chưa trong dự án)

Với mỗi nhân viên được chọn:
  Role trong dự án: [Dropdown: Developer/Tester/BA/Other]
  % Phân bổ: [Number input 1-100]

[Hủy] [Gửi duyệt CEO]
```

### Logic khi gửi
```typescript
// 1. Tạo ProjectMember cho mỗi nhân viên với approvalStatus = 'Pending'
addMemberToProject(projectId, {
  employeeId,
  role,
  allocation,
  status: 'Active',
  approvalStatus: 'Pending',
  startDate: today,
  endDate: project.endDate,
});

// 2. Tạo ApprovalRequest
addApprovalRequest({
  title: `Thêm nhân sự vào dự án: ${project.name}`,
  type: 'PersonnelProject',
  priority: 'Medium',
  targetRole: 'CEO',
  projectId: project.id,
  status: 'Pending',
  submittedBy: currentUser.name,
  requesterId: currentUser.id,
  submittedAt: new Date().toISOString(),
});

toast.success('Đã gửi yêu cầu phê duyệt đến CEO');
```

---

## Hiển thị trong Tab Nhân sự của ProjectBoard

```
┌─────────────────────────────────────────────────────┐
│ Nhân sự dự án                        [+ Thêm (Lead)]│
├─────────────────────────────────────────────────────┤
│ Avatar | Tên | Phòng ban | Role | % PB | Trạng thái │
│  [A]    An   | Dev      | Dev  | 50%  | ✅ Approved  │
│  [B]    Bình | Dev      | Tester|30%  | ⏳ Pending   │
│  [C]    Chi  | QA       | BA   | 40%  | ❌ Rejected  │
└─────────────────────────────────────────────────────┘
```

Badge màu:
- `Approved` = xanh lá
- `Pending` = cam/vàng
- `Rejected` = đỏ (hiện tooltip lý do từ chối)

> ⚠️ Nhân viên `Pending` và `Rejected` KHÔNG được hiện trong dropdown giao task.

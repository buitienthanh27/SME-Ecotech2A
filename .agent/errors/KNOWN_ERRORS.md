# KNOWN ERRORS — Lỗi Đã Gặp & Cách Fix

> **ĐỌC FILE NÀY ĐẦU TIÊN** trước khi bắt đầu code.
> Sau mỗi lần fix lỗi, **THÊM VÀO FILE NÀY NGAY**.

---

## FORMAT ENTRY

```
### [ERR-NNN] Tên lỗi ngắn gọn
- **Ngày phát hiện**: DD/MM/YYYY
- **File bị ảnh hưởng**: path/to/file.tsx
- **Mô tả**: Mô tả lỗi xảy ra như thế nào
- **Root cause**: Tại sao lỗi xảy ra
- **Fix**: Cách đã fix
- **Phòng tránh**: Cách không gặp lại lỗi này
```

---

## DANH SÁCH LỖI ĐÃ GẶP

*(Chưa có lỗi nào được log — file này sẽ được cập nhật khi agent gặp và fix lỗi)*

---

## TEMPLATE ĐỂ THÊM LỖI MỚI

Khi gặp và fix lỗi mới, copy template dưới đây và điền vào:

```markdown
### [ERR-001] Tên lỗi
- **Ngày phát hiện**: DD/MM/YYYY
- **File bị ảnh hưởng**: 
- **Mô tả**: 
- **Root cause**: 
- **Fix**: 
- **Phòng tránh**: 
```

---

## LỖI PHỔ BIẾN TRONG REACT/TYPESCRIPT (KINH NGHIỆM CHUNG)

### [WARN-001] useStore re-render không cần thiết
- **Vấn đề**: Dùng `const store = useStore()` lấy toàn bộ store → component re-render khi bất kỳ state nào thay đổi
- **Fix**: Dùng selector: `const projects = useStore(s => s.projects)`

### [WARN-002] isMemberAssignableForTask bị bỏ qua
- **Vấn đề**: Hiển thị cả nhân viên Pending/Rejected trong dropdown giao task
- **Fix**: Luôn filter bằng `project.members.filter(isMemberAssignableForTask)` trước khi render dropdown

### [WARN-003] baseSalary không phải snapshot
- **Vấn đề**: Dùng `employee.baseSalary` trực tiếp trong EmployeeCost thay vì copy giá trị vào field riêng
- **Fix**: Khi tạo EmployeeCost, gán `baseSalary: employee.baseSalary` vào object — đây là snapshot, không reference

### [WARN-004] Sprint Active bị duplicate
- **Vấn đề**: Activate sprint mới mà không deactivate sprint đang Active → 2 sprint Active cùng lúc
- **Fix**: Trong `activateSprint` action, luôn tìm và set sprint Active hiện tại về Planned trước

### [WARN-005] Employee tự đánh dấu Done
- **Vấn đề**: Employee kéo task vào cột Done trên Kanban
- **Fix**: Trong `handleDragEnd`, kiểm tra `canTransition()` — Employee không được chuyển sang Done

### [WARN-006] CashFlowEntry Auto bị xóa
- **Vấn đề**: Cho phép xóa entry từ Payroll (source='Auto')
- **Fix**: Kiểm tra `entry.source !== 'Auto'` trước khi hiện nút xóa

### [WARN-007] Format tiền bị sai
- **Vấn đề**: Hiển thị `1500000` thay vì `1,500,000 ₫`
- **Fix**: Luôn dùng `formatVND()` helper, không dùng `.toString()` trực tiếp

### [WARN-008] dnd-kit p.slides subscriptable error
- **Vấn đề**: Cố dùng array index trực tiếp với dnd-kit sortable context
- **Fix**: Dùng `items` prop với array of string IDs trong `SortableContext`

### [WARN-009] Modal không close sau khi submit
- **Vấn đề**: Quên gọi `setIsOpen(false)` sau khi store action thành công
- **Fix**: Luôn close modal và reset form state sau khi action thành công + toast

### [WARN-010] ConfirmModal thiếu cho action quan trọng
- **Vấn đề**: Xóa record hoặc đổi trạng thái quan trọng mà không có confirm
- **Fix**: Mọi DELETE và status change quan trọng phải qua ConfirmModal — không ngoại lệ

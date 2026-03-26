# Feature Spec: Payroll & CashFlow

---

## PAYROLL (`/payroll`)

### Trang danh sách kỳ lương

**Ai truy cập**: Accountant (full), CEO (full), HR (chỉ xem baseSalary), PM (dự án mình), Employee (của bản thân)

**Layout:**
```
Banner: "Quản lý Bảng Lương"
[+ Tạo kỳ lương mới] — chỉ Accountant/CEO

Tabs: [Tất cả] [Nháp] [Đã chốt]

Bảng:
Kỳ lương | Số nhân viên | Tổng lương | Trạng thái | Ngày tạo | Thao tác
T1/2026  |      25       |   450M ₫  | Đã chốt    | 01/02/26  | [Xem]
T2/2026  |      27       |   480M ₫  | Nháp       | 01/03/26  | [Xem] [Chốt]
```

### Tạo kỳ lương

**Popup:**
```
Tháng*:  [Month picker]
Năm*:    [Year input]

[Hủy] [Tạo & Tính toán]
```

**Logic tính toán EmployeeCost:**
```typescript
const calculatePayroll = (month: number, year: number, projects: Project[], employees: Employee[]) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  
  return employees
    .filter(e => e.status === 'Active' || e.employmentStatus === 'Đang làm việc')
    .map(employee => {
      // Tổng allocationAmount từ tất cả dự án
      let allocationAmount = 0;
      projects.forEach(project => {
        const member = project.members.find(
          m => m.employeeId === employee.id && m.approvalStatus === 'Approved' && m.status === 'Active'
        );
        if (member) {
          // Tính ngày thực tế làm việc trong kỳ
          const workDays = getWorkDaysInPeriod(project, month, year);
          allocationAmount += (employee.baseSalary || 0) * (member.allocation / 100) * (workDays / daysInMonth);
        }
      });
      
      // OT từ WorkShift trong tháng
      const otHours = getOTHours(employee.id, month, year);
      const timesheetAmount = otHours * otRate; // otRate từ Settings
      
      // Thưởng từ PerformanceBonus
      const performanceBonus = getPerformanceBonuses(employee.id, month, year);
      
      return {
        personnelId: employee.id,
        baseSalary: employee.baseSalary || 0,  // SNAPSHOT
        allocationAmount: Math.round(allocationAmount),
        timesheetAmount: Math.round(timesheetAmount),
        performanceBonus: Math.round(performanceBonus),
        totalAmount: Math.round(allocationAmount + timesheetAmount + performanceBonus),
      };
    });
};
```

### Chi tiết kỳ lương

```
[← Quay lại]   Bảng lương tháng 3/2026   [Trạng thái badge]

Thống kê:
Tổng nhân viên: 27 | Tổng lương: 480,000,000 ₫ | Trung bình: 17,777,778 ₫

[Tải Excel] [Chốt bảng lương] — chỉ Accountant/CEO khi status=Draft

Bảng EmployeeCost:
Nhân viên | Phòng | Lương CB (snapshot) | Phân bổ | OT | Thưởng HP | Tổng | Dự án
```

### Chốt bảng lương (Confirm Payroll)

```typescript
// ConfirmModal trước:
"Sau khi chốt, bảng lương không thể sửa. Hệ thống sẽ tự động tạo chi phí lương trong CashFlow."

const handleConfirm = () => {
  confirmPayroll(periodId);
  // Store tự động:
  // 1. Set status = 'Confirmed', confirmedAt = now
  // 2. Với mỗi dự án có nhân viên:
  //    addCashFlowEntry({
  //      projectId,
  //      type: 'Chi phí',
  //      category: 'Lương nhân sự',
  //      amount: totalForProject,
  //      date: today,
  //      source: 'Auto',
  //      description: `Lương tháng ${month}/${year}`,
  //      createdBy: currentUser.id,
  //    })
  toast.success('Đã chốt bảng lương. Chi phí lương đã được ghi vào CashFlow.');
};
```

---

## CASHFLOW (`/cashflow`)

### Ai truy cập
- **Accountant**: xem + nhập toàn bộ
- **CEO**: xem toàn bộ + nhập
- **PM**: chỉ xem CashFlowEntry của dự án mình

### Layout

```
Banner: "Quản lý Dòng Tiền"
[+ Thêm giao dịch] — chỉ Accountant/CEO

KPI Cards:
[Tổng thu: X ₫] [Tổng chi: X ₫] [Lợi nhuận: X ₫] [Số giao dịch: N]

Bộ lọc:
[Từ ngày] [Đến ngày] [Loại: Thu/Chi/Tất cả] [Danh mục ▼] [Dự án ▼]

Biểu đồ dòng tiền (BarChart 2 series)

Bảng giao dịch (phân trang):
Ngày | Loại | Danh mục | Dự án | Mô tả | Số tiền | Nguồn | Người nhập | Thao tác
```

### Popup thêm CashFlowEntry

```
Loại*:      [Thu nhập / Chi phí]
Danh mục*:  [Dropdown dựa theo loại]
              Thu nhập: Doanh thu
              Chi phí: CSVC | Vendor | Đào tạo | Ngoài kế hoạch
Dự án:      [Dropdown projects — optional]
Ngày*:      [Date picker — default today]
Số tiền*:   [Number input — format VND]
Mô tả:      [Textarea]

[Hủy] [Lưu giao dịch]
```

### Danh mục CashFlow
```typescript
const CASHFLOW_CATEGORIES = {
  'Thu nhập': ['Doanh thu'],
  'Chi phí': ['Lương nhân sự', 'CSVC', 'Vendor', 'Đào tạo', 'Ngoài kế hoạch'],
};
// 'Lương nhân sự' chỉ có source = 'Auto' — không cho phép nhập tay loại này
```

### Xóa CashFlowEntry
- Chỉ được xóa entry có `source = 'Manual'`
- Entry `source = 'Auto'` (từ Payroll): KHÔNG cho phép xóa — tooltip giải thích
- ConfirmModal bắt buộc

### Biểu đồ
```tsx
// BarChart dòng tiền theo tháng
<BarChart data={monthlyData}>
  <Bar dataKey="income" name="Thu nhập" fill="#22c55e" />
  <Bar dataKey="expense" name="Chi phí" fill="#ef4444" />
</BarChart>

// PieChart phân bổ theo danh mục
<PieChart>
  <Pie data={categoryData} dataKey="amount" nameKey="category" />
</PieChart>
```

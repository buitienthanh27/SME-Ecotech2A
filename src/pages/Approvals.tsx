import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Calendar, 
  DollarSign,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ApprovalRequest } from '../types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader, FilterBar } from '../components/ui';
import { canApprovePersonnelOnProject, isAdmin } from '../lib/permissions';

export function Approvals() {
  const { approvalRequests, projects, updateApprovalRequest, updateProject, currentUser } =
    useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const requestsForRole = useMemo(() => {
    const role = currentUser?.role;
    if (!role) return approvalRequests;
    if (role === 'CEO' || isAdmin(role)) return approvalRequests;
    if (role === 'PM' || role === 'Lead') {
      return approvalRequests.filter((a) => a.requesterId === currentUser?.id);
    }
    return approvalRequests;
  }, [approvalRequests, currentUser]);

  const filteredApprovals = useMemo(
    () =>
      requestsForRole.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [requestsForRole, searchTerm]
  );

  const stats = useMemo(() => ({
    pending: approvalRequests.filter(a => a.status === 'Pending').length,
    approved: approvalRequests.filter(a => a.status === 'Approved').length,
  }), [approvalRequests]);

  const handleApprove = (request: ApprovalRequest) => {
    if (request.type === 'PersonnelProject' && !canApprovePersonnelOnProject(currentUser?.role ?? 'Employee')) {
      toast.error('Chỉ CEO hoặc quản trị mới duyệt bổ sung nhân sự dự án.');
      return;
    }
    updateApprovalRequest(request.id, {
      status: 'Approved',
      processedAt: new Date().toISOString().split('T')[0],
      processedBy: currentUser?.id || 'CEO',
    });
    if (request.type === 'PersonnelProject' && request.projectId && request.pendingMemberId) {
      const proj = projects.find((p) => p.id === request.projectId);
      if (proj) {
        updateProject(request.projectId, {
          members: proj.members.map((m) =>
            m.id === request.pendingMemberId ? { ...m, approvalStatus: 'Approved' as const } : m
          ),
        });
      }
      toast.success('Đã duyệt nhân sự tham gia dự án.');
      return;
    }
    if (request.type === 'ProjectPlan' && request.projectId) {
      updateProject(request.projectId, { status: 'Đang thực hiện' });
      toast.success('Đã phê duyệt kế hoạch dự án. Dự án hiện đã có thể giao task.');
    } else {
      toast.success('Đã phê duyệt yêu cầu.');
    }
  };

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    updateApprovalRequest(selectedRequest.id, {
      status: 'Rejected',
      processedAt: new Date().toISOString().split('T')[0],
      processedBy: currentUser?.id || 'CEO',
      note: rejectionReason,
    });
    if (selectedRequest.type === 'PersonnelProject' && selectedRequest.projectId && selectedRequest.pendingMemberId) {
      const proj = projects.find((p) => p.id === selectedRequest.projectId);
      if (proj) {
        updateProject(selectedRequest.projectId, {
          members: proj.members.map((m) =>
            m.id === selectedRequest.pendingMemberId
              ? { ...m, approvalStatus: 'Rejected' as const }
              : m
          ),
        });
      }
      toast.success('Đã từ chối bổ sung nhân sự.');
    } else if (selectedRequest.type === 'ProjectPlan' && selectedRequest.projectId) {
      updateProject(selectedRequest.projectId, { status: 'Draft', rejectionNote: rejectionReason });
      toast.success('Đã từ chối kế hoạch dự án.');
    } else {
      toast.success('Đã từ chối yêu cầu.');
    }
    setIsRejectModalOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trung tâm phê duyệt"
        description="Xem xét và phê duyệt kế hoạch dự án, chi phí và các yêu cầu khác."
        actions={
          <div className="flex items-center gap-3 bg-white border border-[#E2E8F0] px-3 py-2 rounded-[8px] shadow-sm text-[13px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#F59E0B] rounded-full" />
              <span className="font-semibold text-[#1A202C]">{stats.pending} Đang chờ</span>
            </span>
            <div className="w-px h-4 bg-[#E2E8F0]" />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#148922] rounded-full" />
              <span className="font-semibold text-[#1A202C]">{stats.approved} Đã duyệt</span>
            </span>
          </div>
        }
      />

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm kiếm yêu cầu..."
      />

      <div className="space-y-3">
        {filteredApprovals.map(item => (
          <ApprovalItem
            key={item.id}
            item={item}
            canApprove={item.type !== 'PersonnelProject' || canApprovePersonnelOnProject(currentUser?.role ?? 'Employee')}
            onApprove={() => handleApprove(item)}
            onReject={() => { setSelectedRequest(item); setIsRejectModalOpen(true); }}
            onViewDetails={() => setSelectedRequest(item)}
          />
        ))}
        {filteredApprovals.length === 0 && (
          <div className="bg-white p-12 rounded-[12px] border-2 border-dashed border-[#E2E8F0] text-center">
            <div className="w-14 h-14 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-[#148922]" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1A202C]">Tất cả đã được xử lý</h3>
            <p className="text-[14px] text-[#718096] mt-1">Hiện không có yêu cầu nào đang chờ phê duyệt.</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[12px] shadow-2xl w-full max-w-md border border-[#E2E8F0] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0]">
                <h3 className="text-[16px] font-bold text-[#1A202C]">Từ chối yêu cầu</h3>
                <p className="text-[13px] text-[#718096] mt-0.5">Vui lòng cung cấp lý do từ chối.</p>
              </div>
              <div className="p-5">
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#EF4444]/20 focus:border-[#EF4444] transition-all resize-none"
                  placeholder="Nhập lý do từ chối..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="px-5 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end gap-3">
                <button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 text-[13px] font-bold text-[#718096] border border-[#E2E8F0] rounded-[8px] hover:bg-[#F1F5F9] transition-all">
                  Hủy
                </button>
                <button onClick={handleReject} className="px-4 py-2 bg-[#EF4444] text-white rounded-[8px] text-[13px] font-bold hover:bg-red-600 transition-all shadow-sm">
                  Xác nhận từ chối
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRequest && !isRejectModalOpen && (
          <RequestDetailModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onApprove={() => { handleApprove(selectedRequest); setSelectedRequest(null); }}
            onReject={() => setIsRejectModalOpen(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ApprovalItem({ item, canApprove = true, onApprove, onReject, onViewDetails }: any) {
  const { employees } = useStore();
  const requester = employees.find(e => e.id === item.requesterId);

  const statusConfig: any = {
    'Pending':  { icon: Clock,        color: 'text-[#F59E0B]', bg: 'bg-amber-50',   border: 'border-amber-100',   label: 'Đang chờ' },
    'Approved': { icon: CheckCircle2, color: 'text-[#148922]', bg: 'bg-[#ECFDF5]',  border: 'border-emerald-100', label: 'Đã duyệt' },
    'Rejected': { icon: XCircle,      color: 'text-[#EF4444]', bg: 'bg-red-50',     border: 'border-red-100',     label: 'Đã từ chối' },
  };

  const priorityColors: any = {
    'High':   'bg-red-50 text-[#EF4444]',
    'Medium': 'bg-[#ECFDF5] text-[#148922]',
    'Low':    'bg-gray-100 text-gray-600',
  };

  const config = statusConfig[item.status];
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

  return (
    <div className={`bg-white p-5 rounded-[12px] shadow-sm border ${config.border} hover:shadow-md transition-all`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center ${config.bg} ${config.color}`}>
            {item.type === 'ProjectPlan' ? <FileText className="w-5 h-5" /> : item.type === 'PersonnelProject' ? <User className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-[14px] text-[#1A202C]">{item.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColors[item.priority]}`}>
                {item.priority === 'High' ? 'Cao' : item.priority === 'Medium' ? 'Trung bình' : 'Thấp'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-[#718096]">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {requester?.name || 'Hệ thống'}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.createdAt}</span>
              {item.amount && (
                <span className="font-bold text-[#1A202C]">{fmt(item.amount)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {item.status === 'Pending' ? (
            <>
              <button onClick={onViewDetails} className="p-1.5 text-[#718096] hover:text-[#148922] hover:bg-[#ECFDF5] rounded-[6px] transition-all" title="Xem chi tiết">
                <Eye className="w-4 h-4" />
              </button>
              {canApprove && (
                <button onClick={onApprove} className="px-3 py-1.5 bg-[#ECFDF5] text-[#148922] rounded-[8px] text-[13px] font-bold hover:bg-green-100 transition-all flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                </button>
              )}
              {canApprove && (
                <button onClick={onReject} className="px-3 py-1.5 bg-[#FEE2E2] text-[#EF4444] rounded-[8px] text-[13px] font-bold hover:bg-red-100 transition-all flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Từ chối
                </button>
              )}
            </>
          ) : (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[13px] font-bold ${config.bg} ${config.color}`}>
              {React.createElement(config.icon, { className: 'w-3.5 h-3.5' })}
              {config.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestDetailModal({ request, onClose, onApprove, onReject }: { request: ApprovalRequest; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const { projects, employees, customers } = useStore();
  const project = projects.find(p => p.id === request.projectId);
  const customer = customers.find(c => c.id === project?.customerId);
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

  if (!project) return null;

  if (request.type === 'PersonnelProject' && request.pendingMemberId) {
    const member = project.members.find((m) => m.id === request.pendingMemberId);
    const emp = employees.find((e) => e.id === member?.employeeId);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[12px] shadow-2xl w-full max-w-md border border-[#E2E8F0] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center">
            <h3 className="text-[16px] font-bold text-[#1A202C]">Duyệt nhân sự dự án</h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-[8px]">
              <XCircle className="w-5 h-5 text-[#718096]" />
            </button>
          </div>
          <div className="p-6 space-y-2 text-[14px]">
            <p><span className="text-[#718096]">Dự án:</span> <span className="font-bold">{project.name}</span></p>
            <p><span className="text-[#718096]">Nhân sự:</span> <span className="font-bold">{emp?.name || '—'}</span></p>
            <p><span className="text-[#718096]">Vai trò:</span> <span className="font-bold">{member?.role}</span></p>
          </div>
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end gap-2">
            <button type="button" onClick={onReject} className="px-4 py-2 border border-[#EF4444] text-[#EF4444] rounded-[8px] text-[13px] font-bold">Từ chối</button>
            <button type="button" onClick={onApprove} className="px-4 py-2 bg-[#148922] text-white rounded-[8px] text-[13px] font-bold">Duyệt</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-[12px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-[#E2E8F0]"
      >
        <div className="px-7 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#148922] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">Kế hoạch dự án</span>
              <span className="text-[13px] text-[#718096] font-medium">#{project.code}</span>
            </div>
            <h3 className="text-[20px] font-bold text-[#1A202C]">{project.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-[8px] transition-all">
            <XCircle className="w-5 h-5 text-[#718096]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
              <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-3">Thông tin chung</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[12px] text-[#718096]">Khách hàng</p>
                  <p className="text-[13px] font-bold text-[#1A202C]">{customer?.name}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#718096]">Thời gian</p>
                  <p className="text-[13px] font-bold text-[#1A202C]">{project.startDate} - {project.endDate}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
              <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-3">Tài chính</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[12px] text-[#718096]">Ngân sách dự kiến</p>
                  <p className="text-[13px] font-bold text-[#148922]">{fmt(project.budget)}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#718096]">Tổng chi phí kế hoạch</p>
                  <p className="text-[13px] font-bold text-[#1A202C]">
                    {fmt(project.costPlan.reduce((sum, item) => sum + item.plannedAmount, 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
              <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-3">Nhân sự</p>
              <div className="flex -space-x-2 mb-2">
                {project.members.map((m, i) => {
                  const emp = employees.find(e => e.id === m.employeeId);
                  return (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-[#ECFDF5] flex items-center justify-center" title={emp?.name}>
                      <span className="text-[9px] font-bold text-[#148922]">{emp?.name?.charAt(0)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[12px] font-bold text-[#4A5568]">{project.members.length} thành viên</p>
            </div>
          </div>

          {/* Cost Plan */}
          <div>
            <h4 className="text-[14px] font-bold text-[#1A202C] mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#148922]" />
              Kế hoạch chi phí chi tiết
            </h4>
            <div className="bg-[#F8FAFC] rounded-[10px] overflow-hidden border border-[#E2E8F0]">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                    <th className="px-4 py-3 font-bold text-[#718096]">Hạng mục</th>
                    <th className="px-4 py-3 font-bold text-[#718096]">Loại</th>
                    <th className="px-4 py-3 font-bold text-[#718096] text-right">Số tiền dự kiến</th>
                    <th className="px-4 py-3 font-bold text-[#718096]">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {project.costPlan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white transition-all">
                      <td className="px-4 py-3 font-medium text-[#1A202C]">{item.category}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-white border border-[#E2E8F0] rounded text-[10px] font-bold text-[#718096] uppercase">{item.type}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#1A202C]">{fmt(item.plannedAmount)}</td>
                      <td className="px-4 py-3 text-[#718096] italic">{item.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[14px] font-bold text-[#1A202C] mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#148922]" />
              Mô tả dự án
            </h4>
            <div className="bg-[#F8FAFC] p-4 rounded-[10px] border border-[#E2E8F0] text-[14px] text-[#4A5568] leading-relaxed">
              {project.description || 'Không có mô tả chi tiết.'}
            </div>
          </div>
        </div>

        <div className="px-7 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-between items-center">
          <div className="flex items-center gap-2 text-[13px] text-[#718096]">
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
            <span>Phê duyệt sẽ chuyển dự án sang <b className="text-[#1A202C]">Đang thực hiện</b>.</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onReject} className="px-5 py-2 bg-white border border-[#EF4444] text-[#EF4444] rounded-[8px] font-bold text-[13px] hover:bg-red-50 transition-all">
              Từ chối kế hoạch
            </button>
            <button onClick={onApprove} className="px-5 py-2 bg-[#148922] text-white rounded-[8px] font-bold text-[13px] hover:bg-[#0f6b1b] transition-all shadow-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Phê duyệt ngay
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical, 
  FileText, 
  User, 
  Calendar, 
  DollarSign,
  ChevronRight,
  AlertCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ApprovalRequest, Project } from '../types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export function Approvals() {
  const { approvalRequests, projects, updateApprovalRequest, updateProject, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const filteredApprovals = useMemo(() => {
    return approvalRequests.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [approvalRequests, searchTerm]);

  const stats = useMemo(() => {
    return {
      pending: approvalRequests.filter(a => a.status === 'Pending').length,
      approved: approvalRequests.filter(a => a.status === 'Approved').length
    };
  }, [approvalRequests]);

  const handleApprove = (request: ApprovalRequest) => {
    updateApprovalRequest(request.id, { 
      status: 'Approved', 
      processedAt: new Date().toISOString().split('T')[0],
      processedBy: currentUser?.id || 'CEO'
    });
    
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
      note: rejectionReason
    });

    if (selectedRequest.type === 'ProjectPlan' && selectedRequest.projectId) {
      updateProject(selectedRequest.projectId, { 
        status: 'Draft',
        rejectionNote: rejectionReason
      });
      toast.success('Đã từ chối kế hoạch dự án. PM sẽ nhận được thông báo.');
    } else {
      toast.success('Đã từ chối yêu cầu.');
    }

    setIsRejectModalOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trung tâm phê duyệt</h2>
          <p className="text-gray-500">Xem xét và phê duyệt kế hoạch dự án, chi phí và các yêu cầu khác.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-bold text-gray-700">{stats.pending} Đang chờ</span>
          </div>
          <div className="w-px h-4 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm font-bold text-gray-700">{stats.approved} Đã duyệt</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm yêu cầu..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
          <Filter className="w-4 h-4" />
          Bộ lọc
        </button>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.map((item) => (
          <ApprovalItem 
            key={item.id} 
            item={item} 
            onApprove={() => handleApprove(item)}
            onReject={() => {
              setSelectedRequest(item);
              setIsRejectModalOpen(true);
            }}
            onViewDetails={() => setSelectedRequest(item)}
          />
        ))}
        {filteredApprovals.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tất cả đã được xử lý</h3>
            <p className="text-gray-500">Hiện không có yêu cầu nào đang chờ phê duyệt.</p>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Từ chối yêu cầu</h3>
                <p className="text-sm text-gray-500 mt-1">Vui lòng cung cấp lý do từ chối để người yêu cầu có thể điều chỉnh.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Lý do từ chối (*)</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    placeholder="Ví dụ: Ngân sách vượt quá định mức cho phép, cần tối ưu lại nhân sự..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-6 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleReject}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Detail Modal (Simplified for now) */}
      <AnimatePresence>
        {selectedRequest && !isRejectModalOpen && (
          <RequestDetailModal 
            request={selectedRequest} 
            onClose={() => setSelectedRequest(null)}
            onApprove={() => {
              handleApprove(selectedRequest);
              setSelectedRequest(null);
            }}
            onReject={() => setIsRejectModalOpen(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ApprovalItem({ item, onApprove, onReject, onViewDetails }: any) {
  const { employees } = useStore();
  const requester = employees.find(e => e.id === item.requesterId);

  const statusConfig: any = {
    'Pending': { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', label: 'Đang chờ' },
    'Approved': { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Đã duyệt' },
    'Rejected': { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', label: 'Đã từ chối' },
  };

  const priorityColors: any = {
    'High': 'bg-red-100 text-red-700',
    'Medium': 'bg-blue-100 text-blue-700',
    'Low': 'bg-gray-100 text-gray-700',
  };

  const config = statusConfig[item.status];

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border ${config.border} hover:shadow-md transition-all group`}>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg} ${config.color}`}>
            {item.type === 'ProjectPlan' ? <FileText className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900">{item.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColors[item.priority]}`}>
                {item.priority === 'High' ? 'Cao' : item.priority === 'Medium' ? 'Trung bình' : 'Thấp'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {requester?.name || 'Hệ thống'}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.createdAt}</span>
              {item.amount && (
                <span className="flex items-center gap-1 font-bold text-gray-900">
                  <DollarSign className="w-3 h-3" /> 
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {item.status === 'Pending' ? (
            <>
              <button 
                onClick={onViewDetails}
                className="p-2 text-gray-400 hover:text-[#003366] hover:bg-gray-50 rounded-lg transition-all"
                title="Xem chi tiết"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button 
                onClick={onApprove}
                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Duyệt
              </button>
              <button 
                onClick={onReject}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Từ chối
              </button>
            </>
          ) : (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${config.bg} ${config.color}`}>
              {React.createElement(config.icon, { className: "w-4 h-4" })}
              {config.label}
            </div>
          )}
          <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestDetailModal({ request, onClose, onApprove, onReject }: { request: ApprovalRequest, onClose: () => void, onApprove: () => void, onReject: () => void }) {
  const { projects, employees, customers } = useStore();
  const project = projects.find(p => p.id === request.projectId);
  const customer = customers.find(c => c.id === project?.customerId);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-[#003366] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">Kế hoạch dự án</span>
              <span className="text-sm text-gray-400 font-medium">#{project.code}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{project.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin chung</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Khách hàng</p>
                  <p className="text-sm font-bold text-gray-900">{customer?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thời gian</p>
                  <p className="text-sm font-bold text-gray-900">{project.startDate} - {project.endDate}</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Tài chính</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Ngân sách dự kiến</p>
                  <p className="text-sm font-bold text-[#003366]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.budget)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tổng chi phí kế hoạch</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.costPlan.reduce((sum, item) => sum + item.plannedAmount, 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Nhân sự</p>
              <div className="flex -space-x-2 mb-3">
                {project.members.map((m, i) => {
                  const emp = employees.find(e => e.id === m.employeeId);
                  return (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden" title={emp?.name}>
                      <img src={emp?.avatar} alt={emp?.name} className="w-full h-full object-cover" />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-gray-700">{project.members.length} thành viên tham gia</p>
            </div>
          </div>

          {/* Cost Plan Table */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#FF6600]" />
              Kế hoạch chi phí chi tiết
            </h4>
            <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100/50 border-b border-gray-200">
                    <th className="px-6 py-4 font-bold text-gray-600">Hạng mục</th>
                    <th className="px-6 py-4 font-bold text-gray-600">Loại</th>
                    <th className="px-6 py-4 font-bold text-gray-600 text-right">Số tiền dự kiến</th>
                    <th className="px-6 py-4 font-bold text-gray-600">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {project.costPlan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white transition-all">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.category}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-500 uppercase">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.plannedAmount)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 italic">{item.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Description */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#003366]" />
              Mô tả dự án
            </h4>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-600 leading-relaxed">
              {project.description || 'Không có mô tả chi tiết.'}
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span>Phê duyệt kế hoạch này sẽ chuyển trạng thái dự án sang <b>Đang thực hiện</b>.</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onReject}
              className="px-8 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all"
            >
              Từ chối kế hoạch
            </button>
            <button 
              onClick={onApprove}
              className="px-8 py-3 bg-[#003366] text-white rounded-xl font-bold hover:bg-[#002244] transition-all shadow-lg shadow-[#003366]/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Phê duyệt ngay
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

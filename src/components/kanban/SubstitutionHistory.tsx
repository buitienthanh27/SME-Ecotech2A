import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History, UserPlus, UserMinus, ArrowRight } from 'lucide-react';
import { SubstitutionLog, ProjectMember } from '../../types';
import { format } from 'date-fns';
import clsx from 'clsx';

interface Props {
  logs: SubstitutionLog[];
  members: ProjectMember[];
}

export const SubstitutionHistory: React.FC<Props> = ({ logs, members }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (logs.length === 0) return null;

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <History className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-gray-900 text-sm">Lịch sử thay thế nhân sự</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{logs.length} lượt bàn giao</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isOpen && (
        <div className="p-6 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {logs.map((log, index) => {
            const original = members.find(m => m.id === log.originalAssigneeId);
            const replacement = members.find(m => m.id === log.newAssigneeId);

            return (
              <div key={log.id} className="relative pl-6 border-l-2 border-dashed border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <span>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">Bàn giao {log.progressAtSubstitution}%</span>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white shadow-sm">
                        {original?.name.charAt(0)}
                      </div>
                      <div className="text-[10px]">
                        <p className="font-bold text-gray-900">{original?.name}</p>
                        <p className="text-gray-400">{original?.role}</p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-300" />

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm">
                        {replacement?.name.charAt(0)}
                      </div>
                      <div className="text-[10px]">
                        <p className="font-bold text-gray-900">{replacement?.name}</p>
                        <p className="text-gray-400">{replacement?.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                    <p className="text-xs text-amber-900 leading-relaxed italic">
                      <span className="font-bold not-italic">Lý do:</span> {log.reason}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

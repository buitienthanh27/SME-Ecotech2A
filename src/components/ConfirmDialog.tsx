import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Xác nhận', 
  cancelText = 'Hủy',
  variant = 'danger'
}) => {
  const colors = {
    danger: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white shadow-red-500/20',
    warning: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white shadow-amber-500/20',
    info: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white shadow-blue-500/20',
  };

  const btnColors = {
    danger: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
    warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
    info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={cn("p-3 rounded-2xl", variant === 'danger' ? "bg-red-50" : variant === 'warning' ? "bg-amber-50" : "bg-blue-50")}>
                  <AlertTriangle className={cn("w-6 h-6", variant === 'danger' ? "text-red-600" : variant === 'warning' ? "text-amber-600" : "text-blue-600")} />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{title}</h3>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "flex-1 py-4 text-white rounded-2xl font-bold text-sm shadow-xl transition-all",
                    btnColors[variant]
                  )}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

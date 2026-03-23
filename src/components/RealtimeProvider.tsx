import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, Bell } from 'lucide-react';

interface RealtimeContextType {
  emit: (event: string, data: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler: (data: any) => void) => void;
  isConnected: boolean;
  presence: string[];
  typingUsers: { [userId: string]: string };
  setTyping: (isTyping: boolean) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within a RealtimeProvider');
  return context;
};

interface Props {
  children: React.ReactNode;
  projectId: string;
  userId: string;
  userName: string;
}

export const RealtimeProvider: React.FC<Props> = ({ children, projectId, userId, userName }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presence, setPresence] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const typingTimeoutRef = useRef<{ [userId: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-project', { projectId, userId, userName });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('presence-updated', (users: string[]) => {
      setPresence(users);
    });

    newSocket.on('user-typing', ({ userId: typingUserId, userName: typingUserName, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => ({ ...prev, [typingUserId]: typingUserName }));
        if (typingTimeoutRef.current[typingUserId]) clearTimeout(typingTimeoutRef.current[typingUserId]);
        typingTimeoutRef.current[typingUserId] = setTimeout(() => {
          setTypingUsers(prev => {
            const next = { ...prev };
            delete next[typingUserId];
            return next;
          });
        }, 3000);
      } else {
        setTypingUsers(prev => {
          const next = { ...prev };
          delete next[typingUserId];
          return next;
        });
      }
    });

    // Global toast listener for realtime events
    const events = [
      'task.created',
      'task.status_changed',
      'task.progress_logged',
      'task.commented',
      'project.staff_substituted',
      'task.assigned',
      'sprint.progress_updated',
      'bonus.created'
    ];

    events.forEach(event => {
      newSocket.on(event, (data: any) => {
        const message = data.userName 
          ? `${data.userName} đã ${data.action} '${data.taskTitle || data.title}'`
          : `Có thay đổi mới: ${event}`;
        
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [projectId, userId, userName]);

  const emit = useCallback((event: string, data: any) => {
    if (socket) {
      socket.emit('emit-event', { event, data: { ...data, userId, userName }, projectId });
    }
  }, [socket, projectId, userId, userName]);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    socket?.on(event, handler);
  }, [socket]);

  const off = useCallback((event: string, handler: (data: any) => void) => {
    socket?.off(event, handler);
  }, [socket]);

  const setTyping = useCallback((isTyping: boolean) => {
    socket?.emit('typing', { projectId, userId, userName, isTyping });
  }, [socket, projectId, userId, userName]);

  return (
    <RealtimeContext.Provider value={{ emit, on, off, isConnected, presence, typingUsers, setTyping }}>
      <div className="relative min-h-screen">
        {/* Connection Status Banner */}
        <AnimatePresence>
          {!isConnected && (
            <motion.div 
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
              className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-lg"
            >
              <WifiOff className="w-4 h-4 animate-pulse" />
              Mất kết nối realtime — đang thử kết nối lại...
            </motion.div>
          )}
          {isConnected && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, times: [0, 0.1, 0.9, 1] }}
              className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-bold pointer-events-none"
            >
              <Wifi className="w-4 h-4" />
              Đã kết nối realtime
            </motion.div>
          )}
        </AnimatePresence>

        {children}

        {/* Realtime Toasts */}
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className="bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 flex items-center gap-4 min-w-[300px] pointer-events-auto"
              >
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-gray-700">{toast.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </RealtimeContext.Provider>
  );
};

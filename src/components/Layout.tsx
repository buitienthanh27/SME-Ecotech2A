import React, { createContext, useContext, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router-dom';

interface LayoutContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const LayoutContext = createContext<LayoutContextValue>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useLayout = () => useContext(LayoutContext);

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <LayoutContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <Sidebar />
        <div
          className="flex-1 flex flex-col min-w-0 transition-all duration-250"
          style={{ marginLeft: 0 }}
        >
          <Topbar />
          <main className="flex-1 overflow-y-auto" style={{ padding: 'var(--page-padding)' }}>
            <div className="fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}

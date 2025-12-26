import React from 'react';

interface LayoutProps {
  sidebar: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
  topRight?: React.ReactNode;
  sidebarPosition?: 'fixed' | 'inline';
}

const Layout: React.FC<LayoutProps> = ({ sidebar, header, children, className = '', sidebarCollapsed = false, topRight, sidebarPosition = 'inline' }) => {
  if (sidebarPosition === 'fixed') {
    return (
      <div className={`min-h-screen bg-slate-50 text-slate-900 font-sans ${className}`}>
        {sidebar}
        <main className={`${sidebarCollapsed ? 'ml-20' : 'ml-72'} overflow-y-auto transition-all duration-300`}>
          {header}
          <div className="p-8">
            {children}
          </div>
        </main>
        {topRight && <div className="absolute top-4 right-4">{topRight}</div>}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 font-sans flex relative ${className}`}>
      <div className="min-h-screen">
        {sidebar}
      </div>
      <main className="flex-1 overflow-y-auto transition-all duration-300">
        {header}
        <div className="p-8">
          {children}
        </div>
      </main>
      {topRight && <div className="absolute top-4 right-4">{topRight}</div>}
    </div>
  );
};

export default Layout;
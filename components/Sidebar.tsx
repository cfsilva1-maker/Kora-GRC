import React from 'react';
import { NavItem } from '../types';
import { Check, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Globe, LogOut } from 'lucide-react';

interface SidebarProps {
  navItems: NavItem[];
  activeTab: string;
  expandedMenus: string[];
  isCollapsed: boolean;
  onToggleMenu: (id: string) => void;
  onSetActiveTab: (id: string) => void;
  onToggleCollapse: () => void;
  hasPermission: (permission?: string) => boolean;
  currentUser?: any;
  onLogout: () => void;
  onSwitchToVendorPortal?: () => void;
  logoText?: { main: string; accent: string };
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  activeTab,
  expandedMenus,
  isCollapsed,
  onToggleMenu,
  onSetActiveTab,
  onToggleCollapse,
  hasPermission,
  currentUser,
  onLogout,
  onSwitchToVendorPortal,
  logoText = { main: 'Kora', accent: 'GRC' },
  className = ''
}) => {
  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 left-0 z-10 transition-all duration-300 shadow-xl border-r border-slate-800 ${className}`}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900 z-20">
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shadow-lg border border-slate-700 flex-shrink-0">
            <img src="/logo.png" alt="Kora GRC Logo" className="max-h-5" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-tight ml-3 animate-fade-in">
              <span className="text-white">{logoText.main}</span><span className="text-yellow-400">{logoText.accent}</span>
            </span>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="text-slate-500 hover:text-white transition-colors"
            title="Collapse Menu"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Toggle Button when collapsed */}
      {isCollapsed && (
        <div className="w-full flex justify-center py-2 border-b border-slate-800">
          <button
            onClick={onToggleCollapse}
            className="text-slate-500 hover:text-white transition-colors p-1"
            title="Expand Menu"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 overflow-x-hidden">
        {navItems.map((item) => {
          if (!hasPermission(item.requiredPermission)) return null;

          const hasChildren = item.children && item.children.some(c => hasPermission(c.requiredPermission));
          const isExpanded = expandedMenus.includes(item.id);
          const isParentActive = activeTab === item.id;
          const isChildActive = item.children?.some(c => c.id === activeTab);
          const isActive = isParentActive || isChildActive;

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => hasChildren ? onToggleMenu(item.id) : onSetActiveTab(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <span className={`transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && hasChildren && (
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-slate-500'}`} />
                )}
              </button>

              {/* Submenu */}
              {!isCollapsed && hasChildren && isExpanded && (
                <div className="relative ml-4 mt-1 pl-4 border-l border-slate-700/50 space-y-1 animate-fade-in-down">
                  {item.children?.map(child => {
                    if (!hasPermission(child.requiredPermission)) return null;
                    const isChildSelected = activeTab === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => onSetActiveTab(child.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                          isChildSelected
                            ? 'text-white bg-emerald-600/10 border border-emerald-500/20 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {isChildSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-[17px] w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>}

                        <span className={isChildSelected ? 'text-emerald-400' : 'text-slate-500'}>{child.icon}</span>
                        <span>{child.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-slate-800 bg-slate-900/50`}>
        {/* Vendor Portal Toggle */}
        {onSwitchToVendorPortal && (
          <button
            onClick={onSwitchToVendorPortal}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center py-4' : 'px-4 py-3 gap-3'} text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 transition-colors border-b border-slate-800`}
            title="Switch to External Vendor Portal"
          >
            <Globe className="w-5 h-5"/>
            {!isCollapsed && (
              <div className="text-left">
                <span className="block text-sm font-bold">Vendor Portal</span>
                <span className="text-[10px] opacity-70">Switch View</span>
              </div>
            )}
          </button>
        )}

        {/* User Profile */}
        <div className={`p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="w-full">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'} mb-3`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-800 flex-shrink-0 cursor-pointer" title={currentUser?.firstName}>
                {currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : 'JD'}
              </div>
              {!isCollapsed && (
                <div className="animate-fade-in overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{currentUser?.firstName} {currentUser.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.jobTitle}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-3 h-3"/> Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
import React from 'react';
import { Check, Building, Package, ClipboardList, AlertCircle, LogOut } from 'lucide-react';

interface VendorSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  className?: string;
}

const VendorSidebar: React.FC<VendorSidebarProps> = ({
  currentView,
  onViewChange,
  onLogout,
  className = ''
}) => {
  return (
    <aside className={`w-72 bg-slate-900 text-slate-300 flex flex-col min-h-screen p-6 gap-2 ${className}`}>
      <div className="h-12 flex items-center gap-3 mb-8 px-2">
        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shadow-lg border border-slate-700 flex-shrink-0">
          <img src="/logo.png" alt="Kora GRC" className="max-h-5" />
        </div>
        <div className="font-bold text-lg tracking-tight">
          <span className="text-white">Kora</span><span className="text-amber-400"> GRC</span>
        </div>
      </div>

      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">MANAGE PROFILE</div>
      <button
        onClick={() => onViewChange('profile')}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${currentView === 'profile' ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/40' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
      >
        <Building size={18}/> Company Profile
      </button>
      <button
        onClick={() => onViewChange('services_catalog')}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${currentView === 'services_catalog' ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/40' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
      >
        <Package size={18}/> Our Services
      </button>

      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2 mt-6">COMPLIANCE</div>
      <button
        onClick={() => onViewChange('assessments')}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${currentView === 'assessments' ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/40' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
      >
        <ClipboardList size={18}/> Questionnaires
      </button>
      <button
        onClick={() => onViewChange('risk_remediation')}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${currentView === 'risk_remediation' ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/40' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
      >
        <AlertCircle size={18}/> Issues & Actions
      </button>

      <button
        onClick={onLogout}
        className="mt-auto flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400"
      >
        <LogOut size={18}/> Sign Out
      </button>
    </aside>
  );
};

export default VendorSidebar;
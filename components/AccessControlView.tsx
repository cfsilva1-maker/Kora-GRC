
import React, { useState } from 'react';
import { Person, UserGroup, Department, Profile, Division, Permission } from '../types';
import { 
  Users, User, Briefcase, Layers, Map as MapIcon, Shield, 
  Plus, Edit2, Trash2, Search, CheckCircle, XCircle, Key, CornerDownRight, Check, Mail, ChevronDown, BadgeCheck, Globe, Eye, EyeOff
} from 'lucide-react';
import Modal from './Modal';

// --- MOCK DATA ---
const MOCK_DEPARTMENTS: Department[] = [
    { id: 'DEP-01', name: 'Information Security', headOfDepartment: 'Alice Johnson', description: 'Cybersecurity and GRC' },
    { id: 'DEP-02', name: 'Legal', headOfDepartment: 'Robert Smith', description: 'Contract and Compliance' },
    { id: 'DEP-03', name: 'Procurement', headOfDepartment: 'Sarah Lee', description: 'Vendor sourcing and purchasing' }
];

const MOCK_DIVISIONS: Division[] = [
    { id: 'DIV-01', name: 'Global Headquarters', description: 'Corporate entity', region: 'Global' },
    { id: 'DIV-02', name: 'North America', description: 'NA Operations', parentDivisionId: 'DIV-01', region: 'NA' },
    { id: 'DIV-03', name: 'EMEA', description: 'Europe, Middle East, Africa', parentDivisionId: 'DIV-01', region: 'EMEA' }
];

const MOCK_GROUPS: UserGroup[] = [
    { id: 'GRP-01', name: 'Audit Team', description: 'Internal and External Auditors', memberCount: 5 },
    { id: 'GRP-02', name: 'Approvers', description: 'Workflow approval steps', memberCount: 12 },
    { id: 'GRP-03', name: 'Incident Response', description: 'Team handling P1 incidents', memberCount: 3 }
];

type TabType = 'people' | 'groups' | 'departments' | 'profiles' | 'divisions';

interface AccessControlViewProps {
    people?: Person[]; 
    onUpdatePeople?: (people: Person[]) => void;
    profiles?: Profile[];
    onUpdateProfiles?: (profiles: Profile[]) => void;
}

export default function AccessControlView({ 
    people = [], 
    onUpdatePeople,
    profiles = [],
    onUpdateProfiles
}: AccessControlViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('people');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleOpenModal = (item?: any) => {
      setEditingId(item ? item.id : null);
      setShowPassword(false);
      if (item) {
          setFormData({ ...item });
      } else {
          switch(activeTab) {
              case 'people': setFormData({ firstName: '', lastName: '', email: '', status: 'Active', jobTitle: '', departmentId: '', divisionId: '', profileId: '', userAccount: '', password: '', groupIds: [] }); break;
              case 'groups': setFormData({ name: '', description: '', memberCount: 0 }); break;
              case 'profiles': setFormData({ name: '', description: '', type: 'Manual', permissions: [] }); break;
          }
      }
      setIsModalOpen(true);
  };

  const handleSave = () => {
      const id = editingId || `${activeTab.substring(0,3).toUpperCase()}-${Math.random().toString(36).substr(2, 5)}`;
      const newItem = { id, ...formData };
      if (activeTab === 'people' && onUpdatePeople) {
          const updatedList = editingId ? people.map(i => i.id === id ? newItem : i) : [...people, newItem];
          onUpdatePeople(updatedList);
      }
      setIsModalOpen(false);
  };

  const renderPeopleTab = () => (
      <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr><th className="px-6 py-4">Name / Job Title</th><th className="px-6 py-4">Account</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Access Profile</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
              {people.filter(p => p.lastName.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">{p.firstName[0]}{p.lastName[0]}</div><div><p className="font-bold text-slate-800">{p.firstName} {p.lastName}</p><p className="text-[11px] text-slate-400 font-medium uppercase">{p.jobTitle}</p></div></div></td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">{p.userAccount || '-'}</td>
                      <td className="px-6 py-4"><span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md w-fit ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>{p.status === 'Active' ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}{p.status}</span></td>
                      <td className="px-6 py-4"><span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tight border border-indigo-100">{profiles.find(pr => pr.id === p.profileId)?.name || 'NO PROFILE'}</span></td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100"><div className="flex justify-end gap-2"><button onClick={() => handleOpenModal(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded"><Edit2 size={14}/></button></div></td>
                  </tr>
              ))}
          </tbody>
      </table>
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
       <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-black text-slate-900 tracking-tight">Access Control Center</h2><p className="text-sm text-slate-500 font-medium">Configure people and security profiles.</p></div>
        <button onClick={() => handleOpenModal()} className="bg-[#4f46e5] text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-indigo-100"><Plus size={16} />New User</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          <div className="border-b border-slate-100 bg-slate-50/50 p-2 flex gap-4 overflow-x-auto"><button onClick={() => setActiveTab('people')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'people' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-400'}`}>People</button></div>
          {activeTab === 'people' && renderPeopleTab()}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? `Edit ${activeTab.slice(0, -1)}` : `New ${activeTab.slice(0, -1)}`} maxWidth="4xl" footer={<div className="flex justify-end gap-6 w-full"><button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-sm font-bold">Cancel</button><button onClick={handleSave} className="bg-[#4f46e5] text-white px-10 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100">Save User</button></div>}>
          <div className="space-y-8">
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600"><BadgeCheck className="w-4 h-4"/><h3 className="text-xs font-black uppercase tracking-widest">Personal Identification</h3></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">First Name</label><input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-indigo-50" value={formData.firstName || ''} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="e.g. John" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Last Name</label><input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-indigo-50" value={formData.lastName || ''} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="e.g. Doe" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Work Email</label><input type="email" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-indigo-50" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john.doe@securethird.com" /></div>
                        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Job Title</label><input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-indigo-50" value={formData.jobTitle || ''} onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} placeholder="e.g. Senior Risk Analyst" /></div>
                    </div>
                </section>
                <section className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-slate-600"><Key className="w-4 h-4"/><h3 className="text-xs font-black uppercase tracking-widest">Account & Security</h3></div>
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-5">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">User Account / ID</label>
                            <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white font-mono" value={formData.userAccount || ''} onChange={(e) => setFormData({...formData, userAccount: e.target.value})} placeholder="jdoe_admin" />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Security Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white font-mono pr-10" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
                            <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-white font-bold" value={formData.status || 'Active'} onChange={(e) => setFormData({...formData, status: e.target.value})}><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
                        </div>
                    </div>
                </section>
                <section className="space-y-4">
                     <div className="flex items-center gap-2 text-slate-600"><Globe className="w-4 h-4"/><h3 className="text-xs font-black uppercase tracking-widest">Organization & Permissions</h3></div>
                     <div><label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-1.5">Assigned Security Profile</label><div className="relative"><select className="w-full appearance-none border-2 border-indigo-100 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-50 outline-none bg-indigo-50/20 font-black text-indigo-900" value={formData.profileId || ''} onChange={(e) => setFormData({...formData, profileId: e.target.value})}><option value="">-- Select Access Profile --</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" /></div></div>
                </section>
          </div>
      </Modal>
    </div>
  );
}

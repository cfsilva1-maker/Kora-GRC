
import React, { useState } from 'react';
import { Vendor, RiskLevel, LifecycleStage, VendorStatus } from '../types';
import { MoreHorizontal, Search, Filter, ArrowRight, X, Plus, Edit2, Trash2, Activity } from 'lucide-react';
import Modal from './Modal';

interface VendorListProps {
  vendors: Vendor[];
  onSelectVendor: (vendor: Vendor) => void;
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
  readOnly?: boolean;
}

const VendorList: React.FC<VendorListProps> = ({ vendors, onSelectVendor, onAddVendor, onUpdateVendor, onDeleteVendor, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    riskLevel: [] as RiskLevel[],
    lifecycleStage: [] as LifecycleStage[],
    status: [] as VendorStatus[]
  });

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Vendor> & { contactName?: string, contactEmail?: string }>({
      name: '',
      category: '',
      status: VendorStatus.ONBOARDING,
      lifecycleStage: LifecycleStage.CONTEXT_ESTABLISHMENT,
      riskLevel: RiskLevel.LOW,
      description: '',
      contactName: '',
      contactEmail: ''
  });

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const current = prev[type] as string[];
      const updated = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({
      riskLevel: [],
      lifecycleStage: [],
      status: []
    });
    setSearchTerm('');
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = filters.riskLevel.length === 0 || filters.riskLevel.includes(vendor.riskLevel);
    const matchesLifecycle = filters.lifecycleStage.length === 0 || filters.lifecycleStage.includes(vendor.lifecycleStage);
    const matchesStatus = filters.status.length === 0 || filters.status.includes(vendor.status);

    return matchesSearch && matchesRisk && matchesLifecycle && matchesStatus;
  });

  const activeFilterCount = filters.riskLevel.length + filters.lifecycleStage.length + filters.status.length;

  const getRiskBadge = (level: RiskLevel) => {
    const styles = {
      [RiskLevel.CRITICAL]: 'bg-red-100 text-red-700 border-red-200',
      [RiskLevel.HIGH]: 'bg-orange-100 text-orange-700 border-orange-200',
      [RiskLevel.MEDIUM]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      [RiskLevel.LOW]: 'bg-green-100 text-green-700 border-green-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[level]}`}>
        {level}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
      if (score >= 70) return 'text-red-600';
      if (score >= 40) return 'text-orange-500';
      return 'text-green-600';
  };

  const getScoreBg = (score: number) => {
      if (score >= 70) return 'bg-red-100';
      if (score >= 40) return 'bg-orange-100';
      return 'bg-green-100';
  };

  const getLifecycleColor = (stage: LifecycleStage) => {
      switch(stage) {
          case LifecycleStage.PLANNING: return 'bg-blue-50 text-blue-700';
          case LifecycleStage.DUE_DILIGENCE: return 'bg-purple-50 text-purple-700';
          case LifecycleStage.TREATMENT_CONTRACTING: return 'bg-indigo-50 text-indigo-700';
          case LifecycleStage.MONITORING: return 'bg-green-50 text-green-700';
          case LifecycleStage.INCIDENT_MGMT: return 'bg-red-50 text-red-700';
          case LifecycleStage.OFFBOARDING: return 'bg-slate-100 text-slate-700';
          default: return 'bg-slate-50 text-slate-600';
      }
  }

  // --- CRUD HANDLERS ---

  const handleOpenModal = (vendor?: Vendor) => {
      if (readOnly) return;
      
      if (vendor) {
          setEditingId(vendor.id);
          setFormData({
              name: vendor.name,
              category: vendor.category,
              status: vendor.status,
              lifecycleStage: vendor.lifecycleStage,
              riskLevel: vendor.riskLevel,
              description: vendor.description,
              // Load nested contacts into flat state
              contactName: vendor.contacts?.primary?.name || '',
              contactEmail: vendor.contacts?.primary?.email || vendor.contactEmail || ''
          });
      } else {
          setEditingId(null);
          setFormData({
              name: '',
              category: '',
              status: VendorStatus.ONBOARDING,
              lifecycleStage: LifecycleStage.CONTEXT_ESTABLISHMENT,
              riskLevel: RiskLevel.LOW,
              description: '',
              contactName: '',
              contactEmail: ''
          });
      }
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!formData.name) return;

      const contactsPayload = {
          primary: {
              name: formData.contactName || 'Primary Contact',
              email: formData.contactEmail || '',
              role: 'Account Manager',
              phone: ''
          },
          security: { name: 'Sec Team', email: '', availability: '' }
      };

      if (editingId) {
          const original = vendors.find(v => v.id === editingId);
          if (original) {
              const updated: Vendor = {
                  ...original,
                  ...formData as Vendor,
                  contactEmail: formData.contactEmail, // Top level sync
                  contacts: {
                      ...original.contacts,
                      ...contactsPayload
                  }
              };
              onUpdateVendor(updated);
          }
      } else {
          const newVendor: Vendor = {
              id: `V-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
              name: formData.name!,
              category: formData.category || 'General',
              status: formData.status as VendorStatus,
              lifecycleStage: formData.lifecycleStage as LifecycleStage,
              riskLevel: formData.riskLevel as RiskLevel,
              description: formData.description || '',
              contactEmail: formData.contactEmail,
              contacts: contactsPayload,
              riskScore: 0,
              lastAssessmentDate: 'N/A',
              services: [],
              evidences: [],
              contracts: [],
              incidents: [],
              riskAssessments: [],
              treatmentPlan: [],
              domains: []
          };
          onAddVendor(newVendor);
      }
      setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (readOnly) return;
      onDeleteVendor(id);
  };

  const handleEditClick = (e: React.MouseEvent, vendor: Vendor) => {
      e.stopPropagation();
      if (readOnly) return;
      handleOpenModal(vendor);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Table Header / Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800">Vendor Registry</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search vendors..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 border rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors ${isFilterOpen || activeFilterCount > 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-600'}`}
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && <span className="text-xs font-bold bg-indigo-200 px-1.5 rounded-full text-indigo-800">{activeFilterCount}</span>}
            </button>
            {!readOnly && (
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> New Vendor
                </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Filters</h3>
               <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 underline">Clear All</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Risk Level Filter */}
               <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Risk Level</label>
                  <div className="space-y-1">
                     {Object.values(RiskLevel).map(level => (
                       <label key={level} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded">
                          <input 
                            type="checkbox" 
                            checked={filters.riskLevel.includes(level)}
                            onChange={() => toggleFilter('riskLevel', level)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={`${level === RiskLevel.CRITICAL ? 'text-red-600' : level === RiskLevel.HIGH ? 'text-orange-600' : 'text-slate-600'}`}>{level}</span>
                       </label>
                     ))}
                  </div>
               </div>

               {/* Lifecycle Stage Filter */}
               <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Lifecycle Stage</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                     {Object.values(LifecycleStage).map(stage => (
                       <label key={stage} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded">
                          <input 
                            type="checkbox" 
                            checked={filters.lifecycleStage.includes(stage)}
                            onChange={() => toggleFilter('lifecycleStage', stage)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-600 truncate">{stage}</span>
                       </label>
                     ))}
                  </div>
               </div>

               {/* Status Filter */}
               <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Vendor Status</label>
                  <div className="space-y-1">
                     {Object.values(VendorStatus).map(status => (
                       <label key={status} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded">
                          <input 
                            type="checkbox" 
                            checked={filters.status.includes(status)}
                            onChange={() => toggleFilter('status', status)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-600">{status}</span>
                       </label>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <th className="px-6 py-4">Vendor / Service</th>
              <th className="px-6 py-4">Lifecycle Phase</th>
              <th className="px-6 py-4">Inherent Risk</th>
              <th className="px-6 py-4">Aggregated Score</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVendors.map((vendor) => (
              <tr 
                key={vendor.id} 
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => onSelectVendor(vendor)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3 text-sm shadow-sm">
                        {vendor.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{vendor.name}</p>
                        <p className="text-xs text-slate-500">{vendor.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${getLifecycleColor(vendor.lifecycleStage)}`}>
                        {vendor.lifecycleStage}
                    </span>
                </td>
                <td className="px-6 py-4">{getRiskBadge(vendor.riskLevel)}</td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getScoreBg(vendor.riskScore)} ${getScoreColor(vendor.riskScore)}`}>
                            {vendor.riskScore}
                        </div>
                        <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${getScoreColor(vendor.riskScore).replace('text', 'bg')}`} style={{ width: `${vendor.riskScore}%` }}></div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${vendor.status === VendorStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {vendor.status}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 items-center">
                      {!readOnly && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                              <button onClick={(e) => handleEditClick(e, vendor)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                                  <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => handleDelete(e, vendor.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      )}
                      <button className="text-slate-300 hover:text-indigo-600 p-1">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredVendors.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                             <Search className="w-8 h-8 text-slate-300"/>
                             <p>No vendors found matching your filters.</p>
                             <button onClick={clearFilters} className="text-indigo-600 text-sm hover:underline">Clear Filters</button>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination (Mock) */}
      <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
        <span>Showing {filteredVendors.length} of {vendors.length} records</span>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Vendor" : "Add New Vendor"}
        footer={
            <>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">Save Vendor</button>
            </>
        }
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
                  <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Acme Corp"
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                      <input 
                          type="text" 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          placeholder="e.g. SaaS, Hardware"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">General Email</label>
                      <input 
                          type="email" 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                          placeholder="general@vendor.com"
                      />
                  </div>
              </div>

              {/* Primary Contact Section */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Primary Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                          <input 
                              type="text" 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              value={formData.contactName}
                              onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                              placeholder="Full Name"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                          <input 
                              type="email" 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              value={formData.contactEmail}
                              onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                              placeholder="person@vendor.com"
                          />
                      </div>
                  </div>
                  <p className="text-[10px] text-slate-400">This contact will be automatically added to the Access Control registry.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Lifecycle Stage</label>
                      <select 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={formData.lifecycleStage}
                          onChange={(e) => setFormData({...formData, lifecycleStage: e.target.value as LifecycleStage})}
                      >
                          {Object.values(LifecycleStage).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value as VendorStatus})}
                      >
                          {Object.values(VendorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Risk Level</label>
                  <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.riskLevel}
                      onChange={(e) => setFormData({...formData, riskLevel: e.target.value as RiskLevel})}
                  >
                      {Object.values(RiskLevel).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief description of the vendor and their services..."
                  />
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default VendorList;

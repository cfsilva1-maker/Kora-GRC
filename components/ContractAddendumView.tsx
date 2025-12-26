
import React, { useState } from 'react';
import { Vendor, Contract } from '../types';
import { FilePlus, Plus, Trash2, Edit2, Search, Link as LinkIcon, Upload, Paperclip, Loader2, Sparkles, FileText, Filter, Check } from 'lucide-react';
import Modal from './Modal';
import { generateContractSummary } from '../services/geminiService';

interface ContractAddendumViewProps {
  vendors: Vendor[];
  onUpdateVendor: (vendor: Vendor) => void;
}

const ContractAddendumView: React.FC<ContractAddendumViewProps> = ({ vendors, onUpdateVendor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
      dateFrom: '',
      dateTo: ''
  });

  // AI State
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Contract> & { vendorId: string }>({
    vendorId: '',
    name: '',
    type: 'Addendum',
    description: '',
    parentContractId: '',
    startDate: '',
    renewalDate: '',
    fileName: '',
    contentSummary: '',
    clauses: {
      confidentiality: false,
      rightToAudit: false,
      dataBreachNotification: false,
      subprocessorLiability: false,
      disasterRecovery: false,
      securitySla: false,
      terminationRights: false,
    }
  });

  const clearFilters = () => {
      setFilters({ dateFrom: '', dateTo: '' });
      setSearchTerm('');
  };

  // Helper to get all contracts including addendums
  const getAllContracts = () => vendors.flatMap(v => 
    v.contracts.map(c => ({ ...c, vendorName: v.name, vendorId: v.id }))
  );

  // Filter for Addendums only
  const addendums = getAllContracts().filter(c => 
    c.type === 'Addendum' &&
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))
  ).filter(c => {
      let matchesDate = true;
      if (filters.dateFrom) matchesDate = matchesDate && new Date(c.startDate) >= new Date(filters.dateFrom);
      if (filters.dateTo) matchesDate = matchesDate && new Date(c.startDate) <= new Date(filters.dateTo);
      return matchesDate;
  });

  const activeFilterCount = (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

  // Get potential parent contracts (MSA, etc) for the selected vendor in form
  const availableParentContracts = formData.vendorId 
    ? vendors.find(v => v.id === formData.vendorId)?.contracts.filter(c => c.type !== 'Addendum') || []
    : [];

  const handleOpenModal = (addendum?: Contract & { vendorId: string }) => {
    if (addendum) {
      setEditingId(addendum.id);
      setFormData({
        vendorId: addendum.vendorId,
        name: addendum.name,
        type: 'Addendum',
        description: addendum.description || '',
        parentContractId: addendum.parentContractId || '',
        startDate: addendum.startDate,
        renewalDate: addendum.renewalDate,
        fileName: addendum.fileName || '',
        contentSummary: addendum.contentSummary || '',
        clauses: { ...addendum.clauses }
      });
    } else {
      setEditingId(null);
      setFormData({
        vendorId: vendors.length > 0 ? vendors[0].id : '',
        name: '',
        type: 'Addendum',
        description: '',
        parentContractId: '',
        startDate: new Date().toISOString().split('T')[0],
        renewalDate: '',
        fileName: '',
        contentSummary: '',
        clauses: {
          confidentiality: false,
          rightToAudit: false,
          dataBreachNotification: false,
          subprocessorLiability: false,
          disasterRecovery: false,
          securitySla: false,
          terminationRights: false,
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (vendorId: string, contractId: string) => {
    if (window.confirm('Are you sure you want to delete this addendum?')) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        const updatedVendor = {
          ...vendor,
          contracts: vendor.contracts.filter(c => c.id !== contractId)
        };
        onUpdateVendor(updatedVendor);
      }
    }
  };

  const handleSave = () => {
    if (!formData.vendorId || !formData.name) return;

    const vendor = vendors.find(v => v.id === formData.vendorId);
    if (!vendor) return;

    let updatedVendor: Vendor;

    if (editingId) {
      updatedVendor = {
        ...vendor,
        contracts: vendor.contracts.map(c => 
          c.id === editingId 
            ? { 
                ...c, 
                name: formData.name!,
                type: 'Addendum',
                description: formData.description,
                parentContractId: formData.parentContractId,
                startDate: formData.startDate!,
                renewalDate: formData.renewalDate!,
                fileName: formData.fileName,
                contentSummary: formData.contentSummary,
                clauses: formData.clauses!
              } 
            : c
        )
      };
    } else {
      const newContract: Contract = {
        id: `ADD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        name: formData.name!,
        type: 'Addendum',
        description: formData.description,
        parentContractId: formData.parentContractId,
        startDate: formData.startDate!,
        renewalDate: formData.renewalDate!,
        fileName: formData.fileName,
        contentSummary: formData.contentSummary,
        clauses: formData.clauses!
      };
      updatedVendor = {
        ...vendor,
        contracts: [...vendor.contracts, newContract]
      };
    }

    onUpdateVendor(updatedVendor);
    setIsModalOpen(false);
  };

  const handleClauseChange = (key: keyof typeof formData.clauses) => {
    if (!formData.clauses) return;
    setFormData({
      ...formData,
      clauses: {
        ...formData.clauses,
        [key]: !formData.clauses[key]
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          setFormData({ ...formData, fileName: file.name });
      }
  };

  const handleGenerateSummary = async () => {
      if (!formData.fileName) {
          alert("Please upload a file first.");
          return;
      }
      setIsSummarizing(true);
      const summary = await generateContractSummary(formData.fileName, 'Addendum');
      setFormData({ ...formData, contentSummary: summary });
      setIsSummarizing(false);
  };

  const getParentContractName = (vendorId: string, parentId?: string) => {
      if (!parentId) return 'None';
      const vendor = vendors.find(v => v.id === vendorId);
      const parent = vendor?.contracts.find(c => c.id === parentId);
      return parent ? parent.name : 'Unknown';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Header and Filter UI */}
      <div className="p-4 border-b border-slate-200 bg-purple-50/30 flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <FilePlus className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Contract Addendums</h3>
                    <p className="text-xs text-slate-500">Manage amendments, exhibits, and supplementary agreements</p>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                    type="text" 
                    placeholder="Search addendums..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`p-2 border rounded-lg hover:bg-white flex items-center gap-2 transition-colors ${isFilterOpen || activeFilterCount > 0 ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-slate-300 bg-white text-slate-600'}`}
                >
                    <Filter className="w-4 h-4" />
                    {activeFilterCount > 0 && <span className="text-xs font-bold bg-purple-200 px-1.5 rounded-full text-purple-800">{activeFilterCount}</span>}
                </button>
                <button 
                onClick={() => handleOpenModal()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                <Plus className="w-4 h-4" /> New Addendum
                </button>
            </div>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
            <div className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm space-y-4 animate-fade-in">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</h3>
                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-purple-600 underline">Clear All</button>
                </div>
                <div>
                     <label className="text-xs font-semibold text-slate-700 mb-2 block">Effective Date Range</label>
                     <div className="flex gap-4">
                         <div className="flex items-center gap-2">
                             <span className="text-xs text-slate-400 w-8">From</span>
                             <input 
                                type="date" 
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                             />
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-xs text-slate-400 w-8">To</span>
                             <input 
                                type="date" 
                                value={filters.dateTo}
                                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                             />
                         </div>
                     </div>
                </div>
            </div>
        )}
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Addendum Details</th>
            <th className="px-6 py-4">Vendor</th>
            <th className="px-6 py-4">Parent Contract</th>
            <th className="px-6 py-4">Attachment</th>
            <th className="px-6 py-4">Clauses</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {addendums.map((addendum) => {
            const clauseCount = Object.values(addendum.clauses).filter(Boolean).length;
            
            return (
              <tr key={addendum.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{addendum.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Effective: {addendum.startDate}</div>
                    {addendum.description && (
                        <div className="text-xs text-slate-400 mt-1 max-w-xs truncate italic">"{addendum.description}"</div>
                    )}
                </td>
                <td className="px-6 py-4 text-slate-600">{addendum.vendorName}</td>
                <td className="px-6 py-4">
                  {addendum.parentContractId ? (
                      <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs w-fit">
                          <LinkIcon className="w-3 h-3"/>
                          {getParentContractName(addendum.vendorId, addendum.parentContractId)}
                      </div>
                  ) : (
                      <span className="text-xs text-slate-400 italic">No Parent Link</span>
                  )}
                </td>
                <td className="px-6 py-4">
                    {addendum.fileName ? (
                         <div className="flex flex-col">
                             <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                <Paperclip className="w-3 h-3" /> {addendum.fileName}
                             </div>
                             {addendum.contentSummary && <span className="text-[10px] text-slate-400 max-w-[120px] truncate">AI: {addendum.contentSummary}</span>}
                         </div>
                    ) : (
                        <span className="text-xs text-slate-300">No File</span>
                    )}
                </td>
                <td className="px-6 py-4">
                   <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{clauseCount} ISO Clauses</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(addendum)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                          <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(addendum.vendorId, addendum.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {addendums.length === 0 && (
            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No addendums found matching your criteria.</td></tr>
          )}
        </tbody>
      </table>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Addendum" : "New Addendum"}
        maxWidth="4xl"
        footer={
            <>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Save Addendum</button>
            </>
        }
      >
          <div className="space-y-6">
              {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                    <select 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={formData.vendorId}
                        onChange={(e) => setFormData({...formData, vendorId: e.target.value, parentContractId: ''})}
                    >
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
              )}
              
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Addendum Name/Title</label>
                  <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Data Processing Addendum (DPA) 2024"
                  />
              </div>

              {formData.vendorId && (
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Parent Contract</label>
                      <select 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          value={formData.parentContractId}
                          onChange={(e) => setFormData({...formData, parentContractId: e.target.value})}
                      >
                          <option value="">-- Independent / None --</option>
                          {availableParentContracts.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                          ))}
                      </select>
                  </div>
              )}

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description / Notes</label>
                  <textarea 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none h-20 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Purpose of this addendum..."
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Effective Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Renewal / Expiry</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      value={formData.renewalDate}
                      onChange={(e) => setFormData({...formData, renewalDate: e.target.value})}
                    />
                  </div>
              </div>

              {/* File Upload Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Document File
                  </h4>
                  
                  <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                          <input type="file" className="hidden" onChange={handleFileChange} />
                          <div className="border-2 border-dashed border-slate-300 rounded-xl px-4 py-6 text-sm text-slate-500 hover:bg-white hover:border-purple-300 transition-all bg-white flex flex-col items-center justify-center gap-2">
                              <Paperclip className="w-6 h-6 text-purple-400" />
                              <span className="font-medium">{formData.fileName || "Click to upload file"}</span>
                          </div>
                      </label>
                  </div>

                  <div>
                       <div className="flex justify-between items-center mb-1">
                           <label className="block text-sm font-medium text-slate-700">AI Content Summary</label>
                           <button 
                             onClick={handleGenerateSummary}
                             disabled={isSummarizing || !formData.fileName}
                             className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 disabled:opacity-50 font-bold bg-purple-50 px-2 py-1 rounded transition-colors"
                           >
                               {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                               Auto-Summarize
                           </button>
                       </div>
                       <textarea 
                           className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none h-24 bg-white"
                           value={formData.contentSummary}
                           onChange={(e) => setFormData({...formData, contentSummary: e.target.value})}
                           placeholder="Upload a file and click Auto-Summarize to generate..."
                       />
                  </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Clauses Amended / Included</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.clauses && Object.keys(formData.clauses).map((key) => {
                          const clauseKey = key as keyof typeof formData.clauses;
                          const isChecked = formData.clauses![clauseKey];
                          return (
                              <label key={key} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                  isChecked ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'
                              }`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isChecked ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300'}`}>
                                      {isChecked && <Check className="w-3 h-3 text-white"/>}
                                  </div>
                                  <input 
                                    type="checkbox"
                                    className="hidden"
                                    checked={isChecked}
                                    onChange={() => handleClauseChange(clauseKey)}
                                  />
                                  <span className={`text-sm capitalize font-medium ${isChecked ? 'text-purple-900' : 'text-slate-600'}`}>
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                              </label>
                          )
                      })}
                  </div>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default ContractAddendumView;

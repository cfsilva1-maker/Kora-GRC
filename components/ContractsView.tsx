
import React, { useState } from 'react';
import { Vendor, Contract } from '../types';
import { FileText, Plus, Trash2, Edit2, Search, CheckCircle, XCircle, Upload, Paperclip, Sparkles, Loader2, Filter, Server, Check, X } from 'lucide-react';
import Modal from './Modal';
import { generateContractSummary } from '../services/geminiService';

interface ContractsViewProps {
  vendors: Vendor[];
  onUpdateVendor: (vendor: Vendor) => void;
}

const ContractsView: React.FC<ContractsViewProps> = ({ vendors, onUpdateVendor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
      types: [] as string[],
      renewalFrom: '',
      renewalTo: ''
  });
  
  // Loading state for AI summary
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Contract> & { vendorId: string }>({
    vendorId: '',
    name: '',
    type: 'MSA',
    startDate: '',
    renewalDate: '',
    fileName: '',
    contentSummary: '',
    serviceIds: [],
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
          types: [],
          renewalFrom: '',
          renewalTo: ''
      });
      setSearchTerm('');
  };

  // Flatten contracts for the view
  const allContracts = vendors.flatMap(v => 
    v.contracts.map(c => ({ ...c, vendorName: v.name, vendorId: v.id }))
  ).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filters.types.length === 0 || filters.types.includes(c.type);
    
    let matchesDate = true;
    if (filters.renewalFrom && c.renewalDate) matchesDate = matchesDate && new Date(c.renewalDate) >= new Date(filters.renewalFrom);
    if (filters.renewalTo && c.renewalDate) matchesDate = matchesDate && new Date(c.renewalDate) <= new Date(filters.renewalTo);
    
    return matchesSearch && matchesType && matchesDate;
  });

  const activeFilterCount = filters.types.length + (filters.renewalFrom ? 1 : 0) + (filters.renewalTo ? 1 : 0);

  const handleOpenModal = (contract?: Contract & { vendorId: string }) => {
    if (contract) {
      setEditingId(contract.id);
      setFormData({
        vendorId: contract.vendorId,
        name: contract.name,
        type: contract.type,
        startDate: contract.startDate,
        renewalDate: contract.renewalDate,
        fileName: contract.fileName || '',
        contentSummary: contract.contentSummary || '',
        serviceIds: contract.serviceIds || [],
        clauses: { ...contract.clauses }
      });
    } else {
      setEditingId(null);
      setFormData({
        vendorId: vendors.length > 0 ? vendors[0].id : '',
        name: '',
        type: 'MSA',
        startDate: new Date().toISOString().split('T')[0],
        renewalDate: '',
        fileName: '',
        contentSummary: '',
        serviceIds: [],
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
    if (window.confirm('Are you sure you want to delete this contract?')) {
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
                type: formData.type as any,
                startDate: formData.startDate!,
                renewalDate: formData.renewalDate!,
                fileName: formData.fileName,
                contentSummary: formData.contentSummary,
                serviceIds: formData.serviceIds,
                clauses: formData.clauses!
              } 
            : c
        )
      };
    } else {
      const newContract: Contract = {
        id: `CNT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        name: formData.name!,
        type: formData.type as any,
        startDate: formData.startDate!,
        renewalDate: formData.renewalDate!,
        fileName: formData.fileName,
        contentSummary: formData.contentSummary,
        serviceIds: formData.serviceIds,
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
      const summary = await generateContractSummary(formData.fileName, formData.type || 'Contract');
      setFormData({ ...formData, contentSummary: summary });
      setIsSummarizing(false);
  };

  // Get services of the currently selected vendor in the form
  const currentVendorServices = formData.vendorId 
    ? vendors.find(v => v.id === formData.vendorId)?.services || []
    : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg text-indigo-600 border border-indigo-100">
                    <FileText className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Contract Repository</h3>
                    <p className="text-xs text-slate-500">Manage legal agreements and ISO 27036 requirements</p>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                    type="text" 
                    placeholder="Search contracts..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                    />
                </div>
                 <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`p-2 border rounded-lg hover:bg-white flex items-center gap-2 transition-colors ${isFilterOpen || activeFilterCount > 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-300 bg-white text-slate-600'}`}
                >
                    <Filter className="w-4 h-4" />
                    {activeFilterCount > 0 && <span className="text-xs font-bold bg-indigo-200 px-1.5 rounded-full text-indigo-800">{activeFilterCount}</span>}
                </button>
                <button 
                onClick={() => handleOpenModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                <Plus className="w-4 h-4" /> New Contract
                </button>
            </div>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-4 animate-fade-in">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</h3>
                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 underline">Clear All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contract Type */}
                    <div>
                         <label className="text-xs font-semibold text-slate-700 mb-2 block">Contract Type</label>
                         <div className="flex flex-wrap gap-2">
                            {['MSA', 'DPA', 'SLA', 'NDA'].map(type => (
                                <label key={type} className="flex items-center gap-2 text-sm cursor-pointer border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded bg-slate-50">
                                    <input 
                                        type="checkbox" 
                                        checked={filters.types.includes(type)}
                                        onChange={() => toggleFilter('types', type)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Renewal Date Range */}
                    <div>
                         <label className="text-xs font-semibold text-slate-700 mb-2 block">Renewal Date Range</label>
                         <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                 <span className="text-xs text-slate-400 w-8">From</span>
                                 <input 
                                    type="date" 
                                    value={filters.renewalFrom}
                                    onChange={(e) => setFilters({...filters, renewalFrom: e.target.value})}
                                    className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                                 />
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="text-xs text-slate-400 w-8">To</span>
                                 <input 
                                    type="date" 
                                    value={filters.renewalTo}
                                    onChange={(e) => setFilters({...filters, renewalTo: e.target.value})}
                                    className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                                 />
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Contract Name</th>
            <th className="px-6 py-4">Vendor</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Term</th>
            <th className="px-6 py-4">Linked Services</th>
            <th className="px-6 py-4">ISO Clauses</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allContracts.map((contract) => {
            const clauseCount = Object.values(contract.clauses).filter(Boolean).length;
            const totalClauses = Object.keys(contract.clauses).length;
            const linkedServiceCount = contract.serviceIds?.length || 0;
            
            return (
              <tr key={contract.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{contract.name}</div>
                    {contract.aiAnalysis?.riskFlags && contract.aiAnalysis.riskFlags.length > 0 && (
                        <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                             <XCircle className="w-3 h-3"/> {contract.aiAnalysis.riskFlags.length} Risk Flags
                        </div>
                    )}
                </td>
                <td className="px-6 py-4 text-slate-600">{contract.vendorName}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{contract.type}</span>
                </td>
                <td className="px-6 py-4 text-slate-600 text-xs">
                    <div>Start: {contract.startDate}</div>
                    <div className="text-slate-400">Renew: {contract.renewalDate || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                    {linkedServiceCount > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit">
                            <Server className="w-3 h-3 text-slate-400"/>
                            {linkedServiceCount} Service{linkedServiceCount > 1 ? 's' : ''}
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                    )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-200 rounded-full h-1.5">
                        <div 
                            className={`h-1.5 rounded-full ${clauseCount === totalClauses ? 'bg-green-500' : 'bg-orange-500'}`} 
                            style={{width: `${(clauseCount/totalClauses)*100}%`}}
                        ></div>
                    </div>
                    <span className="text-xs text-slate-500">{clauseCount}/{totalClauses}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(contract)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                          <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(contract.vendorId, contract.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {allContracts.length === 0 && (
            <tr><td colSpan={7} className="p-8 text-center text-slate-400">No contracts found matching your criteria.</td></tr>
          )}
        </tbody>
      </table>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Contract" : "New Contract"}
        maxWidth="4xl"
        footer={
            <>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Save Contract</button>
            </>
        }
      >
          <div className="space-y-6">
              {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                    <select 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={formData.vendorId}
                        onChange={(e) => setFormData({...formData, vendorId: e.target.value, serviceIds: []})}
                    >
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
              )}
              
              <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-8">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contract Name</label>
                      <input 
                          type="text" 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g. Master Services Agreement"
                      />
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    >
                        <option value="MSA">MSA</option>
                        <option value="DPA">DPA</option>
                        <option value="SLA">SLA</option>
                        <option value="NDA">NDA</option>
                    </select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Renewal Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.renewalDate}
                      onChange={(e) => setFormData({...formData, renewalDate: e.target.value})}
                    />
                  </div>
              </div>

              {/* Service Linking Section */}
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Linked Products & Services</label>
                  <div className="border border-slate-200 rounded-lg p-3 max-h-32 overflow-y-auto bg-slate-50 space-y-1">
                      {currentVendorServices.map(service => (
                          <label key={service.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer text-sm transition-colors">
                              <input 
                                type="checkbox" 
                                checked={formData.serviceIds?.includes(service.id)}
                                onChange={(e) => {
                                    const currentIds = formData.serviceIds || [];
                                    if (e.target.checked) {
                                        setFormData({ ...formData, serviceIds: [...currentIds, service.id] });
                                    } else {
                                        setFormData({ ...formData, serviceIds: currentIds.filter(id => id !== service.id) });
                                    }
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{service.name}</span>
                          </label>
                      ))}
                      {currentVendorServices.length === 0 && <span className="text-xs text-slate-400 p-2">No services available for this vendor.</span>}
                  </div>
              </div>

              {/* File Upload & AI Summary Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Contract Document
                  </h4>
                  
                  <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                          <input type="file" className="hidden" onChange={handleFileChange} />
                          <div className="border-2 border-dashed border-slate-300 rounded-xl px-4 py-6 text-sm text-slate-500 hover:bg-white hover:border-indigo-300 transition-all bg-white flex flex-col items-center justify-center gap-2">
                              <Paperclip className="w-6 h-6 text-indigo-400" />
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
                             className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50 font-bold bg-indigo-50 px-2 py-1 rounded transition-colors"
                           >
                               {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                               Auto-Summarize
                           </button>
                       </div>
                       <textarea 
                           className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 bg-white"
                           value={formData.contentSummary}
                           onChange={(e) => setFormData({...formData, contentSummary: e.target.value})}
                           placeholder="Upload a file and click Auto-Summarize to generate..."
                       />
                  </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">ISO 27036-4 Required Clauses</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.clauses && Object.keys(formData.clauses).map((key) => {
                          const clauseKey = key as keyof typeof formData.clauses;
                          const isChecked = formData.clauses![clauseKey];
                          return (
                              <label key={key} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                  isChecked ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'
                              }`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                      {isChecked && <Check className="w-3 h-3 text-white"/>}
                                  </div>
                                  <input 
                                    type="checkbox"
                                    className="hidden"
                                    checked={isChecked}
                                    onChange={() => handleClauseChange(clauseKey)}
                                  />
                                  <span className={`text-sm capitalize font-medium ${isChecked ? 'text-indigo-900' : 'text-slate-600'}`}>
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

export default ContractsView;

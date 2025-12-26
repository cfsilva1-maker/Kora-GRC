
import React, { useState } from 'react';
import { Vendor, Incident, RiskLevel, RiskTreatmentPlan, Person } from '../types';
import { AlertCircle, Plus, Trash2, Edit2, Search, Filter, Calendar, X, Server, ArrowRight, CheckSquare, Sparkles, Loader2, ExternalLink, AlertTriangle, User, Activity } from 'lucide-react';
import Modal from './Modal';
import { generateActionPlanAI } from '../services/geminiService';

interface IssuesViewProps {
  vendors: Vendor[];
  onUpdateVendor: (vendor: Vendor) => void;
  people?: Person[];
}

const IssuesView: React.FC<IssuesViewProps> = ({ vendors, onUpdateVendor, people = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
      severity: [] as RiskLevel[],
      status: [] as string[],
      dateFrom: '',
      dateTo: ''
  });
  
  // Issue Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Incident> & { vendorId: string }>({
    vendorId: '',
    summary: '',
    severity: RiskLevel.MEDIUM,
    status: 'Open',
    rootCauseAnalysis: '',
    remediationSteps: '',
    serviceId: ''
  });

  // Action Plan Creation/View State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<RiskTreatmentPlan | null>(null); // For viewing existing
  const [isCreatingPlan, setIsCreatingPlan] = useState(false); // Mode toggle
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planFormData, setPlanFormData] = useState<Partial<RiskTreatmentPlan> & { vendorId: string, incidentSummary: string }>({
      vendorId: '',
      incidentSummary: '',
      description: '',
      owner: '',
      dueDate: '',
      status: 'Pending',
      action: 'Mitigate',
      riskId: 'Incident Remediation',
      suggestedCorrection: '',
      implementationSteps: ''
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
          severity: [],
          status: [],
          dateFrom: '',
          dateTo: ''
      });
      setSearchTerm('');
  };

  // Derived Data: Flatten incidents with vendor info
  const allIncidents = vendors.flatMap(v => 
    v.incidents.map(inc => {
        const linkedPlan = v.treatmentPlan.find(tp => tp.incidentId === inc.id);
        return { 
            ...inc, 
            vendorName: v.name, 
            vendorId: v.id, 
            serviceName: v.services.find(s => s.id === inc.serviceId)?.name,
            linkedPlan
        };
    })
  ).filter(inc => {
    const matchesSearch = inc.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inc.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filters.severity.length === 0 || filters.severity.includes(inc.severity);
    const matchesStatus = filters.status.length === 0 || filters.status.includes(inc.status);
    
    let matchesDate = true;
    if (filters.dateFrom) matchesDate = matchesDate && new Date(inc.date) >= new Date(filters.dateFrom);
    if (filters.dateTo) matchesDate = matchesDate && new Date(inc.date) <= new Date(filters.dateTo);

    return matchesSearch && matchesSeverity && matchesStatus && matchesDate;
  });

  const activeFilterCount = filters.severity.length + filters.status.length + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

  // --- Issue CRUD ---

  const handleOpenModal = (incident?: Incident & { vendorId: string }) => {
    if (incident) {
      setEditingId(incident.id);
      setFormData({
        vendorId: incident.vendorId,
        summary: incident.summary,
        severity: incident.severity,
        status: incident.status,
        rootCauseAnalysis: incident.rootCauseAnalysis || '',
        remediationSteps: incident.remediationSteps || '',
        serviceId: incident.serviceId || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        vendorId: vendors.length > 0 ? vendors[0].id : '',
        summary: '',
        severity: RiskLevel.MEDIUM,
        status: 'Open',
        rootCauseAnalysis: '',
        remediationSteps: '',
        serviceId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (vendorId: string, incidentId: string) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        const updatedVendor = {
          ...vendor,
          incidents: vendor.incidents.filter(i => i.id !== incidentId)
        };
        onUpdateVendor(updatedVendor);
      }
    }
  };

  const handleSave = () => {
    if (!formData.vendorId || !formData.summary) return;

    const vendor = vendors.find(v => v.id === formData.vendorId);
    if (!vendor) return;

    let updatedVendor: Vendor;

    if (editingId) {
      // Update existing
      updatedVendor = {
        ...vendor,
        incidents: vendor.incidents.map(inc => 
          inc.id === editingId 
            ? { 
                ...inc, 
                summary: formData.summary!,
                severity: formData.severity!,
                status: formData.status as any,
                rootCauseAnalysis: formData.rootCauseAnalysis,
                remediationSteps: formData.remediationSteps,
                serviceId: formData.serviceId
              } 
            : inc
        )
      };
    } else {
      // Create new
      const newIncident: Incident = {
        id: `INC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        date: new Date().toISOString().split('T')[0],
        summary: formData.summary!,
        severity: formData.severity!,
        status: formData.status as any,
        rootCauseAnalysis: formData.rootCauseAnalysis,
        remediationSteps: formData.remediationSteps,
        serviceId: formData.serviceId
      };
      updatedVendor = {
        ...vendor,
        incidents: [...vendor.incidents, newIncident]
      };
    }

    onUpdateVendor(updatedVendor);
    setIsModalOpen(false);
  };

  // --- Plan Logic ---

  const handleCreatePlanClick = (incident: Incident & { vendorId: string, vendorName: string }) => {
      setIsCreatingPlan(true);
      setViewingPlan(null);
      setPlanFormData({
          vendorId: incident.vendorId,
          incidentSummary: incident.summary,
          description: `Remediate: ${incident.summary}`,
          owner: '',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days
          status: 'Pending',
          action: 'Mitigate',
          riskId: 'Incident Remediation',
          incidentId: incident.id,
          serviceId: incident.serviceId,
          suggestedCorrection: incident.remediationSteps || '',
          implementationSteps: ''
      });
      setIsPlanModalOpen(true);
  };

  const handleViewPlanClick = (plan: RiskTreatmentPlan) => {
      setIsCreatingPlan(false);
      setViewingPlan(plan);
      setIsPlanModalOpen(true);
  };

  const handleGeneratePlanAI = async () => {
      if (!planFormData.incidentSummary || !planFormData.vendorId) return;
      const vendorName = vendors.find(v => v.id === planFormData.vendorId)?.name || 'Unknown Vendor';
      
      setIsGeneratingPlan(true);
      const aiResult = await generateActionPlanAI(planFormData.incidentSummary, vendorName, 'Incident Remediation');
      setIsGeneratingPlan(false);

      if (aiResult) {
          setPlanFormData(prev => ({
              ...prev,
              description: aiResult.description,
              suggestedCorrection: aiResult.suggestedCorrection,
              implementationSteps: aiResult.implementationSteps
          }));
      }
  };

  const handleSavePlan = () => {
      const vendor = vendors.find(v => v.id === planFormData.vendorId);
      if (!vendor) return;

      const newPlan: RiskTreatmentPlan = {
          id: `TP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          riskId: planFormData.riskId || 'Incident',
          action: planFormData.action as any,
          description: planFormData.description || 'Remediation',
          owner: planFormData.owner || 'Unassigned',
          dueDate: planFormData.dueDate || '',
          status: planFormData.status as any,
          incidentId: planFormData.incidentId,
          serviceId: planFormData.serviceId,
          suggestedCorrection: planFormData.suggestedCorrection,
          implementationSteps: planFormData.implementationSteps
      };

      // Sync Issue Status if Completed
      let updatedIncidents = vendor.incidents;
      if (newPlan.status === 'Completed' && newPlan.incidentId) {
          updatedIncidents = vendor.incidents.map(inc => 
              inc.id === newPlan.incidentId ? { ...inc, status: 'Resolved' as const } : inc
          );
      }

      onUpdateVendor({
          ...vendor,
          incidents: updatedIncidents,
          treatmentPlan: [...vendor.treatmentPlan, newPlan]
      });
      setIsPlanModalOpen(false);
  };

  // Helper to get services for currently selected vendor in form
  const currentVendorServices = formData.vendorId 
    ? vendors.find(v => v.id === formData.vendorId)?.services || []
    : [];

  // Helper: Find linked plan for the current editing incident
  const currentLinkedPlan = editingId && formData.vendorId 
    ? vendors.find(v => v.id === formData.vendorId)?.treatmentPlan.find(tp => tp.incidentId === editingId)
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Header and Filter sections remain unchanged ... */}
      <div className="p-4 border-b border-slate-200 bg-red-50/30 flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
                <AlertCircle className="w-5 h-5"/>
            </div>
            <div>
                <h3 className="font-bold text-slate-800">Issues Registry</h3>
                <p className="text-xs text-slate-500">Manage active incidents and remediation</p>
            </div>
            </div>
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                    type="text" 
                    placeholder="Search issues..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-48"
                    />
                </div>
                <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-2 border rounded-lg hover:bg-white flex items-center gap-2 transition-colors ${isFilterOpen || activeFilterCount > 0 ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-300 bg-white text-slate-600'}`}
                >
                    <Filter className="w-4 h-4" />
                    {activeFilterCount > 0 && <span className="text-xs font-bold bg-red-200 px-1.5 rounded-full text-red-800">{activeFilterCount}</span>}
                </button>
                <button 
                onClick={() => handleOpenModal()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                <Plus className="w-4 h-4" /> New Issue
                </button>
            </div>
        </div>

        {/* Filter Panel (Unchanged for brevity) */}
        {isFilterOpen && (
            <div className="p-4 bg-white rounded-lg border border-red-100 shadow-sm space-y-4 animate-fade-in">
                {/* ... existing filter UI ... */}
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</h3>
                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 underline">Clear All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Severity */}
                    <div>
                        <label className="text-xs font-semibold text-slate-700 mb-2 block">Severity</label>
                        <div className="space-y-1">
                            {Object.values(RiskLevel).map(level => (
                                <label key={level} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={filters.severity.includes(level)}
                                        onChange={() => toggleFilter('severity', level)}
                                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span>{level}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Status */}
                    <div>
                         <label className="text-xs font-semibold text-slate-700 mb-2 block">Status</label>
                         <div className="space-y-1">
                            {['Open', 'Monitoring', 'Resolved'].map(status => (
                                <label key={status} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={filters.status.includes(status)}
                                        onChange={() => toggleFilter('status', status)}
                                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span>{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Date Range */}
                    <div>
                         <label className="text-xs font-semibold text-slate-700 mb-2 block">Reported Date</label>
                         <div className="space-y-2">
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
            </div>
        )}
      </div>

      <table className="w-full text-left text-sm">
        {/* ... existing table header ... */}
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Issue Summary</th>
            <th className="px-6 py-4">Vendor</th>
            <th className="px-6 py-4">Severity</th>
            <th className="px-6 py-4">Remediation Plan</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allIncidents.map((inc) => (
            <tr key={inc.id} className="hover:bg-slate-50 group">
              {/* ... existing table rows ... */}
              <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{inc.summary}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{inc.date}</div>
              </td>
              <td className="px-6 py-4 text-slate-600">
                  <div className="font-medium">{inc.vendorName}</div>
                  {inc.serviceName ? (
                      <span className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Server className="w-3 h-3"/> {inc.serviceName}
                      </span>
                  ) : <span className="text-xs text-slate-300 italic">General</span>}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  inc.severity === RiskLevel.CRITICAL ? 'bg-red-100 text-red-700' :
                  inc.severity === RiskLevel.HIGH ? 'bg-orange-100 text-orange-700' :
                  inc.severity === RiskLevel.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>{inc.severity}</span>
              </td>
              <td className="px-6 py-4">
                  {inc.linkedPlan ? (
                      <button 
                        onClick={() => handleViewPlanClick(inc.linkedPlan!)}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1.5 rounded hover:bg-indigo-100 transition-colors w-fit"
                      >
                          <CheckSquare className="w-3 h-3" />
                          View Plan 
                          <span className={`ml-1 w-2 h-2 rounded-full ${inc.linkedPlan.status === 'Completed' ? 'bg-green-500' : 'bg-orange-400'}`}></span>
                      </button>
                  ) : (
                      <button 
                        onClick={() => handleCreatePlanClick(inc)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                      >
                          <Plus className="w-3 h-3" /> Create Plan
                      </button>
                  )}
              </td>
              <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs border ${
                      inc.status === 'Open' ? 'bg-white border-slate-300 text-slate-600' :
                      inc.status === 'Monitoring' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-green-50 border-green-200 text-green-700'
                  }`}>{inc.status}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(inc)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(inc.vendorId, inc.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </td>
            </tr>
          ))}
          {allIncidents.length === 0 && (
            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No matching issues found.</td></tr>
          )}
        </tbody>
      </table>

      {/* Edit Issue Modal - IMPROVED UI */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Issue" : "Report New Issue"}
        maxWidth="4xl"
        footer={
            <>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Save Issue</button>
            </>
        }
      >
          <div className="space-y-6">
              {/* Context Section */}
              <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Vendor</label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-slate-700"
                            value={formData.vendorId}
                            onChange={(e) => setFormData({...formData, vendorId: e.target.value, serviceId: ''})}
                            disabled={!!editingId}
                        >
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                            <ArrowRight className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-6">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Impacted Service</label>
                      <div className="relative">
                          <select 
                              className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                              value={formData.serviceId}
                              onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                              disabled={!formData.vendorId}
                          >
                              <option value="">-- General Vendor Issue --</option>
                              {currentVendorServices.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                          </select>
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                             <Server className="w-4 h-4" />
                          </div>
                      </div>
                  </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* Core Details */}
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Issue Summary</label>
                      <input 
                          type="text" 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none shadow-sm placeholder:text-slate-300"
                          value={formData.summary}
                          onChange={(e) => setFormData({...formData, summary: e.target.value})}
                          placeholder="Brief title of the finding or incident..."
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Severity Level</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(RiskLevel).map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({...formData, severity: level})}
                                    className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        formData.severity === level 
                                        ? level === RiskLevel.CRITICAL ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' :
                                          level === RiskLevel.HIGH ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500' :
                                          'bg-slate-100 border-slate-400 text-slate-800 ring-1 ring-slate-400'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Current Status</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        >
                            <option value="Open">Open</option>
                            <option value="Monitoring">Monitoring</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                  </div>
              </div>

              {/* Analysis & Plan Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Sparkles className="w-3 h-3"/> Analysis & Remediation
                  </h4>
                  
                  <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Root Cause Analysis</label>
                      <textarea 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none h-20 resize-none"
                          value={formData.rootCauseAnalysis}
                          onChange={(e) => setFormData({...formData, rootCauseAnalysis: e.target.value})}
                          placeholder="Describe the underlying cause..."
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Remediation Steps Taken</label>
                      <textarea 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none h-20 resize-none"
                          value={formData.remediationSteps}
                          onChange={(e) => setFormData({...formData, remediationSteps: e.target.value})}
                          placeholder="Actions taken to fix the issue..."
                      />
                  </div>
              </div>

              {/* Linked Plan CTA */}
              {editingId && (
                  <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <div className="flex items-center gap-3">
                          <div className="bg-white p-1.5 rounded-md border border-indigo-100 text-indigo-600">
                              <CheckSquare className="w-4 h-4"/>
                          </div>
                          <div>
                              <p className="text-sm font-bold text-indigo-900">Remediation Plan</p>
                              {currentLinkedPlan ? (
                                  <p className="text-xs text-indigo-600">{currentLinkedPlan.status} • Due {currentLinkedPlan.dueDate}</p>
                              ) : (
                                  <p className="text-xs text-indigo-400">No formal plan created yet.</p>
                              )}
                          </div>
                      </div>
                      {currentLinkedPlan ? (
                          <button 
                              onClick={() => { setIsModalOpen(false); handleViewPlanClick(currentLinkedPlan); }}
                              className="text-xs font-bold text-indigo-700 hover:underline"
                          >
                              View Plan
                          </button>
                      ) : (
                          <button 
                              onClick={() => { 
                                  const v = vendors.find(v => v.id === formData.vendorId);
                                  const i = v?.incidents.find(inc => inc.id === editingId);
                                  if(v && i) {
                                      setIsModalOpen(false);
                                      handleCreatePlanClick({...i, vendorId: v.id, vendorName: v.name});
                                  }
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
                          >
                              Create Plan
                          </button>
                      )}
                  </div>
              )}
          </div>
      </Modal>

      {/* Action Plan Modal (Create/View) - Improved with Tabs/Layout */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={isCreatingPlan ? "Create Remediation Plan" : "Remediation Plan Details"}
        maxWidth="4xl"
        footer={
            isCreatingPlan ? (
                <>
                    <button onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                    <button onClick={handleSavePlan} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Create Plan</button>
                </>
            ) : (
                <button onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Close</button>
            )
        }
      >
          {isCreatingPlan ? (
              <div className="space-y-5">
                  {/* AI Assistant Banner */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600">
                              <Sparkles className="w-5 h-5"/>
                          </div>
                          <div>
                              <h4 className="text-sm font-bold text-indigo-900">AI Risk Assistant</h4>
                              <p className="text-xs text-indigo-600">Generate a plan based on the incident details.</p>
                          </div>
                      </div>
                      <button 
                        onClick={handleGeneratePlanAI}
                        disabled={isGeneratingPlan}
                        className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                      >
                          {isGeneratingPlan ? <Loader2 className="w-3 h-3 animate-spin"/> : null}
                          {isGeneratingPlan ? 'Thinking...' : 'Auto-Generate'}
                      </button>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Plan Description</label>
                          <input 
                              type="text" 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              value={planFormData.description}
                              onChange={(e) => setPlanFormData({...planFormData, description: e.target.value})}
                              placeholder="e.g. Patch critical vulnerability in payment gateway"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Owner</label>
                              <div className="relative">
                                  <input 
                                      list="people-list" 
                                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none pl-9"
                                      value={planFormData.owner}
                                      onChange={(e) => setPlanFormData({...planFormData, owner: e.target.value})}
                                      placeholder="Select Person..."
                                  />
                                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                  <datalist id="people-list">
                                      {people.map(p => <option key={p.id} value={`${p.firstName} ${p.lastName}`} />)}
                                  </datalist>
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Target Date</label>
                              <input 
                                  type="date" 
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  value={planFormData.dueDate}
                                  onChange={(e) => setPlanFormData({...planFormData, dueDate: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="space-y-3 pt-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Implementation Details</label>
                          <textarea 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none bg-slate-50 focus:bg-white transition-colors"
                              value={planFormData.suggestedCorrection}
                              onChange={(e) => setPlanFormData({...planFormData, suggestedCorrection: e.target.value})}
                              placeholder="Describe the corrective action..."
                          />
                          <textarea 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none bg-slate-50 focus:bg-white transition-colors"
                              value={planFormData.implementationSteps}
                              onChange={(e) => setPlanFormData({...planFormData, implementationSteps: e.target.value})}
                              placeholder="Step-by-step implementation guide..."
                          />
                      </div>
                  </div>
              </div>
          ) : (
              <div className="space-y-6">
                  {viewingPlan && (
                      <>
                          {/* Plan Header Card */}
                          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                  <h4 className="text-lg font-bold text-slate-900 leading-tight">{viewingPlan.description}</h4>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                      viewingPlan.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                  }`}>{viewingPlan.status}</span>
                              </div>
                              <div className="flex gap-6 text-sm text-slate-600 border-t border-slate-100 pt-3">
                                  <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-slate-400"/> {viewingPlan.owner}
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-slate-400"/> Due: {viewingPlan.dueDate}
                                  </div>
                              </div>
                          </div>

                          {/* Details Accordion style */}
                          <div className="space-y-4">
                              <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                  <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">Correction Strategy</div>
                                  <div className="p-4 text-sm text-slate-700 leading-relaxed">
                                      {viewingPlan.suggestedCorrection || 'No strategy defined.'}
                                  </div>
                              </div>
                              <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                  <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">Implementation Steps</div>
                                  <div className="p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono text-xs">
                                      {viewingPlan.implementationSteps || 'No steps defined.'}
                                  </div>
                              </div>
                          </div>
                          
                          {/* Updates Timeline */}
                          {viewingPlan.updates && viewingPlan.updates.length > 0 && (
                              <div className="pt-2">
                                  <h5 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                                      <Activity className="w-4 h-4 text-slate-400"/> Activity Log
                                  </h5>
                                  <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                                      {viewingPlan.updates.map(u => (
                                          <div key={u.id} className="relative">
                                              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 rounded-full ring-4 ring-white"></div>
                                              <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-sm">
                                                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                      <span className="font-bold text-slate-600">{u.author}</span>
                                                      <span>{new Date(u.date).toLocaleDateString()}</span>
                                                  </div>
                                                  <p className="text-slate-700">{u.note}</p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </>
                  )}
              </div>
          )}
      </Modal>
    </div>
  );
};

export default IssuesView;

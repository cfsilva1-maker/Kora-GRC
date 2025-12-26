
import React, { useState } from 'react';
import { Vendor, Incident, RiskLevel } from '../types';
import { Activity, Plus, Trash2, Edit2, Search, Filter, AlertTriangle, Eye, Server, Calendar, Clock, Radio, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import Modal from './Modal';

interface IncidentsViewProps {
  vendors: Vendor[];
  onUpdateVendor: (vendor: Vendor) => void;
}

const IncidentsView: React.FC<IncidentsViewProps> = ({ vendors, onUpdateVendor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
      severity: [] as RiskLevel[],
      status: [] as string[]
  });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState<'general' | 'detection' | 'analysis'>('general');
  
  const [formData, setFormData] = useState<Partial<Incident> & { vendorId: string }>({
    vendorId: '',
    summary: '',
    description: '',
    severity: RiskLevel.MEDIUM,
    status: 'Open',
    date: new Date().toISOString().split('T')[0],
    dateDetected: new Date().toISOString().split('T')[0],
    detectionMethod: 'Automated Alert',
    impactDescription: '',
    affectedAssets: '',
    rootCauseAnalysis: '',
    remediationSteps: '',
    serviceId: ''
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
      setFilters({ severity: [], status: [] });
      setSearchTerm('');
  };

  // Flatten incidents
  const allIncidents = vendors.flatMap(v => 
    v.incidents.map(inc => ({ ...inc, vendorName: v.name, vendorId: v.id, serviceName: v.services.find(s => s.id === inc.serviceId)?.name }))
  ).filter(inc => {
    const matchesSearch = inc.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inc.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filters.severity.length === 0 || filters.severity.includes(inc.severity);
    const matchesStatus = filters.status.length === 0 || filters.status.includes(inc.status);
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const activeFilterCount = filters.severity.length + filters.status.length;

  const handleOpenModal = (incident?: Incident & { vendorId: string }) => {
    setFormTab('general');
    if (incident) {
      setEditingId(incident.id);
      setFormData({
        vendorId: incident.vendorId,
        summary: incident.summary,
        description: incident.description || '',
        severity: incident.severity,
        status: incident.status,
        date: incident.date,
        dateDetected: incident.dateDetected || incident.date,
        detectionMethod: incident.detectionMethod || 'Automated Alert',
        impactDescription: incident.impactDescription || '',
        affectedAssets: incident.affectedAssets || '',
        rootCauseAnalysis: incident.rootCauseAnalysis || '',
        remediationSteps: incident.remediationSteps || '',
        serviceId: incident.serviceId || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        vendorId: vendors.length > 0 ? vendors[0].id : '',
        summary: '',
        description: '',
        severity: RiskLevel.MEDIUM,
        status: 'Open',
        date: new Date().toISOString().split('T')[0],
        dateDetected: new Date().toISOString().split('T')[0],
        detectionMethod: 'Automated Alert',
        impactDescription: '',
        affectedAssets: '',
        rootCauseAnalysis: '',
        remediationSteps: '',
        serviceId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (vendorId: string, incidentId: string) => {
    if (window.confirm('Are you sure you want to delete this incident record?')) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        onUpdateVendor({
          ...vendor,
          incidents: vendor.incidents.filter(i => i.id !== incidentId)
        });
      }
    }
  };

  const handleSave = () => {
    if (!formData.vendorId || !formData.summary) return;
    const vendor = vendors.find(v => v.id === formData.vendorId);
    if (!vendor) return;

    const incidentPayload = {
        summary: formData.summary!,
        description: formData.description,
        severity: formData.severity!,
        status: formData.status as any,
        date: formData.date!,
        dateDetected: formData.dateDetected,
        detectionMethod: formData.detectionMethod as any,
        impactDescription: formData.impactDescription,
        affectedAssets: formData.affectedAssets,
        rootCauseAnalysis: formData.rootCauseAnalysis,
        remediationSteps: formData.remediationSteps,
        serviceId: formData.serviceId
    };

    if (editingId) {
      onUpdateVendor({
        ...vendor,
        incidents: vendor.incidents.map(inc => inc.id === editingId ? { ...inc, ...incidentPayload } : inc)
      });
    } else {
      const newIncident: Incident = {
        id: `INC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        ...incidentPayload
      };
      onUpdateVendor({
        ...vendor,
        incidents: [...vendor.incidents, newIncident]
      });
    }
    setIsModalOpen(false);
  };

  // Helper to get services
  const currentVendorServices = formData.vendorId 
    ? vendors.find(v => v.id === formData.vendorId)?.services || []
    : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-200 bg-red-50/20 flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                    <Activity className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Operational Incidents</h3>
                    <p className="text-xs text-slate-500">Monitor service disruptions and security events</p>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                    type="text" 
                    placeholder="Search incidents..." 
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
                <Plus className="w-4 h-4" /> Log Incident
                </button>
            </div>
        </div>

        {isFilterOpen && (
            <div className="p-4 bg-white rounded-lg border border-red-100 shadow-sm space-y-4 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</h3>
                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 underline">Clear All</button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-semibold text-slate-700 mb-2 block">Severity</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(RiskLevel).map(level => (
                                <label key={level} className="flex items-center gap-2 text-sm cursor-pointer border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded bg-slate-50">
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
                    <div>
                        <label className="text-xs font-semibold text-slate-700 mb-2 block">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {['Open', 'Investigating', 'Mitigated', 'Resolved', 'Monitoring'].map(status => (
                                <label key={status} className="flex items-center gap-2 text-sm cursor-pointer border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded bg-slate-50">
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
                </div>
            </div>
        )}
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Summary</th>
            <th className="px-6 py-4">Vendor & Service</th>
            <th className="px-6 py-4">Severity</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Occurred</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allIncidents.map((inc) => (
            <tr key={inc.id} className="hover:bg-slate-50 group">
              <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{inc.summary}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{inc.detectionMethod}</div>
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
                  <span className={`inline-block px-2 py-0.5 rounded text-xs border ${
                      inc.status === 'Open' ? 'bg-white border-red-200 text-red-700' :
                      inc.status === 'Resolved' ? 'bg-green-50 border-green-200 text-green-700' :
                      'bg-slate-50 border-slate-300 text-slate-600'
                  }`}>{inc.status}</span>
              </td>
              <td className="px-6 py-4 text-slate-600 text-xs">
                  {inc.date}
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
            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No incidents found.</td></tr>
          )}
        </tbody>
      </table>

      {/* Enhanced Incident Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Incident" : "Log New Incident"}
        maxWidth="4xl"
        footer={
            <div className="flex justify-between w-full">
                <div className="text-xs text-slate-400 flex items-center">
                    {editingId && <span>ID: {editingId}</span>}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Save Record</button>
                </div>
            </div>
        }
      >
          {/* Modal Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
              <button 
                onClick={() => setFormTab('general')}
                className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${formTab === 'general' ? 'border-red-500 text-red-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Overview
              </button>
              <button 
                onClick={() => setFormTab('detection')}
                className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${formTab === 'detection' ? 'border-red-500 text-red-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Detection & Impact
              </button>
              <button 
                onClick={() => setFormTab('analysis')}
                className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${formTab === 'analysis' ? 'border-red-500 text-red-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Analysis & Remediation
              </button>
          </div>

          <div className="min-h-[300px]">
              {formTab === 'general' && (
                  <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                            <select 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                                value={formData.vendorId}
                                onChange={(e) => setFormData({...formData, vendorId: e.target.value, serviceId: ''})}
                                disabled={!!editingId}
                            >
                                <option value="">Select Vendor</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Impacted Service</label>
                              <select 
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white disabled:bg-slate-50"
                                  value={formData.serviceId}
                                  onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                                  disabled={!formData.vendorId}
                              >
                                  <option value="">-- General / Unknown --</option>
                                  {currentVendorServices.map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Incident Summary</label>
                          <input 
                              type="text" 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none shadow-sm"
                              value={formData.summary}
                              onChange={(e) => setFormData({...formData, summary: e.target.value})}
                              placeholder="e.g. Production DB Latency Spike"
                          />
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Severity</label>
                            <div className="space-y-2">
                                {Object.values(RiskLevel).map(level => (
                                    <label key={level} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${formData.severity === level ? 'bg-white border-red-400 shadow-sm' : 'border-transparent hover:bg-slate-100'}`}>
                                        <input 
                                            type="radio" 
                                            name="severity"
                                            className="text-red-600 focus:ring-red-500"
                                            checked={formData.severity === level}
                                            onChange={() => setFormData({...formData, severity: level})}
                                        />
                                        <span className={`text-sm font-medium ${level === RiskLevel.CRITICAL ? 'text-red-700' : 'text-slate-700'}`}>{level}</span>
                                    </label>
                                ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                            <select 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                            >
                                <option value="Open">Open</option>
                                <option value="Investigating">Investigating</option>
                                <option value="Mitigated">Mitigated</option>
                                <option value="Monitoring">Monitoring</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
                          <textarea 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none h-24 resize-none bg-slate-50 focus:bg-white transition-colors"
                              value={formData.description}
                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                              placeholder="Provide full context of the incident..."
                          />
                      </div>
                  </div>
              )}

              {formTab === 'detection' && (
                  <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date Occurred</label>
                            <input 
                                type="date" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date Detected</label>
                            <input 
                                type="date" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                                value={formData.dateDetected}
                                onChange={(e) => setFormData({...formData, dateDetected: e.target.value})}
                            />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Detection Method</label>
                          <select 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                              value={formData.detectionMethod}
                              onChange={(e) => setFormData({...formData, detectionMethod: e.target.value as any})}
                          >
                              <option value="Automated Alert">Automated Alert</option>
                              <option value="User Report">User Report</option>
                              <option value="Audit Finding">Audit Finding</option>
                              <option value="Vendor Notification">Vendor Notification</option>
                              <option value="Other">Other</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Affected Assets / Components</label>
                          <input 
                              type="text" 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                              value={formData.affectedAssets}
                              onChange={(e) => setFormData({...formData, affectedAssets: e.target.value})}
                              placeholder="e.g. Payment Gateway API, Customer DB"
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Impact Description</label>
                          <textarea 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none h-24 resize-none bg-slate-50 focus:bg-white transition-colors"
                              value={formData.impactDescription}
                              onChange={(e) => setFormData({...formData, impactDescription: e.target.value})}
                              placeholder="Describe the business impact (e.g. 500 users unable to login)..."
                          />
                      </div>
                  </div>
              )}

              {formTab === 'analysis' && (
                  <div className="space-y-6 animate-fade-in">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Root Cause Analysis (RCA)</label>
                          <textarea 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none h-32 resize-none bg-white"
                              value={formData.rootCauseAnalysis}
                              onChange={(e) => setFormData({...formData, rootCauseAnalysis: e.target.value})}
                              placeholder="Why did this happen? (5 Whys)"
                          />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Remediation Steps Taken / Required</label>
                          <textarea 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none h-32 resize-none bg-white"
                              value={formData.remediationSteps}
                              onChange={(e) => setFormData({...formData, remediationSteps: e.target.value})}
                              placeholder="Steps to fix and prevent recurrence..."
                          />
                      </div>
                  </div>
              )}
          </div>
      </Modal>
    </div>
  );
};

export default IncidentsView;

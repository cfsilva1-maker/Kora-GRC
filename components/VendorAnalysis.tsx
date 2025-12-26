

import React, { useState } from 'react';
import { Vendor, RiskAnalysisResult, LifecycleStage, Evidence, Contract, RiskLevel, Incident, RiskAssessment, RiskTreatmentPlan, Service } from '../types';
import { analyzeVendorRisk, generateContractSummary } from '../services/geminiService';
import { 
  BrainCircuit, CheckCircle, AlertTriangle, FileText, Loader2, 
  ShieldCheck, Gavel, Activity, ChevronRight, Upload, Search, Eye,
  LayoutList, TrendingUp, Edit2, Trash2, Plus, Building, Mail, User, Server, CheckSquare, X, Calendar, Paperclip, Sparkles, Clock, Globe, ShieldAlert, ChevronDown, Database, Link as LinkIcon, ArrowRight,
  AlertCircle
} from 'lucide-react';
import Modal from './Modal';

interface VendorDetailProps {
  vendor: Vendor;
  onBack: () => void;
  onUpdateVendor: (vendor: Vendor) => void;
}

type TabType = 'overview' | 'profile' | 'assessment' | 'evidence' | 'contracts' | 'issues_actions' | 'monitoring';

const AVAILABLE_TEMPLATES = [
    { id: 'QT-01', name: 'SIG Lite 2024' },
    { id: 'QT-02', name: 'GDPR Readiness Check' },
    { id: 'QT-03', name: 'ISO 27001 Vendor Audit' },
    { id: 'QT-04', name: 'Cloud Security Assessment (CAIQ)' }
];

const VendorDetail: React.FC<VendorDetailProps> = ({ vendor, onBack, onUpdateVendor }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // -- CRUD MODAL STATES --
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // -- EDITING INDEX STATES --
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // -- FORM DATA STATES --
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({});
  const [assessmentForm, setAssessmentForm] = useState<Partial<RiskAssessment> & { scenarioCount?: number }>({});
  const [evidenceForm, setEvidenceForm] = useState<Partial<Evidence>>({});
  const [contractForm, setContractForm] = useState<Partial<Contract>>({});
  const [actionPlanForm, setActionPlanForm] = useState<Partial<RiskTreatmentPlan>>({});
  const [incidentForm, setIncidentForm] = useState<Partial<Incident>>({});

  // -- UI TABS WITHIN MODALS --
  const [actionPlanTab, setActionPlanTab] = useState<'details' | 'updates'>('details');

  // -- AI STATES --
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSummarizingContract, setIsSummarizingContract] = useState(false);

  const deleteItem = (field: keyof Vendor, index: number) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    const list = [...(vendor[field] as any[])];
    list.splice(index, 1);
    onUpdateVendor({ ...vendor, [field]: list });
  };

  const saveItem = (field: keyof Vendor, data: any) => {
    const list = [...(vendor[field] as any[])];
    const item = { ...data, id: data.id || `${field.substring(0,2).toUpperCase()}-${Date.now()}` };
    if (editingIdx !== null) list[editingIdx] = item;
    else list.push(item);
    onUpdateVendor({ ...vendor, [field]: list });
    closeAllModals();
  };

  const closeAllModals = () => {
    setIsServiceModalOpen(false); setIsAssessmentModalOpen(false); setIsEvidenceModalOpen(false);
    setIsContractModalOpen(false); setIsActionPlanModalOpen(false); setIsIncidentModalOpen(false);
    setEditingIdx(null);
  };

  const handleAnalyzeRisk = async () => {
    setIsAnalyzing(true);
    try {
      const data = await analyzeVendorRisk(vendor, "");
      onUpdateVendor({ ...vendor, riskScore: data.riskScore });
    } catch (err) { console.error(err); } 
    finally { setIsAnalyzing(false); }
  };

  const handleSummarizeContract = async () => {
      if (!contractForm.fileName) return;
      setIsSummarizingContract(true);
      const summary = await generateContractSummary(contractForm.fileName, contractForm.type || 'Contract');
      setContractForm({ ...contractForm, contentSummary: summary });
      setIsSummarizingContract(false);
  };

  const stages = [
    { label: 'Establish Context', idx: 1 }, { label: 'Planning', idx: 2 }, { label: 'Due Diligence', idx: 3 },
    { label: 'Treatment & Contracting', idx: 4 }, { label: 'Integration', idx: 5 }, { label: 'Monitoring', idx: 6 },
    { label: 'Incident Mgmt', idx: 7 }, { label: 'Offboarding', idx: 8 },
  ];
  const currentStageIdx = stages.findIndex(s => s.label === vendor.lifecycleStage);

  return (
    <div className="space-y-6 pb-20 animate-fade-in font-sans text-slate-900">
      {/* Header Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] text-slate-400 font-medium">
                <span onClick={onBack} className="cursor-pointer hover:text-amber-600 transition-colors">Registry</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-600">{vendor.name}</span>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-amber-100 uppercase">
                    {vendor.name.substring(0, 2)}
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{vendor.name}</h1>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1 font-medium">
                        <span className="bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-100">{vendor.category}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1.5"><Mail size={14} /> {vendor.contactEmail}</div>
                    </div>
                </div>
            </div>
            <div className="flex gap-8">
                <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest mb-1">Aggregated Risk Score</div>
                    <div className="flex items-end justify-end gap-1.5">
                        <span className={`text-4xl font-black ${vendor.riskScore >= 70 ? 'text-red-600' : vendor.riskScore >= 40 ? 'text-orange-500' : 'text-emerald-500'}`}>{vendor.riskScore}</span>
                        <span className="text-slate-300 font-bold mb-1">/100</span>
                    </div>
                </div>
                <div className={`px-6 py-3 rounded-2xl border flex flex-col items-center justify-center ${vendor.riskLevel === RiskLevel.LOW ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' : 'bg-orange-50/50 border-orange-100 text-orange-600'}`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-70">Inherent Level</span>
                    <span className="font-extrabold text-lg">{vendor.riskLevel}</span>
                </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-4 lg:grid-cols-8 gap-4">
                    {stages.map((stage, idx) => {
                    const isActive = idx === currentStageIdx;
                    const isCompleted = idx < currentStageIdx;
                    return (
                        <div key={stage.label} className="flex flex-col items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                isActive ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100 ring-4 ring-amber-50' : 
                                isCompleted ? 'bg-white border-amber-500 text-amber-500' : 
                                'bg-white border-slate-100 text-slate-300'
                            }`}>
                                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <span className="text-xs font-bold">{stage.idx}</span>}
                            </div>
                            <span className={`text-[9px] font-extrabold uppercase tracking-tight text-center leading-tight h-8 flex items-center px-1 ${
                                isActive ? 'text-amber-500' : 'text-slate-400'
                            }`}>
                                {stage.label}
                            </span>
                        </div>
                    )
                })}
          </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20 px-2 rounded-t-2xl shadow-sm">
          <nav className="flex space-x-6 overflow-x-auto px-4">
            {[
                { id: 'overview', label: 'Context & Services', icon: <LayoutList size={16}/> },
                { id: 'profile', label: 'Company Profile', icon: <Building size={16}/> },
                { id: 'assessment', label: 'Risk Assessment', icon: <BrainCircuit size={16}/> },
                { id: 'evidence', label: 'Due Diligence', icon: <ShieldCheck size={16}/> },
                { id: 'contracts', label: 'Contracts', icon: <Gavel size={16}/> },
                { id: 'issues_actions', label: 'Issues & Action Plans', icon: <TrendingUp size={16}/> },
                { id: 'monitoring', label: 'Monitoring & Incidents', icon: <Activity size={16}/> },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-4 px-1 flex items-center gap-2.5 text-[13px] font-bold border-b-2 transition-all whitespace-nowrap ${
                        activeTab === tab.id ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
          </nav>
      </div>

      <div className="bg-white p-8 rounded-b-2xl border border-t-0 border-slate-200 min-h-[400px]">
          {/* OVERVIEW (CONTEXT & SERVICES) */}
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-10">
                      <div>
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Vendor Description</h3>
                          <p className="text-slate-600 leading-relaxed text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-100">{vendor.description || 'No description provided.'}</p>
                      </div>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Services</h3>
                              <button onClick={() => { setEditingIdx(null); setServiceForm({ criticality: 'Operational' }); setIsServiceModalOpen(true); }} className="text-[11px] text-[#4f46e5] font-black uppercase hover:underline">+ Add Service</button>
                          </div>
                          <div className="grid gap-3">
                            {vendor.services.map((s, i) => (
                                <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center hover:border-indigo-200 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-indigo-50 text-[#4f46e5] rounded-lg"><Server size={18}/></div>
                                        <div>
                                            <div className="font-bold text-slate-700 text-[14px]">{s.name}</div>
                                            <div className="text-xs text-slate-400 font-medium flex gap-2">
                                                <span className={`font-bold ${s.criticality === 'Critical' ? 'text-red-500' : 'text-slate-500'}`}>{s.criticality}</span>
                                                <span>•</span>
                                                <span>{s.owner}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingIdx(i); setServiceForm(s); setIsServiceModalOpen(true); }} className="text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                                        <button onClick={() => deleteItem('services', i)} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                          </div>
                      </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-8 rounded-2xl border border-indigo-100/50 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-center text-[#4f46e5] mb-6 border border-indigo-50">
                        <BrainCircuit size={40}/>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-800 mb-2">AI Risk Analyst</h3>
                      <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed font-medium">Evaluate security posture against ISO 27036 standards with Gemini 2.5.</p>
                      <button onClick={handleAnalyzeRisk} disabled={isAnalyzing} className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 transition-all transform hover:scale-[1.01]">
                          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles size={18}/>}
                          Generate Analysis Report
                      </button>
                  </div>
              </div>
          )}

          {/* COMPANY PROFILE */}
          {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
                  <div className="space-y-10">
                      <div>
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-2">Firmographics</h3>
                          <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Foundation Year</label><p className="text-sm font-bold text-slate-800">{vendor.companyProfile?.foundationYear || '-'}</p></div>
                              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Global Employees</label><p className="text-sm font-bold text-slate-800">{vendor.companyProfile?.employees?.toLocaleString() || '-'}</p></div>
                              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tax ID</label><p className="text-sm font-bold text-slate-800">{vendor.companyProfile?.taxId || '-'}</p></div>
                              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Annual Revenue</label><p className="text-sm font-bold text-slate-800">{vendor.companyProfile?.annualRevenue || '-'}</p></div>
                          </div>
                      </div>
                  </div>
                  <div className="space-y-10">
                      <div>
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-2">Technical & Security Controls</h3>
                          <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ISMS Certified</label><p className={`text-sm font-bold ${vendor.securityProfile?.isms ? 'text-emerald-600' : 'text-slate-400'}`}>{vendor.securityProfile?.isms ? 'YES' : 'NO'}</p></div>
                              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Auth Method (MFA)</label><p className="text-sm font-bold text-slate-800">{vendor.securityProfile?.mfa || '-'}</p></div>
                              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Data Encryption</label><p className="text-sm font-bold text-slate-800">{vendor.securityProfile?.encryption || '-'}</p></div>
                              <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hosting Region</label><p className="text-sm font-bold text-slate-800">{vendor.securityProfile?.dataLocation || '-'}</p></div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* RISK ASSESSMENT */}
          {activeTab === 'assessment' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Assessment Records</h3>
                      <button onClick={() => { setEditingIdx(null); setAssessmentForm({ date: new Date().toISOString().split('T')[0], type: 'Periodic', overallScore: 50, scenarioCount: 1 }); setIsAssessmentModalOpen(true); }} className="bg-[#4f46e5] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">+ New Record</button>
                  </div>
                  <table className="w-full text-left text-sm">
                      <thead className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                          <tr><th className="p-4">Execution Date</th><th className="p-4">Type</th><th className="p-4">Score</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {vendor.riskAssessments.map((ra, i) => (
                              <tr key={ra.id} className="hover:bg-slate-50 group transition-colors">
                                  <td className="p-4 font-bold text-slate-700">{ra.date}</td>
                                  <td className="p-4 text-slate-500 font-medium">{ra.type}</td>
                                  <td className="p-4 font-black text-indigo-600">{ra.overallScore}%</td>
                                  <td className="p-4"><span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{ra.status || 'Completed'}</span></td>
                                  <td className="p-4 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => { setEditingIdx(i); setAssessmentForm(ra); setIsAssessmentModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16}/></button>
                                        <button onClick={() => deleteItem('riskAssessments', i)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

          {/* DUE DILIGENCE (Evidence) */}
          {activeTab === 'evidence' && (
              <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Compliance Evidence</h3>
                      <button onClick={() => { setEditingIdx(null); setEvidenceForm({ type: 'Other', status: 'Pending Review' }); setIsEvidenceModalOpen(true); }} className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold border border-indigo-100">+ Add Evidence</button>
                  </div>
                  <table className="w-full text-left text-sm">
                      <thead className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                          <tr><th className="p-4">Document</th><th className="p-4">Type</th><th className="p-4">Expiry</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {vendor.evidences.map((ev, i) => (
                              <tr key={ev.id} className="hover:bg-slate-50 group transition-colors">
                                  <td className="p-4 font-bold text-slate-700">{ev.name}</td>
                                  <td className="p-4 text-slate-500 font-medium">{ev.type}</td>
                                  <td className="p-4 text-slate-500">{ev.expiryDate || 'N/A'}</td>
                                  <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ev.status === 'Valid' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>{ev.status}</span></td>
                                  <td className="p-4 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => { setEditingIdx(i); setEvidenceForm(ev); setIsEvidenceModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16}/></button>
                                        <button onClick={() => deleteItem('evidences', i)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

          {/* CONTRACTS */}
          {activeTab === 'contracts' && (
              <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Contracts Repository</h3>
                      <button onClick={() => { setEditingIdx(null); setContractForm({ type: 'MSA', clauses: { confidentiality: false, rightToAudit: false, dataBreachNotification: false, subprocessorLiability: false, disasterRecovery: false, securitySla: false, terminationRights: false } }); setIsContractModalOpen(true); }} className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold border border-indigo-100">+ New Contract</button>
                  </div>
                  <table className="w-full text-left text-sm">
                      <thead className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                          <tr><th className="p-4">Name</th><th className="p-4">Type</th><th className="p-4">Term</th><th className="p-4">Compliance</th><th className="p-4 text-right">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {vendor.contracts.map((c, i) => {
                              const clauseCount = Object.values(c.clauses).filter(Boolean).length;
                              return (
                                <tr key={c.id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="p-4 font-bold text-slate-700">{c.name}</td>
                                    <td className="p-4 text-slate-500 font-medium">{c.type}</td>
                                    <td className="p-4 text-slate-500 text-[11px]">Renew: {c.renewalDate || 'N/A'}</td>
                                    <td className="p-4"><span className="text-xs font-bold text-indigo-600">{clauseCount}/7 Clauses</span></td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                            <button onClick={() => { setEditingIdx(i); setContractForm(c); setIsContractModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteItem('contracts', i)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                              )
                          })}
                      </tbody>
                  </table>
              </div>
          )}

          {/* ISSUES & ACTION PLANS */}
          {activeTab === 'issues_actions' && (
              <div className="space-y-12">
                  {/* Vendor Specific Issues List */}
                  <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50/20">
                          <h3 className="font-extrabold text-red-800 text-[15px] flex items-center gap-2">
                             {/* Fix: AlertCircle imported from lucide-react */}
                             <AlertCircle size={18}/> Active Vendor Issues
                          </h3>
                          <button onClick={() => { setEditingIdx(null); setIncidentForm({ severity: RiskLevel.MEDIUM, status: 'Open', date: new Date().toISOString().split('T')[0] }); setIsIncidentModalOpen(true); }} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">+ Log Issue</button>
                      </div>
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                              <tr><th className="px-6 py-4">Summary</th><th className="px-6 py-4">Severity</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {vendor.incidents.map((inc, i) => (
                                  <tr key={inc.id} className="hover:bg-slate-50 group">
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-slate-700 text-sm">{inc.summary}</div>
                                          <div className="text-[10px] text-slate-400 uppercase font-bold">{inc.date}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${inc.severity === RiskLevel.CRITICAL ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                              {inc.severity}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="text-xs font-bold text-slate-500 italic">{inc.status}</span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                            <button onClick={() => { setEditingIdx(i); setIncidentForm(inc); setIsIncidentModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteItem('incidents', i)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                              {vendor.incidents.length === 0 && (
                                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm italic">No open issues for this vendor.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </section>

                  {/* Vendor Action Plans */}
                  <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
                          <h3 className="font-extrabold text-indigo-800 text-[15px] flex items-center gap-2">
                             <CheckSquare size={18}/> Remediation Action Plans
                          </h3>
                          <button onClick={() => { setEditingIdx(null); setActionPlanForm({ status: 'Pending', action: 'Mitigate', updates: [] }); setActionPlanTab('details'); setIsActionPlanModalOpen(true); }} className="bg-[#4f46e5] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">+ New Plan</button>
                      </div>
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                              <tr><th className="px-6 py-4">Plan Description</th><th className="px-6 py-4">Owner</th><th className="px-6 py-4">Due</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {vendor.treatmentPlan.map((p, i) => (
                                  <tr key={p.id} className="hover:bg-slate-50 group">
                                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">{p.description}</td>
                                      <td className="px-6 py-4 text-slate-500 text-sm">{p.owner}</td>
                                      <td className="px-6 py-4 text-slate-500 text-sm">{p.dueDate}</td>
                                      {/* Fix: types updated in types.ts to allow 'Review and Approval' overlap */}
                                      <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${p.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : p.status === 'Review and Approval' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600'}`}>{p.status}</span></td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                            <button onClick={() => { setEditingIdx(i); setActionPlanForm(p); setActionPlanTab('details'); setIsActionPlanModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteItem('treatmentPlan', i)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                              {vendor.treatmentPlan.length === 0 && (
                                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm italic">No active remediation plans.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </section>
              </div>
          )}

          {/* MONITORING & INCIDENTS (Global View Style) */}
          {activeTab === 'monitoring' && (
              <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Incident Registry</h3>
                      <button onClick={() => { setEditingIdx(null); setIncidentForm({ severity: RiskLevel.MEDIUM, status: 'Open', date: new Date().toISOString().split('T')[0] }); setIsIncidentModalOpen(true); }} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">+ Log Incident</button>
                  </div>
                  <table className="w-full text-left text-sm">
                      <thead className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                          <tr><th className="p-4">Incident</th><th className="p-4">Severity</th><th className="p-4">Status</th><th className="p-4">Date</th><th className="p-4 text-right">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {vendor.incidents.map((inc, i) => (
                              <tr key={inc.id} className="hover:bg-slate-50 group transition-colors">
                                  <td className="p-4 font-bold text-slate-700">{inc.summary}</td>
                                  <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inc.severity === RiskLevel.CRITICAL ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{inc.severity}</span></td>
                                  <td className="p-4 text-slate-500 font-bold">{inc.status}</td>
                                  <td className="p-4 text-slate-500">{inc.date}</td>
                                  <td className="p-4 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => { setEditingIdx(i); setIncidentForm(inc); setIsIncidentModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16}/></button>
                                        <button onClick={() => deleteItem('incidents', i)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
      </div>

      {/* --- MODALS (ENHANCED UI/UX) --- */}

      {/* Evidence Modal (Enhanced UI/UX) */}
      <Modal isOpen={isEvidenceModalOpen} onClose={closeAllModals} title="Submit Evidence" maxWidth="md" footer={<div className="flex justify-end items-center gap-6 w-full"><button onClick={closeAllModals} className="text-slate-400 text-sm font-bold">Cancel</button><button onClick={() => saveItem('evidences', evidenceForm)} className="bg-[#4f46e5] text-white px-10 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100">Save Evidence</button></div>}>
          <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400"><FileText size={20}/></div>
                  <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Document Type</p>
                      <p className="text-sm font-bold text-slate-700">{evidenceForm.type || 'Select type below'}</p>
                  </div>
              </div>
              
              <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Document Label / Name</label>
                    <input className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold" placeholder="e.g. ISO 27001 Certificate 2024" value={evidenceForm.name} onChange={e => setEvidenceForm({...evidenceForm, name: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Evidence Category</label>
                    <select className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold bg-white" value={evidenceForm.type} onChange={e => setEvidenceForm({...evidenceForm, type: e.target.value as any})}>
                        <option value="ISO 27001">ISO 27001 Certification</option>
                        <option value="SOC 2 Type II">SOC 2 Type II Report</option>
                        <option value="GDPR">GDPR Data Privacy Agreement</option>
                        <option value="Business Continuity">Business Continuity Plan (BCP)</option>
                        <option value="Other">Other Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Upload File</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-200 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm transition-all"><Upload size={20} /></div>
                        <div className="text-center">
                            <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-900 block">Click to browse or drag and drop</span>
                            <span className="text-[10px] text-slate-400 font-medium">Supports PDF, DOCX, JPG (Max 10MB)</span>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Issue Date</label>
                          <input type="date" className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={evidenceForm.issueDate} onChange={e => setEvidenceForm({...evidenceForm, issueDate: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Expiry Date</label>
                          <input type="date" className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={evidenceForm.expiryDate} onChange={e => setEvidenceForm({...evidenceForm, expiryDate: e.target.value})} />
                      </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Review Status</label>
                    <select className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-black text-indigo-600 bg-indigo-50/50" value={evidenceForm.status} onChange={e => setEvidenceForm({...evidenceForm, status: e.target.value as any})}>
                        <option value="Valid">Valid / Verified</option>
                        <option value="Pending Review">Pending Internal Review</option>
                        <option value="Expired">Rejected / Expired</option>
                    </select>
                  </div>
              </div>
          </div>
      </Modal>

      {/* Action Plan Modal (Updated with Statuses) */}
      <Modal isOpen={isActionPlanModalOpen} onClose={closeAllModals} title="Remediation Action Plan" maxWidth="4xl" footer={<div className="flex justify-end items-center gap-6 w-full"><button onClick={closeAllModals} className="text-slate-400 text-sm font-bold">Cancel</button><button onClick={() => saveItem('treatmentPlan', actionPlanForm)} className="bg-[#4f46e5] text-white px-10 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100">Save Action Plan</button></div>}>
          <div className="flex border-b border-slate-200 mb-8"><button onClick={() => setActionPlanTab('details')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${actionPlanTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Plan Details</button><button onClick={() => setActionPlanTab('updates')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${actionPlanTab === 'updates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Progress Updates ({actionPlanForm.updates?.length || 0})</button></div>
          {actionPlanTab === 'details' ? (
              <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor</label><input className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 text-slate-500 font-bold" value={vendor.name} disabled /></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Related Issue</label><select className="w-full border border-slate-200 p-2.5 rounded-lg text-sm bg-white" value={actionPlanForm.incidentId} onChange={e => setActionPlanForm({...actionPlanForm, incidentId: e.target.value})}><option value="">-- No Related Issue --</option>{vendor.incidents.map(inc => <option key={inc.id} value={inc.id}>{inc.summary}</option>)}</select></div>
                  </div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Action Description</label><input className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-bold" value={actionPlanForm.description} onChange={e => setActionPlanForm({...actionPlanForm, description: e.target.value})} placeholder="What needs to be done?" /></div>
                  <div className="grid grid-cols-2 gap-6">
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Strategy</label><textarea className="w-full border border-slate-200 p-3 rounded-lg h-32 text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={actionPlanForm.suggestedCorrection} onChange={e => setActionPlanForm({...actionPlanForm, suggestedCorrection: e.target.value})} placeholder="Technical approach..." /></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Execution Steps</label><textarea className="w-full border border-slate-200 p-3 rounded-lg h-32 text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={actionPlanForm.implementationSteps} onChange={e => setActionPlanForm({...actionPlanForm, implementationSteps: e.target.value})} placeholder="1. Step one..." /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Owner</label><input className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" value={actionPlanForm.owner} onChange={e => setActionPlanForm({...actionPlanForm, owner: e.target.value})} placeholder="Assignee..." /></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label><input type="date" className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" value={actionPlanForm.dueDate} onChange={e => setActionPlanForm({...actionPlanForm, dueDate: e.target.value})} /></div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Risk Treatment Status</label>
                      <select className="w-full border border-slate-200 p-2.5 rounded-lg text-sm font-black text-indigo-600 bg-indigo-50/50" value={actionPlanForm.status} onChange={e => setActionPlanForm({...actionPlanForm, status: e.target.value as any})}>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review and Approval">Review and Approval</option>
                        <option value="Completed">Completed</option>
                      </select>
                  </div>
              </div>
          ) : (
              <div className="space-y-6 h-[300px] flex flex-col items-center justify-center text-slate-300 italic"><FileText size={48} className="opacity-20 mb-2"/><p>No updates recorded yet.</p></div>
          )}
      </Modal>

      {/* Incident Modal (Updated with Statuses) */}
      {/* Fix: title logic updated to use editingIdx !== null */}
      <Modal isOpen={isIncidentModalOpen} onClose={closeAllModals} title={editingIdx !== null ? "Edit Observation" : "Report Finding / Issue"} maxWidth="4xl" footer={<div className="flex justify-end gap-6 w-full"><button onClick={closeAllModals} className="text-slate-400 text-sm font-bold">Cancel</button><button onClick={() => saveItem('incidents', incidentForm)} className="bg-[#ef4444] text-white px-8 py-2 rounded-lg font-bold">Save Finding</button></div>}>
          <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor</label><input className="w-full border border-slate-200 p-2.5 rounded-lg text-slate-500 bg-slate-50 font-bold" value={vendor.name} disabled /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Impacted Service</label><select className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" value={incidentForm.serviceId} onChange={e => setIncidentForm({...incidentForm, serviceId: e.target.value})}><option value="">-- General Vendor Issue --</option>{vendor.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Issue Summary / Title</label><input className="w-full border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-100 outline-none" placeholder="Brief title of the finding or incident..." value={incidentForm.summary} onChange={e => setIncidentForm({...incidentForm, summary: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Severity Level</label><div className="grid grid-cols-2 gap-2">{Object.values(RiskLevel).map(v => <button key={v} onClick={() => setIncidentForm({...incidentForm, severity: v})} className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${incidentForm.severity === v ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'}`}>{v}</button>)}</div></div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Workflow Status</label>
                    <select className="w-full border border-slate-200 p-2.5 rounded-lg text-sm font-bold outline-none" value={incidentForm.status} onChange={e => setIncidentForm({...incidentForm, status: e.target.value as any})}>
                        <option value="Open">Open</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Mitigated">Mitigated</option>
                        <option value="Review and Approval">Review and Approval</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                  </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Sparkles size={12}/> Analysis & Remediation History</h4>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Root Cause Analysis</label><textarea className="w-full border border-slate-200 p-3 rounded-xl h-24 bg-white text-sm outline-none" placeholder="Describe the underlying cause..." value={incidentForm.rootCauseAnalysis} onChange={e => setIncidentForm({...incidentForm, rootCauseAnalysis: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Remediation Steps Taken</label><textarea className="w-full border border-slate-200 p-3 rounded-xl h-24 bg-white text-sm outline-none" placeholder="Actions taken to fix the issue..." value={incidentForm.remediationSteps} onChange={e => setIncidentForm({...incidentForm, remediationSteps: e.target.value})} /></div>
              </div>
          </div>
      </Modal>

      {/* Service Modal (Restore logic if needed) */}
      <Modal isOpen={isServiceModalOpen} onClose={closeAllModals} title="Service Detail" maxWidth="3xl" footer={<div className="flex justify-end items-center gap-6 w-full"><button onClick={closeAllModals} className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors">Cancel</button><button onClick={() => saveItem('services', serviceForm)} className="bg-[#2563eb] text-white px-8 py-2 rounded-lg font-bold">Save Service</button></div>}>
          <div className="space-y-6">
              <div><label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Service Name</label><input className="w-full border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm font-bold" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Description</label><textarea className="w-full border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none h-28 resize-none text-sm" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} /></div>
              <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-6 space-y-3">
                      <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Criticality</label>
                      {['Operational', 'Critical', 'Strategic'].map(level => (
                          <label key={level} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${serviceForm.criticality === level ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                              <input type="radio" className="w-4 h-4 text-blue-600" checked={serviceForm.criticality === level} onChange={() => setServiceForm({...serviceForm, criticality: level as any})}/>
                              <span className={`text-sm font-bold ${serviceForm.criticality === level ? level === 'Critical' ? 'text-red-500' : 'text-slate-700' : 'text-slate-500'}`}>{level}</span>
                          </label>
                      ))}
                  </div>
                  <div className="col-span-12 md:col-span-6 space-y-6">
                      <div><label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">SLA Target</label><input className="w-full border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm" placeholder="99.99%" value={serviceForm.sla} onChange={e => setServiceForm({...serviceForm, sla: e.target.value})} /></div>
                      <div><label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Internal Owner</label><input className="w-full border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm" value={serviceForm.owner} onChange={e => setServiceForm({...serviceForm, owner: e.target.value})} /></div>
                  </div>
              </div>
          </div>
      </Modal>

      {/* Risk Assessment Modal (Restore logic) */}
      <Modal isOpen={isAssessmentModalOpen} onClose={closeAllModals} title={editingIdx !== null ? "Edit Assessment Config" : "New Assessment"} maxWidth="4xl" footer={<div className="flex justify-end items-center gap-8 w-full"><button onClick={closeAllModals} className="text-slate-400 text-sm font-bold">Cancel</button><button onClick={() => saveItem('riskAssessments', assessmentForm)} className="bg-[#4f46e5] text-white px-10 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100">Save Assessment</button></div>}>
          <div className="space-y-6">
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Product / Service (Optional)</label>
                  <div className="relative">
                      <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-100" value={assessmentForm.serviceId} onChange={e => setAssessmentForm({...assessmentForm, serviceId: e.target.value})}>
                          <option value="">-- Apply to All / General --</option>
                          {vendor.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <Database className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Questionnaire Template</label>
                  <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={assessmentForm.questionnaireTemplateId} onChange={e => setAssessmentForm({...assessmentForm, questionnaireTemplateId: e.target.value})}>
                      <option value="">-- Select Template --</option>
                      {AVAILABLE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assessment Type</label><select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold" value={assessmentForm.type} onChange={e => setAssessmentForm({...assessmentForm, type: e.target.value as any})}><option value="Onboarding">Onboarding</option><option value="Periodic">Periodic</option><option value="Re-assessment">Re-assessment</option></select></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assessment Date</label><input type="date" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={assessmentForm.date} onChange={e => setAssessmentForm({...assessmentForm, date: e.target.value})} /></div>
              </div>
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-6"><label className="text-xs font-black text-slate-700 uppercase tracking-wider">Initial Risk Score</label><span className={`text-2xl font-black ${assessmentForm.overallScore! > 70 ? 'text-red-600' : assessmentForm.overallScore! > 40 ? 'text-orange-500' : 'text-emerald-500'}`}>{assessmentForm.overallScore}</span></div>
                  <input type="range" min="0" max="100" className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#4f46e5]" value={assessmentForm.overallScore} onChange={e => setAssessmentForm({...assessmentForm, overallScore: parseInt(e.target.value) || 0})} />
                  <p className="text-[10px] text-slate-400 mt-4 italic font-medium">Note: This score will be auto-updated when vendor submits the questionnaire.</p>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest leading-none">AI Analysis Summary (Optional)</label><textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm h-24" value={assessmentForm.aiAnalysis?.summary} onChange={e => setAssessmentForm({...assessmentForm, aiAnalysis: { ...assessmentForm.aiAnalysis, summary: e.target.value } as any})} placeholder="Enter a brief summary of AI findings..." /></div>
          </div>
      </Modal>

      {/* Contract Modal (Restore logic) */}
      <Modal isOpen={isContractModalOpen} onClose={closeAllModals} title={editingIdx !== null ? "Edit Addendum" : "New Addendum"} maxWidth="3xl" footer={<div className="flex justify-end items-center gap-6 w-full"><button onClick={closeAllModals} className="text-slate-400 text-sm font-bold">Cancel</button><button onClick={() => saveItem('contracts', contractForm)} className="bg-[#4f46e5] text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100">Save Addendum</button></div>}>
          <div className="space-y-6">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Addendum Name/Title</label><input className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold" placeholder="e.g. Data Processing Addendum (DPA) 2024" value={contractForm.name} onChange={e => setContractForm({...contractForm, name: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Contract</label><select className="w-full border border-slate-200 p-3 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-100 font-bold" value={contractForm.parentContractId} onChange={e => setContractForm({...contractForm, parentContractId: e.target.value})}><option value="">-- Independent / None --</option>{vendor.contracts.filter(c => c.type !== 'Addendum').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Effective Date</label><input type="date" className="w-full border border-slate-200 p-3 rounded-xl text-sm" value={contractForm.startDate} onChange={e => setContractForm({...contractForm, startDate: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Renewal / Expiry</label><input type="date" className="w-full border border-slate-200 p-3 rounded-xl text-sm" value={contractForm.renewalDate} onChange={e => setContractForm({...contractForm, renewalDate: e.target.value})} /></div></div>
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2 bg-slate-50/30 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group">
                  <Upload className="text-slate-400 w-8 h-8 group-hover:text-indigo-600" />
                  <span className="text-sm font-black text-slate-500 group-hover:text-indigo-900 uppercase tracking-widest">Click to upload document</span>
              </div>
              <div>
                  <div className="flex justify-between items-center mb-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">AI Content Summary</label><button onClick={handleSummarizeContract} disabled={isSummarizingContract} className="text-[10px] text-indigo-600 font-black uppercase tracking-widest flex items-center gap-1 hover:text-indigo-800 transition-colors disabled:opacity-50"><Sparkles size={10}/> {isSummarizingContract ? 'Thinking...' : 'Auto-Summarize'}</button></div>
                  <textarea className="w-full border border-slate-200 p-3 rounded-xl text-sm h-24 outline-none focus:ring-2 focus:ring-indigo-100" value={contractForm.contentSummary} onChange={e => setContractForm({...contractForm, contentSummary: e.target.value})} />
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest leading-none">Clauses Amended / Included</label><div className="grid grid-cols-2 gap-3">
                  {Object.keys(contractForm.clauses || {}).map(k => (
                      <label key={k} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${contractForm.clauses?.[k as keyof typeof contractForm.clauses] ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100'}`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${contractForm.clauses?.[k as keyof typeof contractForm.clauses] ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>{contractForm.clauses?.[k as keyof typeof contractForm.clauses] && <CheckSquare className="w-3 h-3 text-white" />}</div>
                          <input type="checkbox" className="hidden" checked={!!contractForm.clauses?.[k as keyof typeof contractForm.clauses]} onChange={e => setContractForm({...contractForm, clauses: { ...contractForm.clauses, [k]: e.target.checked } as any})} />
                          <span className="text-xs font-black text-slate-700 capitalize tracking-tighter leading-none">{k.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                  ))}
              </div></div>
          </div>
      </Modal>

    </div>
  );
};

export default VendorDetail;

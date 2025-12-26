
import React, { useState } from 'react';
import { Vendor, LifecycleStage, RiskAssessment, RiskLevel, Evidence, Incident } from '../types';
import { ClipboardList, ShieldCheck, UserPlus, Search, Filter, Calendar, AlertTriangle, FileText, ArrowRight, Plus, Trash2, Edit2, BrainCircuit, Loader2, CheckCircle, XCircle, Server, Eye, MessageSquare, Paperclip, ClipboardCheck, Upload, Database, ChevronDown } from 'lucide-react';
import Modal from './Modal';
import { validateEvidenceAI } from '../services/geminiService';

interface AssessmentsViewProps {
  vendors: Vendor[];
  onUpdateVendor: (vendor: Vendor) => void;
}

type TabType = 'onboarding' | 'risk' | 'duediligence';

const AVAILABLE_TEMPLATES = [
    { id: 'QT-01', name: 'SIG Lite 2024' },
    { id: 'QT-02', name: 'GDPR Readiness Check' },
    { id: 'QT-03', name: 'ISO 27001 Vendor Audit' },
    { id: 'QT-04', name: 'Cloud Security Assessment (CAIQ)' }
];

const MOCK_QUESTIONS_LOOKUP = [
    { id: 'q1', text: 'Does your organization maintain an Information Security Policy?', weight: 10 },
    { id: 'q2', text: 'Do you perform regular penetration testing?', weight: 10 },
    { id: 'q3', text: 'Is data encrypted at rest and in transit?', weight: 10 },
    { id: 'q4', text: 'Do you have a formal Incident Response Plan?', weight: 10 },
    { id: 'q5', text: 'Are employees required to undergo security awareness training?', weight: 10 }
];

const AssessmentsView: React.FC<AssessmentsViewProps> = ({ vendors, onUpdateVendor }) => {
  const [activeTab, setActiveTab] = useState<TabType>('onboarding');
  
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [riskEditingId, setRiskEditingId] = useState<string | null>(null);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingAssessment, setReviewingAssessment] = useState<RiskAssessment & { vendorName: string, vendorId: string } | null>(null);

  const [riskFormData, setRiskFormData] = useState<{
    vendorId: string;
    type: 'Onboarding' | 'Periodic' | 'Re-assessment';
    date: string;
    questionnaireTemplateId: string;
    overallScore: number;
    scenarioCount: number;
    aiSummary?: string;
    serviceId: string;
  }>({
    vendorId: '',
    type: 'Periodic',
    date: new Date().toISOString().split('T')[0],
    questionnaireTemplateId: '',
    overallScore: 50,
    scenarioCount: 1,
    aiSummary: '',
    serviceId: ''
  });

  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceEditingId, setEvidenceEditingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [evidenceFormData, setEvidenceFormData] = useState<any>({
    vendorId: '', name: '', type: 'Other', issueDate: '', expiryDate: '', status: 'Pending Review', questionnaireTemplateId: '', serviceId: ''
  });

  const allAssessments = vendors.flatMap(v => 
    v.riskAssessments.map(ra => ({ ...ra, vendorName: v.name, vendorId: v.id, serviceName: v.services.find(s => s.id === ra.serviceId)?.name }))
  );

  const riskAssessments = allAssessments.filter(a => a.type === 'Periodic' || a.type === 'Re-assessment');
  const onboardingAssessments = allAssessments.filter(a => a.type === 'Onboarding');
  const dueDiligenceItems = vendors.flatMap(v => 
    v.evidences.map(ev => ({ ...ev, vendorName: v.name, vendorId: v.id, serviceName: v.services.find(s => s.id === ev.serviceId)?.name }))
  );

  const handleOpenReviewModal = (ra: RiskAssessment & { vendorName: string, vendorId: string }) => {
      setReviewingAssessment(ra);
      setIsReviewModalOpen(true);
  };

  const handleOpenRiskModal = (ra?: RiskAssessment & { vendorId: string }, forceType?: 'Onboarding' | 'Periodic') => {
    if (ra) {
        setRiskEditingId(ra.id);
        setRiskFormData({
            vendorId: ra.vendorId,
            type: ra.type,
            date: ra.date,
            questionnaireTemplateId: ra.questionnaireTemplateId || '',
            overallScore: ra.overallScore,
            scenarioCount: ra.scenarios.length,
            aiSummary: ra.aiAnalysis?.summary || '',
            serviceId: ra.serviceId || ''
        });
    } else {
        setRiskEditingId(null);
        setRiskFormData({
            vendorId: vendors.length > 0 ? vendors[0].id : '',
            type: forceType || 'Periodic',
            date: new Date().toISOString().split('T')[0],
            questionnaireTemplateId: '',
            overallScore: 50,
            scenarioCount: 1,
            aiSummary: '',
            serviceId: ''
        });
    }
    setIsRiskModalOpen(true);
  };

  const handleSaveRisk = () => {
      const vendor = vendors.find(v => v.id === riskFormData.vendorId);
      if (!vendor) return;
      const templateName = AVAILABLE_TEMPLATES.find(t => t.id === riskFormData.questionnaireTemplateId)?.name;

      if (riskEditingId) {
          onUpdateVendor({
              ...vendor,
              riskAssessments: vendor.riskAssessments.map(ra => ra.id === riskEditingId ? {
                  ...ra,
                  date: riskFormData.date,
                  type: riskFormData.type,
                  questionnaireTemplateId: riskFormData.questionnaireTemplateId,
                  questionnaireTemplateName: templateName,
                  overallScore: riskFormData.overallScore,
                  serviceId: riskFormData.serviceId,
                  aiAnalysis: ra.aiAnalysis ? { ...ra.aiAnalysis, summary: riskFormData.aiSummary || '' } : undefined
              } : ra)
          });
      } else {
          const newAssessment: RiskAssessment = {
              id: `RA-${Date.now()}`,
              date: riskFormData.date,
              type: riskFormData.type,
              status: 'Pending',
              questionnaireTemplateId: riskFormData.questionnaireTemplateId,
              questionnaireTemplateName: templateName,
              overallScore: riskFormData.overallScore,
              serviceId: riskFormData.serviceId,
              scenarios: Array(riskFormData.scenarioCount).fill(null).map((_, i) => ({ threat: `Threat ${i+1}`, vulnerability: 'Vuln', likelihood: 'Low', impact: 'Low', riskLevel: RiskLevel.LOW })),
              aiAnalysis: riskFormData.aiSummary ? { summary: riskFormData.aiSummary, controlsEvaluated: [], recommendations: [] } : undefined
          };
          onUpdateVendor({ ...vendor, riskAssessments: [...vendor.riskAssessments, newAssessment] });
      }
      setIsRiskModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-900">Assessments Center</h2>
           <p className="text-sm text-slate-500">Manage vendor evaluations across the lifecycle.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => { setActiveTab('risk'); handleOpenRiskModal(undefined, activeTab === 'onboarding' ? 'Onboarding' : 'Periodic'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                <ClipboardList className="w-4 h-4" /> New {activeTab === 'onboarding' ? 'Onboarding' : 'Risk'} Assessment
            </button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white rounded-t-xl px-2 shadow-sm">
          <nav className="flex space-x-6 overflow-x-auto">
            {['onboarding', 'risk', 'duediligence'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as TabType)} className={`py-4 px-2 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize ${activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    {t === 'risk' ? <AlertTriangle size={16}/> : t === 'onboarding' ? <UserPlus size={16}/> : <ShieldCheck size={16}/>}
                    {t} Assessment
                </button>
            ))}
          </nav>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 min-h-[400px]">
          <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr><th className="px-6 py-4">Vendor</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Score</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {(activeTab === 'onboarding' ? onboardingAssessments : riskAssessments).map(ra => (
                      <tr key={ra.id} className="hover:bg-slate-50 group transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-700">{ra.vendorName}</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-black uppercase">{ra.status || ra.type}</span></td>
                          <td className="px-6 py-4 text-slate-500">{ra.date}</td>
                          <td className="px-6 py-4 font-black text-indigo-600">{ra.overallScore}%</td>
                          <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100">
                              <button onClick={() => handleOpenRiskModal(ra as any)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16}/></button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      <Modal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} title={riskEditingId ? "Edit Assessment Config" : "New Assessment"} maxWidth="4xl" footer={<div className="flex justify-end items-center gap-8 w-full"><button onClick={() => setIsRiskModalOpen(false)} className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors">Cancel</button><button onClick={handleSaveRisk} className="bg-[#4f46e5] text-white px-10 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100">Save Assessment</button></div>}>
          <div className="space-y-6">
              {!riskEditingId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Vendor</label>
                    <div className="relative">
                        <select className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-slate-50/50" value={riskFormData.vendorId} onChange={(e) => setRiskFormData({...riskFormData, vendorId: e.target.value, serviceId: ''})}>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
              )}

              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Product / Service (Optional)</label>
                  <div className="relative">
                      <select className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-white pr-10" value={riskFormData.serviceId} onChange={(e) => setRiskFormData({...riskFormData, serviceId: e.target.value})}>
                          <option value="">-- Apply to All / General --</option>
                          {vendors.find(v => v.id === riskFormData.vendorId)?.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <Database className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Specify if this assessment applies to a specific service.</p>
              </div>
              
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Questionnaire Template</label>
                  <div className="relative">
                      <select className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-white" value={riskFormData.questionnaireTemplateId} onChange={(e) => setRiskFormData({...riskFormData, questionnaireTemplateId: e.target.value})}>
                          <option value="">-- Select Template --</option>
                          {AVAILABLE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Assessment Type</label>
                    <div className="relative">
                        <select className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-white" value={riskFormData.type} onChange={(e) => setRiskFormData({...riskFormData, type: e.target.value as any})}>
                            <option value="Onboarding">Onboarding</option>
                            <option value="Periodic">Periodic</option>
                            <option value="Re-assessment">Re-assessment</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Assessment Date</label>
                    <div className="relative">
                        <input type="date" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-white" value={riskFormData.date} onChange={(e) => setRiskFormData({...riskFormData, date: e.target.value})}/>
                        <Calendar className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
              </div>
              
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Initial Risk Score</label>
                      <span className={`text-2xl font-black ${riskFormData.overallScore > 70 ? 'text-red-600' : riskFormData.overallScore > 40 ? 'text-orange-500' : 'text-emerald-500'}`}>{riskFormData.overallScore}</span>
                  </div>
                  <input type="range" min="0" max="100" className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#4f46e5] [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-slate-200 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#4f46e5] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-2" value={riskFormData.overallScore} onChange={(e) => setRiskFormData({...riskFormData, overallScore: parseInt(e.target.value) || 0})}/>
                  <p className="text-[10px] text-slate-400 mt-4 font-medium italic">Note: This score will be auto-updated when vendor submits the questionnaire.</p>
              </div>
              
              {!riskEditingId && (
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Scenarios to Generate</label>
                      <input type="number" min="1" max="10" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-white" value={riskFormData.scenarioCount} onChange={(e) => setRiskFormData({...riskFormData, scenarioCount: parseInt(e.target.value) || 1})}/>
                   </div>
               )}

              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">AI Analysis Summary (Optional)</label>
                  <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none h-24 bg-white" value={riskFormData.aiSummary} onChange={(e) => setRiskFormData({...riskFormData, aiSummary: e.target.value})} placeholder="Enter a brief summary of AI findings..."/>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default AssessmentsView;

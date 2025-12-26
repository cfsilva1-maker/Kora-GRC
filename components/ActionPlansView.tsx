
import React, { useState } from 'react';
import { Vendor, RiskTreatmentPlan, Person, PlanUpdate } from '../types';
import { CheckSquare, Plus, Trash2, Edit2, Search, Server, AlertCircle, Sparkles, Loader2, Send, Calendar, User, Activity, Clock, FileText } from 'lucide-react';
import Modal from './Modal';
import { generateActionPlanAI } from '../services/geminiService';

interface ActionPlansViewProps {
  vendors: Vendor[];
  onUpdateVendor: (vendor: Vendor) => void;
  people?: Person[];
}

const ActionPlansView: React.FC<ActionPlansViewProps> = ({ vendors, onUpdateVendor, people = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // AI State
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'updates'>('details');
  const [newUpdateNote, setNewUpdateNote] = useState('');
  const [formData, setFormData] = useState<Partial<RiskTreatmentPlan> & { vendorId: string }>({
    vendorId: '',
    description: '',
    suggestedCorrection: '',
    implementationSteps: '',
    action: 'Mitigate',
    owner: '',
    dueDate: '',
    status: 'Pending',
    riskId: 'General',
    serviceId: '',
    incidentId: '',
    updates: []
  });

  const allPlans = vendors.flatMap(v => 
    v.treatmentPlan.map(tp => ({ 
        ...tp, 
        vendorName: v.name, 
        vendorId: v.id, 
        serviceName: v.services.find(s => s.id === tp.serviceId)?.name,
        incidentSummary: v.incidents.find(i => i.id === tp.incidentId)?.summary 
    }))
  ).filter(tp => 
    tp.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tp.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (plan?: RiskTreatmentPlan & { vendorId: string }) => {
    setNewUpdateNote('');
    setActiveTab('details');
    if (plan) {
      setEditingId(plan.id);
      setFormData({
        vendorId: plan.vendorId,
        description: plan.description,
        suggestedCorrection: plan.suggestedCorrection || '',
        implementationSteps: plan.implementationSteps || '',
        action: plan.action,
        owner: plan.owner,
        dueDate: plan.dueDate,
        status: plan.status,
        riskId: plan.riskId,
        serviceId: plan.serviceId || '',
        incidentId: plan.incidentId || '',
        updates: plan.updates || []
      });
    } else {
      setEditingId(null);
      setFormData({
        vendorId: vendors.length > 0 ? vendors[0].id : '',
        description: '',
        suggestedCorrection: '',
        implementationSteps: '',
        action: 'Mitigate',
        owner: '',
        dueDate: '',
        status: 'Pending',
        riskId: 'General',
        serviceId: '',
        incidentId: '',
        updates: []
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (vendorId: string, planId: string) => {
    if (window.confirm('Delete this action plan?')) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        const updatedVendor = {
          ...vendor,
          treatmentPlan: vendor.treatmentPlan.filter(tp => tp.id !== planId)
        };
        onUpdateVendor(updatedVendor);
      }
    }
  };

  const handleSave = () => {
    if (!formData.vendorId || !formData.description) return;

    const vendor = vendors.find(v => v.id === formData.vendorId);
    if (!vendor) return;

    let updatedVendor: Vendor;

    const planPayload = {
        description: formData.description!,
        suggestedCorrection: formData.suggestedCorrection,
        implementationSteps: formData.implementationSteps,
        action: formData.action as any,
        owner: formData.owner!,
        dueDate: formData.dueDate!,
        status: formData.status as any,
        riskId: formData.riskId!,
        serviceId: formData.serviceId,
        incidentId: formData.incidentId,
        updates: formData.updates
    };

    // Sync Issue Status if Completed
    let updatedIncidents = vendor.incidents;
    if (formData.status === 'Completed' && formData.incidentId) {
        updatedIncidents = vendor.incidents.map(inc => 
            inc.id === formData.incidentId ? { ...inc, status: 'Resolved' as const } : inc
        );
    }

    if (editingId) {
      updatedVendor = {
        ...vendor,
        incidents: updatedIncidents,
        treatmentPlan: vendor.treatmentPlan.map(tp => 
          tp.id === editingId 
            ? { ...tp, ...planPayload } 
            : tp
        )
      };
    } else {
      const newPlan: RiskTreatmentPlan = {
        id: `TP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        ...planPayload,
        dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      };
      updatedVendor = {
        ...vendor,
        incidents: updatedIncidents,
        treatmentPlan: [...vendor.treatmentPlan, newPlan]
      };
    }

    onUpdateVendor(updatedVendor);
    setIsModalOpen(false);
  };

  const handleAddUpdate = () => {
      if (!newUpdateNote) return;
      const newUpdate: PlanUpdate = {
          id: `UP-${Date.now()}`,
          date: new Date().toISOString(),
          note: newUpdateNote,
          author: 'Admin User' // Ideally current user name
      };
      setFormData(prev => ({
          ...prev,
          updates: [...(prev.updates || []), newUpdate]
      }));
      setNewUpdateNote('');
  };

  const handleGenerateAI = async () => {
      const vendor = vendors.find(v => v.id === formData.vendorId);
      if (!vendor) return;

      // Determine context: Use Incident if selected, otherwise fallback to description or generic
      let issueSummary = formData.description;
      if (formData.incidentId) {
          const incident = vendor.incidents.find(i => i.id === formData.incidentId);
          if (incident) issueSummary = incident.summary;
      }

      if (!issueSummary) {
          alert("Please select a Related Issue or enter a basic Action Description first to provide context for the AI.");
          return;
      }

      setIsGenerating(true);
      const plan = await generateActionPlanAI(issueSummary, vendor.name, formData.riskId || 'General Risk');
      
      if (plan) {
          setFormData({
              ...formData,
              description: plan.description,
              suggestedCorrection: plan.suggestedCorrection,
              implementationSteps: plan.implementationSteps
          });
      }
      setIsGenerating(false);
  };

  // Helper to get services for currently selected vendor in form
  const currentVendorServices = formData.vendorId 
    ? vendors.find(v => v.id === formData.vendorId)?.services || []
    : [];

  // Helper to get incidents for currently selected vendor in form
  const currentVendorIncidents = formData.vendorId
    ? vendors.find(v => v.id === formData.vendorId)?.incidents || []
    : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-200 bg-indigo-50/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <CheckSquare className="w-5 h-5"/>
            </div>
            <div>
                <h3 className="font-bold text-slate-800">Action Plans</h3>
                <p className="text-xs text-slate-500">Track strategic risk treatment activities</p>
            </div>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search actions..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Plan
            </button>
        </div>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Action</th>
            <th className="px-6 py-4">Vendor</th>
            <th className="px-6 py-4">Context</th>
            <th className="px-6 py-4">Owner</th>
            <th className="px-6 py-4">Due Date</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allPlans.map((plan) => (
            <tr key={plan.id} className="hover:bg-slate-50 group">
              <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{plan.description}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{plan.riskId} • {plan.action}</div>
                  {plan.suggestedCorrection && <div className="mt-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">AI Enhanced</div>}
                  {plan.updates && plan.updates.length > 0 && <div className="mt-1 text-xs text-slate-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div>{plan.updates.length} Updates</div>}
              </td>
              <td className="px-6 py-4 text-slate-600">{plan.vendorName}</td>
              <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                      {plan.serviceName ? (
                          <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit">
                              <Server className="w-3 h-3 text-slate-400"/> {plan.serviceName}
                          </span>
                      ) : <span className="text-xs text-slate-300 italic">General</span>}
                      
                      {plan.incidentSummary && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                              <AlertCircle className="w-3 h-3"/> Issue: {plan.incidentSummary.substring(0, 15)}...
                          </span>
                      )}
                  </div>
              </td>
              <td className="px-6 py-4 text-slate-600">{plan.owner}</td>
              <td className="px-6 py-4 text-slate-600">{plan.dueDate}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  plan.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                  plan.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>{plan.status}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(plan)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(plan.vendorId, plan.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </td>
            </tr>
          ))}
          {allPlans.length === 0 && (
            <tr><td colSpan={7} className="p-8 text-center text-slate-400">No action plans active.</td></tr>
          )}
        </tbody>
      </table>

      {/* Modal Form - Improved with Tabs */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Action Plan" : "Create Action Plan"}
        maxWidth="4xl"
        footer={
            <>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Save Plan</button>
            </>
        }
      >
          {/* Modal Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
              <button 
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Plan Details
              </button>
              <button 
                onClick={() => setActiveTab('updates')}
                className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'updates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Progress Updates ({formData.updates?.length || 0})
              </button>
          </div>

          <div className="space-y-6">
              {activeTab === 'details' && (
                  <>
                      {/* Context Fields */}
                      {!editingId && (
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.vendorId}
                                    onChange={(e) => setFormData({...formData, vendorId: e.target.value, serviceId: '', incidentId: ''})}
                                >
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                              </div>
                              {formData.vendorId && (
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Related Issue</label>
                                      <select 
                                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                          value={formData.incidentId}
                                          onChange={(e) => setFormData({...formData, incidentId: e.target.value})}
                                      >
                                          <option value="">-- None --</option>
                                          {currentVendorIncidents.map(i => (
                                              <option key={i.id} value={i.id}>{i.summary} ({i.severity})</option>
                                          ))}
                                      </select>
                                  </div>
                              )}
                          </div>
                      )}

                      {/* AI Assistant - Compact */}
                      <div className="flex justify-end -mt-2">
                          <button 
                            onClick={handleGenerateAI}
                            disabled={isGenerating || !formData.vendorId}
                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                              {isGenerating ? 'Generating...' : 'Auto-Fill with AI'}
                          </button>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Action Description</label>
                              <input 
                                  type="text" 
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  value={formData.description}
                                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                                  placeholder="What needs to be done?"
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Strategy</label>
                                      <textarea 
                                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32 resize-none bg-slate-50 focus:bg-white transition-colors"
                                          value={formData.suggestedCorrection}
                                          onChange={(e) => setFormData({...formData, suggestedCorrection: e.target.value})}
                                          placeholder="Technical approach..."
                                      />
                                  </div>
                              </div>
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Execution Steps</label>
                                      <textarea 
                                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32 resize-none bg-slate-50 focus:bg-white transition-colors"
                                          value={formData.implementationSteps}
                                          onChange={(e) => setFormData({...formData, implementationSteps: e.target.value})}
                                          placeholder="1. Step one..."
                                      />
                                  </div>
                              </div>
                          </div>

                          {/* Attributes Card */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
                                <div className="relative">
                                    <input 
                                      list="people-list"
                                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none pl-9"
                                      value={formData.owner}
                                      onChange={(e) => setFormData({...formData, owner: e.target.value})}
                                      placeholder="Assignee..."
                                    />
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <datalist id="people-list">
                                        {people.map(p => <option key={p.id} value={`${p.firstName} ${p.lastName}`} />)}
                                    </datalist>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                <div className="relative">
                                    <input 
                                      type="date" 
                                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none pl-9"
                                      value={formData.dueDate}
                                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                    />
                                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Risk Treatment</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.action}
                                    onChange={(e) => setFormData({...formData, action: e.target.value as any})}
                                >
                                    <option value="Mitigate">Mitigate</option>
                                    <option value="Transfer">Transfer</option>
                                    <option value="Avoid">Avoid</option>
                                    <option value="Accept">Accept</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                              </div>
                          </div>
                      </div>
                  </>
              )}

              {activeTab === 'updates' && (
                  <div className="space-y-4 h-[400px] flex flex-col">
                      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                          {formData.updates && formData.updates.length > 0 ? (
                              formData.updates.map((update, idx) => (
                                  <div key={update.id} className="relative pl-6 border-l-2 border-slate-200">
                                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-100 border-2 border-slate-300"></div>
                                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                                          <div className="flex justify-between items-center mb-1">
                                              <span className="font-bold text-slate-700 flex items-center gap-2">
                                                  <User className="w-3 h-3 text-slate-400"/> {update.author}
                                              </span>
                                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                                  <Clock className="w-3 h-3"/> {new Date(update.date).toLocaleString()}
                                              </span>
                                          </div>
                                          <p className="text-slate-600">{update.note}</p>
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                  <FileText className="w-10 h-10 mb-2 opacity-50"/>
                                  <p className="text-sm">No updates recorded yet.</p>
                              </div>
                          )}
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100">
                          <div className="flex gap-2">
                              <input 
                                  type="text" 
                                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  placeholder="Add a new update or note..."
                                  value={newUpdateNote}
                                  onChange={(e) => setNewUpdateNote(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUpdate())}
                              />
                              <button 
                                  onClick={(e) => { e.preventDefault(); handleAddUpdate(); }}
                                  disabled={!newUpdateNote}
                                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                              >
                                  <Send className="w-4 h-4"/>
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </Modal>
    </div>
  );
};

export default ActionPlansView;

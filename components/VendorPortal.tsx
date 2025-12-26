import React, { useState } from 'react';
import { Vendor, VendorStatus, LifecycleStage, RiskLevel, Service, RiskAssessment, Incident, RiskTreatmentPlan, AssessmentAnswer, PlanUpdate } from '../types';
import {
  Building, LayoutDashboard, Package, LogOut, Upload,
  Camera, CheckCircle, Save, Plus, Trash2, Globe, Mail,
  ShieldCheck, ClipboardList, AlertCircle, CheckSquare,
  Clock, ArrowRight, Send, X, Paperclip, MessageSquare, Calendar, User, Check, Server, ShieldAlert
} from 'lucide-react';
import { Lock } from 'lucide-react';
import Modal from './Modal';
import Layout from './Layout';
import VendorSidebar from './VendorSidebar';

interface VendorPortalProps {
  onRegisterVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  existingVendors: Vendor[];
  onExitPortal: () => void;
}

type PortalView = 'auth' | 'profile' | 'services_catalog' | 'assessments' | 'risk_remediation';

const VendorPortal: React.FC<VendorPortalProps> = ({ onRegisterVendor, onUpdateVendor, existingVendors, onExitPortal }) => {
  const [currentView, setCurrentView] = useState<PortalView>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', companyName: '' });
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState<Partial<Vendor>>({});
  const [contactForm, setContactForm] = useState<{name: string, email: string}>({ name: '', email: '' });

  // Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({ name: '', description: '', owner: 'Vendor Managed', sla: '', criticality: 'Operational' });
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedActionPlan, setSelectedActionPlan] = useState<RiskTreatmentPlan | null>(null);
  const [actionUpdateForm, setActionUpdateForm] = useState({ status: '', comment: '' });

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const found = existingVendors.find(v => v.contactEmail === authForm.email);
      if (found) {
          loginUser(found);
      } else if(authForm.email) {
          alert("Vendor not found. Please register.");
      }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      const newVendor: Vendor = {
          id: `V-EXT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          name: authForm.companyName,
          category: 'Uncategorized',
          status: VendorStatus.ONBOARDING,
          lifecycleStage: LifecycleStage.CONTEXT_ESTABLISHMENT,
          riskLevel: RiskLevel.LOW,
          riskScore: 0,
          lastAssessmentDate: 'N/A',
          description: '',
          contactEmail: authForm.email,
          services: [], evidences: [], contracts: [], incidents: [], riskAssessments: [], treatmentPlan: [],
          contacts: { primary: { name: 'Admin', email: authForm.email, role: 'Admin', phone: '' }, security: { name: '', email: '', availability: '' } }
      };
      onRegisterVendor(newVendor);
      loginUser(newVendor);
  };

  const loginUser = (vendor: Vendor) => {
      setCurrentVendor(vendor);
      setProfileForm(vendor);
      setContactForm({ name: vendor.contacts?.primary?.name || '', email: vendor.contactEmail || '' });
      setCurrentView('profile');
  };

  const handleLogout = () => {
      setCurrentVendor(null);
      setAuthForm({ email: '', password: '', companyName: '' });
      setCurrentView('auth');
  };

  const handleSaveProfile = () => {
      if (!currentVendor) return;
      const updatedVendor = { ...currentVendor, ...profileForm, contactEmail: contactForm.email } as Vendor;
      setCurrentVendor(updatedVendor);
      onUpdateVendor(updatedVendor);
      alert("Profile updated!");
  };

  const handleAddService = () => {
      if (!currentVendor || !serviceForm.name) return;
      const newService: Service = {
          id: `S-V-${Date.now()}`,
          name: serviceForm.name,
          description: serviceForm.description || '',
          criticality: serviceForm.criticality as any,
          owner: serviceForm.owner || 'Vendor Managed',
          sla: serviceForm.sla || 'N/A'
      };
      const updatedVendor = { ...currentVendor, services: [...currentVendor.services, newService] };
      setCurrentVendor(updatedVendor);
      onUpdateVendor(updatedVendor);
      setIsServiceModalOpen(false);
      setServiceForm({ name: '', description: '', owner: 'Vendor Managed', sla: '', criticality: 'Operational' });
  };

  const handleUpdateActionStatus = () => {
      if(!currentVendor || !selectedActionPlan) return;
      const updatedPlans = currentVendor.treatmentPlan.map(p => p.id === selectedActionPlan.id ? { ...p, status: actionUpdateForm.status as any } : p);
      
      let updatedIncidents = currentVendor.incidents;
      if (actionUpdateForm.status === 'Completed' && selectedActionPlan.incidentId) {
          updatedIncidents = currentVendor.incidents.map(inc => inc.id === selectedActionPlan.incidentId ? { ...inc, status: 'Resolved' as const } : inc);
      }

      const updatedVendor = { ...currentVendor, treatmentPlan: updatedPlans, incidents: updatedIncidents };
      setCurrentVendor(updatedVendor);
      onUpdateVendor(updatedVendor);
      setIsActionModalOpen(false);
      alert("Status synced!");
  };

  if (currentView === 'auth') {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                  <div className="flex justify-center mb-6">
                      <img src="/logo.png" alt="Kora GRC Logo" className="max-h-20 rounded-xl shadow-lg" />
                  </div>
                  <h1 className="text-2xl font-black text-center mb-2 text-slate-800 tracking-tight">Kora GRC <span className="text-amber-500">Vendor Portal</span></h1>
                  <p className="text-center text-slate-500 text-sm mb-8 font-medium">Manage your security profile and assessments.</p>
                  <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                      {authMode === 'register' && (
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Company Name</label>
                              <input type="text" placeholder="Your Legal Entity" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm" required value={authForm.companyName} onChange={e => setAuthForm({...authForm, companyName: e.target.value})} />
                          </div>
                      )}
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                          <input type="email" placeholder="name@company.com" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                          <input type="password" placeholder="••••••••" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
                      </div>
                        <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-black shadow-lg shadow-amber-100 transition-all mt-4">
                          {authMode === 'login' ? 'Sign In to Portal' : 'Create Vendor Account'}
                      </button>
                  </form>
                      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-center text-xs font-bold text-slate-400 mt-6 hover:text-amber-600 transition-colors">
                      {authMode === 'login' ? "Don't have an account yet? Register here" : "Already registered? Login to your account"}
                  </button>
                  <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                    <button onClick={onExitPortal} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 mx-auto">
                        <ArrowRight size={12} className="rotate-180" /> Back to Admin View
                    </button>
                  </div>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'profile':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-1 text-slate-800">Company Profile</h2>
            <p className="text-sm text-slate-500 mb-6">TEST VENDOR PORTAL</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  <Lock size={14} className="inline-block mr-2 text-slate-400" /> Legal & Identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Entity Registered Name</label>
                    <input
                      type="text"
                      value={profileForm.name || ''}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Corporate Summary</label>
                    <textarea
                      value={profileForm.description || ''}
                      onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm h-24"
                      placeholder="Describe your primary business activities..."
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 text-right">
                <button onClick={handleSaveProfile} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all">
                  <Save size={16} className="inline-block mr-2" /> Update Identity
                </button>
              </div>
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Services</h2>
            <button onClick={() => setIsServiceModalOpen(true)} className="bg-amber-500 text-white px-4 py-2 rounded mb-4">
              Add Service
            </button>
            <ul>
              {currentVendor?.services.map(service => (
                <li key={service.id} className="border p-4 mb-2 rounded">
                  <h3 className="font-bold">{service.name}</h3>
                  <p>{service.description}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'services_catalog':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-1 text-slate-800">Services Catalog</h2>
            <p className="text-sm text-slate-500 mb-6">MANAGE THE SPECIFIC PRODUCTS YOU PROVIDE</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                <Server size={14} className="inline-block mr-2 text-slate-400" /> Services Portfolio
              </h3>
              <button onClick={() => setIsServiceModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all mb-4">
                <Plus size={16} className="inline-block mr-2" /> New Service
              </button>
              <ul className="space-y-4">
                {currentVendor?.services.map(service => (
                  <li key={service.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">{service.name}</h4>
                      <p className="text-sm text-slate-500">SLA: {service.sla} <span className="mx-2">•</span> {service.criticality}</p>
                    </div>
                    {/* Add edit/delete buttons for services if needed */}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'assessments':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-1 text-slate-800">Assessments</h2>
            <p className="text-sm text-slate-500 mb-6">COMPLIANCE FORMS REQUIRING YOUR RESPONSE</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                <ClipboardList size={14} className="inline-block mr-2 text-slate-400" /> Assessments Workspace
              </h3>
              <ul className="space-y-4">
                {currentVendor?.riskAssessments.map(assessment => (
                  <li key={assessment.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">{assessment.name}</h4>
                      <p className="text-sm text-slate-500">TARGET DATE: {assessment.dueDate || 'N/A'} <span className="mx-2">•</span> <span className="text-orange-500 font-semibold">{assessment.status}</span></p>
                    </div>
                    <button className="bg-amber-100 text-amber-700 font-bold py-2 px-4 rounded-lg text-sm hover:bg-amber-200 transition-all">RESPOND NOW</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'risk_remediation':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-1 text-slate-800">Risk Remediation Center</h2>
            <p className="text-sm text-slate-500 mb-6">ACTIVE FINDINGS NEEDING ATTENTION</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                <AlertCircle size={14} className="inline-block mr-2 text-slate-400" /> Assigned Issues
              </h3>
              <ul className="space-y-4 mb-8">
                {currentVendor?.incidents.map(incident => (
                  <li key={incident.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">{incident.title}</h4>
                      <p className="text-sm text-slate-500">{incident.severity} SEVERITY <span className="mx-2">•</span> STATUS: {incident.status}</p>
                    </div>
                    <MessageSquare size={18} className="text-slate-400" />
                  </li>
                ))}
              </ul>

              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                <CheckSquare size={14} className="inline-block mr-2 text-slate-400" /> Remediation Action Plans
              </h3>
              <ul className="space-y-4">
                {currentVendor?.treatmentPlan.map(plan => (
                  <li key={plan.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">{plan.name}</h4>
                      <p className="text-sm text-slate-500">DUE: {plan.dueDate || 'N/A'} <span className="mx-2">•</span> <span className="text-orange-500 font-semibold">STATUS: {plan.status}</span></p>
                    </div>
                    <button className="bg-amber-100 text-amber-700 font-bold py-2 px-4 rounded-lg text-sm hover:bg-amber-200 transition-all">MANAGE PLAN</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <>
      <Layout
        sidebar={
          <VendorSidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            onLogout={handleLogout}
          />
        }
        topRight={currentView === 'profile' ? (
          <div className="flex gap-2">
            <div className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">VERIFIED VENDOR</div>
            <div className="bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">TE</div>
          </div>
        ) : undefined}
      >
        {renderContent()}
      </Layout>
      {isServiceModalOpen && (
        <Modal onClose={() => setIsServiceModalOpen(false)}>
          <h3 className="text-lg font-bold mb-4">Add Service</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleAddService(); }}>
            <input
              type="text"
              placeholder="Service Name"
              value={serviceForm.name}
              onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              required
            />
            <textarea
              placeholder="Description"
              value={serviceForm.description}
              onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
          </form>
        </Modal>
      )}
      {/* Add other modals if needed */}
    </>
  );
}
export default VendorPortal;

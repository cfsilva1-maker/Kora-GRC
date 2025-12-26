
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, FileText, Settings, Shield, Bell,
  Package, FilePlus, ClipboardList, FileQuestion, Workflow,
  AlertOctagon, AlertCircle, CheckSquare, ChevronDown, ChevronRight,
  Sliders, Lock, ChevronsLeft, ChevronsRight, Globe, LogOut, Activity,
  Wrench, LayoutTemplate, Check
} from 'lucide-react';
import { NavItem, Vendor, RiskLevel, VendorStatus, LifecycleStage, Person, Permission, Profile } from './types';
import Dashboard from './components/Dashboard';
import VendorList from './components/VendorList';
import VendorDetail from './components/VendorAnalysis';
import AssessmentsView from './components/AssessmentsView';
import IssuesView from './components/IssuesView';
import ActionPlansView from './components/ActionPlansView';
import ContractsView from './components/ContractsView';
import ContractAddendumView from './components/ContractAddendumView';
import ProductsServicesView from './components/ProductsServicesView';
import AssessmentsSetupView from './components/AssessmentsSetupView';
import AccessControlView from './components/AccessControlView';
import RiskAnalyticsView from './components/RiskAnalyticsView';
import VendorPortal from './components/VendorPortal';
import IncidentsView from './components/IncidentsView';
import LoginView from './components/LoginView';
import PageLayoutConfigView from './components/PageLayoutConfigView';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import PageHeader from './components/PageHeader';

// --- Risk Calculation Logic ---
const calculateVendorRiskScore = (vendor: Vendor): number => {
    // 1. Inherent Risk (30%)
    const riskMap = { 
        [RiskLevel.CRITICAL]: 100, 
        [RiskLevel.HIGH]: 75, 
        [RiskLevel.MEDIUM]: 50, 
        [RiskLevel.LOW]: 25 
    };
    const inherentScore = riskMap[vendor.riskLevel] || 25;

    // 2. Assessment Results (30%)
    // Higher assessment score = Higher Risk in this model
    let assessmentScore = inherentScore; // Fallback to inherent if no assessments
    if (vendor.riskAssessments && vendor.riskAssessments.length > 0) {
        const total = vendor.riskAssessments.reduce((acc, curr) => acc + curr.overallScore, 0);
        assessmentScore = total / vendor.riskAssessments.length;
    }

    // 3. Incident History (20%)
    let incidentScore = 0;
    if (vendor.incidents) {
        vendor.incidents.forEach(inc => {
            // Penalize for non-resolved incidents heavily
            if (inc.status !== 'Resolved') {
                if (inc.severity === RiskLevel.CRITICAL) incidentScore += 40;
                else if (inc.severity === RiskLevel.HIGH) incidentScore += 20;
                else if (inc.severity === RiskLevel.MEDIUM) incidentScore += 10;
                else incidentScore += 5;
            } else {
                // Small residual penalty for resolved incidents (history)
                incidentScore += 2;
            }
        });
    }
    incidentScore = Math.min(incidentScore, 100); // Cap at 100

    // 4. Contract Compliance (20%)
    // Score is % of MISSING clauses (High missing = High Risk)
    let contractScore = 0;
    if (vendor.contracts && vendor.contracts.length > 0) {
        let totalClauses = 0;
        let missingClauses = 0;
        vendor.contracts.forEach(c => {
            if (c.clauses) {
                const clauses = Object.values(c.clauses);
                totalClauses += clauses.length;
                missingClauses += clauses.filter(val => !val).length;
            }
        });
        contractScore = totalClauses > 0 ? (missingClauses / totalClauses) * 100 : 0;
    } else {
        // No contracts? Penalize slightly as "Unknown Risk" or 50%
        contractScore = 50; 
    }

    // Weighted Calculation
    // Formula: (Inherent * 0.3) + (Assessment * 0.3) + (Incidents * 0.2) + (Contracts * 0.2)
    const weightedScore = (inherentScore * 0.30) + 
                          (assessmentScore * 0.30) + 
                          (incidentScore * 0.20) + 
                          (contractScore * 0.20);

    return Math.round(weightedScore);
};

// Apply calc to initial data
const enrichWithRiskScore = (vendors: Vendor[]) => {
    return vendors.map(v => ({
        ...v,
        riskScore: calculateVendorRiskScore(v)
    }));
};

// Mock Data - Users
// SECURITY NOTE: In production, passwords should be hashed and stored securely
// These are mock passwords for development only
const MOCK_PEOPLE: Person[] = [
    { id: 'USR-01', firstName: 'John', lastName: 'Doe', email: 'john.doe@company.com', status: 'Active', jobTitle: 'Risk Analyst', departmentId: 'DEP-01', divisionId: 'DIV-04', profileId: 'PROF-01', userAccount: 'jdoe', groupIds: ['GRP-01', 'GRP-02'], password: 'password' },
    { id: 'USR-02', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@company.com', status: 'Active', jobTitle: 'Legal Counsel', departmentId: 'DEP-02', divisionId: 'DIV-01', profileId: 'PROF-03', userAccount: 'jsmith', groupIds: ['GRP-02'], password: 'password' },
    { id: 'USR-03', firstName: 'Mike', lastName: 'External', email: 'mike@auditors.com', status: 'Active', jobTitle: 'External Auditor', departmentId: '', divisionId: 'DIV-01', profileId: 'PROF-02', userAccount: 'mexternal', groupIds: ['GRP-01'], password: 'password' }
];

// Mock Data - Profiles with Permissions
const MOCK_PROFILES: Profile[] = [
    { 
        id: 'PROF-01', 
        name: 'Admin', 
        description: 'Full system access', 
        type: 'Manual',
        permissions: Object.values(Permission) // All permissions
    },
    { 
        id: 'PROF-02', 
        name: 'Read Only', 
        description: 'View only access to all modules', 
        type: 'Manual',
        permissions: [
            Permission.VIEW_DASHBOARD, Permission.VIEW_VENDORS, Permission.VIEW_ASSESSMENTS, 
            Permission.VIEW_CONTRACTS, Permission.VIEW_ISSUES, Permission.VIEW_ANALYTICS, Permission.VIEW_SETTINGS
        ]
    },
    { 
        id: 'PROF-03', 
        name: 'Vendor Manager', 
        description: 'Can manage vendors and assessments', 
        type: 'Automatic',
        permissions: [
            Permission.VIEW_DASHBOARD, Permission.VIEW_VENDORS, Permission.MANAGE_VENDORS,
            Permission.VIEW_ASSESSMENTS, Permission.MANAGE_ASSESSMENTS,
            Permission.VIEW_ISSUES, Permission.MANAGE_ISSUES
        ]
    }
];

// Mock Data - Vendors (Same as before)
const INITIAL_VENDORS: Vendor[] = [
  // ... (Your existing mock vendors here, truncated for brevity as they are unchanged)
  {
    id: 'V-1001',
    name: 'CloudScale AWS',
    category: 'Cloud Infrastructure',
    status: VendorStatus.ACTIVE,
    lifecycleStage: LifecycleStage.MONITORING,
    riskLevel: RiskLevel.LOW,
    riskScore: 0, 
    lastAssessmentDate: '2024-03-10',
    description: 'Primary cloud service provider hosting production workloads. Critical dependency for availability.',
    contactEmail: 'security@cloudscale.com',
    domains: ['aws.amazon.com', 'cloudscale.io'],
    services: [
        { id: 'S-1', name: 'EC2 Compute', criticality: 'Critical', owner: 'DevOps Lead', sla: '99.99%', description: 'Main compute clusters' },
        { id: 'S-2', name: 'S3 Storage', criticality: 'Critical', owner: 'DevOps Lead', sla: '99.99%', description: 'Data lake storage' }
    ],
    evidences: [
        { id: 'E-1', type: 'ISO 27001', name: 'ISO 27001:2022 Certificate', issueDate: '2023-06-01', expiryDate: '2026-06-01', status: 'Valid' },
        { id: 'E-2', type: 'SOC 2 Type II', name: 'SOC 2 Report 2023', issueDate: '2023-11-01', expiryDate: '2024-11-01', status: 'Valid' }
    ],
    contracts: [
        { 
            id: 'C-1', name: 'Master Services Agreement', type: 'MSA', startDate: '2022-01-01', renewalDate: '2025-01-01', 
            clauses: { confidentiality: true, rightToAudit: true, dataBreachNotification: true, subprocessorLiability: true, disasterRecovery: true, securitySla: true, terminationRights: true } 
        }
    ],
    incidents: [],
    riskAssessments: [
        {
            id: 'RA-01', date: '2024-03-10', overallScore: 18, type: 'Periodic',
            scenarios: [],
            aiAnalysis: {
                summary: 'Low inherent risk due to strong controls.',
                controlsEvaluated: ['Access Control', 'Encryption'],
                recommendations: ['Maintain quarterly reviews']
            }
        }
    ],
    treatmentPlan: [],
    contacts: { primary: { name: 'John Doe', email: 'john@aws.com', role: 'Account Manager', phone: '+1 555 0101' }, security: { name: 'Sec Team', email: 'security@aws.com', availability: '24/7' } },
    companyProfile: {
        foundationYear: 2006,
        employees: 60000,
        taxId: 'US-99-999999',
        annualRevenue: '$80B',
        financialScore: 'AAA'
    },
    securityProfile: { isms: true, dataLocation: 'US-East-1', encryption: 'AES-256', backupStatus: 'Automated', mfa: 'Enforced' }
  },
  {
    id: 'V-1024',
    name: 'PayGlobal API',
    category: 'Fintech',
    status: VendorStatus.ACTIVE,
    lifecycleStage: LifecycleStage.INCIDENT_MGMT,
    riskLevel: RiskLevel.HIGH,
    riskScore: 0,
    lastAssessmentDate: '2024-01-15',
    description: 'Payment gateway for e-commerce transactions.',
    contactEmail: 'compliance@payglobal.io',
    domains: ['payglobal.io'],
    services: [{ id: 'S-3', name: 'Payment Processing', criticality: 'Critical', owner: 'CFO', sla: '99.9%', description: 'Transaction API' }],
    evidences: [], contracts: [], incidents: [], riskAssessments: [], treatmentPlan: []
  }
];

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, requiredPermission: Permission.VIEW_DASHBOARD },
  {
    id: 'vendor_repo',
    label: 'Vendor Repository',
    icon: <Users size={20} />,
    requiredPermission: Permission.VIEW_VENDORS,
    children: [
        { id: 'vendors', label: 'Vendors', icon: <Users size={18} />, requiredPermission: Permission.VIEW_VENDORS },
        { id: 'products_services', label: 'Products and Services', icon: <Package size={18} />, requiredPermission: Permission.VIEW_VENDORS },
        { id: 'contracts', label: 'Contracts', icon: <FileText size={18} />, requiredPermission: Permission.VIEW_CONTRACTS },
        { id: 'contract_addendum', label: 'Contract Addendum', icon: <FilePlus size={18} />, requiredPermission: Permission.VIEW_CONTRACTS },
    ]
  },
  {
    id: 'assessments_repo',
    label: 'Assessments',
    icon: <ClipboardList size={20} />,
    requiredPermission: Permission.VIEW_ASSESSMENTS,
    children: [
        { id: 'assessments', label: 'Assessments', icon: <ClipboardList size={18} />, requiredPermission: Permission.VIEW_ASSESSMENTS },
        { id: 'assessments_setup', label: 'Assessments Setup', icon: <Sliders size={18} />, requiredPermission: Permission.MANAGE_ASSESSMENTS },
    ]
  },
  {
    id: 'issues_repo',
    label: 'Issues & Action Plans',
    icon: <AlertOctagon size={20} />,
    requiredPermission: Permission.VIEW_ISSUES,
    children: [
      { id: 'issues', label: 'Issues', icon: <AlertCircle size={18} />, requiredPermission: Permission.VIEW_ISSUES },
      { id: 'action_plans', label: 'Action Plans', icon: <CheckSquare size={18} />, requiredPermission: Permission.VIEW_ISSUES }
    ]
  },
  { id: 'monitoring_incidents', label: 'Monitoring & Incidents', icon: <Activity size={20} />, requiredPermission: Permission.VIEW_ISSUES },
  // { id: 'reports', label: 'Risk Analytics', icon: <Shield size={20} />, requiredPermission: Permission.VIEW_ANALYTICS },
  {
    id: 'settings', 
    label: 'Settings', 
    icon: <Settings size={20} />,
    requiredPermission: Permission.VIEW_SETTINGS,
    children: [
        { id: 'access_control', label: 'Access Control', icon: <Lock size={18} />, requiredPermission: Permission.MANAGE_ACCESS_CONTROL },
        { id: 'pages_config', label: 'Pages Layout & Config', icon: <LayoutTemplate size={18} />, requiredPermission: Permission.VIEW_SETTINGS }
    ]
  },
];

export default function App() {
  // Initialize vendors with calculated scores
  const [vendors, setVendors] = useState<Vendor[]>(enrichWithRiskScore(INITIAL_VENDORS));
  const [people, setPeople] = useState<Person[]>(MOCK_PEOPLE);
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<Person | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isVendorPortalMode, setIsVendorPortalMode] = useState(false);

  // Sync Logic: Ensures Primary Contact from Vendor is in Access Control
  const syncVendorContactToPeople = (vendor: Vendor) => {
      if (!vendor.contacts?.primary) return;
      const { name, email } = vendor.contacts.primary;
      if (!email || !name) return;

      setPeople(prev => {
          const exists = prev.find(p => p.email.toLowerCase() === email.toLowerCase());
          if (exists) return prev; 
          
          // Create new person record if not exists
          const parts = name.split(' ');
          const firstName = parts[0];
          const lastName = parts.slice(1).join(' ') || 'Contact';

          return [...prev, {
              id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
              firstName: firstName,
              lastName: lastName,
              email: email,
              status: 'Active',
              jobTitle: 'Vendor Contact',
              profileId: 'PROF-02', // Default to Read Only or specific vendor profile
              userAccount: email.split('@')[0],
              divisionId: '',
              departmentId: ''
          }];
      });
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setActiveTab('vendor_detail');
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    // Recalculate Risk Score on every update (e.g. added incident, new contract)
    const scoredVendor = {
        ...updatedVendor,
        riskScore: calculateVendorRiskScore(updatedVendor)
    };

    setVendors(prev => prev.map(v => v.id === scoredVendor.id ? scoredVendor : v));
    if (selectedVendor && selectedVendor.id === scoredVendor.id) {
        setSelectedVendor(scoredVendor);
    }
    syncVendorContactToPeople(scoredVendor);
  };

  const handleAddVendor = (newVendor: Vendor) => {
      const scoredVendor = {
          ...newVendor,
          riskScore: calculateVendorRiskScore(newVendor)
      };
      setVendors(prev => [...prev, scoredVendor]);
      syncVendorContactToPeople(scoredVendor);
  };

  const handleDeleteVendor = (vendorId: string) => {
      setVendors(prev => prev.filter(v => v.id !== vendorId));
      if (selectedVendor && selectedVendor.id === vendorId) {
          setSelectedVendor(null);
      }
  };

  const handleUpdatePeople = (updatedPeople: Person[]) => {
      setPeople(updatedPeople);
  }

  const handleUpdateProfiles = (updatedProfiles: Profile[]) => {
      setProfiles(updatedProfiles);
  }

  // --- Auth Handlers ---

  const handleLogin = (email: string) => {
      const user = people.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (user && user.status === 'Active') {
          setCurrentUser(user);
          setIsAuthenticated(true);
          return true;
      }
      return false;
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsVendorPortalMode(false);
      setActiveTab('dashboard');
  };

  // --- Permission Checking ---

  const hasPermission = (requiredPermission?: Permission): boolean => {
      if (!requiredPermission) return true;
      if (!currentUser) return false;
      
      const userProfile = profiles.find(p => p.id === currentUser.profileId);
      if (!userProfile || !userProfile.permissions) return false;

      return userProfile.permissions.includes(requiredPermission);
  };

  const toggleMenu = (id: string) => {
    if (isSidebarCollapsed) {
        setIsSidebarCollapsed(false);
        setExpandedMenus(prev => [...prev, id]);
        return;
    }

    setExpandedMenus(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Switch between Admin Mode and Vendor Portal
  if (isVendorPortalMode) {
      return (
          <VendorPortal 
            onRegisterVendor={handleAddVendor}
            onUpdateVendor={handleUpdateVendor}
            existingVendors={vendors}
            onExitPortal={() => setIsVendorPortalMode(false)}
          />
      );
  }

  if (!isAuthenticated) {
      return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Basic Permission Check for View
    const currentNavItem = NAV_ITEMS.find(n => n.id === activeTab) || 
                           NAV_ITEMS.flatMap(n => n.children || []).find(c => c.id === activeTab);
    
    if (currentNavItem && !hasPermission(currentNavItem.requiredPermission)) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 animate-fade-in">
                <Shield className="w-16 h-16 text-slate-200 mb-4" />
                <h2 className="text-xl font-medium text-slate-700">Access Denied</h2>
                <p className="mt-2 text-slate-500">You do not have permission to view this module.</p>
            </div>
        );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard vendors={vendors} />;
      case 'vendors':
        return (
            <VendorList 
                vendors={vendors} 
                onSelectVendor={handleVendorSelect} 
                onAddVendor={handleAddVendor}
                onUpdateVendor={handleUpdateVendor}
                onDeleteVendor={handleDeleteVendor}
                readOnly={!hasPermission(Permission.MANAGE_VENDORS)}
            />
        );
      case 'vendor_detail':
        return selectedVendor ? (
          <VendorDetail 
            vendor={selectedVendor} 
            onBack={() => {
                setSelectedVendor(null);
                setActiveTab('vendors');
            }}
            onUpdateVendor={handleUpdateVendor}
          />
        ) : (
            <VendorList 
                vendors={vendors} 
                onSelectVendor={handleVendorSelect} 
                onAddVendor={handleAddVendor}
                onUpdateVendor={handleUpdateVendor}
                onDeleteVendor={handleDeleteVendor}
                readOnly={!hasPermission(Permission.MANAGE_VENDORS)}
            />
        );
      
      case 'assessments':
        return <AssessmentsView vendors={vendors} onUpdateVendor={handleUpdateVendor} />;
      
      case 'issues':
        return <IssuesView vendors={vendors} onUpdateVendor={handleUpdateVendor} people={people} />;

      case 'action_plans':
        return <ActionPlansView vendors={vendors} onUpdateVendor={handleUpdateVendor} people={people} />;

      case 'contracts':
        return <ContractsView vendors={vendors} onUpdateVendor={handleUpdateVendor} />;
      
      case 'contract_addendum':
        return <ContractAddendumView vendors={vendors} onUpdateVendor={handleUpdateVendor} />;

      case 'products_services':
        return <ProductsServicesView vendors={vendors} onUpdateVendor={handleUpdateVendor} />;

      case 'assessments_setup':
        return <AssessmentsSetupView />;

      case 'access_control':
        return <AccessControlView people={people} onUpdatePeople={handleUpdatePeople} profiles={profiles} onUpdateProfiles={handleUpdateProfiles} />;

      case 'reports':
        return <RiskAnalyticsView />;

      case 'monitoring_incidents':
        return <IncidentsView vendors={vendors} onUpdateVendor={handleUpdateVendor} />;

      case 'pages_config':
        return <PageLayoutConfigView />;

      default:
        return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 animate-fade-in">
            <div className="bg-slate-100 p-6 rounded-full mb-6">
                <Settings className="w-12 h-12 text-slate-300" />
            </div>
            <h2 className="text-xl font-medium text-slate-700">Module: {NAV_ITEMS.find(n => n.id === activeTab || n.children?.some(c => c.id === activeTab))?.label || activeTab}</h2>
            <p className="mt-2 text-slate-500 max-w-sm text-center">This module is currently under construction. Please use the Dashboard or Vendor List for now.</p>
          </div>
        );
    }
  };

  const getPageTitle = () => {
      if (activeTab === 'vendor_detail') return 'Vendor Profile';
      
      const flatItems = NAV_ITEMS.reduce((acc: NavItem[], item) => {
          acc.push(item);
          if (item.children) acc.push(...item.children);
          return acc;
      }, []);
      
      return flatItems.find(n => n.id === activeTab)?.label || 'Dashboard';
  }

  const getPageSubtitle = () => {
      if (activeTab === 'vendor_detail') return 'Manage lifecycle, risk assessments, and compliance (ISO 27036).';
      if (activeTab === 'dashboard') return 'Overview of Third-Party Risk Management Program (ISO 31000).';
      if (activeTab === 'assessments') return 'Centralized assessment management and due diligence tracking.';
      if (activeTab === 'contracts') return 'Legal agreements database and ISO 27036 clause analysis.';
      if (activeTab === 'contract_addendum') return 'Manage amendments and supplementary contract exhibits.';
      if (activeTab === 'products_services') return 'Inventory of all engaged third-party services.';
      if (activeTab === 'assessments_setup') return 'Configure scoring setups and questionnaires.';
      if (activeTab === 'access_control') return 'Manage users, groups, departments, and divisions.';
      if (activeTab === 'reports') return 'Visualize risk data and trends (Looker Studio).';
      if (activeTab === 'monitoring_incidents') return 'Operational incident logging, tracking and resolution.';
      if (activeTab === 'pages_config') return 'Customize forms, fields, and system terminology.';
      return 'Module View';
  }

  return (
    <Layout
      sidebarCollapsed={isSidebarCollapsed}
      sidebarPosition="fixed"
      sidebar={
        <Sidebar
          navItems={NAV_ITEMS}
          activeTab={activeTab}
          expandedMenus={expandedMenus}
          isCollapsed={isSidebarCollapsed}
          onToggleMenu={toggleMenu}
          onSetActiveTab={(id) => { setActiveTab(id); setSelectedVendor(null); }}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          hasPermission={hasPermission}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchToVendorPortal={() => setIsVendorPortalMode(true)}
        />
      }
      header={
        <PageHeader
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          actions={
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700">Kora GRC Corp</p>
                <p className="text-xs text-slate-400">Enterprise License</p>
              </div>
            </div>
          }
        />
      }
    >
      {renderContent()}
    </Layout>
  );
}

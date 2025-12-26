

import React from 'react';

export enum RiskLevel {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum VendorStatus {
  ACTIVE = 'Active',
  PENDING_ASSESSMENT = 'Pending Assessment',
  REJECTED = 'Rejected',
  ONBOARDING = 'Onboarding',
  OFFBOARDING = 'Offboarding',
  ARCHIVED = 'Archived'
}

// ISO 31000 + ISO 27036 Lifecycle
export enum LifecycleStage {
  CONTEXT_ESTABLISHMENT = 'Establish Context',
  PLANNING = 'Planning',
  DUE_DILIGENCE = 'Due Diligence',
  TREATMENT_CONTRACTING = 'Treatment & Contracting',
  ONBOARDING_INTEGRATION = 'Integration',
  MONITORING = 'Monitoring',
  INCIDENT_MGMT = 'Incident Mgmt',
  OFFBOARDING = 'Offboarding'
}

export enum Permission {
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_VENDORS = 'view_vendors',
  MANAGE_VENDORS = 'manage_vendors',
  VIEW_ASSESSMENTS = 'view_assessments',
  MANAGE_ASSESSMENTS = 'manage_assessments',
  VIEW_CONTRACTS = 'view_contracts',
  MANAGE_CONTRACTS = 'manage_contracts',
  VIEW_ISSUES = 'view_issues',
  MANAGE_ISSUES = 'manage_issues',
  VIEW_SETTINGS = 'view_settings',
  MANAGE_ACCESS_CONTROL = 'manage_access_control',
  VIEW_ANALYTICS = 'view_analytics'
}

export interface Vendor {
  id: string;
  name: string;
  logoUrl?: string; // Added for customized vendor profile
  category: string;
  status: VendorStatus;
  lifecycleStage: LifecycleStage;
  riskLevel: RiskLevel;
  riskScore: number;
  lastAssessmentDate: string;
  description: string;
  contactEmail?: string;
  domains?: string[]; 
  
  // Domain Objects
  services: Service[];
  evidences: Evidence[];
  contracts: Contract[];
  incidents: Incident[];
  riskAssessments: RiskAssessment[];
  treatmentPlan: RiskTreatmentPlan[];

  // Extended Profile
  companyProfile?: {
    foundationYear: number;
    employees: number;
    taxId: string;
    annualRevenue: string;
    financialScore: string;
    parentCompany?: string;
    subsidiaries?: string;
    ownership?: string;
    creditRating?: string;
  };
  contacts?: {
    primary: { name: string; email: string; role: string; phone: string };
    security: { name: string; email: string; availability: string };
  };
  securityProfile?: {
    isms: boolean;
    dataLocation: string;
    encryption: string;
    backupStatus: string;
    mfa: string;
  };
}

export interface Service {
  id: string;
  name: string;
  description: string;
  criticality: 'Strategic' | 'Critical' | 'Operational';
  owner: string; // Internal Owner
  sla: string;
}

export interface Evidence {
  id: string;
  type: 'ISO 27001' | 'SOC 2 Type II' | 'PCI DSS' | 'GDPR' | 'Privacy Policy' | 'Business Continuity' | 'Other';
  name: string;
  issueDate: string;
  expiryDate: string;
  status: 'Valid' | 'Expired' | 'Pending Review';
  questionnaireTemplateId?: string; 
  serviceId?: string; // Link to specific service
  aiValidation?: {
    isValid: boolean;
    confidence: number;
    notes: string;
    extractedExpiry?: string;
  };
}

export interface Contract {
  id: string;
  name: string;
  type: 'MSA' | 'DPA' | 'SLA' | 'NDA' | 'Addendum';
  parentContractId?: string;
  startDate: string;
  renewalDate: string;
  fileName?: string;
  contentSummary?: string;
  description?: string;
  serviceIds?: string[]; // Link to specific products/services covered by this contract
  clauses: {
    confidentiality: boolean;
    rightToAudit: boolean;
    dataBreachNotification: boolean; 
    subprocessorLiability: boolean;
    disasterRecovery: boolean;
    securitySla: boolean;
    terminationRights: boolean;
  };
  aiAnalysis?: {
    summary: string;
    missingClauses: string[];
    riskFlags: string[];
  };
}

export interface Incident {
  id: string;
  date: string; // Occurrence Date
  dateDetected?: string;
  summary: string;
  description?: string;
  severity: RiskLevel;
  status: 'Open' | 'Investigating' | 'Mitigated' | 'Resolved' | 'Monitoring' | 'Review and Approval';
  detectionMethod?: 'Automated Alert' | 'User Report' | 'Audit Finding' | 'Vendor Notification' | 'Other';
  impactDescription?: string;
  affectedAssets?: string;
  rootCauseAnalysis?: string;
  remediationSteps?: string;
  serviceId?: string; // Link to specific service
}

export interface AssessmentAnswer {
  value: string;
  notes?: string;
  evidenceFile?: string;
}

export interface RiskAssessment {
  id: string;
  type: 'Onboarding' | 'Periodic' | 'Re-assessment';
  status?: 'Pending' | 'In Progress' | 'Submitted' | 'Reviewed' | 'Completed' | 'Rejected'; 
  date: string;
  questionnaireTemplateId?: string;
  questionnaireTemplateName?: string;
  serviceId?: string; // Link to specific service
  answers?: Record<string, AssessmentAnswer>; 
  
  scenarios: {
    threat: string;
    vulnerability: string;
    likelihood: 'High' | 'Medium' | 'Low';
    impact: 'High' | 'Medium' | 'Low';
    riskLevel: RiskLevel;
  }[];
  overallScore: number;
  aiAnalysis?: {
    summary: string;
    controlsEvaluated: string[];
    recommendations: string[];
  };
}

export interface PlanUpdate {
  id: string;
  date: string;
  note: string;
  author: string;
}

export interface RiskTreatmentPlan {
  id: string;
  riskId: string;
  action: 'Mitigate' | 'Transfer' | 'Avoid' | 'Accept';
  description: string;
  suggestedCorrection?: string; // AI Generated or Manual
  implementationSteps?: string; // AI Generated or Manual
  owner: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Review and Approval';
  serviceId?: string; // Link to specific service
  incidentId?: string; // Link to specific incident
  updates?: PlanUpdate[]; // History of notes
}

export interface RiskAnalysisResult {
  riskScore: number;
  riskLevel: string;
  summary: string;
  keyRisks: string[];
  mitigationStrategies: string[];
  isoComplianceGap: string[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
  requiredPermission?: Permission;
}

export interface ScoringRange {
  label: string;
  min: number;
  max: number;
  color: string;
}

export interface ScoringSetup {
  id: string;
  name: string;
  description: string;
  ranges: ScoringRange[];
}

export interface Question {
  id: string;
  text: string;
  weight: number;
  responseSet: string[];
  requiresEvidence: boolean;
}

export interface Section {
  id: string;
  name: string;
  questions: Question[];
}

export interface QuestionnaireTemplate {
  id: string;
  name: string;
  scoringSetupId: string;
  scoringSetupName: string;
  questionCount: number;
  status: 'Draft' | 'Published' | 'Archived';
  lastUpdated: string;
  sections: Section[];
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'Active' | 'Inactive';
  jobTitle: string;
  departmentId?: string;
  divisionId?: string;
  profileId?: string;
  userAccount?: string;
  password?: string;
  groupIds?: string[];
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

export interface Department {
  id: string;
  name: string;
  headOfDepartment: string;
  description: string;
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  type: 'Manual' | 'Automatic';
  permissions: Permission[];
}

export interface Division {
  id: string;
  name: string;
  description: string;
  parentDivisionId?: string;
  region?: string;
}

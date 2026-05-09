export interface ProjectKitAIResponse {
  projectTitle: string;
  mission: string;
  problemSummary: string;
  beneficiaries: string;
  estimatedImpact: string;
  recommendedProjectType: string;
  difficultyRating: 'Low' | 'Medium' | 'High';
  adultSupervisionRequirement: string;
  assumptions: string[];
  partnerQuestions: string[];
  timeline: TimelinePhaseAI[];
  volunteerRoles: VolunteerRoleAI[];
  materials: MaterialAI[];
  budget: BudgetAI;
  safetyConsiderations: string[];
  permissionsNeeded: string[];
  outreach: OutreachAI;
  executionChecklist: string[];
  impactMetrics: string[];
  finalReportOutline: string[];
}

export interface TimelinePhaseAI {
  phase: string;
  duration: string;
  tasks: string[];
}

export interface VolunteerRoleAI {
  role: string;
  responsibilities: string[];
  estimatedTime: string;
}

export interface MaterialAI {
  item: string;
  quantity: string;
  estimatedCost: string;
  notes: string;
}

export interface BudgetAI {
  estimatedTotal: string;
  lowCostAlternatives: string[];
}

export interface OutreachAI {
  donorEmail: string;
  advisorEmail: string;
  partnerEmail: string;
  volunteerRecruitmentMessage: string;
  socialMediaCaption: string;
  flyerCopy: string;
}

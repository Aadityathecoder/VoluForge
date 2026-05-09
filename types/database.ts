export type UserRole = 'student' | 'partner' | 'advisor' | 'admin';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'paused';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
export type CommunityNeedStatus = 'open' | 'claimed' | 'in_progress' | 'completed';
export type Visibility = 'private' | 'local' | 'public';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  school_or_org: string;
  location: string;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityNeed {
  id: string;
  submitted_by: string;
  organization_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  category: string;
  description: string;
  beneficiaries: string;
  estimated_people_impacted: number | null;
  location: string;
  deadline: string | null;
  age_restrictions: string | null;
  safety_concerns: string | null;
  known_materials: string | null;
  budget_estimate: number | null;
  preferred_project_type: string | null;
  visibility: Visibility;
  status: CommunityNeedStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectKit {
  id: string;
  need_id: string;
  created_by: string;
  title: string;
  mission: string;
  problem_summary: string;
  beneficiaries: string;
  estimated_impact: string;
  project_type: string;
  difficulty_rating: string;
  adult_supervision_requirement: string;
  assumptions: string[];
  partner_questions: string[];
  timeline: TimelinePhase[];
  tasks: Task[];
  roles: VolunteerRole[];
  materials: Material[];
  budget: BudgetInfo;
  safety: SafetyItem[];
  permissions: string[];
  outreach: OutreachContent;
  impact_metrics: ImpactMetric[];
  final_report_outline: string[];
  raw_ai_output: Record<string, unknown>;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface TimelinePhase {
  phase: string;
  duration: string;
  tasks: string[];
}

export interface Task {
  title: string;
  description: string;
  estimatedTime: string;
}

export interface VolunteerRole {
  role: string;
  responsibilities: string[];
  estimatedTime: string;
}

export interface Material {
  item: string;
  quantity: string;
  estimatedCost: string;
  notes: string;
}

export interface BudgetInfo {
  estimatedTotal: string;
  lowCostAlternatives: string[];
}

export interface SafetyItem {
  concern: string;
  mitigation: string;
}

export interface OutreachContent {
  donorEmail: string;
  advisorEmail: string;
  partnerEmail: string;
  volunteerRecruitmentMessage: string;
  socialMediaCaption: string;
  flyerCopy: string;
}

export interface ImpactMetric {
  metric: string;
  target: string;
}

export interface Project {
  id: string;
  kit_id: string;
  student_lead_id: string;
  advisor_id: string | null;
  community_partner_id: string | null;
  title: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface ImpactReport {
  id: string;
  project_id: string;
  volunteers_count: number;
  volunteer_hours: number;
  items_collected: number;
  people_served: number;
  money_raised: number | null;
  partner_testimonial: string | null;
  student_reflection: string | null;
  outcomes: string;
  generated_report: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

import type { Preferences, Outcome } from './impactEngine';
export type Mode = 'demo' | 'live' | 'signedOut';
export type Cause = 'Environment' | 'Food security' | 'Education' | 'Community';
export type ApplicationStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';
export type ServiceStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface Opportunity {
  id: string;
  organizationId: string;
  organization: string;
  title: string;
  description: string;
  cause: string;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  spotsLeft: number;
  minimumAge: number;
  minimumExperience?: number;
  urgency?: number;
  outcomeMetric?: string;
  outcomeTarget?: number;
  skills: string[];
  requirements: string[];
  proofRequired: boolean;
  imageUrl: string;
  imageKey?: string;
  remote: boolean;
  status: 'open' | 'closed' | 'archived';
  demo?: boolean;
}

export interface Application {
  id: string;
  opportunityId: string;
  studentId: string;
  studentName?: string;
  statement: string;
  availability: string;
  status: ApplicationStatus;
  createdAt: string;
  reviewerNote?: string;
  demo?: boolean;
}

export interface ServiceEntry {
  id: string;
  applicationId: string;
  opportunityId: string;
  studentId: string;
  studentName?: string;
  date: string;
  minutes: number;
  notes: string;
  proofURL?: string;
  status: ServiceStatus;
  reviewerNote?: string;
  reviewedAt?: string;
  reviewerName?: string;
  createdAt: string;
  demo?: boolean;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  school: string;
  bio: string;
  skills: string[];
  causes: string[];
  goalHours: number;
  preferences?: Preferences;
  role: 'student' | 'staff' | 'admin';
  demo?: boolean;
}

export interface Timer {
  id: string;
  applicationId: string;
  startedAt: string;
}

export interface StaffOrganization {
  id: string;
  name: string;
  role: string;
}

export interface ServiceInput {
  entryId?: string;
  applicationId: string;
  date: string;
  minutes: number;
  notes: string;
  proofURL?: string;
  outcome?: { metric: string; quantity: number; evidence: string };
}

export type ProfilePatch = Partial<Pick<Profile, 'name' | 'school' | 'bio' | 'skills' | 'causes' | 'goalHours' | 'preferences'>>;

export interface AppState {
  mode: Mode;
  ready: boolean;
  loading: boolean;
  error: string | null;
  passwordRecovery: boolean;
  configured: boolean;
  profile: Profile | null;
  opportunities: Opportunity[];
  savedIds: string[];
  applications: Application[];
  entries: ServiceEntry[];
  timer: Timer | null;
  staffOrganizations: StaffOrganization[];
  reviewApplications: Application[];
  reviewEntries: ServiceEntry[];
  outcomes: Outcome[];
  matchingProfiles: Profile[];
  research: { cause: string; volunteers: number; returning_volunteers: number; verified_hours: number }[];
  impactConfigured: boolean;
  nativeImpactConfigured: boolean;
  recordOutcome(entryId: string, metric: string, quantity: number, evidence: string): Promise<void>;
  reviewOutcome(id: string, decision: 'approved' | 'rejected', note?: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: { name: string; email: string; password: string }): Promise<{ confirmationRequired: boolean }>;
  resetPassword(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  enterDemo(): Promise<void>;
  resetDemo(): Promise<void>;
  saveOpportunity(id: string): Promise<void>;
  apply(opportunityId: string, statement: string, availability: string): Promise<void>;
  withdraw(applicationId: string): Promise<void>;
  submitService(input: ServiceInput): Promise<void>;
  startTimer(applicationId: string): Promise<void>;
  stopTimer(notes: string, proofURL?: string): Promise<number>;
  cancelTimer(): Promise<void>;
  uploadProof(uri: string, mimeType?: string, filename?: string): Promise<string>;
  updateProfile(patch: ProfilePatch): Promise<void>;
  reviewApplication(id: string, decision: 'accepted' | 'declined', note?: string): Promise<void>;
  reviewService(id: string, decision: 'approved' | 'rejected' | 'changes_requested', note?: string): Promise<void>;
  deleteAccount(): Promise<void>;
  refresh(): Promise<void>;
}

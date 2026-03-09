// ─── User / Auth ────────────────────────────────────────────────────────────

export type Plan = 'FREE' | 'PRO' | 'EXPERT';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  linkedinUrl?: string;
  currentTitle?: string;
  location?: string;
  bio?: string;
  targetSalary?: string;
  targetContract: string[];
  targetSectors: string[];
  targetLocations: string[];
  skills: string[];
  plan: Plan;
  emailVerified: boolean;
  onboardingDone: boolean;
  notifEmailNewOffer?: boolean;
  notifEmailApplicationStatus?: boolean;
  notifEmailWeeklyDigest?: boolean;
  adminLevel?: number | null;
  lastLoginAt?: string;
  createdAt: string;
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: Plan;
  adminLevel: number | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  deletionScheduledAt?: string;
  _count: { cvs: number; letters: number; applications: number };
}

export interface AdminStats {
  totalUsers: number;
  newUsersLast30Days: number;
  activeUsersLast30Days: number;
  planDistribution: { FREE: number; PRO: number; EXPERT: number };
  totalCVs: number;
  totalLetters: number;
  totalApplications: number;
  totalSearches: number;
}

export interface AuthTokens {
  accessToken: string;
}

// ─── CV ────────────────────────────────────────────────────────────────────

export interface CVExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string[];
}

export interface CVEducation {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate?: string;
  mention?: string;
}

export interface CVSkill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  category: string;
}

export interface CVLanguage {
  id: string;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native';
}

export interface CVPersonal {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  city?: string;
  linkedin?: string;
}

export interface CVContent {
  personal?: CVPersonal;
  photo?: string;
  summary?: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
  languages: CVLanguage[];
  certifications?: { id: string; name: string; issuer: string; date: string }[];
  interests?: string[];
}

export interface CV {
  id: string;
  userId: string;
  name: string;
  template: string;
  content: CVContent;
  pdfUrl?: string;
  isDefault: boolean;
  atsScore?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Cover Letter ──────────────────────────────────────────────────────────

export interface CoverLetter {
  id: string;
  userId: string;
  name: string;
  jobTitle?: string;
  companyName?: string;
  content: string;
  tone: 'professional' | 'dynamic' | 'creative';
  createdAt: string;
  updatedAt: string;
}

// ─── Job Offer ──────────────────────────────────────────────────────────────

export interface JobOffer {
  id: string;
  externalId?: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  salary?: string;
  description: string;
  requirements: string[];
  source: string;
  url: string;
  publishedAt: string;
  sector?: string;
  remote: boolean;
  matchScore?: number;
}

// ─── Application ────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'TO_SEND'
  | 'SENT'
  | 'VIEWED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_DONE'
  | 'OFFER_RECEIVED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface Application {
  id: string;
  userId: string;
  jobOfferId?: string;
  jobOffer?: JobOffer;
  status: ApplicationStatus;
  company: string;
  jobTitle: string;
  appliedAt: string;
  cvId?: string;
  letterId?: string;
  notes?: string;
  nextStep?: string;
  nextStepDate?: string;
  salary?: string;
  contactName?: string;
  contactEmail?: string;
  updatedAt: string;
}

// ─── API responses ──────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  totalApplications: number;
  responseRate: number;
  interviewsCount: number;
  pendingCount: number;
  weeklyData: { week: string; count: number }[];
  byStatus?: Record<string, number>;
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

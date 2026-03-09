// ─── Plans configuration with daily task quotas ─────────────────────
// The word "token" is BANNED from UI — only "tâches" (tasks).

export interface PlanLimits {
  cv_generation: number;
  cover_letter: number;
  job_search: number;
  ai_matching: number;
  auto_apply: number;
  interview_questions: number;
  application: number;
}

export interface PlanFeatures {
  cv_generation: boolean;
  cover_letter: boolean;
  job_search: boolean;
  ai_matching: boolean;
  auto_apply: boolean;
  interview_questions: boolean;
  email_send: boolean;
  form_automation: boolean;
  advanced_cv_analysis: boolean;
  market_analysis: boolean;
  bulk_apply: boolean;
}

export interface PlanConfig {
  id: 'FREE' | 'PRO' | 'EXPERT';
  name: string;
  price: number;
  priceAnnual?: number;
  dailyLimits: PlanLimits;
  features: PlanFeatures;
}

export const PLANS: Record<string, PlanConfig> = {
  FREE: {
    id: 'FREE',
    name: 'Gratuit',
    price: 0,
    dailyLimits: {
      cv_generation: 1,
      cover_letter: 1,
      job_search: 10,
      ai_matching: 5,
      auto_apply: 0,
      interview_questions: 0,
      application: 3,
    },
    features: {
      cv_generation: true,
      cover_letter: true,
      job_search: true,
      ai_matching: true,
      auto_apply: false,
      interview_questions: false,
      email_send: false,
      form_automation: false,
      advanced_cv_analysis: false,
      market_analysis: false,
      bulk_apply: false,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 19.99,
    priceAnnual: 15.99,
    dailyLimits: {
      cv_generation: 5,
      cover_letter: 5,
      job_search: 100,
      ai_matching: 50,
      auto_apply: 10,
      interview_questions: 2,
      application: 50,
    },
    features: {
      cv_generation: true,
      cover_letter: true,
      job_search: true,
      ai_matching: true,
      auto_apply: true,
      interview_questions: true,
      email_send: true,
      form_automation: true,
      advanced_cv_analysis: false,
      market_analysis: false,
      bulk_apply: false,
    },
  },
  EXPERT: {
    id: 'EXPERT',
    name: 'Expert',
    price: 34.99,
    priceAnnual: 27.99,
    dailyLimits: {
      cv_generation: 50,
      cover_letter: 50,
      job_search: 500,
      ai_matching: 200,
      auto_apply: 100,
      interview_questions: 10,
      application: 200,
    },
    features: {
      cv_generation: true,
      cover_letter: true,
      job_search: true,
      ai_matching: true,
      auto_apply: true,
      interview_questions: true,
      email_send: true,
      form_automation: true,
      advanced_cv_analysis: true,
      market_analysis: true,
      bulk_apply: true,
    },
  },
};

/** Human-readable labels for quota keys (FR) */
export const QUOTA_LABELS: Record<keyof PlanLimits, string> = {
  cv_generation: 'Génération de CV',
  cover_letter: 'Lettres de motivation',
  job_search: 'Recherches d\'offres',
  ai_matching: 'Matchings IA',
  auto_apply: 'Candidatures auto',
  interview_questions: 'Préparations entretien',
  application: 'Candidatures manuelles',
};

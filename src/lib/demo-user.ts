/** Virtual demo user — returned by /api/auth/demo and /api/users/me without database */
export const DEMO_USER_ID = 'demo-user';

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@carrieres-pilot.fr',
  firstName: 'Sophie',
  lastName: 'Martin',
  avatar: null,
  phone: null,
  linkedinUrl: null,
  currentTitle: 'Product Designer',
  location: 'Paris, France',
  bio: 'Passionnée par le design produit et l\'expérience utilisateur.',
  targetSalary: '55 000 €',
  targetContract: ['CDI'],
  targetSectors: ['Tech', 'Design', 'SaaS'],
  targetLocations: ['Paris', 'Lyon', 'Remote'],
  skills: ['Figma', 'UI/UX Design', 'Product Management', 'User Research', 'Prototyping'],
  plan: 'PRO' as const,
  emailVerified: true,
  onboardingDone: true,
  notifEmailNewOffer: true,
  notifEmailApplicationStatus: true,
  notifEmailWeeklyDigest: false,
  createdAt: new Date().toISOString(),
};

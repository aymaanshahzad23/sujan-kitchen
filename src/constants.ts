export const PR = '#8b6f47';
export const SEC = '#c9a66b';
export const MUT = '#6b5d4f';
export const RED = '#c0392b';
export const REDL = '#fdecea';
export const GRN = '#2d6a4f';
export const GRNL = '#e8f5ee';
export const ORA = '#b7770d';
export const ORAL = '#fef9e7';
export const BLU = '#1a5276';
export const BLUL = '#eaf2ff';
export const PUR = '#6c3483';
export const PURL = '#f5eef8';

export const SECS = {
  indian: { label: 'Indian', color: '#8b2500', bg: '#fff5f0' },
  western: { label: 'Western', color: BLU, bg: BLUL },
  bakery: { label: 'Bakery', color: '#5d4037', bg: '#fdf3e3' },
} as const;

export const DESIGNATIONS = [
  'Executive Chef', 'Sous Chef', 'Chef de Partie', 'Commis Chef',
  'Kitchen Helper', 'Steward', 'Baker', 'Pastry Chef', 'Tandoor Chef', 'Butcher',
];

export const SECTIONS_STAFF = [
  'Indian', 'Western', 'Bakery & Patisserie', 'Kitchen General', 'Management',
];

export const Q = {
  star: { label: 'Stars', emoji: '★', color: GRN, light: GRNL },
  plow: { label: 'Plow Horses', emoji: '◆', color: RED, light: REDL },
  puzzle: { label: 'Puzzles', emoji: '▲', color: BLU, light: BLUL },
  dog: { label: 'Dogs', emoji: '●', color: MUT, light: '#f2ebe6' },
} as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const LEAVE_TYPES: Record<string, { label: string; color: string; annual?: number }> = {
  PL: { label: 'Privilege Leave', color: GRN, annual: 18 },
  CL: { label: 'Casual Leave', color: BLU, annual: 5 },
  ML: { label: 'Medical Leave', color: ORA, annual: 7 },
  CO: { label: 'Comp Off', color: PUR },
  WO: { label: 'Weekly Off', color: MUT },
  PH: { label: 'Public Holiday', color: '#e91e63' },
  LWP: { label: 'Leave Without Pay', color: RED },
};

export const CAMP_NAMES: Record<string, string> = {
  jawai: 'JAWAI',
  sherbagh: 'Sherbagh',
  serai: 'The Serai',
};

export type StaffSubTab =
  | 'staff-roster'
  | 'staff-leaves'
  | 'staff-calendar'
  | 'staff-schedule'
  | 'staff-holidays';

export type MainTab =
  | 'kot'
  | 'analysis'
  | 'summary'
  | 'foodcost'
  | StaffSubTab
  | 'guests'
  | 'complaints'
  | 'reports'
  | 'manage';

export function isStaffSubTab(tab: MainTab): tab is StaffSubTab {
  return (
    tab === 'staff-roster' ||
    tab === 'staff-leaves' ||
    tab === 'staff-calendar' ||
    tab === 'staff-schedule' ||
    tab === 'staff-holidays'
  );
}

export const NAV_SECTIONS: readonly {
  id: string;
  label: string;
  tabs: readonly (readonly [MainTab, string])[];
}[] = [
  {
    id: 'kitchen',
    label: 'Kitchen & Cost',
    tabs: [
      ['kot', 'KOT Log'],
      ['analysis', 'Menu Analysis'],
      ['summary', 'Sales Summary'],
      ['foodcost', 'Food Cost'],
    ],
  },
  {
    id: 'staff',
    label: 'Staff',
    tabs: [
      ['staff-roster', 'Staff Roster'],
      ['staff-leaves', 'Leave Management'],
      ['staff-calendar', 'Calendar'],
      ['staff-schedule', 'Schedule Leave'],
      ['staff-holidays', 'Public Holidays'],
    ],
  },
  {
    id: 'guests',
    label: 'Guest Experience',
    tabs: [
      ['guests', 'Guest Registry'],
      ['complaints', 'Feedback'],
    ],
  },
  {
    id: 'admin',
    label: 'Reports & Setup',
    tabs: [
      ['reports', 'Reports'],
      ['manage', 'Manage'],
    ],
  },
] ;

export type NavSectionId = (typeof NAV_SECTIONS)[number]['id'];

export const MAIN_TABS: readonly (readonly [MainTab, string])[] = NAV_SECTIONS.flatMap((s) => s.tabs);

export function sectionForTab(tab: MainTab): NavSectionId {
  return NAV_SECTIONS.find((s) => s.tabs.some(([id]) => id === tab))?.id ?? 'kitchen';
}

export const TAB_LABELS: Record<MainTab, string> = Object.fromEntries(
  MAIN_TABS.map(([id, label]) => [id, label]),
) as Record<MainTab, string>;

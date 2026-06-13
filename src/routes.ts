import type { CampId } from './types/database';
import {
  MAIN_TABS,
  NAV_SECTIONS,
  type MainTab,
  type NavSectionId,
} from './constants';

export const CAMPS: readonly CampId[] = ['jawai', 'sherbagh', 'serai'];
export const DEFAULT_CAMP: CampId = 'jawai';
export const DEFAULT_TAB: MainTab = 'kot';
export const DEFAULT_PATH = campTabPath(DEFAULT_CAMP, DEFAULT_TAB);

const MAIN_TAB_IDS = new Set(MAIN_TABS.map(([id]) => id));

export function isCampId(value: string): value is CampId {
  return (CAMPS as readonly string[]).includes(value);
}

export function isMainTab(value: string): value is MainTab {
  return MAIN_TAB_IDS.has(value as MainTab);
}

export function campTabPath(camp: CampId, tab: MainTab): string {
  return `/${camp}/${tab}`;
}

export function firstTabInSection(sectionId: NavSectionId): MainTab {
  return NAV_SECTIONS.find((s) => s.id === sectionId)?.tabs[0]?.[0] ?? DEFAULT_TAB;
}

export function parseCampTabPath(pathname: string): { camp: CampId; tab: MainTab } | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  const [campPart, tabPart] = parts;
  if (!isCampId(campPart) || !isMainTab(tabPart)) return null;
  return { camp: campPart, tab: tabPart };
}

export function normalizeCampTabPath(pathname: string): string {
  const parsed = parseCampTabPath(pathname);
  return parsed ? campTabPath(parsed.camp, parsed.tab) : DEFAULT_PATH;
}

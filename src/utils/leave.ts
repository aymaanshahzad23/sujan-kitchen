import type { CompOff, Ingredient, LeaveRecord, LeaveStatus, LegacyStaff, PublicHoliday, RecipeLine, StaffMember } from '../types/database';
import type { LeaveSplit } from '../types/database';
import { LEAVE_TYPES, MONTH_NAMES } from '../constants';
import { addDays, eachDateInRange, formatDateLocal, getSundaysInMonth, parseDateLocal } from './helpers';
import { MAX_CONCURRENT_LEAVE, peakStaffLeaveDays } from './leaveCapacity';

export interface LeaveBalance {
  cPL: number;
  cCL: number;
  cML: number;
  cWO: number;
  cPH: number;
  usedPL: number;
  usedCL: number;
  usedML: number;
  usedWO: number;
  usedPH: number;
  remPL: number;
  remCL: number;
  remML: number;
  remWO: number;
  remPH: number;
  avCO: number;
}

export type PublicHolidayLike = Pick<PublicHoliday, 'date'> & { name?: string };

export function isPublicHoliday(date: string, publicHolidays: PublicHolidayLike[]): boolean {
  return publicHolidays.some((h) => h.date === date);
}

/** Latest date through which PH leave is credited for a viewed month */
export function publicHolidayCreditThroughDate(
  year: number,
  month: number,
  asOf: Date = new Date(),
): string {
  const { end } = monthBounds(year, month);
  const today = formatDateLocal(asOf);
  if (year < asOf.getFullYear()) return end;
  if (year > asOf.getFullYear()) return end;
  if (month < asOf.getMonth()) return end;
  if (month > asOf.getMonth()) return end;
  return today;
}

/** PH credited on each holiday date in the calendar year (resets 1 Jan) */
export function countPublicHolidayCredits(
  staff: StaffMember | LegacyStaff,
  publicHolidays: PublicHolidayLike[],
  year: number,
  throughDate: string,
): number {
  return publicHolidays.filter(
    (h) =>
      h.date.startsWith(`${year}-`) &&
      h.date <= throughDate &&
      h.date >= staff.doj,
  ).length;
}

/** Approved leave days that fall on public holidays (each costs 1 PH + 1 CL) */
export function countPublicHolidayLeaveDays(
  staffId: string,
  leaveRecs: LeaveRecord[],
  publicHolidays: PublicHolidayLike[],
  year: number,
  options?: { excludeLeaveId?: string },
): number {
  const phDates = new Set(
    publicHolidays.filter((h) => h.date.startsWith(`${year}-`)).map((h) => h.date),
  );
  let total = 0;

  leaveRecs
    .filter((l) => l.staff_id === staffId && l.status === 'approved')
    .forEach((l) => {
      if (options?.excludeLeaveId && l.id === options.excludeLeaveId) return;
      const end = l.date_to || l.date_from;
      for (const dt of eachDateInRange(l.date_from, end)) {
        if (phDates.has(dt)) total += 1;
      }
    });

  return total;
}

export function publicHolidayDaysInRange(
  fromDate: string,
  toDate: string,
  publicHolidays: PublicHolidayLike[],
): string[] {
  return eachDateInRange(fromDate, toDate).filter((d) => isPublicHoliday(d, publicHolidays));
}

export function analyzePublicHolidayLeaveImpact(
  fromDate: string,
  toDate: string,
  publicHolidays: PublicHolidayLike[],
): { phDates: string[]; nonPhDays: number; totalDays: number } {
  const totalDays = daysBetween(fromDate, toDate);
  const phDates = publicHolidayDaysInRange(fromDate, toDate, publicHolidays);
  return { phDates, nonPhDays: totalDays - phDates.length, totalDays };
}

export const LEAVE_TYPE_ORDER = ['WO', 'PL', 'CL', 'ML', 'CO', 'LWP'] as const;

export const LEAVE_ENTITLEMENTS = {
  PL_ANNUAL: 18,
  PL_MONTHLY: 18 / 12,
  CL_ANNUAL: 5,
  CL_MONTHLY: 5 / 12,
  ML_ANNUAL: 7,
} as const;

/** Months credited up to and including reference month (1st-of-month accrual) */
export function monthsCreditedSinceDoj(doj: string, year: number, month: number): number {
  const d = parseDateLocal(doj);
  return Math.max(0, (year - d.getFullYear()) * 12 + (month - d.getMonth()));
}

export function computeAccruedLeave(
  doj: string,
  year: number,
  month: number,
): { cPL: number; cCL: number; cML: number } {
  const months = monthsCreditedSinceDoj(doj, year, month);
  const cPL = Math.min(
    LEAVE_ENTITLEMENTS.PL_ANNUAL,
    Math.round(months * LEAVE_ENTITLEMENTS.PL_MONTHLY * 10) / 10,
  );
  const cCL = Math.min(
    LEAVE_ENTITLEMENTS.CL_ANNUAL,
    Math.round(months * LEAVE_ENTITLEMENTS.CL_MONTHLY * 10) / 10,
  );
  // ML: 7 days fixed per calendar year once employed in that year
  const d = parseDateLocal(doj);
  const employedInYear = year > d.getFullYear() || (year === d.getFullYear() && month >= d.getMonth());
  const cML = employedInYear ? LEAVE_ENTITLEMENTS.ML_ANNUAL : 0;
  return { cPL, cCL, cML };
}

export const COMP_OFF_EXPIRY_DAYS = 60;

export function compOffEarnedDate(woYear: number, woMonth: number): string {
  return woMonth === 11 ? `${woYear + 1}-01-01` : `${woYear}-${String(woMonth + 2).padStart(2, '0')}-01`;
}

/** 60-day window starts on the 1st of the weekly-off month (includes WO + CO time) */
export function compOffExpiryDate(woYear: number, woMonth: number): string {
  return addDays(monthBounds(woYear, woMonth).start, COMP_OFF_EXPIRY_DAYS);
}

export function compOffReason(woYear: number, woMonth: number): string {
  return `Unused WO ${MONTH_NAMES[woMonth]} ${woYear} (worked on Sunday)`;
}

/** Last calendar month whose unused WOs have converted to comp off */
export function lastCompleteWeeklyOffMonth(asOf: Date = new Date()): { year: number; month: number } {
  const y = asOf.getFullYear();
  const m = asOf.getMonth();
  if (m === 0) return { year: y - 1, month: 11 };
  return { year: y, month: m - 1 };
}

function monthsFromDojThrough(
  doj: string,
  endYear: number,
  endMonth: number,
): { year: number; month: number }[] {
  const d = parseDateLocal(doj);
  const out: { year: number; month: number }[] = [];
  let y = d.getFullYear();
  let m = d.getMonth();
  const endIdx = endYear * 12 + endMonth;
  while (y * 12 + m <= endIdx) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

function asOfDate(yearMonth?: { year: number; month: number }, fallback: Date = new Date()): Date {
  if (!yearMonth) return fallback;
  return new Date(yearMonth.year, yearMonth.month + 1, 0);
}

export function leaveTypeOptions(): { key: string; label: string }[] {
  return LEAVE_TYPE_ORDER.filter((k) => k in LEAVE_TYPES).map((k) => ({
    key: k,
    label: LEAVE_TYPES[k].label,
  }));
}

function daysBetween(from: string, to: string): number {
  const f = parseDateLocal(from);
  const t = parseDateLocal(to);
  return Math.round((t.getTime() - f.getTime()) / 86400000) + 1;
}

export function monthBounds(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end = formatDateLocal(new Date(year, month + 1, 0));
  return { start, end };
}

/** Days of a date range that fall inside [rangeStart, rangeEnd] */
export function overlapDays(from: string, to: string, rangeStart: string, rangeEnd: string): number {
  const f = parseDateLocal(from);
  const t = parseDateLocal(to || from);
  const rs = parseDateLocal(rangeStart);
  const re = parseDateLocal(rangeEnd);
  const start = f > rs ? f : rs;
  const end = t < re ? t : re;
  if (start > end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

function countUsedDays(staffId: string, type: string, leaveRecs: LeaveRecord[]): number {
  let days = 0;
  leaveRecs
    .filter((l) => l.staff_id === staffId && l.status === 'approved')
    .forEach((l) => {
      if (l.splits?.length) {
        l.splits.forEach((sp) => {
          if (sp.type === type) days += sp.days;
        });
      } else if (l.type === type) {
        days += daysBetween(l.date_from, l.date_to || l.date_from);
      }
    });
  return days;
}

/** WO / type usage credited against a specific calendar month */
export function countTypeDaysInMonth(
  staffId: string,
  type: string,
  leaveRecs: LeaveRecord[],
  year: number,
  month: number,
): number {
  const { start, end } = monthBounds(year, month);
  let total = 0;

  leaveRecs
    .filter((l) => l.staff_id === staffId && l.status === 'approved')
    .forEach((l) => {
      const leaveEnd = l.date_to || l.date_from;
      const overlap = overlapDays(l.date_from, leaveEnd, start, end);
      if (overlap === 0) return;

      if (l.splits?.length) {
        const leaveDays = daysBetween(l.date_from, leaveEnd);
        for (const sp of l.splits) {
          if (sp.type === type) {
            total += leaveDays === overlap ? sp.days : Math.min(sp.days, overlap);
          }
        }
      } else if (l.type === type) {
        total += overlap;
      }
    });

  return total;
}

export function getWeeklyOffCredit(year: number, month: number): number {
  return getSundaysInMonth(year, month);
}

export function getActiveCompOffCount(
  staffId: string,
  compOffs: CompOff[],
  asOf: Date = new Date(),
): number {
  const today = formatDateLocal(asOf);
  return compOffs.filter(
    (c) => c.staff_id === staffId && !c.used && c.expiry >= today,
  ).length;
}

export function getLeaveBalance(
  s: StaffMember | LegacyStaff,
  leaveRecs: LeaveRecord[],
  compOffs: CompOff[],
  yearMonth?: { year: number; month: number },
  publicHolidays: PublicHolidayLike[] = [],
): LeaveBalance {
  const now = new Date();
  const year = yearMonth?.year ?? now.getFullYear();
  const month = yearMonth?.month ?? now.getMonth();
  const staffId = s.id;

  const { cPL, cCL, cML } = computeAccruedLeave(s.doj, year, month);
  const cWO = getWeeklyOffCredit(year, month);
  const phThrough = publicHolidayCreditThroughDate(year, month, now);
  const cPH = countPublicHolidayCredits(s, publicHolidays, year, phThrough);

  const usedPL = countUsedDays(staffId, 'PL', leaveRecs);
  const usedCLBase = countUsedDays(staffId, 'CL', leaveRecs);
  const usedML = countUsedDays(staffId, 'ML', leaveRecs);
  const usedWO = countTypeDaysInMonth(staffId, 'WO', leaveRecs, year, month);
  const usedPH = countPublicHolidayLeaveDays(staffId, leaveRecs, publicHolidays, year);
  const usedCL = usedCLBase + usedPH;
  const asOf = asOfDate(yearMonth, now);
  const avCO = getActiveCompOffCount(staffId, compOffs, asOf);

  return {
    cPL,
    cCL,
    cML,
    cWO,
    cPH,
    usedPL,
    usedCL,
    usedML,
    usedWO,
    usedPH,
    remPL: Math.max(0, cPL - usedPL),
    remCL: Math.max(0, cCL - usedCL),
    remML: Math.max(0, cML - usedML),
    remWO: Math.max(0, cWO - usedWO),
    remPH: Math.max(0, cPH - usedPH),
    avCO,
  };
}

export function buildLeaveSplits(
  totalDays: number,
  splits: LeaveSplit[],
  primaryType: string,
): LeaveSplit[] {
  if (splits.length > 0) return splits;
  return [{ type: primaryType, days: totalDays }];
}

export function countCoDaysInSplits(splits: LeaveSplit[]): number {
  return splits.filter((sp) => sp.type === 'CO').reduce((s, sp) => s + sp.days, 0);
}

export function leaveCoversDate(leave: LeaveRecord, date: string): boolean {
  return leave.date_from <= date && (leave.date_to || leave.date_from) >= date;
}

export function leaveRangesOverlap(
  fromA: string,
  toA: string | null,
  fromB: string,
  toB: string | null,
): boolean {
  const endA = toA || fromA;
  const endB = toB || fromB;
  return fromA <= endB && fromB <= endA;
}

/** Block duplicate/overlapping leave for the same staff member. */
export function validateStaffLeaveTimeline(
  staffId: string,
  fromDate: string,
  toDate: string,
  leaveRecs: LeaveRecord[],
  options?: { excludeLeaveId?: string },
): string | null {
  const end = toDate || fromDate;
  const conflict = leaveRecs.find((l) => {
    if (options?.excludeLeaveId && l.id === options.excludeLeaveId) return false;
    if (l.staff_id !== staffId) return false;
    if (l.status === 'rejected') return false;
    return leaveRangesOverlap(fromDate, end, l.date_from, l.date_to);
  });

  if (!conflict) return null;

  const conflictEnd = conflict.date_to || conflict.date_from;
  return `${conflict.status === 'pending' ? 'Pending' : 'Approved'} leave already exists for this staff member (${conflict.date_from} to ${conflictEnd}). Adjust or remove it before booking overlapping dates.`;
}

/** Staff already on leave for a camp on a given date (approved + pending by default). */
export function staffOnLeaveOnDate(
  date: string,
  leaveRecs: LeaveRecord[],
  allStaff: StaffMember[],
  campId: string,
  options?: { excludeStaffId?: string; excludeLeaveId?: string; statuses?: LeaveStatus[] },
): StaffMember[] {
  const statuses = options?.statuses ?? ['approved', 'pending'];
  const staffById = new Map(allStaff.map((s) => [s.id, s]));
  const seen = new Set<string>();

  for (const l of leaveRecs) {
    if (options?.excludeLeaveId && l.id === options.excludeLeaveId) continue;
    if (!statuses.includes(l.status)) continue;
    if (options?.excludeStaffId && l.staff_id === options.excludeStaffId) continue;
    if (!leaveCoversDate(l, date)) continue;
    const sf = staffById.get(l.staff_id);
    if (!sf || sf.camp_id !== campId) continue;
    seen.add(sf.id);
  }

  return [...seen].map((id) => staffById.get(id)!);
}

export function validateStaffLeaveConflicts(
  s: StaffMember,
  fromDate: string,
  toDate: string,
  leaveRecs: LeaveRecord[],
  allStaff: StaffMember[],
  options?: { excludeLeaveId?: string },
): string | null {
  const overloaded = peakStaffLeaveDays(fromDate, toDate, leaveRecs, allStaff, s.camp_id, {
    excludeLeaveId: options?.excludeLeaveId,
    includeStaffId: s.id,
  });

  if (overloaded.length === 0) return null;

  const worst = overloaded.reduce((a, b) => (a.staff.length >= b.staff.length ? a : b));
  const names = worst.staff.map((m) => m.name).join(', ');
  return `Cannot proceed: ${worst.staff.length} staff would be on leave on ${worst.date} (${names}).\nMax ${MAX_CONCURRENT_LEAVE} staff allowed on leave on the same day.`;
}

export function validateLeaveApplication(
  s: StaffMember,
  fromDate: string,
  toDate: string,
  splits: LeaveSplit[],
  singleType: string,
  leaveRecs: LeaveRecord[],
  compOffs: CompOff[],
  allStaff: StaffMember[],
  yearMonth?: { year: number; month: number },
  publicHolidays: PublicHolidayLike[] = [],
  options?: { excludeLeaveId?: string },
): string | null {
  const from = parseDateLocal(fromDate);
  const to = parseDateLocal(toDate);
  if (to < from) return 'To date cannot be before From date.';

  const { phDates, nonPhDays, totalDays } = analyzePublicHolidayLeaveImpact(
    fromDate,
    toDate,
    publicHolidays,
  );
  const phDaysCount = phDates.length;

  for (const phDate of phDates) {
    if (phDate < s.doj) {
      return `Public holiday leave on ${phDate} is not available before ${s.name}'s date of joining (${s.doj}).`;
    }
  }

  const leaveYear = from.getFullYear();
  const creditThrough = toDate > formatDateLocal(new Date()) ? toDate : formatDateLocal(new Date());
  const cPH = countPublicHolidayCredits(s, publicHolidays, leaveYear, creditThrough);
  const usedPH = countPublicHolidayLeaveDays(
    s.id,
    leaveRecs,
    publicHolidays,
    leaveYear,
    options,
  );
  const remPH = Math.max(0, cPH - usedPH);

  const bal = getLeaveBalance(s, leaveRecs, compOffs, yearMonth, publicHolidays);
  const balMap: Record<string, number> = {
    PL: bal.remPL,
    CL: bal.remCL,
    ML: bal.remML,
    CO: bal.avCO,
    WO: bal.remWO,
    LWP: 9999,
  };
  const typeNames: Record<string, string> = {
    PL: 'Privilege Leave',
    CL: 'Casual Leave',
    ML: 'Medical Leave',
    CO: 'Comp Off',
    WO: 'Weekly Off',
    PH: 'Public Holiday',
    LWP: 'Leave Without Pay',
  };

  if (phDaysCount > 0) {
    if (phDaysCount > remPH) {
      return `Insufficient Public Holiday balance for ${s.name}.\nRequested on ${phDaysCount} public holiday day(s) · Available: ${remPH} day(s).\nLeave not applied.`;
    }
    if (phDaysCount > bal.remCL) {
      return `Taking leave on a public holiday also requires Casual Leave.\nNeeded: ${phDaysCount} CL day(s) · Available: ${Math.floor(bal.remCL * 10) / 10} day(s).\nLeave not applied.`;
    }
  }

  let finalSplits: LeaveSplit[] = [];
  if (nonPhDays > 0) {
    finalSplits = buildLeaveSplits(nonPhDays, splits, singleType);
    if (splits.length > 0) {
      const splitDaysTotal = splits.reduce((sum, x) => sum + x.days, 0);
      if (splitDaysTotal !== nonPhDays) {
        return `Split days total (${splitDaysTotal}) must equal non-holiday days (${nonPhDays}). Public holiday days in this period are charged as 1 PH + 1 CL each.`;
      }
    }

    for (const sp of finalSplits) {
      const available = balMap[sp.type] ?? 9999;
      if (sp.days > available) {
        return `Insufficient ${typeNames[sp.type] || sp.type} balance for ${s.name}.\nRequested: ${sp.days} day(s) · Available: ${Math.floor(available * 10) / 10} day(s).\nLeave not applied.`;
      }
    }
  } else if (splits.length > 0) {
    return 'Leave splits are not needed when the full period falls on public holidays (charged as 1 PH + 1 CL per day).';
  }

  if (totalDays === 0) return 'Leave period must include at least one day.';

  const timelineErr = validateStaffLeaveTimeline(s.id, fromDate, toDate, leaveRecs, options);
  if (timelineErr) return timelineErr;

  const staffErr = validateStaffLeaveConflicts(s, fromDate, toDate, leaveRecs, allStaff, options);
  if (staffErr) return staffErr;

  return null;
}

/** Unused weekly offs from a month → comp off rows for next month */
export function buildMonthlyCompOffRows(
  staffList: StaffMember[],
  leaveRecs: LeaveRecord[],
  year: number,
  month: number,
): Omit<CompOff, 'id'>[] {
  const earned = compOffEarnedDate(year, month);
  const expiry = compOffExpiryDate(year, month);
  const reason = compOffReason(year, month);
  const rows: Omit<CompOff, 'id'>[] = [];

  for (const s of staffList) {
    const sundays = getSundaysInMonth(year, month);
    const woUsed = countTypeDaysInMonth(s.id, 'WO', leaveRecs, year, month);
    const unusedWOs = Math.max(0, sundays - woUsed);
    for (let i = 0; i < unusedWOs; i++) {
      rows.push({
        staff_id: s.id,
        earned,
        expiry,
        used: false,
        reason,
      });
    }
  }

  return rows;
}

export interface CompOffReconcileResult {
  toAdd: Omit<CompOff, 'id'>[];
  toRemoveIds: string[];
  toUpdate: { id: string; expiry: string }[];
}

/** Auto-sync comp offs from unused weekly offs — no manual crediting needed */
export function reconcileCompOffCredits(
  staffList: StaffMember[],
  leaveRecs: LeaveRecord[],
  compOffs: CompOff[],
  asOf: Date = new Date(),
): CompOffReconcileResult {
  const { year: endYear, month: endMonth } = lastCompleteWeeklyOffMonth(asOf);
  const toAdd: Omit<CompOff, 'id'>[] = [];
  const toRemoveIds: string[] = [];
  const toUpdate: { id: string; expiry: string }[] = [];

  for (const s of staffList) {
    for (const { year, month } of monthsFromDojThrough(s.doj, endYear, endMonth)) {
      const earned = compOffEarnedDate(year, month);
      const expiry = compOffExpiryDate(year, month);
      const reason = compOffReason(year, month);
      const expected = buildMonthlyCompOffRows([s], leaveRecs, year, month).length;
      const existing = compOffs.filter(
        (c) => c.staff_id === s.id && c.earned === earned && c.reason === reason,
      );

      for (const c of existing) {
        if (c.expiry !== expiry) toUpdate.push({ id: c.id, expiry });
      }

      const unused = existing.filter((c) => !c.used);
      if (existing.length > expected) {
        const excess = existing.length - expected;
        toRemoveIds.push(...unused.slice(-excess).map((c) => c.id));
      }

      const removedHere = unused.slice(-Math.max(0, existing.length - expected)).map((c) => c.id);
      const remaining = existing.length - removedHere.length;
      if (remaining < expected) {
        for (let i = 0; i < expected - remaining; i++) {
          toAdd.push({ staff_id: s.id, earned, expiry, used: false, reason });
        }
      }
    }
  }

  return { toAdd, toRemoveIds, toUpdate };
}

export function getCompOffsToConsume(
  staffId: string,
  count: number,
  compOffs: CompOff[],
  asOf: Date = new Date(),
): string[] {
  const today = formatDateLocal(asOf);
  return compOffs
    .filter((c) => c.staff_id === staffId && !c.used && c.expiry >= today)
    .sort((a, b) => a.earned.localeCompare(b.earned))
    .slice(0, count)
    .map((c) => c.id);
}

export function getDishCost(
  dishId: string,
  directCosts: Record<string, number>,
  recipes: Record<string, RecipeLine[]>,
  ingredients: Ingredient[],
): number {
  if (directCosts[dishId] != null) return directCosts[dishId];
  return (recipes[dishId] || []).reduce((sum, r) => {
    const ing = ingredients.find((x) => x.id === r.ingredient_id);
    return sum + (ing ? (r.grams / 1000) * ing.price : 0);
  }, 0);
}

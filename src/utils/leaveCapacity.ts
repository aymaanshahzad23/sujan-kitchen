import type { CampId, Guest, KotType, StaffMember } from '../types/database';
import { eachDateInRange } from './helpers';
import type { LeaveRecord } from '../types/database';
import {
  leaveCoversDate,
  leaveRangesOverlap,
  staffOnLeaveOnDate,
} from './leave';

export const MAX_CONCURRENT_LEAVE = 2;

export interface LeaveCapacityDay {
  date: string;
  staff: StaffMember[];
}

/** Peak concurrent absences across a date range (optionally including a new applicant). */
export function peakStaffLeaveDays(
  fromDate: string,
  toDate: string,
  leaveRecs: LeaveRecord[],
  allStaff: StaffMember[],
  campId: CampId,
  options?: { excludeLeaveId?: string; includeStaffId?: string },
): LeaveCapacityDay[] {
  const overloaded: LeaveCapacityDay[] = [];

  for (const dt of eachDateInRange(fromDate, toDate || fromDate)) {
    const onLeave = staffOnLeaveOnDate(dt, leaveRecs, allStaff, campId, {
      excludeLeaveId: options?.excludeLeaveId,
    });
    const ids = new Set(onLeave.map((s) => s.id));
    if (options?.includeStaffId) {
      const applicant = allStaff.find((s) => s.id === options.includeStaffId);
      if (applicant && applicant.camp_id === campId) ids.add(applicant.id);
    }
    const staff = [...ids]
      .map((id) => allStaff.find((s) => s.id === id)!)
      .filter(Boolean);
    if (staff.length > MAX_CONCURRENT_LEAVE) {
      overloaded.push({ date: dt, staff });
    }
  }

  return overloaded;
}

export function leaveRecordOverloadDays(
  record: LeaveRecord,
  leaveRecs: LeaveRecord[],
  allStaff: StaffMember[],
  campId: CampId,
): LeaveCapacityDay[] {
  if (record.status === 'rejected') return [];
  return peakStaffLeaveDays(
    record.date_from,
    record.date_to || record.date_from,
    leaveRecs,
    allStaff,
    campId,
    { includeStaffId: record.staff_id },
  );
}

export function buildGuestKotInput(
  guest: Guest,
  input: {
    dish_id: string;
    date: string;
    qty: number;
    revenue: number;
    type?: KotType;
  },
) {
  if (guest.status !== 'in-house') {
    throw new Error(`${guest.name} is not in-house. Cannot punch a guest order.`);
  }
  if (!guest.tent?.trim()) {
    throw new Error(`${guest.name} has no tent assigned. Update the guest profile first.`);
  }

  return {
    dish_id: input.dish_id,
    date: input.date,
    qty: input.qty,
    type: input.type ?? ('Guest' as KotType),
    revenue: input.revenue,
    tent: guest.tent.trim(),
    guest_id: guest.id,
  };
}

export { leaveRangesOverlap, leaveCoversDate };

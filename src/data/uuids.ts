import type { CampId } from '../types/database';

export function ingrUuid(legacyId: number): string {
  return `00001001-0000-4000-8000-${String(legacyId).padStart(12, '0')}`;
}

export function dishUuid(camp: CampId, legacyId: number): string {
  const campCode = { jawai: '01', sherbagh: '02', serai: '03' }[camp];
  return `0000${campCode}01-0000-4000-8000-${String(legacyId).padStart(12, '0')}`;
}

export function staffUuid(legacyId: number): string {
  return `00002001-0000-4000-8000-${String(legacyId).padStart(12, '0')}`;
}

export function holidayUuid(legacyId: number): string {
  return `00003001-0000-4000-8000-${String(legacyId).padStart(12, '0')}`;
}

export function guestUuid(legacyId: number): string {
  return `00004001-0000-4000-8000-${String(legacyId).padStart(12, '0')}`;
}

export function profileUuid(legacyId: number): string {
  return `00004101-0000-4000-8000-${String(legacyId).padStart(12, '0')}`;
}

export function leaveUuid(legacyId: number): string {
  return `00004201-0000-4000-8000-${String(legacyId).padStart(12, '0')}`;
}

export function complaintUuid(legacyId: number): string {
  return `00004301-0000-4000-8000-${String(legacyId).padStart(12, '0')}`;
}

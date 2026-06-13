import type { CampId, Guest } from '../types/database';

const ACTIVE_GUEST_STATUSES = ['in-house', 'expected'] as const;

export function normalizeGuestToken(...parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => (p || '').trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('|');
}

export function normalizeTent(tent: string | null | undefined): string {
  return (tent || '').trim().toLowerCase().replace(/^tent\s*/i, '').replace(/\s+/g, ' ');
}

/** Stable identity across visits — name + phone only (tent may change on return). */
export function buildProfileKey(name: string, phone: string): string {
  return normalizeGuestToken(name, phone);
}

/** Unique stay instance — tent + name + phone. */
export function buildStayKey(tent: string, name: string, phone: string): string {
  return normalizeGuestToken(normalizeTent(tent), name, phone);
}

export function guestCoversDate(guest: Guest, date: string): boolean {
  const checkIn = guest.check_in || date;
  const checkOut = guest.check_out || '9999-12-31';
  return date >= checkIn && date <= checkOut;
}

export function findReturningGuestProfile(
  name: string,
  phone: string,
  guests: Guest[],
  campId: CampId,
): Guest | null {
  const profileKey = buildProfileKey(name, phone);
  const matches = guests
    .filter((g) => g.camp_id === campId && g.profile_key === profileKey)
    .sort((a, b) => (b.check_in || '').localeCompare(a.check_in || ''));
  return matches[0] || null;
}

export function findActiveStayConflict(
  tent: string,
  name: string,
  phone: string,
  guests: Guest[],
  campId: CampId,
  excludeGuestId?: string,
): Guest | null {
  const stayKey = buildStayKey(tent, name, phone);
  return (
    guests.find(
      (g) =>
        g.camp_id === campId &&
        g.id !== excludeGuestId &&
        ACTIVE_GUEST_STATUSES.includes(g.status as (typeof ACTIVE_GUEST_STATUSES)[number]) &&
        g.stay_key === stayKey,
    ) || null
  );
}

export function findTentOccupant(
  tent: string,
  guests: Guest[],
  campId: CampId,
  excludeGuestId?: string,
): Guest | null {
  const norm = normalizeTent(tent);
  return (
    guests.find(
      (g) =>
        g.camp_id === campId &&
        g.id !== excludeGuestId &&
        ACTIVE_GUEST_STATUSES.includes(g.status as (typeof ACTIVE_GUEST_STATUSES)[number]) &&
        normalizeTent(g.tent) === norm,
    ) || null
  );
}

export function resolveInHouseGuestForTent(
  tent: string,
  date: string,
  guests: Guest[],
  campId: CampId,
): Guest | null {
  const norm = normalizeTent(tent);
  return (
    guests.find(
      (g) =>
        g.camp_id === campId &&
        g.status === 'in-house' &&
        normalizeTent(g.tent) === norm &&
        guestCoversDate(g, date),
    ) || null
  );
}

export interface GuestRegistrationInput {
  campId: CampId;
  name: string;
  tent: string;
  phone: string;
  guests: Guest[];
  excludeGuestId?: string;
}

export function validateGuestRegistration(input: GuestRegistrationInput): string | null {
  const name = input.name.trim();
  const tent = input.tent.trim();
  const phone = input.phone.trim();

  if (!name) return 'Guest name is required.';
  if (!tent) return 'Tent / room is required.';
  if (!phone) return 'Phone number is required for guest identification.';

  const stayConflict = findActiveStayConflict(
    tent,
    name,
    phone,
    input.guests,
    input.campId,
    input.excludeGuestId,
  );
  if (stayConflict) {
    return `This guest (${name}, ${phone}, Tent ${tent}) already has an active stay at this camp.`;
  }

  const tentConflict = findTentOccupant(tent, input.guests, input.campId, input.excludeGuestId);
  if (tentConflict && buildStayKey(tent, name, phone) !== tentConflict.stay_key) {
    return `Tent ${tent} is already assigned to ${tentConflict.name}. Check them out before registering another guest.`;
  }

  return null;
}

export function prepareGuestIdentity(
  name: string,
  tent: string,
  phone: string,
  guests: Guest[],
  campId: CampId,
): { profile_id: string; profile_key: string; stay_key: string; returning: Guest | null } {
  const returning = findReturningGuestProfile(name, phone, guests, campId);
  return {
    profile_id: returning?.profile_id || crypto.randomUUID(),
    profile_key: buildProfileKey(name, phone),
    stay_key: buildStayKey(tent, name, phone),
    returning,
  };
}

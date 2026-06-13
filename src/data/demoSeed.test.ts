import { describe, expect, it } from 'vitest';
import type { Guest } from '../types/database';
import {
  formatReturningVisitLabel,
  getStayVisitNumber,
  isReturningGuest,
} from '../utils/guests';
import {
  DEMO_GUESTS,
  guestProfileKey,
  guestProfileRowId,
  guestRowId,
  guestStayKey,
  validateDemoGuestProfiles,
} from './demoSeed';

function toGuest(row: (typeof DEMO_GUESTS)[number]): Guest {
  return {
    id: guestRowId(row.id),
    camp_id: row.camp,
    reg_no: row.regNo,
    name: row.name,
    phone: row.phone,
    profile_id: guestProfileRowId(row.profileId),
    profile_key: guestProfileKey(row),
    stay_key: guestStayKey(row),
    nationality: row.nationality,
    tent: row.tent,
    check_in: row.checkIn,
    check_out: row.checkOut,
    food_pref: row.foodPref,
    allergies: row.allergies || null,
    diet_notes: row.dietNotes || null,
    experiences: row.experiences || null,
    feedback: row.feedback || null,
    chef_notes: row.chefNotes || null,
    status: row.status,
  };
}

describe('validateDemoGuestProfiles', () => {
  it('has no returning-guest data inconsistencies', () => {
    expect(validateDemoGuestProfiles()).toEqual([]);
  });
});

describe('returning guest visit ordinals', () => {
  const allGuests = DEMO_GUESTS.map(toGuest);

  const returningProfiles = [
    { camp: 'jawai' as const, profileId: 1, expectedActive: 2 },
    { camp: 'jawai' as const, profileId: 2, expectedActive: 3 },
    { camp: 'sherbagh' as const, profileId: 21, expectedActive: 2 },
    { camp: 'serai' as const, profileId: 31, expectedActive: 2 },
  ];

  it.each(returningProfiles)(
    'flags $camp profile $profileId active stay as $expectedActive visit',
    ({ camp, profileId, expectedActive }) => {
      const stays = DEMO_GUESTS.filter((g) => g.camp === camp && g.profileId === profileId);
      const active = stays.find((s) => s.status === 'in-house' || s.status === 'expected');
      expect(active).toBeDefined();

      const guest = toGuest(active!);
      const campGuests = allGuests.filter((g) => g.camp_id === camp);
      const history = campGuests.filter((g) => g.profile_key === guest.profile_key);

      expect(isReturningGuest(history)).toBe(true);
      expect(getStayVisitNumber(guest, campGuests, camp)).toBe(expectedActive);
      expect(formatReturningVisitLabel(expectedActive)).toBe(
        expectedActive === 2 ? '2nd visit' : expectedActive === 3 ? '3rd visit' : `${expectedActive}th visit`,
      );
    },
  );
});

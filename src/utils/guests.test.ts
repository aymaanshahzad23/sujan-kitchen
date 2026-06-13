import { describe, expect, it } from 'vitest';
import type { Guest } from '../types/database';
import {
  buildProfileKey,
  buildStayKey,
  findReturningGuestProfile,
  resolveInHouseGuestForTent,
  validateGuestRegistration,
} from './guests';

const baseGuest = (overrides: Partial<Guest>): Guest => ({
  id: 'g1',
  camp_id: 'jawai',
  reg_no: null,
  name: 'Jane Doe',
  phone: '+91 9876543210',
  profile_id: 'profile-1',
  profile_key: buildProfileKey('Jane Doe', '+91 9876543210'),
  stay_key: buildStayKey('Tent 7', 'Jane Doe', '+91 9876543210'),
  nationality: null,
  tent: 'Tent 7',
  check_in: '2024-06-01',
  check_out: '2024-06-10',
  food_pref: 'vegetarian',
  allergies: 'Nuts',
  diet_notes: 'No spicy',
  experiences: null,
  feedback: null,
  chef_notes: null,
  status: 'in-house',
  ...overrides,
});

describe('guest identity keys', () => {
  it('builds stable profile key from name + phone', () => {
    expect(buildProfileKey('Jane Doe', '+91 9876543210')).toBe('jane doe|+91 9876543210');
    expect(buildStayKey('Tent 7', 'Jane Doe', '+91 9876543210')).toContain('7|jane doe');
  });

  it('detects returning guests by name + phone', () => {
    const prior = baseGuest({ id: 'old', status: 'checked-out', check_out: '2024-01-10' });
    const found = findReturningGuestProfile('Jane Doe', '+91 9876543210', [prior], 'jawai');
    expect(found?.id).toBe('old');
  });
});

describe('validateGuestRegistration', () => {
  it('rejects duplicate active stay for tent+name+phone', () => {
    const active = baseGuest({});
    const err = validateGuestRegistration({
      campId: 'jawai',
      name: 'Jane Doe',
      tent: 'Tent 7',
      phone: '+91 9876543210',
      guests: [active],
    });
    expect(err).toMatch(/already has an active stay/);
  });

  it('rejects when tent is occupied by another guest', () => {
    const active = baseGuest({
      name: 'John Smith',
      phone: '+91 1111111111',
      stay_key: buildStayKey('Tent 7', 'John Smith', '+91 1111111111'),
      profile_key: buildProfileKey('John Smith', '+91 1111111111'),
    });
    const err = validateGuestRegistration({
      campId: 'jawai',
      name: 'Jane Doe',
      tent: 'Tent 7',
      phone: '+91 9876543210',
      guests: [active],
    });
    expect(err).toMatch(/already assigned to John Smith/);
  });
});

describe('resolveInHouseGuestForTent', () => {
  it('maps tent + date to current in-house guest', () => {
    const guest = baseGuest({});
    const resolved = resolveInHouseGuestForTent('Tent 7', '2024-06-05', [guest], 'jawai');
    expect(resolved?.name).toBe('Jane Doe');
  });
});

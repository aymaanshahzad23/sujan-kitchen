import { describe, expect, it } from 'vitest';
import type { CompOff, LeaveRecord, StaffMember } from '../types/database';
import {
  buildMonthlyCompOffRows,
  staffOnLeaveOnDate,
  compOffEarnedDate,
  compOffExpiryDate,
  computeAccruedLeave,
  countTypeDaysInMonth,
  getActiveCompOffCount,
  getCompOffsToConsume,
  getLeaveBalance,
  getWeeklyOffCredit,
  monthsCreditedSinceDoj,
  overlapDays,
  reconcileCompOffCredits,
  validateLeaveApplication,
} from './leave';

const staff: StaffMember = {
  id: 'staff-1',
  camp_id: 'jawai',
  name: 'Test Chef',
  designation: 'Chef de Partie',
  section: 'Kitchen General',
  doj: '2020-01-01',
  phone: null,
  email: null,
  init_pl: 18,
  init_cl: 5,
  init_ml: 7,
};

describe('leave accrual from DOJ', () => {
  it('credits PL/CL monthly from date of joining', () => {
    expect(monthsCreditedSinceDoj('2022-06-01', 2024, 5)).toBe(24);
    const { cPL, cCL } = computeAccruedLeave('2022-06-01', 2024, 5);
    expect(cPL).toBe(18);
    expect(cCL).toBe(5);
  });

  it('caps PL at 18 and CL at 5 annually', () => {
    const { cPL, cCL } = computeAccruedLeave('2020-01-01', 2024, 5);
    expect(cPL).toBe(18);
    expect(cCL).toBe(5);
  });

  it('gives zero accrual before DOJ month', () => {
    expect(monthsCreditedSinceDoj('2024-08-01', 2024, 5)).toBe(0);
    const { cPL, cML } = computeAccruedLeave('2024-08-01', 2024, 5);
    expect(cPL).toBe(0);
    expect(cML).toBe(0);
  });

  it('gives ML 7 once employed in calendar year', () => {
    expect(computeAccruedLeave('2024-03-15', 2024, 5).cML).toBe(7);
    expect(computeAccruedLeave('2024-08-01', 2024, 5).cML).toBe(0);
  });
});

describe('weekly off balance', () => {
  it('credits WO equal to Sundays in month (June 2024 has 5)', () => {
    expect(getWeeklyOffCredit(2024, 5)).toBe(5);
  });

  it('deducts approved WO leave from monthly balance', () => {
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-1',
        type: 'WO',
        date_from: '2024-06-02',
        date_to: '2024-06-02',
        note: '',
        status: 'approved',
        splits: null,
      },
      {
        id: 'l2',
        staff_id: 'staff-1',
        type: 'WO',
        date_from: '2024-06-09',
        date_to: '2024-06-09',
        note: '',
        status: 'approved',
        splits: null,
      },
    ];
    const bal = getLeaveBalance(staff, leaves, [], { year: 2024, month: 5 });
    expect(bal.cWO).toBe(5);
    expect(bal.usedWO).toBe(2);
    expect(bal.remWO).toBe(3);
  });

  it('does not deduct PL leave from weekly off balance', () => {
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-1',
        type: 'PL',
        date_from: '2024-06-03',
        date_to: '2024-06-03',
        note: '',
        status: 'approved',
        splits: null,
      },
    ];
    const bal = getLeaveBalance(staff, leaves, [], { year: 2024, month: 5 });
    expect(bal.usedWO).toBe(0);
    expect(bal.remWO).toBe(5);
  });
});

describe('validateLeaveApplication', () => {
  it('rejects WO when monthly balance exhausted', () => {
    const leaves: LeaveRecord[] = Array.from({ length: 5 }, (_, i) => ({
      id: `l${i}`,
      staff_id: 'staff-1',
      type: 'WO',
      date_from: `2024-06-${String(2 + i * 7).padStart(2, '0')}`,
      date_to: `2024-06-${String(2 + i * 7).padStart(2, '0')}`,
      note: '',
      status: 'approved' as const,
      splits: null,
    }));

    const err = validateLeaveApplication(
      staff,
      '2024-06-16',
      '2024-06-16',
      [],
      'WO',
      leaves,
      [],
      [staff],
      { year: 2024, month: 5 },
    );
    expect(err).toMatch(/Insufficient Weekly Off/);
  });

  it('allows explicit Comp Off when balance exists', () => {
    const compOffs: CompOff[] = [
      {
        id: 'co1',
        staff_id: 'staff-1',
        earned: '2024-06-01',
        expiry: '2027-08-01',
        used: false,
        reason: 'test',
      },
    ];
    const err = validateLeaveApplication(
      staff,
      '2024-06-10',
      '2024-06-10',
      [],
      'CO',
      [],
      compOffs,
      [staff],
      { year: 2024, month: 5 },
    );
    expect(err).toBeNull();
  });

  it('blocks a third staff member when two are already on leave the same day', () => {
    const staffA: StaffMember = { ...staff, id: 'staff-a', name: 'Ramesh', designation: 'Executive Chef' };
    const staffB: StaffMember = { ...staff, id: 'staff-b', name: 'Priya', designation: 'Kitchen Helper' };
    const staffC: StaffMember = { ...staff, id: 'staff-c', name: 'Anil', designation: 'Steward' };
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-a',
        type: 'PL',
        date_from: '2024-06-10',
        date_to: '2024-06-10',
        note: '',
        status: 'approved',
        splits: null,
      },
      {
        id: 'l2',
        staff_id: 'staff-b',
        type: 'CL',
        date_from: '2024-06-10',
        date_to: '2024-06-10',
        note: '',
        status: 'pending',
        splits: null,
      },
    ];

    const err = validateLeaveApplication(
      staffC,
      '2024-06-10',
      '2024-06-10',
      [],
      'PL',
      leaves,
      [],
      [staffA, staffB, staffC],
      { year: 2024, month: 5 },
    );
    expect(err).toMatch(/Cannot proceed:.*staff would be on leave/);
    expect(err).toMatch(/Ramesh/);
    expect(err).toMatch(/Priya/);
  });

  it('blocks overlapping leave for the same staff member', () => {
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-1',
        type: 'PL',
        date_from: '2024-06-10',
        date_to: '2024-06-12',
        note: '',
        status: 'approved',
        splits: null,
      },
    ];

    const err = validateLeaveApplication(
      staff,
      '2024-06-11',
      '2024-06-11',
      [],
      'CL',
      leaves,
      [],
      [staff],
      { year: 2024, month: 5 },
    );
    expect(err).toMatch(/already exists for this staff member/);
  });

  it('does not count staff from other camps toward the limit', () => {
    const jawaiStaff: StaffMember = { ...staff, id: 'staff-j', camp_id: 'jawai', name: 'Jawai Staff' };
    const sherbaghA: StaffMember = {
      ...staff,
      id: 'staff-s1',
      camp_id: 'sherbagh',
      name: 'Sherbagh Staff 1',
    };
    const sherbaghB: StaffMember = {
      ...staff,
      id: 'staff-s2',
      camp_id: 'sherbagh',
      name: 'Sherbagh Staff 2',
    };
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-s1',
        type: 'PL',
        date_from: '2024-06-10',
        date_to: '2024-06-10',
        note: '',
        status: 'approved',
        splits: null,
      },
      {
        id: 'l2',
        staff_id: 'staff-s2',
        type: 'CL',
        date_from: '2024-06-10',
        date_to: '2024-06-10',
        note: '',
        status: 'approved',
        splits: null,
      },
    ];

    const err = validateLeaveApplication(
      jawaiStaff,
      '2024-06-10',
      '2024-06-10',
      [],
      'PL',
      leaves,
      [],
      [jawaiStaff, sherbaghA, sherbaghB],
      { year: 2024, month: 5 },
    );
    expect(err).toBeNull();
  });
});

describe('staffOnLeaveOnDate', () => {
  it('returns unique staff on leave for a camp', () => {
    const staffA: StaffMember = { ...staff, id: 'staff-a', name: 'Ramesh' };
    const staffB: StaffMember = { ...staff, id: 'staff-b', name: 'Priya', designation: 'Kitchen Helper' };
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-a',
        type: 'PL',
        date_from: '2024-06-10',
        date_to: '2024-06-12',
        note: '',
        status: 'approved',
        splits: null,
      },
      {
        id: 'l2',
        staff_id: 'staff-b',
        type: 'CL',
        date_from: '2024-06-11',
        date_to: '2024-06-11',
        note: '',
        status: 'pending',
        splits: null,
      },
    ];

    expect(staffOnLeaveOnDate('2024-06-11', leaves, [staffA, staffB], 'jawai').map((c) => c.name)).toEqual([
      'Ramesh',
      'Priya',
    ]);
  });
});

describe('monthly comp off conversion', () => {
  it('credits unused WOs from prior month', () => {
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-1',
        type: 'WO',
        date_from: '2024-05-05',
        date_to: '2024-05-05',
        note: '',
        status: 'approved',
        splits: null,
      },
    ];
    const rows = buildMonthlyCompOffRows([staff], leaves, 2024, 4);
    expect(rows).toHaveLength(3);
    expect(rows[0].earned).toBe('2024-06-01');
    expect(rows[0].expiry).toBe('2024-06-30');
  });

  it('expiry counts 60 days from WO month start, not CO credit date', () => {
    expect(compOffExpiryDate(2024, 4)).toBe('2024-06-30');
    expect(compOffEarnedDate(2024, 4)).toBe('2024-06-01');
  });
});

describe('comp off expiry helpers', () => {
  it('auto-reconciles missing comp offs from unused weekly offs', () => {
    const recentStaff: StaffMember = { ...staff, doj: '2024-05-01' };
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-1',
        type: 'WO',
        date_from: '2024-05-05',
        date_to: '2024-05-05',
        note: '',
        status: 'approved',
        splits: null,
      },
    ];
    const { toAdd } = reconcileCompOffCredits([recentStaff], leaves, [], new Date('2024-06-15'));
    expect(toAdd).toHaveLength(3);
    expect(toAdd[0].earned).toBe('2024-06-01');
    expect(toAdd[0].expiry).toBe('2024-06-30');
  });

  it('counts only non-expired unused comp offs', () => {
    const compOffs: CompOff[] = [
      { id: '1', staff_id: 'staff-1', earned: '2024-01-01', expiry: '2024-02-01', used: false, reason: '' },
      { id: '2', staff_id: 'staff-1', earned: '2024-06-01', expiry: '2024-08-01', used: false, reason: '' },
    ];
    expect(getActiveCompOffCount('staff-1', compOffs, new Date('2024-06-15'))).toBe(1);
  });

  it('selects oldest comp offs first for consumption', () => {
    const compOffs: CompOff[] = [
      { id: 'new', staff_id: 'staff-1', earned: '2024-06-01', expiry: '2024-08-01', used: false, reason: '' },
      { id: 'old', staff_id: 'staff-1', earned: '2024-05-01', expiry: '2024-07-01', used: false, reason: '' },
    ];
    expect(getCompOffsToConsume('staff-1', 1, compOffs, new Date('2024-06-15'))).toEqual(['old']);
  });
});

describe('public holiday leave', () => {
  const holidays = [
    { date: '2024-08-15', name: 'Independence Day' },
    { date: '2024-10-02', name: 'Gandhi Jayanti' },
  ];

  it('credits PH on each holiday date in the calendar year', () => {
    const bal = getLeaveBalance(staff, [], [], { year: 2024, month: 7 }, holidays);
    expect(bal.cPH).toBe(1);
    expect(bal.remPH).toBe(1);
  });

  it('does not credit PH before date of joining', () => {
    const recent: StaffMember = { ...staff, doj: '2024-09-01' };
    const bal = getLeaveBalance(recent, [], [], { year: 2024, month: 7 }, holidays);
    expect(bal.cPH).toBe(0);
  });

  it('resets PH balance by calendar year', () => {
    const bal = getLeaveBalance(staff, [], [], { year: 2025, month: 0 }, holidays);
    expect(bal.cPH).toBe(0);
    expect(bal.remPH).toBe(0);
  });

  it('deducts 1 PH and 1 CL when leave is taken on a public holiday', () => {
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-1',
        type: 'PL',
        date_from: '2024-08-15',
        date_to: '2024-08-15',
        note: '',
        status: 'approved',
        splits: null,
      },
    ];
    const bal = getLeaveBalance(staff, leaves, [], { year: 2024, month: 7 }, holidays);
    expect(bal.usedPH).toBe(1);
    expect(bal.remPH).toBe(0);
    expect(bal.usedCL).toBe(1);
    expect(bal.remCL).toBeCloseTo(4, 1);
  });

  it('requires PH and CL when booking leave on a public holiday', () => {
    const err = validateLeaveApplication(
      staff,
      '2024-08-15',
      '2024-08-15',
      [],
      'PL',
      [],
      [],
      [staff],
      { year: 2024, month: 7 },
      holidays,
    );
    expect(err).toBeNull();
  });

  it('blocks public holiday leave when PH or CL balance is insufficient', () => {
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-1',
        type: 'CL',
        date_from: '2024-08-01',
        date_to: '2024-08-05',
        note: '',
        status: 'approved',
        splits: null,
      },
    ];
    const err = validateLeaveApplication(
      staff,
      '2024-08-15',
      '2024-08-15',
      [],
      'PL',
      leaves,
      [],
      [staff],
      { year: 2024, month: 7 },
      holidays,
    );
    expect(err).toMatch(/Casual Leave/);
  });
});

describe('overlapDays', () => {
  it('counts intersection of ranges', () => {
    expect(overlapDays('2024-06-10', '2024-06-20', '2024-06-01', '2024-06-15')).toBe(6);
  });
});

describe('countTypeDaysInMonth', () => {
  it('counts WO days from split leave', () => {
    const leaves: LeaveRecord[] = [
      {
        id: 'l1',
        staff_id: 'staff-1',
        type: 'MULTI',
        date_from: '2024-06-03',
        date_to: '2024-06-05',
        note: '',
        status: 'approved',
        splits: [
          { type: 'WO', days: 2 },
          { type: 'PL', days: 1 },
        ],
      },
    ];
    expect(countTypeDaysInMonth('staff-1', 'WO', leaves, 2024, 5)).toBe(2);
  });
});

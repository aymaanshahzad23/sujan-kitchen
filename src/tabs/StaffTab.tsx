import { useMemo, useState, type ReactNode } from 'react';
import { useAppData } from '../context/AppContext';
import {
  BLU,
  DESIGNATIONS,
  DAY_NAMES,
  GRN,
  GRNL,
  LEAVE_TYPES,
  MONTH_NAMES,
  MUT,
  ORA,
  ORAL,
  PR,
  PUR,
  PURL,
  RED,
  REDL,
  SECTIONS_STAFF,
  CAMP_NAMES,
} from '../constants';
import { getLeaveBalance, validateLeaveApplication, validateStaffLeaveConflicts, staffOnLeaveOnDate, leaveTypeOptions, getCompOffsToConsume, countCoDaysInSplits, buildLeaveSplits } from '../utils/leave';
import { leaveRecordOverloadDays, MAX_CONCURRENT_LEAVE } from '../utils/leaveCapacity';
import { addDays, formatDateLocal, getDaysInMonth, getMonthDates, getSundaysInMonth, parseDateLocal } from '../utils/helpers';
import type { CompOff, LeaveRecord, LeaveSplit, LeaveStatus, StaffMember } from '../types/database';

import type { StaffSubTab } from '../constants';

const floor1 = (n: number) => Math.floor(n * 10) / 10;

const LEAVE_TYPE_OPTIONS = leaveTypeOptions();

type StaffSub = 'roster' | 'leaves' | 'calendar' | 'schedule' | 'holidays';

const STAFF_TAB_TO_SUB: Record<StaffSubTab, StaffSub> = {
  'staff-roster': 'roster',
  'staff-leaves': 'leaves',
  'staff-calendar': 'calendar',
  'staff-schedule': 'schedule',
  'staff-holidays': 'holidays',
};

function LeaveTypeDisplay({ leave }: { leave: LeaveRecord }) {
  const lt = LEAVE_TYPES[leave.type] || { label: leave.type, color: MUT };
  if (leave.splits) {
    return (
      <>
        {leave.splits.map((sp, i) => {
          const slt = LEAVE_TYPES[sp.type] || { color: MUT, label: sp.type };
          return (
            <span key={i} style={{ display: 'inline-block', marginRight: 4, color: slt.color, fontStyle: 'italic', fontSize: 11 }}>
              {sp.days}d {slt.label}
            </span>
          );
        })}
      </>
    );
  }
  return <span style={{ color: lt.color, fontStyle: 'italic', fontSize: 11 }}>{lt.label}</span>;
}

function BalancePanel({
  staffMember,
  leaveRecords,
  compOffs,
  fromDate,
  toDate,
  lvType,
  lvSplits,
  showSplitSummary,
  yearMonth,
}: {
  staffMember: StaffMember;
  leaveRecords: LeaveRecord[];
  compOffs: CompOff[];
  fromDate: string;
  toDate: string;
  lvType: string;
  lvSplits: LeaveSplit[];
  showSplitSummary?: boolean;
  yearMonth: { year: number; month: number };
}) {
  const b = getLeaveBalance(staffMember, leaveRecords, compOffs, yearMonth);
  const fromD = fromDate ? new Date(fromDate) : null;
  const toD = toDate ? new Date(toDate) : fromD;
  const totalDays = fromD && toD ? Math.max(0, Math.round((toD.getTime() - fromD.getTime()) / 86400000) + 1) : 0;

  return (
    <div style={{ background: '#f7f4f0', border: '1px solid #d9cdb8', borderRadius: 3, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
      <div style={{ fontWeight: 500, color: PR, marginBottom: 6 }}>{staffMember.name} — Current Leave Balance</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {([
          ['WO', b.remWO, b.cWO, 'Weekly Off'],
          ['PL', b.remPL, b.cPL, 'Privilege'],
          ['CL', b.remCL, b.cCL, 'Casual'],
          ['ML', b.remML, b.cML, 'Medical'],
          ['CO', b.avCO, b.avCO, 'Comp Off'],
        ] as const).map(([k, rem, tot, lbl]) => (
          <div key={k} style={{ textAlign: 'center', minWidth: 70 }}>
            <div style={{ fontSize: 10, color: MUT, fontStyle: 'italic' }}>{lbl}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: rem > 0 ? GRN : RED }}>{floor1(rem)}</div>
            <div style={{ fontSize: 10, color: MUT }}>of {floor1(tot)} avail.</div>
          </div>
        ))}
        {totalDays > 0 && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: MUT, fontStyle: 'italic' }}>Requested</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: PR }}>
              {totalDays} day{totalDays !== 1 ? 's' : ''}
            </div>
            {showSplitSummary && (
              <div style={{ fontSize: 10, color: MUT }}>
                {lvSplits.length === 0 ? `All as ${lvType}` : lvSplits.map((sp) => `${sp.days}d ${sp.type}`).join(' + ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SplitSection({
  totalDays,
  lvSplits,
  setLvSplits,
  lvSplitType,
  setLvSplitType,
  lvSplitDays,
  setLvSplitDays,
  compact,
}: {
  totalDays: number;
  lvSplits: LeaveSplit[];
  setLvSplits: (fn: (prev: LeaveSplit[]) => LeaveSplit[]) => void;
  lvSplitType: string;
  setLvSplitType: (v: string) => void;
  lvSplitDays: string;
  setLvSplitDays: (v: string) => void;
  compact?: boolean;
}) {
  const splitUsed = lvSplits.reduce((s, x) => s + x.days, 0);
  const remaining = totalDays - splitUsed;

  return (
    <div style={{ background: '#faf8f5', border: '1px solid #e8e2d8', borderRadius: 3, padding: '10px 14px', marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: MUT, marginBottom: 8 }}>
        Combine Leave Types{' '}
        <span style={{ fontWeight: 400, fontStyle: 'italic' }}>
          {compact ? '(optional)' : `(optional — split ${totalDays} days across multiple leave types)`}
        </span>
      </div>
      {lvSplits.length > 0 && (
        <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {lvSplits.map((sp, i) => {
            const lt = LEAVE_TYPES[sp.type] || { color: MUT };
            return (
              <span
                key={i}
                style={{
                  background: `${lt.color}22`,
                  color: lt.color,
                  border: `1px solid ${lt.color}44`,
                  borderRadius: 3,
                  padding: '3px 10px',
                  fontSize: 12,
                }}
              >
                {sp.days}d {sp.type}
                <button
                  type="button"
                  onClick={() => setLvSplits((x) => x.filter((_, j) => j !== i))}
                  style={{ border: 'none', background: 'none', color: RED, cursor: 'pointer', marginLeft: 4, fontSize: 11 }}
                >
                  ✕
                </button>
              </span>
            );
          })}
          <span style={{ fontSize: 11, color: remaining === 0 ? GRN : remaining < 0 ? RED : ORA, alignSelf: 'center' }}>
            {remaining === 0
              ? `✓ All ${totalDays} days allocated`
              : remaining > 0
                ? compact
                  ? `${remaining} day(s) unallocated`
                  : `${remaining} day(s) unallocated (will use primary type)`
                : `${Math.abs(remaining)} day(s) over${compact ? '!' : '-allocated!'}`}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field">
          <label>Type</label>
          <select value={lvSplitType} onChange={(e) => setLvSplitType(e.target.value)} style={{ width: 150 }}>
            {LEAVE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Days</label>
          <input type="number" min={1} max={totalDays} value={lvSplitDays} onChange={(e) => setLvSplitDays(e.target.value)} style={{ width: 70 }} />
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ alignSelf: 'flex-end', padding: '7px 14px' }}
          onClick={() => {
            if (!lvSplitDays || +lvSplitDays < 1) return;
            const existing = lvSplits.find((x) => x.type === lvSplitType);
            if (existing) {
              setLvSplits((x) => x.map((s) => (s.type === lvSplitType ? { ...s, days: s.days + +lvSplitDays } : s)));
            } else {
              setLvSplits((x) => [...x, { type: lvSplitType, days: +lvSplitDays }]);
            }
            setLvSplitDays('');
          }}
        >
          + Add Split
        </button>
        {lvSplits.length > 0 && (
          <button
            type="button"
            className="btn btn-sm"
            style={{ alignSelf: 'flex-end', background: '#eee', color: MUT, padding: '7px 12px' }}
            onClick={() => setLvSplits(() => [])}
          >
            {compact ? 'Clear' : 'Clear Splits'}
          </button>
        )}
      </div>
    </div>
  );
}

function buildCalendarEvents(
  leaveRecords: LeaveRecord[],
  publicHolidays: { date: string; name: string }[],
  staffList: StaffMember[],
  campId: string,
  calYear: number,
  calMonth: number,
): Record<string, { name: string; type: string; status: string }[]> {
  const events: Record<string, { name: string; type: string; status: string }[]> = {};
  const campStaffIds = new Set(staffList.filter((s) => s.camp_id === campId).map((s) => s.id));

  leaveRecords
    .filter((l) => campStaffIds.has(l.staff_id) && (l.status === 'approved' || l.status === 'pending'))
    .forEach((l) => {
      if (!events[l.date_from]) events[l.date_from] = [];
      const s = staffList.find((x) => x.id === l.staff_id);
      events[l.date_from].push({ name: s?.name || '', type: l.type, status: l.status });
      if (l.date_to && l.date_to !== l.date_from) {
        let dk = addDays(l.date_from, 1);
        while (dk <= l.date_to) {
          if (!events[dk]) events[dk] = [];
          events[dk].push({ name: s?.name || '', type: l.type, status: l.status });
          dk = addDays(dk, 1);
        }
      }
    });

  publicHolidays.forEach((ph) => {
    if (!events[ph.date]) events[ph.date] = [];
    events[ph.date].push({ name: ph.name, type: 'PH', status: 'approved' });
  });

  getMonthDates(calYear, calMonth).forEach((d) => {
    const ds = formatDateLocal(d);
    if (d.getDay() === 0) {
      if (!events[ds]) events[ds] = [];
      if (!events[ds].find((e) => e.type === 'WO')) {
        events[ds].push({ name: 'Weekly Off', type: 'WO', status: 'approved' });
      }
    }
  });

  return events;
}

export function StaffTab({ activeTab }: { activeTab: StaffSubTab }) {
  const { campId, staff, allStaff } = useAppData();
  const {
    staff: allStaffMembers,
    leaveRecords,
    compOffs,
    publicHolidays,
    addStaff,
    removeStaff,
    applyLeave,
    updateLeaveStatus,
    deleteLeave,
    markCompOffsUsed,
    addPublicHoliday,
    removePublicHoliday,
  } = staff;

  const staffSub = STAFF_TAB_TO_SUB[activeTab];
  const [selStaff, setSelStaff] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  const [sfName, setSfName] = useState('');
  const [sfDesig, setSfDesig] = useState(DESIGNATIONS[0]);
  const [sfSection, setSfSection] = useState(SECTIONS_STAFF[0]);
  const [sfDoj, setSfDoj] = useState('');
  const [sfPhone, setSfPhone] = useState('');
  const [sfEmail, setSfEmail] = useState('');

  const [lvStaff, setLvStaff] = useState('');
  const [lvType, setLvType] = useState('WO');
  const [lvDate, setLvDate] = useState('');
  const [lvDateTo, setLvDateTo] = useState('');
  const [lvStatus, setLvStatus] = useState<LeaveStatus>('pending');
  const [lvNote, setLvNote] = useState('');
  const [lvSplits, setLvSplits] = useState<LeaveSplit[]>([]);
  const [lvSplitType, setLvSplitType] = useState('WO');
  const [lvSplitDays, setLvSplitDays] = useState('');

  const [phDate, setPhDate] = useState('');
  const [phName, setPhName] = useState('');

  const campStaff = useMemo(
    () => allStaffMembers.filter((s) => s.camp_id === campId),
    [allStaffMembers, campId],
  );

  const campLeaveRecords = useMemo(
    () =>
      leaveRecords.filter((l) => {
        const s = allStaffMembers.find((x) => x.id === l.staff_id);
        return s && s.camp_id === campId;
      }),
    [leaveRecords, allStaffMembers, campId],
  );

  const calEvents = useMemo(
    () => buildCalendarEvents(leaveRecords, publicHolidays, allStaffMembers, campId, calYear, calMonth),
    [leaveRecords, publicHolidays, allStaffMembers, campId, calYear, calMonth],
  );

  const staffLeaveConflict = useMemo(() => {
    if (!lvStaff || !lvDate) return null;
    const s = campStaff.find((x) => x.id === lvStaff);
    if (!s) return null;
    return validateStaffLeaveConflicts(s, lvDate, lvDateTo || lvDate, campLeaveRecords, allStaffMembers);
  }, [lvStaff, lvDate, lvDateTo, campStaff, campLeaveRecords, allStaffMembers]);

  const leaveCapacityViolations = useMemo(() => {
    const bad = campLeaveRecords.flatMap((l) =>
      leaveRecordOverloadDays(l, campLeaveRecords, allStaffMembers, campId).map((d) => ({ leaveId: l.id, ...d })),
    );
    return bad;
  }, [campLeaveRecords, allStaffMembers, campId]);

  const selectedStaffMember = lvStaff ? campStaff.find((x) => x.id === lvStaff) : null;
  const leaveTotalDays =
    lvDate && selectedStaffMember
      ? (() => {
          const fromD = new Date(lvDate);
          const toD = lvDateTo ? new Date(lvDateTo) : fromD;
          return Math.max(0, Math.round((toD.getTime() - fromD.getTime()) / 86400000) + 1);
        })()
      : 0;

  const rosterYearMonth = useMemo(() => ({ year: calYear, month: calMonth }), [calYear, calMonth]);

  const leaveYearMonth = useMemo(() => {
    if (!lvDate) return rosterYearMonth;
    const d = parseDateLocal(lvDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [lvDate, rosterYearMonth]);

  const pendingCount = leaveRecords.filter((l) => l.status === 'pending').length;
  const today = new Date().toISOString().slice(0, 10);

  const consumeCompOffsForLeave = async (record: LeaveRecord) => {
    if (record.status !== 'approved') return;
    const end = record.date_to || record.date_from;
    const totalDays = Math.round(
      (parseDateLocal(end).getTime() - parseDateLocal(record.date_from).getTime()) / 86400000,
    ) + 1;
    const splits = record.splits?.length
      ? record.splits
      : buildLeaveSplits(totalDays, [], record.type);
    const coDays = countCoDaysInSplits(splits);
    if (coDays > 0) {
      const ids = getCompOffsToConsume(record.staff_id, coDays, compOffs, parseDateLocal(record.date_from));
      if (ids.length < coDays) {
        throw new Error(`Not enough active comp offs to cover ${coDays} day(s).`);
      }
      await markCompOffsUsed(ids);
    }
  };

  const handleAddStaff = async () => {
    if (!sfName || !sfDoj) return;
    try {
      await addStaff({
        camp_id: campId,
        name: sfName,
        designation: sfDesig,
        section: sfSection,
        doj: sfDoj,
        phone: sfPhone || null,
        email: sfEmail || null,
        init_pl: 18,
        init_cl: 5,
        init_ml: 7,
      });
      setSfName('');
      setSfDoj('');
      setSfPhone('');
      setSfEmail('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to register staff');
    }
  };

  const handleApplyLeave = async (overrideStatus?: LeaveStatus) => {
    if (!lvStaff || !lvDate) return;
    const s = campStaff.find((x) => x.id === lvStaff);
    if (!s) return;

    const statusToUse = overrideStatus || lvStatus;
    const fromDate = lvDate;
    const toDate = lvDateTo || lvDate;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) {
      alert('To date cannot be before From date.');
      return;
    }
    const totalDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;

    let splits: LeaveSplit[] = [];
    if (lvSplits.length > 0) {
      const splitDaysTotal = lvSplits.reduce((sum, x) => sum + x.days, 0);
      if (splitDaysTotal !== totalDays) {
        alert(`Split days total (${splitDaysTotal}) must equal leave period days (${totalDays}). Please adjust.`);
        return;
      }
      splits = lvSplits;
    } else {
      splits = [{ type: lvType, days: totalDays }];
    }

    const err = validateLeaveApplication(
      s,
      fromDate,
      toDate,
      lvSplits,
      lvType,
      campLeaveRecords,
      compOffs,
      allStaff.allStaff,
      leaveYearMonth,
    );
    if (err) {
      alert(`⚠ ${err}`);
      return;
    }

    const primaryType = splits.length === 1 ? splits[0].type : 'MULTI';

    try {
      await applyLeave({
        staff_id: lvStaff,
        type: primaryType,
        date_from: fromDate,
        date_to: toDate,
        note: lvNote,
        status: statusToUse,
        splits: splits.length > 1 ? splits : undefined,
      });
      if (statusToUse === 'approved') {
        await consumeCompOffsForLeave({
          id: 'pending',
          staff_id: lvStaff,
          type: primaryType,
          date_from: fromDate,
          date_to: toDate,
          note: lvNote,
          status: statusToUse,
          splits: splits.length > 1 ? splits : null,
        });
      }
      setLvStaff('');
      setLvDate('');
      setLvDateTo('');
      setLvNote('');
      setLvSplits([]);
      setLvSplitDays('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to apply leave');
    }
  };

  const handleAddPublicHoliday = async () => {
    if (!phDate || !phName) return;
    try {
      await addPublicHoliday(phDate, phName);
      setPhDate('');
      setPhName('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add holiday');
    }
  };

  const renderLeaveFormFields = (options: { showStatus: boolean }) => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 10, marginBottom: 10 }}>
        <div className="field">
          <label>Staff Member</label>
          <select
            value={lvStaff}
            onChange={(e) => {
              setLvStaff(e.target.value);
              setLvSplits([]);
            }}
          >
            <option value="">Select staff</option>
            {campStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Primary Leave Type</label>
          <select value={lvType} onChange={(e) => setLvType(e.target.value)}>
            {LEAVE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 10, color: MUT, fontStyle: 'italic' }}>Defaults to Weekly Off — choose Comp Off only when intended</span>
        </div>
        <div className="field">
          <label>From Date</label>
          <input type="date" value={lvDate} onChange={(e) => setLvDate(e.target.value)} />
        </div>
        <div className="field">
          <label>To Date</label>
          <input type="date" value={lvDateTo} onChange={(e) => setLvDateTo(e.target.value)} />
        </div>
        {options.showStatus && (
          <div className="field">
            <label>Status</label>
            <select value={lvStatus} onChange={(e) => setLvStatus(e.target.value as LeaveStatus)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
        <div className="field">
          <label>Note</label>
          <input placeholder={options.showStatus ? 'Reason / remarks' : 'e.g. Annual vacation'} value={lvNote} onChange={(e) => setLvNote(e.target.value)} />
        </div>
      </div>

      {selectedStaffMember && (
        <BalancePanel
          staffMember={selectedStaffMember}
          leaveRecords={leaveRecords}
          compOffs={compOffs}
          fromDate={lvDate}
          toDate={lvDateTo}
          lvType={lvType}
          lvSplits={lvSplits}
          showSplitSummary={options.showStatus}
          yearMonth={leaveYearMonth}
        />
      )}

      {staffLeaveConflict && (
        <div className="warn" style={{ marginTop: 10 }}>
          ⚠ {staffLeaveConflict}
        </div>
      )}

      {lvStaff && lvDate && leaveTotalDays > 0 && (
        <SplitSection
          totalDays={leaveTotalDays}
          lvSplits={lvSplits}
          setLvSplits={setLvSplits}
          lvSplitType={lvSplitType}
          setLvSplitType={setLvSplitType}
          lvSplitDays={lvSplitDays}
          setLvSplitDays={setLvSplitDays}
          compact={!options.showStatus}
        />
      )}
    </>
  );

  let subContent: ReactNode = null;

  if (staffSub === 'roster') {
    subContent = (
      <>
        <div className="card" style={{ background: '#faf8f5', border: '1px solid #e8e2d8', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: MUT, marginBottom: 6 }}>Leave Accrual Rules</div>
          <div style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 8 }}>
            All leave balances auto-credit from Date of Joining — no manual allocation at registration.
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
            <span>
              <strong style={{ color: GRN }}>PL:</strong> 18 ÷ 12 = <strong>1.5 days/month</strong> (credited on 1st)
            </span>
            <span>
              <strong style={{ color: BLU }}>CL:</strong> 5 ÷ 12 ≈ <strong>0.42 days/month</strong> (credited on 1st)
            </span>
            <span>
              <strong style={{ color: ORA }}>ML:</strong> <strong>7 days fixed/year</strong>
            </span>
            <span>
              <strong style={{ color: MUT }}>Weekly Off:</strong> Sundays in month — default for day off; unused → <strong>Comp Off</strong> next month
            </span>
            <span>
              <strong style={{ color: PUR }}>Comp Off:</strong> Unused weekly offs auto-credit on 1st of next month — <strong>60 days total</strong> from the WO month (includes time as WO + CO)
            </span>
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Register Staff Member</div>
          <p style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 10 }}>
            PL, CL, ML and Weekly Off balances begin accruing automatically from the date of joining.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 10, marginBottom: 10 }}>
            <div className="field">
              <label>Full Name *</label>
              <input placeholder="e.g. Ramesh Kumar" value={sfName} onChange={(e) => setSfName(e.target.value)} />
            </div>
            <div className="field">
              <label>Designation</label>
              <select value={sfDesig} onChange={(e) => setSfDesig(e.target.value)}>
                {DESIGNATIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Section</label>
              <select value={sfSection} onChange={(e) => setSfSection(e.target.value)}>
                {SECTIONS_STAFF.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Date of Joining *</label>
              <input type="date" value={sfDoj} onChange={(e) => setSfDoj(e.target.value)} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="tel" placeholder="e.g. 9001234567" value={sfPhone} onChange={(e) => setSfPhone(e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="email@sujan.in" value={sfEmail} onChange={(e) => setSfEmail(e.target.value)} />
            </div>
          </div>
          <button type="button" className="btn" onClick={handleAddStaff}>
            Register
          </button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid #e8e2d8',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: PR }}>Staff Roster</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#eee', color: MUT }}
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else setCalMonth((m) => m - 1);
                }}
              >
                ◀
              </button>
              <span style={{ fontSize: 12, color: MUT, fontStyle: 'italic', minWidth: 120, textAlign: 'center' }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#eee', color: MUT }}
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else setCalMonth((m) => m + 1);
                }}
              >
                ▶
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Section</th>
                <th>DOJ</th>
                <th>PL Rem</th>
                <th>CL Rem</th>
                <th>ML Rem</th>
                <th>Weekly Off</th>
                <th>Comp Off</th>
                <th>Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campStaff.map((s) => {
                const b = getLeaveBalance(s, leaveRecords, compOffs, rosterYearMonth);
                return (
                  <tr
                    key={s.id}
                    style={{ cursor: 'pointer', background: selStaff === s.id ? '#faf4ed' : 'transparent' }}
                    onClick={() => setSelStaff(selStaff === s.id ? null : s.id)}
                  >
                    <td style={{ fontWeight: 500, color: PR }}>{s.name}</td>
                    <td>{s.designation}</td>
                    <td style={{ fontSize: 11, color: MUT, fontStyle: 'italic' }}>{s.section}</td>
                    <td>{s.doj}</td>
                    <td>
                      <span style={{ background: b.remPL > 2 ? GRNL : REDL, color: b.remPL > 2 ? GRN : RED, borderRadius: 2, padding: '1px 6px', fontSize: 11 }}>
                        {floor1(b.remPL)}/{floor1(b.cPL)}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: b.remCL > 0 ? GRNL : REDL, color: b.remCL > 0 ? GRN : RED, borderRadius: 2, padding: '1px 6px', fontSize: 11 }}>
                        {floor1(b.remCL)}/{floor1(b.cCL)}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: b.remML > 0 ? GRNL : REDL, color: b.remML > 0 ? GRN : RED, borderRadius: 2, padding: '1px 6px', fontSize: 11 }}>
                        {b.remML}/{b.cML}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: b.remWO > 0 ? '#f2ebe6' : REDL, color: b.remWO > 0 ? MUT : RED, borderRadius: 2, padding: '1px 6px', fontSize: 11 }}>
                        {b.remWO}/{b.cWO}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: b.avCO > 0 ? PURL : ORAL, color: b.avCO > 0 ? PUR : ORA, borderRadius: 2, padding: '1px 6px', fontSize: 11 }}>
                        {b.avCO}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: MUT }}>{s.phone || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-red btn-sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await removeStaff(s.id);
                            if (selStaff === s.id) setSelStaff(null);
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Failed to remove staff');
                          }
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {selStaff && (() => {
          const s = campStaff.find((x) => x.id === selStaff);
          if (!s) return null;
          const lvs = leaveRecords.filter((l) => l.staff_id === s.id).slice(-10).reverse();
          const cos = compOffs.filter((c) => c.staff_id === s.id);
          const coAsOf = new Date(calYear, calMonth + 1, 0);
          return (
            <div className="card" style={{ border: `1px solid ${PR}` }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: PR, marginBottom: 10 }}>{s.name} — Leave History</div>
              {lvs.length === 0 ? (
                <div style={{ fontSize: 12, color: MUT, fontStyle: 'italic' }}>No leaves recorded.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lvs.map((l) => (
                      <tr key={l.id}>
                        <td>{l.date_from}</td>
                        <td>{l.date_to || l.date_from}</td>
                        <td>
                          <LeaveTypeDisplay leave={l} />
                        </td>
                        <td
                          style={{
                            textTransform: 'capitalize',
                            color: l.status === 'approved' ? GRN : l.status === 'pending' ? ORA : RED,
                            fontSize: 11,
                          }}
                        >
                          {l.status}
                        </td>
                        <td style={{ fontSize: 11, color: MUT }}>{l.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {cos.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Comp Offs</div>
                  <table>
                    <thead>
                      <tr>
                        <th>Earned</th>
                        <th>Expiry</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cos.map((c) => (
                        <tr key={c.id}>
                          <td>{c.earned}</td>
                          <td>{c.expiry}</td>
                          <td style={{ fontSize: 11, color: MUT }}>{c.reason}</td>
                          <td style={{ color: c.used ? RED : parseDateLocal(c.expiry) < coAsOf ? RED : GRN, fontSize: 11 }}>
                            {c.used ? 'Used' : parseDateLocal(c.expiry) < coAsOf ? 'Expired' : 'Available'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
      </>
    );
  } else if (staffSub === 'leaves') {
    subContent = (
      <>
        {leaveCapacityViolations.length > 0 && (
          <div className="alert">
            {leaveCapacityViolations.length} day(s) exceed the max {MAX_CONCURRENT_LEAVE} staff on leave rule — review highlighted rows below.
          </div>
        )}
        {pendingCount > 0 && <div className="warn">{pendingCount} leave request(s) pending approval</div>}
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>Apply / Schedule Leave</div>
          {renderLeaveFormFields({ showStatus: true })}
          <div style={{ fontSize: 11, color: ORA, fontStyle: 'italic', marginBottom: 8 }}>
            Note: Max {MAX_CONCURRENT_LEAVE} staff on leave on the same day (not 2 total records). Balance is checked automatically.
          </div>
          <button type="button" className="btn" onClick={() => handleApplyLeave()}>
            Apply Leave
          </button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Designation</th>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Status</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...campLeaveRecords].reverse().map((l) => {
                const s = allStaffMembers.find((x) => x.id === l.staff_id);
                const overload = leaveRecordOverloadDays(l, campLeaveRecords, allStaffMembers, campId);
                const rowBg =
                  overload.length > 0
                    ? REDL
                    : l.status === 'approved'
                      ? GRNL
                      : l.status === 'pending'
                        ? ORAL
                        : REDL;
                return (
                  <tr key={l.id} style={{ background: rowBg }}>
                    <td style={{ fontWeight: 500 }}>{s?.name || '—'}</td>
                    <td style={{ fontSize: 11, color: MUT }}>{s?.designation || ''}</td>
                    <td>{l.date_from}</td>
                    <td>{l.date_to || l.date_from}</td>
                    <td>
                      <LeaveTypeDisplay leave={l} />
                    </td>
                    <td
                      style={{
                        textTransform: 'capitalize',
                        fontWeight: 500,
                        color: l.status === 'approved' ? GRN : l.status === 'pending' ? ORA : RED,
                        fontSize: 11,
                      }}
                    >
                      {l.status}
                    </td>
                    <td style={{ fontSize: 11, color: MUT }}>
                      {l.note || '—'}
                      {overload.length > 0 && (
                        <span style={{ display: 'block', color: RED, fontStyle: 'italic', marginTop: 2 }}>
                          Overload: {overload[0].staff.length} staff on {overload[0].date}
                        </span>
                      )}
                    </td>
                    <td>
                      {l.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="btn btn-green btn-sm"
                            onClick={async () => {
                              try {
                                const staffMember = allStaffMembers.find((x) => x.id === l.staff_id);
                                if (!staffMember) return;
                                const fromD = parseDateLocal(l.date_from);
                                const ym = { year: fromD.getFullYear(), month: fromD.getMonth() };
                                const err = validateLeaveApplication(
                                  staffMember,
                                  l.date_from,
                                  l.date_to || l.date_from,
                                  l.splits || [],
                                  l.type,
                                  campLeaveRecords,
                                  compOffs,
                                  allStaff.allStaff,
                                  ym,
                                  { excludeLeaveId: l.id },
                                );
                                if (err) {
                                  alert(`⚠ ${err}`);
                                  return;
                                }
                                await updateLeaveStatus(l.id, 'approved');
                                await consumeCompOffsForLeave({ ...l, status: 'approved' });
                              } catch (e) {
                                alert(e instanceof Error ? e.message : 'Failed to approve');
                              }
                            }}
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            className="btn btn-red btn-sm"
                            onClick={async () => {
                              try {
                                await updateLeaveStatus(l.id, 'rejected');
                              } catch (e) {
                                alert(e instanceof Error ? e.message : 'Failed to reject');
                              }
                            }}
                          >
                            No
                          </button>
                        </div>
                      )}
                      {l.status !== 'pending' && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: '#eee', color: MUT }}
                          onClick={async () => {
                            try {
                              await deleteLeave(l.id);
                            } catch (e) {
                              alert(e instanceof Error ? e.message : 'Failed to delete');
                            }
                          }}
                        >
                          Del
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {campLeaveRecords.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: MUT, fontStyle: 'italic', padding: 14 }}>
                    No leave records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (staffSub === 'calendar') {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMon = getDaysInMonth(calYear, calMonth);
    const cells: ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= daysInMon; d++) {
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const evs = calEvents[ds] || [];
      const isSun = new Date(ds).getDay() === 0;
      const isPH = publicHolidays.find((h) => h.date === ds);
      const staffOut = staffOnLeaveOnDate(ds, leaveRecords, allStaffMembers, campId);
      const staffOverload = staffOut.length >= 2;
      const bg = isSun ? '#f7f4f0' : isPH ? '#fce4ec' : staffOverload ? '#fef9e7' : '#fff';
      cells.push(
        <div
          key={d}
          className="cal-day"
          style={{
            background: bg,
            border: staffOverload ? '2px solid #b7770d' : '1px solid #e8e2d8',
          }}
        >
          <div className="cal-num" style={{ color: isSun || isPH ? RED : staffOverload ? ORA : PR }}>
            {d}
            {isPH && (
              <span style={{ fontSize: 9, display: 'block', color: RED, fontStyle: 'italic' }}>{isPH.name}</span>
            )}
            {staffOverload && (
              <span style={{ fontSize: 9, display: 'block', color: ORA, fontStyle: 'italic' }}>
                {staffOut.length} staff out
              </span>
            )}
          </div>
          {evs
            .filter((e) => !['WO', 'PH'].includes(e.type))
            .slice(0, 3)
            .map((e, i) => {
              const lt = LEAVE_TYPES[e.type] || { color: MUT };
              return (
                <div key={i} className="chip" style={{ background: `${lt.color}22`, color: lt.color, border: `1px solid ${lt.color}44` }}>
                  {e.name.split(' ')[0]} · {e.type}
                </div>
              );
            })}
        </div>,
      );
    }

    subContent = (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              if (calMonth === 0) {
                setCalMonth(11);
                setCalYear((y) => y - 1);
              } else setCalMonth((m) => m - 1);
            }}
          >
            Prev
          </button>
          <span style={{ fontSize: 16, fontWeight: 500, color: PR }}>
            {MONTH_NAMES[calMonth]} {calYear}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              if (calMonth === 11) {
                setCalMonth(0);
                setCalYear((y) => y + 1);
              } else setCalMonth((m) => m + 1);
            }}
          >
            Next
          </button>
          <span style={{ fontSize: 11, color: MUT, fontStyle: 'italic' }}>
            {getSundaysInMonth(calYear, calMonth)} Sundays this month = {getSundaysInMonth(calYear, calMonth)} Weekly Offs
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          {Object.entries(LEAVE_TYPES).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: v.color, display: 'inline-block' }} />
              {v.label}
            </div>
          ))}
        </div>
        <div className="cal-grid">
          {DAY_NAMES.map((d) => (
            <div key={d} className="cal-head">
              {d}
            </div>
          ))}
          {cells}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: MUT, fontStyle: 'italic' }}>
          Grey = Sunday (Weekly Off) · Pink = Public Holiday · Coloured chips = staff on leave · Amber border = 2+ staff on leave
        </div>
      </>
    );
  } else if (staffSub === 'schedule') {
    const upcoming = campLeaveRecords
      .filter((l) => l.date_from >= today)
      .sort((a, b) => a.date_from.localeCompare(b.date_from));

    subContent = (
      <>
        <div className="info">
          Advance leave blocking — schedule future leave for staff. Staff conflict check (max 2) and balance check applies automatically.
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>Block Leave in Advance</div>
          {renderLeaveFormFields({ showStatus: false })}
          <button type="button" className="btn" onClick={() => handleApplyLeave('approved')}>
            Block Leave (Auto-Approve)
          </button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Upcoming Scheduled Leaves</div>
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Designation</th>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((l) => {
                const s = allStaffMembers.find((x) => x.id === l.staff_id);
                const from = new Date(l.date_from);
                const to = new Date(l.date_to || l.date_from);
                const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
                return (
                  <tr key={l.id} style={{ background: l.status === 'approved' ? GRNL : ORAL }}>
                    <td style={{ fontWeight: 500 }}>{s?.name || '—'}</td>
                    <td style={{ fontSize: 11, color: MUT }}>{s?.designation || ''}</td>
                    <td>{l.date_from}</td>
                    <td>{l.date_to || l.date_from}</td>
                    <td>
                      <LeaveTypeDisplay leave={l} />
                    </td>
                    <td>{days}</td>
                    <td style={{ textTransform: 'capitalize', color: l.status === 'approved' ? GRN : ORA, fontSize: 11 }}>
                      {l.status}
                    </td>
                  </tr>
                );
              })}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: MUT, fontStyle: 'italic', padding: 14 }}>
                    No upcoming scheduled leaves
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (staffSub === 'holidays') {
    subContent = (
      <>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Add Public Holiday</div>
          <div className="row">
            <div className="field">
              <label>Date</label>
              <input type="date" value={phDate} onChange={(e) => setPhDate(e.target.value)} style={{ width: 150 }} />
            </div>
            <div className="field">
              <label>Holiday Name</label>
              <input placeholder="e.g. Holi" value={phName} onChange={(e) => setPhName(e.target.value)} style={{ width: 200 }} />
            </div>
            <button type="button" className="btn" style={{ alignSelf: 'flex-end' }} onClick={handleAddPublicHoliday}>
              Add
            </button>
          </div>
        </div>
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Holiday</th>
                <th>Day</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...publicHolidays]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((h) => (
                  <tr key={h.id}>
                    <td>{h.date}</td>
                    <td>{h.name}</td>
                    <td style={{ color: MUT, fontStyle: 'italic', fontSize: 11 }}>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(h.date).getDay()]}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-red btn-sm"
                        onClick={async () => {
                          try {
                            await removePublicHoliday(h.id);
                          } catch (e) {
                            alert(e instanceof Error ? e.message : 'Failed to remove holiday');
                          }
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: PR }}>Staff Records — {CAMP_NAMES[campId]}</h2>
      </div>
      <p style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 14 }}>
        Leave management, attendance, calendar and scheduling
      </p>

      {subContent}
    </div>
  );
}

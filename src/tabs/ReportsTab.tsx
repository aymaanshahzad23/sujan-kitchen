import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppContext';
import {
  CAMP_NAMES,
  GRNL,
  LEAVE_TYPES,
  MONTH_NAMES,
  MUT,
  ORAL,
  PR,
  Q,
  REDL,
} from '../constants';
import { resolveDishCostPrice, toLegacyGuest } from '../lib/mappers';
import {
  clf,
  dlCSV,
  dlHTML,
  fN,
  getDaysInMonth,
  gM,
  gW,
  kotToRec,
  nowS,
  toCSV,
} from '../utils/helpers';
import { getLeaveBalance } from '../utils/leave';
import type { CampId, Dish, Ingredient, Kot } from '../types/database';

type ReportType =
  | 'food_cost'
  | 'sales'
  | 'staff_info'
  | 'leave_schedule'
  | 'attendance'
  | 'guests'
  | 'complaints';

interface ReportsTabProps {
  calMonth?: number;
  calYear?: number;
}

const REPORT_CSS =
  "body{font-family:Georgia,serif;max-width:960px;margin:32px auto;color:#2a2418;font-size:13px}h1{color:#8b6f47;font-size:22px}h2{color:#6b5d4f;font-size:13px;font-style:italic;margin-bottom:10px;font-weight:normal}h3{font-size:13px;margin:14px 0 6px;border-bottom:1px solid #e8e2d8;padding-bottom:3px}table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#8b6f47;color:#fff;padding:7px 10px;text-align:left;font-weight:normal;font-size:12px}td{padding:6px 10px;border-bottom:1px solid #e8e2d8;font-size:12px}.sum{background:#f7f4f0;font-weight:bold}.red{color:#c0392b}.grn{color:#2d6a4f}.badge{padding:2px 7px;border-radius:3px;font-style:italic;font-size:11px}.star{background:#e8f5ee;color:#2d6a4f}.plow{background:#fdecea;color:#b5451b}.puzzle{background:#eeeef8;color:#4a4e8a}.dog{background:#f2ebe6;color:#8a6b5b}";

function getDishCost(
  dishId: string,
  directCosts: Record<string, number>,
  recipes: Record<string, { ingredient_id: string; grams: number }[]>,
  ingredients: Ingredient[],
): number {
  if (directCosts[dishId] != null) return directCosts[dishId];
  return (recipes[dishId] || []).reduce((s, r) => {
    const ing = ingredients.find((x) => x.id === r.ingredient_id);
    return s + (ing ? (r.grams / 1000) * ing.price : 0);
  }, 0);
}

function wrapReport(title: string, body: string, campLabel: string, dateStr: string): string {
  return `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>${title}</title><style>${REPORT_CSS}</style></head><body><h1>SUJAN — ${campLabel}</h1><h2>${title} | ${dateStr}</h2>${body}</body></html>`;
}

export function ReportsTab({ calMonth, calYear }: ReportsTabProps) {
  const {
    campId,
    allDishes,
    allKots,
    allStaff,
    allGuests,
    allComplaints,
    camps,
    inventory,
    recipes,
    staff,
    guests,
  } = useAppData();

  const mn = calMonth ?? new Date().getMonth();
  const yr = calYear ?? new Date().getFullYear();

  const [rCamp, setRCamp] = useState<CampId>('jawai');
  const [rType, setRType] = useState<ReportType>('food_cost');
  const [rPer, setRPer] = useState('all');
  const [rKey, setRKey] = useState('');

  const campKots = allKots.kotsByCamp[rCamp];
  const campDishes = allDishes.dishesByCamp[rCamp];

  const periodKeys = useMemo(() => {
    return [
      ...new Set(
        campKots.map((k) => (rPer === 'day' ? k.date : rPer === 'week' ? gW(k.date) : gM(k.date))),
      ),
    ].sort();
  }, [campKots, rPer]);

  const downloadReport = (fmt: 'csv' | 'html') => {
    const cL = CAMP_NAMES[rCamp];
    const d8 = nowS();
    const campMeta = camps.camps.find((c) => c.id === rCamp);
    const openVal = campMeta?.opening_stock_value ?? 0;
    const purchVal = campMeta?.purchases_value ?? 0;
    const { directCosts, recipes: recipeMap } = recipes;
    const ingredients = inventory.ingredients;
    const leaveRecords = staff.leaveRecords;
    const publicHolidays = staff.publicHolidays;

    if (rType === 'food_cost') {
      const dc = campDishes.map((d: Dish) => {
        const gK = campKots.filter((k: Kot) => k.dish_id === d.id && k.type === 'Guest');
        const mK = campKots.filter((k: Kot) => k.dish_id === d.id && k.type === 'Manager');
        const gQ = gK.reduce((s, k) => s + k.qty, 0);
        const mQ = mK.reduce((s, k) => s + k.qty, 0);
        const sC = getDishCost(d.id, directCosts, recipeMap, ingredients);
        const cG = Math.round(sC * gQ);
        const cM = Math.round(sC * mQ);
        return {
          ...d,
          gQ,
          mQ,
          sC: Math.round(sC * 100) / 100,
          cG,
          cM,
          totC: cG + cM,
        };
      });
      const tC = dc.reduce((s, d) => s + d.totC, 0);
      const mC = dc.reduce((s, d) => s + d.cM, 0);
      const nFC = tC - mC;

      if (fmt === 'csv') {
        dlCSV(
          toCSV(
            dc.map((d) => [
              d.name,
              d.category,
              d.section,
              d.gQ,
              d.mQ,
              'Rs' + d.sC,
              'Rs' + fN(resolveDishCostPrice(d)),
              'Rs' + fN(d.cG),
            ]),
            [
              'Dish',
              'Category',
              'Section',
              'Guest Qty',
              'Mgr Qty',
              'Std Cost',
              'Ref Cost Price',
              'Food Cost',
            ],
          ),
          `food_cost_${rCamp}_${d8}.csv`,
        );
      } else {
        dlHTML(
          wrapReport(
            'Food Cost Report',
            `<h3>COFS</h3><table><tr class='sum'><td>Opening Stock</td><td>Rs${fN(openVal)}</td></tr><tr><td>(+) Purchases</td><td class='grn'>Rs${fN(purchVal)}</td></tr><tr><td>(=) Net Food Cost</td><td class='red'>Rs${fN(nFC)}</td></tr></table><h3>Dish Breakdown</h3><table><tr><th>Dish</th><th>Section</th><th>Std Cost</th><th>Ref Cost</th><th>G.Qty</th><th>Food Cost</th></tr>${[...dc]
              .sort((a, b) => b.cG - a.cG)
              .map(
                (d) =>
                  `<tr><td>${d.name}</td><td>${d.section}</td><td>Rs${d.sC}</td><td>Rs${fN(resolveDishCostPrice(d))}</td><td>${d.gQ}</td><td>Rs${fN(d.cG)}</td></tr>`,
              )
              .join('')}</table>`,
            cL,
            d8,
          ),
          `food_cost_${rCamp}_${d8}.html`,
        );
      }
    } else if (rType === 'staff_info') {
      const rs = allStaff.allStaff.filter((s) => s.camp_id === rCamp);
      const compOffs = staff.compOffs;
      const publicHolidays = staff.publicHolidays;
      const balanceLabel = (s: (typeof rs)[0]) => {
        const b = getLeaveBalance(s, leaveRecords, compOffs, { year: yr, month: mn }, publicHolidays);
        return `PL ${b.remPL}/${b.cPL} · CL ${b.remCL}/${b.cCL} · ML ${b.remML}/${b.cML} · PH ${b.remPH}/${b.cPH} · WO ${b.remWO}/${b.cWO} · CO ${b.avCO}`;
      };
      if (fmt === 'csv') {
        dlCSV(
          toCSV(
            rs.map((s) => [
              s.name,
              s.designation,
              s.section,
              s.doj,
              s.phone || '',
              s.email || '',
              balanceLabel(s),
            ]),
            ['Name', 'Designation', 'Section', 'Date of Joining', 'Phone', 'Email', `Leave Balance (${MONTH_NAMES[mn]} ${yr})`],
          ),
          `staff_${rCamp}_${d8}.csv`,
        );
      } else {
        dlHTML(
          wrapReport(
            'Staff Information',
            `<table><tr><th>Name</th><th>Designation</th><th>Section</th><th>Date of Joining</th><th>Phone</th><th>Leave Balance (${MONTH_NAMES[mn]} ${yr})</th></tr>${rs
              .map(
                (s) =>
                  `<tr><td>${s.name}</td><td>${s.designation}</td><td>${s.section}</td><td>${s.doj}</td><td>${s.phone || '—'}</td><td>${balanceLabel(s)}</td></tr>`,
              )
              .join('')}</table>`,
            cL,
            d8,
          ),
          `staff_${rCamp}_${d8}.html`,
        );
      }
    } else if (rType === 'leave_schedule') {
      const mStart = `${yr}-${String(mn + 1).padStart(2, '0')}-01`;
      const mEnd = new Date(yr, mn + 1, 0).toISOString().slice(0, 10);
      const rs = leaveRecords.filter((l) => l.date_from >= mStart && l.date_from <= mEnd);
      if (fmt === 'csv') {
        dlCSV(
          toCSV(
            rs.map((l) => {
              const s = allStaff.allStaff.find((x) => x.id === l.staff_id);
              return [
                l.date_from,
                l.date_to || l.date_from,
                s?.name || '',
                s?.designation || '',
                l.type,
                l.status,
                l.note || '',
              ];
            }),
            ['From', 'To', 'Staff', 'Designation', 'Type', 'Status', 'Note'],
          ),
          `leave_schedule_${d8}.csv`,
        );
      } else {
        dlHTML(
          wrapReport(
            `Leave Schedule — ${MONTH_NAMES[mn]} ${yr}`,
            `<table><tr><th>From</th><th>To</th><th>Staff</th><th>Designation</th><th>Leave Type</th><th>Status</th></tr>${[...rs]
              .sort((a, b) => a.date_from.localeCompare(b.date_from))
              .map((l) => {
                const s = allStaff.allStaff.find((x) => x.id === l.staff_id);
                const lt = LEAVE_TYPES[l.type] || { label: l.type };
                const bg =
                  l.status === 'approved' ? GRNL : l.status === 'pending' ? ORAL : REDL;
                return `<tr style='background:${bg}'><td>${l.date_from}</td><td>${l.date_to || l.date_from}</td><td>${s?.name || ''}</td><td>${s?.designation || ''}</td><td>${lt.label}</td><td style='text-transform:capitalize'>${l.status}</td></tr>`;
              })
              .join('')}</table>`,
            cL,
            d8,
          ),
          `leave_schedule_${d8}.html`,
        );
      }
    } else if (rType === 'attendance') {
      const daysInMon = getDaysInMonth(yr, mn);
      const rs = allStaff.allStaff.filter((s) => s.camp_id === rCamp);
      const header = [
        'Staff Name',
        'Designation',
        ...Array.from({ length: daysInMon }, (_, i) => String(i + 1).padStart(2, '0')),
        'Present',
        'Absent',
        'WO',
      ];
      const rows = rs.map((s) => {
        const row: (string | number)[] = [s.name, s.designation];
        let present = 0;
        let absent = 0;
        let wo = 0;
        for (let d = 1; d <= daysInMon; d++) {
          const ds = `${yr}-${String(mn + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dt = new Date(ds);
          const isSun = dt.getDay() === 0;
          const ph = publicHolidays.find((h) => h.date === ds);
          const lv = leaveRecords.find(
            (l) =>
              l.staff_id === s.id &&
              l.date_from <= ds &&
              (l.date_to || l.date_from) >= ds &&
              l.status === 'approved',
          );
          if (isSun || ph) {
            row.push('WO');
            wo++;
          } else if (lv) {
            row.push(lv.type);
            absent++;
          } else {
            row.push('P');
            present++;
          }
        }
        row.push(present, absent, wo);
        return row;
      });
      if (fmt === 'csv') {
        dlCSV(toCSV(rows, header), `attendance_${MONTH_NAMES[mn]}_${yr}.csv`);
      } else {
        const headerHTML = `<tr>${header.map((h) => `<th>${h}</th>`).join('')}</tr>`;
        const rowHTML = rows
          .map(
            (r) =>
              `<tr>${r
                .map((c, i) => {
                  const style =
                    c === 'P'
                      ? 'color:#2d6a4f'
                      : c === 'WO'
                        ? 'color:#6b5d4f;font-style:italic'
                        : i >= 2 &&
                            c !== 'Present' &&
                            c !== 'Absent' &&
                            c !== 'WO' &&
                            c !== 'P'
                          ? 'background:#fdecea;color:#c0392b'
                          : '';
                  return `<td style='${style};font-size:11px'>${c}</td>`;
                })
                .join('')}</tr>`,
          )
          .join('');
        dlHTML(
          wrapReport(
            `Attendance Sheet — ${MONTH_NAMES[mn]} ${yr}`,
            `<div style='overflow:auto'><table>${headerHTML}${rowHTML}</table></div>`,
            cL,
            d8,
          ),
          `attendance_${MONTH_NAMES[mn]}_${yr}.html`,
        );
      }
    } else if (rType === 'sales') {
      const legacyKots = campKots.map((k) => ({
        type: k.type,
        dishId: k.dish_id,
        date: k.date,
        qty: k.qty,
      }));
      const fR = kotToRec(legacyKots);
      const aQ = campDishes.map((d) =>
        fR.filter((r) => r.dishId === d.id).reduce((s, r) => s + r.qty, 0),
      );
      const avgQ2 = aQ.reduce((s, x) => s + x, 0) / (campDishes.length || 1);
      const avgC2 =
        campDishes.reduce((s, d) => s + resolveDishCostPrice(d), 0) / (campDishes.length || 1);
      const rc = campDishes.map((d, i) => ({
        ...d,
        qty: aQ[i],
        quad: clf(aQ[i], avgQ2, resolveDishCostPrice(d), avgC2),
      }));
      if (fmt === 'csv') {
        dlCSV(
          toCSV(
            [...rc]
              .sort((a, b) => b.qty - a.qty)
              .map((d) => [d.name, d.category, d.section, d.qty, 'Rs' + resolveDishCostPrice(d), Q[d.quad].label]),
            ['Dish', 'Category', 'Section', 'Qty Sold', 'Cost Price', 'Classification'],
          ),
          `sales_${rCamp}_${d8}.csv`,
        );
      } else {
        dlHTML(
          wrapReport(
            'Sales Summary (BCG)',
            `<table><tr><th>Dish</th><th>Category</th><th>Section</th><th>Qty Sold</th><th>Cost Price</th><th>Classification</th></tr>${[...rc]
              .sort((a, b) => b.qty - a.qty)
              .map(
                (d) =>
                  `<tr><td>${d.name}</td><td>${d.category}</td><td>${d.section}</td><td>${d.qty}</td><td>Rs${resolveDishCostPrice(d)}</td><td><span class='badge ${d.quad}'>${Q[d.quad].emoji} ${Q[d.quad].label}</span></td></tr>`,
              )
              .join('')}</table>`,
            cL,
            d8,
          ),
          `sales_${rCamp}_${d8}.html`,
        );
      }
    } else if (rType === 'guests') {
      const rG = allGuests.allGuests.filter((g) => g.camp_id === rCamp);
      const dishLogsForCamp = rCamp === campId ? guests.dishLogs : {};
      if (fmt === 'csv') {
        dlCSV(
          toCSV(
            rG.map((g) => {
              const legacy = toLegacyGuest(g, dishLogsForCamp[g.id]);
              return [
                legacy.profileId,
                legacy.regNo,
                legacy.name,
                legacy.phone,
                legacy.nationality,
                legacy.tent,
                legacy.checkIn,
                legacy.checkOut,
                legacy.status,
                legacy.foodPref,
                legacy.allergies || 'None',
                (legacy.dishLog || []).length,
                legacy.feedback || '',
              ];
            }),
            [
              'Profile ID',
              'Reg No',
              'Name',
              'Phone',
              'Nationality',
              'Tent',
              'Check-In',
              'Check-Out',
              'Status',
              'Food Pref',
              'Allergies',
              'Dishes Logged',
              'Feedback',
            ],
          ),
          `guests_${rCamp}_${d8}.csv`,
        );
      }
    } else if (rType === 'complaints') {
      const cC = allComplaints.allComplaints.filter((c) => c.camp_id === rCamp);
      if (fmt === 'csv') {
        dlCSV(
          toCSV(
            cC.map((c) => {
              const d = campDishes.find((x) => x.id === c.dish_id);
              return [
                c.date,
                d?.name || 'General',
                c.type,
                c.severity,
                c.description,
                c.reporter || '',
              ];
            }),
            ['Date', 'Dish', 'Type', 'Severity', 'Description', 'Reported By'],
          ),
          `complaints_${rCamp}_${d8}.csv`,
        );
      }
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, color: PR, marginBottom: 4 }}>Reports</h2>
      <p style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 14 }}>
        Download as Excel/CSV or HTML (open in browser, print to PDF)
      </p>
      <div className="card">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div className="field">
            <label>Camp</label>
            <select value={rCamp} onChange={(e) => setRCamp(e.target.value as CampId)}>
              <option value="jawai">JAWAI</option>
              <option value="sherbagh">Sherbagh</option>
              <option value="serai">The Serai</option>
            </select>
          </div>
          <div className="field">
            <label>Report Type</label>
            <select value={rType} onChange={(e) => setRType(e.target.value as ReportType)}>
              <optgroup label="Food Cost">
                <option value="food_cost">Food Cost (COFS)</option>
                <option value="sales">Sales Summary (BCG)</option>
              </optgroup>
              <optgroup label="Staff">
                <option value="staff_info">Staff Information</option>
                <option value="leave_schedule">Leave Schedule</option>
                <option value="attendance">Attendance Sheet (Monthly)</option>
              </optgroup>
              <optgroup label="Guests & Service">
                <option value="guests">Guest Registration</option>
                <option value="complaints">Complaints & Feedback</option>
              </optgroup>
            </select>
          </div>
          <div className="field">
            <label>Period</label>
            <select
              value={rPer}
              onChange={(e) => {
                setRPer(e.target.value);
                setRKey('');
              }}
            >
              <option value="all">All Time</option>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          {rPer !== 'all' && (
            <div className="field">
              <label>Select {rPer}</label>
              <select value={rKey} onChange={(e) => setRKey(e.target.value)}>
                <option value="">— all —</option>
                {periodKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {(rType === 'leave_schedule' || rType === 'attendance') && (
          <div
            style={{
              background: '#f7f4f0',
              borderRadius: 3,
              padding: '8px 12px',
              marginBottom: 12,
              fontSize: 12,
              color: MUT,
              fontStyle: 'italic',
            }}
          >
            Report uses calendar month: {MONTH_NAMES[mn]} {yr} (change via Staff / Calendar tab)
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-green" onClick={() => downloadReport('csv')}>
            Download Excel / CSV
          </button>
          <button type="button" className="btn" onClick={() => downloadReport('html')}>
            Download PDF / HTML
          </button>
          <span style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>
            Open HTML in browser, print to save as PDF
          </span>
        </div>
      </div>
    </div>
  );
}

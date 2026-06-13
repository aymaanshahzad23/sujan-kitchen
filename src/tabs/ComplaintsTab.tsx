import { useState } from 'react';
import { useAppData } from '../context/AppContext';
import { CAMP_NAMES, GRN, GRNL, MUT, ORA, ORAL, PR, RED, REDL } from '../constants';
import type { Dish } from '../types/database';

const COMPLAINT_TYPES = ['complaint', 'suggestion', 'compliment', 'incident', 'allergy'] as const;
const SEVERITIES = ['low', 'medium', 'high'] as const;

const SEV_BG: Record<string, string> = {
  high: REDL,
  medium: ORAL,
  low: GRNL,
};

export function ComplaintsTab() {
  const { campId, dishes, complaints } = useAppData();
  const cd = dishes.dishes;

  const [cDish, setCDish] = useState('');
  const [cDate, setCDate] = useState('');
  const [cType, setCType] = useState<string>('complaint');
  const [cSev, setCSev] = useState<string>('medium');
  const [cBy, setCBy] = useState('');
  const [cDesc, setCDesc] = useState('');

  const handleSubmit = async () => {
    if (!cDate || !cDesc) return;
    await complaints.addComplaint({
      dish_id: cDish || null,
      date: cDate,
      type: cType,
      severity: cSev,
      description: cDesc,
      reporter: cBy,
    });
    setCDish('');
    setCDate('');
    setCDesc('');
    setCBy('');
  };

  const campComplaints = [...complaints.complaints].reverse();

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, color: PR, marginBottom: 12 }}>
        Complaints & Feedback — {CAMP_NAMES[campId]}
      </h2>
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>New Entry</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div className="field">
            <label>Dish (optional)</label>
            <select value={cDish} onChange={(e) => setCDish(e.target.value)}>
              <option value="">General</option>
              {cd.map((d: Dish) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={cDate} onChange={(e) => setCDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={cType} onChange={(e) => setCType(e.target.value)}>
              {COMPLAINT_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Severity</label>
            <select value={cSev} onChange={(e) => setCSev(e.target.value)}>
              {SEVERITIES.map((o) => (
                <option key={o} value={o}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Reported By</label>
            <input placeholder="e.g. Waiter" value={cBy} onChange={(e) => setCBy(e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Description</label>
            <textarea
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
            />
          </div>
          <button type="button" className="btn" style={{ alignSelf: 'flex-end' }} onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Dish</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Description</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {campComplaints.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: MUT, fontStyle: 'italic', padding: 14 }}>
                  No entries yet
                </td>
              </tr>
            )}
            {campComplaints.map((c) => {
              const d = cd.find((x) => x.id === c.dish_id);
              const sb = SEV_BG[c.severity] || '';
              return (
                <tr key={c.id} style={{ background: sb }}>
                  <td>{c.date}</td>
                  <td>
                    {d?.name || (
                      <span style={{ color: MUT, fontStyle: 'italic' }}>General</span>
                    )}
                  </td>
                  <td style={{ textTransform: 'capitalize', fontStyle: 'italic', color: RED, fontSize: 11 }}>
                    {c.type}
                  </td>
                  <td
                    style={{
                      textTransform: 'capitalize',
                      fontWeight: c.severity === 'high' ? 500 : 400,
                      color: c.severity === 'high' ? RED : c.severity === 'medium' ? ORA : GRN,
                      fontSize: 11,
                    }}
                  >
                    {c.severity}
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 220 }}>{c.description}</td>
                  <td style={{ color: MUT, fontStyle: 'italic', fontSize: 11 }}>{c.reporter || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

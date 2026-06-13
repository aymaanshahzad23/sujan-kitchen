import { useState } from 'react';
import type { Guest } from '../types/database';
import { GRN, MUT } from '../constants';
import { buildGuestKotInput } from '../utils/leaveCapacity';

interface PunchGuestOrderFormProps {
  guest: Guest;
  dishes: { id: string; name: string }[];
  onPunch: (input: ReturnType<typeof buildGuestKotInput>) => Promise<void>;
  compact?: boolean;
}

export function PunchGuestOrderForm({ guest, dishes, onPunch, compact }: PunchGuestOrderFormProps) {
  const [dishId, setDishId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [qty, setQty] = useState('1');
  const [revenue, setRevenue] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!dishId || !date || !qty) return;
    setBusy(true);
    try {
      const payload = buildGuestKotInput(guest, {
        dish_id: dishId,
        date,
        qty: +qty,
        revenue: +revenue || 0,
      });
      await onPunch(payload);
      setDishId('');
      setQty('1');
      setRevenue('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to punch order');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ background: '#f0faf5', border: `1px solid ${GRN}` }}>
      <div style={{ fontSize: compact ? 12 : 13, fontWeight: 500, color: GRN, marginBottom: 8 }}>
        Punch Guest Order
      </div>
      <div style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 10 }}>
        Linked to {guest.name} · Tent {guest.tent || '—'} — appears automatically in KOT Log
      </div>
      <div className="row">
        <div className="field">
          <label>Dish</label>
          <select value={dishId} onChange={(e) => setDishId(e.target.value)} style={{ width: 200 }}>
            <option value="">Select dish</option>
            {dishes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 148 }} />
        </div>
        <div className="field">
          <label>Qty</label>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: 70 }} />
        </div>
        <div className="field">
          <label>Revenue</label>
          <input type="number" placeholder="auto" value={revenue} onChange={(e) => setRevenue(e.target.value)} style={{ width: 110 }} />
        </div>
        <button type="button" className="btn btn-green" style={{ alignSelf: 'flex-end' }} disabled={busy} onClick={() => void handleSubmit()}>
          Punch Order
        </button>
      </div>
    </div>
  );
}

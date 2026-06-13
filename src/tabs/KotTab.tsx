import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { PR, SECS, GRN, RED, ORA, MUT, CAMP_NAMES } from '../constants';
import { fN } from '../utils/helpers';
import { buildGuestKotInput } from '../utils/leaveCapacity';
import { punchGuestKotWithProfileSync } from '../utils/guestDishes';
import { toLegacyDish, toLegacyKot } from '../lib/mappers';
import type { KotType } from '../types/database';

export function KotTab() {
  const { campId, dishes, kots, guests } = useAppData();
  const cd = useMemo(() => dishes.dishes.map(toLegacyDish), [dishes.dishes]);
  const campKots = useMemo(() => kots.kots.map(toLegacyKot), [kots.kots]);
  const inHouseGuests = useMemo(
    () => guests.guests.filter((g) => g.status === 'in-house'),
    [guests.guests],
  );

  const [kotDish, setKotDish] = useState('');
  const [kotDate, setKotDate] = useState('');
  const [kotQty, setKotQty] = useState('');
  const [kotType, setKotType] = useState<KotType>('Guest');
  const [kotRev, setKotRev] = useState('');
  const [kotGuestId, setKotGuestId] = useState('');

  const selectedGuest = inHouseGuests.find((g) => g.id === kotGuestId) || null;

  async function punchKOT() {
    if (!kotDish || !kotDate || !kotQty) return;

    if (kotType === 'Guest') {
      if (!kotGuestId) {
        alert('Select an in-house guest — tent and profile link automatically.');
        return;
      }
      try {
        const payload = buildGuestKotInput(selectedGuest!, {
          dish_id: kotDish,
          date: kotDate,
          qty: +kotQty,
          revenue: +kotRev || 0,
        });
        const dish = dishes.dishes.find((d) => d.id === kotDish);
        await punchGuestKotWithProfileSync(kots.punchKot, guests.addGuestDish, dish, payload);
        setKotDish('');
        setKotDate('');
        setKotQty('');
        setKotRev('');
        setKotGuestId('');
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to punch KOT');
      }
      return;
    }

    try {
      await kots.punchKot({
        dish_id: kotDish,
        date: kotDate,
        qty: +kotQty,
        type: kotType,
        revenue: 0,
        tent: null,
        guest_id: null,
      });
      setKotDish('');
      setKotDate('');
      setKotQty('');
      setKotRev('');
      setKotGuestId('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to punch KOT');
    }
  }

  const guestNameById = useMemo(
    () => Object.fromEntries(guests.guests.map((g) => [g.id, g.name])),
    [guests.guests],
  );

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, color: PR, marginBottom: 3 }}>
        KOT Log — {CAMP_NAMES[campId]}
      </h2>
      <p style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 14 }}>
        Punch guest orders from their profile (recommended) or select the guest below — tent maps automatically to KOT Log
      </p>

      <div className="card" style={{ border: `2px solid ${kotType === 'Manager' ? ORA : GRN}`, background: kotType === 'Manager' ? '#fef9e7' : '#f0faf5' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: kotType === 'Manager' ? ORA : GRN, marginBottom: 10 }}>
          Punch New KOT
        </div>
        <div className="row">
          <div className="field">
            <label>Dish</label>
            <select value={kotDish} onChange={(e) => setKotDish(e.target.value)} style={{ width: 220 }}>
              <option value="">Select dish</option>
              {cd.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={kotDate} onChange={(e) => setKotDate(e.target.value)} style={{ width: 150 }} />
          </div>
          <div className="field">
            <label>Qty</label>
            <input type="number" min="1" value={kotQty} onChange={(e) => setKotQty(e.target.value)} style={{ width: 70 }} />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={kotType} onChange={(e) => setKotType(e.target.value as KotType)} style={{ width: 155 }}>
              <option value="Guest">Guest</option>
              <option value="Manager">Manager / Staff</option>
            </select>
          </div>
          {kotType === 'Guest' && (
            <>
              <div className="field">
                <label>Guest *</label>
                <select value={kotGuestId} onChange={(e) => setKotGuestId(e.target.value)} style={{ width: 220 }}>
                  <option value="">Select in-house guest</option>
                  {inHouseGuests.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} · Tent {g.tent || '—'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Revenue</label>
                <input type="number" placeholder="auto" value={kotRev} onChange={(e) => setKotRev(e.target.value)} style={{ width: 130 }} />
              </div>
            </>
          )}
          <button type="button" className="btn btn-green" style={{ alignSelf: 'flex-end' }} onClick={() => void punchKOT()}>
            Punch KOT
          </button>
        </div>
        {kotType === 'Guest' && selectedGuest && (
          <div style={{ fontSize: 11, color: GRN, fontStyle: 'italic', marginTop: 8 }}>
            Auto-linked · Tent {selectedGuest.tent} · Profile {selectedGuest.profile_id?.slice(0, 8) || selectedGuest.id.slice(0, 8)}…
          </div>
        )}
        {kotType === 'Manager' && (
          <div style={{ fontSize: 11, color: ORA, fontStyle: 'italic', marginTop: 8 }}>
            Staff / manager meal — no guest or tent required; highlighted in the log below.
          </div>
        )}
      </div>
      <div className="stats">
        <StatCard label="Total KOTs" val={campKots.length} prefix="" />
        <StatCard label="Guest Revenue" val={campKots.filter((k) => k.type === 'Guest').reduce((s, k) => s + k.revenue, 0)} />
        <StatCard label="Manager Meals" val={campKots.filter((k) => k.type === 'Manager').reduce((s, k) => s + k.qty, 0)} color={RED} prefix="" />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {kots.loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: MUT, fontStyle: 'italic' }}>Loading KOTs…</div>
        ) : campKots.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: MUT, fontStyle: 'italic' }}>No KOTs yet — punch one above.</div>
        ) : (
          <>
            <div className="kot-log-legend">
              <span className="kot-log-legend__item">
                <span className="kot-log-legend__swatch kot-log-legend__swatch--guest" />
                Guest order — linked to profile &amp; tent
              </span>
              <span className="kot-log-legend__item">
                <span className="kot-log-legend__swatch kot-log-legend__swatch--manager" />
                Manager / staff meal — no tent
              </span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Dish</th>
                  <th>Section</th>
                  <th>Guest</th>
                  <th>Tent</th>
                  <th>Qty</th>
                  <th>Type</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[...campKots].reverse().map((k) => {
                  const isManager = k.type === 'Manager';
                  const d = cd.find((x) => x.id === k.dishId);
                  const s = d ? SECS[d.section] || { label: d.section, color: MUT } : { label: '—', color: MUT };
                  return (
                    <tr key={k.id} className={isManager ? 'kot-row--manager' : undefined}>
                      <td>{k.date}</td>
                      <td style={{ fontWeight: isManager ? 500 : undefined }}>{d?.name || '—'}</td>
                      <td>
                        <span style={{ fontSize: 10, color: s.color, fontStyle: 'italic' }}>{s.label}</span>
                      </td>
                      <td>
                        {isManager ? (
                          <span style={{ color: ORA, fontStyle: 'italic', fontSize: 11 }}>Staff meal</span>
                        ) : k.guestId ? (
                          guestNameById[k.guestId] || '—'
                        ) : (
                          <span style={{ color: MUT }}>—</span>
                        )}
                      </td>
                      <td>
                        {isManager ? (
                          <span style={{ color: MUT, fontStyle: 'italic', fontSize: 11 }}>—</span>
                        ) : (
                          k.tent || <span style={{ color: MUT }}>—</span>
                        )}
                      </td>
                      <td>{k.qty}</td>
                      <td>
                        <span className={`kot-type-badge ${isManager ? 'kot-type-badge--manager' : 'kot-type-badge--guest'}`}>
                          {isManager ? 'Manager' : 'Guest'}
                        </span>
                      </td>
                      <td>{k.revenue > 0 ? 'Rs ' + fN(k.revenue) : <span style={{ color: MUT }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

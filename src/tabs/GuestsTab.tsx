import { useMemo, useState } from 'react';
import { PunchGuestOrderForm } from '../components/PunchGuestOrderForm';
import { useAppData } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { BLU, CAMP_NAMES, GRN, GRNL, MUT, ORA, ORAL, PR, RED, REDL } from '../constants';
import {
  findReturningGuestProfile,
  prepareGuestIdentity,
  validateGuestRegistration,
} from '../utils/guests';

type GuestSub = 'list' | 'add' | 'profile';
type GuestFilter = 'all' | 'in-house' | 'expected' | 'checked-out';

const FOOD_PREFS = ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'jain', 'halal', 'kosher', 'gluten-free'] as const;

const MEAL_OPTIONS = ['Breakfast', 'Brunch', 'Lunch', 'Sundowner', 'Dinner', 'Late Night'] as const;

const GUEST_STATUS_ORDER: Record<string, number> = { 'in-house': 0, expected: 1, 'checked-out': 2 };

function guestStatusBadge(status: string): { label: string; bg: string; color: string } {
  if (status === 'in-house') return { label: 'In House', bg: GRNL, color: GRN };
  if (status === 'expected') return { label: 'Expected', bg: ORAL, color: ORA };
  return { label: 'Checked Out', bg: '#f0ece6', color: MUT };
}

export function GuestsTab() {
  const { campId, guests, dishes, allGuests, kots } = useAppData();
  const { guests: campGuests, dishLogs, addGuest, updateGuest, addGuestDish, removeGuestDish } = guests;
  const campDishes = dishes.dishes;

  const [gSub, setGSub] = useState<GuestSub>('list');
  const [guestFilter, setGuestFilter] = useState<GuestFilter>('all');
  const [selGuest, setSelGuest] = useState<string | null>(null);

  const [gName, setGName] = useState('');
  const [gPhone, setGPhone] = useState('');
  const [gReg, setGReg] = useState('');
  const [gNat, setGNat] = useState('');
  const [gTent, setGTent] = useState('');
  const [gIn, setGIn] = useState('');
  const [gOut, setGOut] = useState('');
  const [gFood, setGFood] = useState<string>(FOOD_PREFS[0]);
  const [gStat, setGStat] = useState('in-house');
  const [gAllergy, setGAllergy] = useState('');
  const [gDiet, setGDiet] = useState('');
  const [gExp, setGExp] = useState('');
  const [gChef, setGChef] = useState('');
  const [gFB, setGFB] = useState('');

  const [gdDish, setGdDish] = useState('');
  const [gdDate, setGdDate] = useState('');
  const [gdMeal, setGdMeal] = useState<string>(MEAL_OPTIONS[0]);
  const [gdNote, setGdNote] = useState('');

  const inHouseCount = campGuests.filter((g) => g.status === 'in-house').length;
  const expectedCount = campGuests.filter((g) => g.status === 'expected').length;
  const checkedOutCount = campGuests.filter((g) => g.status === 'checked-out').length;
  const allergyCount = campGuests.filter((g) => g.allergies).length;

  const sortedGuests = useMemo(
    () =>
      [...campGuests].sort((a, b) => {
        const so = (GUEST_STATUS_ORDER[a.status] ?? 9) - (GUEST_STATUS_ORDER[b.status] ?? 9);
        if (so !== 0) return so;
        return (b.check_in || '').localeCompare(a.check_in || '');
      }),
    [campGuests],
  );

  const filteredGuests = useMemo(
    () => (guestFilter === 'all' ? sortedGuests : sortedGuests.filter((g) => g.status === guestFilter)),
    [sortedGuests, guestFilter],
  );

  const returningProfile = useMemo(() => {
    if (!gName.trim() || !gPhone.trim()) return null;
    return findReturningGuestProfile(gName, gPhone, allGuests.allGuests, campId);
  }, [gName, gPhone, allGuests.allGuests, campId]);

  const priorVisits = useMemo(() => {
    if (!returningProfile?.profile_key) return [];
    return allGuests.allGuests
      .filter((g) => g.camp_id === campId && g.profile_key === returningProfile.profile_key)
      .sort((a, b) => (b.check_in || '').localeCompare(a.check_in || ''));
  }, [returningProfile, allGuests.allGuests, campId]);

  const handleAddGuest = async () => {
    const err = validateGuestRegistration({
      campId,
      name: gName,
      tent: gTent,
      phone: gPhone,
      guests: allGuests.allGuests,
    });
    if (err) {
      alert(`⚠ ${err}`);
      return;
    }

    try {
      const identity = prepareGuestIdentity(gName, gTent, gPhone, allGuests.allGuests, campId);
      const prior = identity.returning;

      const data = await addGuest({
        camp_id: campId,
        reg_no: gReg || null,
        name: gName.trim(),
        phone: gPhone.trim(),
        profile_id: identity.profile_id,
        profile_key: identity.profile_key,
        stay_key: identity.stay_key,
        nationality: gNat || null,
        tent: gTent.trim(),
        check_in: gIn || null,
        check_out: gOut || null,
        food_pref: gFood,
        allergies: gAllergy || prior?.allergies || null,
        diet_notes: gDiet || prior?.diet_notes || null,
        experiences: gExp || prior?.experiences || null,
        feedback: gFB || null,
        chef_notes: gChef || prior?.chef_notes || null,
        status: gStat,
      });
      setGReg('');
      setGName('');
      setGPhone('');
      setGNat('');
      setGTent('');
      setGIn('');
      setGOut('');
      setGAllergy('');
      setGDiet('');
      setGExp('');
      setGFB('');
      setGChef('');
      setGSub('list');
      setSelGuest(data.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to register guest');
    }
  };

  const handleAddGuestDish = async (guestId: string) => {
    if (!gdDish || !gdDate) return;
    const d = campDishes.find((x) => x.id === gdDish);
    try {
      await addGuestDish({
        guest_id: guestId,
        dish_id: gdDish,
        dish_name: d?.name || '',
        date: gdDate,
        meal: gdMeal,
        notes: gdNote,
      });
      setGdDish('');
      setGdDate('');
      setGdNote('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add dish log');
    }
  };

  const profileGuest = selGuest ? campGuests.find((x) => x.id === selGuest) : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: PR }}>Guest Registry — {CAMP_NAMES[campId]}</h2>
          <p style={{ fontSize: 11, color: MUT, fontStyle: 'italic' }}>Profiles, dietary notes, dish history, chef briefings</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setGSub('list')}>
            All Guests
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setGSub('add')}>
            + Register
          </button>
        </div>
      </div>

      <div className="stats">
        <StatCard label="In-House" val={inHouseCount} color={GRN} prefix="" />
        <StatCard label="Expected" val={expectedCount} color={ORA} prefix="" />
        <StatCard label="Past Stays" val={checkedOutCount} color={MUT} prefix="" />
        <StatCard label="Allergy Alerts" val={allergyCount} color={RED} prefix="" />
      </div>

      {gSub === 'add' && (
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 500, color: PR, marginBottom: 12 }}>New Guest Registration</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 10, marginBottom: 10 }}>
            <div className="field">
              <label>Guest Name *</label>
              <input placeholder="Full name" value={gName} onChange={(e) => setGName(e.target.value)} />
            </div>
            <div className="field">
              <label>Phone *</label>
              <input placeholder="e.g. +91 98765 43210" value={gPhone} onChange={(e) => setGPhone(e.target.value)} />
            </div>
            <div className="field">
              <label>Reg No (Front Office)</label>
              <input placeholder="e.g. SR-2024-001" value={gReg} onChange={(e) => setGReg(e.target.value)} />
            </div>
            <div className="field">
              <label>Nationality</label>
              <input placeholder="e.g. British" value={gNat} onChange={(e) => setGNat(e.target.value)} />
            </div>
            <div className="field">
              <label>Tent / Room *</label>
              <input placeholder="e.g. Tent 7" value={gTent} onChange={(e) => setGTent(e.target.value)} />
            </div>
            <div className="field">
              <label>Check-In</label>
              <input type="date" value={gIn} onChange={(e) => setGIn(e.target.value)} />
            </div>
            <div className="field">
              <label>Check-Out (Est.)</label>
              <input type="date" value={gOut} onChange={(e) => setGOut(e.target.value)} />
            </div>
            <div className="field">
              <label>Food Preference</label>
              <select value={gFood} onChange={(e) => setGFood(e.target.value)}>
                {FOOD_PREFS.map((o) => (
                  <option key={o} value={o}>
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={gStat} onChange={(e) => setGStat(e.target.value)}>
                <option value="in-house">In House</option>
                <option value="expected">Expected</option>
                <option value="checked-out">Checked Out</option>
              </select>
            </div>
            <div className="field">
              <label>Allergies</label>
              <input placeholder="e.g. Nuts, Dairy" value={gAllergy} onChange={(e) => setGAllergy(e.target.value)} />
            </div>
            <div className="field">
              <label>Dietary Notes</label>
              <input placeholder="e.g. No spicy food" value={gDiet} onChange={(e) => setGDiet(e.target.value)} />
            </div>
            <div className="field">
              <label>Experiences Opted</label>
              <input placeholder="e.g. Sundowner" value={gExp} onChange={(e) => setGExp(e.target.value)} />
            </div>
            <div className="field">
              <label>Chef Notes (internal)</label>
              <input placeholder="e.g. Anniversary stay" value={gChef} onChange={(e) => setGChef(e.target.value)} />
            </div>
          </div>
          {returningProfile && (
            <div className="info" style={{ marginBottom: 10 }}>
              <strong>Returning guest</strong> — matched by name + phone ({priorVisits.length} prior visit
              {priorVisits.length !== 1 ? 's' : ''} at this camp).
              {returningProfile.allergies && (
                <span style={{ display: 'block', marginTop: 4 }}>
                  Previous allergies: {returningProfile.allergies}
                </span>
              )}
              {returningProfile.diet_notes && (
                <span style={{ display: 'block' }}>Previous dietary notes: {returningProfile.diet_notes}</span>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setGFood(returningProfile.food_pref || gFood);
                  setGAllergy(returningProfile.allergies || gAllergy);
                  setGDiet(returningProfile.diet_notes || gDiet);
                  setGExp(returningProfile.experiences || gExp);
                  setGChef(returningProfile.chef_notes || gChef);
                }}
              >
                Apply previous preferences
              </button>
            </div>
          )}
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Feedback (if any)</label>
            <textarea rows={2} style={{ width: '100%', resize: 'vertical' }} value={gFB} onChange={(e) => setGFB(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={handleAddGuest}>
              Register Guest
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setGSub('list')}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {gSub === 'list' && campGuests.length > 0 && (
        <div className="tab-bar" style={{ marginBottom: 12 }}>
          {([
            ['all', 'All'],
            ['in-house', 'In House'],
            ['expected', 'Expected'],
            ['checked-out', 'Past'],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={`tab${guestFilter === k ? ' active' : ''}`}
              onClick={() => setGuestFilter(k)}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {gSub === 'list' &&
        (campGuests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: MUT, fontStyle: 'italic', padding: 24 }}>
            No guests registered for {CAMP_NAMES[campId]} yet. Run <code>supabase/seed.sql</code> or register a guest.
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: MUT, fontStyle: 'italic', padding: 24 }}>
            No guests in this filter.
          </div>
        ) : (
          filteredGuests.map((g) => {
            const inH = g.status === 'in-house';
            const isExpected = g.status === 'expected';
            const statusBadge = guestStatusBadge(g.status);
            const isReturning =
              g.profile_key &&
              allGuests.allGuests.filter((x) => x.camp_id === campId && x.profile_key === g.profile_key).length > 1;
            return (
              <div
                key={g.id}
                className="card"
                style={{
                  border: `1px solid ${inH ? GRN : isExpected ? ORA : '#d9cdb8'}`,
                  cursor: 'pointer',
                  marginBottom: 10,
                  opacity: g.status === 'checked-out' ? 0.92 : 1,
                }}
                onClick={() => {
                  setSelGuest(g.id);
                  setGSub('profile');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: PR }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: MUT, fontStyle: 'italic' }}>
                      {g.reg_no ? `${g.reg_no} · ` : ''}
                      {g.phone ? `${g.phone} · ` : ''}
                      {g.nationality ? `${g.nationality} · ` : ''}
                      Tent {g.tent || '—'} · {g.check_in || '—'} to {g.check_out || 'TBD'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {isReturning && (
                      <span className="badge" style={{ background: ORAL, color: ORA }}>
                        Returning
                      </span>
                    )}
                    {g.allergies && (
                      <span className="badge" style={{ background: REDL, color: RED }}>
                        Allergy: {g.allergies}
                      </span>
                    )}
                    <span className="badge" style={{ background: statusBadge.bg, color: statusBadge.color }}>
                      {statusBadge.label}
                    </span>
                    <span className="badge" style={{ background: '#f0ece6', color: MUT, textTransform: 'capitalize' }}>
                      {g.food_pref}
                    </span>
                  </div>
                </div>
                {g.chef_notes && (
                  <div style={{ marginTop: 5, fontSize: 11, color: BLU, fontStyle: 'italic' }}>Chef: {g.chef_notes}</div>
                )}
              </div>
            );
          })
        ))}

      {gSub === 'profile' && profileGuest && (() => {
        const g = profileGuest;
        const inH = g.status === 'in-house';
        const isExpected = g.status === 'expected';
        const logs = dishLogs[g.id] || [];
        const visitHistory = g.profile_key
          ? allGuests.allGuests
              .filter((x) => x.camp_id === campId && x.profile_key === g.profile_key)
              .sort((a, b) => (b.check_in || '').localeCompare(a.check_in || ''))
          : [];

        return (
          <div className="card" style={{ border: `2px solid ${inH ? GRN : isExpected ? ORA : '#d9cdb8'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: PR }}>{g.name}</div>
                <div style={{ fontSize: 11, color: MUT, fontStyle: 'italic' }}>
                  Profile ID {g.profile_id || g.id} · Stay {g.id.slice(0, 8)}…
                </div>
                <div style={{ fontSize: 11, color: MUT, fontStyle: 'italic' }}>
                  {g.reg_no || ''} · {g.phone || ''} · {g.nationality || ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {inH && (
                  <button
                    type="button"
                    className="btn btn-red btn-sm"
                    onClick={async () => {
                      try {
                        await updateGuest(g.id, {
                          status: 'checked-out',
                          check_out: new Date().toISOString().slice(0, 10),
                        });
                      } catch (e) {
                        alert(e instanceof Error ? e.message : 'Failed to check out');
                      }
                    }}
                  >
                    Check Out
                  </button>
                )}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setGSub('list')}>
                  Back
                </button>
              </div>
            </div>

            {visitHistory.length > 1 && (
              <div className="info" style={{ marginBottom: 12 }}>
                Returning guest — {visitHistory.length} visits on record at {CAMP_NAMES[campId]}.
              </div>
            )}

            {inH && (
              <div style={{ marginBottom: 12 }}>
                <PunchGuestOrderForm
                  guest={g}
                  dishes={campDishes.map((d) => ({ id: d.id, name: d.name }))}
                  onPunch={(payload) => kots.punchKot(payload)}
                />
              </div>
            )}

            {g.allergies && <div className="alert">Allergies / Intolerances: {g.allergies}</div>}
            {g.diet_notes && <div className="warn">Dietary Notes: {g.diet_notes}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginBottom: 12 }}>
              {([
                ['Tent', g.tent || '—'],
                ['Phone', g.phone || '—'],
                ['Check-In', g.check_in || '—'],
                ['Check-Out', g.check_out || '—'],
                ['Food Pref', g.food_pref],
              ] as const).map(([l, v]) => (
                <div key={l} style={{ background: '#f7f4f0', borderRadius: 3, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: MUT, fontStyle: 'italic', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>

            {g.experiences && (
              <div style={{ fontSize: 12, color: MUT, fontStyle: 'italic', marginBottom: 8 }}>Experiences: {g.experiences}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div className="field">
                <label>Chef Notes</label>
                <input
                  value={g.chef_notes || ''}
                  onChange={async (e) => {
                    try {
                      await updateGuest(g.id, { chef_notes: e.target.value });
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Failed to update');
                    }
                  }}
                />
              </div>
              <div className="field">
                <label>Feedback</label>
                <input
                  value={g.feedback || ''}
                  onChange={async (e) => {
                    try {
                      await updateGuest(g.id, { feedback: e.target.value });
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Failed to update');
                    }
                  }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #d9cdb8', paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Dishes Consumed — Guest Profile Log</div>
              <div style={{ fontSize: 11, color: MUT, fontStyle: 'italic', marginBottom: 8 }}>
                Separate from KOT — for guest preference tracking only
              </div>
              <div className="card" style={{ background: '#f7f4f0' }}>
                <div className="row">
                  <div className="field">
                    <label>Dish</label>
                    <select value={gdDish} onChange={(e) => setGdDish(e.target.value)} style={{ width: 200 }}>
                      <option value="">Select</option>
                      {campDishes.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Date</label>
                    <input type="date" value={gdDate} onChange={(e) => setGdDate(e.target.value)} style={{ width: 148 }} />
                  </div>
                  <div className="field">
                    <label>Meal</label>
                    <select value={gdMeal} onChange={(e) => setGdMeal(e.target.value)} style={{ width: 120 }}>
                      {MEAL_OPTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Notes</label>
                    <input placeholder="e.g. Loved it" value={gdNote} onChange={(e) => setGdNote(e.target.value)} style={{ width: 165 }} />
                  </div>
                  <button type="button" className="btn" style={{ alignSelf: 'flex-end' }} onClick={() => handleAddGuestDish(g.id)}>
                    Add
                  </button>
                </div>
              </div>
              {logs.length > 0 ? (
                <div className="card" style={{ padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Meal</th>
                        <th>Dish</th>
                        <th>Notes</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((d) => (
                        <tr key={d.id}>
                          <td>{d.date}</td>
                          <td>{d.meal}</td>
                          <td>{d.dish_name}</td>
                          <td style={{ color: MUT, fontStyle: 'italic', fontSize: 11 }}>{d.notes || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-red btn-sm"
                              onClick={async () => {
                                try {
                                  await removeGuestDish(g.id, d.id);
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : 'Failed to remove');
                                }
                              }}
                            >
                              x
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: MUT, fontStyle: 'italic', padding: '8px 0' }}>No dishes logged yet.</div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

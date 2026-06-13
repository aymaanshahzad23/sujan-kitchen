import { useState } from 'react';
import { useAppData } from '../context/AppContext';
import { CAMP_NAMES, MUT, PR, SECS } from '../constants';
import { fN } from '../utils/helpers';
import { resolveDishCostPrice } from '../lib/mappers';
import type { Dish, Section } from '../types/database';

export function ManageTab() {
  const { campId, dishes, kots } = useAppData();
  const cd = dishes.dishes;

  const [dN, setDN] = useState('');
  const [dC, setDC] = useState('');
  const [dSec, setDSec] = useState<Section>('indian');
  const [dCost, setDCost] = useState('');

  const handleAdd = async () => {
    if (!dN || !dCost) return;
    await dishes.addDish({
      name: dN,
      category: dC || 'Other',
      cost_price: +dCost,
      section: dSec,
    });
    setDN('');
    setDC('');
    setDCost('');
  };

  const handleRemove = async (d: Dish) => {
    await kots.removeKotsForDish(d.id);
    await dishes.removeDish(d.id);
  };

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, color: PR, marginBottom: 14 }}>
        Manage Dishes — {CAMP_NAMES[campId]}
      </h2>
      <div className="card">
        <div className="row">
          <div className="field">
            <label>Dish name</label>
            <input
              placeholder="e.g. Lamb Curry"
              value={dN}
              onChange={(e) => setDN(e.target.value)}
              style={{ width: 185 }}
            />
          </div>
          <div className="field">
            <label>Category</label>
            <input
              placeholder="e.g. Dinner"
              value={dC}
              onChange={(e) => setDC(e.target.value)}
              style={{ width: 120 }}
            />
          </div>
          <div className="field">
            <label>Section</label>
            <select
              value={dSec}
              onChange={(e) => setDSec(e.target.value as Section)}
              style={{ width: 160 }}
            >
              {Object.entries(SECS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Cost Price (Rs)</label>
            <input
              type="number"
              min="0"
              value={dCost}
              onChange={(e) => setDCost(e.target.value)}
              style={{ width: 110 }}
            />
          </div>
          <button type="button" className="btn" style={{ alignSelf: 'flex-end' }} onClick={handleAdd}>
            Add Dish
          </button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Dish</th>
              <th>Category</th>
              <th>Section</th>
              <th>Cost Price Rs</th>
              <th>KOTs</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cd.map((d) => {
              const sec = SECS[d.section] || { label: d.section, color: MUT, bg: '#f0ece6' };
              return (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.category}</td>
                  <td>
                    <span className="badge" style={{ background: sec.bg, color: sec.color, fontSize: 10 }}>
                      {sec.label}
                    </span>
                  </td>
                  <td>Rs {fN(resolveDishCostPrice(d))}</td>
                  <td>{kots.kots.filter((k) => k.dish_id === d.id).length}</td>
                  <td>
                    <button type="button" className="btn btn-red btn-sm" onClick={() => handleRemove(d)}>
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

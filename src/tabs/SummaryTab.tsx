import { useMemo } from 'react';
import { useAppData } from '../context/AppContext';
import { CAMP_NAMES, MUT, PR, Q, SECS } from '../constants';
import { classifyDishes, computeDishQuantities, type Quad } from '../utils/bcgChart';
import { kotToRec } from '../utils/helpers';
import { toLegacyDish, toLegacyKot } from '../lib/mappers';

export interface SummaryTabProps {
  view?: string;
  fk?: string;
}

export function SummaryTab({ view = 'all', fk = '' }: SummaryTabProps) {
  const { campId, dishes, kots } = useAppData();

  const cd = useMemo(() => dishes.dishes.map(toLegacyDish), [dishes.dishes]);

  const cr = useMemo(
    () => kotToRec(kots.kots.map(toLegacyKot)),
    [kots.kots],
  );

  const dishData = useMemo(
    () => computeDishQuantities(cd, cr, view, fk),
    [cd, cr, view, fk],
  );

  const clfed = useMemo(() => classifyDishes(dishData), [dishData]);

  const grpd = useMemo(() => {
    const g: Record<Quad, typeof clfed> = { star: [], plow: [], puzzle: [], dog: [] };
    clfed.forEach((d) => g[d.quad].push(d));
    return g;
  }, [clfed]);

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, color: PR, marginBottom: 14 }}>
        {CAMP_NAMES[campId]} — Performance Summary
      </h2>
      {Object.entries(Q).map(([qk, qd]) => {
        const ds = grpd[qk as Quad];
        return (
          <div
            key={qk}
            style={{
              background: qd.light,
              border: '2px solid ' + qd.color,
              borderRadius: 4,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 500, color: qd.color, marginBottom: 8 }}>
              {qd.emoji} {qd.label}{' '}
              <span style={{ fontSize: 11, fontWeight: 400, fontStyle: 'italic', color: MUT }}>
                — {ds.length} dish{ds.length !== 1 ? 'es' : ''}
              </span>
            </div>
            {ds.length === 0 ? (
              <div style={{ fontSize: 12, color: MUT, fontStyle: 'italic' }}>
                No dishes in this quadrant.
              </div>
            ) : (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #d9cdb8',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Dish</th>
                      <th>Category</th>
                      <th>Section</th>
                      <th>Qty</th>
                      <th>Cost Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...ds]
                      .sort((a, b) => b.qty - a.qty)
                      .map((d) => {
                        const s = SECS[d.section] || { label: d.section, color: MUT };
                        return (
                          <tr key={d.id}>
                            <td>{d.name}</td>
                            <td>{d.cat}</td>
                            <td style={{ color: s.color, fontStyle: 'italic', fontSize: 11 }}>
                              {s.label}
                            </td>
                            <td style={{ fontWeight: 500, color: qd.color }}>{d.qty}</td>
                            <td style={{ fontWeight: 500, color: qd.color }}>Rs {d.costPrice}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

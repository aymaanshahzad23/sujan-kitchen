import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppContext';
import { PBar } from '../components/PBar';
import { BcgChart } from '../components/BcgChart';
import { SECS, MUT, Q } from '../constants';
import { gM, gW, kotToRec } from '../utils/helpers';
import { classifyDishes, computeDishQuantities, chartDataset } from '../utils/bcgChart';
import { toLegacyDish, toLegacyKot } from '../lib/mappers';

interface AnalysisTabProps {
  view?: string;
  fk?: string;
  setView?: (v: string) => void;
  setFk?: (v: string) => void;
}

export function AnalysisTab(props: AnalysisTabProps = {}) {
  const { dishes, kots } = useAppData();
  const cd = useMemo(() => dishes.dishes.map(toLegacyDish), [dishes.dishes]);

  const [internalView, setInternalView] = useState('all');
  const [internalFk, setInternalFk] = useState('');
  const view = props.view ?? internalView;
  const fk = props.fk ?? internalFk;
  const setView = props.setView ?? setInternalView;
  const setFk = props.setFk ?? setInternalFk;

  const [hov, setHov] = useState<string | null>(null);

  const cr = useMemo(() => kotToRec(kots.kots.map(toLegacyKot)), [kots.kots]);

  const fopts = useMemo(
    () => ({
      day: [...new Set(cr.map((r) => r.date))].sort(),
      week: [...new Set(cr.map((r) => gW(r.date)))].sort(),
      month: [...new Set(cr.map((r) => gM(r.date)))].sort(),
    }),
    [cr],
  );

  const dishData = useMemo(
    () => computeDishQuantities(cd, cr, view, fk),
    [cd, cr, view, fk],
  );

  const clfed = useMemo(() => classifyDishes(dishData), [dishData]);

  const periodFiltered = view !== 'all' && !!fk;
  const chart = useMemo(
    () => chartDataset(clfed, periodFiltered),
    [clfed, periodFiltered],
  );

  const periodLabel =
    view !== 'all' && fk
      ? `${view}: ${fk}`
      : view !== 'all'
        ? `all ${view}s`
        : undefined;

  return (
    <div>
      <PBar per={view} setPer={setView} pKey={fk} setPKey={setFk} opts={fopts} />
      <div className="card">
        {chart.items.length === 0 && periodFiltered ? (
          <div style={{ fontSize: 13, color: MUT, fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>
            No guest KOT sales recorded for {view} {fk}.
          </div>
        ) : (
          <BcgChart
            items={chart.items}
            maxQty={chart.maxQty}
            minCost={chart.minCost}
            maxCost={chart.maxCost}
            avgQty={chart.avgQty}
            avgCost={chart.avgCost}
            hov={hov}
            setHov={setHov}
            periodLabel={periodLabel}
          />
        )}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
          {Object.entries(Q).map(([k, q]) => (
            <span key={k} style={{ fontSize: 12, color: q.color }}>
              {q.emoji} {q.label}
            </span>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Dish</th>
              <th>Category</th>
              <th>Section</th>
              <th>Qty Sold</th>
              <th>Cost Price</th>
              <th>Classification</th>
            </tr>
          </thead>
          <tbody>
            {[...clfed]
              .sort((a, b) => b.qty - a.qty)
              .map((d) => {
                const s = SECS[d.section as keyof typeof SECS] || {
                  label: d.section,
                  color: MUT,
                  bg: '#f0ece6',
                };
                return (
                  <tr
                    key={d.id}
                    style={{ background: hov === d.id ? '#faf8f5' : 'transparent' }}
                    onMouseEnter={() => setHov(d.id)}
                    onMouseLeave={() => setHov(null)}
                  >
                    <td>{d.name}</td>
                    <td>{d.cat}</td>
                    <td>
                      <span className="badge" style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ color: d.qty === 0 ? MUT : undefined }}>{d.qty}</td>
                    <td>Rs {d.costPrice}</td>
                    <td>
                      <span
                        className="badge"
                        style={{ background: Q[d.quad].light, color: Q[d.quad].color }}
                      >
                        {Q[d.quad].emoji} {Q[d.quad].label}
                      </span>
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

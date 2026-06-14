import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppContext';
import { AnalysisPeriodBar } from '../components/AnalysisPeriodBar';
import { BcgChart } from '../components/BcgChart';
import { SECS, MUT, PR, Q } from '../constants';
import { kotToRec } from '../utils/helpers';
import {
  ANALYSIS_PERIOD_LABELS,
  ANALYSIS_SECTIONS,
  analysisPeriodRange,
  classifyDishes,
  computeDishQuantities,
  chartDataset,
  type AnalysisPeriod,
} from '../utils/bcgChart';
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

  const [internalPeriod, setInternalPeriod] = useState<AnalysisPeriod>('all');
  const [internalSection, setInternalSection] = useState('all');
  const period = (props.view as AnalysisPeriod) ?? internalPeriod;
  const setPeriod = (v: AnalysisPeriod) => {
    if (props.setView) props.setView(v);
    else setInternalPeriod(v);
    if (props.setFk) props.setFk('');
  };
  const section = internalSection;
  const setSection = setInternalSection;

  const [hov, setHov] = useState<string | null>(null);

  const cr = useMemo(() => kotToRec(kots.kots.map(toLegacyKot)), [kots.kots]);

  const dishData = useMemo(
    () => computeDishQuantities(cd, cr, period, '', section),
    [cd, cr, period, section],
  );

  const clfed = useMemo(() => classifyDishes(dishData), [dishData]);

  const periodFiltered = period !== 'all';
  const chart = useMemo(
    () => chartDataset(clfed, periodFiltered),
    [clfed, periodFiltered],
  );

  const periodLabel = useMemo(() => {
    if (period === 'all') return undefined;
    const range = analysisPeriodRange(period);
    const sectionLabel = ANALYSIS_SECTIONS.find((s) => s.id === section)?.label;
    const base = ANALYSIS_PERIOD_LABELS[period];
    const rangeText = range ? ` (${range.from} → ${range.to})` : '';
    return section !== 'all' ? `${sectionLabel} · ${base}${rangeText}` : `${base}${rangeText}`;
  }, [period, section]);

  return (
    <div>
      <AnalysisPeriodBar period={period} setPeriod={setPeriod} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: MUT, fontStyle: 'italic', alignSelf: 'center' }}>Section:</span>
        {ANALYSIS_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="btn"
            style={{
              fontSize: 11,
              padding: '4px 11px',
              background: section === s.id ? PR : '#fff',
              color: section === s.id ? '#fff' : '#2a2418',
              border: '1px solid #d9cdb8',
            }}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="card">
        {chart.items.length === 0 && periodFiltered ? (
          <div style={{ fontSize: 13, color: MUT, fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>
            No guest KOT sales recorded for {periodLabel || 'this period'}.
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

import { useEffect } from 'react';
import { PR, MUT } from '../constants';

interface PBarProps {
  per: string;
  setPer: (v: string) => void;
  pKey: string;
  setPKey: (v: string) => void;
  opts: { day: string[]; week: string[]; month: string[] };
}

export function PBar({ per, setPer, pKey, setPKey, opts }: PBarProps) {
  const periodOpts = per !== 'all' ? opts[per as 'day' | 'week' | 'month'] || [] : [];

  // Clear stale period key when options change (e.g. camp switch or new KOTs)
  useEffect(() => {
    if (per !== 'all' && pKey && !periodOpts.includes(pKey)) {
      setPKey('');
    }
  }, [per, pKey, periodOpts, setPKey]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      <span style={{ fontSize: 11, color: MUT, fontStyle: 'italic' }}>Period:</span>
      {(['all', 'day', 'week', 'month'] as const).map((v) => (
        <button
          key={v}
          type="button"
          className="btn"
          style={{
            fontSize: 11,
            padding: '4px 11px',
            background: per === v ? PR : '#fff',
            color: per === v ? '#fff' : '#2a2418',
            border: '1px solid #d9cdb8',
          }}
          onClick={() => {
            setPer(v);
            setPKey('');
          }}
        >
          {v === 'all' ? 'All time' : v[0].toUpperCase() + v.slice(1)}
        </button>
      ))}
      {per !== 'all' && (
        <select style={{ fontSize: 12 }} value={pKey} onChange={(e) => setPKey(e.target.value)}>
          <option value="">All {per === 'day' ? 'days' : per === 'week' ? 'weeks' : 'months'}</option>
          {periodOpts.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

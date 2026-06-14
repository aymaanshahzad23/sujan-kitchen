import { PR, MUT } from '../constants';
import { ANALYSIS_PERIOD_LABELS, ANALYSIS_PERIODS, type AnalysisPeriod } from '../utils/bcgChart';

interface AnalysisPeriodBarProps {
  period: AnalysisPeriod;
  setPeriod: (v: AnalysisPeriod) => void;
}

export function AnalysisPeriodBar({ period, setPeriod }: AnalysisPeriodBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      <span style={{ fontSize: 11, color: MUT, fontStyle: 'italic' }}>Period:</span>
      {ANALYSIS_PERIODS.map((v) => (
        <button
          key={v}
          type="button"
          className="btn"
          style={{
            fontSize: 11,
            padding: '4px 11px',
            background: period === v ? PR : '#fff',
            color: period === v ? '#fff' : '#2a2418',
            border: '1px solid #d9cdb8',
          }}
          onClick={() => setPeriod(v)}
        >
          {ANALYSIS_PERIOD_LABELS[v]}
        </button>
      ))}
    </div>
  );
}

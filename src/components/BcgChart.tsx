import { useMemo, useState } from 'react';
import { PR, Q } from '../constants';
import {
  chartAvgLines,
  chartXAxisTicks,
  chartYAxisTicks,
  layoutChartPoints,
  CHART,
  BCG_BUBBLE_FILL_OPACITY,
  BCG_BUBBLE_HOVER_OPACITY,
  type ClassifiedDish,
  type PlacedPoint,
} from '../utils/bcgChart';
import { fN } from '../utils/helpers';

type TipState = { x: number; y: number; d: ClassifiedDish; popPct: number } | null;

interface BcgChartProps {
  items: ClassifiedDish[];
  maxQty: number;
  minCost: number;
  maxCost: number;
  avgQty: number;
  avgCost: number;
  hov: string | null;
  setHov: (id: string | null) => void;
  periodLabel?: string;
}

export function BcgChart({
  items,
  maxQty,
  minCost,
  maxCost,
  avgQty,
  avgCost,
  hov,
  setHov,
  periodLabel,
}: BcgChartProps) {
  const [tip, setTip] = useState<TipState>(null);

  const placed = useMemo(
    () => layoutChartPoints(items, maxQty, minCost, maxCost),
    [items, maxQty, minCost, maxCost],
  );
  const { aX, aY } = chartAvgLines(avgQty, avgCost, maxQty, minCost, maxCost);
  const xTicks = useMemo(() => chartXAxisTicks(minCost, maxCost), [minCost, maxCost]);
  const yTicks = useMemo(() => chartYAxisTicks(), []);
  const soldCount = items.length;

  return (
    <>
      <div style={{ fontSize: 11, color: '#6b5d4f', fontStyle: 'italic', marginBottom: 8 }}>
        X = Cost Price (Rs) · Y = Popularity % · Dashed = averages · Zero-sale dishes hidden
        {periodLabel ? (
          <span style={{ marginLeft: 8, color: '#8b6f47' }}>
            · {periodLabel} · {soldCount} dish{soldCount !== 1 ? 'es' : ''} with sales
          </span>
        ) : (
          <span style={{ marginLeft: 8, color: '#8b6f47' }}>
            · {soldCount} dish{soldCount !== 1 ? 'es' : ''} with sales
          </span>
        )}
      </div>
      <div className="bcg-chart">
        <svg
          viewBox="0 0 500 400"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="BCG matrix chart"
        >
        {/* Star: low cost + high popularity (top-left) */}
        <rect x="0" y="0" width={aX} height={aY} fill="#f0f7f3" opacity="0.5" />
        {/* Puzzle: high cost + high popularity (top-right) */}
        <rect x={aX} y="0" width={500 - aX} height={aY} fill="#eeeef8" opacity="0.5" />
        {/* Plow Horse: low cost + low popularity (bottom-left) */}
        <rect x="0" y={aY} width={aX} height={400 - aY} fill="#fdf6f0" opacity="0.5" />
        {/* Dog: high cost + low popularity (bottom-right) */}
        <rect x={aX} y={aY} width={500 - aX} height={400 - aY} fill="#f5f0eb" opacity="0.5" />

        <text x="8" y="22" fontSize="9" fill={Q.star.color} fontFamily="Georgia,serif" fontStyle="italic">
          Star
        </text>
        <text x={aX + 5} y="22" fontSize="9" fill={Q.puzzle.color} fontFamily="Georgia,serif" fontStyle="italic">
          Puzzle
        </text>
        <text x="8" y={CHART.bottom - 4} fontSize="9" fill={Q.plow.color} fontFamily="Georgia,serif" fontStyle="italic">
          Plow Horse
        </text>
        <text x={aX + 5} y={CHART.bottom - 4} fontSize="9" fill={Q.dog.color} fontFamily="Georgia,serif" fontStyle="italic">
          Dog
        </text>

        {yTicks.map((t) => (
          <line key={t.label} x1="44" y1={t.y} x2="490" y2={t.y} stroke="#d9cdb8" strokeWidth="0.5" />
        ))}
        {yTicks.map((t) => (
          <text key={`y-${t.label}`} x="39" y={t.y + 4} fontSize="7" fill="#6b5d4f" textAnchor="end">
            {t.label}
          </text>
        ))}

        {xTicks.map((t) => (
          <line key={t.label} x1={t.x} y1={CHART.bottom} x2={t.x} y2={CHART.bottom + 6} stroke="#d9cdb8" strokeWidth="0.5" />
        ))}
        {xTicks.map((t) => (
          <text key={`x-${t.label}`} x={t.x} y={CHART.bottom + 18} fontSize="7" fill="#6b5d4f" textAnchor="middle">
            {t.label}
          </text>
        ))}

        <text x="270" y="392" fontSize="8" fill="#6b5d4f" textAnchor="middle" fontFamily="Georgia,serif" fontStyle="italic">
          Cost Price (Rs) →
        </text>
        <text
          x="12"
          y="190"
          fontSize="8"
          fill="#6b5d4f"
          textAnchor="middle"
          fontFamily="Georgia,serif"
          fontStyle="italic"
          transform="rotate(-90 12 190)"
        >
          Popularity % →
        </text>

        <line x1={aX} y1="0" x2={aX} y2="400" stroke={PR} strokeWidth="0.8" strokeDasharray="4,4" opacity="0.3" />
        <line x1="0" y1={aY} x2="500" y2={aY} stroke={PR} strokeWidth="0.8" strokeDasharray="4,4" opacity="0.3" />

        {placed.map((d: PlacedPoint) => {
          const q = Q[d.quad];
          const isH = hov === d.id;
          const r = isH ? d.r + 3 : d.r;
          return (
            <g
              key={d.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                setHov(d.id);
                setTip({ x: e.clientX, y: e.clientY, d, popPct: d.popPct });
              }}
              onMouseLeave={() => {
                setHov(null);
                setTip(null);
              }}
            >
              <circle
                cx={d.cx}
                cy={d.cy}
                r={r}
                fill={q.color}
                fillOpacity={isH ? BCG_BUBBLE_HOVER_OPACITY : BCG_BUBBLE_FILL_OPACITY}
                stroke={isH ? '#2a2418' : 'none'}
                strokeWidth={isH ? 1.5 : 0}
              />
              <text
                x={d.cx}
                y={d.cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={d.name.length > 12 ? 5 : 6.5}
                fill="#fff"
                fontFamily="Georgia,serif"
                style={{ pointerEvents: 'none' }}
              >
                {d.name.length > 14 ? d.name.slice(0, 12) + '…' : d.name}
              </text>
            </g>
          );
        })}
        </svg>
      </div>

      {tip && (
        <div
          style={{
            position: 'fixed',
            left: tip.x,
            top: tip.y,
            transform: 'translate(-50%,-115%)',
            pointerEvents: 'none',
            background: '#2a2418',
            color: '#fff',
            padding: '7px 12px',
            borderRadius: 3,
            fontSize: 12,
            fontFamily: "'EB Garamond',Georgia,serif",
            zIndex: 999,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <strong>{tip.d.name}</strong>
          <br />
          {tip.popPct}% popularity · Rs {fN(tip.d.costPrice)} cost
          <br />
          <span style={{ color: Q[tip.d.quad].light }}>
            {Q[tip.d.quad].emoji} {Q[tip.d.quad].label}
          </span>
        </div>
      )}
    </>
  );
}

import type { LegacyDish } from '../types/database';
import { clf, gM, gW, type Quad } from './helpers';

export type { Quad };

export type ClassifiedDish = LegacyDish & { qty: number; quad: Quad };

export function computeDishQuantities(
  dishes: LegacyDish[],
  records: { dishId: string; date: string; qty: number }[],
  view: string,
  fk: string,
): (LegacyDish & { qty: number })[] {
  return dishes.map((d) => {
    let rel = records.filter((r) => r.dishId === d.id);
    if (view !== 'all' && fk) {
      rel = rel.filter((r) =>
        view === 'day' ? r.date === fk : view === 'week' ? gW(r.date) === fk : gM(r.date) === fk,
      );
    }
    return { ...d, qty: rel.reduce((s, r) => s + r.qty, 0) };
  });
}

export function classifyDishes(dishData: (LegacyDish & { qty: number })[]): ClassifiedDish[] {
  const avgQty = dishData.reduce((s, d) => s + d.qty, 0) / (dishData.length || 1);
  const avgCost = dishData.reduce((s, d) => s + d.costPrice, 0) / (dishData.length || 1);
  return dishData.map((d) => ({ ...d, quad: clf(d.qty, avgQty, d.costPrice, avgCost) }));
}

export interface ChartDataset {
  items: ClassifiedDish[];
  avgQty: number;
  avgCost: number;
  maxQty: number;
  minCost: number;
  maxCost: number;
}

/** Popularity as % of top seller (0–100), not absolute qty */
export function popularityPct(qty: number, maxQty: number): number {
  const maxQ = Math.max(maxQty, 1);
  return Math.round((qty / maxQ) * 1000) / 10;
}

/** Chart dataset: when a specific period is selected, show only sold dishes with recalculated averages */
export function chartDataset(
  classified: ClassifiedDish[],
  periodFiltered: boolean,
): ChartDataset {
  const costRange = (items: ClassifiedDish[]) => {
    const costs = items.map((d) => d.costPrice).filter((c) => Number.isFinite(c) && c > 0);
    const min = costs.length ? Math.min(...costs) : 150;
    const max = costs.length ? Math.max(...costs) : 800;
    return { minCost: min, maxCost: Math.max(max, min + 50) };
  };

  if (!periodFiltered) {
    const sold = classified.filter((d) => d.qty > 0);
    const maxQty = Math.max(...sold.map((d) => d.qty), 1);
    const avgQty = classified.reduce((s, d) => s + d.qty, 0) / (classified.length || 1);
    const avgCost = classified.reduce((s, d) => s + d.costPrice, 0) / (classified.length || 1);
    const { minCost, maxCost } = costRange(sold.length ? sold : classified);
    return { items: sold, avgQty, avgCost, maxQty, minCost, maxCost };
  }

  const sold = classified.filter((d) => d.qty > 0);
  if (sold.length === 0) {
    return { items: [], avgQty: 0, avgCost: 0, maxQty: 1, minCost: 0, maxCost: 1 };
  }

  const avgQty = sold.reduce((s, d) => s + d.qty, 0) / sold.length;
  const avgCost = sold.reduce((s, d) => s + d.costPrice, 0) / sold.length;
  const maxQty = Math.max(...sold.map((d) => d.qty), 1);
  const { minCost, maxCost } = costRange(sold);
  const items = sold.map((d) => ({ ...d, quad: clf(d.qty, avgQty, d.costPrice, avgCost) }));
  return { items, avgQty, avgCost, maxQty, minCost, maxCost };
}

const CHART = { left: 50, right: 490, top: 28, bottom: 355, width: 440, height: 327 };
const CHART_PAD = 14;

/** Chart fill — semi-transparent so overlaps blend visually */
export const BCG_BUBBLE_FILL_OPACITY = 0.5;
export const BCG_BUBBLE_HOVER_OPACITY = 0.82;

/** Original sujan-dashboard.html bubble sizing — do not replace with popularity-based caps */
export const BCG_BUBBLE_MIN_RADIUS = 12;
export const BCG_BUBBLE_QTY_BASE = 10;
export const BCG_BUBBLE_QTY_SCALE = 0.6;
/** Typical all-time top-seller qty in the HTML demo — used to match on-screen bubble size */
export const BCG_BUBBLE_HTML_REFERENCE_TOP_QTY = 300;

export function rawBubbleRadius(qty: number): number {
  return Math.max(
    BCG_BUBBLE_MIN_RADIUS,
    BCG_BUBBLE_QTY_BASE + Math.sqrt(Math.max(qty, 0)) * BCG_BUBBLE_QTY_SCALE,
  );
}

/** Large bubbles scaled by sales volume — matches original HTML dashboard on-screen size */
export function bubbleRadius(qty: number, maxQty: number = 1): number {
  const raw = rawBubbleRadius(qty);
  const topRaw = rawBubbleRadius(maxQty);
  const htmlTopR = rawBubbleRadius(BCG_BUBBLE_HTML_REFERENCE_TOP_QTY);
  if (topRaw >= htmlTopR) return raw;
  const scale = htmlTopR / topRaw;
  return Math.max(BCG_BUBBLE_MIN_RADIUS, Math.min(htmlTopR, raw * scale));
}

function clampPoint(cx: number, cy: number, r: number) {
  return {
    cx: Math.max(CHART.left + r + 2, Math.min(CHART.right - r - 2, cx)),
    cy: Math.max(CHART.top + r + 2, Math.min(CHART.bottom - r - 2, cy)),
  };
}

/** X axis: cost price (Rs) — low left, high right */
export function chartXCost(cost: number, minCost: number, maxCost: number): number {
  const safeCost = Number.isFinite(cost) ? cost : minCost;
  const span = CHART.right - CHART.left - CHART_PAD * 2;
  const range = Math.max(maxCost - minCost, 1);
  return CHART.left + CHART_PAD + ((safeCost - minCost) / range) * span;
}

/** Y axis: popularity % (0–100) — low bottom, high top */
export function chartYPop(pct: number): number {
  const safe = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  return CHART.bottom - (safe / 100) * (CHART.bottom - CHART.top);
}

export type PlacedPoint = ClassifiedDish & { cx: number; cy: number; r: number; popPct: number };

/** Place each menu dish at its cost × popularity coordinates — overlap is fine */
export function layoutChartPoints(
  items: ClassifiedDish[],
  maxQty: number,
  minCost: number,
  maxCost: number,
): PlacedPoint[] {
  return items
    .map((d) => {
      const popPct = popularityPct(d.qty, maxQty);
      const r = bubbleRadius(d.qty, maxQty);
      const { cx, cy } = clampPoint(
        chartXCost(d.costPrice, minCost, maxCost),
        chartYPop(popPct),
        r,
      );
      return { ...d, popPct, cx, cy, r };
    })
    .sort((a, b) => a.popPct - b.popPct || a.costPrice - b.costPrice);
}

export function chartAvgLines(
  avgQty: number,
  avgCost: number,
  maxQty: number,
  minCost: number,
  maxCost: number,
) {
  return {
    aX: chartXCost(avgCost, minCost, maxCost),
    aY: chartYPop(popularityPct(avgQty, maxQty)),
  };
}

export function chartXAxisTicks(minCost: number, maxCost: number): { x: number; label: string }[] {
  const range = Math.max(maxCost - minCost, 1);
  return [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const cost = minCost + f * range;
    return { x: chartXCost(cost, minCost, maxCost), label: String(Math.round(cost)) };
  });
}

export function chartYAxisTicks(): { y: number; label: string }[] {
  return [0, 25, 50, 75, 100].map((pct) => ({
    y: chartYPop(pct),
    label: `${pct}%`,
  }));
}

export { CHART };

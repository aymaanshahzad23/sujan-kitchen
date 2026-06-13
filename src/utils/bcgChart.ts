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
    const maxQty = Math.max(...classified.map((d) => d.qty), 1);
    const avgQty = classified.reduce((s, d) => s + d.qty, 0) / (classified.length || 1);
    const avgCost = classified.reduce((s, d) => s + d.costPrice, 0) / (classified.length || 1);
    const sold = classified.filter((d) => d.qty > 0);
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
const BUBBLE_GAP = 5;

/** Original sujan-dashboard.html bubble sizing — do not replace with popularity-based caps */
export const BCG_BUBBLE_MIN_RADIUS = 12;
export const BCG_BUBBLE_QTY_BASE = 10;
export const BCG_BUBBLE_QTY_SCALE = 0.6;

function hashUnit(id: string, salt = 0): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 1000) + 1000) % 1000 / 1000;
}

/** Large bubbles scaled by sales volume — matches original HTML dashboard */
export function bubbleRadius(qty: number): number {
  return Math.max(
    BCG_BUBBLE_MIN_RADIUS,
    BCG_BUBBLE_QTY_BASE + Math.sqrt(Math.max(qty, 0)) * BCG_BUBBLE_QTY_SCALE,
  );
}

function clampPoint(cx: number, cy: number, r: number) {
  return {
    cx: Math.max(CHART.left + r + 2, Math.min(CHART.right - r - 2, cx)),
    cy: Math.max(CHART.top + r + 2, Math.min(CHART.bottom - r - 2, cy)),
  };
}

function bubblesOverlap(
  a: { cx: number; cy: number; r: number },
  b: { cx: number; cy: number; r: number },
  gap = BUBBLE_GAP,
): boolean {
  const dx = a.cx - b.cx;
  const dy = a.cy - b.cy;
  return Math.sqrt(dx * dx + dy * dy) < a.r + b.r + gap;
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

type LayoutDraft = PlacedPoint & { idealCx: number; idealCy: number };

/** Spread overlapping bubbles so labels remain readable */
export function layoutChartPoints(
  items: ClassifiedDish[],
  maxQty: number,
  minCost: number,
  maxCost: number,
): PlacedPoint[] {
  const raw = items
    .map((d) => {
      const popPct = popularityPct(d.qty, maxQty);
      const r = bubbleRadius(d.qty);
      const jitterX = (hashUnit(d.id, 1) - 0.5) * 10;
      const jitterY = (hashUnit(d.id, 2) - 0.5) * 8;
      const idealCx = chartXCost(d.costPrice, minCost, maxCost) + jitterX;
      const idealCy = chartYPop(popPct) + jitterY;
      const { cx, cy } = clampPoint(idealCx, idealCy, r);
      return { ...d, popPct, idealCx, idealCy, cx, cy, r };
    })
    .sort((a, b) => b.popPct - a.popPct || a.costPrice - b.costPrice);

  const placed: LayoutDraft[] = [];
  const golden = 2.399963;

  for (const p of raw) {
    let { cx, cy } = p;
    let attempts = 0;

    while (attempts < 64) {
      const hit = placed.find((q) => bubblesOverlap({ cx, cy, r: p.r }, q));
      if (!hit) break;
      const angle = attempts * golden;
      const radius = (p.r + hit.r + BUBBLE_GAP) * (0.75 + attempts * 0.08);
      cx = p.idealCx + Math.cos(angle) * radius;
      cy = p.idealCy + Math.sin(angle) * radius;
      ({ cx, cy } = clampPoint(cx, cy, p.r));
      attempts++;
    }

    placed.push({ ...p, cx, cy });
  }

  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const minDist = a.r + b.r + BUBBLE_GAP;
        if (dist >= minDist) continue;
        const push = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        const aPos = clampPoint(a.cx - nx * push, a.cy - ny * push, a.r);
        const bPos = clampPoint(b.cx + nx * push, b.cy + ny * push, b.r);
        a.cx = aPos.cx;
        a.cy = aPos.cy;
        b.cx = bPos.cx;
        b.cy = bPos.cy;
      }
    }

    const pull = pass < 6 ? 0.1 : 0;
    if (pull > 0) {
      for (const p of placed) {
        p.cx += (p.idealCx - p.cx) * pull;
        p.cy += (p.idealCy - p.cy) * pull;
        ({ cx: p.cx, cy: p.cy } = clampPoint(p.cx, p.cy, p.r));
      }
    }
  }

  for (let fix = 0; fix < 24; fix++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const minDist = a.r + b.r + BUBBLE_GAP;
        if (dist >= minDist) continue;
        const push = (minDist - dist) / 2 + 0.5;
        const nx = dx / dist;
        const ny = dy / dist;
        const aPos = clampPoint(a.cx - nx * push, a.cy - ny * push, a.r);
        const bPos = clampPoint(b.cx + nx * push, b.cy + ny * push, b.r);
        if (aPos.cx !== a.cx || aPos.cy !== a.cy || bPos.cx !== b.cx || bPos.cy !== b.cy) moved = true;
        a.cx = aPos.cx;
        a.cy = aPos.cy;
        b.cx = bPos.cx;
        b.cy = bPos.cy;
      }
    }
    if (!moved) break;
  }

  return placed.map(({ idealCx: _i, idealCy: _j, ...rest }) => rest as PlacedPoint);
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

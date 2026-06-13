import { describe, expect, it } from 'vitest';
import type { ClassifiedDish } from './bcgChart';
import {
  bubbleRadius,
  chartXCost,
  chartYPop,
  layoutChartPoints,
  popularityPct,
} from './bcgChart';

function dish(id: string, qty: number, costPrice: number): ClassifiedDish {
  return {
    id,
    name: id,
    cat: 'Test',
    costPrice,
    section: 'western',
    qty,
    quad: 'star',
  };
}

describe('popularityPct', () => {
  it('returns 0–100% relative to top seller', () => {
    expect(popularityPct(50, 50)).toBe(100);
    expect(popularityPct(25, 50)).toBe(50);
    expect(popularityPct(0, 50)).toBe(0);
  });
});

describe('bcg chart coordinates', () => {
  it('maps cost on X and popularity % on Y', () => {
    expect(chartXCost(200, 100, 400)).toBeGreaterThan(chartXCost(150, 100, 400));
    expect(chartYPop(80)).toBeLessThan(chartYPop(20));
    expect(chartYPop(0)).toBeGreaterThan(chartYPop(100));
  });
});

describe('layoutChartPoints', () => {
  it('keeps jittered bubbles inside chart bounds', () => {
    const placed = layoutChartPoints(
      Array.from({ length: 8 }, (_, i) => dish(`d${i}`, 5 + i * 2, 120 + i * 30)),
      20,
      100,
      350,
    );
    for (const p of placed) {
      expect(p.cx).toBeGreaterThanOrEqual(50);
      expect(p.cx).toBeLessThanOrEqual(490);
      expect(p.cy).toBeGreaterThanOrEqual(28);
      expect(p.cy).toBeLessThanOrEqual(355);
      expect(p.popPct).toBeGreaterThanOrEqual(0);
      expect(p.popPct).toBeLessThanOrEqual(100);
      expect(p.r).toBeGreaterThanOrEqual(12);
    }
  });

  it('separates overlapping bubbles at identical coordinates', () => {
    const items = [
      dish('a', 10, 200),
      dish('b', 10, 200),
      dish('c', 10, 205),
      dish('d', 10, 205),
    ];
    const placed = layoutChartPoints(items, 10, 100, 350);
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const dx = placed[i].cx - placed[j].cx;
        const dy = placed[i].cy - placed[j].cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(dist).toBeGreaterThanOrEqual(placed[i].r + placed[j].r + 2);
      }
    }
  });
});

describe('bubbleRadius', () => {
  it('uses original HTML dashboard sizing (min 12px, scales with sqrt qty)', () => {
    expect(bubbleRadius(0)).toBe(12);
    expect(bubbleRadius(1)).toBe(12);
    expect(bubbleRadius(25)).toBeCloseTo(13, 0);
    expect(bubbleRadius(100)).toBeCloseTo(16, 0);
  });

  it('never caps radius at compact popularity-based size (~10px)', () => {
    expect(bubbleRadius(5)).toBeGreaterThanOrEqual(12);
    expect(bubbleRadius(100)).toBeGreaterThan(12);
  });
});

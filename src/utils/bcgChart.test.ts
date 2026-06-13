import { describe, expect, it } from 'vitest';
import type { ClassifiedDish } from './bcgChart';
import {
  bubbleRadius,
  chartDataset,
  chartXCost,
  chartYPop,
  layoutChartPoints,
  popularityPct,
  rawBubbleRadius,
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

describe('chartDataset', () => {
  it('hides zero-sale dishes from the chart', () => {
    const classified = [
      dish('sold', 12, 200),
      dish('unsold', 0, 150),
    ];
    const chart = chartDataset(classified, false);
    expect(chart.items).toHaveLength(1);
    expect(chart.items[0].id).toBe('sold');
  });
});

describe('layoutChartPoints', () => {
  it('places bubbles at cost × popularity coordinates within chart bounds', () => {
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
    expect(placed[0].r).toBeGreaterThan(15);
  });

  it('allows overlap when dishes share similar cost and popularity', () => {
    const items = [dish('a', 10, 200), dish('b', 10, 200)];
    const placed = layoutChartPoints(items, 10, 100, 350);
    expect(placed[0].cx).toBe(placed[1].cx);
    expect(placed[0].cy).toBe(placed[1].cy);
  });
});

describe('bubbleRadius', () => {
  it('uses original HTML formula at high volumes', () => {
    expect(rawBubbleRadius(0)).toBe(12);
    expect(rawBubbleRadius(25)).toBeCloseTo(13, 0);
    expect(rawBubbleRadius(300)).toBeCloseTo(20.4, 0);
  });

  it('boosts radii toward HTML on-screen size when period totals are lower', () => {
    expect(bubbleRadius(25, 25)).toBeCloseTo(20.4, 0);
    expect(bubbleRadius(11, 25)).toBeGreaterThan(17);
    expect(bubbleRadius(300, 300)).toBeCloseTo(20.4, 0);
  });

  it('never caps radius at compact popularity-based size (~10px)', () => {
    expect(bubbleRadius(5, 25)).toBeGreaterThanOrEqual(12);
    expect(bubbleRadius(25, 25)).toBeGreaterThan(15);
  });
});

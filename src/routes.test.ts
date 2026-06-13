import { describe, expect, it } from 'vitest';
import {
  campTabPath,
  DEFAULT_PATH,
  firstTabInSection,
  isCampId,
  isMainTab,
  normalizeCampTabPath,
  parseCampTabPath,
} from './routes';

describe('routes', () => {
  it('builds camp + tab paths', () => {
    expect(campTabPath('jawai', 'kot')).toBe('/jawai/kot');
    expect(campTabPath('sherbagh', 'guests')).toBe('/sherbagh/guests');
  });

  it('validates camps and tabs', () => {
    expect(isCampId('jawai')).toBe(true);
    expect(isCampId('invalid')).toBe(false);
    expect(isMainTab('staff-leaves')).toBe(true);
    expect(isMainTab('nope')).toBe(false);
  });

  it('parses valid dashboard paths', () => {
    expect(parseCampTabPath('/jawai/analysis')).toEqual({ camp: 'jawai', tab: 'analysis' });
    expect(parseCampTabPath('/serai/staff-roster')).toEqual({ camp: 'serai', tab: 'staff-roster' });
    expect(parseCampTabPath('/jawai')).toBeNull();
    expect(parseCampTabPath('/jawai/unknown')).toBeNull();
  });

  it('normalizes invalid paths to the default dashboard route', () => {
    expect(normalizeCampTabPath('/jawai/kot')).toBe('/jawai/kot');
    expect(normalizeCampTabPath('/bad/path')).toBe(DEFAULT_PATH);
  });

  it('maps sections to their first tab', () => {
    expect(firstTabInSection('staff')).toBe('staff-roster');
    expect(firstTabInSection('guests')).toBe('guests');
  });
});

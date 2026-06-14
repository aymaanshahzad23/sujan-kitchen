/** Normalize Supabase / ISO date strings to YYYY-MM-DD */
export function normalizeDate(d: string): string {
  return String(d).slice(0, 10);
}

/** Parse YYYY-MM-DD as local calendar date (avoids UTC timezone shifts) */
export function parseDateLocal(d: string): Date {
  const [y, m, day] = normalizeDate(d).split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function gW(d: string): string {
  const dt = parseDateLocal(d);
  const j = new Date(dt.getFullYear(), 0, 1);
  const week = Math.ceil(((dt.getTime() - j.getTime()) / 86400000 + j.getDay() + 1) / 7);
  return dt.getFullYear() + '-W' + String(week).padStart(2, '0');
}

export function gM(d: string): string {
  return normalizeDate(d).slice(0, 7);
}

export type Quad = 'star' | 'plow' | 'puzzle' | 'dog';

export function clf(q: number, aQ: number, cost: number, aCost: number): Quad {
  const lowCost = cost <= aCost;
  if (q >= aQ && lowCost) return 'star';
  if (q >= aQ && !lowCost) return 'puzzle';
  if (q < aQ && lowCost) return 'plow';
  return 'dog';
}

/** Display dates as DD/MM/YYYY across the dashboard */
export function formatDateDisplay(date: string | null | undefined): string {
  if (!date) return '—';
  const [y, m, d] = normalizeDate(date).split('-');
  if (!y || !m || !d) return date;
  return `${d}/${m}/${y}`;
}

export const fN = (n: number) => Number(n || 0).toLocaleString('en-IN');
export const fP = (n: number) => Math.round(n * 10) / 10 + '%';

export const nowS = () =>
  new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function kotToRec(kots: { type: string; dishId: string; date: string; qty: number }[]) {
  return kots
    .filter((k) => k.type === 'Guest')
    .map((k) => ({ dishId: k.dishId, date: normalizeDate(k.date), qty: k.qty }));
}

export function getSundaysInMonth(year: number, month: number): number {
  let c = 0;
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === 0) c++;
    d.setDate(d.getDate() + 1);
  }
  return c;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthDates(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDateLocal(dateStr);
  d.setDate(d.getDate() + n);
  return formatDateLocal(d);
}

export function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Inclusive date range as YYYY-MM-DD strings (local calendar, no UTC shift) */
export function eachDateInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = parseDateLocal(from);
  const end = parseDateLocal(to);
  while (cur <= end) {
    dates.push(formatDateLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function toCSV(rows: unknown[][], hdrs: string[]): string {
  const e = (v: unknown) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  return [hdrs.map(e).join(','), ...rows.map((r) => r.map(e).join(','))].join('\r\n');
}

export function dlCSV(c: string, fn: string) {
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(c);
  a.download = fn;
  a.click();
}

export function dlHTML(h: string, fn: string) {
  const b = new Blob([h], { type: 'text/html;charset=utf-8' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u;
  a.download = fn;
  a.click();
}

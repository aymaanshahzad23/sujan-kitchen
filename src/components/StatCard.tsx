import { PR } from '../constants';
import { fN } from '../utils/helpers';

interface StatCardProps {
  label: string;
  val: number | string;
  color?: string;
  prefix?: string;
}

export function StatCard({ label, val, color, prefix }: StatCardProps) {
  const pfx = prefix !== undefined ? prefix : 'Rs';
  return (
    <div className="stat">
      <div className="sl">{label}</div>
      <div className="sv" style={{ color: color || PR }}>
        {pfx}
        {typeof val === 'number' ? fN(val) : val}
      </div>
    </div>
  );
}

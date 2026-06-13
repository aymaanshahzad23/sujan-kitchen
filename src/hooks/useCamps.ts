import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import type { Camp, CampId } from '../types/database';

export function useCamps() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('camps').select('*').order('id');
    if (err) setError(err.message);
    else {
      setCamps(data || []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'camps' }], refresh);

  const updateCampValues = async (
    campId: CampId,
    opening_stock_value: number,
    purchases_value: number,
  ) => {
    const { error: err } = await supabase
      .from('camps')
      .update({ opening_stock_value, purchases_value })
      .eq('id', campId);
    if (err) throw err;
    setCamps((prev) =>
      prev.map((c) =>
        c.id === campId ? { ...c, opening_stock_value, purchases_value } : c,
      ),
    );
  };

  return { camps, loading, error, refresh, updateCampValues };
}

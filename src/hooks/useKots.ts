import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import type { CampId, Kot, KotType } from '../types/database';

export function useKots(campId: CampId) {
  const [kots, setKots] = useState<Kot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('kots')
      .select('*')
      .eq('camp_id', campId)
      .order('date', { ascending: false });
    if (err) setError(err.message);
    else {
      setKots(data || []);
      setError(null);
    }
    setLoading(false);
  }, [campId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'kots', filter: `camp_id=eq.${campId}` }], refresh);

  const punchKot = async (input: {
    dish_id: string;
    date: string;
    qty: number;
    type: KotType;
    revenue: number;
    tent?: string | null;
    guest_id?: string | null;
  }) => {
    const optimistic: Kot = {
      id: `temp-${Date.now()}`,
      camp_id: campId,
      dish_id: input.dish_id,
      date: input.date,
      qty: input.qty,
      type: input.type,
      revenue: input.revenue,
      tent: input.tent ?? null,
      guest_id: input.guest_id ?? null,
      created_at: new Date().toISOString(),
    };
    setKots((prev) => [...prev, optimistic]);

    const { data, error: err } = await supabase
      .from('kots')
      .insert({ camp_id: campId, ...input })
      .select()
      .single();

    if (err) {
      setKots((prev) => prev.filter((k) => k.id !== optimistic.id));
      throw err;
    }
    setKots((prev) => prev.map((k) => (k.id === optimistic.id ? data : k)));
    return data;
  };

  const removeKotsForDish = async (dishId: string) => {
    const { error: err } = await supabase.from('kots').delete().eq('dish_id', dishId);
    if (err) throw err;
    setKots((prev) => prev.filter((k) => k.dish_id !== dishId));
  };

  return { kots, loading, error, refresh, punchKot, removeKotsForDish };
}

export function useAllKots() {
  const [kotsByCamp, setKotsByCamp] = useState<Record<CampId, Kot[]>>({
    jawai: [],
    sherbagh: [],
    serai: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('kots').select('*').order('date');
    const grouped: Record<CampId, Kot[]> = { jawai: [], sherbagh: [], serai: [] };
    for (const k of data || []) grouped[k.camp_id as CampId].push(k);
    setKotsByCamp(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'kots' }], refresh);

  return { kotsByCamp, loading, refresh };
}

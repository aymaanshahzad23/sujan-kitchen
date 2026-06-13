import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import type { CampId, Dish, Section } from '../types/database';

export function useDishes(campId: CampId) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('dishes')
      .select('*')
      .eq('camp_id', campId)
      .order('name');
    if (err) setError(err.message);
    else {
      setDishes(data || []);
      setError(null);
    }
    setLoading(false);
  }, [campId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'dishes', filter: `camp_id=eq.${campId}` }], refresh);

  const addDish = async (input: {
    name: string;
    category: string;
    cost_price: number;
    section: Section;
  }) => {
    const { data, error: err } = await supabase
      .from('dishes')
      .insert({ camp_id: campId, ...input })
      .select()
      .single();
    if (err) throw err;
    setDishes((prev) => [...prev, data]);
    return data;
  };

  const removeDish = async (id: string) => {
    const { error: err } = await supabase.from('dishes').delete().eq('id', id);
    if (err) throw err;
    setDishes((prev) => prev.filter((d) => d.id !== id));
  };

  return { dishes, loading, error, refresh, addDish, removeDish };
}

export function useAllDishes() {
  const [dishesByCamp, setDishesByCamp] = useState<Record<CampId, Dish[]>>({
    jawai: [],
    sherbagh: [],
    serai: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('dishes').select('*').order('name');
    const grouped: Record<CampId, Dish[]> = { jawai: [], sherbagh: [], serai: [] };
    for (const d of data || []) grouped[d.camp_id as CampId].push(d);
    setDishesByCamp(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'dishes' }], refresh);

  return { dishesByCamp, loading, refresh };
}

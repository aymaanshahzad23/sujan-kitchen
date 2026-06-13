import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import type { CampId, Guest, GuestDishLog } from '../types/database';

export function useGuests(campId: CampId) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [dishLogs, setDishLogs] = useState<Record<string, GuestDishLog[]>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: guestData } = await supabase
      .from('guests')
      .select('*')
      .eq('camp_id', campId)
      .order('name');
    const guestIds = (guestData || []).map((g) => g.id);
    let logs: GuestDishLog[] = [];
    if (guestIds.length > 0) {
      const { data: logData } = await supabase
        .from('guest_dish_logs')
        .select('*')
        .in('guest_id', guestIds);
      logs = logData || [];
    }
    const logMap: Record<string, GuestDishLog[]> = {};
    for (const l of logs) {
      if (!logMap[l.guest_id]) logMap[l.guest_id] = [];
      logMap[l.guest_id].push(l);
    }
    setGuests(guestData || []);
    setDishLogs(logMap);
    setLoading(false);
  }, [campId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription(
    [
      { table: 'guests', filter: `camp_id=eq.${campId}` },
      { table: 'guest_dish_logs' },
    ],
    refresh,
  );

  const addGuest = async (input: Omit<Guest, 'id'>) => {
    const { data, error } = await supabase.from('guests').insert(input).select().single();
    if (error) throw error;
    setGuests((prev) => [...prev, data]);
    return data;
  };

  const updateGuest = async (id: string, updates: Partial<Guest>) => {
    const { data, error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setGuests((prev) => prev.map((g) => (g.id === id ? data : g)));
    return data;
  };

  const addGuestDish = async (input: {
    guest_id: string;
    dish_id: string;
    dish_name: string;
    date: string;
    meal: string;
    notes: string;
  }) => {
    const { data, error } = await supabase
      .from('guest_dish_logs')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    setDishLogs((prev) => ({
      ...prev,
      [input.guest_id]: [...(prev[input.guest_id] || []), data],
    }));
    return data;
  };

  const removeGuestDish = async (guestId: string, logId: string) => {
    const { error } = await supabase.from('guest_dish_logs').delete().eq('id', logId);
    if (error) throw error;
    setDishLogs((prev) => ({
      ...prev,
      [guestId]: (prev[guestId] || []).filter((l) => l.id !== logId),
    }));
  };

  return {
    guests,
    dishLogs,
    loading,
    refresh,
    addGuest,
    updateGuest,
    addGuestDish,
    removeGuestDish,
  };
}

export function useAllGuests() {
  const [allGuests, setAllGuests] = useState<Guest[]>([]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('guests').select('*');
    setAllGuests(data || []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'guests' }], refresh);

  return { allGuests, refresh };
}

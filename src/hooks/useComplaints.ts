import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtime';
import type { CampId, Complaint } from '../types/database';

export function useComplaints(campId: CampId) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('camp_id', campId)
      .order('date', { ascending: false });
    setComplaints(data || []);
    setLoading(false);
  }, [campId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'complaints', filter: `camp_id=eq.${campId}` }], refresh);

  const addComplaint = async (input: {
    dish_id: string | null;
    date: string;
    type: string;
    severity: string;
    description: string;
    reporter: string;
  }) => {
    const { data, error } = await supabase
      .from('complaints')
      .insert({ camp_id: campId, ...input })
      .select()
      .single();
    if (error) throw error;
    setComplaints((prev) => [data, ...prev]);
    return data;
  };

  return { complaints, loading, refresh, addComplaint };
}

export function useAllComplaints() {
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('complaints').select('*');
    setAllComplaints(data || []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'complaints' }], refresh);

  return { allComplaints, refresh };
}

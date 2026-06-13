import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { reconcileCompOffCredits } from '../utils/leave';
import { useRealtimeSubscription } from './useRealtime';
import type { CampId, CompOff, LeaveRecord, LeaveSplit, LeaveStatus, PublicHoliday, StaffMember } from '../types/database';

export function useStaff(campId?: CampId) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [compOffs, setCompOffs] = useState<CompOff[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  const syncCompOffCredits = useCallback(
    async (staffData: StaffMember[], leaveData: LeaveRecord[], compOffData: CompOff[]) => {
      const { toAdd, toRemoveIds, toUpdate } = reconcileCompOffCredits(staffData, leaveData, compOffData);
      if (toRemoveIds.length > 0) {
        const { error } = await supabase.from('comp_offs').delete().in('id', toRemoveIds);
        if (error) throw error;
      }
      for (const row of toUpdate) {
        const { error } = await supabase.from('comp_offs').update({ expiry: row.expiry }).eq('id', row.id);
        if (error) throw error;
      }
      if (toAdd.length > 0) {
        const { error } = await supabase.from('comp_offs').insert(toAdd);
        if (error) throw error;
      }
      return toAdd.length > 0 || toRemoveIds.length > 0 || toUpdate.length > 0;
    },
    [],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('comp_offs').delete().lt('expiry', today).eq('used', false);

    const [staffRes, leaveRes, coRes, phRes] = await Promise.all([
      campId
        ? supabase.from('staff').select('*').eq('camp_id', campId).order('name')
        : supabase.from('staff').select('*').order('name'),
      supabase.from('leave_records').select('*').order('date_from', { ascending: false }),
      supabase.from('comp_offs').select('*'),
      supabase.from('public_holidays').select('*').order('date'),
    ]);
    const staffData = staffRes.data || [];
    const leaveData = leaveRes.data || [];
    let compOffData = coRes.data || [];

    try {
      const changed = await syncCompOffCredits(staffData, leaveData, compOffData);
      if (changed) {
        const { data } = await supabase.from('comp_offs').select('*');
        compOffData = data || [];
      }
    } catch {
      // Keep loaded data if sync fails (e.g. offline)
    }

    setStaff(staffData);
    setLeaveRecords(leaveData);
    setCompOffs(compOffData);
    setPublicHolidays(phRes.data || []);
    setLoading(false);
  }, [campId, syncCompOffCredits]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription(
    [
      ...(campId ? [{ table: 'staff', filter: `camp_id=eq.${campId}` }] : [{ table: 'staff' }]),
      { table: 'leave_records' },
      { table: 'comp_offs' },
      { table: 'public_holidays' },
    ],
    refresh,
  );

  const addStaff = async (input: Omit<StaffMember, 'id'>) => {
    const { data, error } = await supabase.from('staff').insert(input).select().single();
    if (error) throw error;
    setStaff((prev) => [...prev, data]);
    return data;
  };

  const removeStaff = async (id: string) => {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) throw error;
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  const applyLeave = async (input: {
    staff_id: string;
    type: string;
    date_from: string;
    date_to: string;
    note: string;
    status: LeaveStatus;
    splits?: LeaveSplit[];
  }) => {
    const { data, error } = await supabase
      .from('leave_records')
      .insert({
        staff_id: input.staff_id,
        type: input.type,
        date_from: input.date_from,
        date_to: input.date_to,
        note: input.note,
        status: input.status,
        splits: input.splits || null,
      })
      .select()
      .single();
    if (error) throw error;
    setLeaveRecords((prev) => [...prev, data]);
    await refresh();
    return data;
  };

  const updateLeaveStatus = async (id: string, status: LeaveStatus) => {
    const { error } = await supabase.from('leave_records').update({ status }).eq('id', id);
    if (error) throw error;
    setLeaveRecords((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await refresh();
  };

  const deleteLeave = async (id: string) => {
    const { error } = await supabase.from('leave_records').delete().eq('id', id);
    if (error) throw error;
    setLeaveRecords((prev) => prev.filter((l) => l.id !== id));
    await refresh();
  };

  const markCompOffsUsed = async (ids: string[]) => {
    if (ids.length === 0) return;
    const { error } = await supabase.from('comp_offs').update({ used: true }).in('id', ids);
    if (error) throw error;
    setCompOffs((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, used: true } : c)));
  };

  const addCompOffs = async (rows: Omit<CompOff, 'id'>[]) => {
    const { data, error } = await supabase.from('comp_offs').insert(rows).select();
    if (error) throw error;
    setCompOffs((prev) => [...prev, ...(data || [])]);
    return data;
  };

  const addPublicHoliday = async (date: string, name: string) => {
    const { data, error } = await supabase
      .from('public_holidays')
      .insert({ date, name })
      .select()
      .single();
    if (error) throw error;
    setPublicHolidays((prev) => [...prev, data]);
    return data;
  };

  const removePublicHoliday = async (id: string) => {
    const { error } = await supabase.from('public_holidays').delete().eq('id', id);
    if (error) throw error;
    setPublicHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  return {
    staff,
    leaveRecords,
    compOffs,
    publicHolidays,
    loading,
    refresh,
    addStaff,
    removeStaff,
    applyLeave,
    updateLeaveStatus,
    deleteLeave,
    markCompOffsUsed,
    addCompOffs,
    addPublicHoliday,
    removePublicHoliday,
  };
}

export function useAllStaff() {
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('staff').select('*').order('name');
    setAllStaff(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtimeSubscription([{ table: 'staff' }], refresh);

  return { allStaff, loading, refresh };
}

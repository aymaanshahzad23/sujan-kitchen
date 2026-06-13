import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export type RealtimeTableConfig = {
  table: string;
  /** Supabase filter, e.g. `camp_id=eq.jawai` */
  filter?: string;
};

/**
 * Subscribe to Postgres changes and call `onChange` (debounced).
 * Requires tables to be added to the `supabase_realtime` publication.
 */
export function useRealtimeSubscription(
  configs: RealtimeTableConfig[],
  onChange: () => void,
  enabled = true,
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const configsKey = JSON.stringify(configs);

  useEffect(() => {
    if (!enabled || configs.length === 0) return;

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    const notify = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => onChangeRef.current(), 250);
    };

    const channelName = `rt-${configs.map((c) => `${c.table}${c.filter ?? ''}`).join('-')}`;
    let channel = supabase.channel(channelName);

    for (const cfg of configs) {
      const opts: {
        event: '*';
        schema: 'public';
        table: string;
        filter?: string;
      } = { event: '*', schema: 'public', table: cfg.table };
      if (cfg.filter) opts.filter = cfg.filter;
      channel = channel.on('postgres_changes', opts, notify);
    }

    channel.subscribe();

    return () => {
      clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
    };
  }, [configsKey, enabled, configs.length]);
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Hospital } from '@/lib/types';

export function useHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChange, setLastChange] = useState<{ id: string; at: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase.from('hospitals').select('*').order('id');
    if (error || !Array.isArray(data)) {
      setError('We could not load facility information. Please try again.');
      return null;
    }
    setError(null);
    return data as Hospital[];
  }, []);

  const reload = useCallback(async () => {
    setRefreshing(true);
    const data = await fetchAll();
    if (data) setHospitals(data);
    setRefreshing(false);
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await fetchAll();
      if (!active) return;
      if (data) setHospitals(data);
      setLoading(false);
    })();

    const channel = supabase
      .channel('hospitals-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hospitals' }, (payload) => {
        const next = payload.new as Hospital;
        if (!next?.id) return;
        setHospitals((prev) => prev.map((h) => (h.id === next.id ? next : h)));
        setLastChange({ id: next.id, at: Date.now() });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return { hospitals, setHospitals, loading, error, lastChange, reload, refreshing };
}

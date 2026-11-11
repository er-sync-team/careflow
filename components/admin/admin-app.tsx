'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCopy } from '@/components/i18n-provider';
import { AuthForm, FacilityClaim } from './auth-form';
import { Dashboard } from './dashboard';

export function AdminApp({ facilityHint }: { facilityHint?: string }) {
  const loadErrorText = useCopy({ en: 'We could not load your facility assignment.', ar: 'تعذر تحميل المنشأة المرتبطة بحسابك.' });
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setHospitalId(null);
      return;
    }
    let active = true;
    setChecking(true);
    (async () => {
      const { data, error } = await supabase.from('hospital_admins').select('hospital_id').eq('user_id', userId).maybeSingle();
      if (!active) return;
      if (error) setLoadError(loadErrorText);
      setHospitalId(data?.hospital_id ?? null);
      setChecking(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!ready || checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!session) return <AuthForm initialFacility={facilityHint} />;
  if (loadError) return <p className="mx-auto max-w-md rounded-xl bg-red-50 p-4 text-sm text-red-800">{loadError}</p>;
  if (!hospitalId) return <FacilityClaim onAssigned={setHospitalId} />;
  return <Dashboard hospitalId={hospitalId} email={session.user.email ?? ''} />;
}

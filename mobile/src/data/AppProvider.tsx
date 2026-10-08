import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState as NativeAppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { File } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import type { Session } from '@supabase/supabase-js';
import { isConfigured, requireClient, supabase } from './client';
import { createDemo, demoOpportunities, type DemoSnapshot } from './demo';
import { localDate, safeEmail, timerMinutes, validatePassword, validateService } from './domain';
import { applicationBlocker } from './opportunities';
import type { AppState, Application, Mode, Opportunity, Profile, ProfilePatch, ServiceEntry, ServiceInput, StaffOrganization, Timer } from './models';

const DEMO_KEY = 'voluforge.demo.v1';
const Context = createContext<AppState | undefined>(undefined);
type Records = Pick<AppState, 'profile' | 'opportunities' | 'savedIds' | 'applications' | 'entries' | 'timer' | 'staffOrganizations' | 'reviewApplications' | 'reviewEntries' | 'outcomes' | 'matchingProfiles' | 'research' | 'impactConfigured' | 'nativeImpactConfigured'>;
const empty = (): Records => ({ profile: null, opportunities: [], savedIds: [], applications: [], entries: [], timer: null, staffOrganizations: [], reviewApplications: [], reviewEntries: [], outcomes: [], matchingProfiles: [], research: [], impactConfigured: false, nativeImpactConfigured: false });
const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const message = (error: unknown) => error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'Something went wrong. Please try again.';
type Row = Record<string, any>;

async function allRows(table: string, options: { filter?: [string, string]; nullColumn?: string; order?: string } = {}): Promise<Row[]> {
  const client = requireClient();
  const result: Row[] = [];
  for (let page = 0; page < 100; page++) {
    let query = client.from(table).select('*').order(options.order || 'id').range(page * 1000, page * 1000 + 999);
    if (options.filter) query = query.eq(options.filter[0], options.filter[1]);
    if (options.nullColumn) query = query.is(options.nullColumn, null);
    const { data, error } = await query;
    if (error) throw error;
    result.push(...data);
    if (data.length < 1000) return result;
  }
  throw new Error('Your records exceed the current download limit. Please contact support.');
}

function demoRecords(snapshot: DemoSnapshot): Records {
  return { ...empty(), ...snapshot, opportunities: demoOpportunities(), outcomes: snapshot.outcomes ?? createDemo().outcomes ?? [], impactConfigured: true, nativeImpactConfigured: true };
}

export function AppProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<Mode>('signedOut');
  const modeRef = useRef<Mode>('signedOut');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [records, setRecordsState] = useState<Records>(empty);
  const recordsRef = useRef(records);
  const demoRef = useRef<DemoSnapshot | null>(null);
  const userRef = useRef<string | null>(null);
  const persistenceRef = useRef<Promise<unknown>>(Promise.resolve());
  const pendingRef = useRef(0);
  const mounted = useRef(true);

  const setMode = useCallback((next: Mode) => { modeRef.current = next; setModeState(next); }, []);
  const setRecords = useCallback((next: Records) => { recordsRef.current = next; setRecordsState(next); }, []);
  const persistDemo = useCallback(async (snapshot: DemoSnapshot) => {
    demoRef.current = snapshot;
    setRecords(demoRecords(snapshot));
    persistenceRef.current = persistenceRef.current.catch(() => {}).then(() => AsyncStorage.setItem(DEMO_KEY, JSON.stringify(snapshot)));
    await persistenceRef.current;
  }, [setRecords]);

  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    pendingRef.current += 1;
    setLoading(true);
    setError(null);
    try { return await task(); }
    catch (failure) {
      const detail = message(failure);
      setError(detail);
      throw new Error(detail);
    } finally {
      pendingRef.current -= 1;
      if (mounted.current) setLoading(pendingRef.current > 0);
    }
  }, []);

  const loadLive = useCallback(async (session: Session) => {
    const userId = session.user.id;
    const [profiles, organizations, memberships, opportunityRows, saved, applicationRows, entryRows, timers, availability] = await Promise.all([
      allRows('vf_profiles'), allRows('vf_organizations'),
      allRows('vf_org_staff', { filter: ['user_id', userId], order: 'org_id' }),
      allRows('vf_opportunities'), allRows('vf_saved', { filter: ['user_id', userId], order: 'opportunity_id' }),
      allRows('vf_applications'), allRows('vf_service_entries'),
      allRows('vf_service_timers', { filter: ['student_id', userId], nullColumn: 'stopped_at' }),
      requireClient().rpc('vf_available_spots'),
    ]);
    const outcomeResult: {data:Row[]|null;error:any} = await allRows('vf_outcomes').then(data=>({data,error:null})).catch(error=>({data:null,error}));
    const summaryResult = await requireClient().rpc('vf_research_summary');
    const nativeCapability = await requireClient().rpc('vf_mobile_impact_ready');
    if(nativeCapability.error && !['PGRST202','42883'].includes(nativeCapability.error.code)) throw nativeCapability.error;
    const missingImpact = ['PGRST205','42P01'].includes(outcomeResult.error?.code ?? '');
    if(outcomeResult.error && !missingImpact) throw outcomeResult.error;
    if(summaryResult.error && !['PGRST202','42883'].includes(summaryResult.error.code)) throw summaryResult.error;
    if (availability.error) throw availability.error;
    const spotsById = new Map<string, number>((availability.data || []).map((row: Row) => [row.opportunity_id, row.spots_left]));
    if (!mounted.current || userRef.current !== userId || modeRef.current !== 'live') return;
    const ownProfile = profiles.find(row => row.id === userId);
    if (!ownProfile) throw new Error('Your profile is unavailable. Try again, or retry account deletion if you previously requested it.');
    const profileById = new Map(profiles.map(row => [row.id, row]));
    const orgById = new Map(organizations.map(row => [row.id, row]));
    const staffOrganizations: StaffOrganization[] = memberships.filter(row => row.active).map(row => ({ id: row.org_id, name: orgById.get(row.org_id)?.name || 'Organization', role: row.role }));
    const staffIds = new Set(staffOrganizations.map(org => org.id));
    const opportunities: Opportunity[] = opportunityRows.map(row => ({
      id: row.id, organizationId: row.org_id, organization: orgById.get(row.org_id)?.name || 'Community organization',
      title: row.title, description: row.description, cause: row.category, location: row.location || (row.remote ? 'Remote' : ''),
      address: row.address || row.location || '', latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined,
      startsAt: row.starts_at, endsAt: row.ends_at, capacity: row.capacity, spotsLeft: spotsById.get(row.id) ?? -1,
      minimumExperience: row.min_experience ?? 0, urgency: row.urgency ?? 1, outcomeMetric: row.outcome_metric, outcomeTarget: Number(row.outcome_target ?? 0),
      minimumAge: row.min_age, skills: row.skills || [], requirements: row.requirements || [`Ages ${row.min_age}+`, ...(row.proof_required ? ['Proof of service is required'] : [])],
      proofRequired: row.proof_required, imageUrl: row.image_url || '', remote: row.remote,
      status: row.status === 'published' ? 'open' : row.status === 'closed' ? 'closed' : 'archived',
    }));
    const opportunityById = new Map(opportunities.map(row => [row.id, row]));
    const applications: Application[] = applicationRows.map(row => ({
      id: row.id, studentId: row.student_id, studentName: profileById.get(row.student_id)?.full_name,
      opportunityId: row.opportunity_id, statement: row.message, availability: row.availability,
      status: row.status, createdAt: row.created_at, reviewerNote: row.decision_note || undefined,
    }));
    const applicationById = new Map(applications.map(row => [row.id, row]));
    const entries: ServiceEntry[] = entryRows.map(row => ({
      id: row.id, studentId: row.student_id, studentName: profileById.get(row.student_id)?.full_name,
      applicationId: row.application_id, opportunityId: applicationById.get(row.application_id)?.opportunityId || '',
      date: row.service_date, minutes: row.minutes, notes: row.notes, proofURL: row.proof_path || undefined,
      status: row.status, createdAt: row.created_at, reviewerNote: row.review_note || undefined,
      reviewedAt: row.reviewed_at || undefined, reviewerName: row.reviewer_id ? (profileById.get(row.reviewer_id)?.full_name || 'Nonprofit reviewer') : undefined,
    }));
    const profile: Profile = { id: userId, name: ownProfile.full_name || '', email: session.user.email || '', school: ownProfile.school || '', bio: ownProfile.bio || '', skills: ownProfile.skills || [], causes: ownProfile.causes || [], goalHours: ownProfile.goal_hours, preferences: ownProfile.service_preferences, role: staffOrganizations.length ? 'staff' : 'student' };
    setRecords({
      profile, opportunities,
      outcomes: (outcomeResult.data ?? []).map(r=>({id:r.id,service_entry_id:r.service_entry_id,metric:r.metric,quantity:Number(r.quantity),evidence:r.evidence,status:r.status,review_note:r.review_note,reviewed_at:r.reviewed_at})),
      research: (summaryResult.data ?? []).map((r:Row)=>({...r,volunteers:Number(r.volunteers),returning_volunteers:Number(r.returning_volunteers),verified_hours:Number(r.verified_hours)})),
      impactConfigured: !outcomeResult.error, nativeImpactConfigured: nativeCapability.data===true,
      matchingProfiles: profiles.map(r=>({id:r.id,name:r.full_name,email:'',school:'',bio:'',skills:r.skills??[],causes:r.causes??[],goalHours:r.goal_hours,role:'student',preferences:r.service_preferences})),
      savedIds: saved.map(row => row.opportunity_id),
      applications: applications.filter(row => row.studentId === userId), entries: entries.filter(row => row.studentId === userId),
      timer: timers.length ? { id: timers[0].id, applicationId: timers[0].application_id, startedAt: timers[0].started_at } : null,
      staffOrganizations,
      reviewApplications: applications.filter(row => staffIds.has(opportunityById.get(row.opportunityId)?.organizationId || '')),
      reviewEntries: entries.filter(row => staffIds.has(opportunityById.get(row.opportunityId)?.organizationId || '')),
    });
  }, [setRecords]);

  const session = useCallback(async () => {
    const { data, error: authError } = await requireClient().auth.getSession();
    if (authError) throw authError;
    if (!data.session) throw new Error('Please sign in to continue.');
    return data.session;
  }, []);

  const refresh = useCallback(() => run(async () => {
    if (modeRef.current === 'demo' && demoRef.current) { setRecords(demoRecords(demoRef.current)); return; }
    if (modeRef.current === 'live') await loadLive(await session());
  }), [loadLive, run, session, setRecords]);

  const handleAuthURL = useCallback(async (url: string | null) => {
    if (!url || !supabase) return;
    const parsed = Linking.parse(url);
    const isNativeCallback = parsed.scheme === 'voluforge' && (parsed.hostname === 'auth' || parsed.path?.includes('auth/callback'));
    const isExpoCallback = (parsed.scheme === 'exp' || parsed.scheme === 'exps') && parsed.path?.includes('auth/callback');
    const isWebCallback = Platform.OS === 'web' && typeof location !== 'undefined' && url.startsWith(location.origin + '/auth/callback');
    if (!isNativeCallback && !isExpoCallback && !isWebCallback) return;
    const query = new URLSearchParams(url.split('?')[1]?.split('#')[0] || '');
    const hash = new URLSearchParams(url.split('#')[1] || '');
    const value = (key: string) => query.get(key) || hash.get(key);
    const callbackError = value('error_description');
    if (callbackError) throw new Error(callbackError);
    const code = value('code');
    const tokenHash = value('token_hash');
    const type = value('type');
    if (type === 'recovery') setPasswordRecovery(true);
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    } else if (tokenHash && (type === 'recovery' || type === 'email' || type === 'signup')) {
      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (verifyError) throw verifyError;
    } else if (value('access_token') && value('refresh_token')) {
      const { error: tokenError } = await supabase.auth.setSession({ access_token: value('access_token')!, refresh_token: value('refresh_token')! });
      if (tokenError) throw tokenError;
    }
    if (Platform.OS === 'web' && typeof history !== 'undefined') history.replaceState({}, '', '/');
  }, []);

  useEffect(() => {
    mounted.current = true;
    let initializing = true;
    const applySession = async (nextSession: Session | null) => {
      if (nextSession) {
        userRef.current = nextSession.user.id;
        if (modeRef.current !== 'live') setRecords(empty());
        setMode('live');
        await loadLive(nextSession);
      } else if (modeRef.current === 'live') {
        userRef.current = null;
        setMode('signedOut');
        setRecords(empty());
      }
    };
    const auth = supabase?.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (initializing) return;
      // Keep Supabase network calls outside the auth listener's internal lock.
      setTimeout(() => { if (mounted.current) void applySession(nextSession).catch(failure => setError(message(failure))); }, 0);
    });
    const linkListener = Linking.addEventListener('url', event => { void handleAuthURL(event.url).catch(failure => setError(message(failure))); });
    const appListener = NativeAppState.addEventListener('change', state => {
      if (state === 'active') { supabase?.auth.startAutoRefresh(); }
      else { supabase?.auth.stopAutoRefresh(); }
    });
    void (async () => {
      try {
        await handleAuthURL(await Linking.getInitialURL());
        const current = supabase ? await supabase.auth.getSession() : null;
        if (current?.error) throw current.error;
        if (current?.data.session) await applySession(current.data.session);
        else {
          const saved = await AsyncStorage.getItem(DEMO_KEY);
          if (saved && mounted.current) {
            try {
              const restored = JSON.parse(saved) as DemoSnapshot;
              if (restored.version === 1 && restored.profile?.id === 'demo-student' && Array.isArray(restored.entries) && Array.isArray(restored.applications) && Array.isArray(restored.savedIds)) {
                demoRef.current = restored;
                setMode('demo');
                setRecords(demoRecords(restored));
              }
            } catch { await AsyncStorage.removeItem(DEMO_KEY); }
          }
        }
      } catch (failure) { if (mounted.current) setError(message(failure)); }
      finally { initializing = false; if (mounted.current) setReady(true); }
    })();
    return () => { mounted.current = false; auth?.data.subscription.unsubscribe(); linkListener.remove(); appListener.remove(); };
  }, [handleAuthURL, loadLive, setMode, setRecords]);

  const redirectURL = () => Platform.OS === 'web' ? new URL('/auth/callback', window.location.origin).toString() : Linking.createURL('auth/callback');
  const rpc = async (name: string, args: Row) => {
    const result = await requireClient().rpc(name, args);
    if (result.error) throw result.error;
    return result.data;
  };
  const requireDemo = () => {
    if (!demoRef.current) throw new Error('Open the demo first.');
    return demoRef.current;
  };

  const signIn = (email: string, password: string) => run(async () => {
    const { data, error: authError } = await requireClient().auth.signInWithPassword({ email: safeEmail(email), password });
    if (authError) throw authError;
    userRef.current = data.session.user.id;
    setMode('live');
    setRecords(empty());
    await loadLive(data.session);
  });
  const signUp: AppState['signUp'] = input => run(async () => {
    validatePassword(input.password);
    if (input.name.trim().length < 2) throw new Error('Enter your name.');
    const { data, error: authError } = await requireClient().auth.signUp({ email: safeEmail(input.email), password: input.password, options: { data: { full_name: input.name.trim() }, emailRedirectTo: redirectURL() } });
    if (authError) throw authError;
    if (data.session) { userRef.current = data.session.user.id; setMode('live'); setRecords(empty()); await loadLive(data.session); }
    return { confirmationRequired: !data.session };
  });
  const resetPassword = (email: string) => run(async () => {
    const { error: authError } = await requireClient().auth.resetPasswordForEmail(safeEmail(email), { redirectTo: redirectURL() });
    if (authError) throw authError;
  });
  const updatePassword = (password: string) => run(async () => {
    validatePassword(password);
    const { error: authError } = await requireClient().auth.updateUser({ password });
    if (authError) throw authError;
    setPasswordRecovery(false);
  });
  const signOut = () => run(async () => {
    if (modeRef.current === 'live') {
      const { error: authError } = await requireClient().auth.signOut({ scope: 'local' });
      if (authError) throw authError;
    }
    // Signing out of demo clears it so reopening the app stays at sign-in.
    await persistenceRef.current.catch(() => {});
    await AsyncStorage.removeItem(DEMO_KEY);
    demoRef.current = null;
    userRef.current = null;
    setPasswordRecovery(false);
    setMode('signedOut');
    setRecords(empty());
  });
  const enterDemo = () => run(async () => {
    if (modeRef.current === 'live') throw new Error('Sign out before opening the demo.');
    userRef.current = null;
    setMode('demo');
    await persistDemo(demoRef.current || createDemo());
  });
  const resetDemo = () => run(async () => {
    if (modeRef.current !== 'demo') throw new Error('Demo can only be reset while exploring the demo.');
    await persistDemo(createDemo());
  });
  const saveOpportunity = (id: string) => run(async () => {
    if (modeRef.current === 'demo') {
      const draft = requireDemo();
      await persistDemo({ ...draft, savedIds: draft.savedIds.includes(id) ? draft.savedIds.filter(value => value !== id) : [...draft.savedIds, id] });
    } else {
      const current = await session();
      const saved = recordsRef.current.savedIds.includes(id);
      const result = saved ? await requireClient().from('vf_saved').delete().eq('user_id', current.user.id).eq('opportunity_id', id) : await requireClient().from('vf_saved').insert({ user_id: current.user.id, opportunity_id: id });
      if (result.error) throw result.error;
      await loadLive(current);
    }
  });
  const apply: AppState['apply'] = (opportunityId, statement, availability) => run(async () => {
    if (statement.trim().length < 10) throw new Error('Write a short introduction of at least 10 characters.');
    if (availability.trim().length < 2) throw new Error('Tell the organization when you’re available.');
    if (modeRef.current === 'demo') {
      const draft = requireDemo();
      const opportunity = recordsRef.current.opportunities.find(row => row.id === opportunityId);
      if (!opportunity) throw new Error('This opportunity is not accepting applications.');
      const blocked = applicationBlocker(opportunity, draft.applications.find(row => row.opportunityId === opportunityId));
      if (blocked) throw new Error(blocked);
      const application: Application = { id: newId('demo-app'), opportunityId, studentId: draft.profile.id, studentName: draft.profile.name, statement: statement.trim(), availability: availability.trim(), status: 'pending', createdAt: new Date().toISOString(), demo: true };
      await persistDemo({ ...draft, applications: [...draft.applications, application] });
    } else { await rpc('vf_apply_to_opportunity', { p_opportunity_id: opportunityId, p_message: statement.trim(), p_availability: availability.trim() }); await loadLive(await session()); }
  });
  const withdraw = (applicationId: string) => run(async () => {
    if (modeRef.current === 'demo') {
      const draft = requireDemo();
      const application = draft.applications.find(row => row.id === applicationId);
      if (!application || !['pending', 'accepted'].includes(application.status)) throw new Error('This application cannot be withdrawn.');
      if (draft.timer?.applicationId === applicationId) throw new Error('Finish or cancel your running timer first.');
      if (draft.entries.some(row => row.applicationId === applicationId)) throw new Error('Applications with submitted service must remain in your record.');
      await persistDemo({ ...draft, applications: draft.applications.map(row => row.id === applicationId ? { ...row, status: 'withdrawn' } : row) });
    } else { await rpc('vf_withdraw_application', { p_application_id: applicationId }); await loadLive(await session()); }
  });
  const submitService = (input: ServiceInput) => run(async () => {
    const current = recordsRef.current;
    const application = current.applications.find(row => row.id === input.applicationId);
    validateService(input, application, current.opportunities.find(row => row.id === application?.opportunityId));
    if(input.outcome && (!Number.isFinite(input.outcome.quantity)||input.outcome.quantity<=0||input.outcome.quantity>1e9||input.outcome.evidence.trim().length<10)) throw new Error('Add a positive outcome quantity and evidence of at least 10 characters.');
    if (modeRef.current === 'demo') {
      const draft = requireDemo();
      if (input.entryId && !draft.entries.some(e => e.id === input.entryId && e.status === 'changes_requested')) throw new Error('Only entries returned for changes can be revised.');
      const entry: ServiceEntry = { ...input, id: input.entryId || newId('demo-service'), studentId: draft.profile.id, studentName: draft.profile.name, opportunityId: application!.opportunityId, status: 'pending', notes: input.notes.trim(), createdAt: new Date().toISOString(), demo: true };
      await persistDemo({ ...draft, entries: [entry, ...draft.entries.filter(e => e.id !== input.entryId)], outcomes: input.outcome ? [...(draft.outcomes??[]).filter(r=>r.service_entry_id!==entry.id),{id:newId('demo-outcome'),service_entry_id:entry.id,...input.outcome,status:'pending',review_note:'',reviewed_at:null}] : draft.outcomes });
    } else {
      if(input.outcome && input.entryId && !recordsRef.current.nativeImpactConfigured) throw new Error('The native outcome resubmission upgrade is awaiting deployment. Submit hours, then add the outcome after the upgrade.');
      if(input.outcome && !input.entryId && !recordsRef.current.nativeImpactConfigured) await rpc('vf_submit_impact',{p_application_id:input.applicationId,p_service_date:input.date,p_minutes:input.minutes,p_notes:input.notes.trim(),p_proof_path:input.proofURL||null,p_metric:input.outcome.metric,p_quantity:input.outcome.quantity,p_evidence:input.outcome.evidence.trim()});
      else if(input.outcome) await rpc('vf_submit_mobile_impact',{p_application_id:input.applicationId,p_service_date:input.date,p_minutes:input.minutes,p_notes:input.notes.trim(),p_proof_path:input.proofURL||null,p_entry_id:input.entryId||null,p_metric:input.outcome.metric,p_quantity:input.outcome.quantity,p_evidence:input.outcome.evidence.trim()});
      else await rpc('vf_submit_service', { p_application_id: input.applicationId, p_service_date: input.date, p_minutes: input.minutes, p_notes: input.notes.trim(), p_proof_path: input.proofURL || null, p_entry_id: input.entryId || null });
      await loadLive(await session());
    }
  });
  const startTimer = (applicationId: string) => run(async () => {
    const current = recordsRef.current;
    if (current.timer && current.timer.applicationId !== applicationId) throw new Error('Finish your current timer before starting another.');
    const application = current.applications.find(row => row.id === applicationId);
    if (application?.status !== 'accepted') throw new Error('Your application must be accepted before starting a timer.');
    const opportunity = current.opportunities.find(o=>o.id===application.opportunityId);
    if (opportunity && Date.parse(opportunity.startsAt)>Date.now()) throw new Error('This opportunity has not started yet.');
    if (modeRef.current === 'demo') {
      if (current.timer) return;
      const draft = requireDemo();
      await persistDemo({ ...draft, timer: { id: newId('demo-timer'), applicationId, startedAt: new Date().toISOString() } });
    } else { await rpc('vf_start_timer', { p_application_id: applicationId }); await loadLive(await session()); }
  });
  const stopTimer: AppState['stopTimer'] = (notes, proofURL) => run(async () => {
    const current = recordsRef.current;
    const timer = current.timer;
    if (!timer) throw new Error('There is no running timer.');
    const minutes = timerMinutes(timer.startedAt);
    const application = current.applications.find(row => row.id === timer.applicationId);
    const input: ServiceInput = { applicationId: timer.applicationId, date: localDate(new Date(timer.startedAt)), minutes, notes, proofURL };
    validateService(input, application, current.opportunities.find(row => row.id === application?.opportunityId));
    if (modeRef.current === 'demo') {
      const draft = requireDemo();
      const entry: ServiceEntry = { ...input, id: newId('demo-service'), studentId: draft.profile.id, studentName: draft.profile.name, opportunityId: application!.opportunityId, status: 'pending', createdAt: new Date().toISOString(), demo: true };
      await persistDemo({ ...draft, timer: null, entries: [entry, ...draft.entries] });
      return minutes;
    }
    const result = await rpc('vf_stop_timer', { p_timer_id: timer.id, p_notes: notes.trim(), p_proof_path: proofURL || null });
    await loadLive(await session());
    return Number((Array.isArray(result) ? result[0] : result)?.minutes || minutes);
  });
  const cancelTimer = () => run(async () => {
    const timer = recordsRef.current.timer;
    if (!timer) return;
    if (modeRef.current === 'demo') await persistDemo({ ...requireDemo(), timer: null });
    else { await rpc('vf_cancel_timer', { p_timer_id: timer.id }); await loadLive(await session()); }
  });
  const uploadProof: AppState['uploadProof'] = (uri, mimeType = 'application/pdf', filename = 'proof.pdf') => run(async () => {
    if (modeRef.current === 'demo') return uri;
    const allowed: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
    if (!allowed[mimeType]) throw new Error('Use a JPEG, PNG, WebP image, or PDF as proof.');
    const current = await session();
    const bytes = Platform.OS === 'web' ? await (await fetch(uri)).arrayBuffer() : await new File(uri).arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) throw new Error('Proof must be smaller than 10 MB.');
    const path = `${current.user.id}/${randomUUID()}.${allowed[mimeType]}`;
    const { error: uploadError } = await requireClient().storage.from('vf-proofs').upload(path, bytes, { contentType: mimeType, upsert: false });
    if (uploadError) throw uploadError;
    return path;
  });
  const updateProfile = (patch: ProfilePatch) => run(async () => {
    if (patch.name !== undefined && patch.name.trim().length < 2) throw new Error('Enter your name.');
    if (patch.goalHours !== undefined && (!Number.isInteger(patch.goalHours) || patch.goalHours < 1 || patch.goalHours > 10000)) throw new Error('Your goal must be a whole number between 1 and 10,000 hours.');
    if (modeRef.current === 'demo') {
      const draft = requireDemo();
      await persistDemo({ ...draft, profile: { ...draft.profile, ...patch } });
    } else {
      const current = await session();
      const update: Row = {};
      const keys: Record<keyof ProfilePatch, string> = { name: 'full_name', school: 'school', bio: 'bio', skills: 'skills', causes: 'causes', goalHours: 'goal_hours', preferences: 'service_preferences' };
      for (const key of Object.keys(patch) as (keyof ProfilePatch)[]) if (patch[key] !== undefined) update[keys[key]] = patch[key];
      const { error: saveError } = await requireClient().from('vf_profiles').update(update).eq('id', current.user.id);
      if (saveError) throw saveError;
      await loadLive(current);
    }
  });
  const reviewApplication: AppState['reviewApplication'] = (id, decision, note = '') => run(async () => {
    if (modeRef.current !== 'live') throw new Error('Organization review requires a live staff account.');
    await rpc('vf_decide_application', { p_application_id: id, p_decision: decision, p_note: note.trim() });
    await loadLive(await session());
  });
  const reviewService: AppState['reviewService'] = (id, decision, note = '') => run(async () => {
    if (modeRef.current !== 'live') throw new Error('Service review requires a live staff account.');
    if (decision !== 'approved' && !note.trim()) throw new Error('Add a note so the student knows what needs to change.');
    await rpc('vf_review_service', { p_entry_id: id, p_decision: decision, p_note: note.trim() });
    await loadLive(await session());
  });
  const recordOutcome: AppState['recordOutcome'] = (entryId,metric,quantity,evidence) => run(async()=>{
    if(!Number.isFinite(quantity)||quantity<=0||quantity>1e9||evidence.trim().length<10) throw new Error('Add a positive quantity and evidence of at least 10 characters.');
    if(modeRef.current==='demo') {
      const draft=requireDemo(); const entry=draft.entries.find(e=>e.id===entryId);
      if(!entry || !['pending','approved'].includes(entry.status)) throw new Error('Choose a submitted service entry.');
      if((draft.outcomes??[]).some(r=>r.service_entry_id===entryId&&r.metric===metric&&r.status!=='rejected')) throw new Error('This outcome has already been submitted.');
      await persistDemo({...draft,outcomes:[...(draft.outcomes??[]).filter(r=>!(r.service_entry_id===entryId&&r.metric===metric)),{id:newId('demo-outcome'),service_entry_id:entryId,metric,quantity,evidence:evidence.trim(),status:'pending',review_note:'',reviewed_at:null}]});
    } else {await rpc('vf_record_outcome',{p_entry_id:entryId,p_metric:metric,p_quantity:quantity,p_evidence:evidence.trim()});await loadLive(await session());}
  });
  const reviewOutcome: AppState['reviewOutcome'] = (id,decision,note='')=>run(async()=>{
    if(modeRef.current!=='live') throw new Error('Outcome verification requires an authorized live partner account.');
    await rpc('vf_review_impact',{p_outcome_id:id,p_decision:decision,p_note:note.trim()});await loadLive(await session());
  });
  const deleteAccount = () => run(async () => {
    if (modeRef.current === 'demo') { await signOut(); return; }
    await session();
    const { error: deleteError } = await requireClient().functions.invoke('delete-account', { body: { confirmation: 'DELETE' } });
    if (deleteError) throw new Error(`Account deletion could not finish: ${deleteError.message}`);
    await requireClient().auth.signOut({ scope: 'local' });
    userRef.current = null;
    demoRef.current = null;
    await AsyncStorage.removeItem(DEMO_KEY);
    setMode('signedOut');
    setPasswordRecovery(false);
    setRecords(empty());
  });

  const value: AppState = { ...records, mode, ready, loading, error, configured: isConfigured, passwordRecovery, signIn, signUp, resetPassword, updatePassword, signOut, enterDemo, resetDemo, saveOpportunity, apply, withdraw, submitService, startTimer, stopTimer, cancelTimer, uploadProof, recordOutcome, reviewOutcome, updateProfile, reviewApplication, reviewService, deleteAccount, refresh };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp(): AppState {
  const context = useContext(Context);
  if (!context) throw new Error('useApp must be used inside AppProvider.');
  return context;
}

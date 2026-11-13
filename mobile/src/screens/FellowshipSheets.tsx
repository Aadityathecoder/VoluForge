import React, { useEffect, useState } from 'react';
import { Pressable, Share, Switch, TextInput, View } from 'react-native';
import { useApp } from '../data/AppProvider';
import type { AccountType, Fellowship, FellowshipInput, RosterEntry } from '../data/models';
import { useNav } from '../ui/navigation';
import { C, Badge, Button, Chip, Field, Heading, Icon, Title, Txt, s } from '../ui/theme';
import { dateRange, longDate, plural, shortDate } from '../ui/dates';
import { errorText } from '../ui/helpers';

function Err({ message }: { message: string }) { return message ? <Txt accessibilityRole="alert" style={{ color: C.red, backgroundColor: '#F7E3DC', padding: 14, borderRadius: 12, lineHeight: 21, fontSize: 13 }}>{message}</Txt> : null; }
function useBusy() {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return { busy, error, setError, run: async (fn: () => Promise<void>) => { setBusy(true); setError(''); try { await fn(); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } } };
}
const Facts = ({ rows }: { rows: [string, string][] }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: C.line, borderRadius: 14, overflow: 'hidden', backgroundColor: C.white }}>
  {rows.map(([k, v], i) => <View key={k} style={{ width: '50%', padding: 14, gap: 3, borderColor: C.line, borderLeftWidth: i % 2 ? 1 : 0, borderTopWidth: i > 1 ? 1 : 0 }}><Txt style={{ fontSize: 12, color: C.muted }}>{k}</Txt><Txt style={{ fontSize: 14, fontWeight: '700' }}>{v}</Txt></View>)}
</View>;

/** Student view of one fellowship: details, apply, withdraw. */
export function FellowshipDetail({ id, code }: { id: string; code?: string }) {
  const app = useApp(), nav = useNav(), task = useBusy();
  const [f, setF] = useState<Fellowship | undefined>(app.fellowships.find(r => r.id === id));
  const [note, setNote] = useState('');
  useEffect(() => { if (!f && code) void app.findFellowships(code).then(rows => setF(rows.find(r => r.id === id))).catch(() => {}); }, []);
  useEffect(() => { const fresh = app.fellowships.find(r => r.id === id); if (fresh) setF(fresh); }, [app.fellowships]);
  if (!f) return <Txt style={s.body}>Loading fellowship…</Txt>;
  const active = f.myStatus === 'pending' || f.myStatus === 'accepted';
  const canApply = f.status === 'open' && !active && f.myStatus !== 'declined' && f.seatsLeft > 0;
  return <View style={{ gap: 18 }}>
    <View style={{ gap: 6 }}><Txt style={{ color: C.muted, fontSize: 14 }}>{f.host}{f.hostVerified ? '  ·  Verified host' : ''}</Txt><Title style={{ fontSize: 30, lineHeight: 33 }}>{f.title}</Title></View>
    {!!f.summary && <Txt style={[s.body, { color: C.ink, fontSize: 16 }]}>{f.summary}</Txt>}
    <Facts rows={[['Runs', dateRange(f.startsOn, f.endsOn)], ['Commitment', `${f.weeklyHours} hours a week`], ['Where', f.remote ? 'Online' : f.location || 'In person'], ['Seats left', `${f.seatsLeft} of ${f.capacity}`]]}/>
    {!!f.description && <Txt style={[s.body, { color: C.ink }]}>{f.description}</Txt>}
    {f.myStatus && <View style={[s.row, { gap: 10 }]}><Txt style={{ fontWeight: '600' }}>Your application</Txt><Badge status={f.myStatus}/></View>}
    <Err message={task.error}/>
    {canApply ? <>
      <Field label="Why do you want to join?" value={note} onChangeText={setNote} multiline maxLength={2000} placeholder="A few sentences is plenty."/>
      <Txt style={{ fontSize: 12, color: C.muted, marginTop: -8 }}>The host sees this with your name, school and skills.</Txt>
      {f.applyBy && <Txt style={{ fontSize: 13, color: C.orange, fontWeight: '600' }}>Apply by {longDate(f.applyBy)}</Txt>}
      <Button title="Apply to this fellowship" variant="ember" busy={task.busy} onPress={() => task.run(async () => { await app.applyToFellowship(f.id, note, code); nav.notify('Application sent. You’ll see the decision on your Fellowships tab.'); nav.close(); })}/>
    </> : active ? <Button title="Withdraw application" variant="soft" busy={task.busy} onPress={() => task.run(async () => { await app.withdrawFromFellowship(f.id); nav.notify('You withdrew your application.'); nav.close(); })}/>
      : <Txt style={s.body}>{f.myStatus === 'declined' ? 'The host has already reviewed your application.' : f.status !== 'open' ? 'This fellowship is not taking applications.' : 'All seats are taken.'}</Txt>}
  </View>;
}

/** Administrator: create or edit a fellowship. */
export function FellowshipEditor({ id }: { id?: string }) {
  const app = useApp(), nav = useNav(), task = useBusy();
  const existing = id ? app.fellowships.find(r => r.id === id) : undefined;
  const [v, setV] = useState<FellowshipInput>(existing ? { id: existing.id, title: existing.title, summary: existing.summary, description: existing.description, focus: existing.focus, location: existing.location, remote: existing.remote, startsOn: existing.startsOn, endsOn: existing.endsOn, applyBy: existing.applyBy, capacity: existing.capacity, weeklyHours: existing.weeklyHours, status: existing.status }
    : { title: '', summary: '', description: '', focus: 'Education', location: '', remote: false, startsOn: '', endsOn: '', applyBy: null, capacity: 12, weeklyHours: 3, status: 'draft' });
  const set = <K extends keyof FellowshipInput>(k: K, value: FellowshipInput[K]) => setV(prev => ({ ...prev, [k]: value }));
  const save = (status: FellowshipInput['status']) => task.run(async () => {
    const newId = await app.saveFellowship({ ...v, status });
    nav.notify(existing ? 'Fellowship saved.' : status === 'open' ? 'Fellowship published. Share its join code with students.' : 'Draft saved.');
    nav.sheet({ kind: 'roster', id: newId });
  });
  return <View style={{ gap: 16 }}>
    <Title style={{ fontSize: 30 }}>{existing ? 'Edit fellowship' : 'New fellowship'}</Title>
    <Txt style={s.body}>Students see everything here except the join code.</Txt>
    <Field label="Title" value={v.title} onChangeText={t => set('title', t)} maxLength={160} placeholder="Saturday Reading Fellowship"/>
    <Field label="One-line summary" value={v.summary} onChangeText={t => set('summary', t)} maxLength={280}/>
    <Field label="What fellows will do" value={v.description} onChangeText={t => set('description', t)} multiline maxLength={8000}/>
    <View style={{ gap: 8 }}><Txt style={{ fontSize: 13, fontWeight: '700' }}>Focus</Txt><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Education', 'Environment', 'Food security', 'Health', 'Community', 'Arts', 'Technology'].map(x => <Chip key={x} label={x} selected={v.focus === x} onPress={() => set('focus', x)}/>)}</View></View>
    <Field label="Location" value={v.location} onChangeText={t => set('location', t)} maxLength={200} placeholder="Room 204, Harbor High"/>
    <View style={[s.between, { paddingVertical: 4 }]}><Txt style={{ fontWeight: '600' }}>Runs online</Txt><Switch value={v.remote} onValueChange={b => set('remote', b)} trackColor={{ true: C.forest, false: C.line }}/></View>
    <View style={[s.row, { gap: 10 }]}>
      <View style={{ flex: 1 }}><Field label="Starts" value={v.startsOn} onChangeText={t => set('startsOn', t)} placeholder="2027-01-10" autoCapitalize="none" keyboardType="numbers-and-punctuation"/></View>
      <View style={{ flex: 1 }}><Field label="Ends" value={v.endsOn} onChangeText={t => set('endsOn', t)} placeholder="2027-03-28" autoCapitalize="none" keyboardType="numbers-and-punctuation"/></View>
    </View>
    <Field label="Apply by (optional)" value={v.applyBy ?? ''} onChangeText={t => set('applyBy', t || null)} placeholder="2027-01-05" autoCapitalize="none" keyboardType="numbers-and-punctuation"/>
    <View style={[s.row, { gap: 10 }]}>
      <View style={{ flex: 1 }}><Field label="Seats" value={String(v.capacity || '')} onChangeText={t => set('capacity', Number(t.replace(/\D/g, '')) || 0)} keyboardType="number-pad"/></View>
      <View style={{ flex: 1 }}><Field label="Hours a week" value={String(v.weeklyHours || '')} onChangeText={t => set('weeklyHours', Number(t.replace(/\D/g, '')) || 0)} keyboardType="number-pad"/></View>
    </View>
    <Err message={task.error}/>
    {existing ? <Button title="Save changes" busy={task.busy} onPress={() => save(v.status)}/> : <>
      <Button title="Publish and open applications" variant="ember" busy={task.busy} onPress={() => save('open')}/>
      <Button title="Save as draft" variant="outline" disabled={task.busy} onPress={() => save('draft')}/>
    </>}
  </View>;
}

/** Administrator: one fellowship's code, status and applicants. */
export function Roster({ id }: { id: string }) {
  const app = useApp(), nav = useNav(), task = useBusy();
  const f = app.fellowships.find(r => r.id === id);
  const [rows, setRows] = useState<RosterEntry[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = () => app.roster(id).then(setRows).catch(e => task.setError(errorText(e)));
  useEffect(() => { void load(); }, [id]);
  if (!f) return <Txt style={s.body}>This fellowship is no longer available.</Txt>;
  const setStatus = (status: 'open' | 'closed') => task.run(async () => {
    await app.saveFellowship({ id: f.id, title: f.title, summary: f.summary, description: f.description, focus: f.focus, location: f.location, remote: f.remote, startsOn: f.startsOn, endsOn: f.endsOn, applyBy: f.applyBy, capacity: f.capacity, weeklyHours: f.weeklyHours, status });
    nav.notify(status === 'open' ? 'Applications are open.' : 'Applications are closed.');
  });
  const decide = (studentId: string, decision: 'accepted' | 'declined') => task.run(async () => { await app.decideEnrollment(f.id, studentId, decision, notes[studentId] ?? ''); await load(); });
  const active = (rows ?? []).filter(r => r.status !== 'withdrawn');
  return <View style={{ gap: 18 }}>
    <View style={{ gap: 8 }}><View style={[s.row, { gap: 10 }]}><Badge status={f.status}/><Txt style={{ fontSize: 13, color: C.muted }}>{dateRange(f.startsOn, f.endsOn)}</Txt></View><Title style={{ fontSize: 30, lineHeight: 33 }}>{f.title}</Title></View>
    <View style={{ borderWidth: 1.5, borderColor: C.ink, borderRadius: 14, padding: 16, gap: 10, backgroundColor: C.white }}>
      <Txt style={{ fontSize: 13, color: C.muted }}>Join code</Txt>
      <View style={s.between}>
        <Txt selectable style={{ fontSize: 26, letterSpacing: 5, fontFamily: 'BricolageGrotesque_700Bold' }}>{f.joinCode}</Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="Share join code" hitSlop={10} onPress={() => void Share.share({ message: `Join "${f.title}" on VoluForge with code ${f.joinCode}: https://voluforge.xyz/fellowships?code=${f.joinCode}` })} style={[s.row, { gap: 6 }]}><Icon name="share-outline" size={18} color={C.forest}/><Txt style={{ fontWeight: '700', color: C.forest }}>Share</Txt></Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => task.run(async () => { await app.newJoinCode(f.id); nav.notify('New code created. The old one no longer works.'); })}><Txt style={{ fontSize: 13, color: C.muted, textDecorationLine: 'underline' }}>Create a new code</Txt></Pressable>
    </View>
    <View style={[s.row, { gap: 10 }]}>
      {f.status === 'open' ? <Button title="Close applications" variant="outline" style={{ flex: 1 }} disabled={task.busy} onPress={() => setStatus('closed')}/> : <Button title="Open applications" variant="ember" style={{ flex: 1 }} disabled={task.busy} onPress={() => setStatus('open')}/>}
      <Button title="Edit" variant="soft" onPress={() => nav.sheet({ kind: 'fellowshipEditor', id: f.id })}/>
    </View>
    <Err message={task.error}/>
    <View style={s.between}><Heading>Applicants</Heading><Txt style={{ fontSize: 13, color: C.muted }}>{f.accepted ?? 0} of {f.capacity} seats filled</Txt></View>
    {rows === null ? <Txt style={s.body}>Loading applicants…</Txt> : active.length === 0 ? <Txt style={s.body}>{f.status === 'open' ? 'No applications yet. Share the join code with your students.' : 'Open applications so students can apply.'}</Txt>
      : active.map(r => <View key={r.studentId} style={[s.card, { gap: 10 }]}>
        <View style={s.between}><View style={{ flex: 1 }}><Txt style={{ fontWeight: '700', fontSize: 16 }}>{r.name}</Txt><Txt style={{ fontSize: 13, color: C.muted }}>{r.school || 'School not added'} · applied {shortDate(r.createdAt.slice(0, 10))}</Txt></View><Badge status={r.status}/></View>
        {!!r.message && <Txt style={{ lineHeight: 22 }}>{r.message}</Txt>}
        {[...r.skills, ...r.causes].length > 0 && <Txt style={{ fontSize: 13, color: C.forest }}>{[...r.skills, ...r.causes].slice(0, 8).join(' · ')}</Txt>}
        <TextInput accessibilityLabel={`Note to ${r.name}`} value={notes[r.studentId] ?? ''} onChangeText={t => setNotes(n => ({ ...n, [r.studentId]: t }))} placeholder="Optional note to the student" placeholderTextColor={C.muted} style={[s.input, { minHeight: 44, paddingVertical: 10, fontSize: 14 }]}/>
        <View style={[s.row, { gap: 10 }]}>
          {r.status !== 'accepted' && <Button title="Accept" style={{ flex: 1, minHeight: 44 }} disabled={task.busy} onPress={() => decide(r.studentId, 'accepted')}/>}
          {r.status !== 'declined' && <Button title="Decline" variant="soft" style={{ flex: 1, minHeight: 44 }} disabled={task.busy} onPress={() => decide(r.studentId, 'declined')}/>}
        </View>
      </View>)}
    {(rows ?? []).length > active.length && <Txt style={{ fontSize: 13, color: C.muted }}>{plural((rows ?? []).length - active.length, 'student')} withdrew.</Txt>}
    {(f.accepted ?? 0) === 0 && <Pressable accessibilityRole="button" onPress={() => task.run(async () => { await app.deleteFellowship(f.id); nav.notify('Fellowship deleted.'); nav.close(); })} style={{ paddingVertical: 10 }}><Txt style={{ color: C.red, fontSize: 13 }}>Delete this fellowship</Txt></Pressable>}
  </View>;
}

/** People who signed in with Google pick their account type once. */
export function ChooseType() {
  const app = useApp(), nav = useNav(), task = useBusy();
  const [type, setType] = useState<AccountType>('student'), [org, setOrg] = useState('');
  const option = (value: AccountType, title: string, body: string) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: type === value }} onPress={() => setType(value)} style={[s.card, { gap: 4, borderWidth: type === value ? 2 : 1, borderColor: type === value ? C.ink : C.line }]}><Txt style={{ fontWeight: '700', fontSize: 16 }}>{title}</Txt><Txt style={[s.body, { fontSize: 14, lineHeight: 20 }]}>{body}</Txt></Pressable>;
  return <View style={{ gap: 16 }}>
    <Title style={{ fontSize: 30 }}>One question first</Title>
    <Txt style={s.body}>How will you use VoluForge? This can't be switched later.</Txt>
    {option('student', 'I’m a student', 'Join fellowships, apply for volunteer work, and track approved hours.')}
    {option('admin', 'I run fellowships', 'Create fellowships for students and choose who joins each cohort.')}
    {type === 'admin' && <Field label="School or organization" value={org} onChangeText={setOrg} maxLength={200}/>}
    <Err message={task.error}/>
    <Button title="Continue" busy={task.busy} onPress={() => task.run(async () => { await app.chooseAccountType(type, org); nav.close(); })}/>
  </View>;
}

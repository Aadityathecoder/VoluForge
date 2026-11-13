import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useApp } from '../data/AppProvider';
import type { Fellowship } from '../data/models';
import { useNav } from '../ui/navigation';
import { useDesktop } from '../ui/responsive';
import { C, Badge, Button, Empty, Heading, Icon, PressScale, Title, Txt, s } from '../ui/theme';
import { dateRange, plural, shortDate } from '../ui/dates';
import { errorText } from '../ui/helpers';

export function FellowshipCard({ f, code, onPress }: { f: Fellowship; code?: string; onPress?: () => void }) {
  const nav = useNav();
  return <PressScale accessibilityRole="button" accessibilityLabel={`Open ${f.title}`} onPress={onPress ?? (() => nav.sheet({ kind: 'fellowship', id: f.id, code }))} style={[s.card, { gap: 10 }]}>
    <View style={s.between}><Txt style={{ fontSize: 13, color: C.muted, flex: 1 }} numberOfLines={1}>{f.host || f.focus}</Txt>{f.myStatus ? <Badge status={f.myStatus}/> : f.status !== 'open' ? <Badge status={f.status}/> : null}</View>
    <Txt style={{ fontSize: 20, lineHeight: 24, fontFamily: 'BricolageGrotesque_700Bold' }}>{f.title}</Txt>
    {!!f.summary && <Txt style={[s.body, { fontSize: 14, lineHeight: 21 }]} numberOfLines={2}>{f.summary}</Txt>}
    <View style={{ height: 1, backgroundColor: C.line, marginVertical: 4 }}/>
    <View style={[s.row, { gap: 14, flexWrap: 'wrap' }]}>
      <Meta icon="calendar-outline" text={dateRange(f.startsOn, f.endsOn)}/>
      <Meta icon="time-outline" text={`${f.weeklyHours} h/week`}/>
      <Meta icon={f.remote ? 'globe-outline' : 'location-outline'} text={f.remote ? 'Online' : f.location || 'In person'}/>
    </View>
    <View style={s.between}>
      <Txt style={{ fontSize: 13 }}><Txt style={{ fontSize: 13, fontWeight: '700' }}>{plural(f.seatsLeft, 'seat')}</Txt> left</Txt>
      {f.applyBy && f.status === 'open' && <Txt style={{ fontSize: 13, fontWeight: '600', color: C.orange }}>Apply by {shortDate(f.applyBy)}</Txt>}
    </View>
  </PressScale>;
}
const Meta = ({ icon, text }: { icon: React.ComponentProps<typeof Icon>['name']; text: string }) => <View style={[s.row, { gap: 5 }]}><Icon name={icon} size={14} color={C.muted}/><Txt style={{ fontSize: 13, color: C.muted }}>{text}</Txt></View>;

export function Fellowships() {
  const app = useApp(), nav = useNav(), desktop = useDesktop();
  const [code, setCode] = useState(''), [found, setFound] = useState<Fellowship[] | null>(null), [busy, setBusy] = useState(false), [msg, setMsg] = useState('');
  const mine = app.fellowships.filter(f => f.myStatus && f.myStatus !== 'withdrawn');
  const open = app.fellowships.filter(f => f.status === 'open' && (!f.myStatus || f.myStatus === 'withdrawn'));
  const lookup = async () => {
    if (code.trim().length < 6) { setMsg('Join codes are 8 letters and numbers.'); return; }
    setBusy(true); setMsg('');
    try {
      const rows = await app.findFellowships(code);
      const extra = rows.filter(r => !app.fellowships.some(f => f.id === r.id));
      setFound(extra);
      if (!extra.length) setMsg('No private fellowship uses that code. Check it with your administrator.');
    } catch (e) { setMsg(errorText(e)); } finally { setBusy(false); }
  };
  const grid = desktop ? { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 16 } : { gap: 14 };
  const cell = desktop ? { width: '48.5%' as const } : undefined;
  return <View style={{ paddingHorizontal: desktop ? 36 : 22, paddingTop: desktop ? 30 : 20, paddingBottom: 32, gap: 26 }}>
    <View style={{ gap: 8 }}><Title>Fellowships</Title><Txt style={s.body}>Small cohorts run by a school or organization over several weeks. The host picks who joins.</Txt></View>
    {!app.fellowshipsReady && <Txt style={{ backgroundColor: C.peach, padding: 14, borderRadius: 12, fontSize: 13, lineHeight: 20 }}>Fellowships aren't switched on for this account's server yet. Pull to refresh later.</Txt>}
    <View style={[s.card, { gap: 12, backgroundColor: C.green, borderColor: C.green }]}>
      <Txt style={{ fontWeight: '700' }}>Have a join code?</Txt>
      <View style={[s.row, { gap: 10 }]}>
        <TextInput accessibilityLabel="Join code" value={code} onChangeText={t => setCode(t.toUpperCase())} placeholder="4F9A21C7" placeholderTextColor={C.muted} autoCapitalize="characters" autoCorrect={false} maxLength={8} onSubmitEditing={lookup}
          style={[s.input, { flex: 1, letterSpacing: 3, fontWeight: '700', minHeight: 48 }]}/>
        <Button title="Find" busy={busy} onPress={lookup} style={{ minHeight: 48 }}/>
      </View>
      {!!msg && <Txt style={{ fontSize: 13, color: C.forest }}>{msg}</Txt>}
    </View>
    {found && found.length > 0 && <View style={{ gap: 12 }}><Heading>From your code</Heading><View style={grid}>{found.map(f => <View key={f.id} style={cell}><FellowshipCard f={f} code={code}/></View>)}</View></View>}
    {mine.length > 0 && <View style={{ gap: 12 }}><Heading>Your fellowships</Heading><View style={grid}>{mine.map(f => <View key={f.id} style={cell}><FellowshipCard f={f}/></View>)}</View></View>}
    <View style={{ gap: 12 }}>
      <Heading>Open now</Heading>
      {open.length ? <View style={grid}>{open.map(f => <View key={f.id} style={cell}><FellowshipCard f={f}/></View>)}</View>
        : <Empty icon="people-outline" title="Nothing open right now" text="Administrators create fellowships for their students. Ask your school for a join code, or check back soon." action={<Button title="Find volunteer work" variant="outline" onPress={() => nav.navigate('explore')}/>}/>}
    </View>
  </View>;
}

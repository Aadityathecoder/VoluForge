import React from 'react';
import { View } from 'react-native';
import { useApp } from '../data/AppProvider';
import { useNav } from '../ui/navigation';
import { useDesktop } from '../ui/responsive';
import { C, Badge, Button, Empty, Heading, Icon, PressScale, Title, Txt, s } from '../ui/theme';
import { dateRange } from '../ui/dates';

export function Admin() {
  const app = useApp(), nav = useNav(), desktop = useDesktop();
  const rows = app.fellowships;
  const pending = rows.reduce((n, r) => n + (r.pending ?? 0), 0), fellows = rows.reduce((n, r) => n + (r.accepted ?? 0), 0);
  return <View style={{ paddingHorizontal: desktop ? 36 : 22, paddingTop: desktop ? 30 : 20, paddingBottom: 32, gap: 24 }}>
    <View style={[s.between, { alignItems: 'flex-end', gap: 12 }]}>
      <View style={{ flex: 1, gap: 6 }}><Txt style={{ color: C.muted, fontSize: 14 }}>{app.account.organization || 'Administrator'}</Txt><Title>Your fellowships</Title></View>
      <Button title="New" icon="add" iconFirst variant="ember" onPress={() => nav.sheet({ kind: 'fellowshipEditor' })} style={{ minHeight: 44, paddingHorizontal: 16 }}/>
    </View>
    {!app.fellowshipsReady && <Txt style={{ backgroundColor: C.peach, padding: 14, borderRadius: 12, fontSize: 13, lineHeight: 20 }}>Fellowships aren't switched on for this server yet. An operator needs to apply the fellowship database update.</Txt>}
    {app.fellowshipsReady && !app.account.verified && <View style={[s.row, { gap: 10, backgroundColor: C.soft, padding: 14, borderRadius: 12, alignItems: 'flex-start' }]}><Icon name="key-outline" size={18} color={C.forest}/><Txt style={{ flex: 1, fontSize: 13, lineHeight: 20 }}>Until VoluForge verifies your account, students find your open fellowships with their join code.</Txt></View>}
    <View style={[s.row, { borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.white }]}>
      {([['Fellowships', rows.length], ['To review', pending], ['Fellows', fellows]] as const).map(([k, v], i) => <View key={k} style={{ flex: 1, padding: 16, borderLeftWidth: i ? 1 : 0, borderColor: C.line, gap: 2 }}>
        <Txt style={{ fontSize: 28, fontFamily: 'BricolageGrotesque_700Bold', color: k === 'To review' && v > 0 ? C.orange : C.ink }}>{v}</Txt><Txt style={{ fontSize: 12, color: C.muted }}>{k}</Txt></View>)}
    </View>
    {rows.length ? <View style={{ gap: 12 }}>
      <Heading>All fellowships</Heading>
      {rows.map(f => <PressScale key={f.id} accessibilityRole="button" accessibilityLabel={`Manage ${f.title}`} onPress={() => nav.sheet({ kind: 'roster', id: f.id })} style={[s.card, { gap: 10 }]}>
        <View style={s.between}><Badge status={f.status}/><Txt style={{ fontSize: 13, letterSpacing: 2, fontWeight: '700', color: C.forest }}>{f.joinCode}</Txt></View>
        <Txt style={{ fontSize: 19, lineHeight: 23, fontFamily: 'BricolageGrotesque_700Bold' }}>{f.title}</Txt>
        <Txt style={{ fontSize: 13, color: C.muted }}>{dateRange(f.startsOn, f.endsOn)}</Txt>
        <View style={[s.between, { marginTop: 2 }]}>
          <Txt style={{ fontSize: 13 }}><Txt style={{ fontSize: 13, fontWeight: '700' }}>{f.accepted ?? 0}</Txt> of {f.capacity} seats filled</Txt>
          {(f.pending ?? 0) > 0 ? <Txt style={{ fontSize: 13, fontWeight: '700', color: C.orange }}>{f.pending} to review</Txt> : <Icon name="chevron-forward" size={16} color={C.muted}/>}
        </View>
      </PressScale>)}
    </View> : app.fellowshipsReady && <Empty icon="people-outline" title="Create your first fellowship" text="Students can't join a fellowship until an administrator creates one. It takes a couple of minutes." action={<Button title="New fellowship" variant="ember" onPress={() => nav.sheet({ kind: 'fellowshipEditor' })}/>}/>}
  </View>;
}

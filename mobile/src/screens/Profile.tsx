import React from 'react';
import { Pressable, View } from 'react-native';
import { useApp } from '../data/AppProvider';
import { useNav } from '../ui/navigation';
import { C, Button, Chip, Heading, Icon, Rule, Title, Txt, s, type IconName } from '../ui/theme';
import { errorText } from '../ui/helpers';

export function Profile() {
  const app = useApp(), nav = useNav(); const p = app.profile; const admin = app.account.type === 'admin';
  const row = (label: string, icon: IconName, fn: () => void) => <Pressable key={label} accessibilityRole="button" onPress={fn} style={({ pressed }) => [s.row, { gap: 14, paddingVertical: 17, borderBottomWidth: 1, borderColor: C.line, opacity: pressed ? .6 : 1 }]}><Icon name={icon} size={20}/><Txt style={{ flex: 1, fontWeight: '600' }}>{label}</Txt><Icon name="chevron-forward" size={16} color={C.muted}/></Pressable>;
  return <View style={{ padding: 22, paddingTop: 22, paddingBottom: 35 }}>
    <View style={[s.row, { gap: 16 }]}>
      <View style={{ backgroundColor: C.peach, width: 64, height: 64, borderRadius: 100, alignItems: 'center', justifyContent: 'center' }}><Txt style={{ fontSize: 22, fontWeight: '800' }}>{p?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'VF'}</Txt></View>
      <View style={{ flex: 1, gap: 4 }}><Title style={{ fontSize: 28, lineHeight: 31 }}>{p?.name || 'Your profile'}</Title><Txt style={{ color: C.muted, fontSize: 14 }}>{admin ? `Administrator · ${app.account.organization || 'your organization'}` : p?.school || 'Add your school'}</Txt></View>
    </View>
    {!!p?.bio && <Txt style={[s.body, { marginTop: 18 }]}>{p.bio}</Txt>}
    <Button title="Edit profile" variant="outline" icon="create-outline" iconFirst style={{ marginTop: 18 }} onPress={() => nav.sheet({ kind: 'editProfile' })}/>
    {!admin && <><Rule/>
      <Heading>Causes you care about</Heading>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{p?.causes.length ? p.causes.map(c => <Chip key={c} label={c}/>) : <Txt style={s.body}>None yet.</Txt>}</View>
      <Heading style={{ marginTop: 22 }}>Skills you bring</Heading>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{p?.skills.length ? p.skills.map(c => <Chip key={c} label={c}/>) : <Txt style={s.body}>None yet.</Txt>}</View>
    </>}
    <Rule/>
    {!admin && row('Your impact', 'flower-outline', () => nav.navigate('impact'))}
    {!admin && row('Matching preferences', 'options-outline', () => nav.sheet({ kind: 'preferences' }))}
    {!admin && row('Community needs', 'earth-outline', () => nav.sheet({ kind: 'insights' }))}
    {row('Partner workspace', 'business-outline', () => nav.sheet({ kind: 'partner' }))}
    {row('Privacy and your data', 'shield-checkmark-outline', () => nav.sheet({ kind: 'privacy' }))}
    {row('Terms of use', 'document-text-outline', () => nav.sheet({ kind: 'terms' }))}
    {row('Help', 'help-circle-outline', () => nav.sheet({ kind: 'support' }))}
    {row('Sign out', 'log-out-outline', () => { void app.signOut().catch(e => nav.notify(errorText(e))); })}
    <Pressable accessibilityRole="button" onPress={() => nav.sheet({ kind: 'delete' })} style={{ paddingVertical: 20 }}><Txt style={{ color: C.red, fontSize: 14 }}>Delete account</Txt></Pressable>
  </View>;
}

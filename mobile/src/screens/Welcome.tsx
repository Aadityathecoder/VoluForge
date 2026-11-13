import React from 'react';
import { Pressable, View } from 'react-native';
import { useNav } from '../ui/navigation';
import { useDesktop } from '../ui/responsive';
import { BrandMark } from '../ui/BrandMark';
import { C, Button, F, Title, Txt, s } from '../ui/theme';

const seats = [['Accepted', C.green, C.forest], ['Accepted', C.green, C.forest], ['Waiting for review', C.peach, C.ink], ['Open', 'transparent', C.muted]] as const;

function SignupSheet() {
  return <View style={{ marginRight: 8, marginTop: 8 }}>
    <View style={{ position: 'absolute', top: -8, right: -8, bottom: 8, left: 8, backgroundColor: C.orange, borderRadius: 16 }}/>
    <View style={{ backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.ink, overflow: 'hidden' }}>
      <View style={{ padding: 16, borderBottomWidth: 1.5, borderColor: C.ink, gap: 3 }}>
        <Txt style={{ fontSize: 12, color: C.muted }}>Harbor Learning Lab</Txt>
        <Txt style={{ fontSize: 19, fontFamily: F.display }}>Saturday Reading Fellowship</Txt>
      </View>
      {seats.map(([label, bg, fg], i) => <View key={i} style={[s.row, { gap: 14, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: C.line }]}>
        <Txt style={{ fontSize: 12, color: C.muted, width: 44 }}>Seat {i + 1}</Txt>
        <View style={{ backgroundColor: bg, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 3, borderWidth: bg === 'transparent' ? 1 : 0, borderColor: C.line, borderStyle: 'dashed' }}><Txt style={{ fontSize: 11, fontWeight: '700', color: fg }}>{label}</Txt></View>
      </View>)}
    </View>
  </View>;
}

export function Welcome() {
  const nav = useNav(), desktop = useDesktop();
  return <View style={{ flex: 1, padding: desktop ? 48 : 24, paddingTop: desktop ? 36 : 18, minHeight: desktop ? 720 : 700 }}>
    <View style={s.between}>
      <View style={[s.row, { gap: 9 }]}><BrandMark size={30}/><Txt style={{ fontSize: 21, fontFamily: F.display, letterSpacing: -.6 }}>voluforge</Txt></View>
      <Pressable accessibilityRole="button" onPress={() => nav.sheet({ kind: 'auth' })} hitSlop={10} style={{ padding: 8 }}><Txt style={{ fontWeight: '700' }}>Sign in</Txt></Pressable>
    </View>
    <View style={{ flex: 1, justifyContent: 'center', gap: 30, paddingVertical: 28, flexDirection: desktop ? 'row' : 'column', alignItems: desktop ? 'center' : 'stretch' }}>
      <View style={{ gap: 16, flex: desktop ? 1 : undefined }}>
        <Title style={{ fontSize: desktop ? 68 : 50, lineHeight: desktop ? 68 : 50, letterSpacing: desktop ? -2.2 : -1.6 }}>Give your time where it counts.</Title>
        <Txt style={[s.body, { fontSize: 17, lineHeight: 26, maxWidth: 420 }]}>Join fellowships run by your school or community, find volunteer work, and keep a record of approved hours.</Txt>
      </View>
      <View style={{ width: desktop ? 360 : '100%', maxWidth: 420, alignSelf: 'center' }}><SignupSheet/></View>
    </View>
    <View style={{ gap: 12, maxWidth: desktop ? 360 : undefined }}>
      <Button title="Create an account" variant="primary" onPress={() => nav.sheet({ kind: 'auth', id: 'signup' })}/>
      <Button title="Sign in" variant="outline" onPress={() => nav.sheet({ kind: 'auth' })}/>
      <Txt style={{ fontSize: 13, color: C.muted, textAlign: desktop ? 'left' : 'center', lineHeight: 20 }}>Running a fellowship? Create an administrator account.</Txt>
      <View style={[s.row, { justifyContent: desktop ? 'flex-start' : 'center', gap: 18, marginTop: 2 }]}>
        {(['privacy', 'terms', 'support'] as const).map(kind => <Pressable key={kind} accessibilityRole="link" onPress={() => nav.sheet({ kind })} hitSlop={8}><Txt style={{ fontSize: 12, color: C.muted, textDecorationLine: 'underline' }}>{kind[0].toUpperCase() + kind.slice(1)}</Txt></Pressable>)}
      </View>
    </View>
  </View>;
}

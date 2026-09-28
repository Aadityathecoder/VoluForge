import React from 'react';
import { Image, Pressable, View } from 'react-native';
import type { Opportunity } from '../data/models';
import { useApp } from '../data/AppProvider';
import { useNav } from './navigation';
import { C, Icon, IconButton, Txt, s } from './theme';
import { causeIcon, day, errorText, time } from './helpers';

export function OpportunityImage({ opportunity, height = 200 }: { opportunity: Opportunity; height?: number }) {
 const [failed, setFailed] = React.useState(false);
 React.useEffect(()=>setFailed(false),[opportunity.imageUrl]);
 if (!failed && (opportunity.imageUrl || opportunity.cause === 'Environment')) return <Image accessibilityLabel={`${opportunity.cause} volunteering`} source={opportunity.imageUrl ? { uri: opportunity.imageUrl } : require('../../assets/photos/coast.jpg')} onError={() => setFailed(true)} style={{ width: '100%', height }} resizeMode="cover"/>;
 const color = opportunity.cause === 'Education' ? C.blue : opportunity.cause === 'Food security' ? C.peach : C.green;
 return <View style={{ height, backgroundColor: color, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 100, borderWidth: 1, borderColor: C.white, top: -35, right: -20 }}/><View style={{ position: 'absolute', width: 210, height: 210, borderRadius: 100, borderWidth: 1, borderColor: C.white, bottom: -100, left: -10 }}/><Icon name={causeIcon(opportunity.cause)} size={height > 120 ? 74 : 35}/></View>;
}
export function OpportunityCard({ opportunity: o, compact = false }: { opportunity: Opportunity; compact?: boolean }) {
 const app = useApp(), nav = useNav(); const saved = app.savedIds.includes(o.id);
 const save = async () => { try { await app.saveOpportunity(o.id); } catch(e) { nav.notify(errorText(e)); } };
 if (compact) return <Pressable accessibilityRole="button" accessibilityLabel={`View ${o.title}`} onPress={() => nav.detail(o.id)} style={[s.row, { gap: 15, paddingVertical: 17, borderBottomWidth: 1, borderColor: C.line }]}><View style={{ width: 78, borderRadius: 16, overflow: 'hidden' }}><OpportunityImage opportunity={o} height={82}/></View><View style={{ flex: 1, gap: 5 }}><Txt style={{ fontWeight: '700', fontSize: 16, letterSpacing: -.4 }}>{o.title}</Txt><Txt style={{ color: C.muted, fontSize: 12 }}>{day(o.startsAt)} · {o.remote ? 'Remote' : o.location}</Txt></View><Icon name="arrow-forward" size={19}/></Pressable>;
 return <View style={{ backgroundColor: C.white, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.line }}><Pressable accessibilityRole="button" accessibilityLabel={`View ${o.title}`} onPress={() => nav.detail(o.id)}><OpportunityImage opportunity={o}/><View style={{ position: 'absolute', top: 15, left: 15, backgroundColor: C.bg, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7 }}><Txt style={{ fontSize: 10, fontWeight: '800', letterSpacing: .8 }}>{o.cause.toUpperCase()}</Txt></View><View style={{ padding: 20, gap: 9 }}><View style={[s.row, { gap: 5 }]}><Icon name="checkmark-circle" size={13} color={C.forest}/><Txt style={{ color: C.muted, fontSize: 11 }}>{o.organization}</Txt></View><Txt style={{ fontSize: 24, fontWeight: '800', letterSpacing: -.8, lineHeight: 28 }}>{o.title}</Txt><View style={[s.row, { gap: 6, marginTop: 4 }]}><Icon name="calendar-outline" size={14} color={C.muted}/><Txt style={{ color: C.muted, fontSize: 12 }}>{day(o.startsAt)} · {time(o.startsAt)}</Txt><Txt style={{ color: C.line }}> / </Txt><Txt style={{ color: C.muted, fontSize: 12 }}>{o.remote ? 'Remote' : 'In person'}</Txt></View></View></Pressable><IconButton name={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? `Unsave ${o.title}` : `Save ${o.title}`} active={saved} onPress={save} style={{ position: 'absolute', top: 13, right: 13, width: 40, height: 40 }}/></View>;
}

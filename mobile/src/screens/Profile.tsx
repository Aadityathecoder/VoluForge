import React from 'react';
import { Pressable, View } from 'react-native';
import { useApp } from '../data/AppProvider';
import { useNav } from '../ui/navigation';
import { C, Button, Chip, Eyebrow, Icon, Rule, Title, Txt, s, type IconName } from '../ui/theme';
import { errorText } from '../ui/helpers';

export function Profile(){const app=useApp(),nav=useNav();const p=app.profile;const row=(label:string,icon:IconName,fn:()=>void)=> <Pressable key={label} accessibilityRole="button" onPress={fn} style={[s.row,{gap:14,paddingVertical:20,borderBottomWidth:1,borderColor:C.line}]}><Icon name={icon} size={21}/><Txt style={{flex:1,fontWeight:'600'}}>{label}</Txt><Icon name="chevron-forward" size={16} color={C.muted}/></Pressable>;
 return <View style={{padding:24,paddingTop:29,paddingBottom:35}}><Eyebrow>A good human, doing good things</Eyebrow><View style={[s.row,{gap:18,marginTop:23}]}><View style={{backgroundColor:C.peach,width:72,height:72,borderRadius:100,alignItems:'center',justifyContent:'center'}}><Txt style={{fontSize:25,fontWeight:'800'}}>{p?.name.split(' ').map(n=>n[0]).join('').slice(0,2)||'VF'}</Txt></View><View style={{flex:1,gap:6}}><Title style={{fontSize:32}}>{p?.name||'Your profile'}</Title><Txt style={{color:C.muted,fontSize:13}}>{p?.school||'Your community starts with you.'}</Txt></View></View><Txt style={[s.body,{marginTop:20}]}>{p?.bio||'Your time and talents can make someone’s day a little better.'}</Txt><Button title="Edit your profile" variant="outline" icon="create-outline" style={{marginTop:20}} onPress={()=>nav.sheet({kind:'editProfile'})}/><Rule/><Txt style={s.sectionTitle}>Your kind of good</Txt><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:16}}>{p?.causes.map(c=><Chip key={c} label={c}/>)}</View><Eyebrow style={{marginTop:23,marginBottom:12}}>Skills you bring</Eyebrow><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{p?.skills.map(c=><Chip key={c} label={c}/>)}</View><Rule/>
 {!!app.staffOrganizations.length&&row('Partner workspace','business-outline',()=>nav.sheet({kind:'review'}))}
 {row('Privacy & your data','shield-checkmark-outline',()=>nav.sheet({kind:'privacy'}))}{row('Terms of use','document-text-outline',()=>nav.sheet({kind:'terms'}))}{row('Help & report a concern','help-circle-outline',()=>nav.sheet({kind:'support'}))}
 {app.mode==='demo'&&row('Reset sample data','refresh-outline',()=>nav.sheet({kind:'resetDemo'}))}
 {app.mode==='demo'&&row('Sign in to your account','log-in-outline',()=>nav.sheet({kind:'auth'}))}
 {row(app.mode==='demo'?'Leave demo':'Sign out','log-out-outline',()=>{void app.signOut().catch(e=>nav.notify(errorText(e)));})}
 <Pressable accessibilityRole="button" onPress={()=>nav.sheet({kind:'delete'})} style={{paddingVertical:22}}><Txt style={{color:C.red,fontSize:13}}>{app.mode==='demo'?'Delete local demo data':'Delete your account'}</Txt></Pressable><Txt style={{fontSize:11,color:C.muted,textAlign:'center',marginTop:16}}>VOLUFORGE · MADE FOR A LITTLE MORE GOOD{app.mode==='demo'?'\nPreview mode · all sample records are fictional':''}</Txt></View>;
}

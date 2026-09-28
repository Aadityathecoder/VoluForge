import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/data/AppProvider';
import { NavigationContext, type Sheet, type Tab } from './src/ui/navigation';
import { C, Button, Icon, IconButton, Txt, type IconName } from './src/ui/theme';
import { buzz, errorText } from './src/ui/helpers';
import { Home } from './src/screens/Home';
import { Explore } from './src/screens/Explore';
import { Activity } from './src/screens/Activity';
import { Impact } from './src/screens/Impact';
import { Profile } from './src/screens/Profile';
import { Detail } from './src/screens/Detail';
import { Welcome } from './src/screens/Welcome';
import { FormContent } from './src/screens/Forms';

const tabs: {id:Tab;label:string;icon:IconName;active:IconName}[]=[{id:'home',label:'Home',icon:'home-outline',active:'home'},{id:'explore',label:'Explore',icon:'compass-outline',active:'compass'},{id:'activity',label:'Activity',icon:'calendar-outline',active:'calendar'},{id:'impact',label:'Impact',icon:'flower-outline',active:'flower'},{id:'profile',label:'You',icon:'person-outline',active:'person'}];
export default function App(){return <SafeAreaProvider><AppProvider><Root/></AppProvider></SafeAreaProvider>;}
function Root(){const app=useApp(),{height,width}=useWindowDimensions();const[tab,setTab]=useState<Tab>('home'),[detail,setDetail]=useState<string|null>(null),[sheet,setSheet]=useState<Sheet|null>(null),[toast,setToast]=useState('');const scroll=useRef<ScrollView>(null),toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const notify=(value:string)=>{setToast(value);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),6000);};
 const navigate=(next:Tab)=>{buzz();setTab(next);setDetail(null);scroll.current?.scrollTo({y:0,animated:false});};const showDetail=(id:string)=>{setDetail(id);scroll.current?.scrollTo({y:0,animated:false});};
 useEffect(()=>{if(app.passwordRecovery)setSheet({kind:'password'});},[app.passwordRecovery]);
 useEffect(()=>{if(app.error)notify(app.error);},[app.error]);
 useEffect(()=>{const handler=BackHandler.addEventListener('hardwareBackPress',()=>{if(sheet){setSheet(null);return true;}if(detail){setDetail(null);return true;}if(tab!=='home'){setTab('home');return true;}return false;});return()=>handler.remove();},[detail,sheet,tab]);
 useEffect(()=>{if(app.mode==='signedOut'){setTab('home');setDetail(null);}},[app.mode]);
 if(!app.ready)return <View style={{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'}}><ActivityIndicator size="large" color={C.orange}/><Txt style={{marginTop:20}}>A little good is on its way.</Txt></View>;
 return <NavigationContext.Provider value={{tab,navigate,detail:showDetail,sheet:v=>setSheet(v),close:()=>setSheet(null),notify}}><StatusBar style="dark"/><View style={{flex:1,backgroundColor:'#EAE7DE',alignItems:'center'}}><SafeAreaView style={{flex:1,width:'100%',maxWidth:480,backgroundColor:C.bg,borderLeftWidth:width>480?1:0,borderRightWidth:width>480?1:0,borderColor:C.line}} edges={['top','bottom']}>
 {app.mode==='demo'&&<View style={{paddingVertical:7,alignItems:'center',backgroundColor:'#EEEBDC',borderBottomWidth:1,borderColor:C.line}}><Txt style={{fontSize:10,letterSpacing:.4,color:C.muted}}>PREVIEW MODE · FICTIONAL SAMPLE DATA</Txt></View>}
 <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{flex:1}} contentContainerStyle={{flexGrow:1,paddingBottom:app.mode==='signedOut'?15:14}} refreshControl={app.mode!=='signedOut'?<RefreshControl refreshing={app.loading&&!sheet} onRefresh={()=>{void app.refresh().catch(e=>notify(errorText(e)));}} tintColor={C.orange}/>:undefined}>
 {app.mode==='signedOut'?<Welcome/>:!app.profile?<View style={{padding:30,gap:20}}><Txt style={{fontSize:27,fontWeight:'800'}}>Let’s reconnect.</Txt><Txt style={{lineHeight:24}}>{app.error||'Your account data could not be loaded. Please try again.'}</Txt><Button title="Try again" onPress={()=>{void app.refresh().catch(e=>notify(errorText(e)));}}/><Button title="Sign out" variant="outline" onPress={()=>{void app.signOut().catch(e=>notify(errorText(e)));}}/><Button title="Delete account" variant="soft" onPress={()=>setSheet({kind:'delete'})}/></View>:detail?<Detail id={detail} onBack={()=>{setDetail(null);scroll.current?.scrollTo({y:0,animated:false});}}/>:tab==='home'?<Home/>:tab==='explore'?<Explore/>:tab==='activity'?<Activity/>:tab==='impact'?<Impact/>:<Profile/>}
 </ScrollView>
 {app.mode!=='signedOut'&&<View style={{paddingHorizontal:13,paddingTop:8,paddingBottom:Platform.OS==='web'?14:5,backgroundColor:C.bg,borderTopWidth:1,borderColor:C.line}}><View accessibilityRole="tablist" style={{flexDirection:'row',backgroundColor:C.ink,borderRadius:100,padding:6}}>{tabs.map(t=><Pressable key={t.id} accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{selected:tab===t.id&&!detail}} onPress={()=>navigate(t.id)} style={{flex:1,minHeight:52,borderRadius:100,backgroundColor:tab===t.id&&!detail?C.bg:'transparent',alignItems:'center',justifyContent:'center',gap:4}}><Icon name={tab===t.id?t.active:t.icon} size={20} color={tab===t.id&&!detail?C.ink:'#C4C5BB'}/><Txt style={{fontSize:9,fontWeight:'600',color:tab===t.id&&!detail?C.ink:'#C4C5BB'}}>{t.label}</Txt></Pressable>)}</View></View>}
 </SafeAreaView></View>
 <Modal visible={!!sheet} transparent animationType="slide" onRequestClose={()=>setSheet(null)} statusBarTranslucent><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1,justifyContent:'flex-end',alignItems:'center'}}><Pressable accessibilityRole="button" accessibilityLabel="Close dialog" onPress={()=>setSheet(null)} style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(18,20,16,.45)'}]}/><SafeAreaView accessibilityViewIsModal style={{backgroundColor:C.bg,width:'100%',maxWidth:480,maxHeight:height*.94,borderTopLeftRadius:28,borderTopRightRadius:28}} edges={['bottom']}><View style={{alignItems:'center',paddingTop:10}}><View style={{width:34,height:4,backgroundColor:C.line,borderRadius:5}}/></View><View style={{alignItems:'flex-end',paddingHorizontal:18,paddingTop:5}}><IconButton name="close" label="Close dialog" onPress={()=>setSheet(null)} style={{backgroundColor:C.soft,width:39,height:39}}/></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:25,paddingTop:8,paddingBottom:34}}>{sheet&&<FormContent key={sheet.kind+(sheet.id||'')} sheet={sheet}/>}</ScrollView></SafeAreaView></KeyboardAvoidingView></Modal>
 {!!toast&&<Pressable accessibilityRole="alert" accessibilityLiveRegion="polite" onPress={()=>setToast('')} style={{position:'absolute',bottom:105,alignSelf:'center',width:'88%',maxWidth:430,backgroundColor:C.ink,padding:17,borderRadius:18,boxShadow:'0px 6px 25px rgba(0,0,0,.15)'}}><Txt style={{color:C.white,fontSize:13,lineHeight:20}}>{toast}</Txt></Pressable>}
 </NavigationContext.Provider>;
}

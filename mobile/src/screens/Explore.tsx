import React, { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useApp } from '../data/AppProvider';
import { C, Chip, Empty, Eyebrow, Icon, IconButton, Title, Txt, s } from '../ui/theme';
import { OpportunityCard } from '../ui/OpportunityCard';

export function Explore() {
 const app=useApp();const [query,setQuery]=useState(''),[cause,setCause]=useState('All'),[saved,setSaved]=useState(false),[remote,setRemote]=useState(false);
 const causes=['All',...new Set(app.opportunities.map(o=>o.cause))];
 const opportunities=useMemo(()=>app.opportunities.filter(o=>o.status==='open'&&(!saved||app.savedIds.includes(o.id))&&(!remote||o.remote)&&(cause==='All'||o.cause===cause)&&`${o.title} ${o.organization} ${o.description} ${o.skills.join(' ')} ${o.location}`.toLowerCase().includes(query.toLowerCase())),[app.opportunities,app.savedIds,query,cause,saved,remote]);
 return <View style={{paddingTop:28,paddingBottom:30}}><View style={{paddingHorizontal:24}}><Eyebrow>Find your kind of good</Eyebrow><View style={[s.between,{marginTop:12}]}><Title>Show up.{'\n'}Make a difference.</Title><IconButton name={saved?'bookmark':'bookmark-outline'} label={saved?'Show all opportunities':'Show saved opportunities'} active={saved} onPress={()=>setSaved(!saved)}/></View><View style={[s.row,{gap:10,backgroundColor:C.soft,borderRadius:100,paddingHorizontal:17,marginTop:24}]}><Icon name="search-outline" size={21}/><TextInput accessibilityLabel="Search opportunities" value={query} onChangeText={setQuery} placeholder="Try a cause, skill, or neighborhood" placeholderTextColor={C.muted} style={{height:52,flex:1,fontSize:13,color:C.ink}}/>{query.length>0&&<IconButton name="close" label="Clear search" onPress={()=>setQuery('')} style={{width:30,height:30,backgroundColor:'transparent'}}/>}</View></View>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingHorizontal:24,paddingVertical:18}}>{causes.map(c=><Chip key={c} label={c} selected={c===cause} onPress={()=>setCause(c)}/>)}</ScrollView>
 <View style={{paddingHorizontal:24}}><View style={[s.between,{marginBottom:18}]}><Txt style={{fontSize:12,color:C.muted}}>{opportunities.length} {saved?'saved ':''}opportunit{opportunities.length===1?'y':'ies'}</Txt><Chip label="Remote only" selected={remote} icon="laptop-outline" onPress={()=>setRemote(!remote)}/></View><View style={{gap:22}}>{opportunities.map(o=><OpportunityCard key={o.id} opportunity={o}/>)}</View>{opportunities.length===0&&<Empty icon={saved?'bookmark-outline':'search-outline'} title={saved?'A little inspiration, saved.':'No matches just yet.'} text={saved?'Tap the bookmark on an opportunity to keep it here.':'Try another cause or a broader search.'}/>}</View></View>;
}

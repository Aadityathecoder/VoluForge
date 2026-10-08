import type {Sheet,Tab} from '../ui/navigation';
export const webTabPaths:Record<Tab,string>={home:'/',explore:'/explore',activity:'/activity',impact:'/impact',profile:'/profile'};
export function webRoute(path:string,search=''):{tab:Tab;sheet?:Sheet;detail?:string} {
 const tabs:Record<string,Tab>={'/':'home','/dashboard':'home','/service':'home','/explore':'explore','/activity':'activity','/impact':'impact','/profile':'profile'};
 const sheets:Record<string,Sheet>={'/auth/login':{kind:'auth'},'/auth/signup':{kind:'auth',id:'signup'},'/auth/forgot-password':{kind:'auth',id:'reset'},'/partners':{kind:'partner'},'/community':{kind:'insights'},'/privacy':{kind:'privacy'},'/terms':{kind:'terms'},'/support':{kind:'support'}};
 return {tab:tabs[path]??'home',sheet:sheets[path],detail:path==='/opportunity'?new URLSearchParams(search).get('id')??undefined:undefined};
}

export function webSheetPath(sheet:Sheet):string|undefined {
 if(sheet.kind==='auth')return sheet.id==='signup'?'/auth/signup':sheet.id==='reset'?'/auth/forgot-password':'/auth/login';
 return ({partner:'/partners',insights:'/community',privacy:'/privacy',terms:'/terms',support:'/support'} as Partial<Record<Sheet['kind'],string>>)[sheet.kind];
}

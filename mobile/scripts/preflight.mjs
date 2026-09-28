import { existsSync, readFileSync } from 'node:fs';
const env = { ...process.env };
for (const file of ['.env','.env.local']) if (existsSync(file)) for (const line of readFileSync(file,'utf8').split('\n')) {
 const match = line.match(/^([A-Z_]+)=(.*)$/); if (match && !env[match[1]]) env[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,'');
}
const errors=[];
for(const name of ['EXPO_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_PRIVACY_URL','EXPO_PUBLIC_TERMS_URL','EXPO_PUBLIC_SUPPORT_URL']) {
 try { const u=new URL(env[name]); if(u.protocol!=='https:'||/localhost|example\.|placeholder/i.test(u.hostname))throw new Error(); } catch { errors.push(`${name}: set a real public HTTPS URL.`); }
}
if(!env.EXPO_PUBLIC_SUPABASE_ANON_KEY)errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY: missing public key.');
if(env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.startsWith('sb_secret_'))errors.push('Never include a secret Supabase key in an app bundle.');
try{const k=env.EXPO_PUBLIC_SUPABASE_ANON_KEY;if(k?.split('.').length===3&&JSON.parse(Buffer.from(k.split('.')[1],'base64url').toString()).role==='service_role')errors.push('Remove the service-role key from public configuration.');}catch{}
if(!/^[0-9a-f-]{36}$/i.test(env.EAS_PROJECT_ID||''))errors.push('EAS_PROJECT_ID: initialize a project in your Expo account.');
if(!/^[a-zA-Z0-9]+(\.[a-zA-Z0-9-]+){2,}$/.test(env.IOS_BUNDLE_IDENTIFIER||''))errors.push('IOS_BUNDLE_IDENTIFIER: confirm your registered bundle identifier.');
if(errors.length){console.error('Release configuration is incomplete:\n'+errors.map(e=>'• '+e).join('\n'));process.exitCode=1;}else{console.log('Local configuration checks passed. This does not validate deployment, URL content, signing, App Review compliance, or device behavior. Complete docs/APP_STORE_RELEASE.md before submitting.');}

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
const root=resolve(import.meta.dirname,'..'), mobile=resolve(root,'mobile'), output=resolve(root,'public/voluforge');
function fingerprint(){const hash=createHash('sha256');function visit(path){if(statSync(path).isDirectory()){for(const name of readdirSync(path).sort())visit(resolve(path,name));}else{hash.update(relative(mobile,path));hash.update(readFileSync(path));}}for(const name of ['App.tsx','index.ts','app.config.ts','package.json','pnpm-lock.yaml','src','assets'])visit(resolve(mobile,name));return hash.digest('hex');}
function publicConfig(){const config={};for(const file of [resolve(mobile,'.env.local'),resolve(root,'.env.local')]){if(existsSync(file)){for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^(EXPO_PUBLIC_SUPABASE_|NEXT_PUBLIC_SUPABASE_)(URL|ANON_KEY)=(.*)$/);if(m)config[m[2]==='URL'?'url':'key']=m[3].trim().replace(/^['"]|['"]$/g,'');}}}config.url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.EXPO_PUBLIC_SUPABASE_URL||config.url;config.key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY||config.key;return config;}
if(process.argv[2]==='export'){
 const result=spawnSync(process.execPath,[resolve(mobile,'node_modules/expo/bin/cli'),'export','--platform','web','--output-dir',output],{cwd:mobile,stdio:'inherit',env:{...process.env,VOLUFORGE_WEBSITE_BUILD:'1'}});if(result.status!==0)process.exit(result.status||1);
 copyFileSync(resolve(mobile,'src/ui/website.css'),resolve(output,'website.css'));copyFileSync(resolve(mobile,'assets/fonts/DMSans.ttf'),resolve(output,'DMSans.ttf'));copyFileSync(resolve(mobile,'assets/fonts/OFL.txt'),resolve(output,'FONT-LICENSE.txt'));
 let html=readFileSync(resolve(output,'index.html'),'utf8');html=html.replace('</head>','<meta name="description" content="Find meaningful volunteer opportunities, build your skills, and track independently approved service and outcomes with VoluForge."><link rel="canonical" href="https://voluforge.xyz/"><link rel="preload" href="/voluforge/DMSans.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="/voluforge/website.css"><script src="/voluforge/runtime-config.js"></script></head>');html=html.replace(/<title>.*?<\/title>/,'<title>VoluForge — A little time. A lot of good.</title>');writeFileSync(resolve(output,'index.html'),html);writeFileSync(resolve(output,'source-manifest.json'),JSON.stringify({sha256:fingerprint(),publicConfig:publicConfig()},null,2)+'\n');
}
const manifest=JSON.parse(readFileSync(resolve(output,'source-manifest.json'),'utf8'));
if(manifest.sha256!==fingerprint())throw new Error('Shared app changed. Run npm run website:export and include public/voluforge in this release.');
const config={...manifest.publicConfig,...Object.fromEntries(Object.entries(publicConfig()).filter(([,v])=>v))};
if(!config.url||!config.key)throw new Error('Configure the Supabase public URL and publishable key for the website.');
writeFileSync(resolve(output,'runtime-config.js'),'window.__VOLUFORGE_CONFIG__='+JSON.stringify(config).replace(/</g,'\\u003c')+';\n');
console.log('Shared VoluForge website verified.');

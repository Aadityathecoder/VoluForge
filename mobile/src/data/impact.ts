import { defaultPreferences, matchOpportunity, type Preferences, type Opportunity as ImpactOpportunity } from './impactEngine';
import type { Opportunity, Profile } from './models';
export function preferencesFor(profile: Profile | null): Preferences {
 const stored=profile?.preferences as Partial<Preferences>|undefined;
 const p=stored&&typeof stored==='object'?stored:{};
 const strings=(v:unknown)=>Array.isArray(v)?v.filter((s):s is string=>typeof s==='string'):[];
 const number=(v:unknown,fallback:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:fallback;
 const weights=Object.fromEntries(Object.entries(defaultPreferences.weights).map(([k,v])=>[k,number(p.weights?.[k as keyof Preferences['weights']],v,0,100)])) as Preferences['weights'];
 return {...defaultPreferences,skills:strings(profile?.skills),causes:strings(profile?.causes),location:typeof p.location==='string'?p.location:'',remote:typeof p.remote==='boolean'?p.remote:true,experience:number(p.experience,0,0,600),age:typeof p.age==='number'&&Number.isInteger(p.age)&&p.age>=13&&p.age<=120?p.age:null,availableFrom:typeof p.availableFrom==='string'&&Number.isFinite(Date.parse(p.availableFrom))?p.availableFrom:'',availableTo:typeof p.availableTo==='string'&&Number.isFinite(Date.parse(p.availableTo))?p.availableTo:'',weights};
}
export function impactOpportunity(o:Opportunity):ImpactOpportunity {
 return {id:o.id,org_id:o.organizationId,organization:o.organization,title:o.title,description:o.description,category:o.cause,location:o.location,remote:o.remote,starts_at:o.startsAt,ends_at:o.endsAt,capacity:o.capacity,spots_left:o.spotsLeft,min_age:o.minimumAge,skills:o.skills,min_experience:o.minimumExperience??0,urgency:o.urgency??1,outcome_metric:o.outcomeMetric??'people served',outcome_target:o.outcomeTarget??1,status:o.status==='open'?'published':o.status,proof_required:o.proofRequired};
}
export function rankedOpportunities(opportunities:Opportunity[],profile:Profile|null,now=Date.now()) {
 const p=preferencesFor(profile);
 return opportunities.map(o=>({opportunity:o,match:matchOpportunity(impactOpportunity(o),p,now)})).sort((a,b)=>Number(b.match.eligible)-Number(a.match.eligible)||b.match.score-a.match.score||a.opportunity.startsAt.localeCompare(b.opportunity.startsAt));
}
export function verifiedOutcomes(entries: {id:string;status:string}[], outcomes: import('./impactEngine').Outcome[]) {
 const approved=new Set(entries.filter(e=>e.status==='approved').map(e=>e.id));
 return outcomes.filter(r=>r.status==='approved'&&approved.has(r.service_entry_id));
}

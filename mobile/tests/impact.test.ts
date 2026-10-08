import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDemo,demoOpportunities} from '../src/data/demo';
import {impactOpportunity,preferencesFor,rankedOpportunities,verifiedOutcomes} from '../src/data/impact';
import {allocate,matchOpportunity,needsIndex} from '../src/data/impactEngine';
test('native preferences drive ranking, explanations, age and schedule eligibility',()=>{
 const profile=createDemo().profile,opps=demoOpportunities();profile.skills=['Organization','Teamwork'];profile.causes=['Food security'];profile.preferences={...preferencesFor(profile),age:18,location:'Boca Raton, FL',availableFrom:new Date(Date.now()-86400000).toISOString(),availableTo:new Date(Date.now()+40*86400000).toISOString()};
 const ranked=rankedOpportunities(opps.filter(o=>o.status==='open'),profile);assert.equal(ranked[0].opportunity.cause,'Food security');assert.equal(ranked[0].match.confirmed,true);assert.ok(ranked[0].match.reasons.some(r=>r.includes('Organization')));
 const p=preferencesFor(profile),o=impactOpportunity(opps.find(o=>o.id==='demo-literacy')!);assert.equal(matchOpportunity(o,{...p,age:13}).eligible,false);assert.equal(matchOpportunity(o,{...p,availableTo:new Date().toISOString()}).eligible,false);
});
test('native verified totals require both service and outcome approval',()=>{
 const snapshot=createDemo();const outcomes=[...snapshot.outcomes!,{...snapshot.outcomes![0],id:'pending',status:'pending'},{...snapshot.outcomes![0],id:'missing',service_entry_id:'unknown'}];assert.equal(verifiedOutcomes(snapshot.entries,outcomes).length,3);assert.equal(verifiedOutcomes(snapshot.entries.map(e=>({...e,status:'pending'})),outcomes).length,0);
});
test('needs exclude historical listings; allocation requires complete eligibility',()=>{
 const opps=demoOpportunities().map(impactOpportunity);assert.equal(needsIndex(opps).reduce((s,g)=>s+g.opportunities,0),8);const p=preferencesFor(createDemo().profile);assert.equal(allocate([{id:'a',preferences:p,opportunityIds:opps.map(o=>o.id)}],opps).length,0);
 const complete={...p,skills:[...new Set(opps.flatMap(o=>o.skills))],age:18,availableFrom:new Date(Date.now()-86400000).toISOString(),availableTo:new Date(Date.now()+40*86400000).toISOString(),location:'Boca Raton, FL'};assert.equal(allocate([{id:'a',preferences:complete,opportunityIds:opps.map(o=>o.id)}],opps).length,1);
});

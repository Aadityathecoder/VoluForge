import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webRoute,webTabPaths,webSheetPath} from '../src/data/webNavigation';
test('website URLs restore the requested tab and opportunity',()=>{for(const [tab,path] of Object.entries(webTabPaths))assert.equal(webRoute(path).tab,tab);assert.equal(webRoute('/opportunity','?id=a%2Fb').detail,'a/b');assert.equal(webRoute('/service').tab,'home');});
test('auth and policy URLs open the correct dialog',()=>{assert.deepEqual(webRoute('/auth/signup').sheet,{kind:'auth',id:'signup'});assert.deepEqual(webRoute('/auth/forgot-password').sheet,{kind:'auth',id:'reset'});assert.equal(webRoute('/privacy').sheet?.kind,'privacy');});
test('shareable dialog URLs include auth mode and partner scope',()=>{assert.equal(webSheetPath({kind:'auth',id:'signup'}),'/auth/signup');assert.equal(webSheetPath({kind:'partner'}),'/partners');assert.equal(webSheetPath({kind:'review'}),undefined);});

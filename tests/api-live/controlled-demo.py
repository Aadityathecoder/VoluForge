"""Phased live HTTP demo; secrets stay in an ignored mode-0600 state file.
SQL checks between phases are in docs/evidence/week-3/verify.sql.
Use only synthetic demo accounts. Never prints passwords, sessions, or keys.
"""
import sys, json, secrets, urllib.request, urllib.error, os
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / '.api-test-state.json'
state = json.loads(STATE.read_text()) if STATE.exists() else {
    'password': secrets.token_urlsafe(30),
    'emails': {k: f'vf-week3-20261011-{k}@example.com' for k in ('volunteer', 'nonprofit')},
    'checks': [], 'runDate': '2026-10-11',
}
BASE = os.environ.get('API_BASE_URL', 'http://127.0.0.1:3157') + '/api/v1/'
def call(method, path, payload=None, kind=None, expect=200, origin=None):
    headers = {'Content-Type': 'application/json'}
    if origin: headers['Origin'] = origin
    if kind: headers['Authorization'] = 'Bearer ' + state[kind]['session']['access_token']
    req = urllib.request.Request(BASE + path, data=json.dumps(payload).encode() if payload is not None else None, headers=headers, method=method)
    try: response = urllib.request.urlopen(req, timeout=40)
    except urllib.error.HTTPError as e: response = e
    with response:
        result = json.load(response)
        assert response.status == expect, f'{method} {path}: expected {expect}, got {response.status}; {result.get("error", "no error")}'
    item = {'method': method, 'path': path, 'actor': kind or 'anonymous', 'status': expect, 'passed': True}
    state['checks'].append(item)
    print(f'PASS {method} {path} ({kind or "anonymous"}) -> {expect}')
    return result

def opportunity():
    return {'org_id': state['org_id'], 'title': 'Week 3 API Demo: community supply kits',
      'description': 'Synthetic classroom demo: help package community supply kits. Not a real volunteer listing.',
      'starts_at': '2026-10-18T12:00:00Z', 'ends_at': '2026-10-18T15:00:00Z', 'capacity': 10,
      'status': 'published', 'remote': True, 'skills': ['Organization'], 'category': 'Community'}

phase = sys.argv[1]
try:
    if phase == 'signup':
        for kind in ('volunteer', 'nonprofit'):
            payload = {'email': state['emails'][kind], 'password': state['password'], 'fullName': 'Week 3 Demo ' + kind, 'accountType': kind}
            if kind == 'nonprofit': payload['organizationName'] = 'Week 3 API Demo Nonprofit'
            result = call('POST', 'auth/signup', payload, expect=201)
            state[kind] = result
            print(kind + ' account id:', result['user']['id'])
    elif phase == 'login':
        for kind in ('volunteer', 'nonprofit'):
            state[kind] = call('POST', 'auth/login', {'email': state['emails'][kind], 'password': state['password']})
            me = call('GET', 'auth/me', kind=kind)
            assert me['user']['id'] == state[kind]['user']['id']
            if kind == 'nonprofit':
                state['org_id'] = me['memberships'][0]['org_id']
                print('Nonprofit organization id:', state['org_id'])
        call('POST', 'auth/login', {'email': state['emails']['volunteer'], 'password': 'wrong-password'}, expect=401)
        call('GET', 'opportunities', expect=401)
        call('POST', 'opportunities', opportunity(), 'nonprofit', 403)
        call('POST', 'opportunities', opportunity(), 'volunteer', 403)
    elif phase == 'publish':
        result = call('POST', 'opportunities', opportunity(), 'nonprofit', 201)
        state['opportunity_id'] = result['opportunity']['id']
        print('Opportunity id:', state['opportunity_id'])
        result = call('GET', 'opportunities?limit=100', kind='volunteer')
        assert any(o['id'] == state['opportunity_id'] for o in result['opportunities'])
        call('GET', 'opportunities?limit=0', kind='volunteer', expect=400)
        bad = opportunity(); bad['capacity'] = 0
        call('POST', 'opportunities', bad, 'nonprofit', 400)
    elif phase == 'apply':
        path = 'opportunities/' + state['opportunity_id'] + '/applications'
        payload = {'message': 'I can organize and package the community supply kits.', 'availability': 'Sunday noon to three'}
        if 'application_id' not in state:
            result = call('POST', path, payload, 'volunteer', 201)
            state['application_id'] = result['application']['id']
            assert result['application']['student_id'] == state['volunteer']['user']['id']
        call('POST', path, payload, 'volunteer', 409)
        call('POST', path, payload, 'nonprofit', 403)
        query = 'applications?opportunity_id=' + state['opportunity_id']
        call('GET', query, kind='volunteer', expect=403)
        result = call('GET', query, kind='nonprofit')
        assert any(a['id'] == state['application_id'] for a in result['applications'])
        print('Application id:', state['application_id'])
    elif phase == 'boundaries':
        call('GET', 'unknown', expect=404)
        call('GET', 'auth/signup', expect=405)
        call('POST', 'auth/login', {}, expect=403, origin='https://untrusted.example')
        call('POST', 'auth/signup', {'email': 'synthetic@example.com', 'password': '12345678', 'fullName': 'Synthetic', 'role': 'admin'}, expect=400)
        call('POST', 'auth/signup', [], expect=400)
        call('GET', 'opportunities?offset=-1', kind='volunteer', expect=400)
    elif phase == 'logout':
        for kind in ('volunteer', 'nonprofit'):
            call('POST', 'auth/logout', {}, kind)
            # Supabase JWTs can survive logout until expiry; refresh must be revoked.
            values = {}
            for line in (ROOT / '.env.local').read_text().splitlines():
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1); values[k] = v.strip().strip('"\'')
            req = urllib.request.Request(values['NEXT_PUBLIC_SUPABASE_URL'] + '/auth/v1/token?grant_type=refresh_token',
              data=json.dumps({'refresh_token': state[kind]['session']['refresh_token']}).encode(),
              headers={'apikey': values['NEXT_PUBLIC_SUPABASE_ANON_KEY'], 'Content-Type': 'application/json'}, method='POST')
            try:
                with urllib.request.urlopen(req) as response: raise AssertionError('Refresh token still works after logout')
            except urllib.error.HTTPError as e:
                assert e.code in (400, 401, 403)
                print('PASS ' + kind + ' refresh token rejected after logout -> ' + str(e.code))
                state['checks'].append({'method': 'POST', 'path': 'Supabase Auth refresh', 'actor': kind, 'status': e.code, 'passed': True})
            call('GET', 'auth/me', expect=401)
    else: raise SystemExit('Unknown phase')
finally:
    STATE.write_text(json.dumps(state)); STATE.chmod(0o600)
    evidence = ROOT / 'docs/evidence/week-3/http-results.json'
    evidence.parent.mkdir(parents=True, exist_ok=True)
    evidence.write_text(json.dumps({'base': BASE, 'database': 'Hosted Supabase; independent SQL editor checks recorded separately', 'checks': state['checks']}, indent=2) + '\n')

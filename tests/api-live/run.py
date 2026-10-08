"""Real HTTP + independent SQL checks. Never print credentials or tokens.
Run only with a dedicated test Supabase database and the website server running.
"""
import json, os, secrets, time, urllib.request, urllib.error, http.cookiejar
from pathlib import Path
import psycopg
from dotenv import dotenv_values

root = Path(__file__).resolve().parents[2]
# Load privately; do not print environment values.
supplied_environment = set(os.environ)
for file in (root / '.env', root / '.env.local'):
    if file.exists():
        for key, value in dotenv_values(file).items():
            if key not in supplied_environment and value is not None: os.environ[key] = value
if os.environ.get('API_TEST_DATABASE') != 'true':
    raise SystemExit('Set API_TEST_DATABASE=true only for a dedicated test Supabase project. No records created.')
if not os.environ.get('DATABASE_URL'):
    raise SystemExit('DATABASE_URL is missing. No records created.')
base = os.environ.get('API_BASE_URL', 'http://127.0.0.1:3157').rstrip('/') + '/api/v1/'

class Browser:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.http = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
    def call(self, method, path, payload=None, expect=200):
        req = urllib.request.Request(base + path, data=json.dumps(payload).encode() if payload is not None else None,
            headers={'Content-Type': 'application/json'}, method=method)
        try:
            response = self.http.open(req, timeout=30)
        except urllib.error.HTTPError as response_error:
            response = response_error
        with response:
            result = json.load(response)
            assert response.status == expect, f'{method} {path}: expected {expect}, received {response.status}'
            return result

db = psycopg.connect(os.environ['DATABASE_URL'], autocommit=True)
def rows(sql, args=()):
    with db.cursor() as cursor:
        cursor.execute(sql, args)
        return cursor.fetchall()
def count(table, where, args):
    return rows(f'SELECT count(*) FROM {table} WHERE {where}', args)[0][0]

tag = secrets.token_hex(8)
emails = [f'vf-api-{tag}-{kind}@example.com' for kind in ('volunteer', 'nonprofit')]
password = secrets.token_urlsafe(24)
clients = [Browser(), Browser()]
org_id = opportunity_id = None
try:
    # Preflight reads only; applying migrations is a separate, explicit step.
    assert rows("select exists(select 1 from pg_trigger where tgname='vf_signup_organization')")[0][0], 'Apply the API nonprofit signup migration to the test project first.'
    for kind, email, client in zip(('volunteer', 'nonprofit'), emails, clients):
        assert count('auth.users', 'email=%s', (email,)) == 0
        payload = {'email': email, 'password': password, 'fullName': 'API Test ' + kind, 'accountType': kind}
        if kind == 'nonprofit': payload['organizationName'] = 'API Test ' + tag
        created = client.call('POST', 'auth/signup', payload, 201)
        assert count('auth.users', 'email=%s', (email,)) == 1
        uid = rows('select id from auth.users where email=%s', (email,))[0][0]
        assert str(uid) == created['user']['id']
        assert rows('select full_name from vf_profiles where id=%s', (uid,))[0][0] == payload['fullName']
        if kind == 'nonprofit':
            org_id, verified, role = rows('select o.id,o.verified,s.role from vf_org_staff s join vf_organizations o on o.id=s.org_id where s.user_id=%s', (uid,))[0]
            assert verified is False and role == 'owner'
        # Dedicated test only: bypass delivery to example.com without exposing tokens.
        rows('update auth.users set email_confirmed_at=now() where id=%s', (uid,))
        before = count('auth.sessions', 'user_id=%s', (uid,))
        client.call('POST', 'auth/login', {'email': email, 'password': password})
        assert count('auth.sessions', 'user_id=%s', (uid,)) == before + 1
        assert client.call('GET', 'auth/me')['user']['id'] == str(uid)
        print('PASS: ' + kind + ' signup and login, independently verified in SQL')
    student, owner = clients
    owner.call('POST', 'auth/login', {'email': emails[1], 'password': 'incorrect'}, 401)
    payload = {'org_id': str(org_id), 'title': 'API Test ' + tag, 'description': 'Temporary community supply distribution opportunity.',
        'starts_at': '2099-01-01T12:00:00Z', 'ends_at': '2099-01-01T15:00:00Z', 'capacity': 10, 'status': 'published'}
    before = count('vf_opportunities', 'org_id=%s', (org_id,))
    owner.call('POST', 'opportunities', payload, 403)
    assert count('vf_opportunities', 'org_id=%s', (org_id,)) == before
    rows('update vf_organizations set verified=true where id=%s', (org_id,))
    student.call('POST', 'opportunities', payload, 403)
    opportunity_id = owner.call('POST', 'opportunities', payload, 201)['opportunity']['id']
    assert count('vf_opportunities', 'org_id=%s', (org_id,)) == before + 1
    assert rows('select title,status,capacity from vf_opportunities where id=%s', (opportunity_id,))[0] == (payload['title'], 'published', 10)
    assert count('vf_audit', "entity_id=%s and action='opportunity.saved'", (opportunity_id,)) == 1
    # Find the created opportunity through the volunteer HTTP list, including pagination.
    visible = False
    for offset in range(0, 10001, 100):
        page = student.call('GET', f'opportunities?limit=100&offset={offset}')['opportunities']
        if any(o['id'] == opportunity_id for o in page): visible = True; break
        if len(page) < 100: break
    assert visible, 'New nonprofit opportunity was not visible to volunteer'
    print('PASS: nonprofit creation and volunteer list, verified in SQL')
    apply_path = f'opportunities/{opportunity_id}/applications'
    application_body = {'message': 'I can help distribute community supplies.', 'availability': 'Saturday afternoon'}
    assert count('vf_applications', 'opportunity_id=%s', (opportunity_id,)) == 0
    application_id = student.call('POST', apply_path, application_body, 201)['application']['id']
    assert rows('select status,message,availability from vf_applications where id=%s', (application_id,))[0] == ('pending', application_body['message'], application_body['availability'])
    student.call('POST', apply_path, application_body, 409)
    assert count('vf_applications', 'opportunity_id=%s', (opportunity_id,)) == 1
    query = f'applications?opportunity_id={opportunity_id}'
    student.call('GET', query, expect=403)
    assert owner.call('GET', query)['applications'][0]['id'] == application_id
    print('PASS: application and nonprofit review, verified in SQL')
    for email, client in zip(emails, clients):
        uid = rows('select id from auth.users where email=%s', (email,))[0][0]
        before = count('auth.sessions', 'user_id=%s', (uid,))
        client.call('POST', 'auth/logout', {})
        assert count('auth.sessions', 'user_id=%s', (uid,)) < before
        client.call('GET', 'auth/me', expect=401)
    print('PASS: both logouts, verified in SQL and subsequent HTTP requests')
finally:
    # Remove only records linked to this run's exact emails and organization.
    try:
        if org_id is None:
            found = rows('select org_id from vf_org_staff s join auth.users u on u.id=s.user_id where u.email=%s', (emails[1],))
            if found: org_id = found[0][0]
        with db.transaction():
            if org_id:
                rows('delete from vf_applications where opportunity_id in (select id from vf_opportunities where org_id=%s)', (org_id,))
                rows('delete from vf_audit where org_id=%s or actor_id in (select id from auth.users where email=any(%s))', (org_id, emails))
                rows('delete from vf_opportunities where org_id=%s', (org_id,))
                rows('delete from vf_organizations where id=%s', (org_id,))
            rows('delete from auth.users where email=any(%s)', (emails,))
        assert count('auth.users', 'email=any(%s)', (emails,)) == 0
        print('PASS: temporary test records removed')
    finally: db.close()

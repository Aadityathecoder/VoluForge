// Unit-test the Edge handler with explicit Auth/Storage mocks; no network/deletion.
// Run from the app root: node --test supabase/tests/delete-account.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import ts from '../../node_modules/typescript/lib/typescript.js';

const source = (await fs.readFile(new URL('../functions/delete-account/index.ts', import.meta.url), 'utf8'))
  .replace(/^import .*createClient.*;\s*$/m, '');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);

function setup(options = {}) {
  const calls = [];
  let handler;
  let page = 0;
  const userId = '11111111-1111-1111-1111-111111111111';
  const admin = {
    auth: {
      getUser: async token => {
        calls.push(['getUser', token]);
        return options.badAuth ? { data: { user: null }, error: new Error('bad JWT') } : { data: { user: { id: userId } }, error: null };
      },
      admin: { deleteUser: async (...args) => { calls.push(['deleteUser', ...args]); return { error: options.authDeleteFail ? new Error('blocked') : null }; } },
    },
    rpc: async (...args) => { calls.push(['rpc', ...args]); return { error: options.freezeFail ? new Error('freeze failed') : null }; },
    storage: {
      from: bucket => {
        assert.equal(bucket, 'vf-proofs');
        return {
          list: async (prefix) => {
            calls.push(['list', prefix]);
            return { data: options.files?.[page++] || [], error: options.listFail ? new Error('storage failure') : null };
          },
          remove: async paths => { calls.push(['remove', paths]); return { error: options.removeFail ? new Error('remove failed') : null }; },
        };
      },
    },
  };
  vm.runInNewContext(compiled.outputText, {
    Deno: { serve: fn => { handler = fn; }, env: { get: name => ({ SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-server-key' })[name] } },
    createClient: (_url, key) => { assert.equal(key, 'test-server-key'); return admin; },
    Request, Response, console: { error: (...args) => { calls.push(['log', ...args]); } },
  });
  return { calls, handler, userId };
}
const request = (body = { confirmation: 'DELETE' }, auth = 'Bearer valid-user-token', method = 'POST') => new Request('https://test.invalid/delete-account', {
  method, headers: auth ? { Authorization: auth, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
  ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
});

test('requires POST, JWT, and explicit confirmation before privileged work', async () => {
  for (const [req, expected] of [[request({}, null), 401], [request({}), 400], [request({}, 'Bearer x', 'GET'), 405]]) {
    const ctx = setup();
    const response = await ctx.handler(req);
    assert.equal(response.status, expected);
    assert.equal(ctx.calls.length, 0);
  }
});

test('rejects invalid JWT before touching data', async () => {
  const ctx = setup({ badAuth: true });
  const response = await ctx.handler(request());
  assert.equal(response.status, 401);
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.calls[0][0], 'getUser');
});

test('always deletes authenticated user, ignoring a supplied different userId', async () => {
  const ctx = setup({ files: [[{ id: 'object-1', name: 'one.jpg' }], [{ id: 'object-2', name: 'two.pdf' }], []] });
  const response = await ctx.handler(request({ confirmation: 'DELETE', userId: 'someone-else' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).deleted, true);
  assert.equal(ctx.calls[1][0], 'rpc');
  assert.equal(ctx.calls[1][2].p_user_id, ctx.userId);
  const removes = ctx.calls.filter(call => call[0] === 'remove');
  assert.equal(removes.length, 2);
  assert.equal(removes[0][1][0], `${ctx.userId}/one.jpg`);
  assert.equal(removes[1][1][0], `${ctx.userId}/two.pdf`);
  const deletion = ctx.calls.at(-1);
  assert.equal(deletion[0], 'deleteUser');
  assert.equal(deletion[1], ctx.userId);
  assert.equal(deletion[2], false);
});

test('freeze failure stops before file removal or auth deletion', async () => {
  const ctx = setup({ freezeFail: true });
  assert.equal((await ctx.handler(request())).status, 503);
  assert.equal(ctx.calls.some(call => ['list', 'remove', 'deleteUser'].includes(call[0])), false);
});

test('storage failure leaves Auth account available for cleanup retry', async () => {
  for (const options of [{ listFail: true }, { files: [[{ id: '1', name: 'file.pdf' }]], removeFail: true }]) {
    const ctx = setup(options);
    const response = await ctx.handler(request());
    assert.equal(response.status, 503);
    assert.equal((await response.json()).retryable, true);
    assert.equal(ctx.calls.some(call => call[0] === 'deleteUser'), false);
  }
});

test('unexpected nested storage content is not silently discarded', async () => {
  const ctx = setup({ files: [[{ id: null, name: 'folder' }]] });
  assert.equal((await ctx.handler(request())).status, 503);
  assert.equal(ctx.calls.some(call => call[0] === 'deleteUser'), false);
});

test('Auth deletion failure is not reported as success', async () => {
  const ctx = setup({ authDeleteFail: true });
  const response = await ctx.handler(request());
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.deleted, undefined);
  assert.equal(body.retryable, true);
  assert.equal(JSON.stringify(ctx.calls.filter(call => call[0] === 'log')).includes('valid-user-token'), false);
});

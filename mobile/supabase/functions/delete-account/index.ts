// Deploy with Supabase Edge Functions. The service-role credential stays on the server.
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') return json(405, { error: 'Use POST.' });
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ') || authorization.length < 10) {
    return json(401, { error: 'Sign in before deleting your account.' });
  }
  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'A valid confirmation is required.' });
  }
  if (body?.confirmation !== 'DELETE') {
    return json(400, { error: 'Confirm account deletion by sending confirmation: DELETE.' });
  }
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json(503, { error: 'Account deletion is not configured. Contact support.' });

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // getUser performs server-side JWT validation and confirms the account still exists.
  // Never accept a user ID from request JSON, or rely on merely decoding JWT claims.
  const token = authorization.slice('Bearer '.length);
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return json(401, { error: 'Your session expired. Sign in and try again.' });
  const userId = authData.user.id;

  try {
    // Freeze first. Existing access tokens can no longer read/write vf_* tables or proofs.
    // If cleanup fails, keep frozen and permit this authenticated endpoint to retry.
    const { error: freezeError } = await admin.rpc('vf_prepare_account_deletion', { p_user_id: userId });
    if (freezeError) throw new Error('prepare_failed');

    // The proof policy permits exactly uid/uuid.ext, so there are no nested folders.
    // Always use Storage API; deleting storage.objects SQL rows would orphan file bytes.
    let storageEmpty = false;
    for (let batch = 0; batch < 20; batch++) {
      const { data: files, error: listError } = await admin.storage.from('vf-proofs').list(userId, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (listError) throw new Error('storage_list_failed');
      if (!files?.length) { storageEmpty = true; break; }
      if (files.some((file) => !file.id || file.name.includes('/'))) throw new Error('unexpected_proof_path');
      const { error: removeError } = await admin.storage.from('vf-proofs')
        .remove(files.map((file) => `${userId}/${file.name}`));
      if (removeError) throw new Error('storage_remove_failed');
    }
    if (!storageEmpty) throw new Error('cleanup_batch_limit');

    // Hard deletion invalidates refresh sessions. FK cascades remove private app data.
    // Audit actor/reviewer references are anonymized through ON DELETE SET NULL.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false);
    if (deleteError) throw new Error('auth_delete_failed');
    return json(200, { deleted: true });
  } catch (error) {
    // Log only a coarse internal stage, never JWTs, email, notes, or proof paths.
    console.error('VoluForge account cleanup incomplete:', error instanceof Error ? error.message : 'unknown_stage');
    return json(503, {
      error: 'Account access has been paused. Deletion could not finish. Retry Delete account to finish cleanup, or contact support.',
      retryable: true,
    });
  }
});

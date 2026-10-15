// Use a normal short-lived JWT for an explicitly allowlisted operator.
// Never print credentials or require a service-role key in this client.
const [orgId, decision, reasonCode] = process.argv.slice(2);
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId || '') ||
    !['approved','rejected'].includes(decision) ||
    !(decision === 'approved' ? ['identity_confirmed'] : ['identity_unconfirmed','ineligible','verification_revoked']).includes(reasonCode)) {
  console.error('Usage: node scripts/review-organization.mjs ORG_UUID approved identity_confirmed\n   or: node scripts/review-organization.mjs ORG_UUID rejected identity_unconfirmed|ineligible|verification_revoked');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const jwt = process.env.VF_OPERATOR_ACCESS_TOKEN;
if (!url || !key || !jwt) {
  console.error('Load the Supabase URL, anonymous key and VF_OPERATOR_ACCESS_TOKEN privately before running.');
  process.exit(1);
}
try {
  const endpoint = new URL('/rest/v1/rpc/vf_review_organization', url);
  if (endpoint.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(endpoint.hostname)) throw new Error('HTTPS required');
  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: {'Content-Type':'application/json', apikey:key, Authorization:`Bearer ${jwt}`},
    body: JSON.stringify({p_org_id:orgId,p_decision:decision,p_reason_code:reasonCode})
  });
  if (!response.ok) {
    console.error(`Review failed (HTTP ${response.status}); no success claimed. Check operator membership and server logs privately.`);
    process.exitCode = 1;
  } else {
    const id = await response.json();
    console.log(JSON.stringify({organization_id:orgId,decision,decision_id:id}));
  }
} catch {
  console.error('Review request failed. Inspect the organization and decision history before retrying.');
  process.exitCode = 1;
}

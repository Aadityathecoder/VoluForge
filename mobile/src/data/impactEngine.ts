export interface Preferences {
  skills: string[]; causes: string[]; location: string; remote: boolean;
  experience: number; age: number | null; availableFrom: string; availableTo: string;
  weights: { skills: number; causes: number; location: number; experience: number; urgency: number };
}
export interface Opportunity {
  id: string; org_id: string; organization: string; title: string; description: string;
  category: string; location: string; remote: boolean; starts_at: string; ends_at: string;
  capacity: number; spots_left: number; min_age: number; skills: string[]; min_experience: number;
  urgency: number; outcome_metric: string; outcome_target: number; status: string; proof_required: boolean;
}
export interface Application {
  id: string; student_id: string; opportunity_id: string; message: string; availability: string;
  status: string; decision_note: string; created_at: string; name?: string;
}
export interface Outcome {
  id: string; service_entry_id: string; metric: string; quantity: number; evidence: string;
  status: string; review_note: string; reviewed_at: string | null;
}
export interface Entry {
  id: string; student_id: string; application_id: string; service_date: string; minutes: number;
  notes: string; status: string; review_note: string; reviewed_at: string | null; proof_path?: string | null;
}
export const defaultPreferences: Preferences = {
  skills: [], causes: [], location: '', remote: true, experience: 0, age: null,
  availableFrom: '', availableTo: '', weights: { skills: 40, causes: 25, location: 15, experience: 10, urgency: 10 },
};
const norm = (s: string) => s.trim().toLocaleLowerCase();
export function matchOpportunity(o: Opportunity, p: Preferences, now = Date.now()) {
  const reasons: string[] = [], blockers: string[] = [], unknown: string[] = [];
  if (o.status !== 'published' || Date.parse(o.starts_at) <= now || o.spots_left <= 0) blockers.push('Applications are closed or the event has already started.');
  if (p.age === null) unknown.push('Confirm the minimum age before applying.');
  else if (p.age < o.min_age) blockers.push(`Minimum age is ${o.min_age}.`);
  if (p.experience < o.min_experience) blockers.push(`Requires ${o.min_experience} months of experience.`);
  if (!p.availableFrom || !p.availableTo) unknown.push('Add an availability window to confirm the schedule.');
  else if (Date.parse(p.availableFrom) > Date.parse(o.starts_at) || Date.parse(p.availableTo) < Date.parse(o.ends_at)) blockers.push('Outside your availability window.');
  if (o.remote && !p.remote) blockers.push('You prefer in-person service.');
  if (!o.remote && !p.location.trim()) unknown.push('Add your city to check travel fit.');
  const skills = o.skills.filter(s => p.skills.some(v => norm(v) === norm(s)));
  const skillFit = o.skills.length ? skills.length / o.skills.length : 1;
  const causeFit = p.causes.some(c => norm(c) === norm(o.category)) ? 1 : 0;
  const localFit = o.remote ? (p.remote ? 1 : 0) : (p.location.trim() && norm(o.location) === norm(p.location) ? 1 : 0);
  const experienceFit = p.experience >= o.min_experience ? 1 : 0;
  const weights = p.weights;
  const total = Object.values(weights).reduce((sum, w) => sum + Math.max(0, w), 0) || 1;
  const score = Math.round(100 * (skillFit * weights.skills + causeFit * weights.causes + Number(localFit) * weights.location + experienceFit * weights.experience + o.urgency / 5 * weights.urgency) / total);
  if (skills.length) reasons.push(`Uses ${skills.join(', ')}.`);
  if (causeFit) reasons.push(`Supports your interest in ${o.category.toLowerCase()}.`);
  if (localFit) reasons.push(o.remote ? 'Available remotely.' : 'In your selected city.');
  if (o.urgency >= 4) reasons.push('The partner marked this need as urgent.');
  if (o.skills.length > skills.length) unknown.push(`Skills to confirm: ${o.skills.filter(s => !skills.includes(s)).join(', ')}.`);
  return { score: Math.max(0, Math.min(100, score)), eligible: blockers.length === 0, confirmed: blockers.length === 0 && unknown.length === 0, reasons, blockers, unknown };
}
export function needsIndex(opportunities: Opportunity[], now = Date.now()) {
  const groups = new Map<string, { category: string; location: string; openSpots: number; urgentSpots: number; opportunities: number; skills: Set<string> }>();
  for (const o of opportunities.filter(o => o.status === 'published' && Date.parse(o.starts_at) > now && o.spots_left > 0)) {
    const key = `${o.category}\0${o.remote ? 'Remote' : o.location}`;
    const g = groups.get(key) || { category: o.category, location: o.remote ? 'Remote' : o.location, openSpots: 0, urgentSpots: 0, opportunities: 0, skills: new Set<string>() };
    g.openSpots += o.spots_left; g.urgentSpots += o.urgency >= 4 ? o.spots_left : 0; g.opportunities++;
    o.skills.forEach(s => g.skills.add(s)); groups.set(key, g);
  }
  return [...groups.values()].map(g => ({ ...g, skills: [...g.skills], priority: Math.round(g.openSpots + 2 * g.urgentSpots) })).sort((a, b) => b.priority - a.priority);
}
/** Exact maximum-weight assignment, one new placement per volunteer, with capacity.
 * Residual edges allow earlier choices to be reassigned instead of greedy starvation.
 * Eligibility includes schedule/age; unknown constraints are excluded from proposals. */
export function allocate(volunteers: { id: string; preferences: Preferences; opportunityIds: string[] }[], opportunities: Opportunity[], now = Date.now()) {
  type Edge = { to: number; reverse: number; cap: number; cost: number; initial: number };
  const sink = 1 + volunteers.length + opportunities.length;
  const graph: Edge[][] = Array.from({ length: sink + 1 }, () => []);
  function edge(a: number, b: number, cap: number, cost: number) {
    graph[a].push({ to: b, reverse: graph[b].length, cap, cost, initial: cap });
    graph[b].push({ to: a, reverse: graph[a].length - 1, cap: 0, cost: -cost, initial: 0 });
  }
  volunteers.forEach((v, i) => {
    edge(0, i + 1, 1, 0);
    opportunities.forEach((o, j) => {
      const m = matchOpportunity(o, v.preferences, now);
      if (v.opportunityIds.includes(o.id) && m.confirmed && m.score > 0) edge(i + 1, volunteers.length + j + 1, 1, -m.score);
    });
  });
  opportunities.forEach((o, j) => edge(volunteers.length + j + 1, sink, Math.max(0, o.spots_left), 0));
  while (true) {
    const dist = Array(graph.length).fill(Infinity), parent: [number, number][] = [];
    dist[0] = 0;
    for (let pass = 0; pass < graph.length - 1; pass++) {
      let changed = false;
      graph.forEach((edges, a) => edges.forEach((e, k) => {
        if (e.cap > 0 && dist[a] + e.cost < dist[e.to]) { dist[e.to] = dist[a] + e.cost; parent[e.to] = [a, k]; changed = true; }
      }));
      if (!changed) break;
    }
    if (!Number.isFinite(dist[sink]) || dist[sink] >= 0) break;
    let b = sink;
    while (b !== 0) { const [a, k] = parent[b]; const e = graph[a][k]; e.cap--; graph[b][e.reverse].cap++; b = a; }
  }
  return volunteers.flatMap((v, i) => graph[i + 1].filter(e => e.initial === 1 && e.cap === 0 && e.to > volunteers.length && e.to < sink).map(e => ({ volunteerId: v.id, opportunityId: opportunities[e.to - volunteers.length - 1].id, score: -e.cost })));
}
export function impactGraph(userId: string, name: string, opportunities: Opportunity[], applications: Application[], entries: Entry[], outcomes: Outcome[]) {
  const nodes = new Map<string, { id: string; label: string; kind: string }>();
  const edges = new Map<string, { from: string; to: string }>();
  const add = (id: string, label: string, kind: string) => nodes.set(id, { id, label, kind });
  const link = (from: string, to: string) => edges.set(`${from}\0${to}`, { from, to });
  add(`v:${userId}`, name, 'volunteer');
  for (const a of applications.filter(a => a.student_id === userId && a.status === 'accepted')) {
    const o = opportunities.find(o => o.id === a.opportunity_id); if (!o) continue;
    add(`o:${o.org_id}`, o.organization, 'nonprofit'); add(`p:${o.id}`, o.title, 'project');
    link(`v:${userId}`, `p:${o.id}`); link(`o:${o.org_id}`, `p:${o.id}`);
    for (const s of o.skills) { const id = `s:${norm(s)}`; add(id, s, 'skill'); link(`v:${userId}`, id); link(id, `p:${o.id}`); }
    for (const e of entries.filter(e => e.application_id === a.id && e.status === 'approved')) {
      for (const r of outcomes.filter(r => r.service_entry_id === e.id && r.status === 'approved')) {
        add(`r:${r.id}`, `${r.quantity} ${r.metric}`, 'outcome'); link(`p:${o.id}`, `r:${r.id}`);
      }
    }
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

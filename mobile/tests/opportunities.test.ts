import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationBlocker, remainingPlaces } from '../src/data/opportunities';
import { createDemo, demoOpportunities } from '../src/data/demo';

const opportunity = { ...demoOpportunities()[0], endsAt: '2030-01-02T12:00:00Z' };
const now = Date.parse('2030-01-01T12:00:00Z');
test('application gates match server rules for full, closed and expired opportunities', () => {
  assert.equal(applicationBlocker(opportunity, undefined, now), null);
  assert.equal(applicationBlocker({ ...opportunity, spotsLeft: 0 }, undefined, now), 'This opportunity is full');
  assert.equal(applicationBlocker({ ...opportunity, status: 'closed' }, undefined, now), 'Applications closed');
  assert.equal(applicationBlocker(opportunity, undefined, Date.parse(opportunity.endsAt)), 'Applications closed');
});
test('withdrawal does not allow a second application, matching the database unique constraint', () => {
  const application = { ...createDemo().applications[0], status: 'withdrawn' as const };
  assert.match(applicationBlocker(opportunity, application, now)!, /withdrawn/);
});
test('unknown remaining capacity is never represented as zero or a negative number', () => {
  assert.equal(remainingPlaces(30, -1), '30 volunteer places');
  assert.equal(remainingPlaces(30, 0), '0 of 30 places available');
  assert.equal(remainingPlaces(30, 12), '12 of 30 places available');
});

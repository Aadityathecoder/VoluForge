import type { Application, Opportunity } from './models';

// Match the database's application gates. The server remains authoritative
// when another volunteer takes the last place after this screen loads.
export function applicationBlocker(opportunity: Opportunity, application?: Application, now = Date.now()): string | null {
  if (application) return application.status === 'withdrawn'
    ? 'Your application was withdrawn. Explore another opportunity.'
    : 'You already have an application for this opportunity.';
  if (opportunity.status !== 'open' || Date.parse(opportunity.endsAt) <= now) return 'Applications closed';
  if (opportunity.spotsLeft === 0) return 'This opportunity is full';
  return null;
}

export function remainingPlaces(capacity: number, spotsLeft: number): string {
  return spotsLeft < 0 ? `${capacity} volunteer places` : `${spotsLeft} of ${capacity} places available`;
}

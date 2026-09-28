import type { Application, Opportunity, ServiceEntry, ServiceInput } from './models';

export const approvedHours = (entries: ServiceEntry[]) =>
  entries.filter(entry => entry.status === 'approved').reduce((sum, entry) => sum + entry.minutes, 0) / 60;

export function validateService(input: ServiceInput, application: Application | undefined, opportunity: Opportunity | undefined) {
  if (!application || application.status !== 'accepted') throw new Error('Service can only be submitted for an accepted application.');
  if (!Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 720) {
    throw new Error('Enter between 1 minute and 12 hours of service.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Enter a valid service date.');
  const parsed = new Date(`${input.date}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || localDate(parsed) !== input.date) throw new Error('Enter a valid service date.');
  if (input.date > new Date().toISOString().slice(0,10)) throw new Error('Service dates cannot be in the future.');
  if (opportunity && input.date < opportunity.startsAt.slice(0,10)) throw new Error('Service cannot be recorded before the opportunity starts.');
  if (input.notes.trim().length < 10) throw new Error('Describe your work in at least 10 characters.');
  if (input.notes.trim().length > 5000) throw new Error('Keep your service notes under 5,000 characters.');
  if (opportunity?.proofRequired && !input.proofURL?.trim()) throw new Error('This opportunity requires a proof attachment.');
}

export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function timerMinutes(startedAt: string, now = Date.now()): number {
  const minutes = Math.floor((now - new Date(startedAt).getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) throw new Error('Let the timer run for at least one complete minute.');
  if (minutes > 720) throw new Error('This timer exceeds 12 hours. Cancel it and manually enter the actual service time.');
  return minutes;
}

export function safeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  return email;
}

export function validatePassword(value: string) {
  if (value.length < 12) throw new Error('Use a password with at least 12 characters.');
}

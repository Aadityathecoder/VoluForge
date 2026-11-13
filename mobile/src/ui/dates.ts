// Fellowship dates are calendar dates (YYYY-MM-DD) and must not shift with time zones.
const parse = (d: string) => new Date(d + 'T12:00:00');
export const shortDate = (d: string) => parse(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const longDate = (d: string) => parse(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const dateRange = (a: string, b: string) => `${shortDate(a)} – ${longDate(b)}`;
export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

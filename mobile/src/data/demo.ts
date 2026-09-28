import type { Application, Opportunity, Profile, ServiceEntry, Timer } from './models';
import { localDate } from './domain';

export interface DemoSnapshot {
  version: 1;
  profile: Profile;
  savedIds: string[];
  applications: Application[];
  entries: ServiceEntry[];
  timer: Timer | null;
}

const eventDate = (days: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export function demoOpportunities(): Opportunity[] {
  const opportunities: Opportunity[] = [
    {
      id: 'demo-coast', organizationId: 'demo-org-coast', organization: 'Coastal Kindness Collective',
      title: 'A little care. A cleaner coast.', cause: 'Environment',
      description: 'Spend a morning giving our coastline a little love. Together we’ll collect litter, sort recyclables, and record what we find to help protect our ocean. Bring a friend, some sunscreen, and your curiosity. This is a fictional opportunity for exploring VoluForge.',
      location: 'Fort Lauderdale, FL', address: 'Fort Lauderdale Beach, FL', latitude: 26.1228, longitude: -80.1044,
      startsAt: eventDate(3, 9), endsAt: eventDate(3, 12), capacity: 30, spotsLeft: 12,
      minimumAge: 14, skills: ['Teamwork', 'Environmental care'], requirements: ['Wear closed-toe shoes', 'Bring water and sunscreen', 'Under 18? Bring a guardian’s permission'],
      proofRequired: false, imageUrl: '', imageKey: 'coast', remote: false, status: 'open', demo: true,
    },
    {
      id: 'demo-pantry', organizationId: 'demo-org-pantry', organization: 'Neighbors’ Table',
      title: 'Good food. A little more good.', cause: 'Food security',
      description: 'Help sort fresh produce, pack balanced meal kits, and welcome neighbors at our community pantry. We’ll teach you everything you need on arrival. This is a fictional opportunity for exploring VoluForge.',
      location: 'Boca Raton, FL', address: 'Downtown Boca Raton, FL', latitude: 26.3587, longitude: -80.0831,
      startsAt: eventDate(5, 10), endsAt: eventDate(5, 13), capacity: 16, spotsLeft: 5,
      minimumAge: 14, skills: ['Organization', 'Teamwork'], requirements: ['Wear closed-toe shoes', 'Tie back long hair', 'An adult supervisor is present'],
      proofRequired: false, imageUrl: '', imageKey: 'pantry', remote: false, status: 'open', demo: true,
    },
    {
      id: 'demo-literacy', organizationId: 'demo-org-literacy', organization: 'Little Chapters Project',
      title: 'Open a book. Open a world.', cause: 'Education',
      description: 'Read together, play word games, and help young readers build confidence in a supervised small-group setting. Training and reading materials are provided. This is a fictional opportunity for exploring VoluForge.',
      location: 'Delray Beach, FL', address: 'Downtown Delray Beach, FL', latitude: 26.4615, longitude: -80.0728,
      startsAt: eventDate(7, 14), endsAt: eventDate(7, 16), capacity: 12, spotsLeft: 4,
      minimumAge: 16, skills: ['Reading', 'Communication'], requirements: ['Complete the short orientation', 'Sessions are supervised by an adult', 'Never share a child’s personal information'],
      proofRequired: true, imageUrl: '', imageKey: 'books', remote: false, status: 'open', demo: true,
    },
    {
      id: 'demo-tutoring', organizationId: 'demo-org-tutoring', organization: 'Bright Futures Study Club',
      title: 'Your skills. Someone’s spark.', cause: 'Education',
      description: 'Help middle-school students work through math and science questions in a supervised online study group. An organizer facilitates every session. This is a fictional opportunity for exploring VoluForge.',
      location: 'From anywhere', address: 'Online · link shared after acceptance',
      startsAt: eventDate(9, 16), endsAt: eventDate(9, 18), capacity: 10, spotsLeft: 6,
      minimumAge: 16, skills: ['Math', 'Science', 'Communication'], requirements: ['Reliable internet connection', 'Bring a patient, encouraging attitude', 'All sessions are supervised'],
      proofRequired: false, imageUrl: '', imageKey: 'tutoring', remote: true, status: 'open', demo: true,
    },
  ];
  const history = opportunities.filter(o => o.id !== 'demo-literacy').map(o => ({...o,id:o.id+'-past',title:o.title+' · previous session',startsAt:eventDate(-28,9),endsAt:eventDate(-28,12),status:'closed' as const}));
  return [...opportunities,...history];
}

export function createDemo(): DemoSnapshot {
  const createdAt = eventDate(-14, 10);
  const base = { studentId: 'demo-student', studentName: 'Alex', statement: 'I’m excited to lend a hand and learn something new.', availability: 'Available for the whole session.', createdAt, demo: true };
  const applications: Application[] = [
    { ...base, id: 'demo-app-coast', opportunityId: 'demo-coast', status: 'accepted' },
    { ...base, id: 'demo-app-pantry', opportunityId: 'demo-pantry', status: 'accepted' },
    { ...base, id: 'demo-app-literacy', opportunityId: 'demo-literacy', status: 'pending' },
    { ...base, id: 'demo-app-tutoring', opportunityId: 'demo-tutoring', status: 'accepted' },
  ];
  for (const a of [...applications].filter(a=>a.status==='accepted')) applications.push({...a,id:a.id+'-past',opportunityId:a.opportunityId+'-past'});
  const entries: ServiceEntry[] = [
    { id: 'demo-service-1', applicationId: 'demo-app-pantry', opportunityId: 'demo-pantry', minutes: 720, notes: 'Sample record: helped sort donations and pack community meal kits across several sessions.', date: localDate(new Date(eventDate(-21, 10))) },
    { id: 'demo-service-2', applicationId: 'demo-app-coast', opportunityId: 'demo-coast', minutes: 180, notes: 'Sample record: collected litter and sorted recyclables with a beach cleanup team.', date: localDate(new Date(eventDate(-14, 10))) },
    { id: 'demo-service-3', applicationId: 'demo-app-tutoring', opportunityId: 'demo-tutoring', minutes: 540, notes: 'Sample record: supported students with math practice across several supervised sessions.', date: localDate(new Date(eventDate(-7, 10))) },
  ].map(entry => ({ ...entry, applicationId: entry.applicationId+'-past', opportunityId: entry.opportunityId+'-past', studentId: 'demo-student', studentName: 'Alex', status: 'approved', createdAt, reviewedAt: createdAt, reviewerName: 'Sample reviewer', reviewerNote: 'Demonstration only — not a verified service record.', demo: true }));
  entries.push({...entries[0], id:'demo-service-returned',minutes:45,date:localDate(new Date(eventDate(-2,10))),status:'changes_requested',reviewerNote:'Please describe the materials you sorted and the number of kits you packed.'});
  return {
    version: 1,
    profile: { id: 'demo-student', name: 'Alex', email: '', school: 'Your school', bio: 'A little time can make a lot of difference.', skills: ['Teamwork', 'Communication'], causes: ['Environment', 'Education'], goalHours: 40, role: 'student', demo: true },
    savedIds: ['demo-coast'], applications, entries, timer: null,
  };
}

import { cookies } from 'next/headers'
import type { DashboardProjectRow } from '@/components/dashboard/ProjectCard'
import type { CommunityNeed } from '@/types/database'

export async function isGuestMode() {
  const cookieStore = await cookies()
  return cookieStore.get('voluforge-guest')?.value === '1'
}

export const guestProjects: DashboardProjectRow[] = [
  {
    id: 'guest-literacy-kit',
    title: 'Weekend literacy kit drive',
    status: 'planning',
    end_date: '2026-05-28',
  },
  {
    id: 'guest-food-drive',
    title: 'Neighborhood pantry support',
    status: 'active',
    end_date: '2026-06-04',
  },
]

export const guestNeeds: CommunityNeed[] = [
  {
    id: 'guest-need-1',
    submitted_by: 'guest',
    organization_name: 'Sunrise Family Center',
    contact_name: 'Guest Partner',
    contact_email: 'guest@example.com',
    contact_phone: null,
    category: 'Education',
    description: 'Assemble take-home reading kits for elementary students.',
    beneficiaries: 'Elementary students',
    estimated_people_impacted: 300,
    location: 'Plantation, FL',
    deadline: '2026-05-28',
    age_restrictions: null,
    safety_concerns: null,
    known_materials: 'Books, bags, labels',
    budget_estimate: 950,
    preferred_project_type: 'Assembly drive',
    image_url: null,
    detected_item_label: null,
    visibility: 'public',
    status: 'open',
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'guest-need-2',
    submitted_by: 'guest',
    organization_name: 'Harvest Table Pantry',
    contact_name: 'Guest Partner',
    contact_email: 'guest@example.com',
    contact_phone: null,
    category: 'Food Security',
    description: 'Sort and package pantry items for weekend distribution.',
    beneficiaries: 'Local families',
    estimated_people_impacted: 180,
    location: 'Fort Lauderdale, FL',
    deadline: '2026-06-04',
    age_restrictions: null,
    safety_concerns: null,
    known_materials: 'Boxes, pantry goods, labels',
    budget_estimate: 400,
    preferred_project_type: 'Packaging event',
    image_url: null,
    detected_item_label: null,
    visibility: 'public',
    status: 'open',
    created_at: '2026-05-03T00:00:00.000Z',
    updated_at: '2026-05-03T00:00:00.000Z',
  },
]

export const guestTasks = [
  { title: 'Confirm partner materials list', due_date: '2026-05-18' },
  { title: 'Assign volunteer roles', due_date: '2026-05-20' },
  { title: 'Publish final reminder', due_date: '2026-05-24' },
]

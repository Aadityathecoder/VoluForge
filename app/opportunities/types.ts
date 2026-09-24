export type Opportunity = {
  id: string
  title: string
  description: string
  cause: string
  skills: string[]
  participation_mode: 'remote' | 'in_person' | 'hybrid'
  location: string | null
  time_commitment: string
  minimum_age: number | null
  created_at: string
  volunteer_organizations: { name: string; is_demo: boolean }
}

export const opportunitySelect =
  'id,title,description,cause,skills,participation_mode,location,time_commitment,minimum_age,created_at,volunteer_organizations!inner(name,is_demo)'

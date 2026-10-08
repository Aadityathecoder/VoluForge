import { volunteerApi } from '@/lib/api/volunteer'
// Preserve the earlier URL and form field aliases using the same signup flow.
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  return volunteerApi(request, ['auth', 'signup'])
}

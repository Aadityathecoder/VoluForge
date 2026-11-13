import type { AdminFellowship } from '@/lib/data'
import { SubmitButton } from './SubmitButton'
import { saveFellowship } from '@/app/(app)/admin/actions'

const focuses = ['Education', 'Environment', 'Food security', 'Health', 'Community', 'Arts', 'Technology', 'Civic leadership']
export function FellowshipForm({ f }: { f?: AdminFellowship }) {
  return (
    <form action={saveFellowship} className="space-y-6">
      {f && <input type="hidden" name="id" value={f.id} />}
      {f && <input type="hidden" name="status" value={f.status} />}
      <div><label htmlFor="title" className="label">Title</label><input id="title" name="title" required minLength={3} maxLength={160} defaultValue={f?.title} className="field" placeholder="Saturday Reading Fellowship" /></div>
      <div><label htmlFor="summary" className="label">One-line summary</label><input id="summary" name="summary" maxLength={280} defaultValue={f?.summary} className="field" placeholder="Read with younger students and help run weekly reading circles." /><p className="hint">Shown in the fellowship list.</p></div>
      <div><label htmlFor="description" className="label">What fellows will do</label><textarea id="description" name="description" rows={7} maxLength={8000} defaultValue={f?.description} className="field" placeholder="Goals, a typical week, who to contact, what to bring." /></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="focus" className="label">Focus</label><input id="focus" name="focus" list="focuses" defaultValue={f?.focus ?? 'Education'} maxLength={80} className="field" /><datalist id="focuses">{focuses.map(x => <option key={x} value={x} />)}</datalist></div>
        <div><label htmlFor="location" className="label">Location</label><input id="location" name="location" maxLength={200} defaultValue={f?.location} className="field" placeholder="Room 204, Harbor High" />
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="remote" defaultChecked={f?.remote} className="rounded border-line text-forest focus:ring-forest" />Runs online</label></div>
      </div>
      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="sr-only">Dates</legend>
        <div><label htmlFor="starts_on" className="label">Starts</label><input id="starts_on" name="starts_on" type="date" required defaultValue={f?.starts_on} className="field" /></div>
        <div><label htmlFor="ends_on" className="label">Ends</label><input id="ends_on" name="ends_on" type="date" required defaultValue={f?.ends_on} className="field" /></div>
        <div><label htmlFor="apply_by" className="label">Apply by <span className="font-normal text-muted">(optional)</span></label><input id="apply_by" name="apply_by" type="date" defaultValue={f?.apply_by ?? ''} className="field" /></div>
      </fieldset>
      <div className="grid max-w-md gap-5 sm:grid-cols-2">
        <div><label htmlFor="capacity" className="label">Seats</label><input id="capacity" name="capacity" type="number" min={1} max={5000} required defaultValue={f?.capacity ?? 12} className="field" /></div>
        <div><label htmlFor="weekly_hours" className="label">Hours a week</label><input id="weekly_hours" name="weekly_hours" type="number" min={1} max={60} required defaultValue={f?.weekly_hours ?? 3} className="field" /></div>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        {f ? <SubmitButton pending="Saving…">Save changes</SubmitButton> : <>
          <SubmitButton className="btn-ember" name="intent" value="open" pending="Publishing…">Publish and open applications</SubmitButton>
          <SubmitButton className="btn-outline" name="intent" value="draft" pending="Saving…">Save as draft</SubmitButton>
        </>}
      </div>
    </form>
  )
}

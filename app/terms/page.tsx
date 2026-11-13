import type { Metadata } from 'next'
import { ProsePage } from '@/components/Prose'
export const metadata: Metadata = { title: 'Terms' }
export default function Terms() {
  return (
    <ProsePage title="Terms of use" updated="November 13, 2026">
      <p>By using VoluForge you agree to these terms.</p>
      <h2>Accounts</h2>
      <p>Give accurate information and keep your password private. Students under 13 may not use VoluForge. Administrator accounts are for people who actually run the fellowship they post, on behalf of the school or organization they name.</p>
      <h2>Fellowships and opportunities</h2>
      <p>Administrators and organizations are responsible for the fellowships and opportunities they post, including supervision and safety. VoluForge verifies administrator accounts before their fellowships appear in the public list, but doesn't run the programs itself.</p>
      <h2>Acceptable use</h2>
      <p>Don't post misleading listings, collect students' personal information for unrelated purposes, or interfere with the service. We may remove listings or suspend accounts that do.</p>
      <h2>Hours and records</h2>
      <p>Service hours count only once the organizer approves them. VoluForge records those approvals but does not independently confirm them.</p>
    </ProsePage>
  )
}

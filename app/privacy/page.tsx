import type { Metadata } from 'next'
import { ProsePage } from '@/components/Prose'
export const metadata: Metadata = { title: 'Privacy' }
export default function Privacy() {
  return (
    <ProsePage title="Privacy" updated="November 13, 2026">
      <p>VoluForge helps students find volunteer work and fellowships. We collect only what that needs, and we don't sell personal information or show ads.</p>
      <h2>What we store</h2>
      <ul>
        <li>Your account: name, email address, and, if you use Google, the basic profile Google shares at sign-in.</li>
        <li>Your profile: school, short bio, skills, causes and hours goal, if you add them.</li>
        <li>Your activity: fellowship and volunteer applications, decisions, and service hours you log.</li>
        <li>Administrators: the school or organization name you host fellowships for.</li>
      </ul>
      <h2>Who can see it</h2>
      <p>When you apply to a fellowship, its administrator sees your name, school, skills, causes and the note you wrote. They never see your email address through VoluForge. Volunteer organizations see what you send them when you apply. Nobody else can browse your profile.</p>
      <h2>Your choices</h2>
      <p>You can edit your profile at any time and delete your account from Profile and settings. Deleting removes your profile, applications, hosted fellowships and logged hours.</p>
      <h2>Contact</h2>
      <p>Questions about your data: see the Support page.</p>
    </ProsePage>
  )
}

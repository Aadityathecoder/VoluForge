import type { Metadata } from 'next'
import Link from 'next/link'
import { ProsePage } from '@/components/Prose'
export const metadata: Metadata = { title: 'Support' }
export default function Support() {
  return (
    <ProsePage title="Support">
      <h2>I'm a student and can't find my school's fellowship</h2>
      <p>Ask your teacher or coordinator for the fellowship's 8-character join code, then enter it on the <Link href="/fellowships" className="link">Fellowships</Link> page.</p>
      <h2>I run a fellowship. How do I get verified?</h2>
      <p>Create an <Link href="/signup?role=admin" className="link">administrator account</Link> and set up your fellowship. Your fellowships work with join codes straight away. Email the VoluForge team from your school or organization address to be verified; verified hosts also appear in the public list.</p>
      <h2>I signed in with Google and picked the wrong account type</h2>
      <p>Account types can't be switched by hand, to keep fellowships safe for students. Contact the VoluForge team and we'll fix it.</p>
      <h2>Contact</h2>
      <p>Email the VoluForge team at the address listed on your school's VoluForge information, or reach the project maintainers through the VoluForge GitHub repository.</p>
    </ProsePage>
  )
}

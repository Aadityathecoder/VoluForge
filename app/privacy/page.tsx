import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="container-max py-16 max-w-3xl">
      <h1 className="text-4xl font-bold text-slate-50 mb-6">Privacy</h1>
      <p className="text-slate-400 mb-10 leading-relaxed">
        VoluForge is designed for schools and community organizations. This page summarizes how we treat account and
        project information. Configure your production deployment with policies appropriate for your institution.
      </p>

      <div className="space-y-10 text-slate-400 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">What we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Account details you provide at sign-up (name, email, role, school or organization, optional location).</li>
            <li>Content you submit, such as community needs, generated project kits, and project updates stored in our database.</li>
            <li>Standard technical data from hosting (for example access logs), depending on how you deploy the site.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">How we use data</h2>
          <p>
            Information is used to run the service: authentication, showing relevant needs and projects, and—when
            configured—calling an AI provider to draft project kits. We do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Third parties</h2>
          <p>
            VoluForge relies on Supabase for authentication and database hosting. AI kit generation uses Anthropic when
            an API key is configured. Review their terms and data processing agreements for your deployment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Your choices</h2>
          <p>
            You can sign out at any time, request deletion of your account through your administrator or project owner,
            and avoid submitting sensitive personal data in free-text fields where possible.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Contact</h2>
          <p>
            For privacy questions related to this deployment, contact the site operator at your school or organization.
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-slate-500">
        <Link href="/" className="text-orange-400 hover:text-orange-300">
          ← Back home
        </Link>
      </p>
    </div>
  )
}

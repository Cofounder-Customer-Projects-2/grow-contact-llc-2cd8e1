import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Grow" },
      {
        name: "description",
        content:
          "How Grow collects, uses, stores and shares personal data across our AI-powered recruiting platform.",
      },
      { property: "og:title", content: "Privacy Policy — Grow" },
      {
        property: "og:description",
        content:
          "Grow Contact LLC's commitments around personal data, candidate data and AI processing.",
      },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "1. Who we are",
    body: `Grow Contact LLC ("Grow", "we", "us") is a limited liability company registered in Iceland. We operate an AI-powered recruiting platform available at app.grow.contact. For the purposes of the EU General Data Protection Regulation (GDPR) and related legislation, Grow Contact LLC is the data controller for personal data processed through the Grow platform.

Contact: Gudmundur Kristjansson, gudmundur@grow.contact, Grow Contact LLC, Iceland.`,
  },
  {
    title: "2. Data we collect",
    body: `We collect and process the following categories of personal data:

Account and billing data: name, work email address, job title, organisation name, and payment information when you subscribe.

Candidate profile data: names, email addresses, phone numbers, LinkedIn URLs, résumés, employment history, and any notes or tags your team adds to candidate records.

Email and outreach content: the text of recruiting emails sent through Grow, including personalisation tokens derived from candidate profiles.

Meeting recordings and transcripts: audio/video recordings of interviews captured via our integration with Recall.ai, and the automated transcripts and AI-generated summaries derived from them.

Usage and log data: IP address, browser type, operating system, pages visited, timestamps, and error logs collected to operate and secure the service.

Cookie and tracking data: session cookies necessary for authentication and preference cookies if you consent. See Section 11 (Cookies) for details.`,
  },
  {
    title: "3. Legal bases for processing (GDPR Article 6)",
    body: `We rely on the following legal bases:

Contract performance (Art. 6(1)(b)): processing necessary to deliver the Grow platform to your organisation under our Terms of Service, including storing candidate data you upload and sending outreach emails on your behalf.

Legitimate interests (Art. 6(1)(f)): maintaining platform security, preventing abuse, improving product reliability, and aggregate analytics that cannot be attributed to individuals. Our legitimate interests do not override your rights where you have a reasonable expectation of privacy.

Consent (Art. 6(1)(a)): placing non-essential cookies and, where required by applicable law, processing special-category data. You may withdraw consent at any time without affecting the lawfulness of prior processing.

Legal obligation (Art. 6(1)(c)): retaining records required by Icelandic law, EU law, or other applicable regulations.

Special-category data: Grow is a recruiting tool. Candidate profiles may incidentally include health information, trade-union membership, or other special-category data under Art. 9 GDPR. We process such data only to the extent you upload it, and only under the explicit-consent basis or the basis of substantial public interest in employment, as applicable. We recommend customers minimise special-category data in candidate profiles.`,
  },
  {
    title: "4. How we use data",
    body: `We use the data we collect to:

— Provide and operate the Grow platform, including candidate sourcing, outreach automation, interview scheduling, scorecard generation, and analytics.
— Send transactional emails (e.g., meeting confirmations, scorecard shares) via Resend.
— Generate AI-assisted content (draft outreach, interview summaries, candidate evaluations) via our integration with OpenRouter-connected language models.
— Record and transcribe interviews via Recall.ai when you enable that integration.
— Detect and prevent fraud, abuse, and security incidents.
— Comply with legal obligations.

We do not sell personal data to third parties. We do not use customer or candidate data to train shared foundation models that serve other customers.`,
  },
  {
    title: "5. Sub-processors and international transfers",
    body: `We share data only with vetted sub-processors necessary to deliver the service. Our current sub-processors are:

Supabase, Inc. (USA) — cloud database, authentication, and file storage. Data is stored in Supabase's hosted infrastructure. Transfers from the EEA rely on Standard Contractual Clauses (SCCs) and Supabase's Data Processing Agreement.

Resend, Inc. (USA) — transactional email delivery. Email content and recipient addresses are transmitted to Resend solely to send messages you initiate. Transfers rely on SCCs.

Recall.ai, Inc. (USA) — meeting recording and transcription. Audio, video, and transcript data from enabled integrations are processed by Recall.ai under a DPA. Transfers rely on SCCs.

OpenRouter, Inc. (USA) — large-language-model inference routing. Prompts derived from candidate data and user input are sent to OpenRouter for AI feature generation. We operate under zero-retention agreements where available. Transfers rely on SCCs.

We maintain a current list of sub-processors and will notify you at least 30 days before adding a new sub-processor that materially changes the risk profile of our data processing. You may object to the addition of a new sub-processor by contacting gudmundur@grow.contact; if we cannot resolve your objection, you may terminate without penalty.`,
  },
  {
    title: "6. Data retention",
    body: `Customer account data and candidate records are retained for the duration of your active subscription plus 30 days after cancellation or termination. During the 30-day period you may export your data. After that period, data is permanently deleted from primary systems within 30 days and from encrypted backups within 90 days.

Interview recordings and transcripts are retained for 12 months by default unless you configure a shorter window in your account settings or request earlier deletion.

Log and usage data is retained for up to 12 months for security and reliability purposes.

We will retain data for longer periods only where required by law, legal proceedings, or to resolve disputes.`,
  },
  {
    title: "7. Your rights under GDPR (Articles 12–22)",
    body: `If you are located in the EEA, UK, or Iceland, you have the following rights:

Right of access (Art. 15): you may request a copy of the personal data we hold about you.

Right to rectification (Art. 16): you may ask us to correct inaccurate or incomplete data.

Right to erasure (Art. 17): you may ask us to delete your personal data where there is no overriding legal basis for continued processing.

Right to restriction (Art. 18): you may ask us to limit processing while a correction or objection is resolved.

Right to data portability (Art. 20): you may request your data in a machine-readable format.

Right to object (Art. 21): you may object to processing based on legitimate interests or for direct marketing purposes.

Right to withdraw consent: where processing is based on consent, you may withdraw it at any time.

Right to lodge a complaint: you have the right to lodge a complaint with the Icelandic Data Protection Authority (Persónuvernd, www.personuvernd.is) or your local supervisory authority.

To exercise any of these rights, email gudmundur@grow.contact. We will respond within 30 days. We may request identity verification before fulfilling a request.

Candidate rights: Grow is a data processor acting on behalf of its customers (the data controllers) for candidate data. If you are a job candidate and wish to exercise your rights, please contact the company that used Grow to contact you. If you cannot identify that company, contact us and we will assist you.`,
  },
  {
    title: "8. Your rights under CCPA / CPRA",
    body: `If you are a California resident, you have the following rights under the California Consumer Privacy Act as amended by the California Privacy Rights Act:

Right to know: you may request disclosure of the categories and specific pieces of personal information we have collected about you, the sources, business purposes, and third parties with whom we share it.

Right to delete: you may request deletion of personal information we have collected, subject to certain exceptions.

Right to correct: you may request correction of inaccurate personal information.

Right to opt out of sale or sharing: Grow does not sell or share personal information for cross-context behavioural advertising. No opt-out is required, but you may contact us to confirm.

Right to limit use of sensitive personal information: we do not use sensitive personal information for purposes beyond those listed in the CCPA.

Right to non-discrimination: we will not discriminate against you for exercising your CCPA rights.

To submit a CCPA request, email gudmundur@grow.contact with the subject line "CCPA Request". We will respond within 45 days (extendable by a further 45 days with notice).`,
  },
  {
    title: "9. Security",
    body: `We implement appropriate technical and organisational measures to protect personal data against unauthorised access, disclosure, alteration, or destruction. These include encryption in transit (TLS 1.2+) and at rest, access controls, audit logging, and regular security reviews.

In the event of a personal data breach likely to result in high risk to your rights and freedoms, we will notify affected data subjects without undue delay as required by GDPR Art. 34, and will notify the relevant supervisory authority within 72 hours as required by GDPR Art. 33.`,
  },
  {
    title: "10. Children's data",
    body: `The Grow platform is not directed at individuals under 16 years of age. We do not knowingly collect personal data from children. If you believe we have inadvertently collected data from a child, contact gudmundur@grow.contact and we will delete it promptly.`,
  },
  {
    title: "11. Cookies",
    body: `We use cookies and similar technologies as follows:

Strictly necessary cookies: session authentication tokens and CSRF protection. These cannot be disabled without breaking the service.

Preference cookies: storing your consent choices and UI preferences. These are set only when you accept cookies.

We do not use advertising or third-party analytics cookies. You can manage cookie preferences using the banner that appears on your first visit, or by clearing your browser's cookies at any time.`,
  },
  {
    title: "12. Changes to this policy",
    body: `We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or by posting a prominent notice in the platform at least 14 days before the changes take effect. The "Last updated" date at the top of this page reflects when the most recent version was published. Continued use of the platform after the effective date constitutes acceptance of the revised policy.`,
  },
  {
    title: "13. Contact",
    body: `For privacy-related questions, requests, or complaints:

Email: gudmundur@grow.contact
Company: Grow Contact LLC, Iceland

Supervisory authority (Iceland): Persónuvernd (Icelandic Data Protection Authority)
Website: www.personuvernd.is
Address: Rauðarárstígur 10, 105 Reykjavík, Iceland`,
  },
];

function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-32 pt-32">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal
        </div>
        <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated May 10, 2026
        </p>
        <p className="mt-8 text-lg text-muted-foreground">
          Grow is built around the people inside your hiring funnel. We treat
          their data — and yours — with the seriousness that requires. This
          policy explains what we collect, why we collect it, and how you can
          control it.
        </p>

        <div className="mt-16 space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-semibold text-foreground">
                {s.title}
              </h2>
              <div className="mt-3 space-y-2">
                {s.body.split("\n\n").map((para, i) => (
                  <p key={i} className="text-muted-foreground">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

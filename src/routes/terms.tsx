import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Grow" },
      {
        name: "description",
        content:
          "The terms governing use of Grow's AI-powered recruiting platform, APIs and AI features.",
      },
      { property: "og:title", content: "Terms of Service — Grow" },
      {
        property: "og:description",
        content:
          "The agreement between Grow Contact LLC and customers using the Grow platform.",
      },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    title: "1. Parties and agreement",
    body: `These Terms of Service ("Terms") constitute a legally binding agreement between Grow Contact LLC, a limited liability company registered in Iceland ("Grow", "we", "us"), and the organisation or individual that accepts them ("Customer", "you").

By creating an account, clicking to accept, or signing an order form that references these Terms, you agree to be bound by them. If you are accepting on behalf of an organisation, you represent that you have authority to bind that organisation.

These Terms govern your access to and use of the Grow platform, including the web application, APIs, AI features, and any related documentation or services (collectively, the "Service").`,
  },
  {
    title: "2. Account registration and security",
    body: `You must provide accurate, complete, and current registration information. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.

You must notify us immediately at gudmundur@grow.contact if you become aware of any unauthorised access to your account. We are not liable for losses caused by unauthorised use of your account where you have failed to take reasonable precautions.

You may only create accounts for yourself or, if you are an administrator, for authorised members of your organisation. You may not share login credentials between individuals.`,
  },
  {
    title: "3. Acceptable use",
    body: `You agree not to use the Service to:

— Discriminate against job candidates on the basis of race, colour, religion, sex, national origin, age, disability, or any other characteristic protected by applicable law.
— Violate candidates' rights under applicable employment, privacy, or data protection law, including GDPR and CCPA.
— Collect or process data about candidates without a lawful basis, appropriate notices, or required consents.
— Circumvent platform rate limits, access controls, or security measures.
— Reverse engineer, decompile, or attempt to extract model weights or proprietary algorithms.
— Transmit malware, spam, or any content that is unlawful, defamatory, or infringing on third-party intellectual property.
— Resell, sublicence, or provide access to the Service to third parties not covered by your subscription, except as expressly permitted in an order form.

Grow reserves the right to suspend or terminate access for material breach of these acceptable use obligations, with or without prior notice depending on the severity of the breach.`,
  },
  {
    title: "4. AI features and outputs",
    body: `The Service includes AI-powered features such as candidate sourcing assistance, outreach drafting, interview transcription, and scorecard generation (collectively, "AI Features"). AI outputs are tools to assist human decision-making, not autonomous decisions.

Customer is and remains the data controller and the decision-maker for all hiring decisions. You are responsible for human review of AI-generated content — including drafted outreach messages, candidate summaries, and interview evaluations — before acting on it or sending it to third parties.

Grow does not guarantee the accuracy, completeness, or suitability of AI outputs for any specific purpose. AI Features may produce errors, omissions, or content that requires editing before use.

You must not use AI outputs in ways that create or perpetuate unlawful bias in hiring, or in ways that violate applicable employment or anti-discrimination law.`,
  },
  {
    title: "5. Subscription tiers and fees",
    body: `The Service is offered on the following subscription tiers (indicative; current pricing is confirmed in your order form or the pricing page):

Starter: designed for early-stage teams; includes core sourcing, outreach, and basic interview tooling for up to 3 seats.

Growth: designed for scaling recruiting teams; includes advanced AI features, interview copilot, and integrations for up to 15 seats.

Enterprise: custom pricing for large or regulated organisations; includes dedicated support, custom data retention policies, DPA, and SLA commitments.

Fees are billed in advance on the billing cycle stated in your order form (monthly or annual). Annual subscriptions are non-refundable except as required by applicable law or as stated in Section 9 (Termination). Monthly subscriptions may be cancelled at any time with effect from the end of the current billing period.

You are responsible for all taxes applicable to your purchase, excluding taxes on Grow's net income. Grow will add applicable VAT or equivalent where required by Icelandic or EU tax law.

Grow may change pricing with at least 30 days' written notice before the change takes effect for existing customers.`,
  },
  {
    title: "6. Intellectual property",
    body: `Grow platform: Grow and its licensors retain all right, title, and interest in the Service, including the platform software, AI models, interfaces, documentation, and all related intellectual property. No rights are transferred to you except the limited licence to use the Service as described in these Terms.

Customer data: you retain all right, title, and interest in the data you upload to or generate through the Service ("Customer Data"), including candidate records, scorecards, and email content. You grant Grow a limited, non-exclusive licence to process Customer Data solely to provide and improve the Service as described in our Privacy Policy.

Feedback: if you provide suggestions, bug reports, or feature requests, you grant Grow a royalty-free, perpetual, irrevocable licence to use that feedback without restriction or compensation to you.

Restrictions: you may not remove proprietary notices from any portion of the Service, and you may not use Grow's trademarks without prior written permission.`,
  },
  {
    title: "7. Confidentiality",
    body: `Each party may disclose to the other certain non-public information in connection with the Service ("Confidential Information"). Each party agrees to: (a) hold the other's Confidential Information in strict confidence using at least reasonable care; (b) use it only for the purposes of fulfilling obligations under these Terms; and (c) not disclose it to third parties without prior written consent, except to employees or contractors who need it to fulfil those purposes and are bound by equivalent confidentiality obligations.

Confidential Information does not include information that: (i) is or becomes publicly known through no fault of the receiving party; (ii) was known to the receiving party before disclosure; (iii) is independently developed without use of Confidential Information; or (iv) must be disclosed by law, provided the disclosing party gives reasonable prior notice where permitted.`,
  },
  {
    title: "8. Warranties and disclaimer",
    body: `Each party warrants that: (a) it has the authority to enter into these Terms; and (b) its performance will comply with applicable law.

Grow warrants that it will provide the Service with reasonable care and skill and will implement appropriate technical and organisational security measures as described in the Privacy Policy.

Except as expressly stated above, the Service is provided "as is" and "as available." To the maximum extent permitted by applicable law, Grow disclaims all implied warranties, including implied warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted or error-free operation.

Grow does not warrant that AI outputs are accurate, complete, or free from bias, and expressly excludes liability for decisions made by Customer on the basis of AI-generated content without human review.`,
  },
  {
    title: "9. Term and termination",
    body: `Term: these Terms commence on the date you first accept them and continue for the subscription period stated in your order form, renewing automatically unless terminated in accordance with this section.

Termination by Customer: you may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current paid period. No partial refunds are provided for monthly subscriptions.

Termination by Grow: we may suspend or terminate your access: (a) immediately if you breach Section 3 (Acceptable Use) in a material way; (b) on 30 days' written notice for any material breach that you fail to cure within that period; or (c) immediately if required by law.

Effect of termination: on termination, your right to access the Service ceases. We will make Customer Data available for export for 30 days following termination, after which it will be deleted in accordance with the Privacy Policy. Sections 6, 7, 8, 10, 11, and 12 survive termination.`,
  },
  {
    title: "10. Limitation of liability",
    body: `To the maximum extent permitted by applicable law:

Neither party will be liable to the other for indirect, incidental, consequential, special, or exemplary damages, including loss of profits, loss of data, loss of goodwill, or business interruption, arising out of or in connection with these Terms or the Service, even if advised of the possibility of such damages.

Each party's aggregate liability for all claims arising out of or related to these Terms is limited to the total fees paid by Customer to Grow in the 12 months immediately preceding the event giving rise to the claim, or €1,000, whichever is greater.

Nothing in these Terms limits liability for: (a) death or personal injury caused by negligence; (b) fraud or fraudulent misrepresentation; (c) any liability that cannot be excluded or limited by Icelandic law or applicable EU law.`,
  },
  {
    title: "11. Data processing",
    body: `Where Grow processes personal data on behalf of Customer in connection with the Service, the parties' obligations are set out in Grow's Data Processing Agreement ("DPA"), which is incorporated by reference into these Terms. By accepting these Terms, you also accept the DPA. The DPA is available on request at gudmundur@grow.contact.

Customer, as data controller, is responsible for ensuring a lawful basis exists for all personal data uploaded to the Service, including candidate data, and for providing appropriate privacy notices to data subjects.`,
  },
  {
    title: "12. Governing law and disputes",
    body: `These Terms are governed by and construed in accordance with the laws of Iceland, without regard to its conflict-of-law principles. The parties submit to the exclusive jurisdiction of the Icelandic courts, with the District Court of Reykjavík (Héraðsdómur Reykjavíkur) as the court of first instance.

Notwithstanding the foregoing, either party may seek interim or injunctive relief in any jurisdiction where necessary to prevent irreparable harm.

Customers located in the EU retain any mandatory protections afforded by the law of their country of residence that cannot be excluded by contract.`,
  },
  {
    title: "13. General provisions",
    body: `Entire agreement: these Terms, together with any order form and the DPA, constitute the entire agreement between the parties with respect to the Service and supersede all prior agreements and understandings.

Amendments: Grow may update these Terms from time to time. We will provide at least 14 days' notice by email or in-platform notification before material changes take effect. Continued use after the effective date constitutes acceptance.

Severability: if any provision is found unenforceable, the remaining provisions continue in full force.

No waiver: failure to enforce any provision does not constitute a waiver of the right to enforce it in the future.

Assignment: Customer may not assign these Terms without Grow's prior written consent. Grow may assign its rights and obligations to an affiliate or in connection with a merger or acquisition, provided the acquiring entity assumes all obligations.

Contact: Grow Contact LLC, gudmundur@grow.contact, Iceland.`,
  },
];

function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-32 pt-32">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Legal
        </div>
        <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated May 10, 2026
        </p>
        <p className="mt-8 text-lg text-muted-foreground">
          The standard agreement between Grow Contact LLC and customers using
          the Grow platform. For negotiated enterprise terms or a custom DPA,
          contact{" "}
          <a
            href="mailto:gudmundur@grow.contact"
            className="underline underline-offset-2 hover:text-foreground"
          >
            gudmundur@grow.contact
          </a>
          .
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

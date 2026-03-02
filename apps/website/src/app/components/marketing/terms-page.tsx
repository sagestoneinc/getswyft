export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-3xl text-primary mb-2" style={{ fontWeight: 700 }}>Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 1, 2026</p>
      {[
        { title: "Acceptance of Terms", content: "By accessing or using SwyftUp's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services." },
        { title: "Description of Service", content: "SwyftUp provides an embeddable communication platform for real estate professionals, including live chat, voice calling, lead routing, and analytics tools." },
        { title: "Account Responsibilities", content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account." },
        { title: "Acceptable Use", content: "You agree to use SwyftUp only for lawful purposes and in accordance with these terms. You may not use the service to send spam, harass others, or engage in any illegal activity." },
        { title: "Payment Terms", content: "Paid plans are billed monthly or annually. All fees are non-refundable unless otherwise specified. We reserve the right to change pricing with 30 days notice." },
        { title: "Intellectual Property", content: "SwyftUp and its original content, features, and functionality are owned by SwyftUp, Inc. and are protected by international copyright, trademark, and other intellectual property laws." },
        { title: "Limitation of Liability", content: "SwyftUp shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service." },
        { title: "Termination", content: "We may terminate or suspend your account at any time for violations of these terms. Upon termination, your right to use the service will immediately cease." },
        { title: "Contact", content: "Questions about these Terms should be directed to legal@swyftup.com or mailed to 123 Innovation Blvd, Austin, TX 78701." },
      ].map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-xl text-primary mb-3" style={{ fontWeight: 600 }}>{section.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-3xl text-primary mb-2" style={{ fontWeight: 700 }}>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 1, 2026</p>
      {[
        { title: "Information We Collect", content: "We collect information you provide directly, such as your name, email address, phone number, and company information when you create an account or request a demo. We also collect usage data, including conversation logs, analytics data, and technical information about your device and browser." },
        { title: "How We Use Your Information", content: "We use collected information to provide and improve our services, communicate with you, analyze usage patterns, and ensure the security of our platform. We do not sell your personal information to third parties." },
        { title: "Data Sharing", content: "We may share information with service providers who help us operate our platform, as required by law, or in connection with a business transfer. Conversation data is shared only between the parties involved in the conversation." },
        { title: "Data Retention", content: "We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting our support team." },
        { title: "Security", content: "We implement industry-standard security measures to protect your information, including encryption in transit and at rest, access controls, and regular security audits." },
        { title: "Your Rights", content: "You have the right to access, correct, or delete your personal information. You can also opt out of marketing communications at any time. Contact us at privacy@swyftup.com." },
        { title: "Contact Us", content: "If you have questions about this Privacy Policy, please contact us at privacy@swyftup.com or write to us at 123 Innovation Blvd, Austin, TX 78701." },
      ].map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-xl text-primary mb-3" style={{ fontWeight: 600 }}>{section.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  );
}

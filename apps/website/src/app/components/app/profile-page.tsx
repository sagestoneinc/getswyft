import { useState } from "react";
import { User, Mail, Phone, Shield, HelpCircle, ExternalLink, CheckCircle, Save } from "lucide-react";

export function ProfilePage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Profile & Account</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile settings</p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" /> Profile saved successfully!
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-6 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <User className="w-5 h-5 text-accent" /> Personal Information
        </h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-xl" style={{ fontWeight: 700 }}>SC</div>
          <div>
            <button className="text-sm text-accent hover:underline" style={{ fontWeight: 500 }}>Change avatar</button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>First Name</label>
              <input type="text" defaultValue="Sarah" className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Last Name</label>
              <input type="text" defaultValue="Chen" className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Email</label>
            <input type="email" defaultValue="sarah@pinnacle.com" className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Phone</label>
            <input type="tel" defaultValue="(555) 123-4567" className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm" />
          </div>
        </div>
        <button onClick={handleSave} className="mt-6 bg-accent text-white px-6 py-2.5 rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 text-sm" style={{ fontWeight: 600 }}>
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <Shield className="w-5 h-5 text-accent" /> Security
        </h2>
        <div className="space-y-3">
          <button className="w-full text-left p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between">
            <span>Change password</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-full text-left p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between">
            <span>Two-factor authentication</span>
            <span className="text-xs text-muted-foreground">Not enabled</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <HelpCircle className="w-5 h-5 text-accent" /> Help & Support
        </h2>
        <div className="space-y-3">
          <a href="#" className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between">
            <span>Knowledge Base</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          <a href="#" className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between">
            <span>Contact Support</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          <a href="#" className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm flex items-center justify-between">
            <span>API Documentation</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  );
}

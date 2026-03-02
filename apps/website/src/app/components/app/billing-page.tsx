import { CreditCard, FileText, ArrowRight } from "lucide-react";

export function BillingPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and payment method</p>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-primary" style={{ fontWeight: 600 }}>Current Plan</h2>
          <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded" style={{ fontWeight: 600 }}>Professional</span>
        </div>
        <div className="flex items-end gap-1 mb-4">
          <span className="text-4xl text-primary" style={{ fontWeight: 700 }}>$49</span>
          <span className="text-muted-foreground text-sm mb-1">/agent/month</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground text-xs">Active Seats</p>
            <p className="text-primary text-lg" style={{ fontWeight: 700 }}>5</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground text-xs">Next Billing</p>
            <p className="text-primary text-lg" style={{ fontWeight: 700 }}>Apr 1</p>
          </div>
        </div>
        <button className="w-full py-2.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors" style={{ fontWeight: 500 }}>
          Change Plan
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <CreditCard className="w-5 h-5 text-accent" /> Payment Method
        </h2>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
          <div className="w-12 h-8 bg-primary rounded flex items-center justify-center text-white text-xs" style={{ fontWeight: 700 }}>VISA</div>
          <div>
            <p className="text-sm text-primary" style={{ fontWeight: 500 }}>**** **** **** 4242</p>
            <p className="text-xs text-muted-foreground">Expires 12/2027</p>
          </div>
        </div>
        <button className="text-sm text-accent hover:underline" style={{ fontWeight: 500 }}>Update payment method</button>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
          <FileText className="w-5 h-5 text-accent" /> Invoices
        </h2>
        <div className="space-y-3">
          {[
            { date: "Mar 1, 2026", amount: "$245.00", status: "Paid" },
            { date: "Feb 1, 2026", amount: "$245.00", status: "Paid" },
            { date: "Jan 1, 2026", amount: "$196.00", status: "Paid" },
          ].map((inv) => (
            <div key={inv.date} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-primary" style={{ fontWeight: 500 }}>{inv.date}</p>
                <p className="text-xs text-muted-foreground">{inv.amount}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded" style={{ fontWeight: 500 }}>{inv.status}</span>
                <button className="text-xs text-accent hover:underline">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

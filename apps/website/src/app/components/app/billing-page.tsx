import { useEffect, useState } from "react";
import { CreditCard, FileText, Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency, getBillingWorkspace, type BillingInvoice, type BillingSubscription } from "../../lib/tenant-admin";

export function BillingPage() {
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadBilling() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getBillingWorkspace();
        if (!mounted) {
          return;
        }

        setSubscription(response.billing.subscription);
        setInvoices(response.billing.invoices);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load billing workspace");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadBilling();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Review your plan snapshot, seat count, and recent invoice history.</p>
      </div>

      {error && (
        <div className="mb-6 bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-primary text-sm" style={{ fontWeight: 600 }}>Billing workspace needs attention</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading billing summary...</p>
        </div>
      ) : subscription ? (
        <>
          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary" style={{ fontWeight: 600 }}>Current Plan</h2>
              <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded uppercase" style={{ fontWeight: 600 }}>
                {subscription.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-4xl text-primary" style={{ fontWeight: 700 }}>
                {formatCurrency(subscription.seatPriceCents, subscription.currency)}
              </span>
              <span className="text-muted-foreground text-sm mb-1">/seat/{subscription.interval === "monthly" ? "month" : "year"}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{subscription.planName} via {subscription.provider}</p>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Active Seats</p>
                <p className="text-primary text-lg" style={{ fontWeight: 700 }}>{subscription.activeSeats}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Next Billing</p>
                <p className="text-primary text-lg" style={{ fontWeight: 700 }}>
                  {subscription.nextBillingAt ? new Date(subscription.nextBillingAt).toLocaleDateString() : "Not scheduled"}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Projected subtotal</p>
              <p className="text-xl text-primary mt-1" style={{ fontWeight: 700 }}>
                {formatCurrency(subscription.monthlySubtotalCents, subscription.currency)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <CreditCard className="w-5 h-5 text-accent" /> Payment
            </h2>
            <div className="p-4 rounded-lg bg-muted/40 text-sm text-muted-foreground">
              {subscription.provider === "paddle" ? (
                <>Billing is managed through Paddle. Subscription and invoice data sync automatically via webhooks.</>
              ) : (
                <>Billing is currently tracked as a tenant snapshot while payment processor wiring is completed. This gives you real plan and invoice state now without blocking the rest of the platform rollout.</>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg text-primary mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <FileText className="w-5 h-5 text-accent" /> Invoices
            </h2>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-primary" style={{ fontWeight: 500 }}>
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(invoice.issuedAt).toLocaleDateString()} · {formatCurrency(invoice.amountCents, invoice.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${invoice.status === "paid" ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`} style={{ fontWeight: 500 }}>
                      {invoice.status}
                    </span>
                    {invoice.hostedUrl ? (
                      <a href={invoice.hostedUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                        Open
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Internal</span>
                    )}
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="p-6 rounded-lg border border-border text-sm text-muted-foreground text-center">
                  No invoice records yet for this tenant.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          No billing subscription found for this tenant.
        </div>
      )}
    </div>
  );
}

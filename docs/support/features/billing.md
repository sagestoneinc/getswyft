# Billing

## Summary

The Billing page allows administrators to view their current subscription plan, seat pricing, subscription status, and invoice history. It provides a centralized view of all billing-related information for the tenant.

**Route:** `/app/billing`

> **⚠️ Implementation Note:** The billing data models, API endpoints, and UI are fully implemented. However, **payment processor integration is pending** — actual payment processing (e.g., Stripe) is scaffolded but **not yet connected**. The system stores and displays billing data, but charges are not currently processed through an external payment provider.

## Who Can Use This

This feature is available to users with the **`tenant.manage`** permission. It is restricted to administrators and is marked with an **Admin** badge in the sidebar navigation.

## What It Does

The Billing page displays subscription and invoice data retrieved from the API. The underlying data models are:

### BillingSubscription

| Field | Description |
|-------|-------------|
| `externalId` | Identifier from the external payment provider (reserved for future integration). |
| `provider` | Payment provider name (e.g., `stripe`). |
| `planName` | Name of the subscription plan (e.g., `Pro`, `Enterprise`). |
| `interval` | Billing interval — `monthly` or `annual`. |
| `status` | Current subscription status — `active`, `past_due`, `canceled`, or `trialing`. |
| `seatCount` | Number of seats included in the subscription. |
| `seatPriceInCents` | Price per seat in the smallest currency unit (e.g., cents for USD). |
| `currency` | Currency code (e.g., `usd`). |

### BillingInvoice

| Field | Description |
|-------|-------------|
| `externalId` | Identifier from the external payment provider. |
| `invoiceNumber` | Human-readable invoice number. |
| `status` | Invoice status — `draft`, `open`, `paid`, `void`, or `uncollectible`. |
| `amountDueInCents` | Total amount due in the smallest currency unit. |
| `amountPaidInCents` | Total amount paid in the smallest currency unit. |
| `currency` | Currency code. |
| `hostedInvoiceUrl` | URL to the hosted invoice page (if available from the payment provider). |
| `periodStart` | Start date of the billing period. |
| `periodEnd` | End date of the billing period. |

The API endpoint used is:

- **`GET /v1/tenants/current/billing`** — Returns the current subscription details and a list of invoices for the authenticated tenant.

## Key Functions / Actions Available

### Current Subscription Display

Displays the active subscription plan including the plan name, billing interval, seat count, and per-seat pricing.

### Subscription Status Badge

A visual badge indicating the current subscription status:

| Status | Badge | Description |
|--------|-------|-------------|
| `active` | ✅ Active | Subscription is current and in good standing. |
| `trialing` | 🔵 Trialing | Subscription is in a trial period. |
| `past_due` | ⚠️ Past Due | Payment is overdue. Action may be required. |
| `canceled` | ❌ Canceled | Subscription has been canceled. |

### Seat Pricing Information

Shows the number of seats on the plan and the cost per seat. Pricing is displayed in the subscription's configured currency.

### Invoice History Table

A table listing all invoices for the tenant, including:

- Invoice number
- Status
- Amount due
- Amount paid
- Billing period (start and end dates)
- Link to the hosted invoice (when available)

### Manage Subscription Button

A button that initiates subscription management actions (e.g., upgrading, downgrading, or canceling a plan).

> **⚠️ Note:** This button is present in the UI. However, because payment processor integration is not yet connected, subscription management actions may be limited or non-functional depending on the current integration state.

## Step-by-Step How to Use It

### Viewing Your Subscription

1. Log in with an account that has the `tenant.manage` permission.
2. Navigate to **Billing** in the sidebar (marked with an Admin badge).
3. The page loads and displays the current subscription plan, billing interval, seat count, seat pricing, and subscription status badge.

### Viewing Invoice History

1. On the Billing page, scroll to the **Invoice History** section.
2. Review the table of invoices. Each row shows the invoice number, status, amounts, and billing period.
3. If a hosted invoice URL is available, click the invoice link to view the full invoice in a new tab.

### Understanding Invoice Statuses

| Status | Meaning |
|--------|---------|
| `draft` | Invoice has been created but is not yet finalized. |
| `open` | Invoice has been finalized and is awaiting payment. |
| `paid` | Invoice has been paid in full. |
| `void` | Invoice has been voided and is no longer valid. |
| `uncollectible` | Invoice has been marked as uncollectible after failed payment attempts. |

## System Behavior / What Users Should Expect

- Billing data is fetched from the API each time the page loads. There is no automatic polling or real-time updates.
- Subscription and invoice data is tenant-scoped. Each tenant sees only their own billing information.
- Seat pricing is stored in the smallest currency unit (e.g., cents). The UI converts this to a human-readable format (e.g., `$12.00` per seat).
- The hosted invoice URL field may be empty if no external payment provider is connected.

> **⚠️ Implementation present but payment processor integration is pending.**
> The `BillingSubscription` and `BillingInvoice` data models are fully defined, the API endpoint returns data, and the UI renders billing information. However, **no external payment processor (Stripe, etc.) is currently connected**. This means:
>
> - Subscription changes (upgrades, downgrades, cancellations) initiated from the UI may not result in actual billing changes.
> - Invoice payment status may not reflect real-time payment processing.
> - The `externalId`, `hostedInvoiceUrl`, and `provider` fields are scaffolded for future integration but may not contain live data.
>
> Payment processor integration is planned for a future release.

## Permissions Required

| Permission | Description |
|------------|-------------|
| `tenant.manage` | Required to access the Billing page and view subscription and invoice data. |

Users without this permission will not see the Billing item in the sidebar.

## Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| Billing page not visible in sidebar | User lacks `tenant.manage` permission. | Contact a tenant administrator to request the appropriate role. |
| Subscription shows no plan | No subscription record exists for the tenant. | Contact support to verify the tenant's subscription was provisioned correctly. |
| Invoice table is empty | No invoices have been generated for the tenant. | This may be expected for new tenants or those on a trial plan. |
| "Manage Subscription" button does nothing | Payment processor integration is not yet connected. | This is a known limitation. Subscription changes should be coordinated with support until payment processing is fully integrated. |
| Hosted invoice link is missing | No external payment provider is connected, or the provider did not generate a hosted URL. | Contact support if you require a downloadable or viewable invoice. |
| Invoice status shows `uncollectible` | Payment attempts have failed and the invoice was marked as uncollectible. | Contact support to resolve payment issues and update the invoice status. |

## Support Notes / Troubleshooting

- The billing API (`GET /v1/tenants/current/billing`) returns both subscription and invoice data in a single response.
- All monetary values in the API and data models are stored in the smallest currency unit (cents). Ensure any manual data inspection accounts for this.
- If a tenant reports discrepancies between the displayed billing information and their actual charges, verify the payment provider dashboard directly (once integration is connected).
- For subscription or invoice issues that cannot be resolved through the UI, support staff should check the `BillingSubscription` and `BillingInvoice` records in the database.

## Related Pages

- [Analytics](analytics.md)
- [Profile & User Settings](profile-and-user-settings.md)

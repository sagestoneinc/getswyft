# Analytics

## Summary

The Analytics page provides administrators with a real-time overview of communication activity across the platform. It displays key performance indicators (KPIs), conversation trends, response time patterns, and lead source breakdowns through interactive charts and date range controls.

**Route:** `/app/analytics`

## Who Can Use This

This feature is available to users with the **`analytics.read`** permission. It is restricted to administrators and is marked with an **Admin** badge in the sidebar navigation.

## What It Does

The Analytics page aggregates event data recorded across the platform and presents it through four KPI cards and three interactive charts. Events are tracked via the `AnalyticsEvent` model, which captures an event name, category, numeric value, optional JSON metadata, and a timestamp.

The underlying API supports:

- **Recording events** — `POST /v1/analytics/events` accepts `eventName`, `category`, `value`, and `metadata` fields.
- **Retrieving summaries** — `GET /v1/analytics/summary` returns total events, active users, message count, and call count for the last 7 days by default, or for a custom date range when specified.

## Key Functions / Actions Available

### KPI Cards

| Card | Description |
|------|-------------|
| **Total Conversations** | The total number of conversations recorded within the selected date range. |
| **Avg Response Time** | The average time between an inbound message and the first agent reply. |
| **Lead Conversion %** | The percentage of leads that converted to a completed action (e.g., scheduled showing, signed lease). |
| **Active Agents** | The number of agents who participated in at least one conversation during the selected period. |

### Charts

| Chart | Type | Description |
|-------|------|-------------|
| **Conversation Volume** | Bar chart (by day) | Displays daily conversation counts across the selected date range. |
| **Response Time** | Line chart (by hour) | Shows average response time trends broken down by hour of day. |
| **Lead Source** | Pie chart | Breaks down leads by their originating source (e.g., website, referral, listing portal). |

All charts are rendered using the Recharts library.

### Date Range Selector

The date range selector allows you to filter all KPI cards and charts by a predefined window:

- **7d** — Last 7 days (default)
- **30d** — Last 30 days
- **90d** — Last 90 days

## Step-by-Step How to Use It

### Viewing Analytics

1. Log in with an account that has the `analytics.read` permission.
2. Navigate to **Analytics** in the sidebar (marked with an Admin badge).
3. The page loads with the default 7-day view. All four KPI cards and three charts populate automatically.

### Changing the Date Range

1. Locate the date range selector at the top of the Analytics page.
2. Click one of the available options: **7d**, **30d**, or **90d**.
3. All KPI cards and charts refresh to reflect the selected time window.

### Interpreting the Charts

- **Conversation Volume (Bar Chart):** Each bar represents one day. Taller bars indicate higher conversation activity. Use this to identify peak days or weekly patterns.
- **Response Time (Line Chart):** Each point represents an hourly average. Look for spikes that may indicate staffing gaps or slow response periods.
- **Lead Source (Pie Chart):** Each slice represents a lead source. Hover over a slice to see the exact count and percentage. Use this to evaluate which channels generate the most leads.

## System Behavior / What Users Should Expect

- Data refreshes each time the page loads or the date range changes. There is no automatic polling.
- KPI values and chart data are computed server-side from recorded `AnalyticsEvent` entries.
- If no events exist for the selected date range, cards display zero values and charts render empty.
- Chart tooltips appear on hover, showing exact values for the selected data point.

## Permissions Required

| Permission | Description |
|------------|-------------|
| `analytics.read` | Required to access the Analytics page and view all data. |

Users without this permission will not see the Analytics item in the sidebar.

## Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| Analytics page not visible in sidebar | User lacks `analytics.read` permission. | Contact a tenant administrator to request the appropriate role. |
| KPI cards show all zeros | No events recorded in the selected date range. | Verify that events are being tracked and try expanding the date range. |
| Charts are empty or not rendering | No data for the selected period, or a temporary loading issue. | Refresh the page. If the issue persists, check the browser console for errors and contact support. |
| Data appears stale | The page does not auto-refresh. | Change the date range or reload the page to fetch updated data. |

## Support Notes / Troubleshooting

- The analytics summary API (`GET /v1/analytics/summary`) defaults to a 7-day window when no date range parameters are provided.
- Events are recorded through `POST /v1/analytics/events`. If expected events are missing, verify that the upstream integration is sending events correctly.
- Analytics data is tenant-scoped. Administrators only see data for their own tenant.
- If charts fail to render, ensure the browser supports modern JavaScript (ES2020+) and that no browser extensions are blocking script execution.

## Related Pages

- [Billing](billing.md)
- [Profile & User Settings](profile-and-user-settings.md)

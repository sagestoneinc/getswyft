import { useEffect, useState } from "react";
import { BellRing, CheckCheck, Loader2, RefreshCw, Send, AlertTriangle } from "lucide-react";
import { listNotifications, markNotificationRead, sendNotificationTest, type NotificationItem } from "../../lib/operations";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadNotifications() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listNotifications(50);
      setNotifications(response.notifications || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function handleSendTest() {
    setIsTesting(true);
    setError(null);

    try {
      await sendNotificationTest();
      await loadNotifications();
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Failed to send test notification");
    } finally {
      setIsTesting(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                readAt: notification.readAt || new Date().toISOString(),
              }
            : notification,
        ),
      );
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Failed to mark notification as read");
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl text-primary flex items-center gap-2" style={{ fontWeight: 700 }}>
            <BellRing className="w-6 h-6 text-accent" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Notification inbox, push tests, and read tracking.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="px-3 py-2 rounded-lg border border-border bg-white hover:bg-muted text-sm inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleSendTest()}
            disabled={isTesting}
            className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 text-sm inline-flex items-center gap-2 disabled:opacity-60"
            style={{ fontWeight: 600 }}
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Test
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total: {notifications.length}</p>
        <p className="text-sm text-primary" style={{ fontWeight: 600 }}>
          Unread: {unreadCount}
        </p>
      </div>

      {error ? (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <BellRing className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl divide-y divide-border">
          {notifications.map((notification) => {
            const unread = !notification.readAt;

            return (
              <div key={notification.id} className="p-4 md:p-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm text-primary" style={{ fontWeight: unread ? 700 : 600 }}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(notification.createdAt)} · type: {notification.type}
                  </p>
                </div>

                {unread ? (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(notification.id)}
                    className="px-3 py-2 rounded-lg border border-border bg-white hover:bg-muted text-xs inline-flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark Read
                  </button>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 inline-flex items-center gap-1.5">
                    <CheckCheck className="w-3.5 h-3.5" /> Read
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

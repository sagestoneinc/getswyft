import { useEffect, useState } from "react";
import {
  AlertTriangle,
  FileDown,
  Hash,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  createChannel,
  createFeedPost,
  listCallSessions,
  listChannels,
  listComplianceExports,
  listFeedPosts,
  requestComplianceExport,
  type CallSessionItem,
  type ChannelItem,
  type ComplianceExportItem,
  type FeedPostItem,
} from "../../lib/operations";

type SectionState<T> = {
  data: T;
  isLoading: boolean;
  error: string | null;
};

function SectionError({ error }: { error: string | null }) {
  if (!error) {
    return null;
  }

  return (
    <div className="mt-3 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-muted-foreground inline-flex items-center gap-2">
      <AlertTriangle className="w-3.5 h-3.5 text-warning" /> {error}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

export function CollaborationPage() {
  const [channelsState, setChannelsState] = useState<SectionState<ChannelItem[]>>({
    data: [],
    isLoading: true,
    error: null,
  });
  const [callsState, setCallsState] = useState<SectionState<CallSessionItem[]>>({
    data: [],
    isLoading: true,
    error: null,
  });
  const [feedState, setFeedState] = useState<SectionState<FeedPostItem[]>>({
    data: [],
    isLoading: true,
    error: null,
  });
  const [exportsState, setExportsState] = useState<SectionState<ComplianceExportItem[]>>({
    data: [],
    isLoading: true,
    error: null,
  });

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<ChannelItem["type"]>("PUBLIC");
  const [newPostBody, setNewPostBody] = useState("");
  const [newPostVisibility, setNewPostVisibility] = useState<FeedPostItem["visibility"]>("TEAM");
  const [newExportType, setNewExportType] = useState<"full_data" | "conversations" | "audit_logs" | "users">("full_data");

  const [isSubmittingChannel, setIsSubmittingChannel] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isSubmittingExport, setIsSubmittingExport] = useState(false);

  async function loadAll() {
    setChannelsState((current) => ({ ...current, isLoading: true, error: null }));
    setCallsState((current) => ({ ...current, isLoading: true, error: null }));
    setFeedState((current) => ({ ...current, isLoading: true, error: null }));
    setExportsState((current) => ({ ...current, isLoading: true, error: null }));

    const [channelsResult, callsResult, feedResult, exportsResult] = await Promise.allSettled([
      listChannels(),
      listCallSessions(20),
      listFeedPosts(20),
      listComplianceExports(),
    ]);

    if (channelsResult.status === "fulfilled") {
      setChannelsState({ data: channelsResult.value.channels || [], isLoading: false, error: null });
    } else {
      setChannelsState({
        data: [],
        isLoading: false,
        error: channelsResult.reason instanceof Error ? channelsResult.reason.message : "Unable to load channels",
      });
    }

    if (callsResult.status === "fulfilled") {
      setCallsState({ data: callsResult.value.sessions || [], isLoading: false, error: null });
    } else {
      setCallsState({
        data: [],
        isLoading: false,
        error: callsResult.reason instanceof Error ? callsResult.reason.message : "Unable to load call sessions",
      });
    }

    if (feedResult.status === "fulfilled") {
      setFeedState({ data: feedResult.value.posts || [], isLoading: false, error: null });
    } else {
      setFeedState({
        data: [],
        isLoading: false,
        error: feedResult.reason instanceof Error ? feedResult.reason.message : "Unable to load feed posts",
      });
    }

    if (exportsResult.status === "fulfilled") {
      setExportsState({ data: exportsResult.value.exports || [], isLoading: false, error: null });
    } else {
      setExportsState({
        data: [],
        isLoading: false,
        error: exportsResult.reason instanceof Error ? exportsResult.reason.message : "Unable to load compliance exports",
      });
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function handleCreateChannel() {
    if (!newChannelName.trim()) {
      setChannelsState((current) => ({ ...current, error: "Channel name is required" }));
      return;
    }

    setIsSubmittingChannel(true);
    setChannelsState((current) => ({ ...current, error: null }));

    try {
      const response = await createChannel({
        name: newChannelName.trim(),
        type: newChannelType,
      });
      setChannelsState((current) => ({
        ...current,
        data: [response.channel, ...current.data],
      }));
      setNewChannelName("");
    } catch (createError) {
      setChannelsState((current) => ({
        ...current,
        error: createError instanceof Error ? createError.message : "Unable to create channel",
      }));
    } finally {
      setIsSubmittingChannel(false);
    }
  }

  async function handleCreatePost() {
    if (!newPostBody.trim()) {
      setFeedState((current) => ({ ...current, error: "Post body is required" }));
      return;
    }

    setIsSubmittingPost(true);
    setFeedState((current) => ({ ...current, error: null }));

    try {
      const response = await createFeedPost({
        body: newPostBody.trim(),
        visibility: newPostVisibility,
      });
      setFeedState((current) => ({ ...current, data: [response.post, ...current.data] }));
      setNewPostBody("");
    } catch (postError) {
      setFeedState((current) => ({
        ...current,
        error: postError instanceof Error ? postError.message : "Unable to create post",
      }));
    } finally {
      setIsSubmittingPost(false);
    }
  }

  async function handleRequestExport() {
    setIsSubmittingExport(true);
    setExportsState((current) => ({ ...current, error: null }));

    try {
      const response = await requestComplianceExport(newExportType);
      setExportsState((current) => ({ ...current, data: [response.export, ...current.data] }));
    } catch (exportError) {
      setExportsState((current) => ({
        ...current,
        error: exportError instanceof Error ? exportError.message : "Unable to request export",
      }));
    } finally {
      setIsSubmittingExport(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Collaboration</h1>
          <p className="text-sm text-muted-foreground mt-1">Channels, calls, feed, and compliance exports.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          className="px-3 py-2 rounded-lg border border-border bg-white hover:bg-muted text-sm inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh All
        </button>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <section className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-base text-primary inline-flex items-center gap-2" style={{ fontWeight: 650 }}>
            <Hash className="w-5 h-5 text-accent" /> Channels
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={newChannelName}
              onChange={(event) => setNewChannelName(event.target.value)}
              placeholder="new-channel"
              className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
            />
            <select
              value={newChannelType}
              onChange={(event) => setNewChannelType(event.target.value as ChannelItem["type"])}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm"
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="PRIVATE">PRIVATE</option>
              <option value="DIRECT">DIRECT</option>
            </select>
            <button
              type="button"
              onClick={() => void handleCreateChannel()}
              disabled={isSubmittingChannel}
              className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 text-sm inline-flex items-center gap-1.5 disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {isSubmittingChannel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
            </button>
          </div>

          <SectionError error={channelsState.error} />

          <div className="mt-4 space-y-2">
            {channelsState.isLoading ? (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading channels...
              </p>
            ) : channelsState.data.length === 0 ? (
              <EmptyState text="No channels yet." />
            ) : (
              channelsState.data.map((channel) => (
                <div key={channel.id} className="border border-border rounded-lg p-3">
                  <p className="text-sm text-primary" style={{ fontWeight: 650 }}>{channel.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">#{channel.slug} · {channel.type} · members {channel.memberCount}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-base text-primary inline-flex items-center gap-2" style={{ fontWeight: 650 }}>
            <Phone className="w-5 h-5 text-accent" /> Call Sessions
          </h2>
          <SectionError error={callsState.error} />
          <div className="mt-4 space-y-2">
            {callsState.isLoading ? (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading call sessions...
              </p>
            ) : callsState.data.length === 0 ? (
              <EmptyState text="No call sessions recorded yet." />
            ) : (
              callsState.data.map((session) => (
                <div key={session.id} className="border border-border rounded-lg p-3">
                  <p className="text-sm text-primary" style={{ fontWeight: 650 }}>
                    {session.callType} · {session.status}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(session.startedAt).toLocaleString()} · participants {session.participantCount}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-base text-primary inline-flex items-center gap-2" style={{ fontWeight: 650 }}>
            <MessageSquare className="w-5 h-5 text-accent" /> Feed
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={newPostBody}
              onChange={(event) => setNewPostBody(event.target.value)}
              placeholder="Post update to your tenant feed"
              className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
            />
            <select
              value={newPostVisibility}
              onChange={(event) => setNewPostVisibility(event.target.value as FeedPostItem["visibility"])}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm"
            >
              <option value="TEAM">TEAM</option>
              <option value="PUBLIC">PUBLIC</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
            <button
              type="button"
              onClick={() => void handleCreatePost()}
              disabled={isSubmittingPost}
              className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 text-sm inline-flex items-center gap-1.5 disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {isSubmittingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Post
            </button>
          </div>

          <SectionError error={feedState.error} />

          <div className="mt-4 space-y-2">
            {feedState.isLoading ? (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading feed posts...
              </p>
            ) : feedState.data.length === 0 ? (
              <EmptyState text="No feed posts yet." />
            ) : (
              feedState.data.map((post) => (
                <div key={post.id} className="border border-border rounded-lg p-3">
                  <p className="text-sm text-primary" style={{ fontWeight: 600 }}>{post.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.visibility} · comments {post.commentCount} · reactions {post.reactions.length}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-base text-primary inline-flex items-center gap-2" style={{ fontWeight: 650 }}>
            <FileDown className="w-5 h-5 text-accent" /> Compliance Exports
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <select
              value={newExportType}
              onChange={(event) => setNewExportType(event.target.value as "full_data" | "conversations" | "audit_logs" | "users")}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm"
            >
              <option value="full_data">full_data</option>
              <option value="conversations">conversations</option>
              <option value="audit_logs">audit_logs</option>
              <option value="users">users</option>
            </select>
            <button
              type="button"
              onClick={() => void handleRequestExport()}
              disabled={isSubmittingExport}
              className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 text-sm inline-flex items-center gap-1.5 disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {isSubmittingExport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Request
            </button>
          </div>

          <SectionError error={exportsState.error} />

          <div className="mt-4 space-y-2">
            {exportsState.isLoading ? (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading exports...
              </p>
            ) : exportsState.data.length === 0 ? (
              <EmptyState text="No compliance exports yet." />
            ) : (
              exportsState.data.map((entry) => (
                <div key={entry.id} className="border border-border rounded-lg p-3">
                  <p className="text-sm text-primary" style={{ fontWeight: 650 }}>{entry.exportType}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.status} · {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, X, Users, Search, Loader2, AlertTriangle, Mail, Clock3 } from "lucide-react";
import {
  formatInvitationTimestamp,
  getTeamState,
  inviteTeamMember,
  updateTeamMemberRole,
  type TeamInvitation,
  type TeamMember,
} from "../../lib/team";

export function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"agent" | "admin">("agent");
  const [isInviting, setIsInviting] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [editedRole, setEditedRole] = useState<"agent" | "admin">("agent");

  useEffect(() => {
    let mounted = true;

    async function loadTeam() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getTeamState();
        if (!mounted) {
          return;
        }

        setMembers(response.members);
        setInvitations(response.invitations);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load team workspace");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadTeam();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return members;
    }

    return members.filter((member) =>
      member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query),
    );
  }, [members, searchQuery]);

  const filteredInvitations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return invitations;
    }

    return invitations.filter((invitation) => invitation.email.toLowerCase().includes(query));
  }, [invitations, searchQuery]);

  const statusColors: Record<TeamMember["status"], string> = {
    online: "bg-green-500",
    offline: "bg-gray-300",
    busy: "bg-amber-500",
    away: "bg-sky-500",
  };

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      return;
    }

    setIsInviting(true);
    setError(null);

    try {
      const response = await inviteTeamMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setInvitations((currentInvitations) => [response.invitation, ...currentInvitations.filter((entry) => entry.email !== response.invitation.email)]);
      setInviteEmail("");
      setInviteRole("agent");
      setShowInvite(false);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRoleSave() {
    if (!editMember) {
      return;
    }

    setIsSavingRole(true);
    setError(null);

    try {
      const response = await updateTeamMemberRole(editMember.id, {
        role: editedRole,
      });

      setMembers((currentMembers) =>
        currentMembers.map((member) => (member.id === response.member.id ? response.member : member)),
      );
      setEditMember(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update role");
    } finally {
      setIsSavingRole(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Team / Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tenant members, roles, and pending invites</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-accent text-white px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 text-sm"
          style={{ fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Invite teammate
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search members or invites..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
        />
      </div>

      {error && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="text-primary text-sm" style={{ fontWeight: 600 }}>Team admin action needs attention</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your team workspace...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm text-primary" style={{ fontWeight: 600 }}>Members</h2>
              <span className="text-xs text-muted-foreground">{filteredMembers.length} visible</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Agent</th>
                    <th className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 600 }}>Email</th>
                    <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Role</th>
                    <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Status</th>
                    <th className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 600 }}>Open chats</th>
                    <th className="px-4 py-3 text-xs text-muted-foreground" style={{ fontWeight: 600 }}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center text-xs text-accent" style={{ fontWeight: 600 }}>
                            {member.name.split(" ").map((segment) => segment[0]).join("").slice(0, 2)}
                          </div>
                          <span className="text-sm text-primary" style={{ fontWeight: 500 }}>{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{member.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${member.role === "admin" ? "bg-amber-50 text-amber-700" : "bg-muted text-muted-foreground"}`} style={{ fontWeight: 500 }}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs capitalize">
                          <span className={`w-2 h-2 rounded-full ${statusColors[member.status]}`}></span>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{member.conversations}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setEditMember(member);
                            setEditedRole(member.role);
                          }}
                          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredMembers.length === 0 && (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No members matched your search.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm text-primary flex items-center gap-2" style={{ fontWeight: 600 }}>
                <Mail className="w-4 h-4" /> Pending invites
              </h2>
              <span className="text-xs text-muted-foreground">{filteredInvitations.length} visible</span>
            </div>
            <div className="divide-y divide-border">
              {filteredInvitations.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No pending invites yet.</p>
                </div>
              ) : (
                filteredInvitations.map((invitation) => (
                  <div key={invitation.id} className="px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm text-primary" style={{ fontWeight: 600 }}>{invitation.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {invitation.role} invite sent by {invitation.invitedBy}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="w-3 h-3" /> Sent {formatInvitationTimestamp(invitation.sentAt)}
                      </span>
                      <span>Expires {formatInvitationTimestamp(invitation.expiresAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary" style={{ fontWeight: 600 }}>Invite teammate</h2>
              <button onClick={() => setShowInvite(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                  placeholder="agent@company.com"
                />
              </div>
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Role</label>
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as "agent" | "admin")}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => void handleInvite()}
                disabled={isInviting || !inviteEmail.trim()}
                className="w-full bg-accent text-white py-2.5 rounded-lg hover:bg-accent/90 text-sm disabled:opacity-60"
                style={{ fontWeight: 600 }}
              >
                {isInviting ? "Sending invite..." : "Send invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editMember && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-primary" style={{ fontWeight: 600 }}>Edit Role - {editMember.name}</h2>
              <button onClick={() => setEditMember(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-primary mb-1.5" style={{ fontWeight: 500 }}>Role</label>
                <select
                  value={editedRole}
                  onChange={(event) => setEditedRole(event.target.value as "agent" | "admin")}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                onClick={() => void handleRoleSave()}
                disabled={isSavingRole}
                className="w-full bg-accent text-white py-2.5 rounded-lg hover:bg-accent/90 text-sm disabled:opacity-60"
                style={{ fontWeight: 600 }}
              >
                {isSavingRole ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

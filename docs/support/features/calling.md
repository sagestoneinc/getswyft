# Calling

## Summary

The Calling feature in Getswyft enables real-time voice and video communication between users, leads, and contacts. Calls can be initiated from within a conversation or channel, with full participant management, mute/hold controls, call history, and telemetry recording. Outbound telephony is powered by Telnyx, and LiveKit infrastructure is scaffolded for future real-time media integration.

## Who Can Use This

- **All authenticated users** with the `conversation.read` permission can view call sessions and call history.
- **Users with the `conversation.write` permission** can initiate calls, manage participants, and update call status.
- **Tenant Admins** can access call history and telemetry data across their tenant.

## What It Does

Calling provides real-time voice and video communication within the Getswyft platform. Each call is tracked as a **Call Session** with a defined lifecycle, participant roster, and optional telemetry logging.

### Call Types

| Type | Description |
|---|---|
| **VOICE** | Audio-only call between participants. |
| **VIDEO** | Audio and video call between participants. |

### Call Status Flow

Every call session progresses through a defined status lifecycle:

```
RINGING → ANSWERED → ENDED
           ↘ BUSY
           ↘ FAILED
```

| Status | Description |
|---|---|
| **RINGING** | The call has been initiated and is awaiting a response from the recipient. |
| **ANSWERED** | The recipient accepted the call. The call is active. |
| **BUSY** | The recipient is unavailable or declined the call. |
| **FAILED** | The call could not be connected due to a technical issue. |
| **ENDED** | The call has been terminated. Duration is automatically calculated. |

### Key Models

- **CallSession** — Represents a single call instance. Tracks type, status, associated conversation or channel, LiveKit room reference, call duration, and an optional recording URL.
- **CallParticipant** — Represents a user in a call. Tracks join/leave times, mute state, and hold state.
- **CallTelemetry** — Records diagnostic and analytics events during a call (e.g., network quality, codec changes, errors).

## Key Functions / Actions Available

- Initiate a voice or video call from a conversation or channel.
- Answer, decline, or end an active call.
- Add participants to an ongoing call.
- Mute or unmute your microphone.
- Place a participant on hold or take them off hold.
- Remove a participant from a call.
- View call history (completed calls).
- Record telemetry events for call diagnostics and analytics.
- Initiate outbound telephony calls to a lead's phone number from a conversation.

## Step-by-Step How to Use It

### Initiating a Call from a Conversation

1. Open the conversation with the contact or lead you want to call.
2. Locate the **call initiation button** in the conversation UI.
3. Select the call type: **Voice** or **Video**.
4. The system creates a new Call Session with status **RINGING** and notifies the recipient.
5. The call UI displays the current call status (Ringing, Connected, etc.).

### Initiating an Outbound Telephony Call

1. Open a conversation with a lead who has a phone number on file.
2. Select the outbound call option. This uses the `POST /v1/conversations/:id/call` endpoint.
3. The system initiates the call via **Telnyx** telephony services.
4. The call is connected through the telephony provider, and the session is tracked in Getswyft.
5. In development environments, a fallback mechanism is used if Telnyx is not configured.

### Answering a Call

1. When an incoming call notification appears, you will see the caller information and call type.
2. Accept the call. The session status transitions from **RINGING** to **ANSWERED**.
3. The call timer begins and duration tracking starts automatically.

### Using Call Controls

**Mute/Unmute:**
1. During an active call, locate the **microphone toggle** button in the call UI.
2. Click to mute your microphone. Click again to unmute.
3. Your mute state is updated in real time and visible to other participants.

**Hold:**
1. During an active call, select the hold option for a participant.
2. The participant is placed on hold. Their audio is paused.
3. Take the participant off hold to resume the conversation.

### Ending a Call

1. Click the **End Call** button in the call UI.
2. The session status transitions to **ENDED**.
3. The system automatically calculates and records the call **duration** based on the time between ANSWERED and ENDED.
4. The call appears in the call history for future reference.

### Viewing Call History

1. Access the call history section.
2. Call history displays all completed calls (status: **ENDED**) with pagination support.
3. Each entry shows the call type, participants, duration, and timestamps.

### Adding a Participant to an Active Call

1. During an active call, select the option to add a participant.
2. Search for and select the user you want to add.
3. The participant is added to the call session and can join immediately.

### Removing a Participant

1. During an active call, locate the participant you want to remove.
2. Select the remove option. The participant is disconnected from the call.
3. Their `leftAt` timestamp is recorded in the session.

## System Behavior / What Users Should Expect

- **Automatic duration calculation** — When a call transitions to ENDED, the system calculates the duration from the ANSWERED timestamp. No manual input is required.
- **Real-time participant state** — Mute and hold states are tracked per participant and updated in real time for all call members.
- **Telemetry recording** — Telemetry events (e.g., network quality metrics, codec information, error logs) can be recorded during a call for diagnostics and analytics. These are stored per session.
- **Telnyx telephony** — Outbound calls to phone numbers are routed through the Telnyx telephony provider. In development environments, a fallback is used if Telnyx credentials are not configured.
- **LiveKit integration** — LiveKit infrastructure (URL and API keys) is scaffolded in the platform but is not yet fully integrated for real-time media transport. The `livekitRoom` field on CallSession is reserved for future use.
- **Recording URL** — The `recordingUrl` field on CallSession supports future call recording capabilities. Recording availability depends on infrastructure configuration.
- **Conversation and channel scope** — Calls can be associated with either a conversation (`conversationId`) or a channel (`channelId`), linking the call context to the appropriate communication thread.
- **Widget demo** — The embeddable widget demo includes a simulated voice call experience for demonstration and testing purposes.

## Permissions Required

| Action | Required Permission |
|---|---|
| View call sessions and history | `conversation.read` |
| Initiate a call | `conversation.write` |
| Update call status (answer, end) | `conversation.write` |
| Add a participant | `conversation.write` |
| Update participant state (mute, hold) | `conversation.write` |
| Remove a participant | `conversation.write` |
| Record telemetry events | `conversation.write` |
| Initiate outbound telephony call | `conversation.write` |

## Common Issues

| Issue | Cause | Resolution |
|---|---|---|
| Call stuck on RINGING | The recipient is offline or not connected to the platform. | Verify the recipient is online. If the issue persists, end the call and try again. |
| Call immediately shows FAILED | A technical issue prevented the call from connecting (network, server, or telephony provider). | Check your network connection. If using outbound telephony, verify Telnyx configuration. Retry the call. |
| Cannot hear the other participant | Microphone permissions may not be granted, or the participant may be muted. | Check browser microphone permissions. Verify neither participant is muted. |
| Mute toggle not responding | Network latency or a disconnected session. | Refresh the call UI. If the issue persists, end the call and reconnect. |
| Call duration shows as zero | The call was ended before transitioning to ANSWERED status. | Duration is only calculated for calls that reach ANSWERED status. Calls that go from RINGING to ENDED (missed calls) will show zero duration. |
| Outbound call not connecting | Telnyx credentials may not be configured, or the lead's phone number may be invalid. | Verify Telnyx configuration in your environment. Confirm the lead's phone number is valid and correctly formatted. In dev environments, the system uses a fallback. |
| Video not displaying | Browser may not have granted camera permissions, or the VIDEO call type was not selected. | Check browser camera permissions. Ensure the call was initiated as a VIDEO call. |

## Support Notes / Troubleshooting

- **LiveKit not working** — LiveKit real-time media infrastructure is scaffolded but not yet fully integrated. The `livekitRoom` field is present on call sessions but may not be populated. Full LiveKit integration is planned for a future release.
- **Telnyx fallback in development** — When running in a development environment without Telnyx credentials, the system uses a fallback mechanism for outbound calls. This is expected behavior and does not indicate an error.
- **Call history filtering** — Call history only returns sessions with a status of ENDED. Active or incomplete calls (RINGING, ANSWERED, BUSY, FAILED) are accessed through the sessions list endpoint with optional status filtering.
- **Telemetry data** — Telemetry events are recorded per session and include an event type and payload. These are useful for diagnosing call quality issues, tracking participant behavior, and generating analytics. Telemetry data is available via the API.
- **Participant join/leave tracking** — Each participant's `joinedAt` and `leftAt` timestamps are recorded. If a participant leaves and rejoins, a new participant record is created.
- **Browser compatibility** — Voice and video calls require a modern browser with WebRTC support. Ensure users are on a supported browser (Chrome, Firefox, Edge, or Safari) for the best experience.

## Related Pages

- [Inbox and Conversations](./inbox-and-conversations.md) — Overview of the conversation inbox and managing conversations.
- [Conversation Details and Messaging](./conversation-details-and-messaging.md) — Detailed conversation view where calls can be initiated.
- [Channels](./channels.md) — Group communication spaces that also support call initiation.

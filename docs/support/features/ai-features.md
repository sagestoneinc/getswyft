# AI Features

## Summary

Getswyft provides a suite of AI-powered capabilities that enhance communication, automate content moderation, and assist users with intelligent suggestions and summaries. These features include a conversational chatbot, message summarization, AI-driven content moderation, an assistant for contextual suggestions, and a voice bot extension. AI behavior is configurable per tenant, allowing each organization to choose its own AI provider and settings.

> **Implementation present but end-user UX is API-driven and may still evolve.** All AI endpoints described below are fully implemented on the backend. However, there is **no dedicated AI page in the website UI**. These capabilities are accessed exclusively through the API and may be integrated into future UI surfaces as the product evolves.

---

## Who Can Use This

| Role / Permission        | Capability                                          |
|--------------------------|-----------------------------------------------------|
| `tenant.manage`          | Configure AI providers and settings per tenant      |
| `conversation.write`     | Use chatbot, assistant, and voice bot features       |
| `conversation.read`      | Use summarization                                    |
| `moderation.manage`      | Use AI content moderation analysis                   |
| `analytics.read`         | View AI interaction history and usage logs           |

---

## What It Does

### AI Capabilities Overview

| Capability          | Interaction Type  | Description                                                                    |
|---------------------|-------------------|--------------------------------------------------------------------------------|
| **Chatbot**         | `CHATBOT`         | Conversational AI that responds to user messages within a conversation context  |
| **Summarization**   | `SUMMARIZATION`   | Generates concise summaries of conversations, channels, or direct text input    |
| **Content Moderation** | `MODERATION`   | Analyzes content and returns whether it should be flagged for policy violations |
| **Assistant**       | `ASSISTANT`       | Provides intelligent suggestions based on conversation or channel context       |
| **Voice Bot**       | `VOICE_BOT`       | AI-powered voice interaction endpoint with call session context                 |

### Per-Tenant Configuration

Each tenant can independently configure their AI provider and settings. This allows different organizations on the platform to use different AI backends (e.g., different large language model providers) based on their requirements, compliance needs, or licensing agreements.

The `AIConfig` model stores tenant-specific configuration:

| Field      | Description                                              |
|------------|----------------------------------------------------------|
| `key`      | Configuration key identifier                             |
| `provider` | The AI provider to use (e.g., the LLM service)          |
| `config`   | JSON object containing provider-specific settings        |
| `enabled`  | Whether this AI configuration is active for the tenant   |
| `tenantId` | The tenant this configuration belongs to                 |

---

## Key Functions / Actions Available

### Configuration Endpoints

| Action                | Endpoint                       | Permission Required |
|-----------------------|--------------------------------|---------------------|
| List AI configs       | `GET /v1/ai/config`            | `tenant.manage`     |
| Create/update config  | `PUT /v1/ai/config/:key`       | `tenant.manage`     |
| Delete config         | `DELETE /v1/ai/config/:key`    | `tenant.manage`     |

### AI Interaction Endpoints

| Action                     | Endpoint                  | Permission Required   |
|----------------------------|---------------------------|-----------------------|
| Chatbot interaction        | `POST /v1/ai/chat`        | `conversation.write`  |
| Summarize content          | `POST /v1/ai/summarize`   | `conversation.read`   |
| AI content moderation      | `POST /v1/ai/moderate`    | `moderation.manage`   |
| AI assistant suggestions   | `POST /v1/ai/assist`      | `conversation.write`  |
| Voice bot interaction      | `POST /v1/ai/voice-bot`   | `conversation.write`  |

### Usage Tracking

| Action                     | Endpoint                  | Permission Required   |
|----------------------------|---------------------------|-----------------------|
| List AI interactions       | `GET /v1/ai/interactions`  | `analytics.read`      |

### AIInteraction Model

Each AI interaction is logged with the following data:

| Field        | Description                                                |
|--------------|------------------------------------------------------------|
| `type`       | Interaction type: `CHATBOT`, `ASSISTANT`, `SUMMARIZATION`, `MODERATION`, or `VOICE_BOT` |
| `input`      | The input provided to the AI                               |
| `output`     | The AI-generated response                                  |
| `tokenUsage` | Number of tokens consumed by this interaction              |
| `durationMs` | Processing time in milliseconds                            |

---

## Step-by-Step: How to Use It

### 1. Configuring AI for Your Tenant

Before using any AI features, a tenant administrator must set up the AI configuration.

1. Send a `PUT` request to `/v1/ai/config/:key` with your provider details:
   ```json
   {
     "provider": "your-ai-provider",
     "config": {
       "apiKey": "your-provider-api-key",
       "model": "preferred-model-name",
       "temperature": 0.7
     },
     "enabled": true
   }
   ```
2. The system creates or updates the configuration for the specified key.
3. To verify, list all configurations with `GET /v1/ai/config`.
4. To disable AI temporarily without deleting the config, update the config with `"enabled": false`.
5. To remove a configuration entirely, send `DELETE /v1/ai/config/:key`.

> **Important:** AI interaction endpoints (chat, summarize, moderate, assist, voice-bot) check that the tenant's AI configuration is enabled before processing requests. If AI is not configured or is disabled, these endpoints will return an error.

### 2. Using the Chatbot

1. Send a `POST` request to `/v1/ai/chat` with your message:
   ```json
   {
     "message": "What are the move-in requirements for unit 4B?"
   }
   ```
2. The system processes the message using the tenant's configured AI provider.
3. The response includes the AI-generated reply.
4. The interaction is logged for analytics and audit purposes.

### 3. Summarizing a Conversation

You can summarize content in three ways: by conversation, by channel, or by providing direct text.

**By conversation:**
```json
POST /v1/ai/summarize
{
  "conversationId": "conv-abc-123"
}
```

**By channel:**
```json
POST /v1/ai/summarize
{
  "channelId": "channel-xyz-789"
}
```

**By direct text input:**
```json
POST /v1/ai/summarize
{
  "text": "Full text of the discussion you want summarized..."
}
```

- When a `conversationId` or `channelId` is provided, the system automatically loads the relevant messages before generating the summary.
- The response includes a concise summary of the content.

### 4. Running AI Content Moderation

1. Send a `POST` request to `/v1/ai/moderate` with the content to analyze:
   ```json
   {
     "content": "Text content to check for policy violations..."
   }
   ```
2. The AI analyzes the content against moderation policies.
3. The response indicates whether the content is **flagged** or **not flagged**:
   ```json
   {
     "flagged": true,
     "reason": "Content contains language that violates community guidelines."
   }
   ```
4. Use this result to inform manual moderation decisions or automate content filtering workflows.

### 5. Getting AI Assistant Suggestions

1. Send a `POST` request to `/v1/ai/assist` with conversation or channel context:
   ```json
   {
     "conversationId": "conv-abc-123",
     "prompt": "Suggest a professional response to the tenant's maintenance request."
   }
   ```
2. The AI generates contextual suggestions based on the conversation history.
3. The response includes one or more suggested actions or replies.

### 6. Using the Voice Bot

1. Send a `POST` request to `/v1/ai/voice-bot` with call session context:
   ```json
   {
     "sessionId": "call-session-456",
     "input": "Caller audio transcript or input text..."
   }
   ```
2. The AI processes the voice interaction and returns a response suitable for the call session.

### 7. Viewing AI Interaction History

1. Send a `GET` request to `/v1/ai/interactions` to retrieve logged interactions.
2. Use the `type` query parameter to filter by interaction type:
   - `GET /v1/ai/interactions?type=CHATBOT`
   - `GET /v1/ai/interactions?type=SUMMARIZATION`
   - `GET /v1/ai/interactions?type=MODERATION`
   - `GET /v1/ai/interactions?type=ASSISTANT`
   - `GET /v1/ai/interactions?type=VOICE_BOT`
3. Each interaction record includes the input, output, token usage, and duration for cost tracking and performance analysis.

---

## System Behavior / What Users Should Expect

- **Tenant AI config must be enabled.** All AI interaction endpoints verify that the requesting tenant has an active, enabled AI configuration before processing. If the configuration is missing or disabled, the request will fail.
- **Automatic message loading.** When using the summarize or assist endpoints with a `conversationId` or `channelId`, the system automatically retrieves the relevant messages. You do not need to provide message content manually.
- **Interaction logging.** Every AI interaction (chat, summary, moderation check, assistant suggestion, voice bot call) is logged with input, output, token usage, and duration. These logs are accessible via the interactions endpoint and may be included in compliance exports.
- **Token usage tracking.** Each interaction records the number of tokens consumed. Administrators can use the interactions endpoint to monitor AI usage and costs.
- **No dedicated UI.** AI features are accessed exclusively through the API. There is no AI page in the website interface. Integration into UI surfaces may evolve in future releases.
- **Provider flexibility.** Because AI is configured per tenant, different organizations can use different AI providers without affecting each other.

---

## Permissions Required

| Permission            | What It Grants                                           |
|-----------------------|----------------------------------------------------------|
| `tenant.manage`       | Configure, update, and delete AI provider settings       |
| `conversation.write`  | Use chatbot, assistant, and voice bot endpoints          |
| `conversation.read`   | Use the summarization endpoint                           |
| `moderation.manage`   | Use the AI content moderation endpoint                   |
| `analytics.read`      | View AI interaction history and usage data               |

---

## Common Issues

| Issue                                             | Cause / Resolution                                                                 |
|---------------------------------------------------|------------------------------------------------------------------------------------|
| `403 Forbidden` on any AI endpoint                | Your account lacks the required permission for that endpoint. See the permissions table above. |
| AI endpoint returns "AI not configured" error     | Your tenant does not have an active AI configuration. An administrator must set one up via `PUT /v1/ai/config/:key`. |
| AI endpoint returns "AI disabled" error           | Your tenant's AI configuration exists but is set to `enabled: false`. An administrator must enable it. |
| Summarization returns an empty or generic result  | The conversation or channel may have very few messages. Ensure there is sufficient content to summarize. |
| High token usage reported                         | Large conversations or channels consume more tokens when summarized or used as context for the assistant. Consider summarizing shorter segments. |
| Voice bot endpoint returns unexpected results     | Ensure the `sessionId` is valid and corresponds to an active call session.          |
| Cannot view AI interactions                       | You need the `analytics.read` permission to access interaction history.             |

---

## Support Notes / Troubleshooting

- **Configuration first:** AI features will not function until a tenant administrator configures and enables an AI provider. This is the most common reason for AI endpoint failures.
- **Provider-specific errors:** If the configured AI provider experiences outages or rate limiting, AI endpoints may return errors or degraded responses. Check your provider's status page if you encounter unexpected failures.
- **Data privacy:** AI interactions send data to the configured third-party AI provider. Ensure your organization's data handling policies permit this, especially for conversation content and user data.
- **Cost management:** Use the `GET /v1/ai/interactions` endpoint to monitor token usage across interaction types. This data can inform budgeting and usage policies.
- **Audit trail:** All AI interactions are logged and may be included in compliance exports via the `FULL_DATA` or `AUDIT_LOGS` export types.
- **Future UI integration:** While AI features are currently API-only, the platform may introduce dedicated UI components for AI capabilities in future releases. Monitor release notes for updates.

---

## Related Pages

- [Moderation](./moderation.md) — AI content moderation can supplement manual moderation workflows.
- [Compliance Exports](./compliance-exports.md) — AI interaction logs are included in compliance data exports.

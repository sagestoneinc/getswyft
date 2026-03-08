export function getConversationRoom(tenantId, conversationId) {
  return `tenant:${tenantId}:conversation:${conversationId}`;
}

export function serializeRealtimeConversationMessage(message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    text: message.body,
    body: message.body,
    sender: message.senderType === "AGENT" ? "agent" : message.senderType === "VISITOR" ? "visitor" : "system",
    senderType: message.senderType.toLowerCase(),
    createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
    clientMsgId: message.clientMsgId || null,
  };
}

export function emitConversationHistory(io, { tenantId, conversationId, messages }) {
  io.to(getConversationRoom(tenantId, conversationId)).emit("event", {
    type: "conversation.history",
    conversationId,
    payload: {
      messages: messages.map(serializeRealtimeConversationMessage),
    },
  });
}

export function emitConversationMessage(io, { tenantId, conversationId, message }) {
  const payload = serializeRealtimeConversationMessage(message);
  const room = getConversationRoom(tenantId, conversationId);

  io.to(room).emit("message:new", payload);
  io.to(room).emit("event", {
    type: "message.created",
    conversationId,
    payload,
  });
}

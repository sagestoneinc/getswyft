import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";

const storage = new AsyncLocalStorage();

export function requestContextMiddleware(req, _res, next) {
  const context = {
    requestId: req.header("x-request-id") || crypto.randomUUID(),
    tenantId: null,
    userId: null,
    roles: [],
    permissions: [],
  };

  req.context = context;
  storage.run(context, next);
}

export function extendRequestContext(req, patch) {
  if (!req.context) {
    req.context = {
      requestId: crypto.randomUUID(),
      tenantId: null,
      userId: null,
      roles: [],
      permissions: [],
    };
  }

  Object.assign(req.context, patch);
}

export function getRequestContext() {
  return storage.getStore();
}

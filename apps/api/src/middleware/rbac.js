function hasPermission(req, permission) {
  const permissions = req.auth?.activeTenant?.permissions || [];
  return permissions.includes(permission);
}

export function requirePermission(permission) {
  return function requirePermissionMiddleware(req, res, next) {
    if (!req.auth?.isAuthenticated) {
      return res.status(401).json({ ok: false, error: "Authentication required" });
    }

    if (!hasPermission(req, permission)) {
      return res.status(403).json({ ok: false, error: `Missing permission: ${permission}` });
    }

    return next();
  };
}

export function requireAnyPermission(permissions) {
  return function requireAnyPermissionMiddleware(req, res, next) {
    if (!req.auth?.isAuthenticated) {
      return res.status(401).json({ ok: false, error: "Authentication required" });
    }

    const allowed = permissions.some((permission) => hasPermission(req, permission));
    if (!allowed) {
      return res.status(403).json({ ok: false, error: `Missing any required permission: ${permissions.join(", ")}` });
    }

    return next();
  };
}

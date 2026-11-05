import type { Request, RequestHandler } from "express";

import {
  auditService,
  type AuditEventName,
  type AuditResource,
} from "@shared/audit";

type ResourceResolver = (req: Request) => AuditResource;

/**
 * Factory for sensitive-read audit middleware.
 *
 * Emits a single audit event per request, ONLY when the response finishes
 * with a success status (< 400). Failed reads are noise — they stay in the
 * HTTP access log but are not treated as sensitive-read events.
 *
 * Services never touch audit emission for reads; the middleware is the
 * sole emission site
 *
 * Mount BEFORE any cache middleware so cache hits are still audited —
 * `res.on("finish")` fires for cached responses too.
 *
 * @param name Audit event name from the sensitive-read allowlist.
 * @param resourceResolver Optional — pulls resource type/id from the request.
 *   When omitted, resource defaults to `{ type: "unknown" }`.
 */
export function auditRead(
  name: AuditEventName,
  resourceResolver?: ResourceResolver,
): RequestHandler {
  return (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;

      const resource = resourceResolver
        ? resourceResolver(req)
        : { type: "unknown" };

      auditService.emit({
        name,
        actor: {
          id: req.userId,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        },
        resource,
        action: "read",
        outcome: "success",
      });
    });

    next();
  };
}

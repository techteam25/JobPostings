import { registry } from "@/swagger/registry";

registry.registerComponent("securitySchemes", "SessionCookie", {
  type: "apiKey",
  in: "cookie", // ← this is the key
  name: "better-auth.session_token",
  description:
    "Session cookie set after login (e.g., better-auth.session_token=abc123)",
});

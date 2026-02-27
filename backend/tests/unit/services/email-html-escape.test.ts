import { describe, it, expect, vi, beforeEach } from "vitest";
import nodemailer from "nodemailer";

/**
 * Tests that user-supplied values in email templates are HTML-escaped
 * to prevent injection attacks.
 *
 * We unmock EmailService for this file so we can call real methods,
 * then mock the transporter and template loading to capture the HTML output.
 */
vi.unmock("@/infrastructure/email.service");

// Mock nodemailer so no real transport is created
const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test" });
vi.spyOn(nodemailer, "createTransport").mockReturnValue({
  sendMail: sendMailMock,
} as any);

import { EmailService } from "@/infrastructure/email.service";
import { UserRepository } from "@/repositories/user.repository";

describe("EmailService HTML escaping", () => {
  let service: EmailService;

  beforeEach(() => {
    sendMailMock.mockClear();
    service = new EmailService();

    // Stub template loading — return a minimal template with the placeholders
    vi.spyOn(service as any, "loadTemplate").mockResolvedValue(
      "<html><body><p>{{name}}</p><p>{{jobTitle}}</p></body></html>",
    );
    vi.spyOn(service as any, "getImageAsBase64").mockResolvedValue(
      "data:image/png;base64,fake",
    );
    vi.spyOn(service as any, "canSendEmail").mockResolvedValue(true);
    vi.spyOn(service as any, "generateEmailFooter").mockResolvedValue("");
  });

  it("should escape HTML in user-supplied name and jobTitle (sendJobApplicationConfirmation)", async () => {
    const maliciousName = '<script>alert("xss")</script>';
    const maliciousTitle = '<img onerror="hack()" src=x>';

    vi.spyOn(UserRepository.prototype, "canSendEmailType").mockResolvedValue(true);

    await service.sendJobApplicationConfirmation(
      1,
      "user@test.com",
      maliciousName,
      maliciousTitle,
    );

    expect(sendMailMock).toHaveBeenCalledOnce();
    const html = sendMailMock.mock.calls[0]![0].html as string;

    // Raw HTML tags must NOT appear in the output
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");

    // Escaped versions must appear
    expect(html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img onerror=&quot;hack()&quot; src=x&gt;");
  });

  it("should escape HTML in inline templates (sendAccountDeactivationConfirmation)", async () => {
    const maliciousName = '<b onmouseover="steal()">Bob</b>';

    await service.sendAccountDeactivationConfirmation(
      1,
      "user@test.com",
      maliciousName,
    );

    expect(sendMailMock).toHaveBeenCalledOnce();
    const html = sendMailMock.mock.calls[0]![0].html as string;

    expect(html).not.toContain("<b onmouseover");
    expect(html).toContain("&lt;b onmouseover=&quot;steal()&quot;&gt;Bob&lt;/b&gt;");
  });
});

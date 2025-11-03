import sanitize from "sanitize-html";

export class SecurityUtils {
  static sanitizeInput(input: string): string {
    return sanitize(input);
  }
}

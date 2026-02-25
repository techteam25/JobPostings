import sanitize from "sanitize-html";

export class SecurityUtils {
  static sanitizeInput(input: string): string {
    return sanitize(input);
  }

  /**
   * Escapes LIKE pattern characters (%, _) in a search term
   * to prevent unintended wildcard matching.
   */
  static escapeLikePattern(input: string): string {
    return input.replace(/[%_\\]/g, "\\$&");
  }
}

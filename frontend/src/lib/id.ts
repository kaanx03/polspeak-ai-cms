/**
 * Generates a unique id for lesson modules and their items.
 *
 * `crypto.randomUUID()` is only available in secure contexts (HTTPS or localhost), so a
 * time + random fallback keeps the editor working on plain-HTTP test hosts.
 */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

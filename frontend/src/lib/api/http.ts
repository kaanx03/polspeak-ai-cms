/**
 * Minimal HTTP client for the PolSpeak API gateway.
 *
 * Every request goes to the same origin under `/api/v1`. In production the API gateway
 * serves both the frontend and the API; in development `next.config.ts` rewrites
 * `/api/*` to the gateway (API_GATEWAY_URL). Authentication uses an httpOnly cookie set
 * by the user-service, so no token is ever handled in JavaScript.
 */

export const API_BASE = "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  /** Plain objects are sent as JSON; FormData, Blob and strings are sent as-is. */
  body?: unknown;
  /** Redirect to /login when the session is missing or expired (default: true). */
  redirectOnUnauthorized?: boolean;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const UNREACHABLE_MESSAGE =
  "The PolSpeak service is not reachable right now. Please try again later.";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookie = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

/** Maps an HTTP status (and an optional RFC 9457 problem detail) to a user-facing message. */
export function friendlyMessage(status: number, detail?: string): string {
  switch (status) {
    case 0:
    case 502:
    case 503:
    case 504:
      return UNREACHABLE_MESSAGE;
    case 400:
    case 422:
      return detail || "Some of the information you entered is not valid.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to do this.";
    case 404:
      return "The requested item could not be found.";
    case 409:
      return detail || "This item was changed elsewhere. Reload the page and try again.";
    case 413:
      return "The file is too large.";
    case 415:
      return "This file type is not supported.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    default:
      return detail || "Something went wrong. Please try again.";
  }
}

/** Returns a user-facing message for any error thrown by the API layer. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, redirectOnUnauthorized = true, headers, method = "GET", ...rest } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
      requestBody = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  if (!SAFE_METHODS.has(method.toUpperCase())) {
    const xsrfToken = readCookie("XSRF-TOKEN");
    if (xsrfToken) requestHeaders.set("X-XSRF-TOKEN", xsrfToken);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      method,
      headers: requestHeaders,
      body: requestBody,
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, UNREACHABLE_MESSAGE);
  }

  if (
    response.status === 401 &&
    redirectOnUnauthorized &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.href = "/login";
  }

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail;
    } catch {
      // The body is not a problem document (e.g. the gateway is down); keep the generic message.
    }
    throw new ApiError(response.status, friendlyMessage(response.status, detail), detail);
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) return undefined as T;
  return (await response.json()) as T;
}

/** Runs a read request and falls back to a default value (and logs) when it fails. */
export async function withFallback<T>(request: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await request;
  } catch (error) {
    console.error(`${label}:`, error);
    return fallback;
  }
}

/** Encodes a query string from defined values only. */
export function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

import { apiFetch } from "./http";

export type UserRole = "TEACHER" | "STUDENT" | "ADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

/**
 * Development-only switch that lets the UI run without the backend.
 * NEXT_PUBLIC_DEV_AUTH_BYPASS=true signs in a fake user whose role comes from
 * NEXT_PUBLIC_DEV_AUTH_ROLE ("teacher" by default, or "student").
 */
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
const DEV_AUTH_ROLE: UserRole =
  process.env.NEXT_PUBLIC_DEV_AUTH_ROLE?.toLowerCase() === "student" ? "STUDENT" : "TEACHER";

const DEV_USER: CurrentUser = {
  id: "dev-user",
  email: "dev@polspeak.local",
  displayName: DEV_AUTH_ROLE === "STUDENT" ? "Dev Student" : "Dev Teacher",
  role: DEV_AUTH_ROLE,
};

let currentUserRequest: Promise<CurrentUser | null> | null = null;

export function isDevAuthBypass(): boolean {
  return DEV_AUTH_BYPASS;
}

export function isStudent(user: CurrentUser | null): boolean {
  return user?.role === "STUDENT";
}

/** Returns the signed-in user, or null when there is no valid session. Cached per page load. */
export function getCurrentUser(forceRefresh = false): Promise<CurrentUser | null> {
  if (DEV_AUTH_BYPASS) return Promise.resolve(DEV_USER);
  if (!currentUserRequest || forceRefresh) {
    currentUserRequest = apiFetch<CurrentUser>("/auth/me", { redirectOnUnauthorized: false }).catch(
      () => null,
    );
  }
  return currentUserRequest;
}

export async function login(email: string, password: string): Promise<CurrentUser> {
  const user = await apiFetch<CurrentUser>("/auth/login", {
    method: "POST",
    body: { email, password },
    redirectOnUnauthorized: false,
  });
  currentUserRequest = Promise.resolve(user);
  return user;
}

export async function logout(): Promise<void> {
  try {
    if (!DEV_AUTH_BYPASS) {
      await apiFetch<void>("/auth/logout", { method: "POST", redirectOnUnauthorized: false });
    }
  } finally {
    currentUserRequest = null;
  }
}

/** Invalidates every session of the current user (all devices). */
export async function logoutEverywhere(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout-all", { method: "POST" });
  } finally {
    currentUserRequest = null;
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch<void>("/auth/password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });
}

export async function updateProfile(updates: { displayName: string }): Promise<CurrentUser> {
  const user = await apiFetch<CurrentUser>("/users/me", { method: "PATCH", body: updates });
  currentUserRequest = Promise.resolve(user);
  return user;
}

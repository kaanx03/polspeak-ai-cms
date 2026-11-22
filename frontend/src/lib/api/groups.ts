import { apiFetch, withFallback } from "./http";
import type { RecurringSchedule } from "./students";

export interface Group {
  id: string;
  name: string;
  level: string;
  color: string;
  description?: string;
  recurring_schedule?: RecurringSchedule;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export function fetchGroups(): Promise<Group[]> {
  return withFallback(apiFetch<Group[]>("/groups"), [], "Error fetching groups");
}

export function fetchGroupById(id: string): Promise<Group | null> {
  return withFallback(apiFetch<Group>(`/groups/${id}`), null, "Error fetching group");
}

export function createGroup(group: Omit<Group, "id" | "created_at" | "updated_at">): Promise<Group> {
  return apiFetch<Group>("/groups", { method: "POST", body: group });
}

export function updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
  return apiFetch<Group>(`/groups/${id}`, { method: "PATCH", body: updates });
}

/** Deletes a group; its members stay as individual students. */
export async function deleteGroup(id: string): Promise<boolean> {
  await apiFetch<void>(`/groups/${id}`, { method: "DELETE" });
  return true;
}

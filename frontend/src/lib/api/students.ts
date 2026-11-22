import { apiFetch, withFallback } from "./http";

export interface RecurringSchedule {
  day: number;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface Student {
  id: string;
  name: string;
  initials: string;
  color: string;
  level: string;
  status: "active" | "paused";
  group_id?: string;
  email?: string;
  phone?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  notes?: string;
  recurring_schedule?: RecurringSchedule;
  topics_covered: string[];
  custom_topics: string[];
  /** Login account of the student (owned by the user-service). */
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export type NewStudent = Omit<Student, "id" | "created_at" | "updated_at">;

export function fetchStudents(): Promise<Student[]> {
  return withFallback(apiFetch<Student[]>("/students"), [], "Error fetching students");
}

export function fetchStudentById(id: string): Promise<Student | null> {
  return withFallback(apiFetch<Student>(`/students/${id}`), null, "Error fetching student");
}

/** Resolves the learner profile linked to a login account (used by the student portal). */
export function fetchStudentByUserId(userId: string): Promise<Student | null> {
  return withFallback(
    apiFetch<Student>(`/students/by-user/${userId}`),
    null,
    "Error fetching student by user",
  );
}

export function createStudent(student: NewStudent): Promise<Student> {
  return apiFetch<Student>("/students", { method: "POST", body: student });
}

export function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  return apiFetch<Student>(`/students/${id}`, { method: "PATCH", body: updates });
}

/** Removes a student from their group (sends an explicit null for the group). */
export function removeStudentFromGroup(id: string): Promise<Student> {
  return apiFetch<Student>(`/students/${id}`, { method: "PATCH", body: { group_id: null } });
}

/**
 * Deletes the learner profile. The backend removes the login account, homework,
 * lesson assignments and uploaded files in the same operation.
 */
export async function deleteStudent(id: string): Promise<boolean> {
  await apiFetch<void>(`/students/${id}`, { method: "DELETE" });
  return true;
}

/** Creates the login account of a student (email + initial password chosen by the teacher). */
export function createStudentAccount(
  studentId: string,
  credentials: { email: string; password: string },
): Promise<{ userId: string; email: string }> {
  return apiFetch(`/students/${studentId}/account`, { method: "POST", body: credentials });
}

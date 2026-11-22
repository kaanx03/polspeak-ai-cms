import { apiFetch, withFallback } from "./http";

/** A scheduled (calendar) lesson. Not to be confused with lesson content (see lessons.ts). */
export interface Lesson {
  id: string;
  student_id?: string;
  group_id?: string;
  student_name?: string;
  group_name?: string;
  group_color?: string;
  title: string;
  notes?: string;
  day: number;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  type: "regular" | "trial" | "makeup";
  completed: boolean;
  is_recurring: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LessonHistory {
  id: string;
  student_id?: string;
  group_id?: string;
  lesson_id?: string;
  date: string;
  topic: string;
  time?: string;
  duration: number;
  notes?: string;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Scheduled lessons
// ---------------------------------------------------------------------------

export function fetchLessons(): Promise<Lesson[]> {
  return withFallback(apiFetch<Lesson[]>("/schedule/lessons"), [], "Error fetching lessons");
}

export function fetchLessonById(id: string): Promise<Lesson | null> {
  return withFallback(apiFetch<Lesson>(`/schedule/lessons/${id}`), null, "Error fetching lesson");
}

export function createLesson(lesson: Omit<Lesson, "id" | "created_at" | "updated_at">): Promise<Lesson> {
  return apiFetch<Lesson>("/schedule/lessons", { method: "POST", body: lesson });
}

export function updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson> {
  return apiFetch<Lesson>(`/schedule/lessons/${id}`, { method: "PATCH", body: updates });
}

/** Deletes a scheduled lesson together with its lesson-history entries. */
export async function deleteLesson(id: string): Promise<boolean> {
  await apiFetch<void>(`/schedule/lessons/${id}`, { method: "DELETE" });
  return true;
}

// ---------------------------------------------------------------------------
// Lesson history (completed lessons)
// ---------------------------------------------------------------------------

export function fetchAllLessonHistory(): Promise<LessonHistory[]> {
  return withFallback(apiFetch<LessonHistory[]>("/lesson-history"), [], "Error fetching lesson history");
}

export function fetchStudentLessonHistory(studentId: string): Promise<LessonHistory[]> {
  return withFallback(
    apiFetch<LessonHistory[]>(`/lesson-history?studentId=${encodeURIComponent(studentId)}`),
    [],
    "Error fetching student lesson history",
  );
}

export function fetchGroupLessonHistory(groupId: string): Promise<LessonHistory[]> {
  return withFallback(
    apiFetch<LessonHistory[]>(`/lesson-history?groupId=${encodeURIComponent(groupId)}`),
    [],
    "Error fetching group lesson history",
  );
}

export function createLessonHistory(history: Omit<LessonHistory, "id" | "created_at">): Promise<LessonHistory> {
  return apiFetch<LessonHistory>("/lesson-history", { method: "POST", body: history });
}

export async function deleteLessonHistoryByLessonId(lessonId: string): Promise<boolean> {
  await apiFetch<void>(`/lesson-history?lessonId=${encodeURIComponent(lessonId)}`, { method: "DELETE" });
  return true;
}

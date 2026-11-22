import { apiFetch, withFallback } from "./http";

/** A lesson made available to a student ("shared lesson"). */
export interface SharedLesson {
  id: string;
  lesson_content_id: string;
  student_id: string;
  shared_at?: string;
}

export function fetchSharedLessonsForStudent(studentId: string): Promise<SharedLesson[]> {
  return withFallback(
    apiFetch<SharedLesson[]>(`/assignments?studentId=${encodeURIComponent(studentId)}`),
    [],
    "Error fetching shared lessons",
  );
}

export function fetchStudentsForSharedLesson(lessonContentId: string): Promise<SharedLesson[]> {
  return withFallback(
    apiFetch<SharedLesson[]>(`/assignments?lessonId=${encodeURIComponent(lessonContentId)}`),
    [],
    "Error fetching lesson assignments",
  );
}

/** Shares a lesson with a student (idempotent). */
export function shareLesson(lessonContentId: string, studentId: string): Promise<SharedLesson> {
  return apiFetch<SharedLesson>("/assignments", {
    method: "PUT",
    body: { lesson_content_id: lessonContentId, student_id: studentId },
  });
}

export async function unshareLesson(lessonContentId: string, studentId: string): Promise<boolean> {
  await apiFetch<void>(
    `/assignments?lessonId=${encodeURIComponent(lessonContentId)}&studentId=${encodeURIComponent(studentId)}`,
    { method: "DELETE" },
  );
  return true;
}

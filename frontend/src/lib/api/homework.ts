import { apiFetch, withFallback } from "./http";

export interface HomeworkFile {
  url: string;
  name: string;
  type: string;
  storagePath?: string;
}

export interface HomeworkLink {
  url: string;
  label: string;
}

export interface StudentHomework {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  type: "file" | "lesson";
  teacher_files?: HomeworkFile[];
  teacher_links?: HomeworkLink[];
  student_files?: HomeworkFile[];
  student_note?: string | null;
  status?: "pending" | "submitted" | "graded";
  grade?: string;
  submitted_at?: string | null;
  lesson_content_id?: string;
  due_date?: string;
  created_at?: string;
}

export function fetchStudentHomework(studentId: string): Promise<StudentHomework[]> {
  return withFallback(
    apiFetch<StudentHomework[]>(`/homework?studentId=${encodeURIComponent(studentId)}`),
    [],
    "Error fetching student homework",
  );
}

export function fetchAllStudentHomework(): Promise<StudentHomework[]> {
  return withFallback(apiFetch<StudentHomework[]>("/homework"), [], "Error fetching homework");
}

export function fetchHomeworkById(id: string): Promise<StudentHomework | null> {
  return withFallback(apiFetch<StudentHomework>(`/homework/${id}`), null, "Error fetching homework");
}

export function createStudentHomework(hw: Omit<StudentHomework, "id" | "created_at">): Promise<StudentHomework> {
  return apiFetch<StudentHomework>("/homework", { method: "POST", body: hw });
}

export function updateStudentHomework(
  id: string,
  updates: Partial<Omit<StudentHomework, "id" | "created_at">>,
): Promise<StudentHomework> {
  return apiFetch<StudentHomework>(`/homework/${id}`, { method: "PATCH", body: updates });
}

/** Student submits the homework (only the owning student is allowed by the backend). */
export function submitHomework(id: string, files: HomeworkFile[], note?: string): Promise<StudentHomework> {
  return apiFetch<StudentHomework>(`/homework/${id}/submission`, {
    method: "POST",
    body: { files, note: note || null },
  });
}

/** Student withdraws a submission that has not been graded yet. */
export function retractHomework(id: string): Promise<StudentHomework> {
  return apiFetch<StudentHomework>(`/homework/${id}/submission`, { method: "DELETE" });
}

export function gradeHomework(id: string, grade: string): Promise<StudentHomework> {
  return apiFetch<StudentHomework>(`/homework/${id}/grade`, { method: "PUT", body: { grade } });
}

/** Deletes the homework together with its uploaded files. */
export async function deleteStudentHomework(id: string): Promise<boolean> {
  await apiFetch<void>(`/homework/${id}`, { method: "DELETE" });
  return true;
}

import { apiFetch, withFallback } from "./http";

export type CefrLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export const CEFR_LEVELS: CefrLevel[] = ["a1", "a2", "b1", "b2", "c1", "c2"];

// ---------------------------------------------------------------------------
// Curriculum topics
// ---------------------------------------------------------------------------

export interface CurriculumTopic {
  id: string;
  level: CefrLevel;
  category: string;
  title: string;
  description: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export function fetchCurriculumTopics(): Promise<CurriculumTopic[]> {
  return withFallback(
    apiFetch<CurriculumTopic[]>("/curriculum/topics"),
    [],
    "Error fetching curriculum topics",
  );
}

export function fetchCurriculumTopicById(id: string): Promise<CurriculumTopic | null> {
  return withFallback(
    apiFetch<CurriculumTopic>(`/curriculum/topics/${id}`),
    null,
    "Error fetching curriculum topic",
  );
}

export function createCurriculumTopic(
  topic: Omit<CurriculumTopic, "id" | "created_at" | "updated_at">,
): Promise<CurriculumTopic> {
  return apiFetch<CurriculumTopic>("/curriculum/topics", { method: "POST", body: topic });
}

export function updateCurriculumTopic(id: string, updates: Partial<CurriculumTopic>): Promise<CurriculumTopic> {
  return apiFetch<CurriculumTopic>(`/curriculum/topics/${id}`, { method: "PATCH", body: updates });
}

export async function deleteCurriculumTopic(id: string): Promise<boolean> {
  await apiFetch<void>(`/curriculum/topics/${id}`, { method: "DELETE" });
  return true;
}

// ---------------------------------------------------------------------------
// Lesson content (the CMS documents)
// ---------------------------------------------------------------------------

export interface LessonContent {
  id: string;
  level: CefrLevel;
  title: string;
  status: "draft" | "published";
  curriculum_topic_id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module shapes are typed in the editor
  modules: any[];
  order?: number;
  last_modified?: string;
  created_at?: string;
  updated_at?: string;
}

export function fetchLessonContent(): Promise<LessonContent[]> {
  return withFallback(apiFetch<LessonContent[]>("/lessons"), [], "Error fetching lessons");
}

export function fetchLessonContentByLevel(level: string): Promise<LessonContent[]> {
  return withFallback(
    apiFetch<LessonContent[]>(`/lessons?level=${encodeURIComponent(level.toLowerCase())}`),
    [],
    "Error fetching lessons by level",
  );
}

export function fetchLessonContentById(id: string): Promise<LessonContent | null> {
  return withFallback(apiFetch<LessonContent>(`/lessons/${id}`), null, "Error fetching lesson");
}

export function createLessonContent(
  lesson: Omit<LessonContent, "id" | "created_at" | "updated_at" | "last_modified">,
): Promise<LessonContent> {
  return apiFetch<LessonContent>("/lessons", { method: "POST", body: lesson });
}

export function updateLessonContent(id: string, updates: Partial<LessonContent>): Promise<LessonContent> {
  return apiFetch<LessonContent>(`/lessons/${id}`, { method: "PATCH", body: updates });
}

/** Saves the order of lessons in one request (one transaction on the server). */
export async function updateLessonsOrder(lessons: { id: string; order: number }[]): Promise<boolean> {
  await apiFetch<void>("/lessons/order", { method: "PUT", body: lessons });
  return true;
}

/**
 * Deletes a lesson. Uploaded media that only this lesson references is cleaned up by the
 * backend; files that also live in the media library are kept.
 */
export async function deleteLessonContent(id: string): Promise<boolean> {
  await apiFetch<void>(`/lessons/${id}`, { method: "DELETE" });
  return true;
}

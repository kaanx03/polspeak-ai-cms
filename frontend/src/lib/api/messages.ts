import { apiFetch, withFallback } from "./http";

/** One teacher–student conversation per student. The sender is derived from the session. */
export interface Message {
  id: string;
  student_id: string;
  sender: "student" | "teacher";
  text?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface MessagePayload {
  text?: string;
  image_url?: string;
  audio_url?: string;
}

export function fetchMessages(studentId: string): Promise<Message[]> {
  return withFallback(
    apiFetch<Message[]>(`/messages?studentId=${encodeURIComponent(studentId)}`),
    [],
    "Error fetching messages",
  );
}

/** Latest message of every conversation (teacher inbox previews). */
export function fetchLatestMessages(): Promise<Message[]> {
  return withFallback(apiFetch<Message[]>("/messages/latest"), [], "Error fetching latest messages");
}

/**
 * Sends a message in the conversation of `studentId`.
 * `sender` is kept for the UI's optimistic rendering; the backend takes it from the session.
 */
export async function sendMessage(
  studentId: string,
  sender: "student" | "teacher",
  payload: MessagePayload,
): Promise<Message | null> {
  return withFallback(
    apiFetch<Message>("/messages", { method: "POST", body: { student_id: studentId, sender, ...payload } }),
    null,
    "Error sending message",
  );
}

/** Marks the other party's messages in a conversation as read. */
export async function markMessagesRead(studentId: string, readerRole: "student" | "teacher"): Promise<void> {
  await withFallback(
    apiFetch<void>("/messages/read", { method: "POST", body: { student_id: studentId, reader: readerRole } }),
    undefined,
    "Error marking messages as read",
  );
}

/** Unread message counts per student (teacher view). */
export function fetchUnreadMessageCounts(): Promise<Record<string, number>> {
  return withFallback(
    apiFetch<Record<string, number>>("/messages/unread-counts"),
    {},
    "Error fetching unread counts",
  );
}

/** Total unread messages from students (teacher navigation badge). */
export async function fetchTeacherUnreadTotal(): Promise<number> {
  const counts = await fetchUnreadMessageCounts();
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

/** Unread messages from the teacher in one student's conversation (student view). */
export async function fetchStudentUnreadCount(studentId: string): Promise<number> {
  const result = await withFallback(
    apiFetch<{ count: number }>(`/messages/unread-count?studentId=${encodeURIComponent(studentId)}`),
    { count: 0 },
    "Error fetching unread count",
  );
  return result.count;
}

export async function deleteMessage(id: string): Promise<boolean> {
  try {
    await apiFetch<void>(`/messages/${id}`, { method: "DELETE" });
    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    return false;
  }
}

/** Deletes a whole conversation, including its attachments. */
export async function clearConversation(studentId: string): Promise<void> {
  await apiFetch<void>(`/messages?studentId=${encodeURIComponent(studentId)}`, { method: "DELETE" });
}

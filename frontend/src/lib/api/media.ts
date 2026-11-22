import { API_BASE, apiFetch, withFallback } from "./http";

export interface UploadedFile {
  url: string;
  name: string;
  storagePath: string;
}

export interface LibraryFile {
  id: string;
  name: string;
  type: "pdf" | "image" | "audio" | "video" | "document";
  category: string;
  size: number;
  url: string;
  storage_path?: string;
  is_pinned: boolean;
  folder_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

/** Public path under which the media-service serves stored files. */
const FILES_PATH = `${API_BASE}/media/files/`;

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

/** Uploads a file to the media-service. `folder` groups files (e.g. "lessons/a1/<id>"). */
export function uploadFile(file: File, folder = "uploads"): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  return apiFetch<UploadedFile>("/media/uploads", { method: "POST", body: form });
}

export async function deleteFile(storagePath: string): Promise<boolean> {
  await apiFetch<void>(`/media/uploads?key=${encodeURIComponent(storagePath)}`, { method: "DELETE" });
  return true;
}

/** Returns the storage key of a media-service URL, or null for external URLs. */
export function getFilePathFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url, typeof window === "undefined" ? "http://localhost" : window.location.origin);
    if (!pathname.startsWith(FILES_PATH)) return null;
    return decodeURIComponent(pathname.slice(FILES_PATH.length)) || null;
  } catch {
    return null;
  }
}

/** URL that downloads a stored file as an attachment with the given file name. */
export function getDownloadUrl(url: string, fileName: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}download=true&filename=${encodeURIComponent(fileName)}`;
}

// ---------------------------------------------------------------------------
// Library folders
// ---------------------------------------------------------------------------

export function fetchLibraryFolders(): Promise<LibraryFolder[]> {
  return withFallback(apiFetch<LibraryFolder[]>("/media/folders"), [], "Error fetching library folders");
}

export function createLibraryFolder(folder: { name: string; color: string }): Promise<LibraryFolder> {
  return apiFetch<LibraryFolder>("/media/folders", { method: "POST", body: folder });
}

export function updateLibraryFolder(id: string, updates: Partial<LibraryFolder>): Promise<LibraryFolder> {
  return apiFetch<LibraryFolder>(`/media/folders/${id}`, { method: "PATCH", body: updates });
}

/** Deletes a folder; the files in it move back to the library root. */
export async function deleteLibraryFolder(id: string): Promise<boolean> {
  await apiFetch<void>(`/media/folders/${id}`, { method: "DELETE" });
  return true;
}

// ---------------------------------------------------------------------------
// Library files
// ---------------------------------------------------------------------------

export function fetchLibraryFiles(): Promise<LibraryFile[]> {
  return withFallback(apiFetch<LibraryFile[]>("/media/library"), [], "Error fetching library files");
}

export function createLibraryFile(
  file: Omit<LibraryFile, "id" | "created_at" | "updated_at">,
): Promise<LibraryFile> {
  return apiFetch<LibraryFile>("/media/library", { method: "POST", body: file });
}

export function updateLibraryFile(id: string, updates: Partial<LibraryFile>): Promise<LibraryFile> {
  return apiFetch<LibraryFile>(`/media/library/${id}`, { method: "PATCH", body: updates });
}

export async function moveFileToFolder(fileId: string, folderId: string | null): Promise<void> {
  await updateLibraryFile(fileId, { folder_id: folderId });
}

export function toggleLibraryFilePin(id: string, isPinned: boolean): Promise<LibraryFile> {
  return updateLibraryFile(id, { is_pinned: isPinned });
}

/** Deletes a library entry and its stored file. */
export async function deleteLibraryFile(id: string): Promise<boolean> {
  await apiFetch<void>(`/media/library/${id}`, { method: "DELETE" });
  return true;
}

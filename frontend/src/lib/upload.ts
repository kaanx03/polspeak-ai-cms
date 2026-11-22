import { formatFileSize } from "./format";

/** Upload size limit checked in the browser; the media-service enforces the same limit. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export interface PreparedUpload {
  processedFile: File;
  valid: boolean;
  message?: string;
}

/** Validates a file before it is uploaded. The file itself is not modified. */
export async function processFileForUpload(file: File): Promise<PreparedUpload> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      processedFile: file,
      valid: false,
      message: `The file is too large (maximum ${formatFileSize(MAX_UPLOAD_BYTES)}).`,
    };
  }
  return { processedFile: file, valid: true };
}

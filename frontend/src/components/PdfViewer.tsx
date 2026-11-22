"use client";

interface PdfViewerProps {
  url: string;
  className?: string;
  title?: string;
}

/**
 * Renders a PDF with the browser's built-in viewer. Files are served by the media-service
 * on the same origin, so no third-party viewer is needed (and no file URL leaves the app).
 */
export default function PdfViewer({ url, className = "", title = "PDF document" }: PdfViewerProps) {
  return (
    <div className={`relative ${className}`}>
      <iframe
        src={url}
        className="w-full h-full rounded-lg border-0 bg-slate-100"
        style={{ minHeight: "400px" }}
        title={title}
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow hover:bg-white"
      >
        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        Open PDF
      </a>
    </div>
  );
}

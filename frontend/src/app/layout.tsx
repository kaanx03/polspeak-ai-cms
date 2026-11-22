import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "PolSpeak - Lesson Content Studio",
  description:
    "PolSpeak is a content management system for English teachers: create interactive CEFR-levelled lessons, manage learners, homework and schedules.",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#00132c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-bg-main text-text-main antialiased">
        <AuthGuard>
          <ToastProvider>
            <LibraryProvider>{children}</LibraryProvider>
          </ToastProvider>
        </AuthGuard>
        {/* Load the Material Symbols icon font after page load to avoid render blocking */}
        <Script
          id="google-fonts"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              const link = document.createElement('link');
              link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
              link.rel = 'stylesheet';
              document.head.appendChild(link);
            `,
          }}
        />
      </body>
    </html>
  );
}

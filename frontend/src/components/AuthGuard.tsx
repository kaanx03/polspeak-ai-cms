"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser, isStudent } from "@/lib/api";

interface AuthGuardProps {
  children: React.ReactNode;
}

/** Pages that do not require a session. */
const PUBLIC_PATHS = ["/", "/login"];

const isPublicPath = (path: string) => PUBLIC_PATHS.includes(path);

/** Lesson presentation is available to teachers and students. */
const isPresentPath = (path: string) => path.endsWith("/present");

/** The student portal (/student and /student/*). */
const isStudentPath = (path: string) => path === "/student" || path.startsWith("/student/");

const homeFor = (student: boolean) => (student ? "/student" : "/dashboard");

/**
 * Client-side routing guard. It only decides which pages to show; real authorization
 * is enforced by the API gateway and the backend services.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorizedPath, setAuthorizedPath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser().then((user) => {
      if (cancelled) return;

      if (isPublicPath(pathname)) {
        if (user) router.replace(homeFor(isStudent(user)));
        else setAuthorizedPath(pathname);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const student = isStudent(user);
      if (student && !isStudentPath(pathname) && !isPresentPath(pathname)) {
        router.replace("/student");
        return;
      }
      if (!student && isStudentPath(pathname)) {
        router.replace("/dashboard");
        return;
      }

      setAuthorizedPath(pathname);
    });

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (authorizedPath !== pathname) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-600 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

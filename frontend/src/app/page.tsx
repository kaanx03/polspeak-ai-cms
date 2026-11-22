import { redirect } from "next/navigation";

/** The root URL has no content of its own; the login page redirects signed-in users home. */
export default function RootPage() {
  redirect("/login");
}

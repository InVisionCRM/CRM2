import { redirect } from "next/navigation"

// The "My Day" dashboard now lives at /dashboard. This route is kept as a
// redirect so any existing bookmarks or links to /dashboard/today still work.
export default function TodayRedirect() {
  redirect("/dashboard")
}

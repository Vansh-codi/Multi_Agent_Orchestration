import { redirect } from "next/navigation";

// Redirect root to login — never shows dashboard directly
export default function Home() {
  redirect("/login");
}

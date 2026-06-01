import { redirect } from "next/navigation";

/** www.pdftrusted.com/ and pdftrusted.com/ → home (English). */
export default function RootPage() {
  redirect("/en");
}

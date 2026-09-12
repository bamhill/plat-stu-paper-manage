import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const teacher = await getCurrentTeacher();
  redirect(teacher ? "/dashboard" : "/login");
}

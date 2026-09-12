import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findActiveTeacherBySession } from "@/lib/auth-store";
import { createSessionToken, SESSION_COOKIE, SESSION_DAYS, verifySessionToken } from "@/lib/auth-core";

export async function getCurrentTeacher() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  return findActiveTeacherBySession(payload.tid, payload.email);
}

export async function requireTeacher() {
  const teacher = await getCurrentTeacher();
  if (!teacher) redirect("/login");
  return teacher;
}

export function setTeacherSession(teacher: { id: number; email: string }) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = createSessionToken({ tid: teacher.id, email: teacher.email, exp });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp),
  });
}

export function clearTeacherSession() {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0) });
}

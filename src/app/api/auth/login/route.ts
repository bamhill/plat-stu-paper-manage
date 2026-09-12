import { NextRequest, NextResponse } from "next/server";
import { findTeacherByEmail } from "@/lib/auth-store";
import { verifyPassword, createSessionToken, SESSION_COOKIE, SESSION_DAYS, requestUsesHttps } from "@/lib/auth-core";

function redirectWithError(req: NextRequest, message: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const teacher = findTeacherByEmail(email);
  if (!teacher || teacher.status !== "active" || !verifyPassword(password, teacher.passwordHash)) {
    return redirectWithError(req, "邮箱或密码不正确");
  }
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = createSessionToken({ tid: teacher.id, email: teacher.email, exp });
  const res = NextResponse.redirect(new URL("/dashboard", req.url), 303);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: requestUsesHttps(req),
    path: "/", expires: new Date(exp),
  });
  return res;
}

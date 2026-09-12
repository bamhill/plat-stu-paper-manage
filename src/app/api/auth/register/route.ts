import { NextRequest, NextResponse } from "next/server";
import { registerTeacher } from "@/lib/auth-store";
import { hashPassword, createSessionToken, SESSION_COOKIE, SESSION_DAYS, requestUsesHttps } from "@/lib/auth-core";
import { DEFAULT_SETTINGS } from "@/lib/settings-default";

function redirectWithError(req: NextRequest, message: string) {
  const url = new URL("/register", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirmPassword") || "");
  const claimCode = String(form.get("claimCode") || "").trim();
  if (name.length < 2) return redirectWithError(req, "请输入教师姓名");
  if (!/^\S+@\S+\.\S+$/.test(email)) return redirectWithError(req, "请输入有效邮箱");
  if (password.length < 8) return redirectWithError(req, "密码至少 8 位");
  if (password !== confirm) return redirectWithError(req, "两次输入的密码不一致");

  const created = registerTeacher({
    name, email, passwordHash: hashPassword(password), claimCode,
    defaultSettingsJson: JSON.stringify(DEFAULT_SETTINGS),
  });
  if (!created.ok) {
    if (created.reason === "invalid_claim") return redirectWithError(req, "数据认领码不正确");
    return redirectWithError(req, "该邮箱已经注册");
  }

  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = createSessionToken({ tid: created.teacher.id, email: created.teacher.email, exp });
  const res = NextResponse.redirect(new URL("/dashboard", req.url), 303);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: requestUsesHttps(req),
    path: "/", expires: new Date(exp),
  });
  return res;
}

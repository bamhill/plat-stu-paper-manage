import { NextRequest, NextResponse } from "next/server";
import { requestUsesHttps, SESSION_COOKIE } from "@/lib/auth-core";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUsesHttps(req),
    path: "/",
    expires: new Date(0),
  });
  return res;
}

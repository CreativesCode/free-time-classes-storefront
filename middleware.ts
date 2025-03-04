import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const token = req.headers.get("cookie")?.split("token=")[1];

  if (!token && req.url.includes("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

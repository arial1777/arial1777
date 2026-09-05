import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { UNAUTHORIZED_HEADERS, isAuthorized } from "@/lib/basic-auth";

/**
 * /admin 以下はベーシック認証。
 *
 * Next.js 16 で middleware.ts は proxy.ts に改名された（機能は同じ）。
 *
 * Server Action の POST 先は、それを使っている画面の URL——ここでは
 * /admin/songs——なので、フォーム送信もこの matcher の内側に入る。
 */
export function proxy(request: NextRequest) {
  if (isAuthorized(request.headers.get("authorization"))) {
    return NextResponse.next();
  }

  return new NextResponse("認証が必要です。", {
    status: 401,
    headers: UNAUTHORIZED_HEADERS,
  });
}

export const config = {
  // "/admin/:path*" だけだと /admin 自身に当たらない環境があるため両方書く
  matcher: ["/admin", "/admin/:path*"],
};

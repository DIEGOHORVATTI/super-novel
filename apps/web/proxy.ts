import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeCode, REF_COOKIE, REF_COOKIE_MAX_AGE_S } from "@/lib/affiliate";
import { ANON_READS_COOKIE, COOKIE_PROBE_PARAM, anonReadsAfter } from "@/lib/reading-access";
import { routes } from "@/lib/routes";

const READS_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 365,
  httpOnly: true,
  sameSite: "lax",
  path: "/",
} as const;

/**
 * Edge proxy (Next 16 "proxy" convention | the renamed middleware). First-touch
 * affiliate attribution: when a visitor lands with `?ref=CODE` and has no `ref`
 * cookie yet, persist the code for 30 days (signup turns it into a referral).
 * First touch wins; we never overwrite an existing cookie.
 */
export function proxy(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Visitors get ANON_CHAPTER_LIMIT free chapters, then must log in. The first hit
  // sets the cookie and comes back: whoever returns without it (crawlers keep no
  // cookies) goes to login before any catalog scraping.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname.startsWith("/read/") && !getSessionCookie(request)) {
    const toLogin = () =>
      NextResponse.redirect(new URL(routes.loginThen(pathname, true), request.url));
    const stored = request.cookies.get(ANON_READS_COOKIE)?.value;

    if (stored === undefined) {
      if (searchParams.has(COOKIE_PROBE_PARAM)) return toLogin();
      const probe = request.nextUrl.clone();
      probe.searchParams.set(COOKIE_PROBE_PARAM, "1");
      const redirect = NextResponse.redirect(probe);
      redirect.cookies.set(ANON_READS_COOKIE, ",", READS_COOKIE_OPTIONS);
      return redirect;
    }

    const reads = anonReadsAfter(stored, pathname.slice("/read/".length));
    if (!reads) return toLogin();
    response.cookies.set(ANON_READS_COOKIE, reads.join(","), READS_COOKIE_OPTIONS);
  }

  // First-touch affiliate code | never overwrite an existing cookie.
  const ref = normalizeCode(request.nextUrl.searchParams.get("ref"));
  if (ref && !request.cookies.get(REF_COOKIE)) {
    response.cookies.set(REF_COOKIE, ref, {
      maxAge: REF_COOKIE_MAX_AGE_S,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  // Run on page navigations only | skip API routes, Next internals and assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};

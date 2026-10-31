import { getSessionCookie } from "better-auth/cookies";

import { ANON_READS_COOKIE } from "@/lib/reading-access";

/** Readers always carry one of these cookies; crawlers that drop cookies never do. */
export const hasReaderCookie = (req: Request) =>
  Boolean(getSessionCookie(req)) || (req.headers.get("cookie") ?? "").includes(ANON_READS_COOKIE);

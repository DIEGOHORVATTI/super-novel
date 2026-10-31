export const FREE_CHAPTER_LIMIT = 30;

export const ANON_CHAPTER_LIMIT = 5;
export const ANON_READS_COOKIE = "sn_anon_reads";
export const COOKIE_PROBE_PARAM = "ck";

/**
 * Chapters a visitor without an account has opened, kept in a cookie as a comma list.
 * Returns the updated list, or null when this chapter is past the limit.
 * ponytail: clearing cookies resets the count; a server counter needs a DB hit per read.
 */
export function anonReadsAfter(stored: string, chapterSlug: string) {
  const reads = stored.split(",").filter(Boolean);
  if (reads.includes(chapterSlug)) return reads;
  return reads.length < ANON_CHAPTER_LIMIT ? [...reads, chapterSlug] : null;
}

type ChapterAccess = {
  premium: boolean;
  alreadyRead: boolean;
  chaptersRead: number;
};

/** Free accounts keep every chapter they opened; the limit only blocks new ones. */
export const canOpenChapter = ({ premium, alreadyRead, chaptersRead }: ChapterAccess) =>
  premium || alreadyRead || chaptersRead < FREE_CHAPTER_LIMIT;

/** Same-origin paths only, so `?next=` can't send a fresh login to another site. */
export const safeNextPath = (next: string | null) =>
  next && /^\/(?![/\\])/.test(next) ? next : "/";

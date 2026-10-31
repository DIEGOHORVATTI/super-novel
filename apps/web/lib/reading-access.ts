export const FREE_CHAPTER_LIMIT = 30;

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

import "server-only";
import { and, count, eq } from "drizzle-orm";

import { dbEnabled, getDb, schema } from "@/lib/db";
import { effectivePlan, type Plan } from "@/lib/learning/entitlements";
import { canOpenChapter } from "@/lib/reading-access";
import { syncReadingAchievements } from "@/lib/reading-sync";

/**
 * Server-side gate for chapter text: records the read and returns false once a
 * free account is past the limit.
 * ponytail: check-then-insert, two parallel tabs can overshoot by one chapter.
 */
export async function claimChapter(userId: string, workId: string, chapterId: string) {
  if (!dbEnabled) return true;

  const db = getDb();
  const { readingEvents, user } = schema;
  const byUser = eq(readingEvents.userId, userId);

  const [account, [{ chaptersRead }], existing] = await Promise.all([
    db
      .select({ plan: user.plan, premiumUntil: user.premiumUntil })
      .from(user)
      .where(eq(user.id, userId))
      .then((rows) => rows[0]),
    db.select({ chaptersRead: count() }).from(readingEvents).where(byUser),
    db
      .select({ id: readingEvents.id })
      .from(readingEvents)
      .where(and(byUser, eq(readingEvents.chapterId, chapterId)))
      .limit(1),
  ]);

  const alreadyRead = existing.length > 0;
  const premium =
    effectivePlan(account?.plan as Plan, account?.premiumUntil, new Date()) === "premium";
  if (!canOpenChapter({ premium, alreadyRead, chaptersRead })) return false;
  if (alreadyRead) return true;

  const inserted = await db
    .insert(readingEvents)
    .values({ userId, workId, chapterId })
    .onConflictDoNothing()
    .returning({ id: readingEvents.id });
  if (inserted.length) await syncReadingAchievements(userId);
  return true;
}

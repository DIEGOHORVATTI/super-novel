import { describe, expect, test } from "bun:test";

import {
  ANON_CHAPTER_LIMIT,
  FREE_CHAPTER_LIMIT,
  anonReadsAfter,
  canOpenChapter,
  safeNextPath,
} from "../lib/reading-access";

const free = { premium: false, alreadyRead: false };

describe("canOpenChapter", () => {
  test("blocks a new chapter only at the limit", () => {
    expect(canOpenChapter({ ...free, chaptersRead: FREE_CHAPTER_LIMIT - 1 })).toBe(true);
    expect(canOpenChapter({ ...free, chaptersRead: FREE_CHAPTER_LIMIT })).toBe(false);
  });

  test("keeps opened chapters and lets premium through", () => {
    const chaptersRead = FREE_CHAPTER_LIMIT;
    expect(canOpenChapter({ ...free, alreadyRead: true, chaptersRead })).toBe(true);
    expect(canOpenChapter({ ...free, premium: true, chaptersRead })).toBe(true);
  });
});

describe("anonReadsAfter", () => {
  const full = Array.from({ length: ANON_CHAPTER_LIMIT }, (_, index) => `c${index}`).join(",");

  test("counts distinct chapters from the empty probe cookie", () => {
    expect(anonReadsAfter(",", "c0")).toEqual(["c0"]);
    expect(anonReadsAfter("c0", "c0")).toEqual(["c0"]);
  });

  test("blocks a new chapter at the limit but reopens old ones", () => {
    expect(anonReadsAfter(full, "new")).toBeNull();
    expect(anonReadsAfter(full, "c0")).toHaveLength(ANON_CHAPTER_LIMIT);
  });
});

describe("safeNextPath", () => {
  test("accepts only same-origin paths", () => {
    expect(safeNextPath("/read/x")).toBe("/read/x");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});

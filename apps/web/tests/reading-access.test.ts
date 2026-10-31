import { describe, expect, test } from "bun:test";

import { FREE_CHAPTER_LIMIT, canOpenChapter, safeNextPath } from "../lib/reading-access";

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

describe("safeNextPath", () => {
  test("accepts only same-origin paths", () => {
    expect(safeNextPath("/read/x")).toBe("/read/x");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});

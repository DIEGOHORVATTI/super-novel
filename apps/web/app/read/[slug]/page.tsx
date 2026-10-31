import type { Metadata } from "next";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";

import { Comments } from "@/components/Comments";
import { ChapterReaderLoader } from "@/components/reader/ChapterReaderLoader";
import { chapterLabel, getChapter, getChapters, getNovel } from "@/lib/catalog";
import { routes } from "@/lib/routes";

type ReadPageProps = {
  params: Promise<{ slug: string }>;
};

// Cached at the CDN; proxy.ts runs before the cache and enforces the free-chapter limit.
// Errors are thrown, not swallowed, so a Central Novel outage keeps the last good page.
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: ReadPageProps): Promise<Metadata> {
  const { slug } = await params;
  const chapter = await getChapter(slug);
  return { title: chapter?.title ?? "Leitor", robots: { index: false } };
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { slug } = await params;
  const chapter = await getChapter(slug);
  if (!chapter || chapter.paragraphs.length === 0) notFound();

  const novelSlug = chapter.novelSlug;
  // Paywall switched off, reading is free. To charge again, make this page dynamic
  // (drop revalidate/generateStaticParams above) and uncomment:
  // const user = await getCurrentUser();
  // if (!user) redirect(routes.loginThen(routes.read(slug)));
  // const allowed = await claimChapter(user.id, novelSlug ?? slug, slug);
  // if (!allowed) redirect(routes.learnPremium);

  const [novel, chapters] = novelSlug
    ? await Promise.all([getNovel(novelSlug), getChapters(novelSlug)])
    : [null, []];

  const novelInfo = {
    slug: novelSlug ?? "",
    title: novel?.title ?? chapter.title,
    cover: novel?.cover,
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1} alignItems="flex-start" sx={{ maxWidth: 900, width: "100%", mx: "auto" }}>
        {novelSlug && (
          <Button
            href={routes.novel(novelSlug)}
            color="inherit"
            size="small"
            startIcon={<ArrowBackRoundedIcon />}
          >
            {novelInfo.title}
          </Button>
        )}
        <Typography variant="h4" component="h1">
          {chapterLabel(chapter.title, novel?.title)}
        </Typography>
      </Stack>

      <ChapterReaderLoader
        key={chapter.slug}
        novel={novelInfo}
        chapter={{ slug: chapter.slug, title: chapter.title, paragraphs: chapter.paragraphs }}
        chapters={chapters}
      />

      <Comments targetType="chapter" targetId={slug} />
    </Stack>
  );
}

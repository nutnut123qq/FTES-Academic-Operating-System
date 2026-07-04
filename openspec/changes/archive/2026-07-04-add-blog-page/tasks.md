## 1. Mock content + shared config

- [x] 1.1 Add `src/components/layouts/blog/shared/category.ts` — `CATEGORY_FILTERS` (null + pillars) and `CATEGORY_COLOR` map (ported from StarCi)
- [x] 1.2 Add `src/components/layouts/blog/mock.ts` — typed `QueryBlogPostListItem[]` + `Record<slug, QueryBlogPostDetail>` for ~5 FTES-flavored posts, plus `fetchMockBlogPosts({category,limit,offset})` and `fetchMockBlogPost(slug)` (same async/return shape as `queryBlogPosts`/`queryBlogPost`; `// ponytail:` comment naming the swap path)

## 2. List UI

- [x] 2.1 Add `shared/PostRow` — text-first row (title, excerpt, pillar chip, date, reading time, premium chip)
- [x] 2.2 Add `BlogList/CategoryFilter`, `BlogList/FeaturedPost`, `BlogList/TopicsStrip`
- [x] 2.3 Add `BlogList/BlogListSkeleton` mirroring the list layout
- [x] 2.4 Add `BlogList/index.tsx` — `PageHeader` + topics + optional filter + featured + rows + load-more, gated by `AsyncContent`, SWR over `fetchMockBlogPosts` (skip masthead + start-here pin)

## 3. Article UI

- [x] 3.1 Add `BlogPost/ReadingProgress` (sticky scroll bar) and `BlogPost/RelatedPosts` (SWR `fetchMockBlogPosts({category, limit})`, excludes current slug, self-hides)
- [x] 3.2 Add `BlogPost/BlogPostSkeleton` mirroring the article layout
- [x] 3.3 Add `BlogPost/index.tsx` — back link, header chips, cover, `MarkdownContent` body, premium-lock card, end CTA (source + funnel), related strip, reading progress; SWR over `fetchMockBlogPost`

## 4. Routes

- [x] 4.1 Add `src/app/[locale]/blog/page.tsx` (thin client mount of `BlogList`)
- [x] 4.2 Add `src/app/[locale]/blog/[slug]/page.tsx` (async server component: `generateMetadata` + JSON-LD article schema via `seo/jsonLd`, mounts `BlogPost`)

## 5. Wire + verify

- [x] 5.1 Confirm home "Read the blog" link (`mentors.blog`) reaches `/blog` and blog→article→back navigation works
- [x] 5.2 Confirm required `blog.*` i18n keys exist in `vi.json`/`en.json`; add any missing keys used by ported components
- [x] 5.3 `npm run build` (webpack) green + `npx tsc --noEmit` clean; JSON valid

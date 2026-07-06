## 1. Blog REST types

- [ ] 1.1 Create `src/modules/api/rest/blog/types.ts` with request/response interfaces inferred from backend `BlogDtos.java`. Use module-scoped page names (`BlogPostPage`, `BlogCommentPage`) to avoid collisions.

## 2. Blog REST client

- [ ] 2.1 Create `src/modules/api/rest/blog/blog.ts` exporting REST functions for all non-overlapped endpoints in `BlogPostController`, `BlogCategoryController`, and `BlogEngagementController`.
- [ ] 2.2 Create `src/modules/api/rest/blog/index.ts` barrel re-exporting types and functions.
- [ ] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./blog"`.

### Endpoint mapping

**BlogPostController (skipped public reads because GraphQL covers them):**
- `createBlogPost`, `updateBlogPost`, `publishBlogPost`, `deleteBlogPost`

**BlogCategoryController:**
- `getBlogCategories`, `createBlogCategory`, `updateBlogCategory`, `deleteBlogCategory`

**BlogEngagementController:**
- `getBlogComments`, `createBlogComment`, `updateBlogComment`, `deleteBlogComment`
- `reactToBlogPost`, `reactToBlogComment`

## 3. SWR mutation wrappers

- [ ] 3.1 Create `usePostCreateBlogPostSwr.ts`
- [ ] 3.2 Create `usePostUpdateBlogPostSwr.ts`
- [ ] 3.3 Create `usePostPublishBlogPostSwr.ts`
- [ ] 3.4 Create `usePostDeleteBlogPostSwr.ts`
- [ ] 3.5 Create `usePostCreateBlogCategorySwr.ts`
- [ ] 3.6 Create `usePostUpdateBlogCategorySwr.ts`
- [ ] 3.7 Create `usePostDeleteBlogCategorySwr.ts`
- [ ] 3.8 Create `usePostCreateBlogCommentSwr.ts`
- [ ] 3.9 Create `usePostUpdateBlogCommentSwr.ts`
- [ ] 3.10 Create `usePostDeleteBlogCommentSwr.ts`
- [ ] 3.11 Create `usePostReactToBlogPostSwr.ts`
- [ ] 3.12 Create `usePostReactToBlogCommentSwr.ts`
- [ ] 3.13 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [ ] 4.1 Create `useGetBlogCategoriesSwr.ts`
- [ ] 4.2 Create `useGetBlogCommentsSwr.ts`
- [ ] 4.3 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [ ] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [ ] 5.2 Run `npm run build` (webpack) and ensure a green build.

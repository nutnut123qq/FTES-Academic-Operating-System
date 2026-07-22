## 1. Blog REST types

- [x] 1.1 Create `src/modules/api/rest/blog/types.ts` with request/response interfaces inferred from backend `BlogDtos.java`. Use module-scoped page names (`BlogPostPage`, `BlogCommentPage`) to avoid collisions.

## 2. Blog REST client

- [x] 2.1 Create `src/modules/api/rest/blog/blog.ts` exporting REST functions for all non-overlapped endpoints in `BlogPostController`, `BlogCategoryController`, and `BlogEngagementController`.
- [x] 2.2 Create `src/modules/api/rest/blog/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./blog"`.

### Endpoint mapping

**BlogPostController (skipped public reads because GraphQL covers them):**
- `createBlogPost`, `updateBlogPost`, `publishBlogPost`, `deleteBlogPost`

**BlogCategoryController:**
- `getBlogCategories`, `createBlogCategory`, `updateBlogCategory`, `deleteBlogCategory`

**BlogEngagementController:**
- `getBlogComments`, `createBlogComment`, `updateBlogComment`, `deleteBlogComment`
- `reactToBlogPost`, `reactToBlogComment`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostCreateBlogPostSwr.ts`
- [x] 3.2 Create `usePostUpdateBlogPostSwr.ts`
- [x] 3.3 Create `usePostPublishBlogPostSwr.ts`
- [x] 3.4 Create `usePostDeleteBlogPostSwr.ts`
- [x] 3.5 Create `usePostCreateBlogCategorySwr.ts`
- [x] 3.6 Create `usePostUpdateBlogCategorySwr.ts`
- [x] 3.7 Create `usePostDeleteBlogCategorySwr.ts`
- [x] 3.8 Create `usePostCreateBlogCommentSwr.ts`
- [x] 3.9 Create `usePostUpdateBlogCommentSwr.ts`
- [x] 3.10 Create `usePostDeleteBlogCommentSwr.ts`
- [x] 3.11 Create `usePostReactToBlogPostSwr.ts`
- [x] 3.12 Create `usePostReactToBlogCommentSwr.ts`
- [x] 3.13 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [x] 4.1 Create `useGetBlogCategoriesSwr.ts`
- [x] 4.2 Create `useGetBlogCommentsSwr.ts`
- [x] 4.3 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [ ] 5.2 Run `npm run build` (webpack) and ensure a green build.

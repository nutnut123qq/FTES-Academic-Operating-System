# rest-fetch-blog Specification

## Purpose
TBD - created by archiving change rest-fetch-blog. Update Purpose after archive.
## Requirements
### Requirement: Blog REST types mirror backend DTOs
The frontend SHALL provide TypeScript interfaces in `src/modules/api/rest/blog/types.ts` that match the request/response records defined in `vn.ftes.aos.blog.web.dto.BlogDtos`.

#### Scenario: Type coverage
- **WHEN** a developer imports from `src/modules/api/rest/blog`
- **THEN** they can access typed request/response shapes for posts, categories, comments, and reactions

### Requirement: Blog REST client exposes all non-overlapped endpoints
The frontend SHALL provide a REST client in `src/modules/api/rest/blog/blog.ts` that calls every `BlogPostController`, `BlogCategoryController`, and `BlogEngagementController` endpoint that is not already covered by GraphQL.

#### Scenario: Editorial post lifecycle
- **WHEN** an admin with `blog.manage` calls create/update/publish/delete post functions
- **THEN** the corresponding `POST/PUT/PATCH/DELETE /api/v1/blog/posts*` endpoints are invoked

#### Scenario: Category management
- **WHEN** an admin with `blog.manage` calls create/update/delete category functions
- **THEN** the corresponding `POST/PUT/DELETE /api/v1/blog/categories*` endpoints are invoked

#### Scenario: Blog engagement
- **WHEN** an authenticated user calls comment or reaction functions
- **THEN** the corresponding `POST/PUT/DELETE /api/v1/blog/posts/{postId}/comments*`, `/api/v1/blog/comments*`, or `/api/v1/blog/{posts|comments}/{id}/reaction` endpoints are invoked

### Requirement: Skip GraphQL-duplicated reads
The frontend SHALL NOT expose REST query hooks for `GET /api/v1/blog/posts`, `GET /api/v1/blog/posts/search`, or `GET /api/v1/blog/posts/{slug}` because `queryBlogPosts` and `queryBlogPost` already serve those reads.

#### Scenario: Public blog page
- **WHEN** a page needs to list or display a published blog post
- **THEN** it uses the existing GraphQL queries, not the REST client

### Requirement: SWR mutation wrappers for writes
The frontend SHALL provide `usePost*Swr` hooks in `src/hooks/swr/api/rest/mutations/` for every blog write endpoint.

#### Scenario: Admin creates a post
- **WHEN** a component calls `usePostCreateBlogPostSwr().trigger(request)`
- **THEN** the hook invokes the create post REST function and returns the resulting `PostDetail`

### Requirement: SWR query wrappers for remaining reads
The frontend SHALL provide `useGet*Swr` hooks in `src/hooks/swr/api/rest/queries/` for read endpoints not covered by GraphQL.

#### Scenario: Category list
- **WHEN** a component calls `useGetBlogCategoriesSwr()`
- **THEN** the hook fetches `/api/v1/blog/categories` via SWR

#### Scenario: Comment list
- **WHEN** a component calls `useGetBlogCommentsSwr({ postId })`
- **THEN** the hook fetches `/api/v1/blog/posts/{postId}/comments` via SWR

### Requirement: Root barrel updated
The frontend SHALL update `src/modules/api/rest/index.ts` to re-export `./blog`.

#### Scenario: Importing blog client
- **WHEN** a developer imports from `@/modules/api/rest`
- **THEN** blog types and functions are available


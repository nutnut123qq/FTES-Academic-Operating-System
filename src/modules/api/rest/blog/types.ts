/**
 * Request/response DTOs for the blog REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.blog.web.dto.BlogDtos`.
 * Names are prefixed with `Blog` where they would collide with other REST
 * modules (e.g. community `CommentResponse`, `CreatePostRequest`).
 */

// ---- Post ----

export interface CreateBlogPostRequest {
    title: string
    content: string
    thumbnailUrl?: string
    categoryId?: string
}

export interface UpdateBlogPostRequest {
    title?: string
    content?: string
    thumbnailUrl?: string
    categoryId?: string
    version?: number
}

export interface PublishBlogPostRequest {
    published: boolean
}

export interface BlogPostSummary {
    id: string
    title: string
    slug: string
    thumbnailUrl?: string
    authorId: string
    categoryId: string
    published: boolean
    publishedAt?: string
    viewCount: number
    emojiCount: number
    createdAt: string
}

export interface BlogPostDetail {
    id: string
    title: string
    slug: string
    contentMd: string
    thumbnailUrl?: string
    authorId: string
    categoryId: string
    published: boolean
    publishedAt?: string
    viewCount: number
    emojiCount: number
    version: number
    createdAt: string
    updatedAt: string
}

export interface BlogPostPage {
    items: BlogPostSummary[]
    page: number
    size: number
    hasNext: boolean
    /**
     * Total number of matching posts across all pages. Optional so the type keeps
     * working against a backend that has not yet started returning it (mirrors the
     * BE delta `blog-admin-filter-and-engagement-seed`).
     */
    totalElements?: number | null
}

// ---- Category ----

export interface BlogCategoryRequest {
    name: string
    sortOrder: number
}

export interface BlogCategoryResponse {
    id: string
    name: string
    slug: string
    sortOrder: number
}

// ---- Comment ----

export interface CreateBlogCommentRequest {
    content: string
}

export interface UpdateBlogCommentRequest {
    content: string
}

export interface BlogCommentResponse {
    id: string
    postId: string
    userId: string
    content: string
    emojiCount: number
    createdAt: string
    updatedAt: string
    /**
     * URL-facing handle of the comment author, resolved by the backend for the
     * `UserLink` hovercard. Optional/nullable: a legacy user id or an older BE
     * returns `null`, in which case the UI falls back to an avatar seeded by
     * `userId` plus a generic author label (mirrors the BE delta
     * `blog-admin-filter-and-engagement-seed`).
     */
    authorUsername?: string | null
}

export interface BlogCommentPage {
    items: BlogCommentResponse[]
    page: number
    size: number
    hasNext: boolean
}

// ---- Reaction ----

export interface BlogReactionResult {
    reacted: boolean
    emojiCount: number
}

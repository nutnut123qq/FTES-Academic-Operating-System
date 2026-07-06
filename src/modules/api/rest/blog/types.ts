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

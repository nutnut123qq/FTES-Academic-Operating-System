import { restRequest } from "@/modules/api/rest/client"
import type {
    BlogCategoryRequest,
    BlogCategoryResponse,
    BlogCommentPage,
    BlogCommentResponse,
    BlogPostDetail,
    BlogReactionResult,
    CreateBlogCommentRequest,
    CreateBlogPostRequest,
    PublishBlogPostRequest,
    UpdateBlogCommentRequest,
    UpdateBlogPostRequest,
} from "./types"

// ---------------- BlogPostController (editorial only) ----------------

export const createBlogPost = async (
    request: CreateBlogPostRequest,
): Promise<BlogPostDetail> =>
    restRequest<BlogPostDetail>({
        method: "POST",
        url: "/blog/posts",
        data: request,
    })

export const updateBlogPost = async (
    id: string,
    request: UpdateBlogPostRequest,
): Promise<BlogPostDetail> =>
    restRequest<BlogPostDetail>({
        method: "PUT",
        url: `/blog/posts/${id}`,
        data: request,
    })

export const publishBlogPost = async (
    id: string,
    request: PublishBlogPostRequest,
): Promise<BlogPostDetail> =>
    restRequest<BlogPostDetail>({
        method: "PATCH",
        url: `/blog/posts/${id}/publish`,
        data: request,
    })

export const deleteBlogPost = async (id: string): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/blog/posts/${id}`,
    })

// ---------------- BlogCategoryController ----------------

export const getBlogCategories = async (): Promise<BlogCategoryResponse[]> =>
    restRequest<BlogCategoryResponse[]>({
        method: "GET",
        url: "/blog/categories",
    })

export const createBlogCategory = async (
    request: BlogCategoryRequest,
): Promise<BlogCategoryResponse> =>
    restRequest<BlogCategoryResponse>({
        method: "POST",
        url: "/blog/categories",
        data: request,
    })

export const updateBlogCategory = async (
    id: string,
    request: BlogCategoryRequest,
): Promise<BlogCategoryResponse> =>
    restRequest<BlogCategoryResponse>({
        method: "PUT",
        url: `/blog/categories/${id}`,
        data: request,
    })

export const deleteBlogCategory = async (id: string): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/blog/categories/${id}`,
    })

// ---------------- BlogEngagementController ----------------

export const getBlogComments = async (
    postId: string,
    params?: {
        page?: number
        size?: number
    },
): Promise<BlogCommentPage> =>
    restRequest<BlogCommentPage>({
        method: "GET",
        url: `/blog/posts/${postId}/comments`,
        params: { ...params },
    })

export const createBlogComment = async (
    postId: string,
    request: CreateBlogCommentRequest,
): Promise<BlogCommentResponse> =>
    restRequest<BlogCommentResponse>({
        method: "POST",
        url: `/blog/posts/${postId}/comments`,
        data: request,
    })

export const updateBlogComment = async (
    id: string,
    request: UpdateBlogCommentRequest,
): Promise<BlogCommentResponse> =>
    restRequest<BlogCommentResponse>({
        method: "PUT",
        url: `/blog/comments/${id}`,
        data: request,
    })

export const deleteBlogComment = async (id: string): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/blog/comments/${id}`,
    })

export const reactToBlogPost = async (id: string): Promise<BlogReactionResult> =>
    restRequest<BlogReactionResult>({
        method: "PUT",
        url: `/blog/posts/${id}/reaction`,
    })

export const reactToBlogComment = async (
    id: string,
): Promise<BlogReactionResult> =>
    restRequest<BlogReactionResult>({
        method: "PUT",
        url: `/blog/comments/${id}/reaction`,
    })

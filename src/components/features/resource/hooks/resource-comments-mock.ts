/**
 * Mock BE for resource comments (§5) — in-module store keyed by resourceId.
 *
 * Shape mirrors the assumed future API
 * (`GET/POST/DELETE /resources/:id/comments` +
 * `POST /resources/:id/comments/:commentId/like`), so swapping the real BE in
 * is a fetcher change only. The one-level reply cap is enforced here the same
 * way the server would: a `parentId` pointing at a reply resolves to that
 * reply's top-level parent. ponytail: data resets on reload (mock only).
 */

/** The author of a resource comment. */
export interface ResourceCommentAuthor {
    /** The author's user id (owner check: `author.id === currentUser.id`). */
    id: string
    /** Display name shown on the row. */
    name: string
    /** Optional avatar URL (initial fallback when absent). */
    avatarUrl?: string
}

/** A comment on a resource (top-level when `parentId === null`, else a reply). */
export interface ResourceCommentItem {
    /** Unique id of the comment. */
    id: string
    /** Top-level parent id, or null for a top-level comment (one-level cap). */
    parentId: string | null
    /** The comment author. */
    author: ResourceCommentAuthor
    /** Free-form comment text (≤ 500 chars, enforced by the composer). */
    text: string
    /** ISO creation timestamp (drives relative time + ordering). */
    createdAt: string
    /** Number of likes on the comment. */
    likeCount: number
    /** Whether the current viewer liked the comment. */
    likedByMe: boolean
}

/** Input for creating a comment (optional `parentId` makes it a reply). */
export interface CreateResourceCommentInput {
    /** Trimmed comment text. */
    text: string
    /** Target parent comment id (resolved to its top-level parent), or null. */
    parentId: string | null
    /** The posting user (always authenticated — guests are gated before submit). */
    author: ResourceCommentAuthor
}

// simulated network latency for every mock call
const MOCK_LATENCY_MS = 300

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// in-module store keyed by resourceId; seeded lazily per resource
const commentsByResource = new Map<string, Array<ResourceCommentItem>>()

let createSequence = 0

const seedResourceComments = (resourceId: string): Array<ResourceCommentItem> => {
    const now = Date.now()
    const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString()
    return [
        {
            id: `${resourceId}-c1`,
            parentId: null,
            author: { id: "user-minh", name: "Minh" },
            text: "Tài liệu rất đầy đủ, cảm ơn!",
            createdAt: minutesAgo(90),
            likeCount: 3,
            likedByMe: false,
        },
        {
            id: `${resourceId}-c2`,
            parentId: `${resourceId}-c1`,
            author: { id: "user-an", name: "An" },
            text: "Đồng ý, phần con trỏ giải thích dễ hiểu.",
            createdAt: minutesAgo(45),
            likeCount: 1,
            likedByMe: false,
        },
        {
            id: `${resourceId}-c3`,
            parentId: null,
            author: { id: "user-hoa", name: "Hoa" },
            text: "Có bạn nào tóm tắt chương 3 chưa? Cho mình xin với.",
            createdAt: minutesAgo(20),
            likeCount: 0,
            likedByMe: false,
        },
    ]
}

const readStore = (resourceId: string): Array<ResourceCommentItem> => {
    const existing = commentsByResource.get(resourceId)
    if (existing) {
        return existing
    }
    const seeded = seedResourceComments(resourceId)
    commentsByResource.set(resourceId, seeded)
    return seeded
}

// immutable snapshot so SWR cache entries never alias the store
const snapshot = (list: Array<ResourceCommentItem>): Array<ResourceCommentItem> =>
    list.map((comment) => ({ ...comment, author: { ...comment.author } }))

/**
 * Loads all comments of a resource (flat list; the UI groups replies by parent).
 * @param resourceId - The resource whose comments to load.
 * @returns A snapshot of the resource's comments.
 */
export const fetchResourceCommentsMock = async (
    resourceId: string,
): Promise<Array<ResourceCommentItem>> => {
    await delay(MOCK_LATENCY_MS)
    return snapshot(readStore(resourceId))
}

/**
 * Creates a comment (or a reply when `parentId` is set). Enforces the one-level
 * cap server-side: a `parentId` pointing at a reply resolves to its top-level parent.
 * @param resourceId - The resource being commented on.
 * @param input - The comment payload.
 * @returns The updated comment list.
 */
export const createResourceCommentMock = async (
    resourceId: string,
    input: CreateResourceCommentInput,
): Promise<Array<ResourceCommentItem>> => {
    await delay(MOCK_LATENCY_MS)
    const list = readStore(resourceId)
    // resolve the reply target to its top-level parent (never nest deeper)
    let parentId = input.parentId
    if (parentId !== null) {
        const parent = list.find((comment) => comment.id === parentId)
        parentId = parent ? (parent.parentId ?? parent.id) : null
    }
    createSequence += 1
    list.push({
        id: `created-${Date.now()}-${createSequence}`,
        parentId,
        author: { ...input.author },
        text: input.text,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        likedByMe: false,
    })
    return snapshot(list)
}

/**
 * Deletes a comment (and its replies, to avoid orphans).
 * @param resourceId - The resource owning the comment.
 * @param commentId - The comment to delete.
 * @returns The updated comment list.
 */
export const deleteResourceCommentMock = async (
    resourceId: string,
    commentId: string,
): Promise<Array<ResourceCommentItem>> => {
    await delay(MOCK_LATENCY_MS)
    const remaining = readStore(resourceId).filter(
        (comment) => comment.id !== commentId && comment.parentId !== commentId,
    )
    commentsByResource.set(resourceId, remaining)
    return snapshot(remaining)
}

/**
 * Toggles the viewer's like on a comment (idempotent flip of `likedByMe` ± 1).
 * @param resourceId - The resource owning the comment.
 * @param commentId - The comment being (un)liked.
 * @returns The updated comment list.
 */
export const toggleResourceCommentLikeMock = async (
    resourceId: string,
    commentId: string,
): Promise<Array<ResourceCommentItem>> => {
    await delay(MOCK_LATENCY_MS)
    const list = readStore(resourceId)
    const target = list.find((comment) => comment.id === commentId)
    if (target) {
        target.likedByMe = !target.likedByMe
        target.likeCount = Math.max(0, target.likeCount + (target.likedByMe ? 1 : -1))
    }
    return snapshot(list)
}

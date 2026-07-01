/** Standard Socket.IO success/error envelope emitted by the backend `WsResponseService`. */
export interface SocketIoEnvelope<TData> {
    /** Whether the server-side handler succeeded. */
    success: boolean
    /** Human-readable status message. */
    message: string
    /** Error name when `success` is false. */
    error?: string
    /** The typed payload. */
    data?: TData
}

/** Data for a comment create/update/delete server event. */
export interface CommentChangedData {
    /** Content the comment belongs to. */
    contentId: string
    /** The comment that changed. */
    commentId: string
    /** Parent comment id when the changed comment is a reply; null for top-level. */
    parentCommentId: string | null
}

/** Server → client envelope for a comment create/update/delete event. */
export type CommentChangedSocketIoMessage = SocketIoEnvelope<CommentChangedData>

/** Data for a content reaction-changed server event. */
export interface ContentReactionChangedData {
    /** Content whose reaction summary changed. */
    contentId: string
}

/** Server → client envelope for a content reaction-changed event. */
export type ContentReactionChangedSocketIoMessage = SocketIoEnvelope<ContentReactionChangedData>

/** Data for a comment reaction-changed server event. */
export interface CommentReactionChangedData {
    /** Content the comment belongs to. */
    contentId: string
    /** Comment whose reaction summary changed. */
    commentId: string
}

/** Server → client envelope for a comment reaction-changed event. */
export type CommentReactionChangedSocketIoMessage = SocketIoEnvelope<CommentReactionChangedData>

/** Target of a {@link SubscribeContentDiscussionSocketIoPayload}. */
export interface SubscribeContentDiscussionData {
    /** Content whose discussion room to join. */
    contentId: string
}

/** Client → server payload to join a content's discussion room. */
export interface SubscribeContentDiscussionSocketIoPayload {
    /** The content to subscribe to. */
    data: SubscribeContentDiscussionData
    /** Locale used for server-rendered copy (unused server-side for discussion, kept for parity). */
    locale: string
}

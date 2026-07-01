import { contentDiscussionSocket } from "./sockets"

/**
 * Access the singleton `/content_discussion` Socket.IO instance (to `.emit()` / join rooms).
 * The connection lifecycle is owned by {@link SocketIoSideEffects}; this is a pure getter.
 * @returns the content-discussion socket.
 */
export const useContentDiscussionSocketIo = () => contentDiscussionSocket

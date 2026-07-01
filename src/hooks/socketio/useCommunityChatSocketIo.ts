import { communityChatSocket } from "./sockets"

/**
 * Access the singleton `/community_chat` Socket.IO instance (to `.emit()` / join
 * conversation rooms). The connection lifecycle is owned by
 * {@link SocketIoSideEffects}; this is a pure getter.
 * @returns the community-chat socket.
 */
export const useCommunityChatSocketIo = () => communityChatSocket

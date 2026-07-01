import { aiLabSocket } from "./sockets"

/**
 * Access the singleton `/ai_lab` Socket.IO instance (to `.emit()` subscribe/abort).
 * The connection lifecycle is owned by {@link SocketIoSideEffects}; this is a pure getter.
 * @returns the AI Lab socket.
 */
export const useAiLabSocketIo = () => aiLabSocket

import { jobNotificationsSocket } from "./sockets"

/**
 * Access the singleton `/job_notifications` Socket.IO instance (to `.emit()`).
 * The connection lifecycle is owned by {@link SocketIoSideEffects}; this is a pure getter.
 * @returns the job-notifications socket.
 */
export const useJobNotificationsSocketIo = () => jobNotificationsSocket

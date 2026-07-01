import { Manager } from "socket.io-client"
import { publicEnv } from "@/resources/env/public"

/**
 * Creates a single Socket.IO {@link Manager} for the API WebSocket base URL.
 */
export const createManager = () => {
    return new Manager(
        publicEnv().api.socketIo,
        {
            transports: ["websocket", "polling"],
            // Built-in reconnection with infinite backoff (1s → 5s). The bearer
            // token is supplied per-attempt via a function `socket.auth` in each
            // lifecycle hook, so reconnects always send a FRESH token (the reason
            // this used to be disabled in favour of a fragile manual loop).
            reconnection: true,
            autoConnect: false,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        },
    )
}

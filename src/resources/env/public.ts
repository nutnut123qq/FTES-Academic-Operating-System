/**
 * Public environment variables.
 */
export const publicEnv = () => {
    return {
        api: {
            /** The HTTP base URL of the API. */
            http: process.env.NEXT_PUBLIC_API_HTTP_BASE_URL || "http://localhost:3001/api/v1",
            /** The WebSocket base URL of the API. */
            socketIo: process.env.NEXT_PUBLIC_API_WEBSOCKET_BASE_URL || "ws://localhost:3001",
            /** The GraphQL base URL of the API. */
            graphql: process.env.NEXT_PUBLIC_API_GRAPHQL_BASE_URL || "http://localhost:3001/graphql",
        },
        graphql: {
            /** The maximum number of retry attempts for GraphQL operations. */
            maxRetry: Number(process.env.NEXT_PUBLIC_GRAPHQL_MAX_RETRY || 3),
            /** The maximum delay between retry attempts for GraphQL operations. */
            maxRetryDelay: Number(process.env.NEXT_PUBLIC_GRAPHQL_MAX_RETRY_DELAY || 1000),
            /** The initial delay before the first retry attempt for GraphQL operations. */
            initialRetryDelay: Number(process.env.NEXT_PUBLIC_GRAPHQL_INITIAL_RETRY_DELAY || 300),
            /** The timeout for GraphQL operations. */
            timeout: Number(process.env.NEXT_PUBLIC_GRAPHQL_TIMEOUT || 300000),
        },
        minio: {
            /** The URL of the Minio server. */
            url: process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000",
            /** The bucket of the Minio server. */
            bucket: process.env.NEXT_PUBLIC_MINIO_BUCKET || "ftesaos",
        },
        computation: {
            /** The amount of fraction digits for computation. */
            amount: {
                /** The amount of fraction digits for computation. */
                fractionDigits: Number(process.env.NEXT_PUBLIC_COMPUTATION_AMOUNT_FRACTION_DIGITS || 10),
            },
            operation: {
                /** The operation of fraction digits for computation. */
                fractionDigits: Number(process.env.NEXT_PUBLIC_COMPUTATION_OPERATION_FRACTION_DIGITS || 10),
            },
            round: {
                /** The round of fraction digits for computation. */
                fractionDigits: Number(process.env.NEXT_PUBLIC_COMPUTATION_ROUND_FRACTION_DIGITS || 5),
            },
            percentage: {
                /** The percentage of fraction digits for computation. */
                fractionDigits: Number(process.env.NEXT_PUBLIC_COMPUTATION_PERCENTAGE_FRACTION_DIGITS || 5),
            },
        },
        keycloak: {
            /** The URL of the Keycloak server. */
            url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8089",
            /** The realm of the Keycloak server. */
            realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "master",
            /** The client ID of the Keycloak server. */
            clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "academy-web",
            /** The redirect URI of the Keycloak server. */
            redirectUri: process.env.NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI || "http://localhost:3001/api/v1/keycloak/google/callback",
        },
        captcha: {
            /** Whether captcha is enabled. */
            enabled: process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === "true",
            /** The Turnstile site key. Defaults to Cloudflare's always-pass testing key. */
            siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
        },
        pricing: {
            /**
             * Non-production divides every DISPLAYED course VND price by this so the
             * catalog / rail / payment modal all show the SAME cheap test price —
             * mirrors the backend `LOCAL_TEST_PRICE_DIVISOR` (also NODE_ENV-gated), so
             * the shown price equals the eventual charge. `1` in production (no divide).
             */
            testDivisor: process.env.NODE_ENV !== "production" ? 100 : 1,
        },
        /**
         * Debug mode. Defaults to ON (`true`) — dev affordances activate, e.g.
         * `AsyncContent` holds the skeleton for a few seconds so loading states can
         * be inspected without a slow network. Set `NEXT_PUBLIC_DEBUG=false` to
         * disable (e.g. production).
         */
        debug: process.env.NEXT_PUBLIC_DEBUG !== "false",
    }
}
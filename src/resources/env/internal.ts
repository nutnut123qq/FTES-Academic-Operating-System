/**
 * Internal environment variables.
 */
export const internalEnv = () => {
    return {
        /** Whether the environment is production. */
        isProduction: process.env.VERCEL_ENV === "production",
    }
}

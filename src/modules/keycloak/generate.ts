/**
 * Generates a challenge for the Keycloak server.
 * @param verifier - The verifier to generate the challenge for.
 * @returns The challenge.
 */
export const generateChallenge = async (verifier: string) => {
    /** The encoder to encode the verifier. */
    const encoder = new TextEncoder()
    /** The data to encode. */
    const data = encoder.encode(verifier)
    /** The hash of the data. */
    const hash = await crypto.subtle.digest("SHA-256", data)
    /** The challenge. */
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}
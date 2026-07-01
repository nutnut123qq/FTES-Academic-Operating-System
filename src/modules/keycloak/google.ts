import { generateChallenge } from "./generate"
import { publicEnv } from "@/resources/env/public"

export const redirectToGoogleAuthentication = async () => {
    const { url: keycloakUrl, realm, clientId } = publicEnv().keycloak
    
    /** The state to prevent CSRF. */
    const state = crypto.randomUUID()
    /** The verifier to prevent code interception. */
    const codeVerifier = `${crypto.randomUUID()}-${crypto.randomUUID()}`
    /** The challenge to prevent code interception. */
    const codeChallenge = await generateChallenge(codeVerifier)

    /** Save the verifier, state, and IdP for post-redirect exchange. */
    sessionStorage.setItem("pkce_verifier", codeVerifier)
    sessionStorage.setItem("auth_state", state)
    sessionStorage.setItem("oauth_idp_hint", "google")
    sessionStorage.setItem("oauth_redirect_uri", window.location.href)
    /** The URL to redirect to. */
    const url = new URL(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`)
    
    const params = {
        client_id: clientId,
        redirect_uri: window.location.href,
        response_type: "code",
        scope: "openid email profile",
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        kc_idp_hint: "google",
    }
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val))
    /** Redirect to the URL. */
    window.location.href = url.toString()
}
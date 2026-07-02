export enum SessionStorageId {
    OauthIdpHint = "oauth_idp_hint",
    ChallengeId = "challenge_id",
    /** Route (path + query) to return to after an OAuth round-trip (`auth:returnTo`). */
    AuthReturnTo = "auth:return_to",
}
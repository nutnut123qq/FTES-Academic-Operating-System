import React from "react"
import { useSyncReduxCourseId } from "./useSyncReduxCourseId"
import { useSyncReduxModuleId } from "./useSyncReduxModuleId"
import { useSetTabQuery } from "./useSetTabQuery"
import { useSidebar } from "./useSidebar"
import { useSyncReduxContentId } from "./useSyncReduxContentId"
import { useSyncReduxContent } from "./useSyncReduxContent"
import { useDefaultRedirect } from "./useDefaultRedirect"
import { useExchangeCodeForToken } from "./useExchangeCodeForToken"
import { useSyncReduxTaskId } from "./useSyncReduxTaskId"
import { useSyncReduxMilestoneId } from "./useSyncReduxMilestoneId"
import { useSyncReduxPublicContentId } from "./useSyncReduxPublicContentId"
import { useSyncReduxFoundationCategoryId } from "./useSyncReduxFoundationCategoryId"
import { useSyncFoundationCategory } from "./useSyncFoundationCategory"
import { useSyncReduxFoundationId } from "./useSyncReduxFoundationId"
import { useSyncFoundationEntity } from "./useSyncFoundationEntity"
import { useSessionSuperseded } from "./useSessionSuperseded"
import { useInitializeFingerprint } from "./useInitializeFingerprint"

/**
 * Mounts all global side-effect hooks once at the top of the app tree.
 * Renders nothing — returns an empty fragment. Each hook drives a `useEffect`
 * or `useLayoutEffect` that syncs Redux state with URL params, auth tokens, etc.
 * @returns an empty React fragment.
 */
export const UseEffects = () => {
    /** Initialize FingerprintJS device fingerprint on app mount. */
    useInitializeFingerprint()
    /** Show warning toast if user session was superseded on another device. */
    useSessionSuperseded()
    /** The useEffect to sync the redux course id. */
    useSyncReduxCourseId()
    /** The useEffect to sync the redux module id. */
    useSyncReduxModuleId()
    /** The useEffect to sync the redux content id. */
    useSyncReduxContentId()
    /** Mirror content SWR result into Redux (covers cache hits / back-navigation). */
    useSyncReduxContent()
    /** The useEffect to set the tab query. */
    useSetTabQuery()
    /** The useEffect to sync sidebar selection and route. */
    useSidebar()
    /** The useEffect to redirect to the default path. */
    useDefaultRedirect()
    /** OIDC: exchange `code` from Keycloak redirect for app tokens. */
    useExchangeCodeForToken()
    /** The useEffect to sync the redux task id from URL. */
    useSyncReduxTaskId()
    /** The useEffect to sync the redux milestone id from URL. */
    useSyncReduxMilestoneId()
    /** The useEffect to sync the redux public content id from URL. */
    useSyncReduxPublicContentId()
    useSyncReduxFoundationCategoryId()
    useSyncFoundationCategory()
    useSyncReduxFoundationId()
    useSyncFoundationEntity()
    return (
        <></>
    )
}
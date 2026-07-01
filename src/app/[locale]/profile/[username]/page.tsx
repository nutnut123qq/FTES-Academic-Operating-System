import React, { cache } from "react"
import type { Metadata } from "next"
import { SEO_CONFIG } from "@/config/seo"
import {
    PublicProfile,
} from "@/components/features/profile/PublicProfile"
import { publicEnv } from "@/resources/env/public"
import { JsonLd, personSchema } from "@/modules/seo/jsonLd"

/** Route params for the public profile page. */
interface ProfilePageParams {
    /** Active locale segment. */
    locale: string
    /** Target user's username (the URL handle). */
    username: string
}

/** Minimal profile shape used for share metadata + Person JSON-LD. */
interface ProfileMeta {
    username: string
    displayName?: string | null
    bio?: string | null
    avatar?: string | null
    profileLocked?: boolean | null
}

/** Minimal userProfile query used only to build share metadata (server-side). */
const USER_PROFILE_META_QUERY =
    "query($username:String!){userProfile(username:$username){data{username displayName bio avatar profileLocked}}}"

/**
 * Public profile fetch, memoized per request so `generateMetadata` and the page
 * body share one round-trip. Returns null on any error so SEO degrades gracefully.
 */
const getProfile = cache(async (username: string): Promise<ProfileMeta | null> => {
    try {
        // public read of the profile header, server-side, never cached
        const response = await fetch(publicEnv().api.graphql, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: USER_PROFILE_META_QUERY,
                variables: {
                    username,
                },
            }),
            cache: "no-store",
        })
        const payload = await response.json()
        return (payload?.data?.userProfile?.data as ProfileMeta | undefined) ?? null
    } catch {
        // API unreachable / malformed response → no metadata, never throw
        return null
    }
})

/**
 * Build per-user share metadata (title + description + Open Graph / Twitter card)
 * so a `/profile/<username>` link unfurls with the person's name + avatar on
 * social. A locked profile keeps a neutral description (its bio is private).
 *
 * @param props.params - the awaited route params (locale + username).
 */
export const generateMetadata = async ({
    params,
}: {
    params: Promise<ProfilePageParams>
}): Promise<Metadata> => {
    const { username } = await params
    const user = await getProfile(username)
    // unknown user → generic title (the page itself renders a 404 state)
    if (!user) {
        return {
            title: "Profile · StarCi Academy",
        }
    }
    // prefer the display name; fall back to the username
    const name = user.displayName?.trim() ? user.displayName : user.username
    const title = `${name} (@${user.username}) · StarCi Academy`
    // a locked profile hides its bio → keep the description neutral
    const description = (!user.profileLocked && user.bio?.trim())
        ? user.bio
        : `${name} on StarCi Academy`
    // avatar (when set) becomes the share image
    const images = user.avatar ? [{ url: user.avatar }] : []
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            type: "profile",
        },
        twitter: {
            card: "summary",
            title,
            description,
            images: user.avatar ? [user.avatar] : [],
        },
    }
}

/**
 * Route `/[locale]/profile/[username]` — any user's public, GitHub-style profile
 * (viewable by anyone), addressed by username like `github.com/<username>`. This
 * is a server component (for `generateMetadata` + Person JSON-LD); it renders the
 * client `PublicProfile`, which reads the username from the route itself.
 *
 * Static `/profile/*` children (edit, bookmarks, sessions, …) take precedence
 * over this dynamic segment in Next routing, so the viewer's own profile hub and
 * its sub-pages are unaffected.
 *
 * @param props.params - the awaited route params.
 */
const Page = async ({
    params,
}: {
    params: Promise<ProfilePageParams>
}) => {
    const { locale, username } = await params
    const user = await getProfile(username)
    const name = user
        ? (user.displayName?.trim() ? user.displayName : user.username)
        : null
    return (
        <>
            {user && name ? (
                <JsonLd
                    data={personSchema({
                        name,
                        url: `${SEO_CONFIG.siteUrl}/${locale}/profile/${user.username}`,
                        image: user.avatar ?? undefined,
                        description: (!user.profileLocked && user.bio?.trim()) ? user.bio : undefined,
                    })}
                />
            ) : null}
            <PublicProfile />
        </>
    )
}

export default Page

import useSWR from "swr"
import type { UserHovercardData } from "@/modules/types/user-hovercard"
import { dicebearAvatarUrl } from "@/utils/avatar"

/**
 * Deterministic numeric hash from a string. Used to generate stable mock counts
 * for a given username.
 */
const hashString = (value: string): number => {
    let hash = 0
    for (let i = 0; i < value.length; i += 1) {
        const char = value.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash |= 0
    }
    return Math.abs(hash)
}

/** Known demo users so the card matches the mocked feed display names. */
const DISPLAY_NAME_MAP: Record<string, string> = {
    "minh-tran": "Minh Trần",
    "an-nguyen": "An Nguyễn",
    "hoa-le": "Hoa Lê",
    "binh-pham": "Bình Phạm",
}

/** Convert a kebab-case username to a readable title-cased display name. */
const usernameToDisplayName = (username: string): string =>
    DISPLAY_NAME_MAP[username] ??
    username
        .split("-")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
        .join(" ")

// ponytail: mock BE — swap this fetcher to queryUserHovercard when BE has userProfile.
const fetchUserHovercardMock = async (
    username: string,
): Promise<UserHovercardData> => {
    const seed = hashString(username)
    return {
        id: username,
        username,
        displayName: usernameToDisplayName(username),
        avatar: dicebearAvatarUrl(username),
        bio: `Chào mừng đến với hồ sơ của @${username}. Đây là dữ liệu demo cho môi trường local.`,
        followerCount: 100 + (seed % 900),
        followingCount: 50 + (seed % 450),
        isFollowedByMe: false,
    }
}

/**
 * SWR query wrapper for the user hovercard profile.
 * `data` is the unwrapped lightweight public user.
 * Keyed by the target username; runs for anonymous viewers too.
 *
 * In demo/local environments this returns mocked data derived from the username
 * so the card is never empty. The SWR key is intentionally unchanged so
 * optimistic follow-sync continues to work.
 *
 * @param username - The username of the user whose hovercard profile to fetch.
 */
export const useQueryUserHovercardSwr = (username: string | null | undefined) => {
    const swr = useSWR(
        username ? ["QUERY_USER_HOVERCARD_SWR", username] : null,
        async () => fetchUserHovercardMock(username as string),
    )

    return swr
}

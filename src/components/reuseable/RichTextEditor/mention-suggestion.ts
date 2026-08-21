"use client"

import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"
import { getMentionSuggestions } from "@/modules/api/rest/community"
import { getMentionableUsers } from "@/modules/api/rest/profile"
import type { FollowEntry } from "@/modules/api/rest/profile"
import type { MentionSuggestionResponse } from "@/modules/api/rest/community"

/** One mentionable user rendered in the `@` typeahead. */
export interface MentionUser {
    /** Stable identity used for de-duplication across personalized + prefix sources. */
    userId: string
    /** Public username used in profile URL. */
    username: string
    /** Display name rendered in the editor and serialized markdown. */
    displayName: string
    /** Public avatar shown in the Facebook-style suggestion row. */
    avatarUrl?: string | null
    /** Why this row was personalized; absent for a plain prefix-search result. */
    source?: "following" | "interaction"
}

/** Quiet period before a keystroke turns into a request. */
export const MENTION_DEBOUNCE_MS = 250

/** Max suggestions rendered in the popup. */
export const MENTION_LIMIT = 5

/** Load a few extra personalized candidates so filtering a typed prefix still has useful rows. */
export const MENTION_RECOMMENDATION_LIMIT = 10

/**
 * Adapts a mentionable-user row into a mention entry. A row without a username
 * cannot be mentioned (the serialized link needs it), so it is dropped by
 * {@link searchMentionUsers}.
 *
 * @param entry - one row from `GET /api/v1/profiles/mentionable`.
 */
const toMentionUser = (entry: FollowEntry): MentionUser => ({
    userId: entry.userId,
    username: entry.username ?? "",
    displayName: entry.displayName || entry.username || "",
    avatarUrl: entry.avatarUrl,
})

const toRecommendedMentionUser = (entry: MentionSuggestionResponse): MentionUser => ({
    userId: entry.userId,
    username: entry.username ?? "",
    displayName: entry.displayName || entry.username || "",
    avatarUrl: entry.avatarUrl,
    source: entry.followedByMe ? "following" : "interaction",
})

const normalize = (value: string): string =>
    value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase()

const matchesPrefix = (user: MentionUser, query: string): boolean => {
    const needle = normalize(query)
    return normalize(user.username).startsWith(needle)
        || normalize(user.displayName).startsWith(needle)
}

const uniqueUsers = (users: Array<MentionUser>): Array<MentionUser> => {
    const seen = new Set<string>()
    return users.filter((user) => {
        const key = user.userId || user.username.toLocaleLowerCase()
        if (!user.username || seen.has(key)) {
            return false
        }
        seen.add(key)
        return true
    })
}

/**
 * Combines PERSONALIZED people with the global prefix lookup.
 *
 * Uses `GET /api/v1/profiles/mentionable`, NOT the search index. The index runs on
 * `websearch_to_tsquery`, which matches whole words: typing `fro` returns nothing
 * for `frostes`, and `manhhd` nothing for `manhhdss180112`. A typeahead that only
 * answers once you have typed the full username is a typeahead that never fires —
 * which is exactly how this surface behaved.
 *
 * Never rejects: a failed or forbidden lookup yields an empty list so a typing
 * user is never interrupted by an editor-level error.
 *
 * @param query - the raw text typed after `@`.
 * With an empty query (the instant `@` is typed), only personalized rows are shown: followed
 * people first, then frequent interactions. Once text is typed, matching personalized rows stay
 * first and `/profiles/mentionable` fills the remaining slots, so a new person is still taggable.
 *
 * @returns at most {@link MENTION_LIMIT} mentionable users.
 */
export const searchMentionUsers = async (query: string): Promise<Array<MentionUser>> => {
    const q = query.trim()
    const recommendedRequest = getMentionSuggestions(MENTION_RECOMMENDATION_LIMIT)
        .catch(() => [] as Array<MentionSuggestionResponse>)
    const prefixRequest = q
        ? getMentionableUsers(q, MENTION_LIMIT).catch(() => [] as Array<FollowEntry>)
        : Promise.resolve([] as Array<FollowEntry>)

    const [recommended, prefixMatches] = await Promise.all([recommendedRequest, prefixRequest])
    const personalized = (recommended ?? [])
        .map(toRecommendedMentionUser)
        .filter((user) => !q || matchesPrefix(user, q))
    return uniqueUsers([
        ...personalized,
        ...(prefixMatches ?? []).map(toMentionUser),
    ]).slice(0, MENTION_LIMIT)
}

/**
 * Wraps a user lookup in a trailing debounce shaped for Tiptap's async `items`.
 *
 * Tiptap awaits ONE promise per keystroke, so a naive debounce would leave the
 * superseded promises pending forever (the popup would freeze) or resolve them
 * late with stale/empty data (the list would flicker). Instead every pending
 * caller is parked and they all settle together with the result of the LAST
 * query — the list can never go backwards.
 *
 * @param fetcher - the lookup to debounce (injectable for tests).
 * @param delayMs - quiet period before the lookup fires.
 * @returns a function with the same shape as `fetcher`.
 */
export const createDebouncedMentionSearch = (
    fetcher: (query: string) => Promise<Array<MentionUser>>,
    delayMs: number = MENTION_DEBOUNCE_MS,
) => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let waiters: Array<(users: Array<MentionUser>) => void> = []

    return (query: string): Promise<Array<MentionUser>> =>
        new Promise<Array<MentionUser>>((resolve) => {
            waiters.push(resolve)
            if (timer) {
                clearTimeout(timer)
            }
            timer = setTimeout(() => {
                timer = null
                const pending = waiters
                waiters = []
                void fetcher(query).then(
                    (users) => pending.forEach((settle) => settle(users)),
                    () => pending.forEach((settle) => settle([])),
                )
            }, delayMs)
        })
}

/** Debounced lookup shared by every editor instance (one in-flight request at a time). */
const debouncedMentionSearch = createDebouncedMentionSearch(searchMentionUsers)

/**
 * Tiptap mention suggestion utility backed by the real user search index.
 *
 * `items` is async (Tiptap awaits it) and debounced by {@link MENTION_DEBOUNCE_MS},
 * so holding down keys issues one request per pause instead of one per character.
 * With no query or no match the popup hides itself rather than showing an empty box.
 */
export const mentionSuggestion = {
    items: ({ query }: { query: string }): Promise<Array<MentionUser>> =>
        debouncedMentionSearch(query),

    render: () => {
        let popup: HTMLDivElement | null = null
        let selectedIndex = 0
        let currentProps: SuggestionProps<MentionUser> | null = null

        const destroy = () => {
            popup?.remove()
            popup = null
            currentProps = null
        }

        const selectItem = (index: number) => {
            if (!currentProps) return
            const item = currentProps.items[index]
            if (item) {
                currentProps.command({ id: item.username, label: item.displayName })
            }
        }

        const renderList = () => {
            if (!popup || !currentProps) return
            popup.innerHTML = ""
            // No match (or nothing typed yet) → hide instead of flashing an empty card.
            popup.style.display = currentProps.items.length ? "" : "none"
            const list = document.createElement("div")
            list.className = "flex flex-col gap-0.5"
            currentProps.items.forEach((item, index) => {
                const button = document.createElement("button")
                button.type = "button"
                button.className = `flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                    index === selectedIndex
                        ? "bg-accent/10 text-accent"
                        : "text-foreground hover:bg-default"
                }`

                const avatar = document.createElement("span")
                avatar.className = "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-default text-xs font-semibold"
                if (item.avatarUrl) {
                    const image = document.createElement("img")
                    image.src = item.avatarUrl
                    image.alt = ""
                    image.loading = "lazy"
                    image.className = "size-full object-cover"
                    avatar.appendChild(image)
                } else {
                    avatar.textContent = item.displayName.trim().charAt(0).toLocaleUpperCase() || "?"
                }

                const copy = document.createElement("span")
                copy.className = "flex min-w-0 flex-1 flex-col"
                const name = document.createElement("span")
                name.className = "truncate font-medium"
                name.textContent = item.displayName
                const meta = document.createElement("span")
                meta.className = "truncate text-xs text-muted"
                const isVi = document.documentElement.lang.toLocaleLowerCase().startsWith("vi")
                const source = item.source === "following"
                    ? (isVi ? "Đang theo dõi" : "Following")
                    : item.source === "interaction"
                        ? (isVi ? "Hay tương tác" : "Frequently interacted")
                        : ""
                meta.textContent = `@${item.username}${source ? ` · ${source}` : ""}`
                copy.append(name, meta)
                button.append(avatar, copy)
                button.addEventListener("click", () => selectItem(index))
                list.appendChild(button)
            })
            popup.appendChild(list)
        }

        return {
            onStart: (props: SuggestionProps<MentionUser>) => {
                currentProps = props
                selectedIndex = 0

                popup = document.createElement("div")
                popup.className =
                    "z-50 min-w-[12rem] overflow-hidden rounded-xl border border-default bg-surface p-1 shadow-lg"
                popup.setAttribute("role", "listbox")
                popup.setAttribute("aria-label", "Mention suggestions")

                renderList()
                document.body.appendChild(popup)

                const rect = props.clientRect?.()
                if (rect) {
                    popup.style.position = "fixed"
                    popup.style.left = `${rect.left}px`
                    popup.style.top = `${rect.bottom + 4}px`
                }
            },
            onUpdate: (props: SuggestionProps<MentionUser>) => {
                currentProps = props
                selectedIndex = Math.max(0, Math.min(selectedIndex, props.items.length - 1))
                renderList()
                const rect = props.clientRect?.()
                if (popup && rect) {
                    popup.style.left = `${rect.left}px`
                    popup.style.top = `${rect.bottom + 4}px`
                }
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
                if (!currentProps || currentProps.items.length === 0) {
                    // Nothing to navigate: let Escape close, everything else pass through.
                    if (props.event.key === "Escape") {
                        destroy()
                        return true
                    }
                    return false
                }
                if (props.event.key === "ArrowUp") {
                    selectedIndex = (selectedIndex + currentProps.items.length - 1) % currentProps.items.length
                    renderList()
                    return true
                }
                if (props.event.key === "ArrowDown") {
                    selectedIndex = (selectedIndex + 1) % currentProps.items.length
                    renderList()
                    return true
                }
                if (props.event.key === "Enter") {
                    selectItem(selectedIndex)
                    return true
                }
                if (props.event.key === "Escape") {
                    destroy()
                    return true
                }
                return false
            },
            onExit: destroy,
        }
    },
}

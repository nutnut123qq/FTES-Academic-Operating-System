"use client"

import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"
import { search } from "@/modules/api/rest/search"
import type { SearchDocType, SearchHitView } from "@/modules/api/rest/search"

/** One mentionable user rendered in the `@` typeahead. */
export interface MentionUser {
    /** Public username used in profile URL. */
    username: string
    /** Display name rendered in the editor and serialized markdown. */
    displayName: string
}

/** Quiet period before a keystroke turns into a request. */
export const MENTION_DEBOUNCE_MS = 250

/** Max suggestions rendered in the popup. */
export const MENTION_LIMIT = 5

/** Only `USER` documents are mentionable. */
const MENTION_SEARCH_TYPES: Array<SearchDocType> = ["user"]

/**
 * Adapts a search hit into a mention entry. The backend indexes a user document as
 * `slug = username`, `title = displayName ?? username` (see `UserSearchFeed`), so a
 * hit without a slug is not mentionable and is dropped by {@link searchMentionUsers}.
 *
 * @param hit - one `USER` hit from `GET /api/v1/search`.
 */
const toMentionUser = (hit: SearchHitView): MentionUser => ({
    username: hit.slug ?? "",
    displayName: hit.title || hit.slug || "",
})

/**
 * Looks up mentionable users by keyword. Uses the REST search endpoint
 * (`GET /api/v1/search?types=user`) rather than the GraphQL `search(q, types: [USER])`
 * operation: they hit the SAME index and return the same hits, but the GraphQL
 * gateway 401s guests/expired sessions while the REST route degrades to
 * PUBLIC-visibility results (same reasoning as the global search overlay).
 *
 * Never rejects: a failed or forbidden lookup yields an empty list so a typing
 * user is never interrupted by an editor-level error.
 *
 * @param query - the raw text typed after `@`.
 * @returns at most {@link MENTION_LIMIT} mentionable users.
 */
export const searchMentionUsers = async (query: string): Promise<Array<MentionUser>> => {
    const q = query.trim()
    if (!q) {
        return []
    }
    try {
        const response = await search({
            q,
            types: MENTION_SEARCH_TYPES,
            page: 0,
            size: MENTION_LIMIT,
        })
        const hits =
            response.groups?.find((group) => group.type === "USER")?.hits ?? []
        return hits
            .map(toMentionUser)
            .filter((user) => Boolean(user.username))
            .slice(0, MENTION_LIMIT)
    } catch {
        return []
    }
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
                button.className = `w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    index === selectedIndex
                        ? "bg-accent/10 text-accent"
                        : "text-foreground hover:bg-default"
                }`
                button.textContent = `${item.displayName} (@${item.username})`
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

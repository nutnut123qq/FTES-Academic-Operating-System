"use client"

import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"

/** Mock user for mention suggestion. Replace with API call when user search is ready. */
export interface MentionUser {
    /** Public username used in profile URL. */
    username: string
    /** Display name rendered in the editor and serialized markdown. */
    displayName: string
}

/** Static mock user list for @ mention suggestions. */
export const MOCK_MENTION_USERS: Array<MentionUser> = [
    { username: "minh-tran", displayName: "Minh Trần" },
    { username: "an-nguyen", displayName: "An Nguyễn" },
    { username: "hoa-le", displayName: "Hoa Lê" },
    { username: "binh-pham", displayName: "Bình Phạm" },
    { username: "starci-bot", displayName: "StarCI Bot" },
]

/**
 * Tiptap mention suggestion utility backed by a mock user list.
 *
 * TODO: swap `MOCK_MENTION_USERS` for a debounced API call once the user search
 * endpoint is available. Keep the same `MentionUser` interface so the swap is
 * a drop-in replacement.
 */
export const mentionSuggestion = {
    items: ({ query }: { query: string }): Array<MentionUser> => {
        const normalized = query.toLowerCase()
        return MOCK_MENTION_USERS.filter(
            (user) =>
                user.displayName.toLowerCase().includes(normalized) ||
                user.username.toLowerCase().includes(normalized),
        ).slice(0, 5)
    },

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
                selectedIndex = Math.min(selectedIndex, props.items.length - 1)
                renderList()
                const rect = props.clientRect?.()
                if (popup && rect) {
                    popup.style.left = `${rect.left}px`
                    popup.style.top = `${rect.bottom + 4}px`
                }
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
                if (!currentProps) return false
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

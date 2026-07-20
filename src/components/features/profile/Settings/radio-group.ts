import type { KeyboardEvent } from "react"

/**
 * Shared roving-focus keyboard handler for the modal's hand-rolled radiogroups
 * (mode segmented control, accent swatch grid, effect direction). Attached to the
 * `role="radiogroup"` container: arrow keys move focus to the previous/next
 * enabled `role="radio"` child and select it (radios select on focus), wrapping
 * at both ends.
 * @param event - the keydown event bubbling from a radio child.
 */
export const handleRadioGroupKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const { key } = event
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(key)) return
    event.preventDefault()
    const radios = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>(
            "[role=\"radio\"]:not([aria-disabled=\"true\"])",
        ),
    )
    if (radios.length === 0) return
    const activeIndex = radios.indexOf(document.activeElement as HTMLElement)
    const step = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1
    const next = radios[(activeIndex + step + radios.length) % radios.length]
    next.focus()
    next.click()
}

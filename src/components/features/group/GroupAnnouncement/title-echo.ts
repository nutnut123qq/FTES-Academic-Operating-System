/**
 * Whether an announcement's stored `title` is just an ECHO of the first line of its
 * `body` — in which case a card that draws both prints the same sentence twice.
 *
 * How the duplicate gets in: a group announcement is composed in ONE editor (no separate
 * title field), and the BE `AnnouncementRequest` marks BOTH `title` and `content`
 * `@NotBlank`. So when the author marks no `# ` heading, the composer promotes the first
 * line to `title` while leaving it in `content` (`splitTitleFromMarkdown`'s
 * `fallbackTitle`) — the alternative being a 400. One-line announcements are the common
 * case, so "test 23 / test 23" is what the reader gets.
 *
 * This is a READ-side repair: it makes the card print the sentence once without changing
 * what the BE stores. The real fix is BE-side (let `title` be blank for a titleless
 * announcement); until then every surface that renders title-over-body needs this.
 *
 * Comparison is on the visible text: leading block markers (`#`, `>`, `- `) and inline
 * marks (`**`, `_`, `` ` ``) are stripped from the body line, because the promoted title
 * was stripped the same way. Case and surrounding space are ignored.
 *
 * @param title - the stored announcement title.
 * @param body - the stored announcement body (Markdown).
 * @returns `true` when the title adds nothing the body's first line does not already say.
 */
export const titleEchoesBody = (title: string, body: string): boolean => {
    const heading = (title ?? "").trim()
    if (heading === "") {
        return true
    }
    const firstLine = (body ?? "")
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line !== "")
    if (firstLine === undefined) {
        return false
    }
    const plain = (text: string): string =>
        text
            .replace(/^\s{0,3}(#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+[.)][ \t]+)/, "")
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/(\*\*|__|~~|\*|_|`)/g, "")
            .trim()
            .toLocaleLowerCase()

    return plain(heading) === plain(firstLine)
}

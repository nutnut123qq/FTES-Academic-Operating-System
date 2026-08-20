/**
 * Fenced (```…```) and inline (`…`) code — links inside code are quotes, not links.
 *
 * Nhóm bắt giữ lại chính đoạn code để `String.split` trả về xen kẽ
 * `[văn xuôi, code, văn xuôi, …]` ({@link splitBodyImages}); với `.replace` thì nhóm này
 * không đổi hành vi gì.
 */
const CODE_BLOCK_PATTERN = /(```[\s\S]*?```|`[^`\n]*`)/g

/**
 * Chữ bên trong một đoạn code: bỏ dấu rào (và nhãn ngôn ngữ ở dòng đầu của fence), giữ
 * nguyên phần còn lại. Blank hẳn đoạn code đi thì bài dạy nhau cú pháp — thứ cộng đồng
 * học tập đăng suốt ngày — sẽ có hàng feed trống trơn.
 */
const codeText = (block: string): string => {
    if (!block.startsWith("```")) {
        return block.slice(1, -1)
    }
    const inner = block.slice(3, -3)
    const infoLine = inner.indexOf("\n")
    return infoLine === -1 ? inner : inner.slice(infoLine + 1)
}

/**
 * Dấu MỞ ĐẦU DÒNG của khối markdown: tiêu đề `#…`, trích dẫn `>`, gạch đầu dòng `-`/`*`/`+`,
 * danh sách đánh số `1.`/`1)`. Dấu `+` ở cuối cho phép lồng nhau (`> - mục`). Mọi dạng đều
 * đòi khoảng trắng ngay sau dấu, nên "-5 độ" hay "3.14 mét" không bị coi là danh sách.
 */
const BLOCK_MARKER_PATTERN = /^[ \t]*(?:#{1,6}[ \t]+|>[ \t]*|[-*+][ \t]+|\d+[.)][ \t]+)+/gm

/**
 * Cặp dấu nhấn: `**đậm**`, `__đậm__`, `*nghiêng*`, `~~gạch ngang~~` — giữ chữ, bỏ dấu.
 * Ký tự ngay sau dấu mở và ngay trước dấu đóng phải KHÁC khoảng trắng (luật left/right
 * flanking của CommonMark), nhờ vậy "2 * 3 * 4" hay "a ~ b" trong văn xuôi còn nguyên.
 *
 * ponytail: `_` ĐƠN cố ý không nằm trong danh sách — thanh công cụ serialize nghiêng ra
 * `*…*`, còn `_` trong văn xuôi kỹ thuật gần như luôn là snake_case.
 */
const EMPHASIS_PATTERN = /(\*\*|__|~~|\*)(?!\s)(.*?\S)\1/g

/** `<u>…</u>` — tiptap không có cú pháp markdown cho gạch chân nên serialize ra HTML thô. */
const UNDERLINE_TAG_PATTERN = /<\/?u>/g

/** A bare http(s) url; stops before the characters that usually close/punctuate it. */
const URL_PATTERN = /https?:\/\/[^\s<>()[\]"'`]+/

/** Trailing punctuation people type after a url ("… xem tại https://x.vn.") is not part of it. */
const TRAILING_PUNCTUATION = /[.,;:!?»”)\]]+$/

/**
 * Unwraps CommonMark autolinks written as `<https://…>` into the bare url, so the
 * rendered post reads `https://…` instead of carrying the authored angle brackets
 * into the visible link text.
 *
 * (Both forms already become a real `<a>` through the shared markdown renderer —
 * `<…>` is a CommonMark autolink, a bare url is a `remark-gfm` autolink-literal —
 * so this is about the TEXT, not about making the link clickable. Any surface that
 * prints the body as plain text needs it too.)
 *
 * Markdown links (`[text](url)`) and code blocks are left untouched.
 *
 * @param markdown - raw post body.
 */
export const unwrapAutolinks = (markdown: string): string =>
    markdown.replace(/<(https?:\/\/[^\s<>]+)>/g, "$1")

/** An embedded image `![alt](url "title")`; the url stops at the first space or `)`. */
const IMAGE_PATTERN = /!\[[^\]]*\]\(\s*([^)\s]+)[^)]*\)/g

/**
 * A marker CUT IN HALF at the end of the string. The backend derives the feed snippet by
 * slicing the body at exactly 200 characters (`FeedController.snippetOf`), so the tail is
 * routinely `![Ảnh](https://document.ftes.vn/…` — an opening marker with no closing `)`,
 * which no image/link rule can match. Only the two unambiguous shapes are stripped: an
 * image/link whose `](` is already open, and a truncated IMAGE bracket. A lone `[…` is
 * left alone — plain prose uses brackets too.
 */
const TRUNCATED_MARKER = /(?:!?\[[^\]]*\]\([^)]*|!\[[^\]]*)$/

/** A markdown link `[text](url)` — kept as its visible `text`. */
const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\([^)]*\)/g

/**
 * Splits the images embedded in a body/snippet away from its prose.
 *
 * An image inserted with the editor toolbar lives INSIDE THE BODY as `![alt](url)`
 * (`RichTextEditor` → `setImage`), it never becomes a `Post.media` attachment. Every feed
 * surface prints the snippet as PLAIN TEXT, so that syntax showed up verbatim on the row
 * (`![Ảnh](https://document.ftes.vn/….webp)`) while `PostMediaGrid` — fed only by
 * `Post.media` — rendered nothing at all. The detail page never had the bug because it goes
 * through the markdown renderer.
 *
 * So: hand the prose back clean, and hand the urls back so the media grid can draw the
 * thumbnails the row was missing. Markdown links collapse to their visible text for the
 * same reason (a plain-text surface cannot show a link, only its syntax).
 *
 * Ảnh chỉ là MỘT nút trên thanh công cụ của composer, nên mọi dấu markdown mà các nút
 * BÊN CẠNH sinh ra cũng phải rụng ở đây, không thì bấm nút "B" là hàng feed lại in
 * `**Quan trọng**`: tiêu đề `#…`, trích dẫn `>`, gạch đầu dòng, danh sách đánh số, đậm,
 * nghiêng, gạch ngang, và `<u>` (tiptap không có cú pháp markdown cho gạch chân nên nó
 * serialize ra HTML thô). Đây là chỗ DUY NHẤT làm việc đó — dòng feed cố ý KHÔNG đi qua
 * `MarkdownContent` (kéo cả react-markdown + remark/rehype vào mỗi hàng).
 *
 * Đoạn code (```` ``` ````/`` ` ``) được coi là TRÍCH DẪN, không phải cú pháp: chữ bên trong
 * giữ nguyên và ảnh trong đó KHÔNG bị lôi ra làm thumbnail — đúng cách {@link firstLinkUrl}
 * đối xử với link trong code. Bài dạy nhau cú pháp markdown là chuyện thường ngày ở đây.
 *
 * ponytail: dấu đầu dòng được nhận theo từng ĐOẠN văn xuôi, nên một `- ` đứng ngay sau
 * đoạn inline code giữa dòng cũng bị coi là gạch đầu dòng. Đổi lại là một hàm không trạng
 * thái; hàng feed in một dòng gộp nên sai lệch đó không nhìn thấy được.
 *
 * Duplicate urls are collapsed — the grid keys its tiles by url on this path. Only http(s)
 * targets are handed back: these urls end up as an `<img src>` built from text the author
 * typed, and anything else (`data:`, `javascript:`, a relative path) could never be a real
 * uploaded attachment anyway. The syntax still leaves the prose either way.
 *
 * @param markdown - snippet or raw post body (run {@link unwrapAutolinks} on it first).
 * @returns `text` for the plain-text row, `images` for the media grid (author order).
 */
export const splitBodyImages = (markdown: string): { text: string; images: Array<string> } => {
    const images: Array<string> = []
    const toProse = (prose: string): string =>
        prose
            .replace(IMAGE_PATTERN, (_match, url: string) => {
                if (/^https?:\/\//i.test(url) && !images.includes(url)) {
                    images.push(url)
                }
                return ""
            })
            .replace(TRUNCATED_MARKER, "")
            .replace(MARKDOWN_LINK_PATTERN, "$1")
            .replace(BLOCK_MARKER_PATTERN, "")
            .replace(EMPHASIS_PATTERN, "$2")
            .replace(UNDERLINE_TAG_PATTERN, "")
    const text = markdown
        // Chỉ VĂN XUÔI bị gỡ cú pháp; đoạn code giữ nguyên chữ (xem {@link codeText}).
        // `String.split` với regex có nhóm bắt trả về xen kẽ: chỉ số lẻ là code.
        .split(CODE_BLOCK_PATTERN)
        .map((segment, index) => (index % 2 === 1 ? codeText(segment) : toProse(segment)))
        .join("")
        // ponytail: hàng feed in một dòng text thuần, nên mọi khoảng trắng (kể cả xuống
        // dòng còn lại sau khi gỡ ảnh) gộp về một dấu cách là đủ — không cần giữ layout.
        .replace(/\s+/g, " ")
        .trim()
    return { text, images }
}

/**
 * First link in a post body — the one the preview card unfurls (one card per post,
 * like F8/Facebook). Looks at prose only: code fences and inline code are blanked
 * out first, and markdown-link targets `](url)` count as prose links.
 *
 * @param markdown - raw post body.
 * @returns the url, or null when the post has no link.
 */
export const firstLinkUrl = (markdown: string): string | null => {
    const prose = markdown.replace(CODE_BLOCK_PATTERN, " ")
    const match = URL_PATTERN.exec(prose)
    if (!match) {
        return null
    }
    const url = match[0].replace(TRAILING_PUNCTUATION, "")
    return url.length > "https://".length ? url : null
}
